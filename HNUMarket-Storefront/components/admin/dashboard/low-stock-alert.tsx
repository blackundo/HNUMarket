'use client';

import Link from 'next/link';
import { AlertTriangle } from 'lucide-react';
import type { LowStockProduct } from '@/lib/api/dashboard';

interface LowStockAlertProps {
  products: LowStockProduct[];
}

export function LowStockAlert({ products }: LowStockAlertProps) {
  if (products.length === 0) return null;

  return (
    <div className="bg-white rounded-lg shadow p-4">
      <div className="flex items-center gap-2 mb-4">
        <AlertTriangle className="h-5 w-5 text-yellow-500" />
        <h3 className="text-lg font-semibold">Cảnh báo tồn kho thấp</h3>
      </div>
      <div className="space-y-3">
        {products.map((product) => (
          <div key={product.id} className="flex items-center gap-3 py-2 border-b last:border-0">
            {product.image_url ? (
              <img
                src={product.image_url}
                alt={product.name}
                className="h-10 w-10 rounded object-cover"
              />
            ) : (
              <div className="h-10 w-10 rounded bg-gray-200 flex items-center justify-center text-gray-400">
                ?
              </div>
            )}
            <div className="flex-1 min-w-0">
              <p className="font-medium truncate">{product.name}</p>
              <p className={`text-sm ${product.stock === 0 ? 'text-red-600' : 'text-yellow-600'}`}>
                {product.stock === 0 ? 'Hết hàng' : `Còn ${product.stock}`}
              </p>
            </div>
            <Link
              href={`/admin/products/${product.id}/edit`}
              className="text-sm text-admin-primary hover:underline"
            >
              Cập nhật
            </Link>
          </div>
        ))}
      </div>
    </div>
  );
}
