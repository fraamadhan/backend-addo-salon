import { HttpException, HttpStatus, Injectable } from '@nestjs/common';
import {
  CmsCreateTransactionDto,
  CmsUpdateTransactionDto,
  TransactionQueryParams,
  UpdateScheduleDto,
} from './dto/cms-transaction.dto';
import { ReservationStatus } from 'src/types/enum';
import { InjectConnection, InjectModel } from '@nestjs/mongoose';
import {
  Transaction,
  TransactionDocument,
} from 'src/schemas/transaction.schema';
import mongoose, {
  PaginateModel,
  Model,
  Types,
  AggregatePaginateModel,
} from 'mongoose';
import { Cart, CartDocument } from 'src/schemas/cart.schema';
import { Employee, EmployeeDocument } from 'src/schemas/employee.schema';
import {
  ProductAssets,
  ProductAssetsDocument,
} from 'src/schemas/product-assets.schema';
import { Product, ProductDocument } from 'src/schemas/product.schema';
import {
  TransactionItems,
  TransactionItemsDocument,
} from 'src/schemas/transaction-items.schema';
import Logger from 'src/logger';
import { toObjectId } from 'src/utils/general';
import { SortType } from 'src/types/sorttype';
import { sanitizeKeyword } from 'src/utils/sanitize-keyword';
import {
  AggregatedResult,
  TransactionItemWithPopulatedRefs,
} from 'src/types/transaction';
import { NameQuery } from 'src/types/general';

@Injectable()
export class CmsTransactionService {
  constructor(
    @InjectModel(Transaction.name)
    private readonly transactionModel: PaginateModel<TransactionDocument>,
    @InjectModel(TransactionItems.name)
    private readonly transactionItemModel: AggregatePaginateModel<TransactionItemsDocument>,
    @InjectModel(Product.name)
    private readonly productModel: Model<ProductDocument>,
    @InjectModel(ProductAssets.name)
    private readonly productAssetModel: Model<ProductAssetsDocument>,
    @InjectModel(Cart.name)
    private readonly cartModel: Model<CartDocument>,
    @InjectModel(Employee.name)
    private readonly employeeModel: Model<EmployeeDocument>,
    @InjectConnection() private readonly connection: mongoose.Connection,
  ) {}

  private readonly logger = new Logger();

