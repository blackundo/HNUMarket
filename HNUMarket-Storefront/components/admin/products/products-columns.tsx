'use client';

import { ColumnDef } from '@tanstack/react-table';
import { Product, ProductImage } from '@/lib/api/products';
import { Badge } from '@/components/ui/badge';
import { DataTableColumnHeader } from './data-table-column-header';
import { ProductStatusToggle } from './product-status-toggle';
import Image from 'next/image';

/**
 * Format price as KRW currency
 */
export function formatPrice(price: number): string {
  return new Intl.NumberFormat('vi-VN', {
    style: 'currency',
    currency: 'KRW',
  }).format(price);
}

/**
 * Format date in Vietnamese locale
 */
export function formatDate(dateString: string): string {
  const date = new Date(dateString);
  return new Intl.DateTimeFormat('vi-VN', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  }).format(date);
}

/**
 * Get badge variant for stock level
 * Green: >10, Yellow: 1-10, Red: 0
 */
export function getStockVariant(stock: number): 'admin' | 'secondary' | 'destructive' {
  if (stock > 10) return 'admin';
  if (stock > 0) return 'secondary';
  return 'destructive';
}

/**
 * Column definitions for products table
 */
export const productsColumns: ColumnDef<Product>[] = [
  {
    accessorKey: 'images',
    header: 'Ảnh',
    cell: ({ row }) => {
      const images = row.getValue('images') as ProductImage[];
      const imageUrl = images?.[0]?.url || '/images/product-placeholder.svg';
      const name = row.original.name;

      return (
        <div className="relative w-12 h-12 rounded overflow-hidden bg-gray-100">
          <Image
            src={imageUrl}
            alt={name}
            fill
            className="object-cover"
            sizes="48px"
          />
        </div>
      );
    },
    enableSorting: false,
    enableHiding: false,
  },
  {
    accessorKey: 'name',
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Tên sản phẩm" />
    ),
    cell: ({ row }) => {
      const name = row.getValue('name') as string;
      const category = row.original.category?.name;

      return (
        <div>
          <div className="font-medium font-heading">{name}</div>
          {category && (
            <div className="text-xs text-muted-foreground font-body">
              {category}
            </div>
          )}
        </div>
      );
    },
  },
  {
    accessorKey: 'sku',
    header: 'SKU',
    cell: ({ row }) => {
      const sku = row.original.sku || 'N/A';

      return (
        <code className="text-xs bg-gray-100 px-2 py-1 rounded font-mono">
          {sku}
        </code>
      );
    },
    enableSorting: false,
  },
  {
    accessorKey: 'price',
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Giá" />
    ),
    cell: ({ row }) => {
      const price = row.getValue('price') as number;
      return <div className="font-semibold font-body">{formatPrice(price)}</div>;
    },
  },
  {
    accessorKey: 'stock',
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Tồn kho" />
    ),
    cell: ({ row }) => {
      const stock = row.getValue('stock') as number;
      return (
        <Badge variant={getStockVariant(stock)}>
          {stock}
        </Badge>
      );
    },
  },
  {
    accessorKey: 'is_active',
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Trạng thái" />
    ),
    cell: ({ row }) => {
      return (
        <ProductStatusToggle
          productId={row.original.id}
          isActive={row.original.is_active}
        />
      );
    },
  },
  {
    accessorKey: 'created_at',
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Ngày tạo" />
    ),
    cell: ({ row }) => {
      const date = row.getValue('created_at') as string;
      return <div className="text-sm font-body">{formatDate(date)}</div>;
    },
  },
];
