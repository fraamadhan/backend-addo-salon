import {
  HttpException,
  HttpStatus,
  Injectable,
  InternalServerErrorException,
} from '@nestjs/common';
import { CreateCartDto } from './dto/create-cart.dto';
import Logger from 'src/logger';
import { InjectModel } from '@nestjs/mongoose';
import { Cart, CartDocument } from 'src/schemas/cart.schema';
import { Model, Types } from 'mongoose';
import { Product, ProductDocument } from 'src/schemas/product.schema';
import {
  ProductAssets,
  ProductAssetsDocument,
} from 'src/schemas/product-assets.schema';
import { toObjectId } from 'src/utils/general';
import { UserAssets } from 'src/schemas/user-assets.schema';

@Injectable()
export class CartService {
  constructor(
    @InjectModel(Cart.name) private readonly cartModel: Model<CartDocument>,
    @InjectModel(Product.name)
    private readonly productModel: Model<ProductDocument>,
    @InjectModel(ProductAssets.name)
    private readonly productAssetModel: Model<ProductAssetsDocument>,
  ) {}

  private readonly logger = new Logger();
  async create(body: CreateCartDto, userId: string) {
    if (!body.productId || !userId) {
      this.logger.errorString(
        '[CartService - Create] Missing produk id or user id',
      );
      throw new HttpException(
        'Missing product id or user id',
        HttpStatus.BAD_REQUEST,
      );
    }

    const productObjectId = toObjectId(body.productId);
    const userObjectId = toObjectId(userId);

    if (!productObjectId || !userObjectId) {
      this.logger.errorString(
        '[CartService - Create] Invalid productId or userId',
      );
      throw new HttpException(
        'Invalid product id or user id',
        HttpStatus.BAD_REQUEST,
      );
    }

    this.checkIsInvalidDay(body.reservationDate);

    await this.checkIsNearToCloseTimeOrConflict(
      productObjectId,
      userObjectId,
      body.reservationDate,
    );

    const product = await this.productModel
      .findById(body.productId)
      .select('price -_id')
      .lean()
      .exec();

    if (product) {
      body['price'] = product.price;
    } else {
      throw new HttpException('Produk tidak ditemukan', HttpStatus.NOT_FOUND);
    }

    body.productId = productObjectId;
    body['userId'] = userObjectId;

    const data = await this.cartModel.create(body);

    return data;
  }

  async findAll(userId: string) {
    try {
      const userObjectId = toObjectId(userId);
      const result = await this.cartModel
        .find({
          userId: userObjectId,
        })
        .sort({ createdAt: -1 })
        .lean()
        .exec();

      const productIds = result.map((value) => value.productId);

      const productAssets = await this.productAssetModel
        .find({
          productId: { $in: productIds },
        })
        .lean()
        .exec();

      const assetMap = new Map(
        productAssets.map((asset) => [
          asset.productId.toString(),
          asset.publicUrl,
        ]),
      );

      const data = result.map((value) => ({
        ...value,
        assetRef: assetMap.get(value.productId.toString()),
      }));

      return data;
    } catch (error: any) {
      this.logger.errorString(error as string);
      throw new InternalServerErrorException('Gagal mengambil data keranjang');
    }
  }

  findOne(id: number) {
    return `This action returns a #${id} cart`;
  }

  // update(id: number, updateCartDto: UpdateCartDto) {
  //   return `This action updates a #${id} cart`;
  // }

  async remove(id: string) {
    const result = await this.cartModel
      .findOneAndDelete({
        _id: id,
      })
      .lean()
      .exec();

    return result;
  }

  // general function

  checkIsInvalidDay(reservationDate: Date) {
    const now = new Date(Date.now());
    reservationDate = new Date(reservationDate);

    if (reservationDate < now) {
      throw new HttpException(
        'Tidak bisa memesan tanggal yang sudah lewat',
        HttpStatus.BAD_REQUEST,
      );
    }
  }

  async checkIsNearToCloseTimeOrConflict(
    productId: Types.ObjectId,
    userId: Types.ObjectId,
    reservationDate: Date,
  ) {
    const product = await this.productModel
      .findOne({
        _id: productId,
      })
      .select('estimation')
      .lean()
      .exec();

    if (product && typeof product.estimation === 'number') {
      // const allowedOverlap = Number(process.env.ONE_HOUR);
      const durationMs = product.estimation * Number(process.env.ONE_HOUR); //customer can overlap 30 minute before the previous order done

      const startTime = new Date(reservationDate);
      const endTime = new Date(startTime.getTime() + durationMs);

      const closingTime = new Date(startTime);
      const openingTime = new Date(startTime);
      closingTime.setUTCHours(11, 0, 0, 0);
      openingTime.setUTCHours(0, 0, 0, 0);

      if (startTime.getDay() === 1) {
        throw new HttpException(
          'Hari senin salon libur. Silakan pilih jadwal lain!',
          HttpStatus.BAD_REQUEST,
        );
      }

      if (endTime > closingTime) {
        throw new HttpException(
          'Jadwal pesanan melebihi jam tutup salon',
          HttpStatus.BAD_REQUEST,
        );
      }
      if (startTime < openingTime) {
        throw new HttpException(
          'Salon belum dibuka. Pilih jam lain',
          HttpStatus.BAD_REQUEST,
        );
      }

      // The data checking must from transaction table with status "paid" and do check when user try to checkout
      // is the reservation conflict
      // const conflict = await this.cartModel.findOne({
      //   userId: { $ne: userId },
      //   $expr: {
      //     $and: [
      //       { $lt: ['$reservationDate', endTime] },
      //       {
      //         $gt: [
      //           { $add: ['$reservationDate', durationMs] },
      //           new Date(startTime.getTime() + allowedOverlap),
      //         ],
      //       },
      //     ],
      //   },
      // });

      // if (conflict) {
      //   throw new HttpException(
      //     'Jadwal pesanan bentrok  dengan pesanan lain. Pilih jadwal lain!',
      //     HttpStatus.BAD_REQUEST,
      //   );
      // }
    }
  }
}
