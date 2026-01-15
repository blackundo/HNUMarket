import Image from "next/image";
import { notFound } from "next/navigation";
import Link from "next/link";
import { Package } from "lucide-react";
import { storefrontCategoriesApi } from "@/lib/api/storefront-categories";
import { transformCategory, transformProducts } from "@/lib/helpers/transform-api-data";
import { ProductCard } from "@/components/product/product-card";
import { CategoryControls, CategorySort } from "@/components/filters/category-controls";

interface CategoryPageProps {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{
    page?: string;
    limit?: string;
    min_price?: string;
    max_price?: string;
    sort_by?: string;
    sort_order?: string;
  }>;
}

/**
 * Category page showing all products in a specific category
 */
export default async function CategoryPage({ params, searchParams }: CategoryPageProps) {
  const { slug } = await params;
  const {
    page: pageParam,
    limit: limitParam,
    min_price,
    max_price,
    sort_by,
    sort_order
  } = await searchParams;

  const page = Number(pageParam) || 1;
  const limit = Number(limitParam) || 10;

  try {
    const [categoryData, productsData] = await Promise.all([
      storefrontCategoriesApi.getCategoryBySlug(slug),
      storefrontCategoriesApi.getCategoryProducts(slug, {
        page: 1, // Always fetch from page 1 to limit
        limit,
        min_price: min_price ? Number(min_price) : undefined,
        max_price: max_price ? Number(max_price) : undefined,
        sort_by: (sort_by || 'name') as any,
        sort_order: (sort_order || 'asc') as any,
      }),
    ]);

    const category = transformCategory(categoryData);
    const categoryProducts = transformProducts(productsData.data);
    const totalProducts = productsData.meta.total;
    const hasMore = categoryProducts.length < totalProducts;

    // Helper for Load More URL
    const getLoadMoreUrl = () => {
      const params = new URLSearchParams();
      if (min_price) params.set("min_price", min_price);
      if (max_price) params.set("max_price", max_price);
      if (sort_by) params.set("sort_by", sort_by);
      if (sort_order) params.set("sort_order", sort_order);
      params.set("limit", String(limit + 10));
      return `/categories/${slug}?${params.toString()}`;
    };

    return (
      <div className="min-h-screen bg-gray-50">
        <div className="max-w-screen-2xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="flex flex-col lg:flex-row gap-8">
            {/* Sidebar Filter (20%) */}
            <div className="w-full lg:w-1/5 shrink-0 space-y-6">
              <CategoryControls
                initialMinPrice={min_price ? Number(min_price) : undefined}
                initialMaxPrice={max_price ? Number(max_price) : undefined}
                initialSortBy={sort_by}
                initialSortOrder={sort_order}
              />
            </div>

            {/* Main Content (80%) */}
            <div className="w-full lg:w-4/5">
              {/* Header */}
              <div className="bg-white rounded-lg p-6 mb-6 shadow-sm">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 relative rounded-lg overflow-hidden shrink-0">
                      {category.image ? (
                        <Image
                          src={category.image}
                          alt={category.name}
                          fill
                          className="object-cover"
                        />
                      ) : (
                        <div className="w-full h-full bg-gradient-to-br from-primary/10 to-primary/5 flex items-center justify-center">
                          <Package className="w-6 h-6 text-primary" strokeWidth={1.5} />
                        </div>
                      )}
                    </div>
                    <div>
                      <h1 className="text-xl lg:text-2xl font-bold">
                        {category.name}
                      </h1>
                      <p className="text-sm text-gray-500">
                        {totalProducts} sản phẩm
                      </p>
                    </div>
                  </div>

                  {/* Sort Dropdown */}
                  <CategorySort
                    initialSortBy={sort_by}
                    initialSortOrder={sort_order}
                  />
                </div>
              </div>

              {/* Products Grid */}
              {categoryProducts.length > 0 ? (
                <>
                  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 xl:grid-cols-5 gap-3 sm:gap-4 mb-8">
                    {categoryProducts.map((product) => (
                      <ProductCard key={product.id} product={product} />
                    ))}
                  </div>

                  {/* Load More Button */}
                  {hasMore && (
                    <div className="flex justify-center mt-8 pb-8">
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
                <div className="bg-white rounded-lg p-12 text-center">
                  <Package className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                  <h3 className="text-xl font-medium text-gray-900 mb-2">
                    Chưa có sản phẩm
                  </h3>
                  <p className="text-gray-600">
                    Danh mục này chưa có sản phẩm nào phù hợp với bộ lọc.
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    );
  } catch (error) {
    console.error("Error loading category:", error); // Debug log
    notFound();
  }
}
