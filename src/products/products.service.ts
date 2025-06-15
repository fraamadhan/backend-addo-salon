import { HttpException, HttpStatus, Injectable } from '@nestjs/common';
import { ProductDto, UpdateProductDto } from './dto/product.dto';
import { InjectModel } from '@nestjs/mongoose';
import { Product, ProductDocument } from 'src/schemas/product.schema';
import {
  ProductAssets,
  ProductAssetsDocument,
} from 'src/schemas/product-assets.schema';
import { SupabaseService } from 'src/supabase/supabase.service';
import mongoose, { PaginateModel, Model, Types } from 'mongoose';
import Logger from 'src/logger';
import { prefix_public_product_file } from 'src/file-path';
import { ParamsSearchProductDto } from './dto/search.dto';
import { SortType } from 'src/types/sorttype';
import { sanitizeKeyword } from 'src/utils/sanitize-keyword';
import { Category, CategoryDocument } from 'src/schemas/category.schema';
import { ProductQuery } from 'src/types/general';
import { toObjectId } from 'src/utils/general';
@Injectable()
export class ProductsService {
  constructor(
    @InjectModel(Product.name)
    private productModel: PaginateModel<ProductDocument>,
    @InjectModel(ProductAssets.name)
    private productAssetModel: Model<ProductAssetsDocument>,
    @InjectModel(Category.name)
    private categoryModel: Model<CategoryDocument>,
    private readonly supabaseService: SupabaseService,
  ) {}

  private readonly logger = new Logger();

