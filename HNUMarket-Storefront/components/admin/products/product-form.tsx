'use client';

import { useState, useEffect, useRef, useMemo, type KeyboardEvent } from 'react';
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
} from '@dnd-kit/core';
import {
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import {
  useForm,
  useFieldArray,
  useWatch,
  Controller,
  type Control,
  type FieldErrors,
  type UseFormRegisterReturn,
} from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useRouter } from 'next/navigation';
import { createProductSchema, type CreateProductInput } from '@/lib/validations/product';
import { productsApi, uploadApi, type Product } from '@/lib/api/products';
import { storefrontCategoriesApi, type StorefrontCategory } from '@/lib/api/storefront-categories';
import { generateProductContent } from '@/lib/services';
import { TipTapEditor, type TipTapEditorRef } from '@/components/admin/posts/tiptap-editor';
import { ProductImageGallery, type ImageData } from '@/components/admin/products/product-image-gallery';
import { AIImageGeneratorModal } from '@/components/admin/products/ai-image-generator-modal';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuCheckboxItem,
  DropdownMenuTrigger,
  DropdownMenuItem,
} from '@/components/ui/dropdown-menu';
import {
  Plus,
  Trash2,
  Save,
  ArrowLeft,
  X,
  Sparkles,
  GripVertical,
  ChevronDown,
  ImagePlus,
} from 'lucide-react';
import Link from 'next/link';
import { getImageUrl } from '@/lib/image';

interface ProductFormProps {
  product?: Product;
  mode: 'create' | 'edit';
}

interface OptionValuesInputProps {
  control: Control<CreateProductInput>;
  optionIndex: number;
  errors: FieldErrors<CreateProductInput>;
  onValuesChange?: () => void;
}

interface SortableOptionRowProps extends OptionValuesInputProps {
  id: string;
  nameInputProps: UseFormRegisterReturn;
  onRemove: () => void;
}

interface VariantEditState {
  price: number;
  originalPrice?: number;
  stock: number;
  sku: string;
  imageUrl: string;
  isActive: boolean;
}

interface SortableOptionPreviewProps {
  id: string;
  name: string;
  values: Array<{ value?: string }>;
}

type BulkEditType = 'price' | 'originalPrice' | 'stock' | 'sku';

function OptionValuesInput({ control, optionIndex, errors, onValuesChange }: OptionValuesInputProps) {
  const { fields, append, remove } = useFieldArray({
    control,
    name: `options.${optionIndex}.values`,
  });
  const [inputValue, setInputValue] = useState('');

  const handleAddValue = () => {
    const trimmed = inputValue.trim();
    if (!trimmed) return;

    const exists = fields.some(
      (field) => field.value.toLowerCase() === trimmed.toLowerCase(),
    );
    if (!exists) {
      append({ value: trimmed });
    }
    setInputValue('');
    onValuesChange?.();
  };

  const handleKeyDown = (event: KeyboardEvent<HTMLInputElement>) => {
    if (event.key === 'Enter') {
      event.preventDefault();
      handleAddValue();
    }
  };

  const valueError = errors.options?.[optionIndex]?.values?.message;

  return (
    <div className="space-y-2">
      <div className="flex min-h-[44px] flex-wrap items-center gap-2 rounded-md border border-gray-200 bg-white px-3 py-2">
        {fields.map((field, valueIndex) => (
          <span
            key={field.id}
            className="inline-flex items-center gap-2 rounded-full bg-blue-100 px-3 py-1 text-sm font-medium text-blue-700"
          >
            {field.value}
            <button
              type="button"
              onClick={() => {
                remove(valueIndex);
                onValuesChange?.();
              }}
              className="text-blue-600 transition-colors hover:text-blue-900"
            >
              <X className="h-3 w-3" />
            </button>
          </span>
        ))}
        <input
          value={inputValue}
          onChange={(event) => setInputValue(event.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Nhập ký tự và ấn enter"
          className="min-w-[140px] flex-1 border-0 bg-transparent text-sm focus:outline-none"
        />
      </div>
      {valueError && <p className="text-xs text-red-500">{valueError}</p>}
    </div>
  );
}

function SortableOptionRow({
  id,
  control,
  optionIndex,
  errors,
  onValuesChange,
  nameInputProps,
  onRemove,
}: SortableOptionRowProps) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id });
  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.6 : 1,
  };

  return (
    <div ref={setNodeRef} style={style} className="grid grid-cols-12 gap-4 items-start">
      <div className="col-span-12 md:col-span-4 space-y-2">
        <div className="flex items-center gap-2">
          <button
            type="button"
            {...attributes}
            {...listeners}
            className="text-gray-400 hover:text-gray-700 cursor-grab active:cursor-grabbing"
            aria-label="Kéo để sắp xếp"
          >
            <GripVertical className="h-4 w-4" />
          </button>
          <Input
            {...nameInputProps}
            placeholder="Ví dụ: Kích thước"
            className="flex-1"
          />
        </div>
        {errors.options?.[optionIndex]?.name && (
          <p className="text-xs text-red-500">
            {errors.options[optionIndex]?.name?.message}
          </p>
        )}
      </div>
      <div className="col-span-12 md:col-span-7">
        <OptionValuesInput
          control={control}
          optionIndex={optionIndex}
          errors={errors}
          onValuesChange={onValuesChange}
        />
      </div>
      <div className="col-span-12 md:col-span-1 flex justify-end pt-1">
        <Button
          type="button"
          variant="ghost"
          size="icon"
          onClick={onRemove}
          className="text-gray-400 hover:text-red-500 hover:bg-red-50"
        >
          <Trash2 className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}

function SortableOptionPreview({ id, name, values }: SortableOptionPreviewProps) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id,
  });
  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.6 : 1,
  };

  return (
    <div ref={setNodeRef} style={style} className="grid grid-cols-12 items-center gap-4">
      <div className="col-span-12 md:col-span-4 flex items-center gap-3">
        <button
          type="button"
          {...attributes}
          {...listeners}
          className="text-gray-400 hover:text-gray-600 cursor-grab active:cursor-grabbing"
          aria-label="Kéo để sắp xếp"
        >
          <GripVertical className="h-4 w-4" />
        </button>
        <span className="text-lg font-semibold text-gray-900">{name || '—'}</span>
      </div>
      <div className="col-span-12 md:col-span-8 flex flex-wrap gap-3">
        {(values || []).map((value, valueIndex) => (
          <span
            key={`${id}-${value?.value || 'value'}-${valueIndex}`}
            className="inline-flex items-center gap-2 rounded-2xl bg-blue-50 px-4 py-2 text-sm font-semibold text-gray-800"
          >
            <GripVertical className="h-4 w-4 text-gray-400" />
            {value?.value || '—'}
          </span>
        ))}
      </div>
    </div>
  );
}

/**
 * Product Form Component
 *
 * Reusable form for creating and editing products with 2-column layout.
 * Left: Main content (name, description, price, stock, variants)
 * Right: Images, categories, SEO, specifications
 */
