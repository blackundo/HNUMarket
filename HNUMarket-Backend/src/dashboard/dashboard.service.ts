import { Injectable } from '@nestjs/common';
import { SupabaseAdminService } from '../common/supabase/supabase-admin.service';

export interface StatsResult {
  totalOrders: number;
  totalRevenue: number;
  totalProducts: number;
  totalPosts: number;
  pendingOrders: number;
}

export interface SalesData {
  date: string;
  orders: number;
  revenue: number;
}

export interface OrderStatusData {
  status: string;
  count: number;
}

@Injectable()
export class DashboardService {
  constructor(private supabaseAdmin: SupabaseAdminService) {}

  async getStats(): Promise<StatsResult> {
    const supabase = this.supabaseAdmin.getClient();

    const [ordersResult, revenueResult, productsResult, postsResult, pendingResult] = await Promise.all([
      supabase.from('orders').select('*', { count: 'exact', head: true }),
      supabase.from('orders')
        .select('total')
        .neq('status', 'cancelled'),
      supabase.from('products')
        .select('*', { count: 'exact', head: true })
        .eq('is_active', true),
      supabase.from('posts')
        .select('*', { count: 'exact', head: true })
        .eq('status', 'published'),
      supabase.from('orders')
        .select('*', { count: 'exact', head: true })
        .eq('status', 'pending'),
    ]);

    const totalRevenue = revenueResult.data?.reduce((sum, o) => sum + (o.total || 0), 0) || 0;

    return {
      totalOrders: ordersResult.count || 0,
      totalRevenue,
      totalProducts: productsResult.count || 0,
      totalPosts: postsResult.count || 0,
      pendingOrders: pendingResult.count || 0,
    };
  }

  async getSalesData(): Promise<SalesData[]> {
    const supabase = this.supabaseAdmin.getClient();

    const { data, error } = await supabase
      .from('daily_sales')
      .select('*')
      .order('date', { ascending: true });

    if (error) {
      console.error('Failed to fetch sales data:', error);
      return [];
    }

    return (data || []).map(row => ({
      date: row.date,
      orders: row.order_count,
      revenue: row.revenue,
    }));
  }

  async getOrderStatusData(): Promise<OrderStatusData[]> {
    const supabase = this.supabaseAdmin.getClient();

    const { data, error } = await supabase
      .from('order_status_counts')
      .select('*');

    if (error) {
      console.error('Failed to fetch order status:', error);
      return [];
    }

    return data || [];
  }

  async getTopProducts() {
    const supabase = this.supabaseAdmin.getClient();

    const { data, error } = await supabase
      .from('top_products')
      .select('*');

    if (error) {
      console.error('Failed to fetch top products:', error);
      return [];
    }

    return data || [];
  }

  async getLowStockProducts() {
    const supabase = this.supabaseAdmin.getClient();

    const { data, error } = await supabase
      .from('low_stock_products')
      .select('*');

    if (error) {
      console.error('Failed to fetch low stock:', error);
      return [];
    }

    return data || [];
  }

  async getRecentOrders(limit = 5) {
    const supabase = this.supabaseAdmin.getClient();

    const { data, error } = await supabase
      .from('orders')
      .select('*, user:profiles(full_name)')
      .order('created_at', { ascending: false })
      .limit(limit);

    if (error) {
      console.error('Failed to fetch recent orders:', error);
      return [];
    }

    return data || [];
  }
}
