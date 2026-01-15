import { OrderItem } from '@/types/orders';
import { formatCurrency } from '@/lib/format';
import Image from 'next/image';
import { Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { QuantityEditor } from '@/components/admin/orders/QuantityEditor';

interface OrderItemCardProps {
  item: OrderItem;
  editable?: boolean;
  onUpdate?: (itemId: string, newQuantity: number) => void;
  onRemove?: (itemId: string) => void;
  updating?: boolean;
}

export function OrderItemCard({
  item,
  editable = false,
  onUpdate,
  onRemove,
  updating = false
}: OrderItemCardProps) {
  // Get product image from populated product or use placeholder
  const imageUrl = (() => {
    const image = item.product?.images?.[0];
    if (typeof image === 'string' && image !== '') return image;
    if (image && typeof image === 'object' && 'url' in image) {
      const url = (image as { url?: string }).url;
      if (url && url !== '') return url;
    }
    return '/placeholder.png';
  })();

  return (
    <div className="flex gap-4 p-4 border rounded-lg bg-white">
      {/* Product image */}
      <div className="relative w-20 h-20 rounded overflow-hidden flex-shrink-0 bg-gray-100">
        <Image
          src={imageUrl}
          alt={item.productName}
          fill
          className="object-cover"
          sizes="80px"
        />
      </div>

      {/* Product info */}
      <div className="flex-1 min-w-0">
        <h4 className="font-medium text-gray-900 truncate">{item.productName}</h4>
        {item.variantName && (
          <p className="text-sm text-gray-500 mt-1">
            Phân loại: <span className="font-medium">{item.variantName}</span>
          </p>
        )}

        {editable ? (
          <div className="flex items-center gap-3 mt-2">
            <span className="text-sm text-gray-600">Số lượng:</span>
            <QuantityEditor
              quantity={item.quantity}
              min={1}
              max={item.variant?.stock || item.product?.stock}
              onChange={(newQty) => onUpdate?.(item.id, newQty)}
              disabled={updating}
            />
            <Button
              variant="ghost"
              size="sm"
              onClick={() => onRemove?.(item.id)}
              disabled={updating}
              className="text-destructive hover:text-destructive hover:bg-destructive/10"
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
        ) : (
          <p className="text-sm text-gray-600 mt-1">
            Số lượng: <span className="font-medium">{item.quantity}</span>
          </p>
        )}
      </div>

      {/* Pricing */}
      <div className="text-right flex-shrink-0">
        <p className="text-sm text-gray-500">
          {formatCurrency(item.unitPrice)}
        </p>
        <p className="font-semibold text-primary mt-1">
          {formatCurrency(item.totalPrice)}
        </p>
      </div>
    </div>
  );
}
