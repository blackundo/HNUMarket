import { Controller, Get, HttpStatus, Logger, HttpException } from '@nestjs/common';
import { SupabaseAdminService } from '../common/supabase/supabase-admin.service';

@Controller('health')
export class HealthController {
  private readonly logger = new Logger(HealthController.name);

  constructor(private supabaseAdmin: SupabaseAdminService) {}

  @Get()
  async check() {
    const timestamp = new Date().toISOString();

    try {
      const supabase = this.supabaseAdmin.getClient();

      // Simple connectivity check without exposing schema
      const { error } = await supabase.from('settings').select('count').limit(1).single();

      if (error && error.code !== 'PGRST116') {
        // Log error for debugging but don't expose details
        this.logger.error(`Supabase health check failed: ${error.message}`);

        throw new HttpException(
          {
            status: 'unhealthy',
            timestamp,
            database: 'disconnected',
            message: 'Database connection failed',
          },
          HttpStatus.SERVICE_UNAVAILABLE,
        );
      }

      return {
        status: 'healthy',
        timestamp,
        database: 'connected',
      };
    } catch (error) {
      if (error instanceof HttpException) {
        throw error;
      }

      this.logger.error(`Health check error: ${error.message}`);

      throw new HttpException(
        {
          status: 'unhealthy',
          timestamp,
          database: 'error',
          message: 'Health check failed',
        },
        HttpStatus.SERVICE_UNAVAILABLE,
      );
    }
  }
}
