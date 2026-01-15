'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Search, RefreshCw, ShoppingCart } from 'lucide-react';
import { getAllOrders, updateOrderStatus, ORDER_STATUS_CONFIG, PAYMENT_STATUS_CONFIG } from '@/lib/api/orders';
import type { Order, OrderStatus, PaymentStatus, OrderQueryParams } from '@/types/orders';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { formatCurrency, formatDateTime } from '@/lib/format';
import { toast } from 'sonner';

const STATUS_OPTIONS = Object.entries(ORDER_STATUS_CONFIG).map(([value, config]) => ({
  value: value as OrderStatus,
  label: config.label,
}));

const PAYMENT_STATUS_OPTIONS = Object.entries(PAYMENT_STATUS_CONFIG).map(([value, config]) => ({
  value: value as PaymentStatus,
  label: config.label,
}));

const PAGE_SIZES = [10, 20, 50];

const STATUS_COLOR_CLASSES: Record<string, string> = {
  yellow: 'bg-yellow-100 text-yellow-800 border-yellow-200',
  blue: 'bg-blue-100 text-blue-800 border-blue-200',
  green: 'bg-green-100 text-green-800 border-green-200',
  red: 'bg-red-100 text-red-800 border-red-200',
  gray: 'bg-gray-100 text-gray-800 border-gray-200',
};

