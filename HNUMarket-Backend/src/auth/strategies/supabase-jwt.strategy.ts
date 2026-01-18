import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { ConfigService } from '@nestjs/config';
import * as jwksRsa from 'jwks-rsa';

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
    const jwksUri = configService.get<string>('supabase.jwksUri');
    const jwtSecret = configService.get<string>('supabase.jwtSecret');
    const apiKey =
      configService.get<string>('supabase.serviceKey') ||
      configService.get<string>('supabase.anonKey');

    if (!supabaseUrl) {
      throw new Error(
        'SUPABASE_URL is required for JWT authentication. ' +
          'Check Supabase Dashboard > Settings > API.',
      );
    }

    if (!jwksUri && !jwtSecret) {
      throw new Error(
        'Missing JWT verification configuration. ' +
          'Provide SUPABASE_URL for JWKS (preferred) or SUPABASE_JWT_SECRET as a fallback.',
      );
    }

    const jwksSecretProvider = jwksUri
      ? jwksRsa.passportJwtSecret({
          cache: true,
          rateLimit: true,
          jwksRequestsPerMinute: 10,
          jwksUri,
          requestHeaders: apiKey
            ? {
                apikey: apiKey,
                Authorization: `Bearer ${apiKey}`,
              }
            : undefined,
        })
      : null;

    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      issuer: `${supabaseUrl}/auth/v1`,
      algorithms: ['ES256', 'RS256', 'HS256'],
      secretOrKeyProvider: (request, rawJwt, done) => {
        try {
          const [encodedHeader] = rawJwt.split('.');
          const header = JSON.parse(
            Buffer.from(encodedHeader, 'base64url').toString('utf8'),
          );
          const alg = header?.alg as string | undefined;

          const wantsSymmetric = alg?.startsWith('HS');
          if (wantsSymmetric) {
            if (!jwtSecret) {
              return done(
                new UnauthorizedException(
                  'No HS secret configured for token verification',
                ),
              );
            }
            return done(null, jwtSecret);
          }

          if (!jwksSecretProvider) {
            return done(
              new UnauthorizedException(
                'JWKS is required to verify this token algorithm',
              ),
            );
          }

          jwksSecretProvider(request, rawJwt, (error, key) => {
            if (error) {
              return done(error);
            }
            return done(null, key);
          });
        } catch (error) {
          return done(error as Error);
        }
      },
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
