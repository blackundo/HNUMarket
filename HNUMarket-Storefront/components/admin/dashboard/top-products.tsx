'use client';

import Link from 'next/link';
import { formatCurrency, formatNumber } from '@/lib/utils';
import type { TopProduct } from '@/lib/api/dashboard';

interface TopProductsProps {
  products: TopProduct[];
}

export function TopProducts({ products }: TopProductsProps) {
  return (
    <div className="bg-white rounded-lg shadow p-4">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold">Sản phẩm bán chạy</h3>
        <Link href="/admin/products" className="text-sm text-admin-primary hover:underline">
          Xem tất cả
        </Link>
      </div>
      <div className="space-y-3">
        {products.length === 0 ? (
          <p className="text-gray-500 text-center py-4">Chưa có dữ liệu</p>
        ) : (
          products.map((product) => {
            const sold = Number(product.total_sold) || 0;
            const revenue = Number(product.total_revenue) || 0;

            return (
              <div
                key={product.id}
                className="flex items-center justify-between py-2 border-b last:border-0"
              >
                <div className="min-w-0">
                  <p className="font-medium truncate">{product.name}</p>
                  <p className="text-sm text-gray-500">
                    Đã bán {formatNumber(sold)}
                  </p>
                </div>
                <div className="text-right">
                  <p className="font-medium">{formatCurrency(revenue)}</p>
                  <Link
                    href={`/admin/products/${product.id}/edit`}
                    className="text-sm text-admin-primary hover:underline"
                  >
                    Sửa
                  </Link>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
