"use client";

import { useState, useEffect } from "react";
import { useCart, CartItemWithDetails } from "@/contexts/cart-context";
import { CartItemRow } from "./cart-item-row";
import { Separator } from "@/components/ui/separator";
import { getPublicSettings } from "@/lib/api/settings";

/**
 * Cart items list with selection and quantity controls
 */
export function CartItemsList() {
  const { items, getItemDetails, selectAll, deselectAll, selectedItems, isLoadingProducts, loadProducts, note, setNote } = useCart();
  const [itemsWithDetails, setItemsWithDetails] = useState<CartItemWithDetails[]>([]);
  const [loading, setLoading] = useState(true);
  const [itemsNotes, setItemsNotes] = useState<string[]>([]);

  // Load products when component mounts or items change
  useEffect(() => {
    loadProducts();
    loadSettings();
  }, [items.length]);

  const loadSettings = async () => {
    try {
      const settings = await getPublicSettings();
      // Parse items notes from settings
      if (settings.cart_items_notes) {
        const notes = settings.cart_items_notes
          .split('\n')
          .map((line: string) => line.trim())
          .filter((line: string) => line.length > 0);
        setItemsNotes(notes);
      }
    } catch (error) {
      console.error("Failed to load settings:", error);
    }
  };

  // Load product details for all cart items
  useEffect(() => {
    const loadDetails = async () => {
      if (items.length === 0) {
        setItemsWithDetails([]);
        setLoading(false);
        return;
      }

      setLoading(true);
      const details = await Promise.all(
        items.map((item) => getItemDetails(item))
      );
      setItemsWithDetails(details.filter((d): d is CartItemWithDetails => d !== null));
      setLoading(false);
    };

    // Only load details when products are not loading
    if (!isLoadingProducts) {
      loadDetails();
    }
  }, [items, isLoadingProducts, getItemDetails]);

  const allSelected = items.length > 0 && selectedItems.size === items.length;
  const someSelected = selectedItems.size > 0 && selectedItems.size < items.length;

  const handleSelectAll = () => {
    if (allSelected) {
      deselectAll();
    } else {
      selectAll();
    }
  };

  if (loading || isLoadingProducts) {
    return (
      <div className="bg-white rounded-lg p-8 text-center">
        <p className="text-gray-600">Đang tải...</p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg overflow-hidden">
      {/* Header with Select All */}
      <div className="p-4 border-b border-gray-200 flex items-center gap-3">
        <input
          type="checkbox"
          checked={allSelected}
          ref={(input) => {
            if (input) {
              input.indeterminate = someSelected;
            }
          }}
          onChange={handleSelectAll}
          className="w-5 h-5 rounded border-gray-300 text-primary focus:ring-primary cursor-pointer"
        />
        <span className="text-sm font-medium text-gray-700">
          Chọn tất cả ({items.length} sản phẩm)
        </span>
      </div>

      {/* Cart Items */}
      <div className="divide-y divide-gray-200">
        {itemsWithDetails.map((item) => {
          // Generate unique key based on attributes or variantId
          const key = item.attributes
            ? `${item.productId}-${Object.entries(item.attributes)
              .sort(([a], [b]) => a.localeCompare(b))
              .map(([k, v]) => `${k}:${v}`)
              .join('|')}`
            : `${item.productId}-${item.variantId || "default"}`;

          return <CartItemRow key={key} item={item} />;
        })}
      </div>

      {/* Notes Section */}
      {itemsNotes.length > 0 && (
        <div className="p-4 border-t border-gray-200 bg-gray-50">
          <div className="space-y-2 text-xs text-gray-600">
            {itemsNotes.map((note, index) => (
              <p key={index} className="flex items-start gap-2">
                <span className="text-gray-400">•</span>
                <span>{note}</span>
              </p>
            ))}
          </div>
        </div>
      )}

      {/* Additional Notes */}
      <div className="p-4">
        <label className="block text-sm font-medium text-gray-700 mb-2">
          GHI CHÚ THÊM
        </label>
        <textarea
          value={note}
          onChange={(e) => setNote(e.target.value)}
          className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary resize-none"
          rows={4}
          placeholder="Thêm ghi chú cho đơn hàng..."
        />
      </div>
    </div>
  );
}
