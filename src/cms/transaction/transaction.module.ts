import { Module } from '@nestjs/common';
import { CmsTransactionService } from './transaction.service';
import { CmsTransactionController } from './transaction.controller';
import { JwtService } from '@nestjs/jwt';
import { MongooseModule } from '@nestjs/mongoose';
import { Transaction, TransactionSchema } from 'src/schemas/transaction.schema';
import {
  TransactionItems,
  TransactionItemsSchema,
} from 'src/schemas/transaction-items.schema';
import { Product, ProductSchema } from 'src/schemas/product.schema';
import {
  ProductAssets,
  ProductAssetsSchema,
} from 'src/schemas/product-assets.schema';
import { Cart, CartSchema } from 'src/schemas/cart.schema';
import { Employee, EmployeeSchema } from 'src/schemas/employee.schema';

@Module({
  imports: [
    MongooseModule.forFeature([
      {
        name: Transaction.name,
        schema: TransactionSchema,
      },
      {
        name: TransactionItems.name,
        schema: TransactionItemsSchema,
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
        name: Cart.name,
        schema: CartSchema,
      },
      {
        name: Employee.name,
        schema: EmployeeSchema,
      },
    ]),
  ],
  controllers: [CmsTransactionController],
  providers: [CmsTransactionService, JwtService],
})
export class CmsTransactionModule {}
