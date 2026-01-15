import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { ConfigService } from '@nestjs/config';

/**
 * JWT payload structure from Supabase Auth tokens
 */
interface JwtPayload {
  sub: string;       // User ID
  email: string;     // User email
  role?: string;     // User role (from metadata)
  aud: string;       // Audience
  exp: number;       // Expiration timestamp
}

/**
 * Supabase JWT authentication strategy for Passport
 *
 * Validates JWT tokens issued by Supabase Auth and extracts user information.
 * Tokens are extracted from Authorization header using Bearer scheme.
 *
 * @example
 * Authorization: Bearer <jwt-token>
 */
@Injectable()
export class SupabaseJwtStrategy extends PassportStrategy(
  Strategy,
  'supabase-jwt',
) {
  constructor(private configService: ConfigService) {
    const supabaseUrl = configService.get<string>('supabase.url');
    const jwtSecret = configService.get<string>('supabase.jwtSecret');

    if (!jwtSecret) {
      throw new Error(
        'SUPABASE_JWT_SECRET is required for JWT authentication. ' +
          'Get it from: Supabase Dashboard > Settings > API > JWT Secret',
      );
    }

    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: jwtSecret,
      issuer: `${supabaseUrl}/auth/v1`,
    });
  }

  /**
   * Validates JWT payload and extracts user information
   *
   * @param payload - Decoded JWT payload from Supabase
   * @returns User object to be attached to request
   * @throws UnauthorizedException if payload is invalid
   */
  async validate(payload: JwtPayload) {
    if (!payload.sub) {
      throw new UnauthorizedException('Invalid token: missing user ID');
    }

    // Return minimal user data - AdminGuard will fetch full profile
    return {
      id: payload.sub,
      email: payload.email,
    };
  }
}
