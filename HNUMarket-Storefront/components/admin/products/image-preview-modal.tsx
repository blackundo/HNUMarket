'use client';

import { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { ImageEditor } from './image-editor';
import { uploadApi } from '@/lib/api/products';
import { toast } from 'sonner';
import { getImageUrl } from '@/lib/image';

interface ImagePreviewModalProps {
  isOpen: boolean;
  onClose: () => void;
  imageUrl: string;
  altText: string;
  currentIndex: number;
  totalImages: number;
  onNavigate?: (direction: 'prev' | 'next') => void;
  onUpdate?: (altText: string) => void;
  onImageEdit?: (newImageUrl: string) => void;
  mode?: 'view' | 'edit';
}

/**
 * Image Preview Modal Component
 *
 * Modal for viewing and editing image details with navigation
 */
export function ImagePreviewModal({
  isOpen,
  onClose,
  imageUrl,
  altText,
  currentIndex,
  totalImages,
  onNavigate,
  onUpdate,
  onImageEdit,
  mode: initialMode = 'view',
}: ImagePreviewModalProps) {
  const [editedAltText, setEditedAltText] = useState(altText);
  const [mode, setMode] = useState<'view' | 'edit'>(initialMode);
  const [processing, setProcessing] = useState(false);

  // Update editedAltText when navigating to different image
  useEffect(() => {
    setEditedAltText(altText);
  }, [altText, currentIndex]);

  // Reset mode when modal opens/closes or image changes
  useEffect(() => {
    if (isOpen) {
      setMode(initialMode);
    }
  }, [isOpen, initialMode, currentIndex]);

  const handleSave = () => {
    if (onUpdate) {
      onUpdate(editedAltText);
    }
    onClose();
  };

  const handleImageSave = async (editedImageFile: File) => {
    try {
      setProcessing(true);
      const result = await uploadApi.uploadFile(editedImageFile);

      if (onImageEdit) {
        onImageEdit(result.url);
      }

      setMode('view');
      onClose();
    } catch (error) {
      console.error('Error uploading edited image:', error);
      toast.error('Có lỗi xảy ra khi tải lên ảnh đã chỉnh sửa. Vui lòng thử lại.');
    } finally {
      setProcessing(false);
    }
  };

  const handleCancelEdit = () => {
    setMode('view');
  };

  const handlePrevious = () => {
    if (onNavigate) {
      onNavigate('prev');
    }
  };

  const handleNext = () => {
    if (onNavigate) {
      onNavigate('next');
    }
  };

  const showNavigation = totalImages > 1 && onNavigate;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-center justify-between">
            <div>
              <DialogTitle>
                {mode === 'edit' ? 'Chỉnh sửa ảnh' : 'Xem ảnh sản phẩm'}
              </DialogTitle>
              <DialogDescription>
                {mode === 'edit'
                  ? 'Cắt, xoay và điều chỉnh ảnh'
                  : showNavigation
                    ? `Ảnh ${currentIndex + 1} / ${totalImages}`
                    : 'Xem và chỉnh sửa chi tiết ảnh'}
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        {mode === 'edit' ? (
          /* Image Editor Mode */
          <ImageEditor
            imageUrl={getImageUrl(imageUrl)}
            onSave={handleImageSave}
            onCancel={handleCancelEdit}
          />
        ) : (
          /* View Mode */
          <div className="space-y-4">
            {/* Image Preview with Navigation */}
            <div className="relative w-full bg-gray-100 rounded-lg overflow-hidden">
              <div className="aspect-video flex items-center justify-center">
                <img
                  src={getImageUrl(imageUrl)}
                  alt={altText || `Product image ${currentIndex + 1}`}
                  className="max-w-full max-h-[50vh] object-contain"
                />
              </div>

              {/* Navigation Buttons */}
              {showNavigation && (
                <>
                  <button
                    type="button"
                    onClick={handlePrevious}
                    className="absolute left-2 top-1/2 -translate-y-1/2 p-2 bg-white/90 hover:bg-white rounded-full shadow-lg transition-all hover:scale-110"
                    title="Ảnh trước"
                  >
                    <ChevronLeft className="h-5 w-5 text-gray-700" />
                  </button>
                  <button
                    type="button"
                    onClick={handleNext}
                    className="absolute right-2 top-1/2 -translate-y-1/2 p-2 bg-white/90 hover:bg-white rounded-full shadow-lg transition-all hover:scale-110"
                    title="Ảnh tiếp theo"
                  >
                    <ChevronRight className="h-5 w-5 text-gray-700" />
                  </button>
                </>
              )}
            </div>

            {/* Edit Alt Text */}
            {onUpdate && (
              <div className="space-y-2">
                <Label htmlFor="alt-text">Mô tả ảnh (Alt Text)</Label>
                <Input
                  id="alt-text"
                  value={editedAltText}
                  onChange={(e) => setEditedAltText(e.target.value)}
                  placeholder="Nhập mô tả cho ảnh"
                />
              </div>
            )}

            {/* Actions */}
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={onClose}>
                {onUpdate ? 'Hủy' : 'Đóng'}
              </Button>
              {onUpdate && (
                <Button onClick={handleSave} disabled={processing}>
                  Lưu thay đổi
                </Button>
              )}
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
