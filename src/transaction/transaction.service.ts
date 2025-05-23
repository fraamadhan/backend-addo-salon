import { HttpException, HttpStatus, Injectable } from '@nestjs/common';
import {
  CalculateBillDto,
  ChargeDto,
  CollectBillDto,
  PaymentPaginationParams,
} from './dto/transaction-dto';
import { InjectConnection, InjectModel } from '@nestjs/mongoose';
import { Product, ProductDocument } from 'src/schemas/product.schema';
import mongoose, { Model, PaginateModel, Types } from 'mongoose';
import {
  Transaction,
  TransactionDocument,
} from 'src/schemas/transaction.schema';
import {
  ProductAssets,
  ProductAssetsDocument,
} from 'src/schemas/product-assets.schema';
import { Employee, EmployeeDocument } from 'src/schemas/employee.schema';
import { ConfigService } from '@nestjs/config';
import { ReservationStatus } from 'src/types/enum';
import {
  generateOrderCode,
  toObjectId,
  verifySignatureKey,
} from 'src/utils/general';
import {
  TransactionItems,
  TransactionItemsDocument,
} from 'src/schemas/transaction-items.schema';
import Logger from 'src/logger';
import { MidtransService } from './midtrans/midtrans.service';
import { MidtransChargeResponseType } from './midtrans/dto/response';
import { Cart, CartDocument } from 'src/schemas/cart.schema';
import { Query } from 'src/types/general';
import { SortType } from 'src/types/sorttype';
import { sanitizeKeyword } from 'src/utils/sanitize-keyword';

@Injectable()
export class TransactionService {
  constructor(
    @InjectModel(Transaction.name)
    private readonly transactionModel: PaginateModel<TransactionDocument>,
    @InjectModel(TransactionItems.name)
    private readonly transactionItemModel: Model<TransactionItemsDocument>,
    @InjectModel(Product.name)
    private readonly productModel: Model<ProductDocument>,
    @InjectModel(ProductAssets.name)
    private readonly productAssetModel: Model<ProductAssetsDocument>,
    @InjectModel(Cart.name)
    private readonly cartModel: Model<CartDocument>,
    @InjectModel(Employee.name)
    private readonly employeeModel: Model<EmployeeDocument>,
    @InjectConnection() private readonly connection: mongoose.Connection,
    private readonly config: ConfigService,
    private readonly midtransService: MidtransService,
  ) {}

  private readonly logger = new Logger();

