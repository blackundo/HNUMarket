import { Order } from '@/types/orders';
import { OrderStatusBadge, PaymentStatusBadge } from './OrderStatusBadge';
import { formatCurrency, formatDate } from '@/lib/format';
import Link from 'next/link';

interface OrderCardProps {
  order: Order;
}

export function OrderCard({ order }: OrderCardProps) {
  return (
    <Link
      href={`/orders/${order.id}`}
      className="block p-4 border rounded-lg hover:shadow-md transition-shadow bg-white"
    >
      {/* Order number and date */}
      <div className="flex justify-between items-start mb-3">
        <div>
          <h3 className="font-semibold text-lg">{order.orderNumber}</h3>
          <p className="text-sm text-gray-500">
            {formatDate(order.createdAt)}
          </p>
        </div>
        <div className="flex flex-col gap-2 items-end">
          <OrderStatusBadge status={order.status} />
          <PaymentStatusBadge status={order.paymentStatus} />
        </div>
      </div>

      {/* Items preview */}
      <div className="mb-3 space-y-1">
        {order.items.slice(0, 2).map((item) => (
          <div key={item.id} className="text-sm text-gray-600">
            <span className="font-medium">{item.productName}</span>
            {item.variantName && (
              <span className="text-gray-500"> ({item.variantName})</span>
            )}
            <span className="text-gray-500"> × {item.quantity}</span>
          </div>
        ))}
        {order.items.length > 2 && (
          <p className="text-sm text-gray-500">
            +{order.items.length - 2} sản phẩm khác
          </p>
        )}
      </div>

      {/* Total */}
      <div className="flex justify-between items-center pt-3 border-t">
        <span className="text-sm text-gray-600">Tổng tiền:</span>
        <span className="text-lg font-bold text-primary">
          {formatCurrency(order.total)}
        </span>
      </div>
    </Link>
  );
}
