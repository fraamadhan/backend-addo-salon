import { Injectable } from '@nestjs/common';
import { User, UserDocument } from './schemas/user.schema';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';

class CreateUserDto {
  readonly name!: string;
  readonly age!: number | undefined;
  readonly sex: string | undefined | null;
}

class UpdateUserDto {
  readonly name?: string;
  readonly age?: number;
  readonly sex?: string;
}

@Injectable()
export class AppService {
  constructor(@InjectModel(User.name) private userModel: Model<UserDocument>) {}

  async findAll(): Promise<User[]> {
    return await this.userModel.find().exec();
  }

  async create(body: CreateUserDto): Promise<User> {
    const user = await this.userModel.create(body);
    return user;
  }

  async findOne(id: string): Promise<User | null> {
    return await this.userModel.findById(id).exec();
  }

  async update(id: string, body: UpdateUserDto): Promise<User | null> {
    const user = this.userModel.findByIdAndUpdate({ _id: id }, body, {
      new: true,
    });

    return user;
  }

  async delete(id: string): Promise<User | null> {
    const user = this.userModel.findByIdAndDelete(id).exec();
    return user;
  }
}
