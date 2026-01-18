import { Module, Global } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { R2StorageService } from './r2-storage.service';

/**
 * R2 Storage Module
 *
 * Provides R2StorageService globally for file operations.
 * Uses ConfigModule for R2 credentials.
 */
@Global()
@Module({
    imports: [ConfigModule],
    providers: [R2StorageService],
    exports: [R2StorageService],
})
export class R2StorageModule { }
