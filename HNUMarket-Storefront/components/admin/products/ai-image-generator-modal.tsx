'use client';

import { useState } from 'react';
import { X, Upload, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { AIImageGeneratorPreviewGrid } from './ai-image-generator-preview-grid';
import {
  generateProductImages,
  fileToBase64,
  validateImageFile,
  dataUrlToFile,
} from '@/lib/services/ai-image-generation';
import {
  type ProductTheme,
  type GeneratedImage,
  type AIImageGeneratorState,
  THEME_CONFIG,
  TET_THEME_CONFIG,
} from '@/types/ai-image-generation';
import { uploadApi } from '@/lib/api/products';
import { cn } from '@/lib/utils';

interface AIImageGeneratorModalProps {
  isOpen: boolean;
  onClose: () => void;
  onImageSaved: (imageUrl: string) => void;
}

type ThemeCategory = 'grocery' | 'tet';

export function AIImageGeneratorModal({
  isOpen,
  onClose,
  onImageSaved,
}: AIImageGeneratorModalProps) {
  const [state, setState] = useState<AIImageGeneratorState>({
    status: 'idle',
    selectedTheme: null,
    sourceImage: null,
    sourceImagePreview: null,
    generatedImages: [],
    selectedImageIndex: null,
    error: null,
    customPrompt: '',
  });
  const [imageCount, setImageCount] = useState<1 | 2 | 3 | 4>(2);
  const [themeCategory, setThemeCategory] = useState<ThemeCategory>('tet'); // Default to Tet

  const imageCountOptions = [1, 2, 3, 4] as const;

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const validation = validateImageFile(file);
    if (!validation.valid) {
      setState((s) => ({ ...s, error: { message: validation.error! } }));
      return;
    }

    const previewUrl = URL.createObjectURL(file);
    setState((s) => ({
      ...s,
      sourceImage: file,
      sourceImagePreview: previewUrl,
      error: null,
    }));
  };

  const handleGenerate = async () => {
    if (!state.sourceImage || !state.selectedTheme) return;

    setState((s) => ({ ...s, status: 'generating', error: null }));

    try {
      const base64 = await fileToBase64(state.sourceImage);
      const response = await generateProductImages({
        imageBase64: base64,
        theme: state.selectedTheme,
        count: imageCount,
        customPrompt: state.customPrompt,
      });

      setState((s) => ({
        ...s,
        status: 'completed',
        generatedImages: [...s.generatedImages, ...response.images],
      }));
    } catch (error) {
      console.error('AI generation error:', error);

      let errorMessage = 'Có lỗi xảy ra, vui lòng cấu hình API';

      if (error instanceof Error) {
        if (error.message.includes('API key not configured')) {
          errorMessage = 'Chưa cấu hình Google GenAI API key. Vui lòng thêm NEXT_PUBLIC_GOOGLE_GENAI_API_KEY vào file .env.local';
        } else if (error.message.includes('API key')) {
          errorMessage = 'API key không hợp lệ. Vui lòng kiểm tra lại cấu hình.';
        } else if (error.message.includes('quota') || error.message.includes('rate limit')) {
          errorMessage = 'Đã vượt quá giới hạn API. Vui lòng thử lại sau.';
        } else if (error.message.includes('network') || error.message.includes('fetch')) {
          errorMessage = 'Lỗi kết nối mạng. Vui lòng kiểm tra kết nối internet.';
        } else {
          errorMessage = `Lỗi: ${error.message}`;
        }
      }

      setState((s) => ({
        ...s,
        status: 'error',
        error: { message: errorMessage },
      }));
    }
  };

  const handleSave = async () => {
    if (state.selectedImageIndex === null) return;

    const selectedImage = state.generatedImages[state.selectedImageIndex];
    setState((s) => ({ ...s, status: 'uploading' }));

    try {
      const file = dataUrlToFile(
        selectedImage.url,
        `ai-generated-${Date.now()}.jpg`
      );
      const result = await uploadApi.uploadFile(file);
      onImageSaved(result.url);
      onClose();
    } catch (error) {
      setState((s) => ({
        ...s,
        status: 'error',
        error: { message: 'Failed to upload image' },
      }));
    }
  };

  const activeThemes = themeCategory === 'tet' ? TET_THEME_CONFIG : THEME_CONFIG;

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl max-w-6xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-4 md:p-5 border-b">
          <h2 className="text-xl md:text-2xl font-bold">Tạo ảnh sản phẩm bằng AI</h2>
          <button
            type="button"
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-4 md:p-6 space-y-4 md:space-y-5">
          {/* Main Content: 2 Column Layout */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Left Column: Upload Image */}
            <div className="space-y-3">
              <Label className="text-base font-semibold text-red-600">1. Tải ảnh sản phẩm</Label>
              <label className="block aspect-video border-2 border-dashed border-gray-300 rounded-lg flex flex-col items-center justify-center cursor-pointer hover:bg-gray-50 transition-colors">
                {state.sourceImagePreview ? (
                  <img
                    src={state.sourceImagePreview}
                    alt="Source"
                    className="w-full h-full object-contain rounded-lg"
                  />
                ) : (
                  <>
                    <Upload className="h-12 w-12 text-red-600 mb-3" />
                    <span className="text-base font-bold text-gray-900 mb-1">
                      Nhấn để tải ảnh lên
                    </span>
                    <span className="text-sm text-gray-500">
                      Hỗ trợ JPG, PNG (Tối đa 5MB)
                    </span>
                  </>
                )}
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleImageUpload}
                  className="hidden"
                />
              </label>
            </div>

            {/* Right Column: Options */}
            <div className="space-y-4">
              {/* Theme Category Tabs */}
              <div className="space-y-3">
                <Label className="text-base font-semibold text-red-600">2. Chọn chủ đề</Label>
                <div className="flex gap-2 border-b border-gray-200">
                  <button
                    type="button"
                    onClick={() => {
                      setThemeCategory('tet');
                      setState((s) => ({ ...s, selectedTheme: null }));
                    }}
                    className={cn(
                      'px-4 py-2 font-semibold text-sm transition-colors border-b-2',
                      themeCategory === 'tet'
                        ? 'text-red-600 border-red-600'
                        : 'text-gray-600 border-transparent hover:text-gray-900'
                    )}
                  >
                    🎊 Tết 2026 (Năm Ngựa)
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setThemeCategory('grocery');
                      setState((s) => ({ ...s, selectedTheme: null }));
                    }}
                    className={cn(
                      'px-4 py-2 font-semibold text-sm transition-colors border-b-2',
                      themeCategory === 'grocery'
                        ? 'text-red-600 border-red-600'
                        : 'text-gray-600 border-transparent hover:text-gray-900'
                    )}
                  >
                    🛒 Tạp Hóa
                  </button>
                </div>
              </div>

              {/* Theme Selection */}
              <div className="space-y-3">
                <Label className="text-sm font-medium text-gray-700">Chọn phong cách:</Label>
                <div className="grid grid-cols-2 gap-3">
                  {activeThemes.map((theme) => (
                    <button
                      type="button"
                      key={theme.id}
                      onClick={() =>
                        setState((s) => ({ ...s, selectedTheme: theme.id as ProductTheme }))
                      }
                      className={`
                        p-4 rounded-lg border-2 transition-all text-left
                        ${state.selectedTheme === theme.id
                          ? 'border-red-600 ring-2 ring-red-600/20 bg-red-50 shadow-sm'
                          : 'border-gray-200 hover:border-red-400 hover:bg-gray-50'
                        }
                      `}
                    >
                      <h4 className="font-semibold text-sm text-gray-900 mb-1">{theme.name}</h4>
                      <p className="text-xs text-gray-600 leading-relaxed">{theme.description}</p>
                    </button>
                  ))}
                </div>
              </div>

              {/* Image Count */}
              <div className="space-y-2">
                <Label className="text-sm font-medium text-gray-700">Số lượng ảnh:</Label>
                <div className="grid grid-cols-4 gap-2">
                  {imageCountOptions.map((count) => (
                    <button
                      key={count}
                      type="button"
                      onClick={() => setImageCount(count)}
                      className={`
                        py-2.5 px-3 rounded-lg border-2 transition-all text-center
                        ${imageCount === count
                          ? 'border-red-600 bg-red-600 text-white ring-2 ring-red-600/20 shadow-sm'
                          : 'border-gray-200 hover:border-red-400 text-gray-700 hover:bg-gray-50'
                        }
                      `}
                    >
                      <span className="font-semibold text-base">{count}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Custom Prompt */}
              <div className="space-y-2">
                <Label htmlFor="customPrompt" className="text-sm font-medium text-gray-700">
                  Yêu cầu thêm (tùy chọn):
                </Label>
                <textarea
                  id="customPrompt"
                  value={state.customPrompt}
                  onChange={(e) => setState((s) => ({ ...s, customPrompt: e.target.value }))}
                  placeholder="Ví dụ: Thêm pháo hoa phía sau, làm mờ hậu cảnh..."
                  rows={3}
                  className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-red-600 focus:border-red-600 resize-none"
                />
              </div>

              {/* Generate Button */}
              <Button
                onClick={handleGenerate}
                disabled={!state.sourceImage || !state.selectedTheme || state.status === 'generating'}
                className="w-full bg-gray-600 hover:bg-gray-700 text-white"
                size="lg"
              >
                <Sparkles className="h-5 w-5 mr-2" />
                {state.status === 'generating'
                  ? `Đang tạo ${imageCount} ảnh...`
                  : themeCategory === 'tet'
                    ? 'Tạo Ảnh Tết 2026'
                    : 'Tạo Ảnh Sản Phẩm'}
              </Button>
            </div>
          </div>

          {/* Preview & Select */}
          {(state.generatedImages.length > 0 || state.status === 'generating') && (
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label className="text-sm">
                  {state.status === 'generating' ? 'Đang tạo ảnh...' : `Đã tạo ${state.generatedImages.length} ảnh - Chọn ảnh`}
                </Label>
                {state.generatedImages.length > 0 && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setState((s) => ({ ...s, generatedImages: [], selectedImageIndex: null }))}
                    className="text-xs"
                  >
                    Xóa tất cả
                  </Button>
                )}
              </div>
              <div className="max-h-[500px] overflow-y-auto pr-2">
                <AIImageGeneratorPreviewGrid
                  images={state.generatedImages}
                  selectedIndex={state.selectedImageIndex}
                  onSelect={(index) =>
                    setState((s) => ({ ...s, selectedImageIndex: index }))
                  }
                  loading={state.status === 'generating'}
                  loadingCount={imageCount}
                />
              </div>
            </div>
          )}

          {/* Error Display */}
          {state.error && (
            <Alert variant="destructive">
              <AlertDescription>{state.error.message}</AlertDescription>
            </Alert>
          )}
        </div>

        {/* Footer */}
        <div className="flex justify-end gap-3 p-4 md:p-5 border-t">
          <Button variant="outline" onClick={onClose}>
            Hủy
          </Button>
          <Button
            onClick={handleSave}
            disabled={state.selectedImageIndex === null || state.status === 'uploading'}
          >
            {state.status === 'uploading' ? 'Đang lưu...' : 'Lưu ảnh'}
          </Button>
        </div>
      </div>
    </div>
  );
}
