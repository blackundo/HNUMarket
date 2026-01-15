import { createParamDecorator, ExecutionContext } from '@nestjs/common';

/**
 * Authenticated user shape attached to request by guards
 */
export interface AuthUser {
  id: string;       // User ID from Supabase
  email: string;    // User email
  role?: string;    // User role (added by AdminGuard)
}

/**
 * CurrentUser Parameter Decorator
 *
 * Extracts authenticated user from request object populated by guards.
 * Use after JwtAuthGuard to access user data.
 *
 * @example
 * ```typescript
 * // Get full user object
 * @Get('profile')
 * @UseGuards(JwtAuthGuard)
 * async getProfile(@CurrentUser() user: AuthUser) {
 *   return user;
 * }
 *
 * // Get specific field
 * @Get('email')
 * @UseGuards(JwtAuthGuard)
 * async getEmail(@CurrentUser('email') email: string) {
 *   return { email };
 * }
 * ```
 */
export const CurrentUser = createParamDecorator(
  (
    data: keyof AuthUser | undefined,
    ctx: ExecutionContext,
  ): AuthUser | string => {
    const request = ctx.switchToHttp().getRequest();
    const user = request.user as AuthUser;

    // Return specific field if requested
    if (data) {
      return user[data];
    }

    // Return full user object
    return user;
  },
);
