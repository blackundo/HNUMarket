"use client";

import { useState, useEffect, useRef } from "react";
import { useCart, CartItemWithDetails } from "@/contexts/cart-context";
import { formatCurrency } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { MessageCircle, Loader2 } from "lucide-react";
import { getActiveLocations, type ShippingLocation } from "@/lib/api/shipping";
import { getPublicSettings } from "@/lib/api/settings";
import { createOrder } from "@/lib/api/orders";
import {
  buildOrderConfirmationMessage,
  openMessengerWithMessage,
} from "@/lib/messenger-utils";
import { OrderSuccessModal } from "@/components/orders/order-success-modal";
import { useAuth } from "@/contexts/auth-context";
import { toast } from "sonner";
import { trackBeginCheckout, trackPurchase } from "@/lib/analytics/ga-ecommerce";

/**
 * Cart summary with recipient info and checkout button
 */
export function CartSummary() {
  const { user } = useAuth();
  const {
    summary,
    selectedItems,
    selectedShippingLocation,
    setSelectedShippingLocation,
    items,
    getItemDetails,
    note,
    productsCache,
    clearCart,
  } = useCart();
  const [address, setAddress] = useState("");
  const [phone, setPhone] = useState("");
  const [locations, setLocations] = useState<ShippingLocation[]>([]);
  const [loadingLocations, setLoadingLocations] = useState(true);
  const [isProcessing, setIsProcessing] = useState(false);
  const [messengerPageId, setMessengerPageId] = useState<string>("");
  const [checkoutNotes, setCheckoutNotes] = useState<string[]>([]);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [createdOrder, setCreatedOrder] = useState<{ id: string; orderNumber: string; totalAmount: number } | null>(null);

  // Request deduplication - prevent double-clicks
  const checkoutInProgressRef = useRef(false);

  useEffect(() => {
    loadShippingLocations();
    loadPublicSettings();
  }, []);

  const loadPublicSettings = async () => {
    try {
      const settings = await getPublicSettings();
      if (settings.messenger_page_id) {
        setMessengerPageId(settings.messenger_page_id);
      }
      // Parse checkout notes from settings
      if (settings.cart_checkout_notes) {
        const notes = settings.cart_checkout_notes
          .split('\n')
          .map((line: string) => line.trim())
          .filter((line: string) => line.length > 0);
        setCheckoutNotes(notes);
      }
    } catch (error) {
      console.error("Failed to load public settings:", error);
    }
  };

  const loadShippingLocations = async () => {
    try {
      const data = await getActiveLocations();
      setLocations(data);
      // Temporarily disabled - Auto-select first location if available
      // if (data.length > 0 && !selectedShippingLocation) {
      //   setSelectedShippingLocation(data[0]);
      // }
    } catch (error) {
      console.error("Failed to load shipping locations:", error);
    }
    setLoadingLocations(false);
  };

  const handleCheckout = async () => {
    // Prevent double-click/multiple submissions
    if (checkoutInProgressRef.current) {
      console.warn("Checkout already in progress, ignoring duplicate request");
      return;
    }

    // Validation
    if (selectedItems.size === 0) {
      toast.error("Vui lòng chọn ít nhất một sản phẩm");
      return;
    }

    // Temporarily disabled - will restore later
    // if (!selectedShippingLocation) {
    //   toast.error("Vui lòng chọn khu vực giao hàng");
    //   return;
    // }

    if (!phone.trim()) {
      toast.error("Vui lòng nhập số điện thoại");
      return;
    }

    if (!address.trim()) {
      toast.error("Vui lòng nhập địa chỉ nhận hàng");
      return;
    }

    // Mark checkout as in progress
    checkoutInProgressRef.current = true;

    try {
      setIsProcessing(true);

      // Get selected cart items
      const selectedCartItems = items.filter((item) => {
        const key = item.attributes
          ? `${item.productId}-${Object.entries(item.attributes)
            .sort(([a], [b]) => a.localeCompare(b))
            .map(([k, v]) => `${k}:${v}`)
            .join('|')}`
          : item.variantId
            ? `${item.productId}-${item.variantId}`
            : item.productId;
        return selectedItems.has(key);
      });

      // Track begin_checkout event
      const gaItems = selectedCartItems.map((item) => {
        const product = productsCache.get(item.productId);
        if (!product) return null;

        let variant;
        if (item.attributes && product.variants) {
          variant = product.variants.find((v) => {
            if (!v.attributes) return false;
            const vAttrs = v.attributes;
            const iAttrs = item.attributes!;
            const vKeys = Object.keys(vAttrs).sort();
            const iKeys = Object.keys(iAttrs).sort();
            if (vKeys.length !== iKeys.length) return false;
            return vKeys.every(
              (key, idx) => key === iKeys[idx] && vAttrs[key] === iAttrs[key]
            );
          });
        } else if (item.variantId && product.variants) {
          variant = product.variants.find((v) => v.id === item.variantId);
        }

        const price = variant?.price ?? product.price;
        const itemName = variant?.display_name
          ? `${product.name} - ${variant.display_name}`
          : product.name;

        return {
          item_id: item.productId,
          item_name: itemName,
          item_variant: variant?.display_name,
          price: price,
          quantity: item.quantity,
        };
      }).filter(Boolean);

      trackBeginCheckout({
        items: gaItems as any,
        value: summary.subtotal,
        currency: 'KRW',
      });

      // Build order items
      const orderItems = await Promise.all(
        selectedCartItems.map(async (item) => {
          const product = productsCache.get(item.productId);
          if (!product) {
            throw new Error(`Product ${item.productId} not found`);
          }

          // Find variant by attributes or ID
          let variant;
          if (item.attributes && product.variants) {
            variant = product.variants.find((v) => {
              if (!v.attributes) return false;
              const vAttrs = v.attributes;
              const iAttrs = item.attributes!;
              const vKeys = Object.keys(vAttrs).sort();
              const iKeys = Object.keys(iAttrs).sort();
              if (vKeys.length !== iKeys.length) return false;
              return vKeys.every(
                (key, idx) => key === iKeys[idx] && vAttrs[key] === iAttrs[key]
              );
            });
          } else if (item.variantId && product.variants) {
            variant = product.variants.find((v) => v.id === item.variantId);
          }

          const unitPrice = variant?.price ?? product.price;

          return {
            productId: item.productId,
            variantId: variant?.id,
            quantity: item.quantity,
            unitPrice,
          };
        })
      );

      // Create order with simple address
      const order = await createOrder({
        items: orderItems,
        shippingAddress: {
          fullName: user?.fullName?.trim() || user?.email || "Customer",
          phone: phone.trim(),
          address: address,
          ward: "",
          district: "",
          city: "khác", // Temporarily set to empty - was: selectedShippingLocation.name
        },
        paymentMethod: "sepay",
        shippingFee: summary.shipping,
        discount: 0,
        notes: note || undefined,
      });

      // Track purchase event
      trackPurchase({
        transaction_id: order.orderNumber,
        affiliation: 'HNUMarket Store',
        items: gaItems as any,
        value: summary.total,
        tax: 0,
        shipping: summary.shipping,
        currency: 'KRW',
      });

      // Set created order data
      setCreatedOrder({
        id: order.id,
        orderNumber: order.orderNumber,
        totalAmount: summary.total,
      });

      // Open messenger with order number message
      if (messengerPageId) {
        openMessengerWithMessage(
          buildOrderConfirmationMessage(order.orderNumber, summary.total),
          messengerPageId
        );
      }
      // Show success modal
      setShowSuccessModal(true);
    } catch (error) {
      console.error("Error during checkout:", error);

      // Show user-friendly error message
      const errorMessage = error instanceof Error
        ? error.message
        : "Không thể tạo đơn hàng. Vui lòng thử lại.";

      toast.error(errorMessage, {
        duration: 5000,
        description: "Nếu vấn đề tiếp tục xảy ra, vui lòng liên hệ hỗ trợ."
      });
    } finally {
      // Always reset state, even if error occurs
      setIsProcessing(false);
      checkoutInProgressRef.current = false;
    }
  };

  return (
    <>
      <div className="bg-white rounded-lg overflow-hidden sticky top-20">
        {/* Header */}
        <div className="p-4 bg-gray-50 border-b border-gray-200">
          <h2 className="font-bold text-lg">THÔNG TIN NGƯỜI NHẬN HÀNG</h2>
        </div>

        {/* Location Selection */}
        <div className="p-4 space-y-4">
          {/* <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Địa điểm giao hàng <span className="text-red-500">*</span>
          </label>
          {loadingLocations ? (
            <div className="flex items-center justify-center p-3 border border-gray-300 rounded-lg">
              <Loader2 className="h-4 w-4 animate-spin mr-2" />
              <span className="text-sm text-gray-500">Đang tải...</span>
            </div>
          ) : (
            <>
              <select
                value={selectedShippingLocation?.id || ""}
                onChange={(e) => {
                  const location = locations.find(
                    (loc) => loc.id === e.target.value
                  );
                  setSelectedShippingLocation(location || null);
                }}
                className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary text-sm"
              >
                <option value="">-- Chọn khu vực --</option>
                {locations.map((location) => (
                  <option key={location.id} value={location.id}>
                    {location.name} - {formatCurrency(location.fee)}
                  </option>
                ))}
              </select>
              {selectedShippingLocation && (
                <p className="text-xs text-gray-600 mt-1">
                  Phí vận chuyển:{" "}
                  <span className="font-bold text-primary">
                    {formatCurrency(selectedShippingLocation.fee)}
                  </span>
                </p>
              )}
            </>
          )}
        </div> */}

          {/* Phone Input */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Số điện thoại <span className="text-red-500">*</span>
            </label>
            <input
              type="tel"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="Số điện thoại liên hệ"
              className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary text-sm"
              required
            />
          </div>

          {/* Address Input */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Địa chỉ <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              placeholder="Địa chỉ cụ thể (ví dụ: 홍도동 123 1동)"
              className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary text-sm"
              required
            />
          </div>


          {/* Shipping Instructions */}
          {checkoutNotes.length > 0 && (
            <div className="text-xs text-gray-600 space-y-1 bg-blue-50 p-3 rounded-lg">
              <p className="font-medium text-gray-900">Lưu ý:</p>
              {checkoutNotes.map((note, index) => (
                <p key={index}>{index + 1}. {note}</p>
              ))}
            </div>
          )}
        </div>

        <Separator className="my-0" />

        {/* Price Summary */}
        <div className="p-4 space-y-3">
          <div className="flex items-center justify-between text-sm">
            <span className="text-gray-600">Tạm tính:</span>
            <span className="font-medium">{formatCurrency(summary.subtotal)}</span>
          </div>

          <div className="flex items-center justify-between">
            <span className="text-sm font-medium text-gray-900">PHÍ VẬN CHUYỂN ĐƠN HÀNG LÀ:</span>
            <span className={`text-lg font-bold ${summary.shipping === 0 ? 'text-green-600' : 'text-destructive'}`}>
              {summary.shipping === 0 ? 'Miễn phí' : formatCurrency(summary.shipping)}
            </span>
          </div>

          <Separator />

          <div className="flex items-center justify-between">
            <span className="text-base font-bold text-gray-900">TỔNG TIỀN:</span>
            <span className="text-2xl font-bold text-destructive">
              {formatCurrency(summary.total)}
            </span>
          </div>
        </div>

        {/* Checkout Button - Hidden on mobile, shown on desktop */}
        <div className="p-4 pt-0 hidden md:block">
          <Button
            onClick={handleCheckout}
            size="lg"
            className="w-full bg-destructive hover:bg-destructive/90 text-white font-bold text-base h-14"
            disabled={selectedItems.size === 0 || isProcessing}
          >
            {isProcessing ? (
              <>
                <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                ĐANG XỬ LÝ...
              </>
            ) : (
              <>
                <MessageCircle className="mr-2 h-5 w-5" />
                THANH TOÁN
              </>
            )}
          </Button>
        </div>

        {/* QR Code Section */}
        {/* <div className="p-4 border-t border-gray-200 bg-gray-50">
        <h3 className="text-sm font-medium text-gray-900 mb-3">
          Mô tả thêm về quy trình thanh toán
        </h3>
        <div className="aspect-square bg-gray-300 rounded-lg flex items-center justify-center">
          <span className="text-gray-500 text-xs">QR Code</span>
        </div>
      </div> */}
      </div>

      {/* Mobile Sticky Checkout Button - Outside sticky wrapper to avoid stacking context issues */}
      <div
        className="md:hidden fixed left-0 right-0 bottom-0 z-50 bg-white border-t border-gray-200 shadow-[0_-4px_12px_rgba(0,0,0,0.1)] p-4"
        style={{
          paddingBottom: "calc(16px + env(safe-area-inset-bottom))",
        }}
      >
        <Button
          onClick={handleCheckout}
          size="lg"
          className="w-full bg-destructive hover:bg-destructive/90 text-white font-bold text-base h-14"
          disabled={selectedItems.size === 0 || isProcessing}
        >
          {isProcessing ? (
            <>
              <Loader2 className="mr-2 h-5 w-5 animate-spin" />
              ĐANG XỬ LÝ...
            </>
          ) : (
            <>
              <MessageCircle className="mr-2 h-5 w-5" />
              THANH TOÁN
            </>
          )}
        </Button>
      </div>

      {/* Order Success Modal */}
      {
        showSuccessModal && createdOrder && (
          <OrderSuccessModal
            orderId={createdOrder.id}
            orderNumber={createdOrder.orderNumber}
            totalAmount={createdOrder.totalAmount}
            messengerPageId={messengerPageId}
            onClose={() => {
              setShowSuccessModal(false);
              setCreatedOrder(null);
              clearCart();
            }}
          />
        )
      }
    </>
  );
}
