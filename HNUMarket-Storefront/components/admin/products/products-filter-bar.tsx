'use client';

import { useEffect, useState } from 'react';
import { Search, X } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { StorefrontCategory, storefrontCategoriesApi } from '@/lib/api/storefront-categories';

export interface ProductsFilterState {
  category: string | null;
  status: 'all' | 'active' | 'inactive';
  stockLevel: 'all' | 'in-stock' | 'low-stock' | 'out-of-stock';
  minPrice: number | null;
  maxPrice: number | null;
}

interface ProductsFilterBarProps {
  search: string;
  filters: ProductsFilterState;
  onSearchChange: (search: string) => void;
  onFiltersChange: (filters: ProductsFilterState) => void;
}

/**
 * Filter bar with search, category, status, stock level, and price range
 * Uses debounced search input (300ms)
 */
export function ProductsFilterBar({
  search,
  filters,
  onSearchChange,
  onFiltersChange,
}: ProductsFilterBarProps) {
  const [localSearch, setLocalSearch] = useState(search);
  const [categories, setCategories] = useState<StorefrontCategory[]>([]);
  const [loadingCategories, setLoadingCategories] = useState(true);

  // Fetch categories from storefront API (not admin API)
  useEffect(() => {
    const fetchCategories = async () => {
      try {
        setLoadingCategories(true);
        const data = await storefrontCategoriesApi.getCategories();
        setCategories(data);
      } catch (error) {
        console.error('Error fetching categories:', error);
      } finally {
        setLoadingCategories(false);
      }
    };

    fetchCategories();
  }, []);

  // Debounce search input (300ms)
  useEffect(() => {
    const timer = setTimeout(() => {
      onSearchChange(localSearch);
    }, 300);

    return () => clearTimeout(timer);
  }, [localSearch, onSearchChange]);

  const handleClearFilters = () => {
    setLocalSearch('');
    onSearchChange('');
    onFiltersChange({
      category: null,
      status: 'all',
      stockLevel: 'all',
      minPrice: null,
      maxPrice: null,
    });
  };

  const hasActiveFilters =
    search ||
    filters.category ||
    filters.status !== 'all' ||
    filters.stockLevel !== 'all' ||
    filters.minPrice !== null ||
    filters.maxPrice !== null;

  return (
    <div className="space-y-4">
      {/* Row 1: Search and Dropdowns */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {/* Search Input */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Tìm kiếm sản phẩm..."
            value={localSearch}
            onChange={(e) => setLocalSearch(e.target.value)}
            className="pl-10"
          />
        </div>

        {/* Category Select */}
        <Select
          value={filters.category || 'all'}
          onValueChange={(value) =>
            onFiltersChange({
              ...filters,
              category: value === 'all' ? null : value,
            })
          }
          disabled={loadingCategories}
        >
          <SelectTrigger>
            <SelectValue placeholder={loadingCategories ? 'Đang tải...' : 'Tất cả danh mục'} />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Tất cả danh mục</SelectItem>
            {categories.map((category: StorefrontCategory) => (
              <SelectItem key={category.id} value={category.id}>
                {category.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        {/* Status Select */}
        <Select
          value={filters.status}
          onValueChange={(value) =>
            onFiltersChange({
              ...filters,
              status: value as ProductsFilterState['status'],
            })
          }
        >
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Tất cả trạng thái</SelectItem>
            <SelectItem value="active">Hoạt động</SelectItem>
            <SelectItem value="inactive">Không hoạt động</SelectItem>
          </SelectContent>
        </Select>

        {/* Stock Level Select */}
        <Select
          value={filters.stockLevel}
          onValueChange={(value) =>
            onFiltersChange({
              ...filters,
              stockLevel: value as ProductsFilterState['stockLevel'],
            })
          }
        >
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Tất cả tồn kho</SelectItem>
            <SelectItem value="in-stock">Còn hàng</SelectItem>
            <SelectItem value="low-stock">Sắp hết hàng (1-10)</SelectItem>
            <SelectItem value="out-of-stock">Hết hàng</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Row 2: Price Range and Clear Button */}
      <div className="flex flex-wrap items-center gap-4">
        <div className="flex items-center gap-2">
          <Input
            type="number"
            placeholder="Giá tối thiểu"
            value={filters.minPrice ?? ''}
            onChange={(e) =>
              onFiltersChange({
                ...filters,
                minPrice: e.target.value ? Number(e.target.value) : null,
              })
            }
            className="w-40"
          />
          <span className="text-muted-foreground">-</span>
          <Input
            type="number"
            placeholder="Giá tối đa"
            value={filters.maxPrice ?? ''}
            onChange={(e) =>
              onFiltersChange({
                ...filters,
                maxPrice: e.target.value ? Number(e.target.value) : null,
              })
            }
            className="w-40"
          />
        </div>

        {hasActiveFilters && (
          <Button variant="outline" size="sm" onClick={handleClearFilters}>
            <X className="h-4 w-4 mr-2" />
            Xóa bộ lọc
          </Button>
        )}
      </div>
    </div>
  );
}
