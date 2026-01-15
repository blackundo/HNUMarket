import { createClient } from '@/lib/supabase/client';
import { API_BASE_URL } from '@/lib/config/api';

const API_URL = API_BASE_URL;

async function getAuthHeader(): Promise<Record<string, string>> {
  const supabase = createClient();
  const { data: { session } } = await supabase.auth.getSession();

  if (!session?.access_token) {
    return {};
  }

  return {
    Authorization: `Bearer ${session.access_token}`,
  };
}

export interface DashboardStats {
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

export interface TopProduct {
  id: string;
  name: string;
  slug: string;
  total_sold: number;
  total_revenue: number;
}

export interface LowStockProduct {
  id: string;
  name: string;
  slug: string;
  stock: number;
  image_url?: string;
}

export interface RecentOrder {
  id: string;
  order_number: string;
  status: string;
  total: number;
  created_at: string;
  user?: { full_name: string };
}

export async function getStats(): Promise<DashboardStats> {
  const headers = await getAuthHeader();

  const response = await fetch(`${API_URL}/admin/dashboard/stats`, { headers });

  if (!response.ok) {
    throw new Error('Failed to fetch stats');
  }

  return response.json();
}

export async function getSales(): Promise<SalesData[]> {
  const headers = await getAuthHeader();

  const response = await fetch(`${API_URL}/admin/dashboard/sales`, { headers });

  if (!response.ok) {
    throw new Error('Failed to fetch sales');
  }

  const data = await response.json();
  if (!Array.isArray(data)) {
    return [];
  }

  return data.map((item) => ({
    ...item,
    orders: Number(item.orders) || 0,
    revenue: Number(item.revenue) || 0,
  }));
}

export async function getOrdersData(): Promise<{
  statusData: OrderStatusData[];
  recentOrders: RecentOrder[];
}> {
  const headers = await getAuthHeader();

  const response = await fetch(`${API_URL}/admin/dashboard/orders`, { headers });

  if (!response.ok) {
    throw new Error('Failed to fetch orders');
  }

  const data = await response.json();
  const statusData = Array.isArray(data?.statusData)
    ? data.statusData.map((item: OrderStatusData) => ({
        ...item,
        count: Number(item.count) || 0,
      }))
    : [];

  return {
    statusData,
    recentOrders: Array.isArray(data?.recentOrders) ? data.recentOrders : [],
  };
}

export async function getProductsData(): Promise<{
  topProducts: TopProduct[];
  lowStockProducts: LowStockProduct[];
}> {
  const headers = await getAuthHeader();

  const response = await fetch(`${API_URL}/admin/dashboard/products`, { headers });

  if (!response.ok) {
    throw new Error('Failed to fetch products');
  }

  const data = await response.json();
  const topProducts = Array.isArray(data?.topProducts)
    ? data.topProducts.map((product: TopProduct) => ({
        ...product,
        total_sold: Number(product.total_sold) || 0,
        total_revenue: Number(product.total_revenue) || 0,
      }))
    : [];
  const lowStockProducts = Array.isArray(data?.lowStockProducts)
    ? data.lowStockProducts.map((product: LowStockProduct) => ({
        ...product,
        stock: Number(product.stock) || 0,
      }))
    : [];

  return { topProducts, lowStockProducts };
}
