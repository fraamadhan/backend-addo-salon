import {
  HttpException,
  HttpStatus,
  Injectable,
  InternalServerErrorException,
} from '@nestjs/common';
import {
  CreateCartDto,
  UpdateCartDto,
  UpdateCheckoutCartDto,
} from './dto/create-cart.dto';
import Logger from 'src/logger';
import { InjectConnection, InjectModel } from '@nestjs/mongoose';
import { Cart, CartDocument } from 'src/schemas/cart.schema';
import mongoose, { Model } from 'mongoose';
import { Product, ProductDocument } from 'src/schemas/product.schema';
import {
  ProductAssets,
  ProductAssetsDocument,
} from 'src/schemas/product-assets.schema';
import { toObjectId } from 'src/utils/general';
import {
  Transaction,
  TransactionDocument,
} from 'src/schemas/transaction.schema';
import { ReservationStatus } from 'src/types/enum';
import { TransactionItems } from 'src/schemas/transaction-items.schema';

@Injectable()
export class CartService {
  constructor(
    @InjectModel(Cart.name) private readonly cartModel: Model<CartDocument>,
    @InjectModel(Product.name)
    private readonly productModel: Model<ProductDocument>,
    @InjectModel(ProductAssets.name)
    private readonly productAssetModel: Model<ProductAssetsDocument>,
    @InjectModel(Transaction.name)
    private readonly transactionModel: Model<TransactionDocument>,
    @InjectModel(TransactionItems.name)
    private readonly transactionItemModel: Model<TransactionDocument>,
    @InjectConnection() private readonly connection: mongoose.Connection,
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
      body.reservationDate,
      body.estimation,
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
        .populate('productId', 'estimation name')
        .sort({ createdAt: -1 })
        .lean()
        .exec();

      const productIds = result.map((value) => value.productId._id);

      const productAssets = await this.productAssetModel
        .find({
          productId: { $in: productIds },
        })
        .lean()
        .exec();

      const assetMap = new Map(
        productAssets.map((asset) => [
          asset.productId._id.toString(),
          asset.publicUrl,
        ]),
      );

      const data = result.map((value) => {
        const { productId: product, ...rest } = value;

        return {
          ...rest,
          product,
          assetRef: assetMap.get(value.productId._id.toString()) || null,
        };
      });

      return data;
    } catch (error: any) {
      this.logger.errorString(error as string);
      throw new InternalServerErrorException('Gagal mengambil data keranjang');
    }
  }

  async findOne(id: string, userId: string) {
    if (!id) {
      throw new HttpException('Missing cart id', HttpStatus.BAD_REQUEST);
    }
    const userObjectId = toObjectId(userId);

    const data = await this.cartModel
      .findOne({ _id: id, userId: userObjectId })
      .lean()
      .exec();

    if (!data) {
      throw new HttpException('Item not found in cart', HttpStatus.NOT_FOUND);
    }
    const assetRef = await this.productAssetModel
      .findOne({
        productId: id,
      })
      .select('path publicUrl')
      .lean()
      .exec();

    return { ...data, assetRef };
  }

  async update(id: string, body: UpdateCartDto) {
    const data = await this.cartModel.findOneAndUpdate({ _id: id }, body);

    if (!data) {
      throw new HttpException('Item in cart not found', HttpStatus.BAD_REQUEST);
    }

    return data;
  }

  async remove(id: string) {
    const result = await this.cartModel
      .findOneAndDelete({
        _id: id,
      })
      .lean()
      .exec();

    if (!result) {
      throw new HttpException('Item in cart not found', HttpStatus.NOT_FOUND);
    }

    return result;
  }

  async checkout(body: UpdateCheckoutCartDto, userId: string) {
    const items = body.items;
    const userObjectId = toObjectId(userId);
    if (!userObjectId) {
      throw new HttpException('Missing user id', HttpStatus.BAD_REQUEST);
    }

    const session = await this.connection.startSession();
    session.startTransaction();
    try {
      const updatedItems: Array<{
        cartId: mongoose.Types.ObjectId;
        productId: mongoose.Types.ObjectId;
        reservationDate: Date;
        note: string;
        estimation: number;
        price: number;
      }> = [];

      for (const item of items) {
        if (!item.productId || !item.cartId || !item.reservationDate) {
          throw new HttpException(
            'Missing cart id or product id or reservation date',
            HttpStatus.BAD_REQUEST,
          );
        }

        const cartObjectId = toObjectId(item.cartId);
        const productObjectId = toObjectId(item.productId);

        if (!productObjectId) {
          throw new HttpException(
            'Failed to convert product id to object id',
            HttpStatus.BAD_REQUEST,
          );
        }

        await this.checkIsNearToCloseTimeOrConflict(
          item.reservationDate,
          item.estimation,
          'Terdapat item yang bentrok dengan pesanan pengguna lain. Silakan cek kembali jadwal pesanan dan ubah jadwal pesanan',
        );

        const updateCart = await this.cartModel
          .findOneAndUpdate(
            {
              _id: cartObjectId,
              productId: productObjectId,
              userId: userObjectId,
            },
            { $set: { isCheckoutLocked: true } },
            { new: true, session },
          )
          .select('_id productId userId reservationDate price isCheckoutLocked')
          .lean()
          .exec();

        if (updateCart) {
          updatedItems.push({
            cartId: updateCart._id,
            productId: updateCart.productId,
            reservationDate: updateCart.reservationDate,
            note: item.note || '',
            estimation: item.estimation,
            price: updateCart.price,
          });
        }
      }

      await session.commitTransaction();
      const data = updatedItems.filter(Boolean);

      return data;
    } catch (error: any) {
      this.logger.errorString(`[CartService - checkout] ${error as string}`);
      await session.abortTransaction();
      throw error;
    } finally {
      await session.endSession();
    }
  }

  // general function
  checkIsInvalidDay(reservationDate: Date) {
    const now = new Date(Date.now());
    reservationDate = new Date(reservationDate);

    if (reservationDate < now) {
      throw new HttpException(
        'Tidak bisa memesan tanggal yang sudah lewat',
        HttpStatus.UNPROCESSABLE_ENTITY,
      );
    }
  }

  async checkIsNearToCloseTimeOrConflict(
    reservationDate: Date,
    estimation: number,
    message: string = '',
  ) {
    const allowedOverlap = Number(process.env.ONE_HOUR);
    const durationMs = estimation * Number(process.env.ONE_HOUR); //customer can overlap one hour before the previous order done

    const startTime = new Date(reservationDate);
    const endTime = new Date(startTime.getTime() + durationMs);

    const closingTime = new Date(startTime);
    const openingTime = new Date(startTime);
    closingTime.setUTCHours(11, 0, 0, 0);
    openingTime.setUTCHours(0, 0, 0, 0);

    if (startTime.getDay() === 1) {
      throw new HttpException(
        'Hari senin salon libur. Silakan pilih jadwal lain!',
        HttpStatus.UNPROCESSABLE_ENTITY,
      );
    }

    if (endTime > closingTime || startTime < openingTime) {
      throw new HttpException(
        'Jadwal pesanan melebihi jam tutup salon atau salon belum buka. Pilih jadwal lain',
        HttpStatus.UNPROCESSABLE_ENTITY,
      );
    }

    // The data checking must from transaction table with status "paid" and do check when user try to checkout
    // is the reservation conflict
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
        $match: {
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
        },
      },
      { $limit: 1 },
    ]);

    if (conflict.length !== 0) {
      const conflictItem = conflict[0] as {
        reservationDate?: string | number | Date;
      };

      throw new HttpException(
        `${message.length !== 0 ? `${message}. Jadwal Bentrok: ${conflictItem?.reservationDate ? new Date(conflictItem.reservationDate).toLocaleString() : ''}` : `Jadwal pesanan anda pada bentrok dengan jadwal pesanan pada waktu ${conflictItem?.reservationDate ? new Date(conflictItem.reservationDate).toLocaleString() : ''}. Pilih jadwal lain!`}`,
        HttpStatus.CONFLICT,
      );
    }
  }
}
