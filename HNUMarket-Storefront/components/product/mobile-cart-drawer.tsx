"use client";

import { useRouter } from "next/navigation";
import Image from "next/image";
import { X, Minus, Plus, Package } from "lucide-react";
import { useCart, CartItemWithDetails } from "@/contexts/cart-context";
import { useMobileCartDrawer } from "@/contexts/mobile-cart-drawer-provider";
import { formatCurrency } from "@/lib/utils";
import { getImageUrl } from "@/lib/image";
import { Button } from "@/components/ui/button";
import {
    Drawer,
    DrawerContent,
    DrawerHeader,
    DrawerFooter,
    DrawerTitle,
} from "@/components/ui/drawer";
import { useEffect, useState } from "react";

/**
 * Mobile Cart Drawer - Hiển thị giỏ hàng dạng drawer cho mobile
 */
export function MobileCartDrawer() {
    const router = useRouter();
    const { isOpen, closeDrawer } = useMobileCartDrawer();
    const { items, updateQuantity, removeItem, summary, productsCache, loadProducts, isLoadingProducts } = useCart();
    const [cartItemsWithDetails, setCartItemsWithDetails] = useState<CartItemWithDetails[]>([]);

    // Load products when drawer opens
    useEffect(() => {
        if (isOpen && items.length > 0) {
            loadProducts();
        }
    }, [isOpen, items.length, loadProducts]);

    // Build cart items with details from cache
    useEffect(() => {
        if (productsCache.size > 0) {
            const itemsWithDetails: CartItemWithDetails[] = [];
            items.forEach((item) => {
                const product = productsCache.get(item.productId);
                if (product) {
                    const variant = item.variantId
                        ? product.variants?.find((v) => v.id === item.variantId)
                        : undefined;
                    itemsWithDetails.push({
                        ...item,
                        product,
                        variant,
                    });
                }
            });
            setCartItemsWithDetails(itemsWithDetails);
        }
    }, [items, productsCache]);

    const handleQuantityDecrease = (item: CartItemWithDetails) => {
        if (item.quantity > 1) {
            updateQuantity(item.productId, item.variantId, item.quantity - 1);
        }
    };

    const handleQuantityIncrease = (item: CartItemWithDetails) => {
        const maxStock = item.variant?.stock || item.product.stock;
        if (item.quantity < maxStock) {
            updateQuantity(item.productId, item.variantId, item.quantity + 1);
        }
    };

    const handleRemoveItem = (item: CartItemWithDetails) => {
        removeItem(item.productId, item.variantId);
    };

    const handleViewCart = () => {
        closeDrawer();
        router.push("/cart");
    };

    const totalItems = items.reduce((sum, item) => sum + item.quantity, 0);

    return (
        <Drawer open={isOpen} onOpenChange={(open) => !open && closeDrawer()}>
            <DrawerContent className="max-h-[85vh]">
                {/* Header */}
                <DrawerHeader className="border-b px-4 py-3">
                    <div className="flex items-center justify-between">
                        <DrawerTitle className="text-base font-semibold text-primary">
                            {totalItems} sản phẩm
                        </DrawerTitle>
                        <span className="text-lg font-bold text-primary">
                            {formatCurrency(summary.subtotal)}
                        </span>
                        <button
                            onClick={closeDrawer}
                            className="text-primary font-medium hover:opacity-80 transition-opacity"
                        >
                            Đóng
                        </button>
                    </div>
                </DrawerHeader>

                {/* Cart Items */}
                <div className="flex-1 overflow-auto px-4 py-2 max-h-[50vh]">
                    {isLoadingProducts ? (
                        <div className="flex items-center justify-center py-8">
                            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                        </div>
                    ) : cartItemsWithDetails.length === 0 ? (
                        <div className="text-center py-8 text-gray-500">
                            Giỏ hàng trống
                        </div>
                    ) : (
                        <div className="space-y-4">
                            {cartItemsWithDetails.map((item) => {
                                const itemPrice = item.variant?.price ?? item.product.price;
                                const itemTotal = itemPrice * item.quantity;

                                return (
                                    <div
                                        key={`${item.productId}-${item.variantId || "default"}`}
                                        className="flex gap-3 py-3 border-b border-gray-100 last:border-0"
                                    >
                                        {/* Product Image */}
                                        <div className="w-16 h-16 bg-gray-100 rounded-lg overflow-hidden flex-shrink-0 relative">
                                            {item.product.images && item.product.images.length > 0 ? (
                                                <Image
                                                    src={getImageUrl(item.product.images[0].url)}
                                                    alt={item.product.images[0].alt_text || item.product.name}
                                                    fill
                                                    className="object-cover"
                                                    sizes="64px"
                                                />
                                            ) : (
                                                <div className="w-full h-full flex items-center justify-center">
                                                    <Package className="w-6 h-6 text-gray-300" />
                                                </div>
                                            )}
                                        </div>

                                        {/* Product Info */}
                                        <div className="flex-1 min-w-0">
                                            <div className="flex justify-between items-start gap-2">
                                                <div className="flex-1">
                                                    <h4 className="text-sm font-medium text-gray-900 line-clamp-2">
                                                        {item.product.name}
                                                    </h4>
                                                    {item.variant && (
                                                        <p className="text-xs text-gray-500 mt-0.5">
                                                            {item.variant.name}
                                                        </p>
                                                    )}
                                                </div>
                                                <button
                                                    onClick={() => handleRemoveItem(item)}
                                                    className="text-gray-400 hover:text-gray-600 p-1"
                                                >
                                                    <X className="w-4 h-4" />
                                                </button>
                                            </div>

                                            {/* Quantity & Price */}
                                            <div className="flex items-center justify-between mt-2">
                                                <div className="flex items-center border border-gray-200 rounded-lg">
                                                    <button
                                                        onClick={() => handleQuantityDecrease(item)}
                                                        disabled={item.quantity <= 1}
                                                        className="w-8 h-8 flex items-center justify-center text-gray-600 disabled:opacity-40"
                                                    >
                                                        <Minus className="w-3 h-3" />
                                                    </button>
                                                    <span className="w-8 text-center text-sm font-medium">
                                                        {item.quantity}
                                                    </span>
                                                    <button
                                                        onClick={() => handleQuantityIncrease(item)}
                                                        className="w-8 h-8 flex items-center justify-center text-gray-600"
                                                    >
                                                        <Plus className="w-3 h-3" />
                                                    </button>
                                                </div>
                                                <span className="text-base font-bold text-gray-900">
                                                    {formatCurrency(itemTotal)}
                                                </span>
                                            </div>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    )}
                </div>

                {/* Footer */}
                <DrawerFooter className="border-t px-4 py-4">
                    <div className="flex items-center justify-between mb-4">
                        <span className="text-base font-medium text-gray-700">TỔNG TIỀN:</span>
                        <span className="text-xl font-bold text-primary">
                            {formatCurrency(summary.subtotal)}
                        </span>
                    </div>
                    <Button
                        onClick={handleViewCart}
                        className="w-full h-12 text-base font-bold rounded-full bg-primary hover:bg-primary/90 text-white"
                    >
                        XEM GIỎ HÀNG
                    </Button>
                </DrawerFooter>
            </DrawerContent>
        </Drawer>
    );
}
