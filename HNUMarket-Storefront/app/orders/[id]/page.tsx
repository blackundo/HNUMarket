'use client';

import { useState, useEffect, useRef } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { getOrderById, getOrderByNumber, cancelOrder } from '@/lib/api/orders';
import { Order } from '@/types/orders';
import { OrderStatusBadge, PaymentStatusBadge } from '@/components/orders/OrderStatusBadge';
import { OrderItemCard } from '@/components/orders/OrderItemCard';
import { formatCurrency, formatDate } from '@/lib/format';
import {
  buildOrderSupportMessage,
  openMessengerWithMessage,
} from '@/lib/messenger-utils';
import { ArrowLeft, MapPin, CreditCard, Package, MessageCircle, Download, FileDown } from 'lucide-react';
import Link from 'next/link';
import { getPublicSettings } from '@/lib/api/settings';
import { toast } from 'sonner';
import { toPng } from 'html-to-image';
import jsPDF from 'jspdf';

export default function OrderDetailPage() {
  const params = useParams();
  const router = useRouter();
  const [order, setOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [cancelling, setCancelling] = useState(false);
  const [messengerPageId, setMessengerPageId] = useState<string>('');
  const [savingImage, setSavingImage] = useState(false);
  const [savingPdf, setSavingPdf] = useState(false);
  const captureRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    loadOrder();
  }, [params.id]);

  useEffect(() => {
    loadPublicSettings();
  }, []);

  const isUuid = (value: string) =>
    /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(
      value
    );

  async function loadPublicSettings() {
    try {
      const settings = await getPublicSettings();
      if (settings.messenger_page_id) {
        setMessengerPageId(settings.messenger_page_id);
      }
    } catch (err) {
      console.error('Failed to load public settings:', err);
    }
  }

  async function loadOrder() {
    try {
      setLoading(true);
      setError(null);
      const slug = params.id as string;
      const data = isUuid(slug)
        ? await getOrderById(slug)
        : await getOrderByNumber(slug);
      setOrder(data);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : 'Không tìm thấy đơn hàng'
      );
    } finally {
      setLoading(false);
    }
  }

  async function handleCancelOrder() {
    if (!order) return;

    if (
      !confirm(
        'Bạn có chắc muốn hủy đơn hàng này? Hành động này không thể hoàn tác.'
      )
    ) {
      return;
    }

    try {
      setCancelling(true);
      const updated = await cancelOrder(order.id);
      setOrder(updated);
      toast.success('Đơn hàng đã được hủy thành công!');
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Không thể hủy đơn hàng');
    } finally {
      setCancelling(false);
    }
  }

  const handleMessengerClick = () => {
    if (!messengerPageId || !order) return;
    openMessengerWithMessage(
      buildOrderSupportMessage(order.orderNumber),
      messengerPageId
    );
  };

  const getExportNode = () => {
    if (!captureRef.current) {
      toast.error('Không thể tìm thấy nội dung đơn hàng để xuất.');
      return null;
    }
    return captureRef.current;
  };

  const getExportOptions = (node: HTMLElement) => {
    const rect = node.getBoundingClientRect();
    const width = Math.ceil(rect.width);
    const height = Math.ceil(rect.height);
    const pixelRatio = 2;

    return {
      width,
      height,
      pixelRatio,
      options: {
        cacheBust: true,
        pixelRatio,
        backgroundColor: '#ffffff',
        width,
        height,
        canvasWidth: width * pixelRatio,
        canvasHeight: height * pixelRatio,
        style: {
          margin: '0',
          transform: 'scale(1)',
          transformOrigin: 'top left',
          width: `${width}px`,
          height: `${height}px`,
        },
        filter: (domNode: Node) => {
          if (!(domNode instanceof Element)) {
            return true;
          }
          return !domNode.classList.contains('print-hidden');
        },
      },
    };
  };

  const handleSavePdf = async () => {
    if (!order) return;
    const node = getExportNode();
    if (!node) return;

    setSavingPdf(true);
    try {
      const { width, height, options } = getExportOptions(node);
      const dataUrl = await toPng(node, options);
      const pdf = new jsPDF({
        orientation: width > height ? 'l' : 'p',
        unit: 'px',
        format: [width, height],
      });
      pdf.addImage(dataUrl, 'PNG', 0, 0, width, height);
      pdf.save(`order-${order.orderNumber}.pdf`);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Không thể lưu PDF đơn hàng.');
    } finally {
      setSavingPdf(false);
    }
  };

  const handleSaveImage = async () => {
    if (!order) return;
    const node = getExportNode();
    if (!node) return;

    setSavingImage(true);
    try {
      const { options } = getExportOptions(node);
      const dataUrl = await toPng(node, options);
      const link = document.createElement('a');
      link.href = dataUrl;
      link.download = `order-${order.orderNumber}.png`;
      link.click();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Không thể lưu ảnh đơn hàng.');
    } finally {
      setSavingImage(false);
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
      <div className="container mx-auto px-4 py-8 max-w-2xl">
        <div className="bg-red-50 border border-red-200 rounded-lg p-6 text-center">
          <p className="text-red-800 font-medium mb-4">
            {error || 'Không tìm thấy đơn hàng'}
          </p>
          <Link
            href="/orders"
            className="inline-block px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary/90"
          >
            Quay lại danh sách đơn hàng
          </Link>
        </div>
      </div>
    );
  }

  const canCancel = ['pending', 'confirmed'].includes(order.status);

  return (
    <div ref={captureRef} className="container mx-auto px-4 py-8 max-w-2xl print-container">
      {/* Back button */}
      <Link
        href="/orders"
        className="inline-flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-6 print-hidden"
      >
        <ArrowLeft className="w-4 h-4" />
        <span>Quay lại</span>
      </Link>

      {/* Header */}
      <div className="mb-6">
        <h1 className="text-2xl md:text-3xl font-bold mb-2">
          Đơn hàng {order.orderNumber}
        </h1>
        <p className="text-gray-500">Đặt ngày {formatDate(order.createdAt)}</p>
        <div className="flex flex-wrap gap-2 mt-3">
          <OrderStatusBadge status={order.status} />
          <PaymentStatusBadge status={order.paymentStatus} />
        </div>
        <div className="mt-4 flex flex-wrap gap-2 print-hidden">
          <button
            onClick={handleSaveImage}
            disabled={savingImage}
            className="inline-flex items-center gap-2 rounded-lg border border-gray-200 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50"
          >
            <Download className="w-4 h-4" />
            {savingImage ? 'Đang lưu ảnh...' : 'Lưu ảnh'}
          </button>
          <button
            onClick={handleSavePdf}
            disabled={savingPdf}
            className="inline-flex items-center gap-2 rounded-lg border border-gray-200 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
          >
            <FileDown className="w-4 h-4" />
            {savingPdf ? 'Đang lưu PDF...' : 'Lưu PDF'}
          </button>
        </div>
      </div>

      {/* Items */}
      <div className="mb-6">
        <div className="flex items-center gap-2 mb-4">
          <Package className="w-5 h-5 text-gray-600" />
          <h2 className="text-lg font-semibold">Sản phẩm ({order.items.length})</h2>
        </div>
        <div className="space-y-3">
          {order.items.map((item) => (
            <OrderItemCard key={item.id} item={item} />
          ))}
        </div>
      </div>

      {/* Shipping address */}
      <div className="mb-6 p-4 bg-gray-50 rounded-lg">
        <div className="flex items-center gap-2 mb-3">
          <MapPin className="w-5 h-5 text-gray-600" />
          <h2 className="text-lg font-semibold">Địa chỉ giao hàng</h2>
        </div>
        <p className="font-medium text-gray-900">
          {order.shippingAddress.fullName}
        </p>
        {order.shippingAddress.phone && (
          <p className="text-sm text-gray-600 mt-1">
            {order.shippingAddress.phone}
          </p>
        )}
        <p className="text-sm text-gray-600 mt-1">
          {order.shippingAddress.address}
          {order.shippingAddress.ward && `, ${order.shippingAddress.ward}`}
          {order.shippingAddress.district &&
            `, ${order.shippingAddress.district}`}
          , {order.shippingAddress.city}
        </p>
      </div>

      {/* Payment info */}
      <div className="mb-6 p-4 bg-gray-50 rounded-lg">
        <div className="flex items-center gap-2 mb-3">
          <CreditCard className="w-5 h-5 text-gray-600" />
          <h2 className="text-lg font-semibold">Thanh toán</h2>
        </div>
        {order.notes && (
          <p className="text-sm text-gray-600 mt-2">
            Ghi chú: <span className="font-medium">{order.notes}</span>
          </p>
        )}
      </div>

      {/* Order summary */}
      <div className="p-4 border rounded-lg bg-white">
        <h2 className="text-lg font-semibold mb-4">Tổng đơn hàng</h2>
        <div className="space-y-2">
          <div className="flex justify-between text-gray-600">
            <span>Tạm tính:</span>
            <span>{formatCurrency(order.subtotal)}</span>
          </div>
          <div className="flex justify-between text-gray-600">
            <span>Phí vận chuyển:</span>
            <span>{formatCurrency(order.shippingFee)}</span>
          </div>
          {order.discount > 0 && (
            <div className="flex justify-between text-red-600">
              <span>Giảm giá:</span>
              <span>-{formatCurrency(order.discount)}</span>
            </div>
          )}
          <div className="flex justify-between font-bold text-lg border-t pt-3 mt-2">
            <span>Tổng cộng:</span>
            <span className="text-primary">{formatCurrency(order.total)}</span>
          </div>
        </div>
      </div>

      {/* Messenger */}
      {messengerPageId && (
        <div className="mt-6 print-hidden">
          <button
            onClick={handleMessengerClick}
            className="w-full px-6 py-3 bg-primary text-white rounded-lg hover:bg-primary/90 font-medium flex items-center justify-center gap-2"
          >
            <MessageCircle className="w-5 h-5" />
            Nhắn tin với cửa hàng
          </button>
        </div>
      )}

      {/* Actions */}
      {canCancel && (
        <div className="mt-6 print-hidden">
          <button
            onClick={handleCancelOrder}
            disabled={cancelling}
            className="w-full px-6 py-3 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed font-medium"
          >
            {cancelling ? 'Đang hủy...' : 'Hủy đơn hàng'}
          </button>
          <p className="text-sm text-gray-500 text-center mt-2">
            Chỉ có thể hủy đơn hàng khi đang chờ xác nhận hoặc đã xác nhận
          </p>
        </div>
      )}
    </div>
  );
}