  async create(body: ProductDto, file: Express.Multer.File) {
    const before = Date.now();
    const category = body.categoryIds.split(',').map((val: string) => {
      return new mongoose.Types.ObjectId(val);
    });
    const data = await this.productModel.create({
      name: body.name,
      description: body.description,
      estimation: body.estimation,
      price: body.price,
      categoryIds: category,
      type: body.type,
    });

    if (!data) {
      throw new HttpException(
        'Failed to create product',
        HttpStatus.BAD_REQUEST,
      );
    }

    if (!file) {
      throw new HttpException('File is not found', HttpStatus.BAD_REQUEST);
    }

    const file_path = `${prefix_public_product_file}/${Date.now()}_${file.originalname}`;

    const uploadToSupabase = await this.supabaseService.uploadImage(
      file_path,
      file,
    );

    if (!uploadToSupabase?.path) {
      throw new HttpException(
        'Failed to upload image to server',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }

    await this.productAssetModel.create({
      type: file.mimetype,
      path: uploadToSupabase.path,
      publicUrl: uploadToSupabase.url,
      productId: data._id,
    });

    const after = Date.now();
    const duration = after - before;
    this.logger.log(`Operation create product took ${duration / 1000} seconds`);

    return data;
  }

  async findAll(params: ParamsSearchProductDto) {
    if (params.getAll) {
      const data = await this.productModel.find({}, { name: 1 }).exec();

      return data;
    }

    const page = params.page ?? 1;
    const limit = params.limit ?? 10;

    let keywordSanitized = '';
    const query: ProductQuery = {
      $and: [],
    };
    const sortby: string = params?.sortby ? params.sortby : 'updatedAt';
    const sorttype = params.sorttype === SortType.asc ? 1 : -1;

    const sort: Record<string, 1 | -1> = {
      [sortby]: sorttype,
      _id: -1,
    };

    if (params.keyword) {
      const result = sanitizeKeyword(params.keyword);

      keywordSanitized = result.keywordSanitized;
    }

    if (params.highestPrice || params.lowestPrice) {
      const priceQuery = {};
      if (params.lowestPrice) {
        priceQuery['$gte'] = params.lowestPrice;
      }
      if (params.highestPrice) {
        priceQuery['$lte'] = params.highestPrice;
      }

      query.$and.push({ price: priceQuery });
    }

    if (keywordSanitized.length !== 0) {
      query.$and.push({
        name: {
          $regex: new RegExp(`${keywordSanitized}`, 'i'),
        },
      });
    }

    if (params.type) {
      query.$and.push({
        type: params.type,
      });
    }

    if (params.rating) {
      query.$and.push({
        ratingAverage: {
          $gte: params.rating,
        },
      });
    }

    if (params.category) {
      const category = await this.categoryModel
        .findOne({ slug: params.category })
        .lean();
      if (category) {
        query.$and.push({
          categoryIds: category._id,
        });
      }
    }

    const result = await this.productModel.paginate(query, {
      page,
      limit,
      lean: true,
      sort,
      collation: {
        locale: 'en',
        strength: 1,
      },
    });

    const productAssets = await this.productAssetModel.find().lean().exec();

    const assetMap = new Map(
      productAssets.map((asset) => [
        asset.productId.toString(),
        asset.publicUrl,
      ]),
    );

    const products = result.docs.map((product) => ({
      ...product,
      assetRef: assetMap.get(product._id.toString()) || null,
    }));

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

    return {
      products,
      paginator,
    };
  }

  async findOne(id: string) {
    if (!id) {
      throw new HttpException('Missing product id', HttpStatus.BAD_REQUEST);
    }

    const data = await this.productModel
      .findById(id)
      .lean()
      .populate('categoryIds')
      .exec();

    if (!data) {
      throw new HttpException('Product not found', HttpStatus.NOT_FOUND);
    }

    const asset = await this.productAssetModel
      .findOne({
        productId: toObjectId(id),
      })
      .select('publicUrl path')
      .lean()
      .exec();

    const { categoryIds, ...product } = data;
    const result = {
      ...product,
      category: categoryIds || [],
      assetRef: asset?.publicUrl,
    };

    return result;
  }

  async update(id: string, body: UpdateProductDto, file?: Express.Multer.File) {
    const before = Date.now();
    let category: Types.ObjectId[] = [];
    if (body.categoryIds) {
      category = body.categoryIds.split(',').map((val: string) => {
        return new mongoose.Types.ObjectId(val);
      });
    } else {
      body.categoryIds = undefined;
    }

    // check id
    if (!id) {
      throw new HttpException('Product not found', HttpStatus.NOT_FOUND);
    }

    //update product
    const product = await this.productModel
      .findOneAndUpdate(
        {
          _id: id,
        },
        {
          name: body.name,
          description: body.description,
          estimation: body.estimation,
          categoryIds: category.length === 0 ? body.categoryIds : category,
          price: body.price,
          type: body.type,
          ratingCount: body.ratingCount,
          ratingAverage: body.ratingAverage,
          orderedCount: body.orderedCount,
        },
        {
          new: true,
        },
      )
      .lean()
      .exec();

    //check if image updated
    if (file) {
      const file_path = `${prefix_public_product_file}/${Date.now()}_${file.originalname}`;

      //find old asset and delete it
      const oldAsset = await this.productAssetModel
        .findOneAndDelete({
          productId: new mongoose.Types.ObjectId(id),
        })
        .select('path')
        .exec();

      if (oldAsset) {
        await this.supabaseService.deleteImage(oldAsset?.path);
      }

      const uploadToSupabase = await this.supabaseService.uploadImage(
        file_path,
        file,
      );

      if (!uploadToSupabase?.path) {
        throw new HttpException(
          'Failed to upload image to server',
          HttpStatus.INTERNAL_SERVER_ERROR,
        );
      }

      await this.productAssetModel.create({
        type: file.mimetype,
        path: uploadToSupabase.path,
        publicUrl: uploadToSupabase.url,
        productId: new mongoose.Types.ObjectId(id),
      });
    }
    const duration = Date.now() - before;

    this.logger.log(`Operation update product took ${duration / 1000} seconds`);

    return product;
  }

  async remove(id: string) {
    if (!id) {
      throw new HttpException('Missing product id', HttpStatus.BAD_REQUEST);
    }

    const result = await this.productModel
      .findOneAndDelete({
        _id: id,
      })
      .exec();

    if (!result) {
      throw new HttpException('Product not found', HttpStatus.NOT_FOUND);
    }

    const oldAsset = await this.productAssetModel
      .findOneAndDelete({
        productId: new mongoose.Types.ObjectId(id),
      })
      .exec();

    if (oldAsset) {
      await this.supabaseService.deleteImage(oldAsset.path);
    }

    return result;
  }
}
