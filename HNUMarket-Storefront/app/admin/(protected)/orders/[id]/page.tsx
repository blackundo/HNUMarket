'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, Package, MapPin, CreditCard, Plus } from 'lucide-react';
import { getOrderById, updateOrderStatus, addOrderItem, updateOrderItem, removeOrderItem } from '@/lib/api/orders';
import type { Order, OrderStatus, PaymentStatus } from '@/types/orders';
import { OrderItemCard } from '@/components/orders/OrderItemCard';
import { AddProductModal } from '@/components/admin/orders/AddProductModal';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { formatCurrency, formatDateTime } from '@/lib/format';
import { ORDER_STATUS_CONFIG, PAYMENT_STATUS_CONFIG } from '@/lib/api/orders';
import { toast } from 'sonner';

const STATUS_OPTIONS = Object.entries(ORDER_STATUS_CONFIG).map(([value, config]) => ({
  value: value as OrderStatus,
  label: config.label,
}));

const PAYMENT_STATUS_OPTIONS = Object.entries(PAYMENT_STATUS_CONFIG).map(([value, config]) => ({
  value: value as PaymentStatus,
  label: config.label,
}));

const STATUS_COLOR_CLASSES: Record<string, string> = {
  yellow: 'bg-yellow-100 text-yellow-800 border-yellow-200',
  blue: 'bg-blue-100 text-blue-800 border-blue-200',
  green: 'bg-green-100 text-green-800 border-green-200',
  red: 'bg-red-100 text-red-800 border-red-200',
  gray: 'bg-gray-100 text-gray-800 border-gray-200',
};

