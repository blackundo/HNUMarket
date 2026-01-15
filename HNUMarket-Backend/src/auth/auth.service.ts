import { Injectable, Logger } from '@nestjs/common';
import { SupabaseAdminService } from '../common/supabase/supabase-admin.service';

/**
 * Authentication Service
 *
 * Handles user profile retrieval and admin role verification.
 * Uses Supabase Admin client to bypass RLS policies.
 */
@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);

  constructor(private supabaseAdmin: SupabaseAdminService) {}

  /**
   * Get user profile from database
   *
   * @param userId - Supabase user ID
   * @returns User profile or null if not found
   */
  async getProfile(userId: string) {
    const supabase = this.supabaseAdmin.getClient();
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .single();

    if (error) {
      this.logger.error(
        `Failed to get profile for user ${userId}: ${error.message}`,
      );
      return null;
    }

    return data;
  }

  /**
   * Check if user has admin role
   *
   * @param userId - Supabase user ID
   * @returns true if user is admin, false otherwise
   */
  async isAdmin(userId: string): Promise<boolean> {
    const profile = await this.getProfile(userId);
    return profile?.role === 'admin';
  }
}