  async createTransaction(body: CmsCreateTransactionDto) {
    if (body.paymentMethod.toLowerCase() === 'bank transfer') {
      body.paymentMethod = 'bank_transfer';
    }
    const transaction = await this.transactionModel.create({
      total_price: body.total_price,
      status: body.status,
      paymentMethod: body.paymentMethod,
      bank: body.bank,
      transactionType: body.transactionType,
      customerName: body.customerName,
      serviceName: body.serviceName,
    });

    if (!transaction) {
      throw new HttpException(
        'Failed to create transaction',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }

    const transactionItems = await this.transactionItemModel.create({
      reservationDate: body.reservationDate,
      price: body.servicePrice,
      serviceStatus: body.status,
      transactionId: transaction._id,
    });

    return {
      transaction,
      items: transactionItems,
    };
  }

  async getOrders(params: TransactionQueryParams) {
    const page = params.page ?? 1;
    const limit = params.limit ?? 20;
    const skip = (page - 1) * limit;

    let keywordSanitized = '';

    const sorttype: 1 | -1 = params.sorttype === SortType.asc ? 1 : -1;
    const sortby = params.sortby ?? 'CreatedAt';
    const sort: Record<string, 1 | -1> = {
      [sortby]: sorttype,
    };

    if (params.keyword) {
      const result = sanitizeKeyword(params.keyword);
      keywordSanitized = result.keywordSanitized;
    }

    const matchStage: Record<string, any> = {
      'transaction.status': {
        $nin: [
          ReservationStatus.CART,
          ReservationStatus.PENDING,
          ReservationStatus.COMPLETED,
        ],
      },
    };

    if (params.orderStatus) {
      matchStage['transaction.status'] = params.orderStatus;
    }

    const result: AggregatedResult[] =
      await this.transactionItemModel.aggregate([
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
          $match: matchStage,
        },
        {
          $lookup: {
            from: 'products',
            localField: 'productId',
            foreignField: '_id',
            as: 'product',
          },
        },
        {
          $unwind: '$product',
        },
        {
          $lookup: {
            from: 'users',
            localField: 'transaction.userId',
            foreignField: '_id',
            as: 'user',
          },
        },
        {
          $unwind: '$user',
        },
        {
          $match: params.keyword
            ? {
                $or: [
                  {
                    'user.name': {
                      $regex: new RegExp(`${keywordSanitized}`, 'i'),
                    },
                  },
                  {
                    'transaction.customerName': {
                      $regex: new RegExp(`${keywordSanitized}`, 'i'),
                    },
                  },
                  {
                    'transaction.orderCode': {
                      $regex: new RegExp(`${params.keyword}`, 'i'),
                    },
                  },
                ],
              }
            : {},
        },
        {
          $facet: {
            data: [
              { $sort: sort },
              { $skip: skip },
              { $limit: limit },
              {
                $project: {
                  _id: 1,
                  transactionId: 1,
                  serviceStatus: 1,
                  reservationDate: 1,
                  note: 1,
                  product: {
                    _id: '$product._id',
                    name: '$product.name',
                    price: '$product.price',
                  },
                  user: {
                    _id: '$user._id',
                    name: '$user.name',
                  },
                  transaction: {
                    _id: '$transaction._id',
                    orderCode: '$transaction.orderCode',
                    status: '$transaction.status',
                  },
                },
              },
            ],
            totalCount: [{ $count: 'total' }],
          },
        },
      ]);

    const orders = result[0].data;
    const total = result[0].totalCount[0].total ?? 0;

    const paginator = {
      totalItem: total,
      pageCount: Math.ceil(total / limit),
      page,
      limit,
      hasPrevPage: page > 1,
      hasNextPage: page * limit < total,
      prevPage: page > 1 ? page - 1 : null,
      nextPage: page * limit < total ? page + 1 : null,
    };

    return {
      orders,
      paginator,
    };
  }

