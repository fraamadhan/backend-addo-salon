import { HttpException, HttpStatus, Injectable } from '@nestjs/common';
import { CreateReviewDto, ParamsReviewDto } from './dto/review.dto';
import { InjectConnection, InjectModel } from '@nestjs/mongoose';
import {
  ProductReview,
  ProductReviewDocument,
} from 'src/schemas/product-review.schema';
import { Product, ProductDocument } from 'src/schemas/product.schema';
import mongoose, { Model, PaginateModel } from 'mongoose';
import Logger from 'src/logger';
import { User, UserDocument } from 'src/schemas/user.schema';
import { UserAssets, UserAssetsDocument } from 'src/schemas/user-assets.schema';
import {
  TransactionItemsDocument,
  TransactionItems,
} from 'src/schemas/transaction-items.schema';
import { toObjectId } from 'src/utils/general';

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
    @InjectConnection() private readonly connection: mongoose.Connection,
  ) {}

  private readonly logger = new Logger();

  async create(body: CreateReviewDto, userId: string) {
    const existingUser = await this.userModel.findById(userId).exec();

    if (!existingUser) {
      throw new HttpException(
        'Pengguna tidak ditemukan',
        HttpStatus.BAD_REQUEST,
      );
    }

    const productObjectId = toObjectId(body.productId);
    const itemObjectId = toObjectId(body.itemId);

    if (!productObjectId || !itemObjectId) {
      throw new HttpException(
        'Invalid productId or itemId',
        HttpStatus.BAD_REQUEST,
      );
    }
    body.productId = productObjectId;
    body.itemId = itemObjectId;
    body['userId'] = toObjectId(userId);

    // insert the data in product table review
    const session = await this.connection.startSession();
    session.startTransaction();
    try {
      const [data] = await this.productReviewModel.create([body], {
        session,
      });
      this.logger.log('[Review Service] - create review success');
      if (data) {
        const product = await this.productModel
          .findById(productObjectId)
          .select('ratingAverage ratingCount')
          .lean()
          .session(session)
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
                _id: productObjectId,
              },
              {
                ratingAverage: newRatingAverage,
                ratingCount: newRatingCount,
              },
              {
                session,
              },
            )
            .exec();
        }

        // UPDATE IS_REVIEWED IN TRANSACTION SCHEMA
        const transactionItem = await this.transactionItemModel
          .findOne({
            _id: body.itemId,
            productId: productObjectId,
          })
          .session(session)
          .exec();

        if (transactionItem) {
          transactionItem.isReviewed = true;
          await transactionItem.save({ session });
        }

        await session.commitTransaction();

        return data;
      }
    } catch (error) {
      this.logger.error(
        `[ReviewService - create] - ${error instanceof Error ? error.message : JSON.stringify(error)}`,
      );
      await session.abortTransaction();
      throw error;
    } finally {
      await session.endSession();
    }
  }

  async findAll(params: ParamsReviewDto) {
    if (params.productId) return this.findAllByProductId(params);
    if (params.rating) return this.findByRating(params);
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

  async findByRating(params: ParamsReviewDto) {
    if (params.rating) {
      const data = await this.productReviewModel
        .find({
          rating: {
            $gte: params.rating,
          },
        })
        .sort({ createdAt: -1 })
        .limit(9)
        .populate('productId', '_id name ratingAverage')
        .populate('userId', '_id name')
        .lean()
        .exec();

      const userIds = data
        .filter((value) => value.userId !== null)
        .map((value) => value.userId._id);

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
          user: user
            ? {
                ...user,
                assetRef: assetMap.get(user._id.toString()) || null,
              }
            : null,
        };
      });

      return result;
    }
  }

  async findAllByProductId(params: ParamsReviewDto) {
    const page = params.page ?? 1;
    const limit = params.limit ?? 10;

    if (params.productId) {
      const query = {
        productId: toObjectId(params.productId),
      };

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

      const userIds = result.docs
        .filter((doc) => doc.userId != null)
        .map((doc) => doc.userId._id);

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
          user: user
            ? {
                ...user,
                assetRef: assetMap.get(user._id.toString()) || null,
              }
            : null,
        }),
      );

      const ratingCounts: { _id: number; count: number }[] =
        await this.productReviewModel.aggregate([
          {
            $match: { productId: toObjectId(params.productId) },
          },
          { $group: { _id: '$rating', count: { $sum: 1 } } },
        ]);

      const arrayStarCount = [5, 4, 3, 2, 1]
        .map((star) => ({
          star,
          count:
            ratingCounts.find((r) => r._id === star)?.count || (0 as number),
        }))
        .reverse();

      const totalReviews = arrayStarCount.reduce(
        (accum, item) => accum + item.count,
        0,
      );

      const totalRating = ratingCounts.reduce(
        (accum, item) => accum + item._id * item.count,
        0,
      );

      const ratingAverage = totalReviews > 0 ? totalRating / totalReviews : 0;

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

      const reviews = [...mappedPaginate];

      return {
        reviews,
        paginator,
        arrayStarCount,
        totalReviews,
        ratingAverage,
      };
    }
  }
}
