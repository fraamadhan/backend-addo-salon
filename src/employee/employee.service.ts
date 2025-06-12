import { HttpException, HttpStatus, Injectable } from '@nestjs/common';
import { CreateEmployeeDto } from './dto/employee.dto';
import { UpdateEmployeeDto } from './dto/update-employee.dto';
import { InjectModel } from '@nestjs/mongoose';
import { Employee, EmployeeDocument } from 'src/schemas/employee.schema';
import { Model, PaginateModel, Types } from 'mongoose';
import { PaginationParams } from 'src/types/pagination';
import { SortType } from 'src/types/sorttype';
import { sanitizeKeyword } from 'src/utils/sanitize-keyword';
import { Query } from 'src/types/general';
import {
  TransactionItems,
  TransactionItemsDocument,
} from 'src/schemas/transaction-items.schema';
import { ReservationStatus } from 'src/types/enum';
import { GetChooseEmployee } from 'src/cms/transaction/dto/cms-transaction.dto';
import { toObjectId } from 'src/utils/general';

@Injectable()
export class EmployeeService {
  constructor(
    @InjectModel(Employee.name)
    private readonly employeeModel: PaginateModel<EmployeeDocument>,
    @InjectModel(TransactionItems.name)
    private readonly transactionItemModel: Model<TransactionItemsDocument>,
  ) {}

  async create(body: CreateEmployeeDto) {
    const data = await this.employeeModel.create(body);

    if (!data) {
      throw new HttpException(
        'Error during creating employee data to database',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }

    return data;
  }

  async findAll(params: PaginationParams) {
    const page = params.page ?? 1;
    const limit = params.limit ?? 10;

    let keywordSanitized = '';
    const query: Query = {
      $and: [],
    };

    const sortby = params.sortby ? params.sortby : 'createdAt';
    const sorttype = params.sorttype === SortType.asc ? 1 : -1;

    const sort: Record<string, number> = {
      [sortby]: sorttype,
      name: 1,
    };

    if (params.keyword) {
      const result = sanitizeKeyword(params.keyword);
      keywordSanitized = result.keywordSanitized;
    }

    if (keywordSanitized.length !== 0) {
      query.$and.push({
        $or: [
          {
            name: {
              $regex: new RegExp(`${keywordSanitized}`, 'i'),
            },
          },
          {
            email: {
              $regex: new RegExp(`${keywordSanitized}`, 'i'),
            },
          },
          {
            phoneNumber: {
              $regex: new RegExp(`${keywordSanitized}`, 'i'),
            },
          },
        ],
      });
    }
    const result = await this.employeeModel.paginate(query, {
      page,
      limit,
      lean: true,
      sort,
      collation: {
        locale: 'en',
        strength: 1,
      },
    });

    const employees = result.docs;
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
      employees,
      paginator,
    };
  }

  async getEmployees(body: GetChooseEmployee) {
    const reservationDate = body.reservationDate;
    const estimation = body.estimation;

    const allowedOverlap = Number(process.env.ONE_HOUR);
    const durationMs = estimation * Number(process.env.ONE_HOUR);

    const startTime = new Date(reservationDate);
    const endTime = new Date(startTime.getTime() + durationMs);

    const matchConditions = {
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
    };

    const excludeIds: (Types.ObjectId | null)[] = [null];

    if (body.employeeId) {
      excludeIds.push(toObjectId(body.employeeId));
    }

    matchConditions['employee._id'] = {
      $nin: excludeIds,
    };

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
        $match: matchConditions,
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
        'Tidak ada pegawai tersedia di jadwal tersebut.',
        HttpStatus.CONFLICT,
      );
    }

    const busyEmployeeIds = conflict.map(
      (c: Record<string, Types.ObjectId>) => c?._id,
    );
    const data = await this.employeeModel
      .find({ _id: { $nin: busyEmployeeIds } })
      .exec();

    if (data.length === 0) {
      throw new HttpException(
        'Employee data not found',
        HttpStatus.BAD_REQUEST,
      );
    }

    return data;
  }

  async findOne(id: string) {
    const data = await this.employeeModel.findById(id).lean().exec();

    if (!data) {
      throw new HttpException(
        'Employee data not found',
        HttpStatus.BAD_REQUEST,
      );
    }

    return data;
  }

  async update(id: string, body: UpdateEmployeeDto) {
    const data = await this.employeeModel
      .findOneAndUpdate(
        {
          _id: id,
        },
        body,
        { new: true },
      )
      .lean()
      .exec();

    if (!data) {
      throw new HttpException('Failed to update data', HttpStatus.BAD_REQUEST);
    }

    return data;
  }

  async remove(id: string) {
    const data = await this.employeeModel
      .findOneAndDelete({
        _id: id,
      })
      .lean()
      .exec();

    if (!data) {
      throw new HttpException('Failed to delete data', HttpStatus.BAD_REQUEST);
    }

    return data;
  }
}