  async getTransactions(params: TransactionQueryParams) {
    const page = params.page ?? 1;
    const limit = params.limit ?? 10;
    const keyword = params.keyword;
    const sorttype = params.sorttype === SortType.asc ? 1 : -1;
    const sortby = params.sortby ?? 'CreatedAt';
    const sort: Record<string, any> = {
      [sortby]: sorttype,
    };
    let keywordSanitized = '';
    const matchNameStage: NameQuery = {
      $or: [],
    };

    if (keyword) {
      const result = sanitizeKeyword(keyword);

      keywordSanitized = result.keywordSanitized;
    }

    if (keywordSanitized.length !== 0) {
      matchNameStage.$or.push(
        {
          'user.name': {
            $regex: new RegExp(`${keywordSanitized}`, 'i'),
          },
        },
        {
          'transaction.customerName': {
            $regex: new RegExp(`${keywordSanitized}`, 'i'),
          },
        },
        {
          'product.name': {
            $regex: new RegExp(`${keywordSanitized}`, 'i'),
          },
        },
      );
    }

    const matchStages: Record<string, any> = {
      'transaction.status': {
        $in: [ReservationStatus.COMPLETED, ReservationStatus.CANCELED],
      },
    };

    if (params.orderStatus) {
      matchStages['transaction.status'] = params.orderStatus;
      matchStages['serviceStatus'] = params.orderStatus;
    }

    if (params.startDate) {
      matchStages['transaction.createdAt'] = {
        $gte: params.startDate,
      };
    }
    if (params.endDate) {
      matchStages['transaction.createdAt'] = {
        $lte: params.endDate,
      };
    }

    if (params.productId) {
      matchStages['product._id'] = toObjectId(params.productId);
    }

    const customLabels = {
      totalDocs: 'totalItem',
      docs: 'transactions',
      limit: 'limit',
      page: 'currentPage',
      nextPage: 'next',
      prevPage: 'prev',
      totalPages: 'pageCount',
      hasPrevPage: 'hasPrev',
      hasNextPage: 'hasNext',
      pagingCounter: 'pageCounter',
      meta: 'paginator',
    };

    const options = {
      page,
      limit,
      customLabels,
    };

    const aggregate = this.transactionItemModel.aggregate([
      {
        $lookup: {
          from: 'transactions',
          localField: 'transactionId',
          foreignField: '_id',
          as: 'transaction',
        },
      },
      {
        $unwind: {
          path: '$transaction',
          preserveNullAndEmptyArrays: true,
        },
      },
      {
        $lookup: {
          from: 'users',
          localField: 'transaction.userId',
          foreignField: '_id',
          as: 'user',
        },
      },
      {
        $unwind: {
          path: '$user',
          preserveNullAndEmptyArrays: true,
        },
      },
      {
        $lookup: {
          from: 'products',
          localField: 'productId',
          foreignField: '_id',
          as: 'product',
        },
      },
      {
        $unwind: {
          path: '$product',
          preserveNullAndEmptyArrays: true,
        },
      },
      {
        $match: {
          ...matchStages,
          ...(keywordSanitized.length !== 0 ? { $or: matchNameStage.$or } : {}),
        },
      },
      {
        $sort: sort,
      },
      {
        $project: {
          _id: 1,
          transactionId: 1,
          serviceStatus: 1,
          reservationDate: 1,
          note: 1,
          product: {
            _id: {
              $ifNull: ['$product._id', null],
            },
            name: {
              $ifNull: ['$product.name', '$transaction.serviceName'],
            },
            price: {
              $ifNull: ['$product.price', '$price'],
            },
          },
          user: {
            _id: {
              $ifNull: ['$user._id', null],
            },
            name: {
              $ifNull: ['$user.name', '$transaction.customerName'],
            },
          },
          transaction: {
            _id: '$transaction._id',
            orderCode: '$transaction.orderCode',
            status: '$transaction.status',
          },
        },
      },
    ]);

    const result = await this.transactionItemModel.aggregatePaginate(
      aggregate,
      options,
    );

    return result;
  }

