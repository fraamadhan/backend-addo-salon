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
import mongoose, { Model, AggregatePaginateModel } from 'mongoose';
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
import { generateOrderCode, toObjectId } from 'src/utils/general';
import { SortType } from 'src/types/sorttype';
import { sanitizeKeyword } from 'src/utils/sanitize-keyword';
import {
  AggregatedResult,
  TransactionItemWithPopulatedRefs,
} from 'src/types/transaction';
import { OrQuery } from 'src/types/general';
import { dateFormatter } from 'src/utils/date-formatter';

@Injectable()
export class CmsTransactionService {
  constructor(
    @InjectModel(Transaction.name)
    private readonly transactionModel: AggregatePaginateModel<TransactionDocument>,
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

    let serviceStatus = body.status;

    if (body.status === ReservationStatus.PAID) {
      serviceStatus = ReservationStatus.SCHEDULED;
    }

    if (body.status === ReservationStatus.SCHEDULED) {
      body.status = ReservationStatus.PAID;
    }

    body.orderCode = generateOrderCode(body.customerName);

    const product = await this.productModel
      .findById(body.productId)
      .lean()
      .exec();

    const transaction = await this.transactionModel.create({
      total_price: product?.price,
      status: body.status,
      paymentMethod: body.paymentMethod,
      bank: body.bank ?? null,
      transactionType: body.transactionType,
      customerName: body.customerName,
      orderCode: body.orderCode,
    });

    if (!transaction) {
      throw new HttpException(
        'Failed to create transaction',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }

    const transactionItems = await this.transactionItemModel.create({
      reservationDate: body.reservationDate,
      price: product?.price || 0,
      serviceStatus: serviceStatus,
      productId: product?._id || null,
      transactionId: transaction._id,
      employeeId: toObjectId(body.employeeId),
    });

    return {
      transaction,
      items: transactionItems,
    };
  }

  async getOrders(params: TransactionQueryParams) {
    const page = params.page ?? 1;
    const limit = params.limit ?? 10;
    const skip = (page - 1) * limit;

    let keywordSanitized = '';

    const sorttype: 1 | -1 = params.sorttype === SortType.asc ? 1 : -1;
    const sortby = params.sortby ?? 'reservationDate';
    const sort: Record<string, 1 | -1> = {
      [sortby]: sorttype,
      _id: -1,
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
          ReservationStatus.CANCELED,
          ReservationStatus.EXPIRED,
        ],
      },
      serviceStatus: {
        $nin: [
          ReservationStatus.CART,
          ReservationStatus.PENDING,
          ReservationStatus.COMPLETED,
          ReservationStatus.CANCELED,
          ReservationStatus.EXPIRED,
        ],
      },
    };

    if (params.startDate || params.endDate) {
      const reservationDateQuery = {};
      if (params.startDate) {
        reservationDateQuery['$gte'] = params.startDate;
      }
      if (params.endDate) {
        reservationDateQuery['$lte'] = params.endDate;
      }

      matchStage['reservationDate'] = reservationDateQuery;
    }

