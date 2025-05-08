import { HttpStatus, Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { createClient, SupabaseClient } from '@supabase/supabase-js';
import Logger from 'src/logger';

@Injectable()
export class SupabaseService {
  private supabase: SupabaseClient;
  private readonly logger = new Logger();

  constructor(private config: ConfigService) {
    this.supabase = createClient(
      this.config.get<string>('SUPABASE_URL')!,
      this.config.get<string>('SUPABASE_ANON_KEY')!,
    );
  }

  getClient() {
    return this.supabase;
  }

  async uploadImage(file_path: string, file: Express.Multer.File) {
    const supabase = this.getClient();
    const bucketName = process.env.SUPABASE_BUCKET_NAME;
    if (!bucketName) {
      throw new Error('SUPABASE_BUCKET_NAME is not defined in environment');
    }

    const { data: uploadData, error } = await supabase.storage
      .from(bucketName)
      .upload(file_path, file.buffer, {
        contentType: file.mimetype,
        upsert: true,
      });

    if (!uploadData) {
      throw new Error('Image uploaded not successfully');
    }

    let publicUrl: string | undefined;
    if (uploadData) {
      publicUrl = supabase.storage
        .from(bucketName)
        .getPublicUrl(uploadData.path).data.publicUrl;
    }

    if (error) {
      this.logger.error(
        `Error occurred during upload image to supabase: ${JSON.stringify(error)}`,
      );
    } else if (uploadData && publicUrl) {
      return {
        status: HttpStatus.OK,
        url: publicUrl,
        path: uploadData.path,
      };
    } else {
      throw new Error('Failed to retrieve public URL or upload data');
    }
  }

  async deleteImage(file_path: string) {
    const supabase = this.getClient();
    const bucketName = process.env.SUPABASE_BUCKET_NAME;
    if (!bucketName) {
      throw new Error('SUPABASE_BUCKET_NAME is not defined in environment');
    }

    const { data, error } = await supabase.storage
      .from(bucketName)
      .remove([file_path]);

    if (error) {
      this.logger.error(
        `Error occurred during upload image to supabase: ${JSON.stringify(error)}`,
      );
    }

    return {
      status: HttpStatus.OK,
      data,
    };
  }
}
