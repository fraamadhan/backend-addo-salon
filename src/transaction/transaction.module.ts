import { Module } from '@nestjs/common';
import { TransactionService } from './transaction.service';
import { TransactionController } from './transaction.controller';
import { MidtransService } from './midtrans/midtrans.service';
import { MidtransModule } from './midtrans/midtrans.module';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { HttpModule } from '@nestjs/axios';
import { MongooseModule } from '@nestjs/mongoose';
import { Transaction, TransactionSchema } from 'src/schemas/transaction.schema';
import { Product, ProductSchema } from 'src/schemas/product.schema';
import {
  ProductAssets,
  ProductAssetsSchema,
} from 'src/schemas/product-assets.schema';
import { Employee, EmployeeSchema } from 'src/schemas/employee.schema';
import { JwtService } from '@nestjs/jwt';
import {
  TransactionItems,
  TransactionItemsSchema,
} from 'src/schemas/transaction-items.schema';
import { Cart, CartSchema } from 'src/schemas/cart.schema';

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
        name: Employee.name,
        schema: EmployeeSchema,
      },
      {
        name: Cart.name,
        schema: CartSchema,
      },
    ]),
    MidtransModule,
    HttpModule.registerAsync({
      useFactory: (config: ConfigService) => ({
        timeout: config.get('HTTP_TIMEOUT'),
        maxRedirects: config.get('MAX_REDIRECTS'),
      }),
      imports: [ConfigModule],
      inject: [ConfigService],
    }),
  ],
  controllers: [TransactionController],
  providers: [TransactionService, MidtransService, JwtService],
})
export class TransactionModule {}
