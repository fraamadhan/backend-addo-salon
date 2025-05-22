import { Module } from '@nestjs/common';
import { CartService } from './cart.service';
import { CartController } from './cart.controller';
import { MongooseModule } from '@nestjs/mongoose';
import { Cart, CartSchema } from 'src/schemas/cart.schema';
import { Product, ProductSchema } from 'src/schemas/product.schema';
import {
  ProductAssets,
  ProductAssetsSchema,
} from 'src/schemas/product-assets.schema';
import { JwtService } from '@nestjs/jwt';
import { Transaction, TransactionSchema } from 'src/schemas/transaction.schema';
import {
  TransactionItems,
  TransactionItemsSchema,
} from 'src/schemas/transaction-items.schema';

@Module({
  imports: [
    MongooseModule.forFeature([
      {
        name: Cart.name,
        schema: CartSchema,
      },
      {
        name: Product.name,
        schema: ProductSchema,
      },
      {
        name: ProductAssets.name,
        schema: ProductAssetsSchema,
      },
      {
        name: Transaction.name,
        schema: TransactionSchema,
      },
      {
        name: TransactionItems.name,
        schema: TransactionItemsSchema,
      },
    ]),
  ],
  controllers: [CartController],
  providers: [CartService, JwtService],
})
export class CartModule {}
