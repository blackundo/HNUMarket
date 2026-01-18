import {
  Injectable,
  CanActivate,
  ExecutionContext,
  ForbiddenException,
} from '@nestjs/common';
import { SupabaseAdminService } from '../../common/supabase/supabase-admin.service';

/**
 * Admin Role Guard
 *
 * Verifies that authenticated user has admin role in database.
 * Must be used after JwtAuthGuard to ensure user is authenticated.
 *
 * @example
 * ```typescript
 * @UseGuards(JwtAuthGuard, AdminGuard)
 * @Controller('admin/products')
 * export class ProductsController { ... }
 * ```
 *
 * @throws ForbiddenException if user is not admin
 */
@Injectable()
export class AdminGuard implements CanActivate {
  constructor(private supabaseAdmin: SupabaseAdminService) {}

  /**
   * Checks if user has admin role in database
   *
   * @param context - Execution context with request
   * @returns true if user is admin
   * @throws ForbiddenException if not admin or database error
   */
  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    const user = request.user;

    if (!user?.id) {
      throw new ForbiddenException('User not authenticated');
    }

    const supabase = this.supabaseAdmin.getClient();
    const { data: profile, error } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single();

    if (error) {
      throw new ForbiddenException('Error verifying admin access');
    }

    if (profile?.role !== 'admin') {
      throw new ForbiddenException('Admin access required');
    }

    // Attach full profile to request for use in controllers
    request.user = { ...user, role: profile.role };

    return true;
  }
}
