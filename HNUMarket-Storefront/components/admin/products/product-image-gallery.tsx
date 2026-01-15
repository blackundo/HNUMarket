'use client';

import { useState } from 'react';
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  rectSortingStrategy,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { Upload, Eye, Edit2, Trash2, GripVertical } from 'lucide-react';
import { ImagePreviewModal } from './image-preview-modal';

export interface ImageData {
  url: string;
  alt_text?: string;
  display_order?: number;
}

interface ProductImageGalleryProps {
  images: ImageData[];
  onImagesChange: (images: ImageData[]) => void;
  onImageUpload: (e: React.ChangeEvent<HTMLInputElement>) => void;
  uploadingImages: boolean;
}

interface SortableImageItemProps {
  image: ImageData;
  index: number;
  onView: () => void;
  onEdit: () => void;
  onRemove: () => void;
}

/**
 * Sortable Image Item Component
 */
function SortableImageItem({
  image,
  index,
  onView,
  onEdit,
  onRemove,
}: SortableImageItemProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: image.url });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className="relative group aspect-square bg-gray-100 rounded-lg overflow-hidden border-2 border-gray-200 hover:border-admin-primary transition-colors"
    >
      {/* Image */}
      <img
        src={image.url}
        alt={image.alt_text || `Product image ${index + 1}`}
        className="w-full h-full object-cover"
      />

      {/* Hover Overlay with Actions */}
      <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col justify-between p-2">
        {/* Top Actions */}
        <div className="flex justify-between items-start">
          {/* Drag Handle */}
          <button
            type="button"
            {...attributes}
            {...listeners}
            className="p-1.5 bg-white/90 hover:bg-white rounded-md text-gray-700 hover:text-admin-primary transition-colors cursor-grab active:cursor-grabbing"
            title="Kéo để sắp xếp"
          >
            <GripVertical className="h-4 w-4" />
          </button>

          {/* Delete Button */}
          <button
            type="button"
            onClick={onRemove}
            className="p-1.5 bg-white/90 hover:bg-white rounded-md text-gray-700 hover:text-red-600 transition-colors"
            title="Xóa ảnh"
          >
            <Trash2 className="h-4 w-4" />
          </button>
        </div>

        {/* Bottom Actions */}
        <div className="flex justify-center gap-2">
          {/* View Button */}
          <button
            type="button"
            onClick={onView}
            className="p-1.5 bg-white/90 hover:bg-white rounded-md text-gray-700 hover:text-blue-600 transition-colors"
            title="Xem ảnh"
          >
            <Eye className="h-4 w-4" />
          </button>

          {/* Edit Button */}
          <button
            type="button"
            onClick={onEdit}
            className="p-1.5 bg-white/90 hover:bg-white rounded-md text-gray-700 hover:text-green-600 transition-colors"
            title="Chỉnh sửa"
          >
            <Edit2 className="h-4 w-4" />
          </button>
        </div>
      </div>
    </div>
  );
}

/**
 * Product Image Gallery Component
 *
 * Displays product images with drag-and-drop reordering and action buttons
 */
export function ProductImageGallery({
  images,
  onImagesChange,
  onImageUpload,
  uploadingImages,
}: ProductImageGalleryProps) {
  const [previewModal, setPreviewModal] = useState<{
    isOpen: boolean;
    imageIndex: number;
    mode: 'view' | 'edit';
  }>({
    isOpen: false,
    imageIndex: 0,
    mode: 'view',
  });

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;

    if (over && active.id !== over.id) {
      const oldIndex = images.findIndex((img) => img.url === active.id);
      const newIndex = images.findIndex((img) => img.url === over.id);

      const reorderedImages = arrayMove(images, oldIndex, newIndex).map(
        (img, idx) => ({
          ...img,
          display_order: idx,
        })
      );

      onImagesChange(reorderedImages);
    }
  };

  const handleRemoveImage = (index: number) => {
    const newImages = images
      .filter((_, i) => i !== index)
      .map((img, idx) => ({
        ...img,
        display_order: idx,
      }));
    onImagesChange(newImages);
  };

  const handleUpdateAltText = (index: number, altText: string) => {
    const newImages = images.map((img, i) =>
      i === index ? { ...img, alt_text: altText } : img
    );
    onImagesChange(newImages);
  };

  const handleImageEdit = (index: number, newImageUrl: string) => {
    const newImages = images.map((img, i) =>
      i === index ? { ...img, url: newImageUrl } : img
    );
    onImagesChange(newImages);
  };

  const openModal = (index: number, mode: 'view' | 'edit') => {
    setPreviewModal({ isOpen: true, imageIndex: index, mode });
  };

  const closeModal = () => {
    setPreviewModal({ ...previewModal, isOpen: false });
  };

  const navigateImage = (direction: 'prev' | 'next') => {
    setPreviewModal((prev) => {
      const newIndex =
        direction === 'prev'
          ? prev.imageIndex > 0
            ? prev.imageIndex - 1
            : images.length - 1
          : prev.imageIndex < images.length - 1
            ? prev.imageIndex + 1
            : 0;
      return { ...prev, imageIndex: newIndex };
    });
  };

  return (
    <>
      <DndContext
        sensors={sensors}
        collisionDetection={closestCenter}
        onDragEnd={handleDragEnd}
      >
        <SortableContext
          items={images.map((img) => img.url)}
          strategy={rectSortingStrategy}
        >
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
            {images.map((image, index) => (
              <SortableImageItem
                key={image.url}
                image={image}
                index={index}
                onView={() => openModal(index, 'view')}
                onEdit={() => openModal(index, 'edit')}
                onRemove={() => handleRemoveImage(index)}
              />
            ))}

            {/* Upload Button */}
            <label className="aspect-square border-2 border-dashed border-gray-300 rounded-lg flex flex-col items-center justify-center cursor-pointer hover:bg-gray-50 hover:border-admin-primary transition-colors">
              <Upload className="h-8 w-8 text-muted-foreground mb-2" />
              <span className="text-sm text-muted-foreground text-center px-2">
                {uploadingImages ? 'Đang tải lên...' : 'Thêm ảnh'}
              </span>
              <input
                type="file"
                multiple
                accept="image/*"
                onChange={onImageUpload}
                disabled={uploadingImages}
                className="hidden"
              />
            </label>
          </div>
        </SortableContext>
      </DndContext>

      {/* Image Preview/Edit Modal */}
      {previewModal.isOpen && images[previewModal.imageIndex] && (
        <ImagePreviewModal
          isOpen={previewModal.isOpen}
          onClose={closeModal}
          imageUrl={images[previewModal.imageIndex].url}
          altText={images[previewModal.imageIndex].alt_text || ''}
          currentIndex={previewModal.imageIndex}
          totalImages={images.length}
          onNavigate={navigateImage}
          onUpdate={
            previewModal.mode === 'view'
              ? (altText) =>
                handleUpdateAltText(previewModal.imageIndex, altText)
              : undefined
          }
          onImageEdit={
            previewModal.mode === 'edit'
              ? (newImageUrl) =>
                handleImageEdit(previewModal.imageIndex, newImageUrl)
              : undefined
          }
          mode={previewModal.mode}
        />
      )}
    </>
  );
}
