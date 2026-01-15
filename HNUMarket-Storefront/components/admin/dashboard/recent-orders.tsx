'use client';

import Link from 'next/link';
import { formatCurrency } from '@/lib/utils';
import type { RecentOrder } from '@/lib/api/dashboard';

interface RecentOrdersProps {
  orders: RecentOrder[];
}

const STATUS_STYLES: Record<string, string> = {
  pending: 'bg-yellow-100 text-yellow-800',
  confirmed: 'bg-blue-100 text-blue-800',
  processing: 'bg-purple-100 text-purple-800',
  shipped: 'bg-green-100 text-green-800',
  delivered: 'bg-emerald-100 text-emerald-800',
  cancelled: 'bg-red-100 text-red-800',
};

const STATUS_LABELS: Record<string, string> = {
  pending: 'Chờ xác nhận',
  confirmed: 'Đã xác nhận',
  processing: 'Đang xử lý',
  shipped: 'Đang giao',
  delivered: 'Đã giao',
  cancelled: 'Đã hủy',
};

export function RecentOrders({ orders }: RecentOrdersProps) {
  const formatDate = (date: string) => {
    return new Date(date).toLocaleDateString('vi-VN', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  return (
    <div className="bg-white rounded-lg shadow p-4">
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-lg font-semibold">Đơn hàng gần đây</h3>
        <Link href="/admin/orders" className="text-sm text-admin-primary hover:underline">
          Xem tất cả
        </Link>
      </div>
      <div className="space-y-3">
        {orders.length === 0 ? (
          <p className="text-gray-500 text-center py-4">Chưa có đơn hàng</p>
        ) : (
          orders.map((order) => (
            <div key={order.id} className="flex items-center justify-between py-2 border-b last:border-0">
              <div>
                <p className="font-medium">{order.order_number}</p>
                <p className="text-sm text-gray-500">
                  {order.user?.full_name || 'Guest'} - {formatDate(order.created_at)}
                </p>
              </div>
              <div className="text-right">
                <p className="font-medium">{formatCurrency(order.total)}</p>
                <span className={`inline-flex px-2 py-0.5 text-xs rounded-full ${STATUS_STYLES[order.status] || 'bg-gray-100'}`}>
                  {STATUS_LABELS[order.status] || order.status}
                </span>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
