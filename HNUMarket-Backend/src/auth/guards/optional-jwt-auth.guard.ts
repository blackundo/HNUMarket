import { Injectable } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';

/**
 * Optional JWT Authentication Guard
 *
 * Attaches user to request if token is valid, but allows guests.
 */
@Injectable()
export class OptionalJwtAuthGuard extends AuthGuard('supabase-jwt') {
  handleRequest(err: any, user: any) {
    if (err) {
      return null;
    }
    return user || null;
  }
}
