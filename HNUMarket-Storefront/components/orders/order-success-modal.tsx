'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { X, Copy, CheckCircle, MessageCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  buildOrderConfirmationMessage,
  openMessengerWithMessage,
} from '@/lib/messenger-utils';

interface OrderSuccessModalProps {
  orderId: string;
  orderNumber: string;
  totalAmount: number;
  messengerPageId?: string;
  onClose: () => void;
}

export function OrderSuccessModal({
  orderId,
  orderNumber,
  totalAmount,
  messengerPageId,
  onClose,
}: OrderSuccessModalProps) {
  const router = useRouter();
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(orderNumber);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (error) {
      console.error('Failed to copy:', error);
    }
  };

  const handleMessengerClick = () => {
    // Open messenger with order number message
    if (messengerPageId) {
      openMessengerWithMessage(
        buildOrderConfirmationMessage(orderNumber, totalAmount),
        messengerPageId
      );
    }

    // Close modal
    onClose();

    // Redirect to order detail page
    router.push(`/orders/${orderNumber}`);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
      <div className="bg-white rounded-lg max-w-md w-full p-6 relative">
        {/* Close button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-gray-400 hover:text-gray-600"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Success icon */}
        <div className="flex justify-center mb-4">
          <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center">
            <CheckCircle className="w-10 h-10 text-green-600" />
          </div>
        </div>

        {/* Title */}
        <h2 className="text-2xl font-bold text-center mb-2">
          Đặt hàng thành công!
        </h2>
        <p className="text-center text-gray-600 mb-6">
          Đơn hàng của bạn đã được tạo thành công
        </p>

        {/* Order number */}
        <div className="mb-6">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Mã đơn hàng
          </label>
          <div className="flex gap-2">
            <input
              type="text"
              value={orderNumber}
              readOnly
              className="flex-1 px-4 py-3 border border-gray-300 rounded-lg bg-gray-50 font-mono text-center text-lg font-semibold"
            />
            <button
              onClick={handleCopy}
              className="px-4 py-3 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
              title="Copy mã đơn hàng"
            >
              {copied ? (
                <CheckCircle className="w-5 h-5 text-green-600" />
              ) : (
                <Copy className="w-5 h-5 text-gray-600" />
              )}
            </button>
          </div>
          <p className="text-xs text-gray-500 mt-2">
            Click vào nút copy để sao chép mã đơn hàng
          </p>
        </div>

        {/* Instructions */}
        <div className="mb-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
          <p className="text-sm text-blue-900 font-medium mb-2">
            Hướng dẫn:
          </p>
          <ol className="text-sm text-blue-800 space-y-1 list-decimal list-inside">
            <li>Copy mã đơn hàng ở trên</li>
            <li>Nhấn nút "Gửi tin nhắn chốt đơn" bên dưới</li>
            <li>Dán mã đơn hàng vào tin nhắn Messenger</li>
            <li>Gửi tin nhắn để chốt đơn hàng</li>
          </ol>
        </div>

        {/* Action buttons */}
        <div className="space-y-3">
          <Button
            onClick={handleMessengerClick}
            className="w-full bg-primary hover:bg-primary/90 text-white font-medium h-12 text-base"
          >
            <MessageCircle className="w-5 h-5 mr-2" />
            Gửi tin nhắn chốt đơn
          </Button>

          <Button
            onClick={() => {
              onClose();
              router.push(`/orders/${orderNumber}`);
            }}
            variant="outline"
            className="w-full h-12 text-base"
          >
            Xem chi tiết đơn hàng
          </Button>
        </div>
      </div>
    </div>
  );
}
