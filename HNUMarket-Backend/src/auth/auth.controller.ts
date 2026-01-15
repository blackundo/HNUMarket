import { Controller, Get, UseGuards, Logger } from '@nestjs/common';
import { AuthService } from './auth.service';
import { JwtAuthGuard } from './guards/jwt-auth.guard';
import { AdminGuard } from './guards/admin.guard';
import { CurrentUser, AuthUser } from './decorators/current-user.decorator';

/**
 * Authentication Controller
 *
 * Endpoints for authentication and authorization verification.
 * All routes require authentication via JWT token.
 */
@Controller('auth')
export class AuthController {
  private readonly logger = new Logger(AuthController.name);

  constructor(private authService: AuthService) {}

  /**
   * Get current user profile
   *
   * @param user - Authenticated user from JWT token
   * @returns User profile from database
   *
   * @example
   * GET /api/auth/me
   * Authorization: Bearer <jwt-token>
   */
  @Get('me')
  @UseGuards(JwtAuthGuard)
  async getMe(@CurrentUser() user: AuthUser) {
    this.logger.debug(`Getting profile for user ${user.id}`);

    const profile = await this.authService.getProfile(user.id);

    return {
      user: profile,
    };
  }

  /**
   * Verify admin access
   *
   * Returns 200 if user is admin, 403 if not.
   * Used by frontend to verify admin privileges.
   *
   * @param user - Authenticated admin user
   * @returns Admin confirmation message
   *
   * @example
   * GET /api/auth/admin/verify
   * Authorization: Bearer <jwt-token>
   */
  @Get('admin/verify')
  @UseGuards(JwtAuthGuard, AdminGuard)
  async verifyAdmin(@CurrentUser() user: AuthUser) {
    this.logger.log(`Admin access verified for user ${user.id}`);

    return {
      message: 'Admin verified',
      user: {
        id: user.id,
        email: user.email,
        role: user.role,
      },
    };
  }
}
