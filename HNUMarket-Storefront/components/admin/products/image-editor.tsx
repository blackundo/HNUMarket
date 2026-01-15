'use client';

import { useState, useCallback } from 'react';
import Cropper, { Area } from 'react-easy-crop';
import { Button } from '@/components/ui/button';
import { RotateCw, ZoomIn, ZoomOut, X } from 'lucide-react';
import { Slider } from '@/components/ui/slider';
import { toast } from 'sonner';

interface ImageEditorProps {
    imageUrl: string;
    onSave: (editedImageFile: File) => Promise<void>;
    onCancel: () => void;
}

/**
 * Image Editor Component
 *
 * Allows users to crop, rotate, and adjust images.
 * Outputs a square image with white padding for missing areas.
 */
export function ImageEditor({ imageUrl, onSave, onCancel }: ImageEditorProps) {
    const [crop, setCrop] = useState({ x: 0, y: 0 });
    const [zoom, setZoom] = useState(1);
    const [rotation, setRotation] = useState(0);
    const [croppedAreaPixels, setCroppedAreaPixels] = useState<Area | null>(null);
    const [processing, setProcessing] = useState(false);

    const onCropComplete = useCallback(
        (_croppedArea: Area, croppedAreaPixels: Area) => {
            setCroppedAreaPixels(croppedAreaPixels);
        },
        []
    );

    const handleRotate = () => {
        setRotation((prev) => (prev + 90) % 360);
    };

    const handleReset = () => {
        setCrop({ x: 0, y: 0 });
        setZoom(1);
        setRotation(0);
    };

    /**
     * Load image from URL
     */
    const loadImage = (url: string): Promise<HTMLImageElement> => {
        return new Promise((resolve, reject) => {
            const img = new Image();
            img.crossOrigin = 'anonymous';
            img.onload = () => resolve(img);
            img.onerror = reject;
            img.src = url;
        });
    };


    /**
     * Create cropped canvas from image
     */
    const createImage = async (
        imageSrc: string,
        pixelCrop: Area,
        rotation = 0
    ): Promise<HTMLCanvasElement> => {
        const image = await loadImage(imageSrc);
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');

        if (!ctx) {
            throw new Error('Failed to get canvas context');
        }

        const maxSize = Math.max(image.width, image.height);
        const safeArea = 2 * ((maxSize / 2) * Math.sqrt(2));

        // Set each dimension to double largest dimension to allow for a safe area for the
        // image to rotate in without being clipped by canvas context
        canvas.width = safeArea;
        canvas.height = safeArea;

        // Translate canvas context to a central location to allow rotating and flipping around the center
        ctx.translate(safeArea / 2, safeArea / 2);
        ctx.rotate((rotation * Math.PI) / 180);
        ctx.translate(-safeArea / 2, -safeArea / 2);

        // Draw rotated image
        ctx.drawImage(
            image,
            safeArea / 2 - image.width * 0.5,
            safeArea / 2 - image.height * 0.5
        );

        const data = ctx.getImageData(0, 0, safeArea, safeArea);

        // Set canvas width to final desired crop size - this will clear existing context
        canvas.width = pixelCrop.width;
        canvas.height = pixelCrop.height;

        // Paste generated rotate image at the top left of the canvas
        ctx.putImageData(
            data,
            Math.round(0 - safeArea / 2 + image.width * 0.5 - pixelCrop.x),
            Math.round(0 - safeArea / 2 + image.height * 0.5 - pixelCrop.y)
        );

        return canvas;
    };

    /**
     * Create square image with white padding
     */
    const createSquareImage = async (
        imageUrl: string,
        pixelCrop: Area,
        rotation: number
    ): Promise<File> => {
        // Create cropped canvas
        const croppedCanvas = await createImage(imageUrl, pixelCrop, rotation);

        // Create square canvas with white background
        const squareSize = Math.max(pixelCrop.width, pixelCrop.height);
        const squareCanvas = document.createElement('canvas');
        const squareCtx = squareCanvas.getContext('2d');

        if (!squareCtx) {
            throw new Error('Failed to get square canvas context');
        }

        squareCanvas.width = squareSize;
        squareCanvas.height = squareSize;

        // Fill white background
        squareCtx.fillStyle = '#FFFFFF';
        squareCtx.fillRect(0, 0, squareSize, squareSize);

        // Center the cropped image
        const offsetX = (squareSize - pixelCrop.width) / 2;
        const offsetY = (squareSize - pixelCrop.height) / 2;

        squareCtx.drawImage(
            croppedCanvas,
            offsetX,
            offsetY,
            pixelCrop.width,
            pixelCrop.height
        );

        // Convert to blob and file
        return new Promise((resolve, reject) => {
            squareCanvas.toBlob(
                (blob) => {
                    if (!blob) {
                        reject(new Error('Failed to create blob'));
                        return;
                    }
                    const file = new File([blob], 'edited-image.jpg', {
                        type: 'image/jpeg',
                    });
                    resolve(file);
                },
                'image/jpeg',
                0.95
            );
        });
    };

    const handleSave = async () => {
        if (!croppedAreaPixels) {
            return;
        }

        try {
            setProcessing(true);
            const editedFile = await createSquareImage(
                imageUrl,
                croppedAreaPixels,
                rotation
            );
            await onSave(editedFile);
        } catch (error) {
            console.error('Error processing image:', error);
            toast.error('Có lỗi xảy ra khi xử lý ảnh. Vui lòng thử lại.');
        } finally {
            setProcessing(false);
        }
    };

    return (
        <div className="space-y-4">
            {/* Header */}
            <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold">Chỉnh sửa ảnh</h3>
                <button
                    onClick={onCancel}
                    className="p-1 hover:bg-gray-100 rounded-md transition-colors"
                    disabled={processing}
                >
                    <X className="h-5 w-5" />
                </button>
            </div>

            {/* Crop Area */}
            <div className="relative w-full h-[400px] bg-gray-900 rounded-lg overflow-hidden">
                <Cropper
                    image={imageUrl}
                    crop={crop}
                    zoom={zoom}
                    rotation={rotation}
                    aspect={1}
                    onCropChange={setCrop}
                    onZoomChange={setZoom}
                    onRotationChange={setRotation}
                    onCropComplete={onCropComplete}
                />
            </div>

            {/* Controls */}
            <div className="space-y-4">
                {/* Zoom Control */}
                <div className="space-y-2">
                    <div className="flex items-center justify-between text-sm">
                        <span>Thu phóng</span>
                        <div className="flex items-center gap-2">
                            <ZoomOut className="h-4 w-4 text-gray-500" />
                            <span className="w-12 text-center">{Math.round(zoom * 100)}%</span>
                            <ZoomIn className="h-4 w-4 text-gray-500" />
                        </div>
                    </div>
                    <Slider
                        value={[zoom]}
                        min={1}
                        max={3}
                        step={0.1}
                        onValueChange={(value) => setZoom(value[0])}
                        disabled={processing}
                    />
                </div>

                {/* Rotation Control */}
                <div className="flex items-center gap-4">
                    <Button
                        type="button"
                        variant="outline"
                        onClick={handleRotate}
                        disabled={processing}
                        className="flex items-center gap-2"
                    >
                        <RotateCw className="h-4 w-4" />
                        Xoay 90°
                    </Button>
                    <Button
                        type="button"
                        variant="outline"
                        onClick={handleReset}
                        disabled={processing}
                    >
                        Đặt lại
                    </Button>
                </div>
            </div>

            {/* Actions */}
            <div className="flex justify-end gap-2 pt-4 border-t">
                <Button
                    type="button"
                    variant="outline"
                    onClick={onCancel}
                    disabled={processing}
                >
                    Hủy
                </Button>
                <Button
                    type="button"
                    onClick={handleSave}
                    disabled={processing || !croppedAreaPixels}
                >
                    {processing ? 'Đang xử lý...' : 'Lưu'}
                </Button>
            </div>
        </div>
    );
}
