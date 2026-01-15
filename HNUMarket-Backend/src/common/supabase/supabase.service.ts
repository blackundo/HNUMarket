import { Injectable, Inject, Scope } from '@nestjs/common';
import { REQUEST } from '@nestjs/core';
import { ConfigService } from '@nestjs/config';
import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { Request } from 'express';

@Injectable({ scope: Scope.REQUEST })
export class SupabaseService {
  private client: SupabaseClient;

  constructor(
    @Inject(REQUEST) private request: Request,
    private configService: ConfigService,
  ) {
    const supabaseUrl = this.configService.get<string>('supabase.url');
    const supabaseKey = this.configService.get<string>('supabase.anonKey');
    const authHeader = this.request.headers['authorization'] || '';

    this.client = createClient(supabaseUrl, supabaseKey, {
      global: {
        headers: { Authorization: authHeader },
      },
    });
  }

  getClient(): SupabaseClient {
    return this.client;
  }
}
