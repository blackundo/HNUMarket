import {
  Controller,
  Post,
  UseGuards,
  UseInterceptors,
  UploadedFile,
  UploadedFiles,
  Logger,
} from '@nestjs/common';
import { FileInterceptor, FilesInterceptor } from '@nestjs/platform-express';
import { UploadService } from './upload.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { AdminGuard } from '../auth/guards/admin.guard';

/**
 * Upload Controller
 *
 * Admin-only endpoints for file uploads to Supabase Storage.
 * All routes require JWT authentication + admin role.
 *
 * @route /api/admin/upload
 */
@Controller('admin/upload')
@UseGuards(JwtAuthGuard, AdminGuard)
export class UploadController {
  private readonly logger = new Logger(UploadController.name);

  constructor(private uploadService: UploadService) {}

  /**
   * Upload single file
   *
   * @example
   * POST /api/admin/upload/single
   * Content-Type: multipart/form-data
   * Body: { file: <file> }
   * Response: { url: 'uploads/uuid.jpg' }
   */
  @Post('single')
  @UseInterceptors(FileInterceptor('file'))
  async uploadSingle(@UploadedFile() file: Express.Multer.File) {
    this.logger.log(`Uploading single file: ${file.originalname}`);
    const url = await this.uploadService.uploadFile(file);
    return { url };
  }

  /**
   * Upload multiple files (max 10)
   *
   * @example
   * POST /api/admin/upload/multiple
   * Content-Type: multipart/form-data
   * Body: { files: [<file1>, <file2>, ...] }
   * Response: { urls: ['uploads/uuid1.jpg', 'uploads/uuid2.jpg'] }
   */
  @Post('multiple')
  @UseInterceptors(FilesInterceptor('files', 10))
  async uploadMultiple(@UploadedFiles() files: Express.Multer.File[]) {
    this.logger.log(`Uploading ${files.length} files`);
    const urls = await Promise.all(
      files.map((file) => this.uploadService.uploadFile(file)),
    );
    return { urls };
  }
}
