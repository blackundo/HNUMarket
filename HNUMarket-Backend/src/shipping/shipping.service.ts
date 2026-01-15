import { Injectable, NotFoundException } from '@nestjs/common';
import { SupabaseAdminService } from '../common/supabase/supabase-admin.service';
import { CreateLocationDto, UpdateLocationDto } from './dto/shipping-location.dto';

@Injectable()
export class ShippingService {
  constructor(private supabaseAdmin: SupabaseAdminService) {}

  // Admin: Get all locations
  async findAllLocations() {
    const supabase = this.supabaseAdmin.getClient();

    const { data, error } = await supabase
      .from('shipping_locations')
      .select('*')
      .order('display_order');

    if (error) throw new Error(error.message);
    return data;
  }

  // Admin: Get single location
  async findLocation(id: string) {
    const supabase = this.supabaseAdmin.getClient();

    const { data, error } = await supabase
      .from('shipping_locations')
      .select('*')
      .eq('id', id)
      .single();

    if (error || !data) throw new NotFoundException('Location not found');
    return data;
  }

  // Admin: Create location
  async createLocation(dto: CreateLocationDto) {
    const supabase = this.supabaseAdmin.getClient();

    const { data, error } = await supabase
      .from('shipping_locations')
      .insert({
        name: dto.name,
        fee: dto.fee,
        display_order: dto.displayOrder ?? 0,
        is_active: dto.isActive ?? true,
      })
      .select()
      .single();

    if (error) throw new Error(error.message);
    return data;
  }

  // Admin: Update location
  async updateLocation(id: string, dto: UpdateLocationDto) {
    const supabase = this.supabaseAdmin.getClient();

    const updateData: Record<string, any> = { updated_at: new Date().toISOString() };

    if (dto.name !== undefined) updateData.name = dto.name;
    if (dto.fee !== undefined) updateData.fee = dto.fee;
    if (dto.displayOrder !== undefined) updateData.display_order = dto.displayOrder;
    if (dto.isActive !== undefined) updateData.is_active = dto.isActive;

    const { data, error } = await supabase
      .from('shipping_locations')
      .update(updateData)
      .eq('id', id)
      .select()
      .single();

    if (error) throw new Error(error.message);
    return data;
  }

  // Admin: Delete location
  async deleteLocation(id: string) {
    const supabase = this.supabaseAdmin.getClient();

    const { error } = await supabase
      .from('shipping_locations')
      .delete()
      .eq('id', id);

    if (error) throw new Error(error.message);
    return { message: 'Location deleted' };
  }

  // Public: Get active locations (for storefront)
  async getActiveLocations() {
    const supabase = this.supabaseAdmin.getClient();

    const { data, error } = await supabase
      .from('shipping_locations')
      .select('*')
      .eq('is_active', true)
      .order('display_order');

    if (error) throw new Error(error.message);
    return data;
  }
}
