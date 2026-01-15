import { OrderStatus, PaymentStatus } from '@/types/orders';
import { ORDER_STATUS_CONFIG, PAYMENT_STATUS_CONFIG } from '@/lib/api/orders';

interface OrderStatusBadgeProps {
  status: OrderStatus;
  className?: string;
}

interface PaymentStatusBadgeProps {
  status: PaymentStatus;
  className?: string;
}

const statusColors = {
  yellow: 'bg-yellow-100 text-yellow-800 border-yellow-200',
  blue: 'bg-blue-100 text-blue-800 border-blue-200',
  green: 'bg-green-100 text-green-800 border-green-200',
  red: 'bg-red-100 text-red-800 border-red-200',
  gray: 'bg-gray-100 text-gray-800 border-gray-200',
};

export function OrderStatusBadge({ status, className = '' }: OrderStatusBadgeProps) {
  const config = ORDER_STATUS_CONFIG[status];
  const colorClass = statusColors[config.color];

  return (
    <span
      className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium border ${colorClass} ${className}`}
    >
      {config.label}
    </span>
  );
}

export function PaymentStatusBadge({ status, className = '' }: PaymentStatusBadgeProps) {
  const config = PAYMENT_STATUS_CONFIG[status];
  const colorClass = statusColors[config.color];

  return (
    <span
      className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium border ${colorClass} ${className}`}
    >
      {config.label}
    </span>
  );
}