export function ProductForm({ product, mode }: ProductFormProps) {
  const router = useRouter();
  const editorRef = useRef<TipTapEditorRef>(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [uploadingImages, setUploadingImages] = useState(false);
  const [categories, setCategories] = useState<StorefrontCategory[]>([]);
  const [loadingCategories, setLoadingCategories] = useState(false);
  const [showAIGenerator, setShowAIGenerator] = useState(false);
  const [manualSlugInput, setManualSlugInput] = useState(false);
  const [images, setImages] = useState<ImageData[]>([]);
  const [metaTitle, setMetaTitle] = useState('');
  const [metaDescription, setMetaDescription] = useState('');
  const [generatingContent, setGeneratingContent] = useState(false);
  const [sortModalOpen, setSortModalOpen] = useState(false);
  const [variantEditIndex, setVariantEditIndex] = useState<number | null>(null);
  const [variantEditState, setVariantEditState] = useState<VariantEditState | null>(null);
  const [variantImageUploading, setVariantImageUploading] = useState(false);
  const [selectedVariants, setSelectedVariants] = useState<Set<number>>(new Set());
  const [bulkEditType, setBulkEditType] = useState<BulkEditType | null>(null);
  const [bulkEditOpen, setBulkEditOpen] = useState(false);
  const [bulkEditApplyValue, setBulkEditApplyValue] = useState<string>('');
  const [bulkEditValues, setBulkEditValues] = useState<Record<number, string>>({});
  const [variantFilters, setVariantFilters] = useState<Record<number, Set<string>>>({});

  const optionDefaultNames = ['Kích thước', 'Mùi vị', 'Chất liệu'];

  // Load categories
  useEffect(() => {
    const loadCategories = async () => {
      try {
        setLoadingCategories(true);
        const data = await storefrontCategoriesApi.getCategories();
        setCategories(data);
      } catch (err) {
        console.error('Failed to load categories:', err);
      } finally {
        setLoadingCategories(false);
      }
    };
    loadCategories();
  }, []);

  const {
    register,
    handleSubmit,
    formState: { errors },
    control,
    getValues,
    setValue,
    watch,
  } = useForm<CreateProductInput>({
    resolver: zodResolver(createProductSchema),
    defaultValues: product
      ? {
        name: product.name,
        description: product.description || '',
        price: product.price,
        originalPrice: (product as any).original_price ?? undefined,
        categoryId: product.category_id || null,
        stock: product.stock ?? 0,
        sku: product.sku || '',
        isActive: product.is_active ?? true,
        slug: product.slug || '',
        specifications: (product as any).specifications || {},
        imageUrls: (product.images || []).map((img) => img.url),
        options: ((product as any).options || []).map(
          (option: { name: string; position?: number; values?: Array<{ value: string }> }, index: number) => ({
            name: option.name || '',
            position: typeof option.position === 'number' ? option.position : index,
            values: (option.values || []).map((value) => ({
              value: value.value,
            })),
          }),
        ),
        variantsNormalized: ((product as any).options?.length
          ? (product as any).variants || []
          : []
        ).map((variant: any) => ({
          attributeCombination: variant.attributes || {},
          stock: variant.stock ?? 0,
          price: variant.price ?? product.price ?? 0,
          originalPrice: variant.original_price ?? variant.originalPrice,
          sku: variant.sku || '',
          imageUrl: variant.image_url || variant.imageUrl || '',
          isActive: variant.is_active ?? variant.isActive ?? true,
        })),
        variants: [],
      }
      : {
        name: '',
        description: '',
        price: 0,
        originalPrice: undefined,
        stock: 0,
        sku: '',
        isActive: true,
        slug: '',
        specifications: {},
        imageUrls: [],
        options: [],
        variantsNormalized: [],
        variants: [],
      },
  });

  const { fields: optionFields, append: appendOption, remove: removeOption, move: moveOption } = useFieldArray({
    control,
    name: 'options',
  });

  const { fields: variantFields, replace: replaceVariants } = useFieldArray({
    control,
    name: 'variantsNormalized',
  });

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    }),
  );

  // Initialize images and meta fields from product
  useEffect(() => {
    if (product) {
      const productImages = (product.images || []).map((img) => ({
        url: img.url,
        alt_text: img.alt_text || '',
        display_order: img.display_order ?? 0,
      }));
      setImages(productImages);
      setMetaTitle(product.meta_title || '');
      setMetaDescription(product.meta_description || '');
      setValue('imageUrls', productImages.map((img) => img.url));
      setValue('categoryId', product.category_id || null);
    }
  }, [product, setValue]);

  const options = useWatch({ control, name: 'options' }) || [];
  const variantsNormalized = useWatch({ control, name: 'variantsNormalized' }) || [];
  const hasCompleteOptions = useMemo(() => {
    const namedOptions = options.filter((option) => option?.name?.trim());
    if (namedOptions.length === 0) return false;
    return namedOptions.every((option) => (option.values || []).length > 0);
  }, [options]);
  const hasVariants = hasCompleteOptions && variantsNormalized.length > 0;
  const specifications = watch('specifications') || {};
  const basePrice = watch('price');

  const selectedCount = selectedVariants.size;

  // Auto-set product stock to 0 when variants are added
  useEffect(() => {
    if (hasVariants) {
      setValue('stock', 0);
    }
  }, [hasVariants, setValue]);

  const optionsSignature = useMemo(() => {
    return (options || [])
      .map((option) => {
        const name = option?.name?.trim() || '';
        const values = (option?.values || [])
          .map((value) => (value?.value || '').trim())
          .filter(Boolean);
        if (!name) return '';
        return `${name}:${values.join(',')}`;
      })
      .filter(Boolean)
      .join('|');
  }, [options]);

  const buildCombinationKey = (attributes: Record<string, string>) =>
    Object.entries(attributes)
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([key, value]) => `${key}:${value}`)
      .join('|');

  useEffect(() => {
    const rawOptions = (getValues('options') || []).map((option, index) => ({
      name: option?.name?.trim() || '',
      position: typeof option?.position === 'number' ? option.position : index,
      values: (option?.values || [])
        .map((value) => ({ value: (value?.value || '').trim() }))
        .filter((value) => value.value),
    }));
    const namedOptions = rawOptions.filter((option) => option.name);
    const hasIncompleteOption = namedOptions.some(
      (option) => option.values.length === 0,
    );

    // Nếu không còn option nào có tên, xóa tất cả variants
    if (namedOptions.length === 0) {
      replaceVariants([]);
      return;
    }

    // Nếu có option incomplete (có tên nhưng chưa có values), giữ nguyên variants hiện tại
    if (hasIncompleteOption) {
      return;
    }

    const combinations = namedOptions.reduce<Record<string, string>[]>(
      (acc, option) => {
        const next: Record<string, string>[] = [];
        for (const combo of acc) {
          for (const optionValue of option.values) {
            next.push({
              ...combo,
              [option.name]: optionValue.value,
            });
          }
        }
        return next;
      },
      [{}],
    );

    const existingVariants = getValues('variantsNormalized') || [];
    const existingByKey = new Map(
      existingVariants.map((variant) => [
        buildCombinationKey(variant.attributeCombination || {}),
        variant,
      ]),
    );
    const defaultPrice = typeof basePrice === 'number' ? basePrice : 0;

    const nextVariants = combinations.map((attributes) => {
      const key = buildCombinationKey(attributes);
      const existing = existingByKey.get(key);
      return {
        attributeCombination: attributes,
        stock: existing?.stock ?? 0,
        price: existing?.price ?? defaultPrice,
        originalPrice: existing?.originalPrice,
        sku: existing?.sku ?? '',
        imageUrl: existing?.imageUrl ?? '',
        isActive: existing?.isActive ?? true,
      };
    });

    replaceVariants(nextVariants);
  }, [optionsSignature, basePrice, getValues, replaceVariants]);

  useEffect(() => {
    const currentOptions = getValues('options') || [];
    const updatedOptions = currentOptions.map((option, index) => ({
      ...option,
      position: index,
    }));
    const needsUpdate = updatedOptions.some(
      (option, index) => option.position !== currentOptions[index]?.position,
    );
    if (needsUpdate) {
      setValue('options', updatedOptions, {
        shouldDirty: true,
        shouldValidate: false,
      });
    }
  }, [optionFields.length, getValues, setValue]);

  useEffect(() => {
    setSelectedVariants(new Set());
  }, [variantFields.length]);

  useEffect(() => {
    setVariantFilters((prev) => {
      const next: Record<number, Set<string>> = {};
      options.forEach((option, index) => {
        if (option?.name) {
          next[index] = prev[index] || new Set();
        }
      });
      return next;
    });
  }, [options]);

  // Auto-generate slug from name when manual input is NOT checked
  const productName = watch('name');
  const currentSlug = watch('slug');
  useEffect(() => {
    // Only auto-generate if:
    // 1. Manual input checkbox is NOT checked (auto-generate mode)
    // 2. Product name exists
    if (!manualSlugInput && productName) {
      const autoSlug = productName
        .toLowerCase()
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-|-$/g, '');

      setValue('slug', autoSlug, { shouldValidate: false });
    }
  }, [productName, manualSlugInput, setValue]);

  // Handle slug input change
  const handleSlugChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setValue('slug', value, { shouldValidate: true });
  };

  // Handle manual input checkbox change
  const handleManualInputChange = (checked: boolean) => {
    setManualSlugInput(checked);
    if (!checked && productName) {
      // If disabling manual input (enabling auto-generate), immediately generate slug from name
      const autoSlug = productName
        .toLowerCase()
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-|-$/g, '');
      setValue('slug', autoSlug, { shouldValidate: false });
    }
  };

  // Handle AI content generation
  const handleGenerateContent = async () => {
    const name = watch('name');
    const categoryId = watch('categoryId');

    if (!name || name.trim() === '') {
      setError('Vui lòng nhập tên sản phẩm trước khi tạo nội dung AI');
      return;
    }

    try {
      setGeneratingContent(true);
      setError('');

      // Get category name
      const category = categories.find((c) => c.id === categoryId);
      const categoryName = category?.name || '';

      // Call AI service directly
      const data = await generateProductContent({
        productName: name,
        category: categoryName,
      });

      // Map predicted_attributes to specifications
      if (data.predicted_attributes) {
        const specs: Record<string, string> = {};
        if (data.predicted_attributes.brand) {
          specs['Thương hiệu'] = data.predicted_attributes.brand;
        }
        if (data.predicted_attributes.weight_volume) {
          specs['Trọng lượng/Thể tích'] = data.predicted_attributes.weight_volume;
        }
        if (data.predicted_attributes.flavor_type) {
          specs['Hương vị/Loại'] = data.predicted_attributes.flavor_type;
        }
        if (data.predicted_attributes.origin) {
          specs['Xuất xứ'] = data.predicted_attributes.origin;
        }
        if (data.predicted_attributes.main_ingredients) {
          specs['Thành phần chính'] = data.predicted_attributes.main_ingredients;
        }
        setValue('specifications', specs);
      }

      // Map marketing_content to description and metaDescription
      if (data.marketing_content) {
        if (data.marketing_content.detailed_description) {
          // Use TipTap editor ref to set content
          if (editorRef.current) {
            editorRef.current.setContent(data.marketing_content.detailed_description);
          }
        }
        if (data.marketing_content.short_description) {
          setMetaDescription(data.marketing_content.short_description);
        }
      }
    } catch (err) {
      console.error('Error generating content:', err);
      setError(err instanceof Error ? err.message : 'Tạo nội dung thất bại');
    } finally {
      setGeneratingContent(false);
    }
  };

  // Handle image upload
  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (files.length === 0) return;

    try {
      setUploadingImages(true);
      setError('');

      const uploadPromises = files.map((file) => uploadApi.uploadFile(file));
      const results = await Promise.all(uploadPromises);

      const newImages = results.map((result, index) => ({
        url: result.url,
        alt_text: files[index].name,
        display_order: images.length + index,
      }));

      const updatedImages = [...images, ...newImages];
      setImages(updatedImages);
      setValue('imageUrls', updatedImages.map((img) => img.url));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Tải lên hình ảnh thất bại');
    } finally {
      setUploadingImages(false);
    }
  };

  // Handle images change from gallery
  const handleImagesChange = (newImages: ImageData[]) => {
    setImages(newImages);
    setValue('imageUrls', newImages.map((img) => img.url));
  };

  // Handle AI-generated image saved
  const handleAIImageSaved = (imageUrl: string) => {
    const newImage: ImageData = {
      url: imageUrl,
      alt_text: `AI generated - ${new Date().toISOString()}`,
      display_order: images.length,
    };
    const updatedImages = [...images, newImage];
    setImages(updatedImages);
    setValue('imageUrls', updatedImages.map((img) => img.url));
  };

  // Handle specifications
  const addSpecification = () => {
    const newSpecs = { ...specifications, '': '' };
    setValue('specifications', newSpecs);
  };

  const updateSpecification = (oldKey: string, newKey: string, value: string) => {
    const newSpecs = { ...specifications };
    if (oldKey !== newKey) {
      delete newSpecs[oldKey];
    }
    newSpecs[newKey] = value;
    setValue('specifications', newSpecs);
  };

  const removeSpecification = (key: string) => {
    const newSpecs = { ...specifications };
    delete newSpecs[key];
    setValue('specifications', newSpecs);
  };

  const handleOptionDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (!over || active.id === over.id) return;
    const oldIndex = optionFields.findIndex((field) => field.id === active.id);
    const newIndex = optionFields.findIndex((field) => field.id === over.id);
    if (oldIndex === -1 || newIndex === -1) return;
    moveOption(oldIndex, newIndex);
    setVariantFilters({});
  };

  const forceOptionsRefresh = () => {
    const current = getValues('options') || [];
    setValue('options', [...current], { shouldDirty: true, shouldValidate: false });
  };

  const toggleFilterValue = (optionIndex: number, value: string) => {
    setVariantFilters((prev) => {
      const next = { ...prev };
      const current = new Set(next[optionIndex] ?? []);
      if (current.has(value)) {
        current.delete(value);
      } else {
        current.add(value);
      }
      if (current.size === 0) {
        delete next[optionIndex];
      } else {
        next[optionIndex] = current;
      }
      return next;
    });
  };

  const clearFilters = () => {
    setVariantFilters({});
  };

  const filteredVariantIndices = useMemo(() => {
    if (!variantsNormalized.length) return [];
    const activeFilters = Object.entries(variantFilters).filter(
      ([, values]) => values.size > 0,
    );
    if (activeFilters.length === 0) {
      return variantsNormalized.map((_, index) => index);
    }

    return variantsNormalized.reduce<number[]>((acc, variant, index) => {
      const attributes = variant.attributeCombination || {};
      const matches = activeFilters.every(([optionIndex, values]) => {
        const optionName = options[Number(optionIndex)]?.name;
        if (!optionName) return true;
        const attributeValue = attributes[optionName];
        if (!attributeValue) return false;
        return values.has(attributeValue);
      });
      if (matches) acc.push(index);
      return acc;
    }, []);
  }, [options, variantsNormalized, variantFilters]);

  const allFilteredSelected =
    filteredVariantIndices.length > 0 &&
    filteredVariantIndices.every((index) => selectedVariants.has(index));

  const toggleSelectAllVariants = (indices: number[]) => {
    const allSelected = indices.every((index) => selectedVariants.has(index));
    if (allSelected) {
      setSelectedVariants((prev) => {
        const next = new Set(prev);
        indices.forEach((index) => next.delete(index));
        return next;
      });
      return;
    }
    setSelectedVariants((prev) => {
      const next = new Set(prev);
      indices.forEach((index) => next.add(index));
      return next;
    });
  };

  const openBulkEdit = (type: BulkEditType) => {
    const indices = Array.from(selectedVariants).sort((a, b) => a - b);
    if (indices.length === 0) return;
    const values: Record<number, string> = {};
    indices.forEach((index) => {
      const variant = getValues(`variantsNormalized.${index}`);
      if (!variant) return;
      switch (type) {
        case 'price':
          values[index] = variant.price?.toString() ?? '';
          break;
        case 'originalPrice':
          values[index] = variant.originalPrice?.toString() ?? '';
          break;
        case 'stock':
          values[index] = variant.stock?.toString() ?? '';
          break;
        case 'sku':
          values[index] = variant.sku ?? '';
          break;
        default:
          break;
      }
    });
    setBulkEditType(type);
    setBulkEditValues(values);
    setBulkEditApplyValue('');
    setBulkEditOpen(true);
  };

  const applyBulkEditAll = () => {
    if (!bulkEditType) return;
    setBulkEditValues((prev) => {
      const next: Record<number, string> = {};
      Object.keys(prev).forEach((key) => {
        next[Number(key)] = bulkEditApplyValue;
      });
      return next;
    });
  };

  const saveBulkEdit = () => {
    if (!bulkEditType) return;
    Object.entries(bulkEditValues).forEach(([key, value]) => {
      const index = Number(key);
      const trimmed = value.trim();
      if (bulkEditType === 'sku') {
        if (trimmed === '') return;
        setValue(`variantsNormalized.${index}.sku`, trimmed, { shouldDirty: true });
        return;
      }
      if (trimmed === '') return;
      const numericValue = Number(trimmed);
      if (Number.isNaN(numericValue)) return;
      if (bulkEditType === 'price') {
        setValue(`variantsNormalized.${index}.price`, numericValue, {
          shouldDirty: true,
        });
      }
      if (bulkEditType === 'originalPrice') {
        setValue(`variantsNormalized.${index}.originalPrice`, numericValue, {
          shouldDirty: true,
        });
      }
      if (bulkEditType === 'stock') {
        setValue(`variantsNormalized.${index}.stock`, numericValue, {
          shouldDirty: true,
        });
      }
    });
    setBulkEditOpen(false);
  };

  const openVariantEditor = (index: number) => {
    const variant = getValues(`variantsNormalized.${index}`);
    if (!variant) return;
    setVariantEditState({
      price: variant.price ?? 0,
      originalPrice: variant.originalPrice,
      stock: variant.stock ?? 0,
      sku: variant.sku || '',
      imageUrl: variant.imageUrl || '',
      isActive: variant.isActive ?? true,
    });
    setVariantEditIndex(index);
  };

  const closeVariantEditor = () => {
    setVariantEditIndex(null);
    setVariantEditState(null);
  };

  const saveVariantEditor = () => {
    if (variantEditIndex === null || !variantEditState) return;
    setValue(`variantsNormalized.${variantEditIndex}.price`, variantEditState.price, {
      shouldDirty: true,
    });
    setValue(
      `variantsNormalized.${variantEditIndex}.originalPrice`,
      variantEditState.originalPrice,
      { shouldDirty: true },
    );
    setValue(`variantsNormalized.${variantEditIndex}.stock`, variantEditState.stock, {
      shouldDirty: true,
    });
    setValue(`variantsNormalized.${variantEditIndex}.sku`, variantEditState.sku, {
      shouldDirty: true,
    });
    setValue(
      `variantsNormalized.${variantEditIndex}.imageUrl`,
      variantEditState.imageUrl,
      { shouldDirty: true },
    );
    setValue(
      `variantsNormalized.${variantEditIndex}.isActive`,
      variantEditState.isActive,
      { shouldDirty: true },
    );
    closeVariantEditor();
  };

  const handleVariantImageUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    try {
      setVariantImageUploading(true);
      const result = await uploadApi.uploadFile(file);
      setVariantEditState((prev) =>
        prev ? { ...prev, imageUrl: result.url } : prev,
      );
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Tải lên hình ảnh thất bại');
    } finally {
      setVariantImageUploading(false);
    }
  };

  const toggleVariantSelection = (index: number) => {
    setSelectedVariants((prev) => {
      const next = new Set(prev);
      if (next.has(index)) {
        next.delete(index);
      } else {
        next.add(index);
      }
      return next;
    });
  };



  // Transform form data to backend format
  const transformToBackendFormat = (data: CreateProductInput, isEdit: boolean = false) => {
    const transformed: any = {
      name: data.name,
      description: data.description,
      price: data.price,
      stock: data.stock,
    };

    // Add originalPrice if provided
    if (typeof data.originalPrice === 'number' && !Number.isNaN(data.originalPrice)) {
      transformed.originalPrice = data.originalPrice;
    } else if (isEdit) {
      // Explicitly set to null when editing to allow clearing the value
      transformed.originalPrice = null;
    }

    // Only send categoryId if it's provided and not empty
    if (data.categoryId && data.categoryId.trim() !== '') {
      transformed.categoryId = data.categoryId;
    }

    if (data.isActive !== undefined) {
      transformed.isActive = data.isActive;
    }

    if (data.sku && data.sku.trim() !== '') {
      transformed.sku = data.sku.trim();
    }

    // Send slug if user has manually edited it, otherwise backend will auto-generate
    if (data.slug && data.slug.trim() !== '') {
      transformed.slug = data.slug.trim();
    }

    if (metaTitle) {
      transformed.metaTitle = metaTitle;
    }

    if (metaDescription) {
      transformed.metaDescription = metaDescription;
    }

    if (data.specifications && Object.keys(data.specifications).length > 0) {
      transformed.specifications = data.specifications;
    }

    const imageUrls = images.filter((img) => img && img.url).map((img) => img.url);
    if (isEdit || imageUrls.length > 0) {
      transformed.imageUrls = imageUrls;
    }

    const normalizedOptions = (data.options || [])
      .map((option, index) => ({
        name: option.name?.trim() || '',
        position: index,
        values: (option.values || [])
          .map((value) => ({ value: value.value?.trim() || '' }))
          .filter((value) => value.value),
      }))
      .filter((option) => option.name && option.values.length > 0);

    const normalizedVariants = (data.variantsNormalized || [])
      .filter((variant) => Object.keys(variant.attributeCombination || {}).length > 0)
      .map((variant) => {
        const imageUrl = variant.imageUrl?.trim();
        const sku = variant.sku?.trim();
        return {
          ...variant,
          originalPrice:
            typeof variant.originalPrice === 'number' && !Number.isNaN(variant.originalPrice)
              ? variant.originalPrice
              : undefined,
          imageUrl: imageUrl ? imageUrl : undefined,
          sku: sku ? sku : undefined,
        };
      });

    // Only send options/variants when they actually exist
    if (normalizedOptions.length > 0 || normalizedVariants.length > 0) {
      transformed.options = normalizedOptions;
      transformed.variantsNormalized = normalizedVariants;
    } else if (isEdit) {
      // When editing and removing all variants, explicitly send empty arrays
      transformed.options = [];
      transformed.variantsNormalized = [];
    }

    return transformed;
  };

  // Submit form
  const onSubmit = async (data: CreateProductInput) => {
    try {
      setLoading(true);
      setError('');

      const isEdit = mode === 'edit';
      const backendData = transformToBackendFormat(data, isEdit);

      if (mode === 'create') {
        await productsApi.createProduct(backendData);
        router.push('/admin/products');
      } else if (product) {
        await productsApi.updateProduct(product.id, backendData);
        router.push('/admin/products');
      }
    } catch (err) {
      console.error('Error saving product:', err);
      const errorMessage = err instanceof Error ? err.message : 'Lưu sản phẩm thất bại';
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  // Handle form validation errors
  const onError = (errors: any) => {
    console.error('Form validation errors:', errors);
    const errorKeys = Object.keys(errors);
    if (errorKeys.length > 0) {
      const firstErrorKey = errorKeys[0];
      const firstError = errors[firstErrorKey];
      let errorMessage = 'Vui lòng sửa lỗi biểu mẫu';

      if (firstError?.message) {
        errorMessage = `${firstErrorKey}: ${firstError.message}`;
      } else if (firstError?.type) {
        errorMessage = `${firstErrorKey}: ${firstError.type}`;
      }

      setError(`Lỗi xác thực: ${errorMessage}`);
    } else {
      setError('Vui lòng sửa lỗi biểu mẫu');
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit, onError)} className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">
            {mode === 'create' ? 'Tạo sản phẩm mới' : 'Chỉnh sửa sản phẩm'}
          </h1>
          <p className="text-muted-foreground">
            {mode === 'create'
              ? 'Thêm sản phẩm mới vào cửa hàng'
              : 'Cập nhật thông tin sản phẩm'}
          </p>
        </div>
        <Link href="/admin/products">
          <Button variant="outline">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Quay lại danh sách sản phẩm
          </Button>
        </Link>
      </div>

      {/* Error Alert */}
      {error && (
        <Alert variant="destructive">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {/* Two Column Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column - Main Content */}
        <div className="lg:col-span-2 space-y-6">
          {/* Basic Information */}
          <Card>
            <CardHeader>
              <CardTitle>Thông tin cơ bản</CardTitle>
              <CardDescription>
                Tên sản phẩm, mô tả và giá
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="name">Tên sản phẩm *</Label>
                <Input
                  id="name"
                  {...register('name')}
                  placeholder="Nhập tên sản phẩm"
                />
                {errors.name && (
                  <p className="text-sm text-destructive">{errors.name.message}</p>
                )}
              </div>

              {/* AI Generate Content Button */}
              <div className="flex items-center justify-between p-4 border rounded-lg bg-gradient-to-r from-purple-50 to-blue-50">
                <div className="flex-1">
                  <p className="text-sm font-medium text-gray-900">
                    Tự động tạo nội dung bằng AI
                  </p>
                  <p className="text-xs text-gray-500">
                    AI sẽ tự động tạo mô tả chi tiết, thông số kỹ thuật và mô tả SEO
                  </p>
                </div>
                <Button
                  type="button"
                  onClick={handleGenerateContent}
                  disabled={generatingContent || !watch('name')}
                  className="ml-4 bg-admin-primary hover:bg-admin-primary/80"
                  variant="default"
                >
                  {generatingContent ? (
                    <>
                      <span className="mr-2">Đang tạo...</span>
                      <span className="animate-spin">⏳</span>
                    </>
                  ) : (
                    <>
                      <Sparkles className="h-4 w-4 mr-2" />
                      Tạo nội dung AI
                    </>
                  )}
                </Button>
              </div>

              <div className="space-y-2">
                <Label htmlFor="description">Mô tả</Label>
                <Controller
                  name="description"
                  control={control}
                  render={({ field }) => (
                    <TipTapEditor
                      ref={editorRef}
                      content={field.value || ''}
                      onChange={field.onChange}
                    />
                  )}
                />
                {errors.description && (
                  <p className="text-sm text-destructive">
                    {errors.description.message}
                  </p>
                )}
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="price">Giá bán (KRW) *</Label>
                  <Input
                    id="price"
                    type="number"
                    {...register('price', { valueAsNumber: true })}
                    placeholder="0"
                  />
                  {errors.price && (
                    <p className="text-sm text-destructive">{errors.price.message}</p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="originalPrice">Giá gốc (KRW)</Label>
                  <Input
                    id="originalPrice"
                    type="number"
                    {...register('originalPrice', {
                      setValueAs: (v) => v === '' || v === null || v === undefined ? undefined : Number(v)
                    })}
                    placeholder="Để trống nếu không giảm giá"
                  />
                  {errors.originalPrice && (
                    <p className="text-sm text-destructive">{errors.originalPrice.message}</p>
                  )}
                  <p className="text-xs text-muted-foreground">
                    Nhập giá gốc nếu sản phẩm đang giảm giá
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="stock">
                    Tồn kho *
                    {hasVariants && (
                      <span className="ml-2 text-xs font-normal text-amber-600">
                        (Đã tắt - Sử dụng tồn kho biến thể)
                      </span>
                    )}
                  </Label>
                  <Input
                    id="stock"
                    type="number"
                    {...register('stock', { valueAsNumber: true })}
                    placeholder="0"
                    disabled={hasVariants}
                    className={hasVariants ? 'bg-gray-100 cursor-not-allowed' : ''}
                  />
                  {hasVariants && (
                    <p className="text-xs text-amber-600">
                      Sản phẩm này có biến thể. Tồn kho được quản lý theo từng biến thể bên dưới.
                    </p>
                  )}
                  {errors.stock && (
                    <p className="text-sm text-destructive">{errors.stock.message}</p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="sku">SKU</Label>
                  <Input
                    id="sku"
                    {...register('sku')}
                    placeholder="PROD-001"
                  />
                  {errors.sku && (
                    <p className="text-sm text-destructive">{errors.sku.message}</p>
                  )}
                </div>
              </div>

              <div className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  id="isActive"
                  {...register('isActive')}
                  className="h-4 w-4 rounded border-gray-300"
                />
                <Label htmlFor="isActive" className="font-normal">
                  Sản phẩm đang hoạt động (hiển thị trên cửa hàng)
                </Label>
              </div>
            </CardContent>
          </Card>

          {/* Product Attributes */}
          <Card>
            <CardHeader className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <CardTitle>Thuộc tính</CardTitle>
                <CardDescription>
                  Nhập thuộc tính và giá trị để tạo danh sách biến thể tự động
                </CardDescription>
              </div>
              <Button
                type="button"
                variant="ghost"
                className="text-admin-primary"
                onClick={() => setSortModalOpen(true)}
                disabled={optionFields.length <= 1}
              >
                <GripVertical className="h-4 w-4 mr-2" />
                Sắp xếp thuộc tính
              </Button>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-12 gap-4 border-b border-gray-100 pb-2 text-sm font-medium text-gray-500">
                <div className="col-span-4">Tên thuộc tính</div>
                <div className="col-span-7">Giá trị</div>
              </div>
              <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleOptionDragEnd}>
                <SortableContext
                  items={optionFields.map((field) => field.id)}
                  strategy={verticalListSortingStrategy}
                >
                  <div className="space-y-4">
                    {optionFields.map((field, index) => (
                      <SortableOptionRow
                        key={field.id}
                        id={field.id}
                        control={control}
                        optionIndex={index}
                        errors={errors}
                        onValuesChange={forceOptionsRefresh}
                        nameInputProps={register(`options.${index}.name`)}
                        onRemove={() => removeOption(index)}
                      />
                    ))}
                  </div>
                </SortableContext>
              </DndContext>
              <Button
                type="button"
                variant="outline"
                onClick={() =>
                  appendOption({
                    name: optionDefaultNames[optionFields.length] || '',
                    position: optionFields.length,
                    values: [],
                  })
                }
                disabled={optionFields.length >= 3}
              >
                <Plus className="h-4 w-4 mr-2" />
                Thêm thuộc tính
              </Button>
              <p className="text-xs text-muted-foreground">
                Tối đa 3 thuộc tính cho mỗi sản phẩm.
              </p>
            </CardContent>
          </Card>

          {/* Product Variants */}
          <Card>
            <CardHeader>
              <CardTitle>
                Biến thể sản phẩm
                {variantFields.length > 0 && (
                  <span className="ml-2 text-sm font-medium text-muted-foreground">
                    ({variantFields.length})
                  </span>
                )}
              </CardTitle>
              <CardDescription>
                Danh sách biến thể được tạo tự động từ các thuộc tính ở trên
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {variantFields.length === 0 ? (
                <p className="text-sm text-muted-foreground">
                  Thêm thuộc tính và giá trị để tạo biến thể.
                </p>
              ) : (
                <div className="space-y-3">
                  <div className="flex flex-wrap items-center gap-3 text-sm text-muted-foreground">
                    <span className="font-medium text-gray-700">Bộ lọc:</span>
                    {options.map((option, index) => (
                      <DropdownMenu key={`${option.name || 'option'}-${index}`}>
                        <DropdownMenuTrigger asChild>
                          <button
                            type="button"
                            className="inline-flex items-center gap-1 rounded-full border border-gray-200 px-3 py-1 text-sm text-gray-600 hover:border-admin-primary"
                          >
                            {option.name || '—'}
                            <ChevronDown className="h-3 w-3" />
                          </button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent className="min-w-[180px]">
                          {(option.values || []).map((value, valueIndex) => {
                            if (!value?.value) return null;
                            const checked = variantFilters[index]?.has(value.value) ?? false;
                            return (
                              <DropdownMenuCheckboxItem
                                key={`${option.name || 'option'}-${value.value}-${valueIndex}`}
                                checked={checked}
                                onCheckedChange={() => toggleFilterValue(index, value.value)}
                              >
                                {value.value}
                              </DropdownMenuCheckboxItem>
                            );
                          })}
                        </DropdownMenuContent>
                      </DropdownMenu>
                    ))}
                    {Object.keys(variantFilters).length > 0 && (
                      <button
                        type="button"
                        onClick={clearFilters}
                        className="text-xs font-medium text-admin-primary hover:underline"
                      >
                        Xóa lọc
                      </button>
                    )}
                  </div>

                  <div className="rounded-lg border border-gray-200">
                    <div className="flex items-center justify-between border-b border-gray-100 px-4 py-3 text-sm">
                      <div className="flex items-center gap-3">
                        <input
                          type="checkbox"
                          checked={allFilteredSelected}
                          onChange={() => toggleSelectAllVariants(filteredVariantIndices)}
                          className="h-4 w-4 rounded border-gray-300"
                        />
                        <span className="font-medium text-gray-800">
                          {filteredVariantIndices.length} / {variantFields.length} phiên bản
                        </span>
                        {selectedCount > 0 && (
                          <span className="text-xs text-gray-500">
                            Đã chọn {selectedCount}
                          </span>
                        )}
                      </div>
                      {selectedCount > 0 && (
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button
                              type="button"
                              variant="outline"
                              className="h-8"
                            >
                              Chỉnh sửa
                              <ChevronDown className="ml-2 h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent className="min-w-[200px]">
                            <DropdownMenuItem onClick={() => openBulkEdit('price')}>
                              Chỉnh sửa giá
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => openBulkEdit('originalPrice')}>
                              Chỉnh sửa giá gốc
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => openBulkEdit('sku')}>
                              Chỉnh sửa SKU
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => openBulkEdit('stock')}>
                              Chỉnh sửa tồn kho
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      )}
                    </div>

                    {filteredVariantIndices.map((index) => {
                      const field = variantFields[index];
                      if (!field) return null;
                      const attributes =
                        variantsNormalized[index]?.attributeCombination || {};
                      const label = Object.values(attributes)
                        .map((value) => value.toLowerCase())
                        .join(' / ');
                      const price = variantsNormalized[index]?.price ?? 0;
                      const stock = variantsNormalized[index]?.stock ?? 0;
                      const imageUrl = variantsNormalized[index]?.imageUrl || '';
                      const isActive = variantsNormalized[index]?.isActive ?? true;

                      return (
                        <button
                          key={field.id}
                          type="button"
                          onClick={() => openVariantEditor(index)}
                          className={`flex w-full items-center gap-4 border-b border-gray-100 px-4 py-3 text-left hover:bg-gray-50 ${!isActive ? 'bg-gray-50/70 text-gray-400' : ''
                            }`}
                        >
                          <input
                            type="checkbox"
                            checked={selectedVariants.has(index)}
                            onChange={(event) => {
                              event.stopPropagation();
                              toggleVariantSelection(index);
                            }}
                            onClick={(event) => event.stopPropagation()}
                            className="h-4 w-4 rounded border-gray-300"
                          />
                          <div className="flex items-center gap-3 flex-1">
                            <div className="h-10 w-10 overflow-hidden rounded-md border border-gray-200 bg-gray-50">
                              {imageUrl ? (
                                <img
                                  src={getImageUrl(imageUrl)}
                                  alt={label || 'variant'}
                                  className={`h-full w-full object-cover ${!isActive ? 'opacity-60' : ''}`}
                                />
                              ) : (
                                <div className="flex h-full w-full items-center justify-center text-xs text-gray-400">
                                  —
                                </div>
                              )}
                            </div>
                            <div>
                              <p className="text-sm font-medium text-gray-900">
                                {label || '—'}
                              </p>
                              {!isActive && (
                                <p className="text-xs font-medium text-gray-400">
                                  Không hoạt động
                                </p>
                              )}
                            </div>
                          </div>
                          <div className={`text-right text-sm ${!isActive ? 'text-gray-400' : 'text-gray-700'}`}>
                            <p className="font-medium">Giá bán: {price}₫</p>
                            <p className="text-xs text-gray-500">Có thể bán {stock} tại 1 kho</p>
                          </div>
                        </button>
                      );
                    })}

                    <div className="flex items-center justify-between px-4 py-3 text-sm font-medium">
                      <span className="text-gray-700">Tổng tồn kho</span>
                      <span className="text-gray-900">
                        Có thể bán: {variantsNormalized.reduce((sum, variant) => sum + (variant.stock || 0), 0)}
                      </span>
                    </div>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Right Column - Sidebar */}
        <div className="space-y-6">
          {/* Product Images */}
          <Card>
            <CardHeader>
              <CardTitle>Hình ảnh sản phẩm</CardTitle>
              <CardDescription>
                Tải lên hình ảnh sản phẩm (JPG, PNG, WebP, GIF - Tối đa 5MB mỗi ảnh)
              </CardDescription>
            </CardHeader>
            <CardContent>
              {/* AI Generator Button */}
              <Button
                type="button"
                variant="outline"
                onClick={() => setShowAIGenerator(true)}
                className="w-full mb-4"
              >
                <Sparkles className="h-4 w-4 mr-2" />
                Tạo ảnh bằng AI
              </Button>

              <ProductImageGallery
                images={images}
                onImagesChange={handleImagesChange}
                onImageUpload={handleImageUpload}
                uploadingImages={uploadingImages}
              />

              {/* AI Generator Modal */}
              <AIImageGeneratorModal
                isOpen={showAIGenerator}
                onClose={() => setShowAIGenerator(false)}
                onImageSaved={handleAIImageSaved}
              />
            </CardContent>
          </Card>

          {/* Category */}
          <Card>
            <CardHeader>
              <CardTitle>Danh mục</CardTitle>
              <CardDescription>
                Chọn danh mục sản phẩm
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <Label htmlFor="categoryId">Danh mục (Tùy chọn)</Label>
                <select
                  id="categoryId"
                  {...register('categoryId', {
                    setValueAs: (value) => value === '' ? null : value,
                  })}
                  className="flex h-10 w-full rounded-md border border-gray-200 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                  disabled={loadingCategories}
                >
                  <option value="">Không có danh mục</option>
                  {categories.map((cat) => (
                    <option key={cat.id} value={cat.id}>
                      {cat.name}
                    </option>
                  ))}
                </select>
                {errors.categoryId && (
                  <p className="text-sm text-destructive">{errors.categoryId.message}</p>
                )}
                <p className="text-xs text-muted-foreground">
                  Sản phẩm có thể được lưu mà không cần chọn danh mục
                </p>
              </div>
            </CardContent>
          </Card>

          {/* SEO Settings */}
          <Card>
            <CardHeader>
              <CardTitle>Cài đặt SEO</CardTitle>
              <CardDescription>
                Thông tin meta cho công cụ tìm kiếm
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <div className="flex items-center space-x-2 mb-2">
                  <input
                    type="checkbox"
                    id="manual_slug_input"
                    checked={manualSlugInput}
                    onChange={(e) => handleManualInputChange(e.target.checked)}
                    className="h-4 w-4 rounded border-gray-300"
                  />
                  <Label htmlFor="manual_slug_input" className="font-normal cursor-pointer">
                    Tự nhập slug
                  </Label>
                </div>
                <Label htmlFor="slug">URL Slug</Label>
                <Controller
                  name="slug"
                  control={control}
                  rules={{
                    validate: async (value) => {
                      if (!value || value.trim() === '') return true;

                      try {
                        const result = await productsApi.checkSlugAvailability(
                          value.trim(),
                          mode === 'edit' ? product?.id : undefined
                        );
                        if (!result.available) {
                          return 'Slug này đã tồn tại. Vui lòng chọn slug khác.';
                        }
                        return true;
                      } catch (error) {
                        console.error('Error checking slug:', error);
                        return 'Không thể kiểm tra slug. Vui lòng thử lại.';
                      }
                    },
                  }}
                  render={({ field }) => (
                    <Input
                      id="slug"
                      {...field}
                      onChange={(e) => {
                        handleSlugChange(e);
                        field.onChange(e);
                      }}
                      placeholder="ten-san-pham"
                      disabled={!manualSlugInput}
                      className={!manualSlugInput ? 'bg-gray-50 cursor-not-allowed' : ''}
                    />
                  )}
                />
                {errors.slug && (
                  <p className="text-sm text-destructive">{errors.slug.message}</p>
                )}
                <p className="text-xs text-muted-foreground">
                  {manualSlugInput
                    ? 'Bạn có thể tự nhập slug theo ý muốn.'
                    : 'Slug sẽ tự động tạo từ tên sản phẩm khi bạn nhập tên.'}
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="meta_title">Tiêu đề Meta</Label>
                <Input
                  id="meta_title"
                  value={metaTitle}
                  onChange={(e) => setMetaTitle(e.target.value)}
                  placeholder="Tiêu đề meta sản phẩm"
                  maxLength={255}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="meta_description">Mô tả Meta</Label>
                <textarea
                  id="meta_description"
                  value={metaDescription}
                  onChange={(e) => setMetaDescription(e.target.value)}
                  placeholder="Mô tả meta sản phẩm"
                  rows={3}
                  maxLength={500}
                  className="flex min-h-[80px] w-full rounded-md border border-gray-200 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                />
              </div>
            </CardContent>
          </Card>

          {/* Specifications */}
          <Card>
            <CardHeader>
              <CardTitle>Thông số kỹ thuật</CardTitle>
              <CardDescription>
                Thêm thông số kỹ thuật sản phẩm (cặp khóa-giá trị)
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {Object.entries(specifications).map(([key, value], index) => (
                <div key={index} className="flex gap-2">
                  <Input
                    placeholder="Khóa"
                    value={key}
                    onChange={(e) => updateSpecification(key, e.target.value, value as string)}
                    className="flex-1"
                  />
                  <Input
                    placeholder="Giá trị"
                    value={value as string}
                    onChange={(e) => updateSpecification(key, key, e.target.value)}
                    className="flex-1"
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    onClick={() => removeSpecification(key)}
                    className="text-red-500 hover:text-red-700"
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              ))}
              <Button
                type="button"
                variant="outline"
                onClick={addSpecification}
                className="w-full"
              >
                <Plus className="h-4 w-4 mr-2" />
                Thêm thông số
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Submit Actions */}
      <div className="flex justify-end gap-4">
        <Link href="/admin/products">
          <Button type="button" variant="outline" disabled={loading}>
            Hủy
          </Button>
        </Link>
        <Button type="submit" disabled={loading || uploadingImages} className="bg-admin-primary hover:bg-admin-primary/80">
          {loading ? (
            <>
              <span className="mr-2">Đang lưu...</span>
              <span className="animate-spin">⏳</span>
            </>
          ) : (
            <>
              <Save className="h-4 w-4 mr-2" />
              {mode === 'create' ? 'Tạo sản phẩm' : 'Lưu thay đổi'}
            </>
          )}
        </Button>
      </div>

      <Dialog open={sortModalOpen} onOpenChange={setSortModalOpen}>
        <DialogContent className="max-w-3xl p-0">
          <DialogHeader className="border-b px-6 py-5 text-left">
            <DialogTitle className="text-xl font-semibold">
              Sắp xếp thuộc tính
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-6 px-6 py-5">
            <DndContext
              sensors={sensors}
              collisionDetection={closestCenter}
              onDragEnd={handleOptionDragEnd}
            >
              <SortableContext
                items={optionFields.map((field) => field.id)}
                strategy={verticalListSortingStrategy}
              >
                <div className="space-y-4">
                  {optionFields.map((field, index) => (
                    <SortableOptionPreview
                      key={field.id}
                      id={field.id}
                      name={options[index]?.name || ''}
                      values={options[index]?.values || []}
                    />
                  ))}
                </div>
              </SortableContext>
            </DndContext>
          </div>
          <DialogFooter className="border-t px-6 py-4">
            <Button type="button" variant="outline" onClick={() => setSortModalOpen(false)}>
              Hủy
            </Button>
            <Button type="button" className="bg-admin-primary hover:bg-admin-primary/80" onClick={() => setSortModalOpen(false)}>
              Xác nhận
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={variantEditIndex !== null} onOpenChange={(open) => !open && closeVariantEditor()}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Chỉnh sửa biến thể</DialogTitle>
          </DialogHeader>
          {variantEditState && (
            <div className="space-y-6">
              <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
                <div className="space-y-2">
                  <Label>Giá bán</Label>
                  <Input
                    type="number"
                    value={variantEditState.price}
                    onChange={(event) =>
                      setVariantEditState((prev) =>
                        prev
                          ? { ...prev, price: Number(event.target.value) || 0 }
                          : prev,
                      )
                    }
                  />
                </div>
                <div className="space-y-2">
                  <Label>Giá gốc</Label>
                  <Input
                    type="number"
                    value={variantEditState.originalPrice ?? ''}
                    onChange={(event) =>
                      setVariantEditState((prev) =>
                        prev
                          ? {
                            ...prev,
                            originalPrice:
                              event.target.value === ''
                                ? undefined
                                : Number(event.target.value) || 0,
                          }
                          : prev,
                      )
                    }
                  />
                </div>
                <div className="space-y-2">
                  <Label>Tồn kho</Label>
                  <Input
                    type="number"
                    value={variantEditState.stock}
                    onChange={(event) =>
                      setVariantEditState((prev) =>
                        prev
                          ? { ...prev, stock: Number(event.target.value) || 0 }
                          : prev,
                      )
                    }
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label>SKU</Label>
                  <Input
                    value={variantEditState.sku}
                    onChange={(event) =>
                      setVariantEditState((prev) =>
                        prev ? { ...prev, sku: event.target.value } : prev,
                      )
                    }
                    placeholder="SKU-001"
                  />
                </div>
                <div className="flex items-center gap-2 pt-6">
                  <input
                    type="checkbox"
                    checked={variantEditState.isActive}
                    onChange={(event) =>
                      setVariantEditState((prev) =>
                        prev ? { ...prev, isActive: event.target.checked } : prev,
                      )
                    }
                    className="h-4 w-4 rounded border-gray-300"
                  />
                  <span className="text-sm">Hiển thị biến thể</span>
                </div>
              </div>

              <div className="space-y-2">
                <Label>Ảnh biến thể (chọn 1 ảnh)</Label>
                <div className="flex flex-wrap gap-3">
                  {images.map((image) => (
                    <button
                      key={image.url}
                      type="button"
                      onClick={() =>
                        setVariantEditState((prev) =>
                          prev ? { ...prev, imageUrl: image.url } : prev,
                        )
                      }
                      className={`h-16 w-16 overflow-hidden rounded-md border ${variantEditState.imageUrl === image.url
                        ? 'border-admin-primary ring-2 ring-primary/20'
                        : 'border-gray-200'
                        }`}
                    >
                      <img src={image.url} alt="variant" className="h-full w-full object-cover" />
                    </button>
                  ))}
                  <label className="flex h-16 w-16 cursor-pointer items-center justify-center rounded-md border border-dashed border-gray-300 text-gray-500 hover:border-admin-primary hover:text-admin-primary">
                    <ImagePlus className="h-5 w-5" />
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleVariantImageUpload}
                      className="hidden"
                    />
                  </label>
                </div>
                {variantImageUploading && (
                  <p className="text-xs text-muted-foreground">Đang tải ảnh...</p>
                )}
                {variantEditState.imageUrl && (
                  <div className="mt-3 flex items-center gap-3 rounded-md border border-gray-200 p-3">
                    <img
                      src={variantEditState.imageUrl}
                      alt="variant preview"
                      className="h-12 w-12 rounded-md object-cover"
                    />
                    <span className="text-sm text-gray-600">Ảnh đang chọn</span>
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      onClick={() =>
                        setVariantEditState((prev) =>
                          prev ? { ...prev, imageUrl: '' } : prev,
                        )
                      }
                      className="ml-auto text-gray-400 hover:text-red-500"
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                )}
              </div>
            </div>
          )}
          <DialogFooter className="pt-4">
            <Button type="button" variant="outline" onClick={closeVariantEditor}>
              Hủy
            </Button>
            <Button type="button" className="bg-admin-primary hover:bg-admin-primary/80" onClick={saveVariantEditor}>
              Lưu thay đổi
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog
        open={bulkEditOpen}
        onOpenChange={(open) => {
          setBulkEditOpen(open);
          if (!open) {
            setBulkEditType(null);
            setBulkEditApplyValue('');
            setBulkEditValues({});
          }
        }}
      >
        <DialogContent className="max-w-3xl p-0">
          <DialogHeader className="border-b px-6 py-5 text-left">
            <DialogTitle className="text-xl font-semibold">
              {bulkEditType === 'price' && 'Chỉnh sửa giá'}
              {bulkEditType === 'originalPrice' && 'Chỉnh sửa giá gốc'}
              {bulkEditType === 'stock' && 'Chỉnh sửa tồn kho'}
              {bulkEditType === 'sku' && 'Chỉnh sửa SKU'}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-6 px-6 py-5">
            <div className="flex flex-col gap-3 md:flex-row md:items-center">
              <div className="flex-1 space-y-2">
                <Label>
                  {bulkEditType === 'sku'
                    ? 'Áp dụng một SKU cho tất cả phiên bản'
                    : bulkEditType === 'stock'
                      ? 'Áp dụng một tồn kho cho tất cả phiên bản'
                      : bulkEditType === 'originalPrice'
                        ? 'Áp dụng một giá gốc cho tất cả phiên bản'
                        : 'Áp dụng một giá cho tất cả phiên bản'}
                </Label>
                <Input
                  value={bulkEditApplyValue}
                  onChange={(event) => setBulkEditApplyValue(event.target.value)}
                  placeholder={bulkEditType === 'sku' ? 'SKU-001' : '0'}
                  type={bulkEditType === 'sku' ? 'text' : 'number'}
                />
              </div>
              <Button
                type="button"
                variant="outline"
                className="h-11"
                onClick={applyBulkEditAll}
              >
                Áp dụng cho tất cả
              </Button>
            </div>

            <div className="space-y-4">
              {Object.keys(bulkEditValues)
                .map((key) => Number(key))
                .sort((a, b) => a - b)
                .map((index) => {
                  const attributes = variantsNormalized[index]?.attributeCombination || {};
                  const label = Object.values(attributes)
                    .map((value) => value.toLowerCase())
                    .join(' / ');
                  return (
                    <div
                      key={`bulk-edit-${index}`}
                      className="flex items-center justify-between gap-4 border-b border-gray-100 pb-4"
                    >
                      <span className="text-sm font-medium text-gray-900">{label || '—'}</span>
                      <Input
                        value={bulkEditValues[index] ?? ''}
                        onChange={(event) =>
                          setBulkEditValues((prev) => ({
                            ...prev,
                            [index]: event.target.value,
                          }))
                        }
                        className="max-w-[160px]"
                        placeholder={bulkEditType === 'sku' ? 'SKU-001' : '0'}
                        type={bulkEditType === 'sku' ? 'text' : 'number'}
                      />
                    </div>
                  );
                })}
            </div>
          </div>
          <DialogFooter className="border-t px-6 py-4">
            <Button type="button" variant="outline" onClick={() => setBulkEditOpen(false)}>
              Hủy
            </Button>
            <Button
              type="button"
              className="bg-admin-primary hover:bg-admin-primary/80"
              onClick={saveBulkEdit}
            >
              Xác nhận
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </form>
  );
}
