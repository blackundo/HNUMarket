'use client';

import { ShoppingCart, DollarSign, Package, FileText, Clock } from 'lucide-react';
import { formatCurrency } from '@/lib/utils';
import type { DashboardStats } from '@/lib/api/dashboard';

interface StatsCardsProps {
  stats: DashboardStats;
}

export function StatsCards({ stats }: StatsCardsProps) {
  const cards = [
    {
      title: 'Tổng đơn hàng',
      value: stats.totalOrders.toLocaleString(),
      icon: ShoppingCart,
      color: 'bg-blue-500',
    },
    {
      title: 'Tổng doanh thu',
      value: formatCurrency(stats.totalRevenue),
      icon: DollarSign,
      color: 'bg-green-500',
    },
    {
      title: 'Sản phẩm',
      value: stats.totalProducts.toLocaleString(),
      icon: Package,
      color: 'bg-purple-500',
    },
    {
      title: 'Bài viết đã xuất bản',
      value: stats.totalPosts.toLocaleString(),
      icon: FileText,
      color: 'bg-orange-500',
    },
    {
      title: 'Đơn hàng chờ xử lý',
      value: stats.pendingOrders.toLocaleString(),
      icon: Clock,
      color: 'bg-yellow-500',
    },
  ];

  return (
    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
      {cards.map((card) => (
        <div key={card.title} className="bg-white rounded-lg shadow p-4">
          <div className="flex items-center gap-3">
            <div className={`${card.color} p-2 rounded-lg`}>
              <card.icon className="h-5 w-5 text-white" />
            </div>
            <div>
              <p className="text-sm text-gray-500">{card.title}</p>
              <p className="text-lg font-semibold">{card.value}</p>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
