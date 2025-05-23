import { Module } from '@nestjs/common';
import { DashboardService } from './dashboard.service';
import { DashboardController } from './dashboard.controller';
import { MongooseModule } from '@nestjs/mongoose';
import { JwtService } from '@nestjs/jwt';
import { Cart, CartSchema } from 'src/schemas/cart.schema';
import { Employee, EmployeeSchema } from 'src/schemas/employee.schema';
import { Product, ProductSchema } from 'src/schemas/product.schema';
import {
  TransactionItems,
  TransactionItemsSchema,
} from 'src/schemas/transaction-items.schema';
import { Transaction, TransactionSchema } from 'src/schemas/transaction.schema';
import { User, UserSchema } from 'src/schemas/user.schema';

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
        name: User.name,
        schema: UserSchema,
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
  controllers: [DashboardController],
  providers: [DashboardService, JwtService],
})
export class DashboardModule {}
