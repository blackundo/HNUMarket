'use client';

import { useState, useEffect } from 'react';
import { getMyOrders } from '@/lib/api/orders';
import { Order, OrderQueryParams, OrderStatus } from '@/types/orders';
import { OrderCard } from '@/components/orders/OrderCard';
import { Package } from 'lucide-react';

const STATUS_FILTERS = [
  { value: undefined, label: 'Tất cả' },
  { value: 'pending' as OrderStatus, label: 'Chờ xác nhận' },
  { value: 'confirmed' as OrderStatus, label: 'Đã xác nhận' },
  { value: 'processing' as OrderStatus, label: 'Đang xử lý' },
  { value: 'shipped' as OrderStatus, label: 'Đang giao' },
  { value: 'delivered' as OrderStatus, label: 'Đã giao' },
  { value: 'cancelled' as OrderStatus, label: 'Đã hủy' },
];

export default function OrdersPage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filters, setFilters] = useState<OrderQueryParams>({
    page: 1,
    limit: 10,
    status: undefined,
  });
  const [meta, setMeta] = useState({
    total: 0,
    page: 1,
    limit: 10,
    totalPages: 0,
  });

  useEffect(() => {
    loadOrders();
  }, [filters]);

  async function loadOrders() {
    try {
      setLoading(true);
      setError(null);
      const response = await getMyOrders(filters);
      setOrders(response.data);
      setMeta(response.meta);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Không thể tải đơn hàng');
    } finally {
      setLoading(false);
    }
  }

  function handleFilterChange(status: OrderStatus | undefined) {
    setFilters({ ...filters, status, page: 1 });
  }

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
            <p className="text-gray-600">Đang tải đơn hàng...</p>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="bg-red-50 border border-red-200 rounded-lg p-6 text-center">
          <p className="text-red-800 font-medium">Lỗi: {error}</p>
          <button
            onClick={loadOrders}
            className="mt-4 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
          >
            Thử lại
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="container max-w-4xl mx-auto px-4 py-8">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-2xl md:text-3xl font-bold mb-2">Đơn hàng của tôi</h1>
        <p className="text-gray-600">
          Quản lý và theo dõi đơn hàng của bạn
        </p>
      </div>

      {/* Filters */}
      <div className="mb-6 overflow-x-auto">
        <div className="flex gap-2 min-w-max pb-2">
          {STATUS_FILTERS.map((filter) => (
            <button
              key={filter.label}
              onClick={() => handleFilterChange(filter.value)}
              className={`px-4 py-2 rounded-lg whitespace-nowrap transition-colors ${filters.status === filter.value
                ? 'bg-primary text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
            >
              {filter.label}
            </button>
          ))}
        </div>
      </div>

      {/* Orders list */}
      <div className="space-y-4">
        {orders.length === 0 ? (
          <div className="text-center py-12">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-gray-100 mb-4">
              <Package className="w-8 h-8 text-gray-400" />
            </div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              Chưa có đơn hàng
            </h3>
            <p className="text-gray-500 mb-6">
              {filters.status
                ? `Bạn chưa có đơn hàng nào với trạng thái này`
                : `Bạn chưa có đơn hàng nào`}
            </p>
            <a
              href="/products"
              className="inline-block px-6 py-3 bg-primary text-white rounded-lg hover:bg-primary/90"
            >
              Mua sắm ngay
            </a>
          </div>
        ) : (
          <>
            {orders.map((order) => (
              <OrderCard key={order.id} order={order} />
            ))}

            {/* Pagination */}
            {meta.totalPages > 1 && (
              <div className="flex justify-center gap-2 mt-8">
                <button
                  onClick={() =>
                    setFilters({ ...filters, page: (filters.page || 1) - 1 })
                  }
                  disabled={filters.page === 1}
                  className="px-4 py-2 border rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
                >
                  Trước
                </button>
                <span className="px-4 py-2 text-gray-600">
                  Trang {meta.page} / {meta.totalPages}
                </span>
                <button
                  onClick={() =>
                    setFilters({ ...filters, page: (filters.page || 1) + 1 })
                  }
                  disabled={meta.page >= meta.totalPages}
                  className="px-4 py-2 border rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
                >
                  Sau
                </button>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
