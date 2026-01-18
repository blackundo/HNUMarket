'use client';

import { useTable, LogicalFilter } from '@refinedev/core';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Package, Plus, Trash2 } from 'lucide-react';
import { useState, useCallback, useMemo, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { SortingState, PaginationState } from '@tanstack/react-table';
import { Product, ProductImage } from '@/lib/api/products';
import { ProductsFilterBar, ProductsFilterState } from './products-filter-bar';
import { ProductsDataTable } from './products-data-table';
import { formatDate, formatPrice, getStockVariant, productsColumns } from './products-columns';
import { ProductsRowActions } from './products-row-actions';
import { Badge } from '@/components/ui/badge';
import { ProductStatusToggle } from './product-status-toggle';

export function ProductsList() {
    const router = useRouter();
    const [search, setSearch] = useState('');
    const [localFilters, setLocalFilters] = useState<ProductsFilterState>({
        category: null,
        status: 'all',
        stockLevel: 'all',
        minPrice: null,
        maxPrice: null,
    });

    // Build filters - will be used in useTable's filters.permanent
    const permanentFilters = useMemo((): LogicalFilter[] => {
        const filters: LogicalFilter[] = [];

        if (search) {
            filters.push({ field: 'name', operator: 'contains', value: search });
        }
        if (localFilters.category) {
            filters.push({ field: 'categoryId', operator: 'eq', value: localFilters.category });
        }
        if (localFilters.status !== 'all') {
            filters.push({
                field: 'isActive',
                operator: 'eq',
                value: localFilters.status === 'active',
            });
        }
        if (localFilters.stockLevel !== 'all') {
            switch (localFilters.stockLevel) {
                case 'in-stock':
                    filters.push({ field: 'minStock', operator: 'eq', value: 1 });
                    break;
                case 'low-stock':
                    filters.push({ field: 'minStock', operator: 'eq', value: 1 });
                    filters.push({ field: 'maxStock', operator: 'eq', value: 10 });
                    break;
                case 'out-of-stock':
                    filters.push({ field: 'minStock', operator: 'eq', value: 0 });
                    filters.push({ field: 'maxStock', operator: 'eq', value: 0 });
                    break;
            }
        }
        if (localFilters.minPrice !== null) {
            filters.push({ field: 'minPrice', operator: 'eq', value: localFilters.minPrice });
        }
        if (localFilters.maxPrice !== null) {
            filters.push({ field: 'maxPrice', operator: 'eq', value: localFilters.maxPrice });
        }

        return filters;
    }, [search, localFilters]);

    // Use useTable hook from Refine for proper pagination handling
    const {
        tableQuery,
        currentPage,
        setCurrentPage,
        pageSize,
        setPageSize,
        pageCount,
        sorters,
        setSorters,
    } = useTable<Product>({
        resource: 'products',
        pagination: {
            mode: 'server',
            pageSize: 10,
        },
        sorters: {
            mode: 'server',
            initial: [],
        },
        filters: {
            mode: 'server',
            permanent: permanentFilters,
        },
    });


    // Reset to page 1 when filters change
    useEffect(() => {
        if (currentPage !== 1) {
            setCurrentPage(1);
        }
    }, [permanentFilters]); // eslint-disable-line react-hooks/exhaustive-deps

    // Convert Refine sorters to TanStack sorting format
    const sorting: SortingState = useMemo(() => {
        return sorters.map((s) => ({
            id: s.field,
            desc: s.order === 'desc',
        }));
    }, [sorters]);

    // Convert TanStack sorting to Refine sorters
    const handleSortingChange = useCallback(
        (updater: SortingState | ((old: SortingState) => SortingState)) => {
            const newSorting = typeof updater === 'function' ? updater(sorting) : updater;
            setSorters(
                newSorting.map((s) => ({
                    field: s.id,
                    order: s.desc ? 'desc' : 'asc',
                }))
            );
        },
        [sorting, setSorters]
    );

    // Convert Refine pagination to TanStack format (Refine is 1-indexed, TanStack is 0-indexed)
    const pagination: PaginationState = useMemo(
        () => ({
            pageIndex: (currentPage ?? 1) - 1,
            pageSize: pageSize ?? 10,
        }),
        [currentPage, pageSize]
    );

    // Convert TanStack pagination to Refine pagination
    const handlePaginationChange = useCallback(
        (updater: PaginationState | ((old: PaginationState) => PaginationState)) => {
            // Get current pagination state
            const currentPagination: PaginationState = {
                pageIndex: (currentPage ?? 1) - 1,
                pageSize: pageSize ?? 10,
            };
            // Calculate new pagination
            const newPagination = typeof updater === 'function' ? updater(currentPagination) : updater;
            // Convert to Refine's 1-indexed page
            const newPage = newPagination.pageIndex + 1;
            // Update Refine pagination (1-indexed)
            setCurrentPage(newPage);
            if (newPagination.pageSize !== pageSize) {
                setPageSize(newPagination.pageSize);
            }
        },
        [currentPage, pageSize, setCurrentPage, setPageSize]
    );

    // Handle search change - just update state
    const handleSearchChange = useCallback(
        (newSearch: string) => {
            setSearch(newSearch);
        },
        []
    );

    // Handle filter changes - just update state
    const handleFiltersChange = useCallback(
        (newLocalFilters: ProductsFilterState) => {
            setLocalFilters(newLocalFilters);
        },
        []
    );

    const data = (tableQuery.data?.data || []) as Product[];
    const total = tableQuery.data?.total || 0;
    const isLoading = tableQuery.isLoading;
    const error = tableQuery.error;

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight flex items-center gap-2 font-heading">

                        Quản lý sản phẩm
                    </h1>
                    <p className="text-muted-foreground mt-1 font-body">
                        Quản lý sản phẩm, hình ảnh và tồn kho của cửa hàng
                    </p>
                </div>
                <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
                    <Link href="/admin/products/trash">
                        <Button variant="outline" className="w-full sm:w-auto">
                            <Trash2 className="h-4 w-4 mr-2" />
                            Thùng rác
                        </Button>
                    </Link>
                    <Link href="/admin/products/new" target="_blank" rel="noopener noreferrer">
                        <Button className="w-full bg-admin-primary text-white hover:bg-admin-primary/80 sm:w-auto">
                            <Plus className="h-4 w-4 mr-2" />
                            Thêm sản phẩm
                        </Button>
                    </Link>
                </div>
            </div>

            {/* Error Alert */}
            {error && (
                <Alert variant="destructive">
                    <AlertDescription>
                        Lỗi khi tải dữ liệu: {error instanceof Error ? error.message : 'Unknown error'}
                    </AlertDescription>
                </Alert>
            )}

            {/* Filters */}
            <Card>
                <CardHeader>
                    <CardTitle className="font-heading">Tìm kiếm & Lọc</CardTitle>
                    <CardDescription className="font-body">
                        Tìm sản phẩm theo tên, danh mục, trạng thái và giá
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <ProductsFilterBar
                        search={search}
                        filters={localFilters}
                        onSearchChange={handleSearchChange}
                        onFiltersChange={handleFiltersChange}
                    />
                </CardContent>
            </Card>

            {/* Data Table */}
            <Card>
                <CardHeader>
                    <CardTitle className="font-heading">Tất cả sản phẩm (Nhấn chuột phải để thao tác)</CardTitle>
                    <CardDescription className="font-body">
                        {isLoading ? 'Đang tải...' : `${total} sản phẩm`}
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <ProductsDataTable
                        columns={productsColumns}
                        data={data}
                        total={total}
                        isLoading={isLoading}
                        sorting={sorting}
                        setSorting={handleSortingChange}
                        pagination={pagination}
                        setPagination={handlePaginationChange}
                        pageCount={pageCount ?? 0}
                        onRowClick={(product) => router.push(`/admin/products/${product.id}/edit`)}
                        renderRowContextMenu={(product) => (
                            <ProductsRowActions product={product} />
                        )}
                        renderMobileCard={(product) => {
                            const images = (product.images || []) as ProductImage[];
                            const placeholderImage = '/images/product-placeholder.svg';
                            const imageUrl = images.find((img) => img?.url)?.url || placeholderImage;
                            const category = product.category?.name;

                            return (
                                <div className="space-y-3">
                                    <div className="flex items-start gap-3">
                                        <div className="relative h-16 w-16 overflow-hidden rounded-md bg-gray-100">
                                            <Image
                                                src={imageUrl}
                                                alt={product.name}
                                                fill
                                                className="object-cover"
                                                sizes="64px"
                                            />
                                        </div>
                                        <div className="min-w-0 flex-1">
                                            <p className="font-medium truncate">{product.name}</p>
                                            {category && (
                                                <p className="text-xs text-muted-foreground truncate">
                                                    {category}
                                                </p>
                                            )}
                                            <p className="text-xs text-muted-foreground">
                                                SKU: {product.sku || 'N/A'}
                                            </p>
                                        </div>
                                    </div>
                                    <div className="grid gap-3 sm:grid-cols-2">
                                        <div>
                                            <p className="text-xs text-muted-foreground">Giá</p>
                                            <p className="font-semibold">{formatPrice(product.price)}</p>
                                        </div>
                                        <div>
                                            <p className="text-xs text-muted-foreground">Tồn kho</p>
                                            <Badge variant={getStockVariant(product.stock)}>
                                                {product.stock}
                                            </Badge>
                                        </div>
                                    </div>
                                    <div className="flex items-center justify-between text-xs text-muted-foreground">
                                        <span>Ngày tạo</span>
                                        <span>{formatDate(product.created_at)}</span>
                                    </div>
                                    <div data-no-row-click>
                                        <ProductStatusToggle
                                            productId={product.id}
                                            isActive={product.is_active}
                                        />
                                    </div>
                                </div>
                            );
                        }}
                    />
                </CardContent>
            </Card>
        </div>
    );
}
