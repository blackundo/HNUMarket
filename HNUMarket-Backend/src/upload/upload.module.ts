import { Module } from '@nestjs/common';
import { MulterModule } from '@nestjs/platform-express';
import { UploadController } from './upload.controller';
import { UploadService } from './upload.service';

/**
 * Upload Module
 *
 * Provides file upload functionality with Multer and Cloudflare R2 Storage.
 * Uses memory storage for direct upload to R2.
 */
@Module({
  imports: [
    MulterModule.register({
      storage: null, // Use memory storage - files stored in buffer
    }),
  ],
  controllers: [UploadController],
  providers: [UploadService],
  exports: [UploadService],
})
export class UploadModule { }
