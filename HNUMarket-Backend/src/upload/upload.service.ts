import { Injectable, BadRequestException, Logger } from '@nestjs/common';
import { SupabaseAdminService } from '../common/supabase/supabase-admin.service';
import { v4 as uuidv4 } from 'uuid';

/**
 * Upload Service
 *
 * Handles file uploads to Supabase Storage with validation.
 * Uses admin service key to bypass RLS for uploads.
 */
@Injectable()
export class UploadService {
  private readonly logger = new Logger(UploadService.name);
  private readonly bucket = 'products';
  private readonly allowedMimeTypes = [
    'image/jpeg',
    'image/png',
    'image/webp',
    'image/gif',
  ];
  private readonly maxSize = 5 * 1024 * 1024; // 5MB

  private bucketInitialized = false;

  constructor(private supabaseAdmin: SupabaseAdminService) { }

  /**
   * Ensure bucket exists, create if not
   */
  private async ensureBucketExists(): Promise<void> {
    if (this.bucketInitialized) {
      return;
    }

    const supabase = this.supabaseAdmin.getClient();

    // Check if bucket exists
    const { data: buckets, error: listError } = await supabase.storage.listBuckets();

    if (listError) {
      this.logger.error(`Failed to list buckets: ${listError.message}`);
      throw new BadRequestException(`Storage error: ${listError.message}`);
    }

    const bucketExists = buckets?.some((b) => b.name === this.bucket);

    if (!bucketExists) {
      // Create bucket
      const { data, error: createError } = await supabase.storage.createBucket(
        this.bucket,
        {
          public: true, // Make bucket public for image access
          fileSizeLimit: this.maxSize,
          allowedMimeTypes: this.allowedMimeTypes,
        },
      );

      if (createError) {
        this.logger.error(`Failed to create bucket: ${createError.message}`);
        throw new BadRequestException(
          `Failed to create storage bucket: ${createError.message}`,
        );
      }

      this.logger.log(`Bucket "${this.bucket}" created successfully`);
    } else {
      this.logger.log(`Bucket "${this.bucket}" already exists`);
    }

    this.bucketInitialized = true;
  }

  /**
   * Upload single file to Supabase Storage
   *
   * @param file - Multer file object
   * @returns Public URL of uploaded file
   * @throws BadRequestException if validation fails
   */
  async uploadFile(file: Express.Multer.File): Promise<string> {
    // Ensure bucket exists before upload
    await this.ensureBucketExists();
    // Validate file type
    if (!this.allowedMimeTypes.includes(file.mimetype)) {
      throw new BadRequestException(
        'Invalid file type. Allowed: jpg, png, webp, gif',
      );
    }

    // Validate file size
    if (file.size > this.maxSize) {
      throw new BadRequestException('File too large. Max size: 5MB');
    }

    const supabase = this.supabaseAdmin.getClient();
    const ext = file.originalname.split('.').pop();
    const filename = `${uuidv4()}.${ext}`;
    const path = `uploads/${filename}`;

    // Upload to Supabase Storage
    const { data, error } = await supabase.storage
      .from(this.bucket)
      .upload(path, file.buffer, {
        contentType: file.mimetype,
        upsert: false,
      });

    if (error) {
      this.logger.error(`Upload failed: ${error.message}`);
      throw new BadRequestException(error.message);
    }

    // Get public URL
    const { data: urlData } = supabase.storage
      .from(this.bucket)
      .getPublicUrl(path);

    this.logger.log(`File uploaded: ${path}`);
    return urlData.publicUrl;
  }

  /**
   * Delete file from Supabase Storage
   *
   * @param url - Public URL of file to delete
   */
  async deleteFile(url: string): Promise<void> {
    const supabase = this.supabaseAdmin.getClient();

    // Extract path from URL
    const urlParts = url.split(`${this.bucket}/`);
    if (urlParts.length < 2) {
      this.logger.warn(`Invalid URL format: ${url}`);
      return;
    }

    const path = urlParts[1];

    const { error } = await supabase.storage.from(this.bucket).remove([path]);

    if (error) {
      this.logger.error(`Failed to delete file: ${error.message}`);
    } else {
      this.logger.log(`File deleted: ${path}`);
    }
  }
}
