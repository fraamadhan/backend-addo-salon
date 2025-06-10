import { Injectable } from '@nestjs/common';
import { DashboardDto } from './dto/dashboard.dto';
import { InjectModel, InjectConnection } from '@nestjs/mongoose';
import mongoose, {
  PaginateModel,
  AggregatePaginateModel,
  Model,
} from 'mongoose';
import { Cart, CartDocument } from 'src/schemas/cart.schema';
import { Employee, EmployeeDocument } from 'src/schemas/employee.schema';
import { Product, ProductDocument } from 'src/schemas/product.schema';
import {
  TransactionItems,
  TransactionItemsDocument,
} from 'src/schemas/transaction-items.schema';
import {
  Transaction,
  TransactionDocument,
} from 'src/schemas/transaction.schema';
import { User, UserDocument } from 'src/schemas/user.schema';
import { ReservationStatus } from 'src/types/enum';

@Injectable()
export class DashboardService {
  constructor(
    @InjectModel(Transaction.name)
    private readonly transactionModel: PaginateModel<TransactionDocument>,
    @InjectModel(TransactionItems.name)
    private readonly transactionItemModel: AggregatePaginateModel<TransactionItemsDocument>,
    @InjectModel(Product.name)
    private readonly productModel: Model<ProductDocument>,
    @InjectModel(User.name)
    private readonly userModel: Model<UserDocument>,
    @InjectModel(Cart.name)
    private readonly cartModel: Model<CartDocument>,
    @InjectModel(Employee.name)
    private readonly employeeModel: Model<EmployeeDocument>,
    @InjectConnection() private readonly connection: mongoose.Connection,
  ) {}

  async getData(params: DashboardDto) {
    const date = new Date();
    const year = date.getFullYear();
    const month = date.getMonth();

    let firstDate: Date | undefined;
    let lastDate: Date | undefined;

    const query: {
      serviceStatus: ReservationStatus;
      createdAt?: { $gte?: Date; $lte?: Date };
    } = {
      serviceStatus: ReservationStatus.COMPLETED,
    };

    if (params.oneMonth) {
      firstDate = new Date(year, month - 1, 1);
      lastDate = new Date(year, month + 1, 1);
    } else if (params.threeMonth) {
      firstDate = new Date(year, month - 3, 1);
      lastDate = new Date(year, month + 1, 1);
    } else if (params.sixMonth) {
      firstDate = new Date(year, month - 6, 1);
      lastDate = new Date(year, month + 1, 1);
    } else {
      if (params.startDate) firstDate = new Date(params.startDate);
      if (params.endDate) lastDate = new Date(params.endDate);
    }

    if (firstDate || lastDate) {
      query['createdAt'] = {};
      if (firstDate) query.createdAt.$gte = firstDate;
      if (lastDate) query.createdAt.$lte = lastDate;
    }

    const matchStage = {
      serviceStatus: ReservationStatus.COMPLETED,
      reservationDate: { $ne: null },
    };

    const selectedYear =
      parseInt(params.year ?? '') || new Date().getFullYear();

    matchStage.reservationDate['$gte'] = new Date(selectedYear, 0, 1);
    matchStage.reservationDate['$lte'] = new Date(selectedYear + 1, 0, 1);

    const aggregateQuarter = this.transactionItemModel.aggregate([
      {
        $match: matchStage,
      },
      {
        $project: {
          year: { $year: '$reservationDate' },
          quarter: {
            $ceil: { $divide: [{ $month: '$reservationDate' }, 3] },
          },
          price: 1,
        },
      },
      {
        $group: {
          _id: {
            year: '$year',
            quarter: '$quarter',
          },
          totalItems: { $sum: 1 },
          totalRevenue: { $sum: '$price' },
        },
      },
      {
        $sort: {
          '_id.year': 1,
          '_id.quarter': 1,
        },
      },
    ]);

    const aggregateAvailableYears = this.transactionItemModel.aggregate([
      {
        $match: {
          serviceStatus: ReservationStatus.COMPLETED,
          reservationDate: { $ne: null },
        },
      },
      {
        $project: {
          year: { $year: '$reservationDate' },
        },
      },
      {
        $group: {
          _id: {
            year: '$year',
          },
        },
      },
      {
        $sort: { '_id.year': -1 },
      },
    ]);

    const [
      totalProducts,
      totalEmployees,
      totalTransactions,
      totalUsers,
      totalOrders,
      orders,
      quarterlyStats,
      availableYears,
    ] = await Promise.all([
      this.productModel.countDocuments(),
      this.employeeModel.countDocuments(),
      this.transactionModel.countDocuments({
        status: ReservationStatus.COMPLETED,
      }),
      this.userModel.countDocuments(),
      this.transactionItemModel.countDocuments({
        serviceStatus: ReservationStatus.SCHEDULED,
      }),
      this.transactionItemModel.find(query).exec(),
      aggregateQuarter,
      aggregateAvailableYears,
    ]);

    const totalRevenue = orders.reduce(
      (accum, total) => accum + total.price,
      0,
    );

    return {
      totalProducts,
      totalEmployees,
      totalTransactions,
      totalUsers,
      totalOrders,
      totalRevenue,
      quarterlyStats,
      availableYears,
    };
  }
}
