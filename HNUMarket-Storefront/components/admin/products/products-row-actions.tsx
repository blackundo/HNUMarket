'use client';

import { useDelete } from '@refinedev/core';
import { useRouter } from 'next/navigation';
import { Eye, Edit, Trash2 } from 'lucide-react';
import { useState } from 'react';
import {
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuLabel,
  ContextMenuSeparator,
} from '@/components/ui/context-menu';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Product } from '@/lib/api/products';

interface ProductsRowActionsProps {
  product: Product;
}

/**
 * Row action dropdown menu for product table
 * Contains View, Edit, Delete actions
 */
export function ProductsRowActions({ product }: ProductsRowActionsProps) {
  const router = useRouter();
  const { mutate: deleteProduct } = useDelete();
  const [open, setOpen] = useState(false);

  const handleDelete = () => {
    setOpen(true);
  };

  const handleConfirmDelete = () => {
    deleteProduct({
      resource: 'products',
      id: product.id,
    });
    setOpen(false);
  };

  return (
    <>
      <ContextMenuContent>
        <ContextMenuLabel>Thao tác</ContextMenuLabel>
        <ContextMenuSeparator />
        <ContextMenuItem onSelect={() => router.push(`/products/${product.slug}`)}>
          <Eye className="mr-2 h-4 w-4" />
          Xem sản phẩm
        </ContextMenuItem>
        <ContextMenuItem onSelect={() => router.push(`/admin/products/${product.id}/edit`)}>
          <Edit className="mr-2 h-4 w-4" />
          Chỉnh sửa
        </ContextMenuItem>
        <ContextMenuSeparator />
        <ContextMenuItem onSelect={handleDelete} className="text-destructive">
          <Trash2 className="mr-2 h-4 w-4" />
          Chuyển vào thùng rác
        </ContextMenuItem>
      </ContextMenuContent>

      <AlertDialog open={open} onOpenChange={setOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Xác nhận chuyển vào thùng rác</AlertDialogTitle>
            <AlertDialogDescription>
              Bạn có chắc muốn chuyển "{product.name}" vào thùng rác? Sản phẩm sẽ tự động xóa sau 10 ngày.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Hủy</AlertDialogCancel>
            <AlertDialogAction onClick={handleConfirmDelete} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              Chuyển vào thùng rác
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
