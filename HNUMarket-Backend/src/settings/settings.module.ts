import { Module } from '@nestjs/common';
import { SettingsController, PublicSettingsController } from './settings.controller';
import { SettingsService } from './settings.service';
import { SupabaseModule } from '../common/supabase/supabase.module';

@Module({
  imports: [SupabaseModule],
  controllers: [SettingsController, PublicSettingsController],
  providers: [SettingsService],
  exports: [SettingsService],
})
export class SettingsModule {}
