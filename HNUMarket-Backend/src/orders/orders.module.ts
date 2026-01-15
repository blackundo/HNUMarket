import { Module } from '@nestjs/common';
import { OrdersController } from './orders.controller';
import { OrdersService } from './orders.service';
import { SupabaseModule } from '../common/supabase/supabase.module';
import { AuthModule } from '../auth/auth.module';

/**
 * Orders Module
 *
 * Provides order management functionality with normalized variant support
 */
@Module({
  imports: [SupabaseModule, AuthModule],
  controllers: [OrdersController],
  providers: [OrdersService],
  exports: [OrdersService],
})
export class OrdersModule {}
