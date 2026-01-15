import { Module } from '@nestjs/common';
import { PassportModule } from '@nestjs/passport';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { SupabaseJwtStrategy } from './strategies/supabase-jwt.strategy';
import { JwtAuthGuard } from './guards/jwt-auth.guard';
import { AdminGuard } from './guards/admin.guard';
import { OptionalJwtAuthGuard } from './guards/optional-jwt-auth.guard';

/**
 * Authentication Module
 *
 * Provides JWT-based authentication using Supabase tokens.
 * Exports guards for use in other modules.
 *
 * @module AuthModule
 */
@Module({
  imports: [PassportModule.register({ defaultStrategy: 'supabase-jwt' })],
  controllers: [AuthController],
  providers: [
    AuthService,
    SupabaseJwtStrategy,
    JwtAuthGuard,
    AdminGuard,
    OptionalJwtAuthGuard,
  ],
  exports: [AuthService, JwtAuthGuard, AdminGuard, OptionalJwtAuthGuard],
})
export class AuthModule {}
