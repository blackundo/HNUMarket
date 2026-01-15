import { Injectable } from '@nestjs/common';
import { SupabaseAdminService } from '../common/supabase/supabase-admin.service';

@Injectable()
export class SettingsService {
  constructor(private supabaseAdmin: SupabaseAdminService) {}

  async getAll() {
    const supabase = this.supabaseAdmin.getClient();

    const { data, error } = await supabase
      .from('settings')
      .select('*')
      .order('key');

    if (error) throw new Error(error.message);

    // Convert array to object
    const settings: Record<string, any> = {};
    for (const row of data || []) {
      settings[row.key] = row.value;
    }
    return settings;
  }

  async getByCategory(category: string) {
    const supabase = this.supabaseAdmin.getClient();

    const { data, error } = await supabase
      .from('settings')
      .select('*')
      .eq('category', category)
      .order('key');

    if (error) throw new Error(error.message);

    const settings: Record<string, any> = {};
    for (const row of data || []) {
      settings[row.key] = row.value;
    }
    return settings;
  }

  async get(key: string) {
    const supabase = this.supabaseAdmin.getClient();

    const { data, error} = await supabase
      .from('settings')
      .select('value')
      .eq('key', key)
      .single();

    if (error) return null;
    return data?.value;
  }

  async set(key: string, value: any, category = 'general') {
    const supabase = this.supabaseAdmin.getClient();

    const { data, error } = await supabase
      .from('settings')
      .upsert({
        key,
        value,
        category,
        updated_at: new Date().toISOString(),
      })
      .select()
      .single();

    if (error) throw new Error(error.message);
    return data;
  }

  async updateMany(settings: Record<string, { value: any; category?: string }>) {
    const results: Record<string, any> = {};

    for (const [key, { value, category }] of Object.entries(settings)) {
      const result = await this.set(key, value, category || 'general');
      results[key] = result.value;
    }

    return results;
  }

  async delete(key: string) {
    const supabase = this.supabaseAdmin.getClient();

    const { error } = await supabase
      .from('settings')
      .delete()
      .eq('key', key);

    if (error) throw new Error(error.message);
    return { message: 'Setting deleted' };
  }
}
