import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { createClient, SupabaseClient } from '@supabase/supabase-js';

@Injectable()
export class SupabaseAdminService {
  private client: SupabaseClient;

  constructor(private configService: ConfigService) {
    const supabaseUrl = this.configService.get<string>('supabase.url');
    const serviceKey = this.configService.get<string>('supabase.serviceKey');

    this.client = createClient(supabaseUrl, serviceKey);
  }

  getClient(): SupabaseClient {
    return this.client;
  }
}
