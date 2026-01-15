import { Search as SearchIcon, Package } from "lucide-react";
import { storefrontProductsApi } from "@/lib/api/storefront-products";
import { transformProducts } from "@/lib/helpers/transform-api-data";
import { ProductCard } from "@/components/product/product-card";
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
  PaginationEllipsis,
} from "@/components/ui/pagination";

interface SearchPageProps {
  searchParams: Promise<{ q?: string; page?: string }>;
}

/**
 * Search page showing products matching search query
 */
export default async function SearchPage({ searchParams }: SearchPageProps) {
  const { q, page: pageParam } = await searchParams;
  const query = q?.trim() || "";
  const page = Number(pageParam) || 1;
  const limit = 15;

  // Search products via API
  const searchData = query
    ? await storefrontProductsApi.searchProducts(query, { page, limit }).catch(() => ({
      data: [],
      meta: { total: 0, page: 1, limit, totalPages: 0 },
    }))
    : { data: [], meta: { total: 0, page: 1, limit, totalPages: 0 } };

  const searchResults = transformProducts(searchData.data);
  const { totalPages } = searchData.meta;

  // Helper to generate pagination items
  const renderPaginationItems = () => {
    const items = [];
    const maxVisiblePages = 5;

    let startPage = Math.max(1, page - Math.floor(maxVisiblePages / 2));
    let endPage = Math.min(totalPages, startPage + maxVisiblePages - 1);

    if (endPage - startPage + 1 < maxVisiblePages) {
      startPage = Math.max(1, endPage - maxVisiblePages + 1);
    }

    // Previous button
    if (page > 1) {
      items.push(
        <PaginationItem key="prev">
          <PaginationPrevious href={`/search?q=${query}&page=${page - 1}`} />
        </PaginationItem>
      );
    }

    // First page
    if (startPage > 1) {
      items.push(
        <PaginationItem key="1">
          <PaginationLink href={`/search?q=${query}&page=1`}>1</PaginationLink>
        </PaginationItem>
      );
      if (startPage > 2) {
        items.push(
          <PaginationItem key="ellipsis-start">
            <PaginationEllipsis />
          </PaginationItem>
        );
      }
    }

    // Page numbers
    for (let i = startPage; i <= endPage; i++) {
      items.push(
        <PaginationItem key={i}>
          <PaginationLink
            href={`/search?q=${query}&page=${i}`}
            isActive={page === i}
            className={page === i ? "bg-primary text-primary-foreground hover:text-primary-foreground hover:bg-primary/90 border-primary" : ""}
          >
            {i}
          </PaginationLink>
        </PaginationItem>
      );
    }

    // Last page
    if (endPage < totalPages) {
      if (endPage < totalPages - 1) {
        items.push(
          <PaginationItem key="ellipsis-end">
            <PaginationEllipsis />
          </PaginationItem>
        );
      }
      items.push(
        <PaginationItem key={totalPages}>
          <PaginationLink href={`/search?q=${query}&page=${totalPages}`}>
            {totalPages}
          </PaginationLink>
        </PaginationItem>
      );
    }

    // Next button
    if (page < totalPages) {
      items.push(
        <PaginationItem key="next">
          <PaginationNext href={`/search?q=${query}&page=${page + 1}`} />
        </PaginationItem>
      );
    }

    return items;
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-screen-2xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Search Header */}
        <div className="bg-white rounded-lg p-6 mb-8 shadow-sm">
          <h1 className="text-2xl lg:text-3xl font-bold mb-4">
            Tìm kiếm sản phẩm
          </h1>

          {/* Search Results Info */}
          {query && (
            <div className="mt-4 pt-4 border-t">
              <p className="text-gray-600">
                {searchData.meta.total > 0 ? (
                  <>
                    Tìm thấy <span className="font-medium text-gray-900">{searchData.meta.total}</span>{" "}
                    sản phẩm cho từ khóa{" "}
                    <span className="font-medium text-gray-900">"{query}"</span>
                  </>
                ) : (
                  <>
                    Không tìm thấy sản phẩm nào cho từ khóa{" "}
                    <span className="font-medium text-gray-900">"{query}"</span>
                  </>
                )}
              </p>
            </div>
          )}
        </div>

        {/* Search Results */}
        {!query ? (
          <div className="bg-white rounded-lg p-12 text-center">
            <SearchIcon className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <h3 className="text-xl font-medium text-gray-900 mb-2">
              Nhập từ khóa để tìm kiếm
            </h3>
            <p className="text-gray-600">
              Tìm kiếm sản phẩm bằng tên hoặc mô tả
            </p>
          </div>
        ) : searchResults.length > 0 ? (
          <>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3 sm:gap-4 mb-8">
              {searchResults.map((product) => (
                <ProductCard key={product.id} product={product} />
              ))}
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <Pagination>
                <PaginationContent>
                  {renderPaginationItems()}
                </PaginationContent>
              </Pagination>
            )}
          </>
        ) : (
          <div className="bg-white rounded-lg p-12 text-center">
            <Package className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <h3 className="text-xl font-medium text-gray-900 mb-2">
              Không tìm thấy kết quả
            </h3>
            <p className="text-gray-600">
              Thử tìm kiếm với từ khóa khác
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
