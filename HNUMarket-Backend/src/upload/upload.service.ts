import { Injectable, BadRequestException, Logger } from '@nestjs/common';
import { R2StorageService } from '../common/storage/r2-storage.service';
import * as sharp from 'sharp';

/**
 * Upload Service
 *
 * Handles file uploads to Cloudflare R2 Storage with validation.
 */
@Injectable()
export class UploadService {
  private readonly logger = new Logger(UploadService.name);
  private readonly allowedMimeTypes = [
    'image/jpeg',
    'image/png',
    'image/webp',
    'image/gif',
  ];
  private readonly maxSize = 5 * 1024 * 1024; // 5MB

  constructor(private r2Storage: R2StorageService) { }

  /**
   * Upload single file to R2 Storage
   *
   * @param file - Multer file object
   * @returns Path of uploaded file (e.g., 'uploads/uuid.webp')
   * @throws BadRequestException if validation fails
   */
  async uploadFile(file: Express.Multer.File): Promise<string> {
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

    try {
      // Optmize image with Sharp
      const optimizedBuffer = await sharp(file.buffer)
        .resize(1920, 1920, {
          fit: 'inside',
          withoutEnlargement: true,
        })
        .webp({ quality: 80 })
        .toBuffer();

      // Change extension and mimetype to webp
      // Replace extension or append if none
      const originalNameWithoutExt = file.originalname.replace(/\.[^/.]+$/, '');
      const newFilename = `${originalNameWithoutExt}.webp`;
      const newMimeType = 'image/webp';

      const url = await this.r2Storage.uploadFile(
        optimizedBuffer,
        newFilename,
        newMimeType,
        'uploads',
      );

      this.logger.log(`File uploaded and optimized: ${newFilename}`);
      return url;
    } catch (error) {
      this.logger.error(`Upload failed: ${error.message}`);
      throw new BadRequestException(`Upload failed: ${error.message}`);
    }
  }

  /**
   * Delete file from R2 Storage
   *
   * @param url - Path or full URL of file to delete
   */
  async deleteFile(url: string): Promise<void> {
    try {
      await this.r2Storage.deleteFileByUrl(url);
      this.logger.log(`File deleted: ${url}`);
    } catch (error) {
      this.logger.error(`Failed to delete file: ${error.message}`);
      // Don't throw - file may already be deleted
    }
  }
}