export default function AdminOrderDetailPage() {
  const params = useParams();
  const [order, setOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [updating, setUpdating] = useState(false);
  const [isAddingProduct, setIsAddingProduct] = useState(false);
  const [adding, setAdding] = useState(false);

  useEffect(() => {
    loadOrder();
  }, [params.id]);

  const loadOrder = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await getOrderById(params.id as string);
      setOrder(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Không tìm thấy đơn hàng');
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateStatus = async (nextStatus: OrderStatus) => {
    if (!order) return;
    setUpdating(true);
    try {
      const updated = await updateOrderStatus(order.id, { status: nextStatus });
      setOrder(updated);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Không thể cập nhật trạng thái đơn hàng');
    } finally {
      setUpdating(false);
    }
  };

  const handleUpdatePaymentStatus = async (nextStatus: PaymentStatus) => {
    if (!order) return;
    setUpdating(true);
    try {
      const updated = await updateOrderStatus(order.id, { paymentStatus: nextStatus });
      setOrder(updated);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Không thể cập nhật trạng thái thanh toán');
    } finally {
      setUpdating(false);
    }
  };

  const handleAddItem = async (productId: string, variantId: string | undefined, quantity: number) => {
    if (!order) return;
    setAdding(true);
    try {
      const updated = await addOrderItem(order.id, { productId, variantId, quantity });
      setOrder(updated);
      setIsAddingProduct(false);
      toast.success('Đã thêm sản phẩm vào đơn hàng');
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Không thể thêm sản phẩm';
      if (message.includes('Insufficient stock')) {
        toast.error('Không đủ hàng trong kho');
      } else if (message.includes('cannot be modified')) {
        toast.error('Đơn hàng không thể chỉnh sửa');
      } else {
        toast.error(message);
      }
    } finally {
      setAdding(false);
    }
  };

  const handleUpdateItem = async (itemId: string, quantity: number) => {
    if (!order) return;
    setUpdating(true);
    try {
      const updated = await updateOrderItem(order.id, itemId, { quantity });
      setOrder(updated);
      toast.success('Đã cập nhật số lượng');
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Không thể cập nhật số lượng';
      if (message.includes('Insufficient stock')) {
        toast.error('Không đủ hàng trong kho');
      } else {
        toast.error(message);
      }
    } finally {
      setUpdating(false);
    }
  };

  const handleRemoveItem = async (itemId: string) => {
    if (!order) return;
    if (!confirm('Bạn có chắc chắn muốn xóa sản phẩm này khỏi đơn hàng?')) return;

    setUpdating(true);
    try {
      const updated = await removeOrderItem(order.id, itemId);
      setOrder(updated);
      toast.success('Đã xóa sản phẩm khỏi đơn hàng');
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Không thể xóa sản phẩm';
      if (message.includes('last item')) {
        toast.error('Không thể xóa sản phẩm cuối cùng. Vui lòng hủy đơn hàng thay vì.');
      } else {
        toast.error(message);
      }
    } finally {
      setUpdating(false);
    }
  };

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
            <p className="text-gray-600">Đang tải chi tiết đơn hàng...</p>
          </div>
        </div>
      </div>
    );
  }

  if (error || !order) {
    return (
      <div className="container mx-auto px-4 py-8 max-w-4xl">
        <Alert variant="destructive">
          <AlertDescription>{error || 'Không tìm thấy đơn hàng'}</AlertDescription>
        </Alert>
        <div className="mt-4">
          <Link href="/admin/orders">
            <Button variant="outline">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Quay lại danh sách đơn hàng
            </Button>
          </Link>
        </div>
      </div>
    );
  }

  const shippingAddress = order.shippingAddress;
  const statusColor = STATUS_COLOR_CLASSES[ORDER_STATUS_CONFIG[order.status].color];
  const paymentColor = STATUS_COLOR_CLASSES[PAYMENT_STATUS_CONFIG[order.paymentStatus].color];

  return (
    <div className="container mx-auto px-4 py-8 max-w-5xl space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <Link href="/admin/orders" className="inline-flex items-center gap-2 text-gray-600 hover:text-gray-900">
          <ArrowLeft className="h-4 w-4" />
          Quay lại
        </Link>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Đơn hàng {order.orderNumber}</CardTitle>
          <CardDescription>Đặt lúc {formatDateTime(order.createdAt)}</CardDescription>
        </CardHeader>
        <CardContent className="grid gap-4 md:grid-cols-2">
          <div>
            <label className="text-sm font-medium text-gray-600">Trạng thái đơn hàng</label>
            <select
              value={order.status}
              onChange={(e) => handleUpdateStatus(e.target.value as OrderStatus)}
              disabled={updating}
              className={`mt-2 w-full rounded-full border px-3 py-2 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-primary disabled:opacity-60 disabled:cursor-not-allowed ${statusColor}`}
            >
              {STATUS_OPTIONS.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="text-sm font-medium text-gray-600">Thanh toán</label>
            <select
              value={order.paymentStatus}
              onChange={(e) => handleUpdatePaymentStatus(e.target.value as PaymentStatus)}
              disabled={updating}
              className={`mt-2 w-full rounded-full border px-3 py-2 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-primary disabled:opacity-60 disabled:cursor-not-allowed ${paymentColor}`}
            >
              {PAYMENT_STATUS_OPTIONS.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <div className="flex flex-wrap items-center justify-between gap-4">
            <CardTitle className="flex items-center gap-2">
              <Package className="h-5 w-5 text-gray-600" />
              Sản phẩm ({order.items.length})
            </CardTitle>
            {['pending', 'confirmed'].includes(order.status) && (
              <Button onClick={() => setIsAddingProduct(true)} size="sm">
                <Plus className="h-4 w-4 mr-2" />
                Thêm sản phẩm
              </Button>
            )}
          </div>
        </CardHeader>
        <CardContent className="space-y-3">
          {order.items.map((item) => (
            <OrderItemCard
              key={item.id}
              item={item}
              editable={['pending', 'confirmed'].includes(order.status)}
              onUpdate={handleUpdateItem}
              onRemove={handleRemoveItem}
              updating={updating}
            />
          ))}
        </CardContent>
      </Card>

      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <MapPin className="h-5 w-5 text-gray-600" />
              Địa chỉ giao hàng
            </CardTitle>
          </CardHeader>
          <CardContent className="text-sm text-gray-600 space-y-1">
            {shippingAddress ? (
              <>
                <p className="font-medium text-gray-900">{shippingAddress.fullName}</p>
                {shippingAddress.phone && <p>{shippingAddress.phone}</p>}
                <p>
                  {shippingAddress.address}
                  {shippingAddress.ward && `, ${shippingAddress.ward}`}
                  {shippingAddress.district && `, ${shippingAddress.district}`}
                  , {shippingAddress.city}
                </p>
              </>
            ) : (
              <p className="text-gray-500">Chưa có địa chỉ giao hàng</p>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CreditCard className="h-5 w-5 text-gray-600" />
              Tổng đơn hàng
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-sm text-gray-600">
            <div className="flex justify-between">
              <span>Tạm tính</span>
              <span>{formatCurrency(order.subtotal)}</span>
            </div>
            <div className="flex justify-between">
              <span>Phí vận chuyển</span>
              <span>{formatCurrency(order.shippingFee)}</span>
            </div>
            {order.discount > 0 && (
              <div className="flex justify-between text-red-600">
                <span>Giảm giá</span>
                <span>-{formatCurrency(order.discount)}</span>
              </div>
            )}
            <div className="flex justify-between font-semibold text-base text-gray-900 border-t pt-2">
              <span>Tổng cộng</span>
              <span>{formatCurrency(order.total)}</span>
            </div>
            {order.notes && (
              <div className="text-xs text-gray-500 pt-2">
                Ghi chú: {order.notes}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Add Product Modal */}
      <AddProductModal
        open={isAddingProduct}
        onClose={() => setIsAddingProduct(false)}
        onAdd={handleAddItem}
        adding={adding}
      />
    </div>
  );
}
