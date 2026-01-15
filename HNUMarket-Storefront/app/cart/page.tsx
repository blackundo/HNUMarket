"use client";

import { CartItemsList } from "@/components/cart/cart-items-list";
import { CartSummary } from "@/components/cart/cart-summary";
import { useCart } from "@/contexts/cart-context";
import { ShoppingCart } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";

/**
 * Cart page with items list and checkout summary
 */
export default function CartPage() {
  const { items } = useCart();

  if (items.length === 0) {
    return (
      <div className="min-h-screen bg-gray-50 py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="bg-white rounded-lg p-12 text-center">
            <ShoppingCart className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <h2 className="text-2xl font-bold text-gray-900 mb-2">
              Giỏ hàng trống
            </h2>
            <p className="text-gray-600 mb-6">
              Bạn chưa có sản phẩm nào trong giỏ hàng
            </p>
            <Link href="/">
              <Button size="lg">Tiếp tục mua sắm</Button>
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8 pb-24 md:pb-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <h1 className="text-2xl lg:text-3xl font-bold mb-8">GIỎ HÀNG CỦA BẠN</h1>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 lg:gap-8">
          {/* Left: Cart Items */}
          <div className="lg:col-span-2">
            <CartItemsList />
          </div>

          {/* Right: Summary */}
          <div className="lg:col-span-1">
            <CartSummary />
          </div>
        </div>
      </div>
    </div>
  );
}
