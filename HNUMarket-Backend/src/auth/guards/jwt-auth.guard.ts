import {
  Injectable,
  ExecutionContext,
  UnauthorizedException,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';

/**
 * JWT Authentication Guard for protecting routes
 *
 * Validates JWT tokens using the SupabaseJwtStrategy and attaches
 * user information to the request object.
 *
 * @example
 * ```typescript
 * @Get('profile')
 * @UseGuards(JwtAuthGuard)
 * async getProfile(@CurrentUser() user: AuthUser) {
 *   return user;
 * }
 * ```
 *
 * @throws UnauthorizedException if token is missing or invalid
 */
@Injectable()
export class JwtAuthGuard extends AuthGuard('supabase-jwt') {
  /**
   * Activates the guard - delegates to Passport strategy
   */
  canActivate(context: ExecutionContext) {
    return super.canActivate(context);
  }

  /**
   * Handles the authentication result from Passport
   *
   * @param err - Error from strategy
   * @param user - User object from strategy validate()
   * @param info - Additional info from strategy
   * @returns Validated user object
   * @throws UnauthorizedException if authentication fails
   */
  handleRequest(err: any, user: any, info: any) {
    if (err || !user) {
      throw err || new UnauthorizedException('Authentication required');
    }
    return user;
  }
}
