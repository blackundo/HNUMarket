'use client';

import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Trash2, RotateCcw, AlertTriangle, Loader2 } from 'lucide-react';
import { useState } from 'react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { productsApi, type TrashedProduct } from '@/lib/api/products';
import { formatPrice, formatDate } from './products-columns';
import Image from 'next/image';
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

interface TrashActionsProps {
  product: TrashedProduct;
  onRestore: () => void;
  onPermanentDelete: () => void;
}

function TrashActions({ product, onRestore, onPermanentDelete }: TrashActionsProps) {
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);

  const daysUntilExpiry = Math.ceil(
    (new Date(product.expires_at).getTime() - Date.now()) / (1000 * 60 * 60 * 24)
  );

  return (
    <>
      <div className="flex gap-2">
        <Button variant="outline" size="sm" onClick={onRestore}>
          <RotateCcw className="h-4 w-4 mr-2" />
          Khôi phục
        </Button>
        <Button variant="destructive" size="sm" onClick={() => setShowDeleteDialog(true)}>
          <Trash2 className="h-4 w-4 mr-2" />
          Xóa vĩnh viễn
        </Button>
      </div>

      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Xác nhận xóa vĩnh viễn</AlertDialogTitle>
            <AlertDialogDescription>
              Bạn có chắc muốn xóa vĩnh viễn &quot;{product.name}&quot;? Hành động này không thể hoàn tác.
              <br />
              <br />
              Tất cả hình ảnh và biến thể sẽ bị xóa khỏi hệ thống.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Hủy</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                setShowDeleteDialog(false);
                onPermanentDelete();
              }}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Xóa vĩnh viễn
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {daysUntilExpiry <= 3 && (
        <div className="text-xs text-destructive mt-1">
          Tự động xóa trong {daysUntilExpiry} ngày
        </div>
      )}
    </>
  );
}

export function ProductsTrashList() {
  const [search, setSearch] = useState('');
  const [showEmptyTrashDialog, setShowEmptyTrashDialog] = useState(false);

  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ['products-trash', search],
    queryFn: () => productsApi.getTrashProducts({ search, page: 1, limit: 50 }),
  });

  const handleRestore = async (id: string) => {
    try {
      await productsApi.restoreFromTrash(id);
      refetch();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Lỗi khi khôi phục sản phẩm');
    }
  };

  const handlePermanentDelete = async (id: string) => {
    try {
      await productsApi.permanentDeleteProduct(id);
      refetch();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Lỗi khi xóa vĩnh viễn sản phẩm');
    }
  };

  const handleEmptyTrash = () => {
    setShowEmptyTrashDialog(true);
  };

  const handleConfirmEmptyTrash = async () => {
    try {
      await productsApi.emptyTrash();
      refetch();
      setShowEmptyTrashDialog(false);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Lỗi khi làm trống thùng rác');
    }
  };

  const trashProducts = data?.data || [];
  const total = data?.meta.total || 0;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight flex items-center gap-2 font-heading">

            Thùng rác
          </h1>
          <p className="text-muted-foreground mt-1 font-body">
            {total} sản phẩm - Tự động xóa sau 10 ngày
          </p>
        </div>
        {total > 0 && (
          <Button variant="destructive" onClick={handleEmptyTrash}>
            <Trash2 className="h-4 w-4 mr-2" />
            Làm trống thùng rác
          </Button>
        )}
      </div>

      {/* Error Alert */}
      {error && (
        <Alert variant="destructive">
          <AlertDescription>
            Lỗi khi tải dữ liệu: {error instanceof Error ? error.message : 'Unknown error'}
          </AlertDescription>
        </Alert>
      )}

      {/* Loading State */}
      {isLoading && (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      )}

      {/* Empty State */}
      {!isLoading && total === 0 && (
        <Card>
          <CardContent className="py-12">
            <div className="text-center">
              <Trash2 className="h-12 w-12 mx-auto text-muted-foreground opacity-50" />
              <h3 className="mt-4 text-lg font-semibold">Thùng rác trống</h3>
              <p className="text-muted-foreground mt-2">
                Các sản phẩm đã xóa sẽ xuất hiện ở đây
              </p>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Trash List */}
      {!isLoading && total > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="font-heading">Sản phẩm trong thùng rác</CardTitle>
            <CardDescription className="font-body">
              Khôi phục hoặc xóa vĩnh viễn sản phẩm
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {trashProducts.map((product) => {
                const images = product.images as Array<{ url: string; alt_text?: string }>;
                const imageUrl = images?.[0]?.url || '/placeholder.png';
                const daysUntilExpiry = Math.ceil(
                  (new Date(product.expires_at).getTime() - Date.now()) / (1000 * 60 * 60 * 24)
                );

                return (
                  <div
                    key={product.id}
                    className="flex items-center gap-4 p-4 border rounded-lg hover:bg-muted/50 transition"
                  >
                    {/* Image */}
                    <div className="relative w-16 h-16 rounded overflow-hidden bg-gray-100 flex-shrink-0">
                      <Image
                        src={imageUrl}
                        alt={product.name}
                        fill
                        className="object-cover"
                        sizes="64px"
                      />
                    </div>

                    {/* Product Info */}
                    <div className="flex-1 min-w-0">
                      <h4 className="font-semibold truncate font-heading">{product.name}</h4>
                      <div className="flex items-center gap-4 text-sm text-muted-foreground mt-1">
                        <span>{formatPrice(product.price)}</span>
                        <span>•</span>
                        <span>Tồn kho: {product.stock}</span>
                        <span>•</span>
                        <span>Xóa: {formatDate(product.deleted_at)}</span>
                      </div>
                      {daysUntilExpiry <= 3 && (
                        <div className="flex items-center gap-2 mt-2">
                          <AlertTriangle className="h-4 w-4 text-destructive" />
                          <span className="text-xs text-destructive font-medium">
                            Sẽ tự động xóa vĩnh viễn trong {daysUntilExpiry} ngày
                          </span>
                        </div>
                      )}
                    </div>

                    {/* Actions */}
                    <div className="flex-shrink-0">
                      <TrashActions
                        product={product}
                        onRestore={() => handleRestore(product.id)}
                        onPermanentDelete={() => handlePermanentDelete(product.id)}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Empty Trash Dialog */}
      <AlertDialog open={showEmptyTrashDialog} onOpenChange={setShowEmptyTrashDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Xác nhận làm trống thùng rác</AlertDialogTitle>
            <AlertDialogDescription>
              Bạn có chắc muốn xóa vĩnh viễn TẤT CẢ sản phẩm trong thùng rác? Hành động này không thể hoàn tác!
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Hủy</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleConfirmEmptyTrash}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Xóa vĩnh viễn tất cả
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