    if (params.orderStatus) {
      matchStage['serviceStatus'] = params.orderStatus;
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
          $unwind: {
            path: '$user',
            preserveNullAndEmptyArrays: true,
          },
        },
        {
          $lookup: {
            from: 'employees',
            localField: 'employeeId',
            foreignField: '_id',
            as: 'employee',
          },
        },
        {
          $unwind: {
            path: '$employee',
            preserveNullAndEmptyArrays: true,
          },
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
                  price: 1,
                  note: 1,
                  product: {
                    _id: '$product._id',
                    name: '$product.name',
                    price: '$product.price',
                  },
                  user: {
                    _id: { $ifNull: ['$user._id', null] },
                    name: {
                      $ifNull: ['$user.name', '$transaction.customerName'],
                    },
                  },
                  transaction: {
                    _id: '$transaction._id',
                    orderCode: '$transaction.orderCode',
                    status: '$transaction.status',
                  },
                  employee: {
                    _id: '$employee._id',
                    name: '$employee.name',
                  },
                },
              },
            ],
            totalCount: [{ $count: 'total' }],
          },
        },
      ]);

    const [{ data: orders = [], totalCount = [] }] = result;
    const total = totalCount?.[0]?.total ?? 0;

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
    const sortby = params.sortby ?? 'updatedAt';
    const sort: Record<string, any> = {
      [sortby]: sorttype,
      _id: -1,
    };
    let keywordSanitized = '';
    const matchNameStage: OrQuery = {
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
          customerName: {
            $regex: new RegExp(`${keywordSanitized}`, 'i'),
          },
        },
        {
          'items.product.name': {
            $regex: new RegExp(`${keywordSanitized}`, 'i'),
          },
        },
      );
    }

    const matchStages: Record<string, any> = {
      status: {
        $in: [
          ReservationStatus.COMPLETED,
          ReservationStatus.CANCELED,
          ReservationStatus.EXPIRED,
          ReservationStatus.PAID,
        ],
      },
    };

    if (params.orderStatus) {
      matchStages['status'] = params.orderStatus;
    }

    if (params.startDate || params.endDate) {
      const dateFilter: Record<string, Date> = {};

      if (params.startDate) {
        dateFilter['$gte'] = new Date(params.startDate);
      }

      if (params.endDate) {
        dateFilter['$lte'] = new Date(params.endDate);
      }

      matchStages['createdAt'] = dateFilter;
    }

    if (params.productId) {
      matchStages['items.product._id'] = toObjectId(params.productId);
    }

    const customLabels = {
      totalDocs: 'totalItem',
      docs: 'transactions',
      limit: 'limit',
      page: 'currentPage',
      nextPage: 'nextPage',
      prevPage: 'prevPage',
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

    const aggregate = this.transactionModel.aggregate([
      {
        $lookup: {
          from: 'transactionitems',
          localField: '_id',
          foreignField: 'transactionId',
          as: 'items',
        },
      },
      {
        $lookup: {
          from: 'users',
          localField: 'userId',
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
          localField: 'items.productId',
          foreignField: '_id',
          as: 'products',
        },
      },
      {
        $addFields: {
          items: {
            $map: {
              input: '$items',
              as: 'item',
              in: {
                _id: '$$item._id',
                reservationDate: '$$item.reservationDate',
                serviceStatus: '$$item.serviceStatus',
                price: '$$item.price',
                product: {
                  $let: {
                    vars: {
                      prod: {
                        $arrayElemAt: [
                          {
                            $filter: {
                              input: '$products',
                              as: 'product',
                              cond: {
                                $eq: ['$$product._id', '$$item.productId'],
                              },
                            },
                          },
                          0,
                        ],
                      },
                    },
                    in: {
                      _id: '$$prod._id',
                      name: '$$prod.name',
                      price: '$$prod.price',
                    },
                  },
                },
              },
            },
          },
        },
      },
      {
        $addFields: {
          user: {
            _id: { $ifNull: ['$user._id', null] },
            name: { $ifNull: ['$user.name', '$customerName'] },
          },
        },
      },
      {
        $match: {
          ...matchStages,
          ...(keywordSanitized.length !== 0 ? { $or: matchNameStage.$or } : {}),
        },
      },
      {
        $project: {
          user: {
            _id: { $ifNull: ['$user._id', null] },
            name: { $ifNull: ['$user.name', '$customerName'] },
          },
          status: 1,
          orderCode: 1,
          items: 1,
          createdAt: 1,
        },
      },
      { $sort: sort },
    ]);

    const result = await this.transactionModel.aggregatePaginate(
      aggregate,
      options,
    );

    return result;
  }

  async findHistoryTransaction(id: string) {
    if (!id) {
      throw new HttpException('Missing transaction id', HttpStatus.BAD_REQUEST);
    }
    const result = await this.transactionModel
      .findById(id)
      .populate('userId', '_id name email phone_number')
      .lean()
      .exec();

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

    const { userId, ...transaction } = result;

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
      (accum, item) => accum + item.price,
      0,
    );

    const canceledItems = mappedTransactionItems.filter(
      (item) => item.serviceStatus === ReservationStatus.CANCELED,
    );

    const totalPriceCanceledItems = canceledItems.reduce(
      (accum, item) => accum + item.price,
      0,
    );

    let transactionFee: number = 0;

    if (result.paymentMethod === 'bank_transfer') {
      transactionFee = 4000;
    } else if (result.paymentMethod === 'qris') {
      transactionFee = subTotal * 0.02;
    } else if (result.paymentMethod === 'gopay') {
      transactionFee = subTotal * 0.07;
    }

    return {
      ...transaction,
      user: {
        ...userId,
      },
      items: mappedTransactionItems,
      subTotal,
      transactionFee,
      canceledItemsPrice: totalPriceCanceledItems,
      totalPrice: result.total_price,
    };
  }

  async findOrder(id: string) {
    if (!id) {
      throw new HttpException('Missing order id', HttpStatus.BAD_REQUEST);
    }

    const data = await this.transactionItemModel
      .findById(id)
      .populate([
        {
          path: 'productId',
          select: '_id name estimation',
        },
        {
          path: 'employeeId',
          select: '_id name email phoneNumber',
        },
      ])
      .lean()
      .exec();

    if (!data) {
      throw new HttpException(
        'Failed to get data detail order',
        HttpStatus.BAD_REQUEST,
      );
    }

    const transaction = await this.transactionModel
      .findById(data.transactionId)
      .select('userId customerName')
      .populate('userId', '_id name ')
      .lean()
      .exec();

    if (!transaction) {
      throw new HttpException(
        'Failed to get data transaction',
        HttpStatus.BAD_REQUEST,
      );
    }

    const { userId } = transaction;

    const { productId, employeeId, ...rest } = data;

    const assetRef = await this.productAssetModel
      .findOne({
        productId: productId._id,
      })
      .select('publicUrl -_id')
      .exec();

    const item = {
      ...rest,
      product: {
        ...productId,
        assetRef: assetRef?.publicUrl,
      },
      employee: {
        ...employeeId,
      },
      user: {
        ...userId,
        customerName: transaction.customerName,
      },
    };

    return item;
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
            _id: body.transactionId ? toObjectId(body.transactionId) : '',
          },
          {
            customerName: body.customerName,
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
          _id: id,
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
        `[CMS TransactionService - update general info order] ${error as string}`,
      );
      await session.abortTransaction();
      throw error;
    } finally {
      await session.endSession();
    }
  }

  async updateStatus(id: string, status: ReservationStatus) {
    try {
      const serviceStatus = [
        ReservationStatus.IN_PROGRESS,
        ReservationStatus.COMPLETED,
        ReservationStatus.CANCELED,
        ReservationStatus.PENDING,
        ReservationStatus.UNPAID,
        ReservationStatus.SCHEDULED,
      ].includes(status)
        ? status
        : undefined;

      const data = await this.transactionItemModel
        .findOneAndUpdate(
          {
            _id: id,
          },
          { serviceStatus: serviceStatus },
          { new: true },
        )
        .exec();

      if (!data) {
        throw new HttpException(
          'Pesanan tidak ditemukan',
          HttpStatus.BAD_REQUEST,
        );
      }

      const transactionId = data.transactionId;

      // find all item by transaction id
      const items = await this.transactionItemModel
        .find({ transactionId })
        .exec();
      // if there's item with service status IN_PROGRESS dont update the transaction status
      const hasInProgress = items.some(
        (item) => item.serviceStatus === ReservationStatus.IN_PROGRESS,
      );
      // if all the transaction cancel, update all canceled
      const allCanceled = items.every(
        (item) => item.serviceStatus === ReservationStatus.CANCELED,
      );
      // if there's no in progress status, check if there's service status with COMPLETED
      const hasCompleted = items.some(
        (item) => item.serviceStatus === ReservationStatus.COMPLETED,
      );
      const allCompleted = items.every(
        (item) =>
          item.serviceStatus === ReservationStatus.COMPLETED ||
          item.serviceStatus === ReservationStatus.CANCELED,
      );

      if (status === ReservationStatus.CANCELED) {
        const totalCanceledPrice = data?.price;

        await this.transactionModel.updateOne(
          { _id: transactionId },
          { $inc: { total_price: -totalCanceledPrice } },
        );
      }

      if (hasInProgress) {
        return true;
      }

      if (allCanceled) {
        await this.transactionModel.updateOne(
          { _id: transactionId },
          { status: ReservationStatus.CANCELED },
        );

        return true;
      }

      // if there's service status COMPLETED update to complete
      if (hasCompleted && allCompleted) {
        await this.transactionModel.updateOne(
          { _id: transactionId },
          { status: ReservationStatus.COMPLETED },
        );
      }

      return true;
    } catch (error: any) {
      this.logger.errorString(
        `[CMS TransactionService] Failed to update status for item ${id} to ${status}: ${error}`,
      );
      throw error;
    }
  }

  async updateSchedule(id: string, body: UpdateScheduleDto) {
    await this.checkIsNearToCloseTimeOrConflict(
      body.reservationDate,
      body.estimation,
    );

    try {
      await this.transactionItemModel
        .findOneAndUpdate(
          {
            _id: id,
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
          $lookup: {
            from: 'employees',
            localField: 'employeeId',
            foreignField: '_id',
            as: 'employee',
          },
        },
        {
          $unwind: {
            path: '$employee',
            preserveNullAndEmptyArrays: true,
          },
        },
        {
          $match: {
            serviceStatus: {
              $in: [ReservationStatus.SCHEDULED, ReservationStatus.IN_PROGRESS],
            },
            'transaction.status': {
              $in: [ReservationStatus.PAID, ReservationStatus.SCHEDULED],
            },
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
        {
          $group: {
            _id: '$employeeId',
          },
        },
      ]);

      const busyEmployeeCount = conflict.length;
      const totalEmployee = await this.employeeModel.countDocuments({});

      const isAvailable = busyEmployeeCount < totalEmployee;

      if (!isAvailable) {
        throw new HttpException(
          `${message.length !== 0 ? `${message}` : `Tidak ada pegawai tersedia di jadwal ${dateFormatter(new Date(reservationDate))}. Silakan cek jadwal pesanan dan pilih jadwal lain`}`,
          HttpStatus.CONFLICT,
        );
      }
    }
  }

  async deleteTransaction(id: string, query: Record<string, string>) {
    if (!id) {
      throw new HttpException(
        `ID transaksi tidak ditemukan`,
        HttpStatus.NOT_FOUND,
      );
    }

    const type = query.type;

    if (type === 'payment') {
      const transactionId = query.transactionId;

      if (!transactionId) {
        throw new HttpException(
          'Transaction ID diperlukan untuk menghapus item pembayaran',
          HttpStatus.BAD_REQUEST,
        );
      }

      const item = await this.transactionItemModel
        .findByIdAndDelete(id)
        .lean()
        .exec();

      if (item) {
        await this.transactionModel.updateOne(
          { _id: transactionId },
          { $inc: { total_price: -item?.price } },
        );
      }

      const items = await this.transactionItemModel.find({
        transactionId: toObjectId(transactionId),
      });

      if (items.length === 0) {
        await this.transactionModel
          .findByIdAndDelete(transactionId)
          .lean()
          .exec();
      }

      if (!item) {
        throw new HttpException(
          `Pesanan tidak dapat ditemukan`,
          HttpStatus.NOT_FOUND,
        );
      }

      return true;
    } else if (type === 'transaction') {
      await this.transactionItemModel
        .deleteMany({
          transactionId: toObjectId(id),
        })
        .exec();

      const transaction = await this.transactionModel
        .findByIdAndDelete(id)
        .lean()
        .exec();

      if (!transaction) {
        throw new HttpException(
          'Transaksi tidak ditemukan',
          HttpStatus.NOT_FOUND,
        );
      }

      return true;
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
