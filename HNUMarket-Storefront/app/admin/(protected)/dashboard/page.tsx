'use client';

import { useEffect, useState } from 'react';
import {
  getStats,
  getSales,
  getOrdersData,
  getProductsData,
  type DashboardStats,
  type SalesData,
  type OrderStatusData,
  type RecentOrder,
  type LowStockProduct,
  type TopProduct,
} from '@/lib/api/dashboard';
import { StatsCards } from '@/components/admin/dashboard/stats-cards';
import { SalesChart } from '@/components/admin/dashboard/sales-chart';
import { OrdersChart } from '@/components/admin/dashboard/orders-chart';
import { RecentOrders } from '@/components/admin/dashboard/recent-orders';
import { LowStockAlert } from '@/components/admin/dashboard/low-stock-alert';
import { TopProducts } from '@/components/admin/dashboard/top-products';
import { Loader2 } from 'lucide-react';

export default function DashboardPage() {
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [salesData, setSalesData] = useState<SalesData[]>([]);
  const [orderStatus, setOrderStatus] = useState<OrderStatusData[]>([]);
  const [recentOrders, setRecentOrders] = useState<RecentOrder[]>([]);
  const [lowStock, setLowStock] = useState<LowStockProduct[]>([]);
  const [topProducts, setTopProducts] = useState<TopProduct[]>([]);

  useEffect(() => {
    loadDashboard();
    // Refresh every 60 seconds
    const interval = setInterval(loadDashboard, 60000);
    return () => clearInterval(interval);
  }, []);

  const loadDashboard = async () => {
    try {
      const [statsRes, salesRes, ordersRes, productsRes] = await Promise.all([
        getStats(),
        getSales(),
        getOrdersData(),
        getProductsData(),
      ]);

      setStats(statsRes);
      setSalesData(salesRes);
      setOrderStatus(ordersRes.statusData);
      setRecentOrders(ordersRes.recentOrders);
      setLowStock(productsRes.lowStockProducts);
      setTopProducts(productsRes.topProducts);
    } catch (error) {
      console.error('Failed to load dashboard:', error);
    }
    setLoading(false);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin text-admin-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Tổng quan</h1>

      {stats && <StatsCards stats={stats} />}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <SalesChart data={salesData} />
        </div>
        <div>
          <OrdersChart data={orderStatus} />
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <RecentOrders orders={recentOrders} />
        </div>
        <div className="space-y-6">
          <TopProducts products={topProducts} />
          <LowStockAlert products={lowStock} />
        </div>
      </div>
    </div>
  );
}
