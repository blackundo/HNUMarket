import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import {
    S3Client,
    PutObjectCommand,
    DeleteObjectCommand,
} from '@aws-sdk/client-s3';
import { v4 as uuidv4 } from 'uuid';

/**
 * R2 Storage Service
 *
 * Handles file uploads to Cloudflare R2 (S3-compatible) storage.
 * R2 provides zero egress fees and Cloudflare CDN integration.
 */
@Injectable()
export class R2StorageService {
    private readonly logger = new Logger(R2StorageService.name);
    private readonly client: S3Client;
    private readonly bucketName: string;
    private readonly publicUrl: string;

    constructor(private configService: ConfigService) {
        const accountId = this.configService.get<string>('R2_ACCOUNT_ID');
        const accessKeyId = this.configService.get<string>('R2_ACCESS_KEY_ID');
        const secretAccessKey = this.configService.get<string>('R2_SECRET_ACCESS_KEY');

        this.bucketName = this.configService.get<string>('R2_BUCKET_NAME', 'products');
        this.publicUrl = this.configService.get<string>('R2_PUBLIC_URL', '');

        // Initialize S3 client with R2 endpoint
        this.client = new S3Client({
            region: 'auto',
            endpoint: `https://${accountId}.r2.cloudflarestorage.com`,
            credentials: {
                accessKeyId: accessKeyId || '',
                secretAccessKey: secretAccessKey || '',
            },
        });

        this.logger.log('R2 Storage Service initialized');
    }

    /**
     * Upload file to R2 bucket
     *
     * @param buffer - File buffer
     * @param originalName - Original filename (for extension)
     * @param contentType - MIME type
     * @param folder - Optional folder path (e.g., 'uploads')
     * @returns Public URL of uploaded file
     */
    async uploadFile(
        buffer: Buffer,
        originalName: string,
        contentType: string,
        folder: string = 'uploads',
    ): Promise<string> {
        const ext = originalName.split('.').pop() || 'jpg';
        const key = `${folder}/${uuidv4()}.${ext}`;

        const command = new PutObjectCommand({
            Bucket: this.bucketName,
            Key: key,
            Body: buffer,
            ContentType: contentType,
        });

        try {
            await this.client.send(command);
            const url = this.getPublicUrl(key);
            this.logger.log(`File uploaded: ${key}`);
            return url;
        } catch (error) {
            this.logger.error(`Upload failed: ${error.message}`);
            throw error;
        }
    }

    /**
     * Delete file from R2 bucket
     *
     * @param key - Object key (path in bucket)
     */
    async deleteFile(key: string): Promise<void> {
        const command = new DeleteObjectCommand({
            Bucket: this.bucketName,
            Key: key,
        });

        try {
            await this.client.send(command);
            this.logger.log(`File deleted: ${key}`);
        } catch (error) {
            this.logger.error(`Delete failed: ${error.message}`);
            // Don't throw on delete failures - file may already be gone
        }
    }

    /**
     * Delete file by its public URL
     *
     * @param url - Public URL of file
     */
    async deleteFileByUrl(url: string): Promise<void> {
        const key = this.extractKeyFromUrl(url);
        if (key) {
            await this.deleteFile(key);
        } else {
            this.logger.warn(`Could not extract key from URL: ${url}`);
        }
    }

    /**
     * Get public URL for an object key
     */
    getPublicUrl(key: string): string {
        // Remove trailing slash from publicUrl if present
        const baseUrl = this.publicUrl.replace(/\/$/, '');
        return `${baseUrl}/${key}`;
    }

    /**
     * Extract object key from public URL
     */
    extractKeyFromUrl(url: string): string | null {
        try {
            const urlObj = new URL(url);
            // Remove leading slash from pathname
            return urlObj.pathname.replace(/^\//, '');
        } catch {
            return null;
        }
    }
}
