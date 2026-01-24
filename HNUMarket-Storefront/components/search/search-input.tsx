"use client";

import { useState, FormEvent, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { storefrontProductsApi } from "@/lib/api/storefront-products";
import { transformProducts } from "@/lib/helpers/transform-api-data";
import { Product } from "@/types";
import { formatCurrency, cn } from "@/lib/utils";
import { getImageUrl } from "@/lib/image";

interface SearchInputProps {
  defaultValue?: string;
  onMobileClose?: () => void;
  customClass?: string;
}

/**
 * Search input component that redirects to search page
 */
export function SearchInput({ defaultValue = "", onMobileClose, customClass }: SearchInputProps) {
  const router = useRouter();
  const [query, setQuery] = useState(defaultValue);

  const [results, setResults] = useState<Product[]>([]);
  const [totalResults, setTotalResults] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [showDropdown, setShowDropdown] = useState(false);

  const inputRef = useRef<HTMLInputElement>(null);

  // Debounce search
  useEffect(() => {
    const timer = setTimeout(async () => {
      const trimmedQuery = query.trim();

      if (trimmedQuery) {
        setIsLoading(true);
        setShowDropdown(true);

        try {
          // Fetch quick results
          const response = await storefrontProductsApi.searchProducts(trimmedQuery, { limit: 5 });
          const products = transformProducts(response.data);

          setResults(products);
          setTotalResults(response.meta.total);
        } catch (error) {
          console.error("Quick search failed:", error);
          setResults([]);
          setTotalResults(0);
        } finally {
          setIsLoading(false);
        }
      } else {
        setResults([]);
        setShowDropdown(false);
      }
    }, 500); // 500ms debounce

    return () => clearTimeout(timer);
  }, [query]);

  // Handle click outside to close dropdown
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      if (!target.closest('.search-container')) {
        setShowDropdown(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSubmit = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const trimmedQuery = query.trim();

    // Blur input to hide keyboard on mobile
    inputRef.current?.blur();

    if (trimmedQuery) {
      router.push(`/search?q=${encodeURIComponent(trimmedQuery)}`);
      onMobileClose?.();
      setShowDropdown(false);
    }
  };

  const handleProductClick = (slug: string) => {
    router.push(`/products/${slug}`);
    onMobileClose?.();
    setShowDropdown(false);
  };

  return (
    <div className={cn("relative w-full search-container", customClass)}>
      <form onSubmit={handleSubmit} className="relative w-full flex">
        <input
          ref={inputRef}
          type="search"
          placeholder="Tìm kiếm sản phẩm..."
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onFocus={() => {
            if (query.trim()) setShowDropdown(true);
          }}
          className="w-full pl-4 pr-12 py-1 border border-gray-200 border-r-0 rounded-l-md bg-white focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary text-sm transition-all [&::-webkit-search-cancel-button]:hidden [&::-webkit-search-decoration]:hidden"
        />
        <Button
          type="submit"
          className="h-auto rounded-l-none rounded-r-md bg-primary hover:bg-primary/90 text-white px-2 py-1"
        >
          <Search className="h-5 w-5" />
          <span className="sr-only">Tìm kiếm</span>
        </Button>
      </form>

      {/* Quick Search Results Dropdown */}
      {showDropdown && query.trim() && (
        <div className="absolute top-full left-0 right-0 mt-1 bg-white rounded-md shadow-lg border border-gray-100 overflow-hidden z-50">
          {isLoading ? (
            <div className="p-4 text-center">
              <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-black mx-auto"></div>
              <p className="text-xs text-gray-500 mt-2">Đang tìm kiếm...</p>
            </div>
          ) : results.length > 0 ? (
            <>
              {/* Header */}
              <div className="px-4 py-2 border-b border-gray-100 bg-gray-50">
                <div className="flex items-center justify-between">
                  <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">
                    Sản phẩm gợi ý
                  </p>
                  <p className="text-xs text-gray-400">
                    {totalResults} kết quả
                  </p>
                </div>
              </div>

              {/* Results List */}
              <div className="divide-y divide-gray-100 max-h-[60vh] overflow-y-auto">
                {results.map((product, index) => (
                  <div
                    key={product.id}
                    onClick={() => handleProductClick(product.slug)}
                    className="px-4 py-3 hover:bg-gray-50 cursor-pointer transition-colors group"
                  >
                    <div className="flex items-center gap-3">
                      {/* Product Image */}
                      <div className="w-10 h-10 bg-gray-100 rounded overflow-hidden flex-shrink-0 border border-gray-200">
                        <img
                          src={getImageUrl(product.images[0]) || "/placeholder.jpg"}
                          alt={product.name}
                          className="w-full h-full object-cover"
                        />
                      </div>

                      {/* Product Info */}
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-gray-900 truncate group-hover:text-primary transition-colors">
                          {product.name}
                        </p>

                        {/* Price Section */}
                        <div className="flex items-center gap-2">
                          <p className="text-sm font-bold text-primary">
                            {formatCurrency(product.price)}
                          </p>
                          {product.originalPrice && product.originalPrice > product.price && (
                            <p className="text-xs text-gray-400 line-through">
                              {formatCurrency(product.originalPrice)}
                            </p>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {/* View All Button */}
              {totalResults > 5 && (
                <div className="p-2 border-t border-gray-100 bg-gray-50">
                  <button
                    onClick={() => {
                      router.push(`/search?q=${encodeURIComponent(query.trim())}`);
                      onMobileClose?.();
                      setShowDropdown(false);
                    }}
                    className="w-full py-2 text-sm text-center text-primary font-semibold hover:underline"
                  >
                    Xem tất cả {totalResults} sản phẩm →
                  </button>
                </div>
              )}
            </>
          ) : (
            <div className="p-6 text-center text-gray-500">
              <Search className="h-6 w-6 mx-auto mb-2 text-gray-300" />
              <p className="text-sm">Không tìm thấy sản phẩm nào</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
