"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import { useCart, CartItemWithDetails } from "@/contexts/cart-context";
import { formatCurrency } from "@/lib/utils";
import { Package, Minus, Plus, Trash2, ShoppingCart } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
    Sheet,
    SheetContent,
    SheetHeader,
    SheetTitle,
    SheetTrigger,
} from "@/components/ui/sheet";

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
export function QuickCart({ customTrigger }: { customTrigger?: boolean }) {
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

    // Load products when sheet opens
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

            if (!open) return; // Only load when sheet is open

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
        <Sheet open={open} onOpenChange={setOpen}>
            <SheetTrigger asChild>
                {customTrigger ? (
                    <Button variant="outline" className={`hidden sm:flex h-12 gap-2 border-gray-200 rounded-sm hover:border-primary hover:text-accent-foreground group`}>
                        <div className="relative">
                            <ShoppingCart className="w-5 h-5" />
                            {itemCount > 0 && (
                                <span className="absolute -top-1 -right-1 bg-primary text-white text-[10px] w-4 h-4 flex items-center justify-center rounded-full">
                                    {itemCount > 99 ? "99+" : itemCount}
                                </span>
                            )}
                        </div>
                        <span className="hidden lg:inline text-sm font-semibold text-gray-700 group-hover:text-accent-foreground">Giỏ hàng</span>
                    </Button>
                ) : (
                    <Button variant="outline" className="hidden sm:flex relative gap-2 border-primary text-primary hover:bg-primary hover:text-accent-foreground">
                        <ShoppingCart className="h-5 w-5 sm:h-6 sm:w-6" />
                        <span className="hidden sm:inline">Giỏ hàng</span>
                        {itemCount > 0 && (
                            <span className="absolute -top-2 -right-2 bg-primary text-white text-xs rounded-full w-6 h-6 flex items-center justify-center font-medium">
                                {itemCount > 99 ? "99+" : itemCount}
                            </span>
                        )}
                    </Button>
                )}
            </SheetTrigger>
            <SheetContent side="right" className="w-full sm:w-[400px] flex flex-col p-0">
                <SheetHeader className="px-5 py-4 border-b">
                    <SheetTitle>Giỏ hàng ({itemCount} sản phẩm)</SheetTitle>
                </SheetHeader>

                {/* Cart Items */}
                <div className="flex-1 overflow-y-auto">
                    {loading || isLoadingProducts ? (
                        <div className="p-8 text-center flex items-center justify-center h-full">
                            <p className="text-gray-600 text-sm">Đang tải giỏ hàng...</p>
                        </div>
                    ) : displayedItems.length === 0 ? (
                        <div className="p-8 text-center flex flex-col items-center justify-center h-full space-y-4">
                            <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center">
                                <ShoppingCart className="w-10 h-10 text-gray-400" />
                            </div>
                            <div className="space-y-1">
                                <p className="text-gray-900 font-medium">Giỏ hàng trống</p>
                                <p className="text-gray-500 text-sm">
                                    Thêm sản phẩm để bắt đầu mua sắm
                                </p>
                            </div>
                        </div>
                    ) : (
                        <div className="divide-y divide-gray-100">
                            {displayedItems.map((item) => {
                                const itemPrice = item.variant?.price ?? item.product.price;
                                const itemTotal = itemPrice * item.quantity;
                                const maxStock = item.variant?.stock ?? item.product.stock;

                                return (
                                    <div key={`${item.productId}-${item.variantId || "default"}`} className="p-4 hover:bg-gray-50 transition-colors relative group">
                                        <div className="flex gap-4">
                                            {/* Product Image */}
                                            <Link
                                                href={`/products/${item.product.slug}`}
                                                onClick={() => setOpen(false)}
                                                className="flex-shrink-0"
                                            >
                                                <div className="w-20 h-24 bg-gray-100 rounded-md overflow-hidden relative border border-gray-200">
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
                                            <div className="flex-1 min-w-0 flex flex-col justify-between py-1">
                                                <div>
                                                    <div className="flex justify-between items-start gap-2">
                                                        <Link
                                                            href={`/products/${item.product.slug}`}
                                                            onClick={() => setOpen(false)}
                                                            className="text-sm font-medium text-gray-900 hover:text-primary transition-colors line-clamp-2"
                                                        >
                                                            {item.product.name}
                                                        </Link>
                                                        <button
                                                            onClick={() => removeItem(item.productId, item.variantId)}
                                                            className="text-gray-400 hover:text-red-500 transition-colors p-1 -mr-2 -mt-1"
                                                            aria-label="Xóa sản phẩm"
                                                        >
                                                            <Trash2 className="h-4 w-4" />
                                                        </button>
                                                    </div>

                                                    {/* Variant Name */}
                                                    {item.variant && (
                                                        <p className="text-xs text-gray-500 mt-1">
                                                            {formatVariantDisplay(item.variant)}
                                                        </p>
                                                    )}
                                                </div>

                                                <div className="flex items-end justify-between mt-2">
                                                    {/* Quantity Controls */}
                                                    <div className="flex items-center border border-gray-200 rounded-md bg-white">
                                                        <button
                                                            onClick={() =>
                                                                handleQuantityDecrease(
                                                                    item.productId,
                                                                    item.quantity,
                                                                    item.variantId
                                                                )
                                                            }
                                                            disabled={item.quantity <= 1}
                                                            className="w-7 h-7 flex items-center justify-center hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                                                        >
                                                            <Minus className="h-3 w-3 text-gray-600" />
                                                        </button>
                                                        <span className="text-sm font-medium w-6 text-center text-gray-900">
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
                                                            className="w-7 h-7 flex items-center justify-center hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                                                        >
                                                            <Plus className="h-3 w-3 text-gray-600" />
                                                        </button>
                                                    </div>

                                                    {/* Price */}
                                                    <span className="text-sm font-bold text-primary">
                                                        {formatCurrency(itemTotal)}
                                                    </span>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                );
                            })}

                            {hasMoreItems && (
                                <div className="p-4 text-center text-xs text-gray-500 bg-gray-50">
                                    Và {items.length - 10} sản phẩm khác trong giỏ hàng...
                                </div>
                            )}
                        </div>
                    )}
                </div>

                {/* Footer with Total and Checkout */}
                {displayedItems.length > 0 && (
                    <div className="p-5 border-t border-gray-200 bg-gray-50/50 space-y-4">
                        <div className="space-y-2">
                            <div className="flex items-center justify-between">
                                <span className="text-sm text-gray-600">Tạm tính:</span>
                                <span className="text-base font-semibold text-gray-900">
                                    {formatCurrency(summary.total)}
                                </span>
                            </div>
                            <div className="flex items-center justify-between text-lg font-bold">
                                <span className="text-gray-900">Tổng cộng:</span>
                                <span className="text-primary">{formatCurrency(summary.total)}</span>
                            </div>
                        </div>

                        <div className="grid grid-cols-1 gap-3">
                            <Link href="/cart" onClick={() => setOpen(false)} className="col-span-1">
                                <Button className="w-full h-11 bg-primary hover:bg-primary/90 text-white shadow-sm">
                                    Xem giỏ hàng
                                </Button>
                            </Link>
                        </div>
                    </div>
                )}
            </SheetContent>
        </Sheet>
    );
}

