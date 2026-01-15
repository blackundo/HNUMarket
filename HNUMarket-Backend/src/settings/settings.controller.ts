import { Controller, Get, Post, Delete, Body, Param, Query, UseGuards } from '@nestjs/common';
import { IsNotEmpty, IsObject } from 'class-validator';
import { SettingsService } from './settings.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { AdminGuard } from '../auth/guards/admin.guard';

export class UpdateSettingsDto {
  @IsNotEmpty()
  @IsObject()
  settings: Record<string, { value: any; category?: string }>;
}

// Public settings endpoint for storefront
@Controller('storefront/settings')
export class PublicSettingsController {
  constructor(private settingsService: SettingsService) {}

  /**
   * Get public settings (no auth required)
   * Only returns specific public settings
   */
  @Get('public')
  async getPublicSettings() {
    const publicKeys = [
      'messenger_page_id',
      'cart_items_notes',
      'cart_checkout_notes',
    ];
    const settings: Record<string, any> = {};

    for (const key of publicKeys) {
      const value = await this.settingsService.get(key);
      if (value !== null) {
        settings[key] = value;
      }
    }

    return settings;
  }
}

// Admin settings endpoint (protected)
@Controller('admin/settings')
@UseGuards(JwtAuthGuard, AdminGuard)
export class SettingsController {
  constructor(private settingsService: SettingsService) {}

  @Get()
  getAll(@Query('category') category?: string) {
    if (category) {
      return this.settingsService.getByCategory(category);
    }
    return this.settingsService.getAll();
  }

  @Get(':key')
  get(@Param('key') key: string) {
    return this.settingsService.get(key);
  }

  @Post()
  updateMany(@Body() dto: UpdateSettingsDto) {
    return this.settingsService.updateMany(dto.settings);
  }

  @Delete(':key')
  delete(@Param('key') key: string) {
    return this.settingsService.delete(key);
  }
}
