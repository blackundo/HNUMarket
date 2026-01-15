import Link from "next/link";
import { Zap, Clock, Package } from "lucide-react";
import { storefrontProductsApi } from "@/lib/api/storefront-products";
import { transformProducts } from "@/lib/helpers/transform-api-data";
import { ProductCard } from "@/components/product/product-card";
import { FlashSaleCountdown } from "@/components/flash-sale/flash-sale-countdown";

interface FlashSalePageProps {
  searchParams: Promise<{
    limit?: string;
  }>;
}

/**
 * Flash Sale page showing all discounted products
 */
export default async function FlashSalePage({ searchParams }: FlashSalePageProps) {
  const { limit: limitParam } = await searchParams;
  const limit = Number(limitParam) || 20;

  try {
    const productsData = await storefrontProductsApi.getFlashSaleProducts(limit);
    const products = transformProducts(productsData);
    const hasMore = products.length >= limit;

    // Helper for Load More URL
    const getLoadMoreUrl = () => {
      const params = new URLSearchParams();
      params.set("limit", String(limit + 20));
      return `/flash-sale?${params.toString()}`;
    };

    return (
      <div className="min-h-screen bg-gray-50">
        <div className="max-w-screen-2xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {/* Header Banner - Glassmorphism */}
          <div className="relative rounded-2xl p-6 sm:p-8 mb-8 overflow-hidden border border-white/20 shadow-xl">
            {/* Background with blur effect */}
            <div className="absolute inset-0 bg-white/70 backdrop-blur-xl" />
            {/* Decorative gradient blobs */}
            <div className="absolute -top-20 -left-20 w-60 h-60 bg-primary/30 rounded-full blur-3xl" />
            <div className="absolute -bottom-20 -right-20 w-60 h-60 bg-orange-400/30 rounded-full blur-3xl" />
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-40 h-40 bg-rose-400/20 rounded-full blur-2xl" />

            <div className="relative flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
              {/* Left: Title and Description */}
              <div className="flex items-center gap-4">
                <div className="w-16 h-16 bg-primary/10 backdrop-blur-sm rounded-2xl flex items-center justify-center border border-primary/20 shadow-lg">
                  <Zap className="w-8 h-8 text-primary" strokeWidth={2.5} />
                </div>
                <div>
                  <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-gray-900 flex items-center gap-2">
                    Flash Sale
                  </h1>
                  <p className="text-gray-600 text-sm sm:text-base mt-1">
                    Săn deal khủng - Giá sốc mỗi ngày!
                  </p>
                </div>
              </div>

              {/* Right: Countdown Timer */}
              <FlashSaleCountdown variant="glass" />
            </div>
          </div>

          {/* Products Section */}
          <div className="bg-white rounded-lg p-4 sm:p-6 shadow-sm">
            {/* Section Header */}
            <div className="flex items-center justify-between mb-6 pb-4 border-b">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-primary/10 rounded-lg flex items-center justify-center">
                  <Zap className="w-5 h-5 text-primary" />
                </div>
                <div>
                  <h2 className="text-lg font-bold text-gray-900">
                    Sản phẩm đang giảm giá
                  </h2>
                  <p className="text-sm text-gray-500">
                    {products.length} sản phẩm
                  </p>
                </div>
              </div>
            </div>

            {/* Products Grid */}
            {products.length > 0 ? (
              <>
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 xl:grid-cols-5 gap-3 sm:gap-4">
                  {products.map((product) => (
                    <ProductCard key={product.id} product={product} />
                  ))}
                </div>

                {/* Load More Button */}
                {hasMore && (
                  <div className="flex justify-center mt-8">
                    <Link
                      href={getLoadMoreUrl()}
                      scroll={false}
                      className="inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 border border-input bg-background hover:bg-accent hover:text-accent-foreground h-11 px-8"
                    >
                      Xem thêm sản phẩm
                    </Link>
                  </div>
                )}
              </>
            ) : (
              <div className="text-center py-16">
                <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Package className="w-10 h-10 text-gray-300" />
                </div>
                <h3 className="text-xl font-medium text-gray-900 mb-2">
                  Chưa có sản phẩm Flash Sale
                </h3>
                <p className="text-gray-600 mb-6">
                  Hãy quay lại sau để săn deal nhé!
                </p>
                <Link
                  href="/"
                  className="inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-medium bg-primary text-white hover:bg-primary/90 h-11 px-8 transition-colors"
                >
                  Về trang chủ
                </Link>
              </div>
            )}
          </div>
        </div>
      </div>
    );
  } catch (error) {
    console.error("Error loading flash sale products:", error);
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="max-w-screen-2xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="bg-white rounded-lg p-12 text-center">
            <Package className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <h3 className="text-xl font-medium text-gray-900 mb-2">
              Không thể tải sản phẩm
            </h3>
            <p className="text-gray-600">
              Đã có lỗi xảy ra. Vui lòng thử lại sau.
            </p>
          </div>
        </div>
      </div>
    );
  }
}

/**
 * Metadata for SEO
 */
export const metadata = {
  title: "Flash Sale - Giảm giá sốc | HNU Market Korea",
  description: "Săn deal khủng với Flash Sale từ HNU Market Korea. Giá sốc mỗi ngày, số lượng có hạn!",
  openGraph: {
    title: "Flash Sale - Giảm giá sốc | HNU Market Korea",
    description: "Săn deal khủng với Flash Sale từ HNU Market Korea. Giá sốc mỗi ngày, số lượng có hạn!",
  },
};
