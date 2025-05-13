import { HttpException, HttpStatus, Injectable } from '@nestjs/common';
import { CreateReviewDto, ParamsReviewDto } from './dto/review.dto';
import { InjectModel } from '@nestjs/mongoose';
import {
  ProductReview,
  ProductReviewDocument,
} from 'src/schemas/product-review.schema';
import { Product, ProductDocument } from 'src/schemas/product.schema';
import mongoose, { Model, PaginateModel, Types } from 'mongoose';
import Logger from 'src/logger';
import { User, UserDocument } from 'src/schemas/user.schema';
import { UserAssets, UserAssetsDocument } from 'src/schemas/user-assets.schema';
import {
  TransactionItemsDocument,
  TransactionItems,
} from 'src/schemas/transaction-items.schema';

@Injectable()
export class ReviewsService {
  constructor(
    @InjectModel(ProductReview.name)
    private readonly productReviewModel: PaginateModel<ProductReviewDocument>,
    @InjectModel(Product.name)
    private readonly productModel: Model<ProductDocument>,
    @InjectModel(User.name)
    private readonly userModel: Model<UserDocument>,
    @InjectModel(UserAssets.name)
    private readonly userAssetsModel: Model<UserAssetsDocument>,
    @InjectModel(TransactionItems.name)
    private readonly transactionItemModel: Model<TransactionItemsDocument>,
  ) {}

  private readonly logger = new Logger();

  async create(body: CreateReviewDto) {
    const existingUser = await this.userModel.findById(body.userId).exec();

    if (!existingUser) {
      throw new HttpException(
        'Pengguna tidak ditemukan',
        HttpStatus.BAD_REQUEST,
      );
    }

    if (body.productId || body.userId) {
      body.productId = new Types.ObjectId(body.productId);
      body.userId = new Types.ObjectId(body.userId);
    }

    // insert the data in product table review
    const data = await this.productReviewModel.create(body);
    if (data) {
      this.logger.log('[Review Service] - create review success');

      const product = await this.productModel
        .findById(body.productId)
        .select('ratingAverage ratingCount')
        .lean()
        .exec();

      if (product) {
        const oldAverage = product.ratingAverage || 0;
        const oldCount = product.ratingCount || 0;
        const newRatingCount = oldCount + 1;
        const newRatingAverage =
          ((oldAverage * oldCount + body.rating) * 1.0) / newRatingCount;

        await this.productModel
          .findOneAndUpdate(
            {
              _id: body.productId,
            },
            {
              ratingAverage: newRatingAverage,
              ratingCount: newRatingCount,
            },
          )
          .exec();
      }

      // UPDATE IS_REVIEWED IN TRANSACTION SCHEMA
      const transactionItem = await this.transactionItemModel
        .findOne({
          productId: new mongoose.Types.ObjectId(body.productId),
          transactionId: new mongoose.Types.ObjectId(body.transactionId),
        })
        .exec();

      if (transactionItem) {
        transactionItem.isReviewed = true;
        await transactionItem.save();
      }
    }

    return data;
  }

  async findAll(params: ParamsReviewDto) {
    const page = params.page ?? 1;
    const limit = params.limit ?? 10;

    if (params.rating) {
      const data = await this.productReviewModel
        .find({
          rating: {
            $gte: params.rating,
          },
        })
        .limit(9)
        .populate('productId', '_id name ratingAverage')
        .populate('userId', '_id name')
        .lean()
        .exec();

      const userIds = data.map((value) => value.userId._id);

      const userAssets = await this.userAssetsModel
        .find({
          userId: { $in: userIds },
        })
        .lean()
        .exec();

      const assetMap = new Map(
        userAssets.map((asset) => [asset.userId.toString(), asset.publicUrl]),
      );

      const result = data.map((value) => {
        const { productId: product, userId: user, ...review } = value;

        return {
          ...review,
          product,
          user: {
            ...user,
            assetRef: assetMap.get(user._id.toString()) || null,
          },
        };
      });

      return result;
    }
    if (params.userId) {
      const query = {
        userId: {
          $ne: params?.userId,
        },
      };
      const firstRow = await this.productReviewModel
        .find({
          userId: params?.userId,
        })
        .populate('productId', '_id name ratingAverage')
        .populate('userId', '_id name')
        .lean()
        .exec();

      const userReview = firstRow.map(
        ({ productId: product, userId: user, ...review }) => ({
          ...review,
          product,
          user,
        }),
      );

      const result = await this.productReviewModel.paginate(query, {
        page,
        limit,
        lean: true,
        populate: [
          { path: 'productId', select: '_id name ratingAverage' },
          { path: 'userId', select: '_id name' },
        ],
        collation: {
          locale: 'en',
          strength: 1,
        },
      });

      const userIds = result.docs.map((doc) => doc.userId._id);

      const userAssets = await this.userAssetsModel
        .find({
          userId: { $in: userIds },
        })
        .lean()
        .exec();

      const assetMap = new Map(
        userAssets.map((asset) => [asset.userId.toString(), asset.publicUrl]),
      );

      const mappedPaginate = result.docs.map(
        ({ productId: product, userId: user, ...review }) => ({
          ...review,
          product,
          user: {
            ...user,
            assetRef: assetMap.get(user._id.toString()) || null,
          },
        }),
      );

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

      const reviews = [...userReview, ...mappedPaginate];

      return { reviews, paginator };
    }
  }

  async findOne(id: string) {
    if (!id) {
      throw new HttpException('Ulasan tidak ditemukan', HttpStatus.NOT_FOUND);
    }
    const result = await this.productReviewModel
      .findById(id)
      .populate('productId', '_id name ratingAverage')
      .populate('userId', '_id name')
      .lean()
      .exec();

    if (!result) {
      throw new HttpException('Ulasan tidak ditemukan', HttpStatus.NOT_FOUND);
    }

    const { productId: product, userId: user, ...review } = result;

    return { ...review, product, user };
  }

  //update and delete review is not needed right now
  // update(id: number, body: UpdateReviewDto) {
  //   return `This action updates a #${id} review`;
  // }

  // remove(id: number) {
  //   return `This action removes a #${id} review`;
  // }
}