export function OrdersList() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState<OrderStatus | ''>('');
  const [paymentStatus, setPaymentStatus] = useState<PaymentStatus | ''>('');
  const [sortBy, setSortBy] = useState('created_at');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);
  const [meta, setMeta] = useState({
    total: 0,
    page: 1,
    limit: 10,
    totalPages: 0,
  });
  const [updatingStatusIds, setUpdatingStatusIds] = useState<Set<string>>(new Set());
  const [updatingPaymentIds, setUpdatingPaymentIds] = useState<Set<string>>(new Set());

  useEffect(() => {
    loadOrders();
  }, [search, status, paymentStatus, sortBy, sortOrder, page, limit]);

  const loadOrders = async () => {
    try {
      setLoading(true);
      setError(null);

      const params: OrderQueryParams = {
        page,
        limit,
        search: search || undefined,
        status: status || undefined,
        paymentStatus: paymentStatus || undefined,
        sortBy,
        sortOrder,
      };

      const response = await getAllOrders(params);
      setOrders(response.data);
      setMeta(response.meta);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Không thể tải đơn hàng');
    } finally {
      setLoading(false);
    }
  };

  const handleStatusChange = async (orderId: string, nextStatus: OrderStatus) => {
    setUpdatingStatusIds((prev) => new Set(prev).add(orderId));
    try {
      const updated = await updateOrderStatus(orderId, { status: nextStatus });
      setOrders((prev) => prev.map((order) => (order.id === orderId ? updated : order)));
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Không thể cập nhật trạng thái đơn hàng');
    } finally {
      setUpdatingStatusIds((prev) => {
        const next = new Set(prev);
        next.delete(orderId);
        return next;
      });
    }
  };

  const handlePaymentStatusChange = async (
    orderId: string,
    nextStatus: PaymentStatus
  ) => {
    setUpdatingPaymentIds((prev) => new Set(prev).add(orderId));
    try {
      const updated = await updateOrderStatus(orderId, { paymentStatus: nextStatus });
      setOrders((prev) => prev.map((order) => (order.id === orderId ? updated : order)));
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Không thể cập nhật trạng thái thanh toán');
    } finally {
      setUpdatingPaymentIds((prev) => {
        const next = new Set(prev);
        next.delete(orderId);
        return next;
      });
    }
  };

  const handleResetFilters = () => {
    setSearch('');
    setStatus('');
    setPaymentStatus('');
    setSortBy('created_at');
    setSortOrder('desc');
    setPage(1);
    setLimit(10);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight flex items-center gap-2">

            Quản lý đơn hàng
          </h1>
          <p className="text-muted-foreground mt-1">
            Theo dõi và cập nhật trạng thái đơn hàng
          </p>
        </div>
        <Button variant="outline" onClick={loadOrders}>
          <RefreshCw className="h-4 w-4 mr-2" />
          Làm mới
        </Button>
      </div>

      {error && (
        <Alert variant="destructive">
          <AlertDescription>
            Lỗi khi tải dữ liệu: {error}
          </AlertDescription>
        </Alert>
      )}

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle>Bộ lọc</CardTitle>
          <CardDescription>Tìm kiếm theo mã đơn, khách hàng hoặc trạng thái</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 lg:grid-cols-4">
            <div className="relative lg:col-span-2">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Tìm mã đơn hoặc tên khách hàng..."
                value={search}
                onChange={(e) => {
                  setSearch(e.target.value);
                  setPage(1);
                }}
                className="pl-10"
              />
            </div>
            <select
              value={status}
              onChange={(e) => {
                setStatus(e.target.value as OrderStatus | '');
                setPage(1);
              }}
              className="rounded-md border border-gray-300 px-3 py-2 text-sm"
            >
              <option value="">Tất cả trạng thái</option>
              {STATUS_OPTIONS.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
            <select
              value={paymentStatus}
              onChange={(e) => {
                setPaymentStatus(e.target.value as PaymentStatus | '');
                setPage(1);
              }}
              className="rounded-md border border-gray-300 px-3 py-2 text-sm"
            >
              <option value="">Tất cả thanh toán</option>
              {PAYMENT_STATUS_OPTIONS.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>
          <div className="mt-4 flex flex-wrap items-center gap-3">
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="rounded-md border border-gray-300 px-3 py-2 text-sm"
            >
              <option value="created_at">Ngày tạo</option>
              <option value="total">Tổng tiền</option>
              <option value="status">Trạng thái</option>
            </select>
            <select
              value={sortOrder}
              onChange={(e) => setSortOrder(e.target.value as 'asc' | 'desc')}
              className="rounded-md border border-gray-300 px-3 py-2 text-sm"
            >
              <option value="desc">Mới nhất</option>
              <option value="asc">Cũ nhất</option>
            </select>
            <select
              value={limit}
              onChange={(e) => {
                setLimit(Number(e.target.value));
                setPage(1);
              }}
              className="rounded-md border border-gray-300 px-3 py-2 text-sm"
            >
              {PAGE_SIZES.map((size) => (
                <option key={size} value={size}>
                  {size} / trang
                </option>
              ))}
            </select>
            <Button variant="ghost" onClick={handleResetFilters}>
              Đặt lại
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Orders table */}
      <Card>
        <CardHeader>
          <CardTitle>Danh sách đơn hàng</CardTitle>
          <CardDescription>
            {loading ? 'Đang tải...' : `${meta.total} đơn hàng`}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex justify-center py-10">
              <div className="animate-spin h-8 w-8 border-4 border-admin-primary border-t-transparent rounded-full"></div>
            </div>
          ) : orders.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              Không tìm thấy đơn hàng phù hợp
            </div>
          ) : (
            <div className="space-y-4">
              <div className="space-y-4 md:hidden">
                {orders.map((order) => {
                  const customerName =
                    order.shippingAddress?.fullName ||
                    order.user?.fullName ||
                    order.user?.email ||
                    'Guest';
                  const phone = order.shippingAddress?.phone || '—';
                  const isUpdatingStatus = updatingStatusIds.has(order.id);
                  const isUpdatingPayment = updatingPaymentIds.has(order.id);
                  const statusColor =
                    STATUS_COLOR_CLASSES[ORDER_STATUS_CONFIG[order.status].color];
                  const paymentColor =
                    STATUS_COLOR_CLASSES[PAYMENT_STATUS_CONFIG[order.paymentStatus].color];

                  return (
                    <div key={order.id} className="rounded-lg border bg-white p-4 shadow-sm">
                      <div className="flex items-start justify-between gap-4">
                        <div>
                          <p className="font-medium">{order.orderNumber}</p>
                          <p className="text-xs text-muted-foreground">
                            #{order.id.slice(0, 8)}
                          </p>
                        </div>
                        <div className="text-right">
                          <p className="text-xs text-muted-foreground">
                            {formatDateTime(order.createdAt)}
                          </p>
                          <p className="font-semibold text-admin-primary">
                            {formatCurrency(order.total)}
                          </p>
                        </div>
                      </div>
                      <div className="mt-3">
                        <p className="text-sm font-medium">{customerName}</p>
                        <p className="text-xs text-muted-foreground">SĐT: {phone}</p>
                        <p className="text-xs text-muted-foreground">
                          {order.items.length} sản phẩm
                        </p>
                      </div>
                      <div className="mt-4 grid gap-2 sm:grid-cols-2">
                        <select
                          value={order.status}
                          onChange={(e) =>
                            handleStatusChange(order.id, e.target.value as OrderStatus)
                          }
                          disabled={isUpdatingStatus}
                          className={`w-full rounded-full border px-3 py-2 text-xs font-medium focus:outline-none focus:ring-2 focus:ring-primary disabled:opacity-60 disabled:cursor-not-allowed ${statusColor}`}
                        >
                          {STATUS_OPTIONS.map((option) => (
                            <option key={option.value} value={option.value}>
                              {option.label}
                            </option>
                          ))}
                        </select>
                        <select
                          value={order.paymentStatus}
                          onChange={(e) =>
                            handlePaymentStatusChange(
                              order.id,
                              e.target.value as PaymentStatus
                            )
                          }
                          disabled={isUpdatingPayment}
                          className={`w-full rounded-full border px-3 py-2 text-xs font-medium focus:outline-none focus:ring-2 focus:ring-primary disabled:opacity-60 disabled:cursor-not-allowed ${paymentColor}`}
                        >
                          {PAYMENT_STATUS_OPTIONS.map((option) => (
                            <option key={option.value} value={option.value}>
                              {option.label}
                            </option>
                          ))}
                        </select>
                      </div>
                      <div className="mt-4 flex flex-wrap gap-2">
                        <Link href={`/orders/${order.id}`} target="_blank" rel="noopener noreferrer">
                          <Button size="sm" variant="outline" className="w-full sm:w-auto">
                            View
                          </Button>
                        </Link>
                        <Link href={`/admin/orders/${order.id}`}>
                          <Button size="sm" variant="outline" className="w-full sm:w-auto">
                            Chi tiết
                          </Button>
                        </Link>
                      </div>
                    </div>
                  );
                })}
              </div>
              <div className="hidden md:block rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Mã đơn</TableHead>
                      <TableHead>Khách hàng</TableHead>
                      <TableHead>Ngày tạo</TableHead>
                      <TableHead className="text-right">Tổng tiền</TableHead>
                      <TableHead>Trạng thái</TableHead>
                      <TableHead>Thanh toán</TableHead>
                      <TableHead className="text-right">Thao tác</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {orders.map((order) => {
                      const customerName =
                        order.shippingAddress?.fullName ||
                        order.user?.fullName ||
                        order.user?.email ||
                        'Guest';
                      const phone = order.shippingAddress?.phone || '—';
                      const isUpdatingStatus = updatingStatusIds.has(order.id);
                      const isUpdatingPayment = updatingPaymentIds.has(order.id);
                      const statusColor =
                        STATUS_COLOR_CLASSES[ORDER_STATUS_CONFIG[order.status].color];
                      const paymentColor =
                        STATUS_COLOR_CLASSES[PAYMENT_STATUS_CONFIG[order.paymentStatus].color];

                      return (
                        <TableRow key={order.id}>
                          <TableCell>
                            <div className="font-medium">{order.orderNumber}</div>
                            <div className="text-xs text-muted-foreground">
                              #{order.id.slice(0, 8)}
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="font-medium">{customerName}</div>
                            <div className="text-xs text-muted-foreground">SĐT: {phone}</div>
                            <div className="text-xs text-muted-foreground">
                              {order.items.length} sản phẩm
                            </div>
                          </TableCell>
                          <TableCell>{formatDateTime(order.createdAt)}</TableCell>
                          <TableCell className="text-right">
                            <div className="font-semibold text-admin-primary">
                              {formatCurrency(order.total)}
                            </div>
                          </TableCell>
                          <TableCell>
                            <select
                              value={order.status}
                              onChange={(e) =>
                                handleStatusChange(order.id, e.target.value as OrderStatus)
                              }
                              disabled={isUpdatingStatus}
                              className={`w-full rounded-full border px-3 py-1 text-xs font-medium focus:outline-none focus:ring-2 focus:ring-primary disabled:opacity-60 disabled:cursor-not-allowed ${statusColor}`}
                            >
                              {STATUS_OPTIONS.map((option) => (
                                <option key={option.value} value={option.value}>
                                  {option.label}
                                </option>
                              ))}
                            </select>
                          </TableCell>
                          <TableCell>
                            <select
                              value={order.paymentStatus}
                              onChange={(e) =>
                                handlePaymentStatusChange(
                                  order.id,
                                  e.target.value as PaymentStatus
                                )
                              }
                              disabled={isUpdatingPayment}
                              className={`w-full rounded-full border px-3 py-1 text-xs font-medium focus:outline-none focus:ring-2 focus:ring-primary disabled:opacity-60 disabled:cursor-not-allowed ${paymentColor}`}
                            >
                              {PAYMENT_STATUS_OPTIONS.map((option) => (
                                <option key={option.value} value={option.value}>
                                  {option.label}
                                </option>
                              ))}
                            </select>
                          </TableCell>
                          <TableCell className="text-right">
                            <div className="flex justify-end gap-2">
                              <Link href={`/orders/${order.id}`} target="_blank" rel="noopener noreferrer">
                                <Button size="sm" variant="outline">
                                  View
                                </Button>
                              </Link>
                              <Link href={`/admin/orders/${order.id}`}>
                                <Button size="sm" variant="outline">
                                  Chi tiết
                                </Button>
                              </Link>
                            </div>
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </div>
            </div>
          )}

          {meta.totalPages > 1 && (
            <div className="flex flex-wrap items-center justify-between gap-3 mt-6">
              <p className="text-sm text-muted-foreground">
                Trang {meta.page} / {meta.totalPages}
              </p>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setPage((prev) => Math.max(1, prev - 1))}
                  disabled={page <= 1}
                >
                  Trước
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setPage((prev) => Math.min(meta.totalPages, prev + 1))}
                  disabled={page >= meta.totalPages}
                >
                  Sau
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
