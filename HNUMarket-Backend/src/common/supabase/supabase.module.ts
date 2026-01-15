import { Global, Module } from '@nestjs/common';
import { SupabaseService } from './supabase.service';
import { SupabaseAdminService } from './supabase-admin.service';

@Global()
@Module({
  providers: [SupabaseService, SupabaseAdminService],
  exports: [SupabaseService, SupabaseAdminService],
})
export class SupabaseModule {}