  async findOrder(id: string) {
    if (!id) {
      throw new HttpException('Missing transaction id', HttpStatus.BAD_REQUEST);
    }
    const result = await this.transactionModel.findById(id).lean().exec();

    if (!result) {
      throw new HttpException(
        'Transaksi tidak ditemukan',
        HttpStatus.NOT_FOUND,
      );
    }
    const transactionItems = (await this.transactionItemModel
      .find({
        transactionId: result._id,
      })
      .populate('productId')
      .populate('employeeId')
      .lean()
      .exec()) as unknown as TransactionItemWithPopulatedRefs[];

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
      const { productId: product, employeeId: employee, ...rest } = item;

      return {
        ...rest,
        product: {
          ...product,
          assetRef: assetsMap.get(product._id.toString()),
        },
        employee,
      };
    });

    const subTotal = mappedTransactionItems.reduce(
      (accum, item) => accum + item.product.price,
      0,
    );

    const transactionFee = result.total_price - subTotal;

    return {
      ...result,
      items: mappedTransactionItems,
      subTotal,
      transactionFee,
      totalPrice: result.total_price,
    };
  }

  async updateOrder(id: string, body: CmsUpdateTransactionDto) {
    if (!id) {
      throw new HttpException('Missing transaction id', HttpStatus.BAD_REQUEST);
    }
    const session = await this.connection.startSession();
    session.startTransaction();
    try {
      const transaction = await this.transactionModel
        .findOneAndUpdate(
          {
            _id: id,
          },
          {
            orderCode: body.orderCode,
            customerName: body.customerName,
            transactionType: body.transactionType,
          },
          { new: true, session: session },
        )
        .lean()
        .exec();

      if (!transaction) {
        throw new HttpException(
          'Failed to update data transaction',
          HttpStatus.BAD_REQUEST,
        );
      }

      let employeeObjectId;

      if (body.employeeId) {
        employeeObjectId = toObjectId(body.employeeId);
      }

      if (!employeeObjectId) {
        throw new HttpException(
          'Failed to convert employee to object id',
          HttpStatus.BAD_REQUEST,
        );
      }
      await this.transactionItemModel.updateMany(
        {
          transactionId: transaction._id,
        },
        {
          employeeId: employeeObjectId,
        },
        { session: session },
      );

      await session.commitTransaction();

      return true;
    } catch (error) {
      this.logger.errorString(
        `[CMS TransactionService - update order] ${error as string}`,
      );
      await session.abortTransaction();
      throw error;
    } finally {
      console.log('Lihat sini');
      await session.endSession();
    }
  }

  async updateStatus(id: string, status: ReservationStatus) {
    try {
      const transaction = await this.transactionModel
        .findOneAndUpdate(
          {
            _id: id,
          },
          { status: status },
          { new: true },
        )
        .lean()
        .exec();

      if (transaction) {
        const serviceStatus = [
          ReservationStatus.IN_PROGRESS,
          ReservationStatus.COMPLETED,
          ReservationStatus.CANCELED,
        ].includes(status)
          ? status
          : undefined;

        await this.transactionItemModel
          .updateMany(
            {
              transactionId: transaction._id,
            },
            { serviceStatus: serviceStatus },
          )
          .exec();
      }

      return true;
    } catch (error: any) {
      this.logger.errorString(`[CMS TransactionService] ${error as string}`);
      throw error;
    }
  }

  async updateSchedule(id: string, body: UpdateScheduleDto) {
    const userObjectId = toObjectId(body.userId);

    if (!userObjectId) {
      throw new HttpException(
        'Failed to convert to object id',
        HttpStatus.BAD_REQUEST,
      );
    }
    await this.checkIsNearToCloseTimeOrConflict(
      userObjectId,
      body.reservationDate,
      body.estimation,
    );

    try {
      await this.transactionItemModel
        .findOneAndUpdate(
          {
            _id: body.transactionItemId,
          },
          { reservationDate: body.reservationDate },
          { new: true },
        )
        .exec();
      return true;
    } catch (error) {
      this.logger.errorString(
        `[CMS TransactionService - update schedule] ${error as string}`,
      );
      throw error;
    }
  }

  remove(id: number) {
    return `This action removes a #${id} transaction`;
  }

  async checkIsNearToCloseTimeOrConflict(
    userId: Types.ObjectId,
    reservationDate: Date,
    estimation: number,
    message: string = '',
  ) {
    if (estimation) {
      const allowedOverlap = Number(process.env.ONE_HOUR);
      const durationMs = estimation * Number(process.env.ONE_HOUR); //customer can overlap one hour before the previous order done

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

// DUPLICATE CODE
// const countResult = await this.transactionItemModel.aggregate([
//   {
//     $lookup: {
//       from: 'transactions',
//       localField: 'transactionId',
//       foreignField: '_id',
//       as: 'transaction',
//     },
//   },
//   {
//     $unwind: '$transaction',
//   },
//   {
//     $match: params.orderStatus
//       ? { 'transaction.status': params.orderStatus }
//       : {},
//   },
//   {
//     $match: {
//       'transaction.status': {
//         $nin: [ReservationStatus.CART, ReservationStatus.PENDING],
//       },
//     },
//   },
//   {
//     $sort: sort,
//   },
//   {
//     $lookup: {
//       from: 'users',
//       localField: 'transaction.userId',
//       foreignField: '_id',
//       as: 'user',
//     },
//   },
//   {
//     $unwind: '$user',
//   },
//   {
//     $match: params.keyword
//       ? {
//           $or: [
//             {
//               'user.name': {
//                 $regex: new RegExp(`${keywordSanitized}`, 'i'),
//               },
//             },
//             {
//               'transaction.customerName': {
//                 $regex: new RegExp(`${keywordSanitized}`, 'i'),
//               },
//             },
//             {
//               'transaction.orderCode': {
//                 $regex: new RegExp(`${keywordSanitized}`, 'i'),
//               },
//             },
//           ],
//         }
//       : {},
//   },
//   {
//     $count: 'total',
//   },
// ]);
