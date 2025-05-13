import { Module } from '@nestjs/common';
import { ReviewsService } from './reviews.service';
import { ReviewsController } from './reviews.controller';
import { MongooseModule } from '@nestjs/mongoose';
import {
  ProductReview,
  ProductReviewSchema,
} from 'src/schemas/product-review.schema';
import { Product, ProductSchema } from 'src/schemas/product.schema';
import { JwtService } from '@nestjs/jwt';
import { User, UserSchema } from 'src/schemas/user.schema';
import { UserAssets, UserAssetsSchema } from 'src/schemas/user-assets.schema';
import {
  TransactionItems,
  TransactionItemsSchema,
} from 'src/schemas/transaction-items.schema';

@Module({
  imports: [
    MongooseModule.forFeature([
      {
        name: ProductReview.name,
        schema: ProductReviewSchema,
      },
      {
        name: Product.name,
        schema: ProductSchema,
      },
      {
        name: User.name,
        schema: UserSchema,
      },
      {
        name: UserAssets.name,
        schema: UserAssetsSchema,
      },
      {
        name: TransactionItems.name,
        schema: TransactionItemsSchema,
      },
    ]),
  ],
  controllers: [ReviewsController],
  providers: [ReviewsService, JwtService],
})
export class ReviewsModule {}
