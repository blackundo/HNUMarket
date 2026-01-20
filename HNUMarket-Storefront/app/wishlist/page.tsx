"use client";

import { useEffect, useState } from "react";
import { useWishlist } from "@/contexts/wishlist-context";
import { storefrontProductsApi, StorefrontProduct } from "@/lib/api/storefront-products";
import { transformProductAuto } from "@/lib/helpers/transform-api-data";
import { Product } from "@/types";
import { ProductCard } from "@/components/product/product-card";
import { Heart, Trash2, ArrowLeft, ShoppingBag } from "lucide-react";
import Link from "next/link";
import { Skeleton } from "@/components/ui/skeleton";

export default function WishlistPage() {
    const { items, clearWishlist, itemCount } = useWishlist();
    const [products, setProducts] = useState<Product[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    // Fetch product details for wishlist items
    useEffect(() => {
        const fetchProducts = async () => {
            if (items.length === 0) {
                setProducts([]);
                setIsLoading(false);
                return;
            }

            setIsLoading(true);
            try {
                const productIds = items.map((item) => item.productId);
                const fetchedProducts = await storefrontProductsApi.getProductsByIds(productIds);

                // Transform API products to Product type
                const transformedProducts = fetchedProducts
                    .map((p: StorefrontProduct) => transformProductAuto(p))
                    .filter((p): p is Product => p !== null);

                setProducts(transformedProducts);
            } catch (error) {
                console.error("Failed to fetch wishlist products:", error);
            } finally {
                setIsLoading(false);
            }
        };

        fetchProducts();
    }, [items]);

    return (
        <div className="min-h-screen bg-gray-50/50">
            {/* Header */}
            <div className="bg-white border-b border-gray-100 top-0 z-10">
                <div className="container mx-auto px-4 py-4 md:py-6">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            <Link
                                href="/"
                                className="p-2 -ml-2 rounded-full hover:bg-gray-100 transition-colors md:hidden"
                            >
                                <ArrowLeft className="w-5 h-5 text-gray-600" />
                            </Link>
                            <div className="flex items-center gap-2">
                                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-pink-500 to-rose-500 flex items-center justify-center shadow-lg shadow-pink-200">
                                    <Heart className="w-5 h-5 text-white fill-white" />
                                </div>
                                <div>
                                    <h1 className="text-xl md:text-2xl font-bold text-gray-900">
                                        Sản phẩm yêu thích
                                    </h1>
                                    <p className="text-sm text-gray-500">
                                        {itemCount} sản phẩm trong danh sách
                                    </p>
                                </div>
                            </div>
                        </div>

                        {itemCount > 0 && (
                            <button
                                onClick={clearWishlist}
                                className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-red-600 hover:text-red-700 hover:bg-red-50 rounded-lg transition-all duration-200"
                            >
                                <Trash2 className="w-4 h-4" />
                                <span className="hidden sm:inline">Xóa tất cả</span>
                            </button>
                        )}
                    </div>
                </div>
            </div>

            {/* Content */}
            <div className="container mx-auto px-4 py-6 md:py-8">
                {isLoading ? (
                    // Loading skeleton
                    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
                        {Array.from({ length: 4 }).map((_, i) => (
                            <div key={i} className="bg-white rounded-xl border border-gray-200 overflow-hidden">
                                <Skeleton className="aspect-square w-full" />
                                <div className="p-4 space-y-3">
                                    <Skeleton className="h-4 w-3/4" />
                                    <Skeleton className="h-4 w-1/2" />
                                    <Skeleton className="h-8 w-full" />
                                </div>
                            </div>
                        ))}
                    </div>
                ) : itemCount === 0 ? (
                    // Empty state
                    <div className="flex flex-col items-center justify-center py-16 md:py-24">
                        <div className="w-24 h-24 rounded-full bg-gradient-to-br from-gray-100 to-gray-200 flex items-center justify-center mb-6">
                            <Heart className="w-12 h-12 text-gray-400" />
                        </div>
                        <h2 className="text-xl font-semibold text-gray-900 mb-2">
                            Chưa có sản phẩm yêu thích
                        </h2>
                        <p className="text-gray-500 text-center max-w-md mb-6">
                            Hãy thêm sản phẩm vào danh sách yêu thích để dễ dàng theo dõi và mua sắm sau.
                        </p>
                        <Link
                            href="/"
                            className="inline-flex items-center gap-2 px-6 py-3 bg-primary text-white font-semibold rounded-xl hover:bg-primary/90 transition-all duration-200 shadow-lg shadow-primary/25"
                        >
                            <ShoppingBag className="w-5 h-5" />
                            Khám phá sản phẩm
                        </Link>
                    </div>
                ) : (
                    // Product grid
                    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
                        {products.map((product) => (
                            <ProductCard key={product.id} product={product} />
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}
