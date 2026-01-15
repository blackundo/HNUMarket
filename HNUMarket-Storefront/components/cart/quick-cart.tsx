"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import { useCart, CartItemWithDetails } from "@/contexts/cart-context";
import { formatCurrency } from "@/lib/utils";
import { Package, Minus, Plus, Trash2, ShoppingCart } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from "@/components/ui/popover";

/**
 * Format variant attributes into display string
 * @example { "Color": "Blue", "Size": "M" } => "Màu: Xanh, Size: M"
 */
function formatVariantDisplay(variant: CartItemWithDetails["variant"]): string {
    if (!variant) return "";

    // For normalized variants with attributes
    if (variant.attributes && Object.keys(variant.attributes).length > 0) {
        return Object.entries(variant.attributes)
            .map(([key, value]) => `${key}: ${value}`)
            .join(", ");
    }

    // For legacy variants, use display_name or name
    return variant.display_name || variant.name || "";
}

/**
 * Quick cart preview component - shows cart items in a popover
 */
export function QuickCart() {
    const {
        items,
        itemCount,
        getItemDetails,
        updateQuantity,
        removeItem,
        summary,
        isLoadingProducts,
        loadProducts,
    } = useCart();
    const [itemsWithDetails, setItemsWithDetails] = useState<CartItemWithDetails[]>([]);
    const [loading, setLoading] = useState(false);
    const [open, setOpen] = useState(false);

    // Load products when popover opens
    useEffect(() => {
        if (open && items.length > 0) {
            loadProducts();
        }
    }, [open, items.length, loadProducts]);

    // Load product details for cart items
    useEffect(() => {
        const loadDetails = async () => {
            if (items.length === 0) {
                setItemsWithDetails([]);
                setLoading(false);
                return;
            }

            if (!open) return; // Only load when popover is open

            setLoading(true);
            const details = await Promise.all(
                items.slice(0, 10).map((item) => getItemDetails(item))
            );
            setItemsWithDetails(details.filter((d): d is CartItemWithDetails => d !== null));
            setLoading(false);
        };

        if (open && !isLoadingProducts) {
            loadDetails();
        }
    }, [items, open, isLoadingProducts, getItemDetails]);

    const handleQuantityDecrease = (productId: string, currentQuantity: number, variantId?: string) => {
        if (currentQuantity > 1) {
            updateQuantity(productId, variantId, currentQuantity - 1);
        }
    };

    const handleQuantityIncrease = (
        productId: string,
        currentQuantity: number,
        maxStock: number,
        variantId?: string
    ) => {
        if (currentQuantity < maxStock) {
            updateQuantity(productId, variantId, currentQuantity + 1);
        }
    };

    const displayedItems = itemsWithDetails.slice(0, 10);
    const hasMoreItems = items.length > 10;

    return (
        <Popover open={open} onOpenChange={setOpen}>
            <PopoverTrigger asChild>
                <Button variant="outline" className="hidden sm:flex relative gap-2 border-primary text-primary hover:bg-primary hover:text-primary-foreground">
                    <ShoppingCart className="h-5 w-5 sm:h-6 sm:w-6" />
                    <span className="hidden sm:inline">Giỏ hàng</span>
                    {itemCount > 0 && (
                        <span className="absolute -top-2 -right-2 bg-primary text-white text-xs rounded-full w-6 h-6 flex items-center justify-center font-medium">
                            {itemCount > 99 ? "99+" : itemCount}
                        </span>
                    )}
                </Button>
            </PopoverTrigger>
            <PopoverContent
                className="w-[90vw] sm:w-96 p-0 rounded-xl"
                align="end"
                sideOffset={8}
            >
                <div className="flex flex-col max-h-[80vh] rounded-xl overflow-hidden">
                    {/* Header */}
                    <div className="p-3 border-b border-gray-200">
                        <div className="flex items-center justify-between">
                            <h3 className="font-semibold text-md">
                                Giỏ hàng ({itemCount} {itemCount === 1 ? "sản phẩm" : "sản phẩm"})
                            </h3>
                        </div>
                    </div>

                    {/* Cart Items - Max height for 3 items (~112px each = ~336px) */}
                    <div className="flex-1 overflow-y-auto max-h-[336px]">
                        {loading || isLoadingProducts ? (
                            <div className="p-8 text-center">
                                <p className="text-gray-600 text-sm">Đang tải...</p>
                            </div>
                        ) : displayedItems.length === 0 ? (
                            <div className="p-8 text-center">
                                <ShoppingCart className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                                <p className="text-gray-600 text-sm mb-2">Giỏ hàng trống</p>
                                <p className="text-gray-500 text-xs">
                                    Thêm sản phẩm vào giỏ hàng để xem tại đây
                                </p>
                            </div>
                        ) : (
                            <div className="divide-y divide-gray-200">
                                {displayedItems.map((item) => {
                                    const itemPrice = item.variant?.price ?? item.product.price;
                                    const itemTotal = itemPrice * item.quantity;
                                    const maxStock = item.variant?.stock ?? item.product.stock;

                                    return (
                                        <div key={`${item.productId}-${item.variantId || "default"}`} className="p-4 hover:bg-gray-50 transition-colors relative">
                                            <div className="flex gap-3">
                                                {/* Product Image */}
                                                <Link
                                                    href={`/products/${item.product.slug}`}
                                                    onClick={() => setOpen(false)}
                                                    className="flex-shrink-0"
                                                >
                                                    <div className="w-20 h-20 bg-gray-100 rounded-lg overflow-hidden relative">
                                                        {item.product.images && item.product.images.length > 0 ? (
                                                            <Image
                                                                src={item.product.images[0].url}
                                                                alt={item.product.images[0].alt_text || item.product.name}
                                                                fill
                                                                className="object-cover"
                                                                sizes="80px"
                                                            />
                                                        ) : (
                                                            <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-gray-50 via-gray-100 to-gray-50">
                                                                <Package className="w-8 h-8 text-gray-300" strokeWidth={1.5} />
                                                            </div>
                                                        )}
                                                    </div>
                                                </Link>

                                                {/* Product Info */}
                                                <div className="flex-1 min-w-0 pr-8">
                                                    {/* Product Name */}
                                                    <Link
                                                        href={`/products/${item.product.slug}`}
                                                        onClick={() => setOpen(false)}
                                                        className="text-sm font-medium text-gray-900 hover:text-primary transition-colors line-clamp-2 mb-1 block"
                                                    >
                                                        {item.product.name}
                                                    </Link>

                                                    {/* Variant Name - Support normalized variants */}
                                                    {item.variant && (
                                                        <p className="text-xs text-gray-600 mb-2">
                                                            {formatVariantDisplay(item.variant)}
                                                        </p>
                                                    )}

                                                    {/* Quantity Controls and Remove Button */}
                                                    <div className="flex items-center justify-between">
                                                        {/* Quantity Controls */}
                                                        <div className="flex items-center gap-1">
                                                            <button
                                                                onClick={() =>
                                                                    handleQuantityDecrease(
                                                                        item.productId,
                                                                        item.quantity,
                                                                        item.variantId
                                                                    )
                                                                }
                                                                disabled={item.quantity <= 1}
                                                                className="w-6 h-6 flex items-center justify-center hover:bg-primary hover:text-white disabled:opacity-50 disabled:cursor-not-allowed transition-colors border border-gray-300 rounded-lg"
                                                            >
                                                                <Minus className="h-3 w-3" />
                                                            </button>
                                                            <span className="text-sm w-6 text-center">
                                                                {item.quantity}
                                                            </span>
                                                            <button
                                                                onClick={() =>
                                                                    handleQuantityIncrease(
                                                                        item.productId,
                                                                        item.quantity,
                                                                        maxStock,
                                                                        item.variantId
                                                                    )
                                                                }
                                                                disabled={item.quantity >= maxStock}
                                                                className="w-6 h-6 flex items-center justify-center hover:bg-primary hover:text-white disabled:opacity-50 disabled:cursor-not-allowed transition-colors border border-gray-300 rounded-lg"
                                                            >
                                                                <Plus className="h-3 w-3" />
                                                            </button>
                                                        </div>
                                                    </div>
                                                </div>

                                                {/* Remove Button - Top Right */}
                                                <button
                                                    onClick={() => removeItem(item.productId, item.variantId)}
                                                    className="absolute top-4 right-4 w-8 h-8 flex items-center justify-center  rounded-lg text-red-500 hover:bg-red-500 hover:text-white transition-colors"
                                                    aria-label="Xóa sản phẩm"
                                                >
                                                    <Trash2 className="h-5 w-5" />
                                                </button>
                                                {/* Price */}
                                                <span className="absolute bottom-4 right-4 text-base font-semibold text-primary">
                                                    {formatCurrency(itemTotal)}
                                                </span>
                                            </div>
                                        </div>
                                    );
                                })}

                                {hasMoreItems && (
                                    <div className="p-3 text-center text-xs text-gray-500 bg-gray-50">
                                        Và {items.length - 5} sản phẩm khác...
                                    </div>
                                )}
                            </div>
                        )}
                    </div>

                    {/* Footer with Total and View Cart Button */}
                    {displayedItems.length > 0 && (
                        <div className="p-4 border-t border-border border-gray-200 bg-white">
                            <div className="flex items-center justify-between mb-4">
                                <span className="text-sm font-medium text-gray-700">Tổng cộng:</span>
                                <span className="text-xl font-bold text-primary">
                                    {formatCurrency(summary.total)}
                                </span>
                            </div>
                            <Link href="/cart" onClick={() => setOpen(false)}>
                                <Button className="w-full py-6 bg-primary hover:bg-primary/90 text-white" size="default">
                                    Xem giỏ hàng
                                </Button>
                            </Link>
                        </div>
                    )}
                </div>
            </PopoverContent>
        </Popover>
    );
}

