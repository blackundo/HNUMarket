'use client';

import { useState } from 'react';
import { Badge } from '@/components/ui/badge';
import { productsApi } from '@/lib/api/products';
import { Loader2 } from 'lucide-react';
import { useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
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

interface ProductStatusToggleProps {
  productId: string;
  isActive: boolean;
}

export function ProductStatusToggle({ productId, isActive }: ProductStatusToggleProps) {
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState(isActive);
  const [open, setOpen] = useState(false);
  const queryClient = useQueryClient();

  const handleToggle = (e: React.MouseEvent) => {
    e.stopPropagation();
    setOpen(true);
  };

  const handleConfirmToggle = async () => {
    const newStatus = !status;

    setLoading(true);
    try {
      await productsApi.updateProduct(productId, { isActive: newStatus });
      setStatus(newStatus);

      // Invalidate queries to refresh the list
      queryClient.invalidateQueries({ queryKey: ['products'] });
      setOpen(false);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Lỗi khi cập nhật trạng thái');
    } finally {
      setLoading(false);
    }
  };

  const newStatus = !status;

  return (
    <>
      <Badge
        variant={status ? 'admin' : 'secondary'}
        className="cursor-pointer hover:opacity-80 transition"
        onClick={handleToggle}
      >
        {loading ? (
          <span className="flex items-center gap-1">
            <Loader2 className="h-3 w-3 animate-spin" />
            Đang cập nhật...
          </span>
        ) : (
          <span>{status ? 'Hoạt động' : 'Không hoạt động'}</span>
        )}
      </Badge>

      <AlertDialog open={open} onOpenChange={setOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {newStatus ? 'Kích hoạt sản phẩm' : 'Vô hiệu hóa sản phẩm'}
            </AlertDialogTitle>
            <AlertDialogDescription>
              Bạn có chắc muốn {newStatus ? 'kích hoạt' : 'vô hiệu hóa'} sản phẩm này?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Hủy</AlertDialogCancel>
            <AlertDialogAction onClick={handleConfirmToggle}>
              {newStatus ? 'Kích hoạt' : 'Vô hiệu hóa'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