  async pay(body: ChargeDto, user_id: string) {
    const userObjectId = toObjectId(user_id);

    if (!userObjectId) {
      throw new HttpException(
        'Failed to convert user id to object id',
        HttpStatus.BAD_REQUEST,
      );
    }

    const reservationDates = body.items.map((item) => item.reservationDate);
    const products = body.items.map((item) => toObjectId(item.productId));

    const session = await this.connection.startSession();
    session.startTransaction();

    try {
      await Promise.all(
        body.items.map(async (item) => {
          await this.checkIsNearToCloseTimeOrConflict(
            item.productId,
            userObjectId,
            item.reservationDate,
            'Maaf pesanananmu bentrok. Silakan pilih jadwal lain',
          );
        }),
      );

      const result = await this.transactionModel
        .findOne({
          _id: body.transactionId,
        })
        .populate('userId', '-password')
        .session(session)
        .lean()
        .exec();

      if (!result) {
        throw new HttpException(
          'Transaksi tidak ditemukan',
          HttpStatus.NOT_FOUND,
        );
      }

      const { userId: user, ...transaction } = result;

      const transactionItems = await this.transactionItemModel
        .find({
          transactionId: transaction._id,
        })
        .populate('productId')
        .session(session)
        .lean()
        .exec();

      const mappedTransactionItems = transactionItems.map((item) => {
        const { productId: product, ...rest } = item;

        return {
          ...rest,
          product,
        };
      });

      const { chargeBody, orderCode } = this.midtransChargeBodyFormat(
        body,
        user,
        transaction,
        mappedTransactionItems,
      );

      const response: MidtransChargeResponseType =
        await this.midtransService.charge(chargeBody);

      if (response.status_code === '201') {
        await this.transactionModel.findOneAndUpdate(
          {
            _id: transaction._id,
          },
          {
            $set: {
              status: ReservationStatus.UNPAID,
              bank: body.bank,
              orderCode: orderCode,
              paymentMethod: body.paymentMethod,
              total_price: Number(response.gross_amount),
            },
          },
          {
            new: true,
            session: session,
          },
        );

        await this.transactionItemModel.updateMany(
          {
            transactionId: toObjectId(transaction._id),
          },
          {
            serviceStatus: ReservationStatus.UNPAID,
          },
          {
            session: session,
          },
        );

        await this.cartModel.deleteMany(
          {
            isCheckoutLocked: true,
            productId: { $in: products },
            reservationDate: { $in: reservationDates },
            userId: userObjectId,
          },
          { session: session },
        );

        await session.commitTransaction();
      }

      return response;
    } catch (error) {
      this.logger.errorString(`[TransactionService - pay] ${error as string}`);
      await session.abortTransaction();
      throw new HttpException(
        `Pembayaran gagal diproses: ${error as string}`,
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    } finally {
      await session.endSession();
    }
  }

  async handleAfterPayment(body: Record<string, any>) {
    const transactionStatus = body.transaction_status as string;
    const orderId = body.order_id as string;
    const fraudStatus = body.fraud_status as string;
    const statusCode = body.status_code as string;
    const grossAmount = body.gross_amount as string;
    const serverKey = this.config.get<string>('MIDTRANS_SERVER_KEY') as string;
    const signatureKeyMidtrans = body.signature_key as string;

    const isVerified = verifySignatureKey(
      signatureKeyMidtrans,
      grossAmount,
      orderId,
      statusCode,
      serverKey,
    );

    if (isVerified) {
      if (
        transactionStatus === 'settlement' ||
        transactionStatus === 'capture'
      ) {
        if (fraudStatus === 'accept') {
          await this.updateAfterHandlePayment(
            body,
            ReservationStatus.SCHEDULED,
            ReservationStatus.SCHEDULED,
          );
        }
      } else if (
        transactionStatus === 'cancel' ||
        transactionStatus === 'deny' ||
        transactionStatus === 'expire'
      ) {
        await this.updateAfterHandlePayment(
          body,
          ReservationStatus.CANCELED,
          ReservationStatus.CANCELED,
        );
      } else if (transactionStatus === 'pending') {
        await this.updateAfterHandlePayment(
          body,
          ReservationStatus.UNPAID,
          ReservationStatus.PENDING,
        );
      }

      return true;
    }
    return null;
  }

  async updateAfterHandlePayment(
    body: Record<string, any>,
    transactionStatus: ReservationStatus,
    itemStatus: ReservationStatus,
  ) {
    const transactionId = body.order_id as string;

    const session = await this.connection.startSession();
    session.startTransaction();
    try {
      await this.transactionModel
        .findOneAndUpdate(
          { _id: toObjectId(transactionId) },
          { status: transactionStatus },
          { new: true, session: session },
        )
        .exec();

      await this.transactionItemModel
        .updateMany(
          { transactionId: toObjectId(transactionId) },
          { serviceStatus: itemStatus },
          { session: session },
        )
        .exec();

      await session.commitTransaction();
    } catch (error: any) {
      this.logger.errorString(
        `[TransactionService - updateAfterHandlePayment] ${error as string}`,
      );
      await session.abortTransaction();
      throw error;
    } finally {
      await session.endSession();
    }
  }

  async getTransactionStatuMidtrans(orderId: string) {
    try {
      const data = await this.midtransService.getStatus(orderId);

      return data;
    } catch (error: any) {
      this.logger.errorString(
        `[TransactionService - Get Transaction Status Midtrans] ${error as string}`,
      );
      throw error;
    }
  }

  midtransChargeBodyFormat(
    body: ChargeDto,
    user: Record<string, any>,
    transaction: Record<string, any>,
    transactionItems: Record<string, any>[],
  ) {
    const totalPrice = (transaction.total_price + body.transactionFee) | 0;

    const userName = typeof user.name === 'string' ? user.name.split(' ') : [];
    const customer_details = {
      first_name: userName[0],
      last_name: userName[1],
      email: user.email as string,
      phone: user.phone_number as string,
    };
    const transaction_details = {
      order_id: transaction._id as string,
      gross_amount: totalPrice,
    };
    const item_details = transactionItems.map((item) => {
      const product = item.product as ProductDocument;
      return {
        id: product._id.toString(),
        price: product.price,
        quantity: 1,
        name: product.name,
      };
    });
    item_details.push({
      id: 'transaction_fee',
      price: body.transactionFee,
      quantity: 1,
      name: 'Biaya Transaksi',
    });
    const chargeBody = {
      payment_type: body.paymentMethod,
      transaction_details,
      customer_details,
      item_details,
    };

    switch (body.paymentMethod as string) {
      case 'gopay':
        chargeBody['gopay'] = {
          enable_callback: true,
          callback_url: this.config.get<string>('MIDTRANS_GOPAY_CALLBACK_URL'),
        };
        break;
      case 'qris':
        chargeBody['qris'] = {
          acquirer: 'gopay',
        };
        break;
      case 'bank_transfer':
        switch (body.bank as string) {
          case 'bca':
            chargeBody['bank_transfer'] = {
              bank: body.bank,
            };
            break;
          case 'permata':
            chargeBody['bank_transfer'] = {
              bank: body.bank,
              permata: {
                recipient_name: 'Addo Salon',
              },
            };
            break;
          case 'bni':
            chargeBody['bank_transfer'] = {
              bank: body.bank,
            };
            break;
          case 'bri':
            chargeBody['bank_transfer'] = {
              bank: body.bank,
            };
            break;
        }
        break;
    }
    const orderCode = generateOrderCode(user.name as string);
    return { chargeBody, orderCode };
  }

  async findTransaction(
    params: PaymentPaginationParams,
    type: 'payment' | 'order',
  ) {
    const page = params.page ?? 1;
    const limit = params.limit ?? 15;
    const keyword = params.keyword;
    let keywordSanitized = '';
    const query: Query = {
      $and: [],
    };

    const sorttype = params.sorttype === SortType.asc ? 1 : -1;
    const sortby = params.sortby ?? 'createdAt';

    const sort: Record<string, number> = {
      [sortby]: sorttype,
    };

    if (type === 'payment') {
      query.$and.push({
        status: {
          $in: [
            ReservationStatus.PAID,
            ReservationStatus.UNPAID,
            ReservationStatus.CANCELED,
          ],
        },
      });
    } else {
      query.$and.push({
        status: {
          $nin: [
            ReservationStatus.CART,
            ReservationStatus.PENDING,
            ReservationStatus.UNPAID,
          ],
        },
      });
    }

    if (keyword) {
      const result = sanitizeKeyword(keyword);

      keywordSanitized = result.keywordSanitized;
    }

    if (keywordSanitized.length !== 0) {
      query.$and.push({
        orderCode: {
          $regex: new RegExp(`${keywordSanitized}`, 'i'),
        },
      });
    }

    if (params.paymentStatus) {
      query.$and[0] = {
        status: params.paymentStatus,
      };
    }

    const result = await this.transactionModel.paginate(query, {
      page,
      limit,
      sort,
      lean: true,
      collation: {
        locale: 'en',
        strength: 1,
      },
    });

    const transactionIds = result.docs.map((doc) => doc._id);
    const items = await this.transactionItemModel
      .find({ transactionId: { $in: transactionIds } })
      .populate('productId')
      .lean();

    const groupedItems = items.reduce(
      (acc, item) => {
        const tid = item.transactionId.toString();
        if (!acc[tid]) acc[tid] = [];
        acc[tid].push({
          ...item,
          product: item.productId,
        });
        return acc;
      },
      {} as Record<string, any[]>,
    );

    const mappedTransactions = result.docs.map((doc) => ({
      ...doc,
      items: groupedItems[doc._id.toString()] ?? [],
    }));

    const totalItem = result.totalDocs;
    const pageCount = result.totalPages;
    const hasPrevPage = result.hasPrevPage;
    const hasNextPage = result.hasNextPage;
    const prevPage = result.prevPage;
    const nextPage = result.nextPage;

    const paginator = {
      totalItem,
      limit,
      pageCount,
      page,
      hasPrevPage,
      hasNextPage,
      prevPage,
      nextPage,
    };

    return {
      [type === 'payment' ? 'payments' : 'orders']: mappedTransactions,
      paginator,
    };
  }

  async findOne(id: string) {
    const transactionObjectId = toObjectId(id);

    if (!transactionObjectId) {
      throw new HttpException(
        'Transaksi tidak ditemukan',
        HttpStatus.NOT_FOUND,
      );
    }

    const transaction = await this.transactionModel.findById(id).lean().exec();
    const transactionItems = await this.transactionItemModel
      .find({
        transactionId: transactionObjectId,
      })
      .populate('productId')
      .lean()
      .exec();

    const productIds = [
      ...new Set(
        transactionItems.map((item) => item.productId._id).filter(Boolean),
      ),
    ];

    const assets = await this.productAssetModel
      .find(
        {
          productId: { $in: productIds },
        },
        { productId: 1, publicUrl: 1 },
      )
      .lean()
      .exec();

    const assetsMap: Map<string, string> = new Map(
      assets.map((value) => [value.productId.toString(), value.publicUrl]),
    );

    const mappedTransactionItems = transactionItems.map((item) => {
      const { productId: product, ...rest } = item;

      return {
        ...rest,
        product: {
          ...product,
          assetRef: assetsMap.get(product._id.toString()),
        },
      };
    });

    return {
      ...transaction,
      items: mappedTransactionItems,
    };
  }

  async collectBill(body: CollectBillDto, userId: string) {
    if (!userId) {
      throw new HttpException('Missing user id', HttpStatus.BAD_REQUEST);
    }
    const items = body.items;
    const userObjectId = toObjectId(userId);

    if (!userObjectId) {
      throw new HttpException(
        'Failed to convert user id to object id',
        HttpStatus.BAD_REQUEST,
      );
    }

    const transactionSession = await this.connection.startSession();
    transactionSession.startTransaction();

    try {
      const totalPrice = body.items.reduce(
        (accum, item) => accum + item.price,
        0,
      );
      await Promise.all(
        body.items.map(async (item) => {
          await this.checkIsNearToCloseTimeOrConflict(
            item.productId,
            userObjectId || '',
            item.reservationDate,
            'Maaf pesanananmu bentrok. Silakan pilih jadwal lain',
          );
        }),
      );
      // save to transaction table
      const transaction = await this.transactionModel
        .create(
          [
            {
              status: ReservationStatus.CART,
              total_price: totalPrice,
              userId: userObjectId,
            },
          ],
          { session: transactionSession },
        )
        .then((res) => res[0]);

      const data: { transaction: TransactionDocument; items: any[] } = {
        transaction: transaction,
        items: [],
      };

      if (Array.isArray(items) && items.length > 0) {
        const transactionItems = await this.transactionItemModel.insertMany(
          items.map((item) => ({
            transactionId: transaction._id,
            reservationDate: item.reservationDate,
            productId: toObjectId(item.productId),
            note: item.note,
            serviceStatus: ReservationStatus.CART,
            price: item.price,
          })),
          { session: transactionSession },
        );

        data.items.push(...transactionItems);
      }

      await transactionSession.commitTransaction();

      return data;
    } catch (error: any) {
      this.logger.errorString(
        `[TransactionService - collect bill] ${error as string}`,
      );
      await transactionSession.abortTransaction();
      throw error;
    } finally {
      await transactionSession.endSession();
    }
  }

  async calculateBill(body: CalculateBillDto, userId: string) {
    const transactionObjectId = toObjectId(body.transactionId);
    const userObjectId = toObjectId(userId);

    const transaction = await this.transactionModel
      .findOne({
        _id: transactionObjectId,
        userId: userObjectId,
      })
      .lean()
      .exec();

    if (!transaction) {
      throw new HttpException(
        'Transaksi tidak ditemukan',
        HttpStatus.NOT_FOUND,
      );
    }

    const transactionItems = await this.transactionItemModel
      .find({
        transactionId: transactionObjectId,
      })
      .lean()
      .exec();

    const data = {
      ...transaction,
      items: transactionItems,
      transactionFee: 0,
      grandTotalPrice: 0,
    };

    switch (body.paymentMethod) {
      case 'bank_transfer':
        data.transactionFee = 4000;
        break;
      case 'gopay':
        data.transactionFee = Math.round(0.02 * transaction.total_price);
        break;
      case 'qris':
        data.transactionFee = Math.round(0.007 * transaction.total_price);
        break;
    }
    data.grandTotalPrice += transaction.total_price + data.transactionFee;

    return data;
  }

  async checkIsNearToCloseTimeOrConflict(
    productId: Types.ObjectId,
    userId: Types.ObjectId,
    reservationDate: Date,
    message: string = '',
  ) {
    const product = await this.productModel
      .findOne({
        _id: productId,
      })
      .select('estimation')
      .lean()
      .exec();

    if (product && typeof product.estimation === 'number') {
      const allowedOverlap = Number(process.env.ONE_HOUR);
      const durationMs = product.estimation * Number(process.env.ONE_HOUR); //customer can overlap one hour before the previous order done

      const startTime = new Date(reservationDate);
      const endTime = new Date(startTime.getTime() + durationMs);

      const closingTime = new Date(startTime);
      const openingTime = new Date(startTime);
      closingTime.setUTCHours(11, 0, 0, 0);
      openingTime.setUTCHours(0, 0, 0, 0);

      if (startTime.getDay() === 1) {
        throw new HttpException(
          'Hari senin salon libur. Silakan pilih jadwal lain!',
          HttpStatus.UNPROCESSABLE_ENTITY,
        );
      }

      if (endTime > closingTime || startTime < openingTime) {
        throw new HttpException(
          'Jadwal pesanan melebihi jam tutup salon atau salon belum buka. Pilih jadwal lain',
          HttpStatus.UNPROCESSABLE_ENTITY,
        );
      }

      // The data checking must from transaction table with status "paid" and do check when user try to checkout
      // is the reservation conflict
      const conflict = await this.transactionItemModel.aggregate([
        {
          $lookup: {
            from: 'transactions',
            localField: 'transactionId',
            foreignField: '_id',
            as: 'transaction',
          },
        },
        {
          $unwind: '$transaction',
        },
        {
          $match: {
            'transaction.userId': { $ne: userId },
            serviceStatus: ReservationStatus.SCHEDULED,
            'transaction.status': ReservationStatus.PAID,
            $expr: {
              $and: [
                { $lt: ['$reservationDate', endTime] },
                {
                  $gt: [
                    { $add: ['$reservationDate', durationMs] },
                    new Date(startTime.getTime() + allowedOverlap),
                  ],
                },
              ],
            },
          },
        },
        { $limit: 1 },
      ]);

      if (conflict.length !== 0) {
        throw new HttpException(
          `${message.length !== 0 ? message : 'Jadwal pesanan bentrok  dengan pesanan lain. Pilih jadwal lain!'}`,
          HttpStatus.CONFLICT,
        );
      }
    }
  }
}
