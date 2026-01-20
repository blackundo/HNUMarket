'use client';

import { useState, useEffect } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useRouter } from 'next/navigation';
import { createCategorySchema, type CreateCategoryInput } from '@/lib/validations/category';
import { categoriesApi, type Category } from '@/lib/api/categories';
import { uploadApi } from '@/lib/api/products';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import {
    Save,
    ArrowLeft,
    Upload,
    X,
    Loader2,
} from 'lucide-react';
import Link from 'next/link';
import { getImageUrl } from '@/lib/image';

interface CategoryFormProps {
    category?: Category;
    mode: 'create' | 'edit';
}

/**
 * Category Form Component
 *
 * Reusable form for creating and editing categories.
 * Includes image upload, parent category selection, and slug auto-generation.
 */
export function CategoryForm({ category, mode }: CategoryFormProps) {
    const router = useRouter();
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const [uploadingImage, setUploadingImage] = useState(false);
    const [imageUrl, setImageUrl] = useState(category?.image_url || '');
    const [parentCategories, setParentCategories] = useState<Category[]>([]);
    const [loadingParents, setLoadingParents] = useState(false);

    // Load parent categories (excluding current category if editing)
    useEffect(() => {
        const loadParentCategories = async () => {
            try {
                setLoadingParents(true);
                const response = await categoriesApi.getCategories({ limit: 100 });
                // Filter out current category and its children to prevent circular references
                const filtered = response.data.filter(
                    (cat) => cat.id !== category?.id && cat.parent_id !== category?.id
                );
                setParentCategories(filtered);
            } catch (err) {
                console.error('Failed to load parent categories:', err);
            } finally {
                setLoadingParents(false);
            }
        };
        loadParentCategories();
    }, [category?.id]);

    const {
        register,
        handleSubmit,
        formState: { errors },
        control,
        setValue,
        watch,
    } = useForm<CreateCategoryInput>({
        resolver: zodResolver(createCategorySchema),
        defaultValues: category
            ? {
                name: category.name,
                slug: category.slug,
                description: category.description || '',
                image_url: category.image_url || '',
                parent_id: category.parent_id || null,
                display_order: category.display_order ?? 0,
                is_active: category.is_active ?? true,
            }
            : {
                name: '',
                slug: '',
                description: '',
                image_url: '',
                parent_id: null,
                display_order: 0,
                is_active: true,
            },
    });

    const name = watch('name');

    // Auto-generate slug from name
    useEffect(() => {
        if (mode === 'create' && name) {
            const slug = name
                .toLowerCase()
                .normalize('NFD')
                .replace(/[\u0300-\u036f]/g, '') // Remove diacritics
                .replace(/[^a-z0-9]+/g, '-') // Replace non-alphanumeric with hyphens
                .replace(/^-+|-+$/g, ''); // Remove leading/trailing hyphens
            setValue('slug', slug);
        }
    }, [name, mode, setValue]);

    // Handle image upload
    const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        setUploadingImage(true);
        try {
            const { url } = await uploadApi.uploadFile(file);
            setImageUrl(url);
            setValue('image_url', url);
        } catch (err) {
            console.error('Upload failed:', err);
            setError('Không thể tải lên hình ảnh');
        } finally {
            setUploadingImage(false);
        }
    };

    // Transform form data to backend format (camelCase)
    const transformToBackendFormat = (data: CreateCategoryInput) => {
        const transformed: any = {
            name: data.name,
            slug: data.slug,
        };

        if (data.description !== undefined && data.description !== '') {
            transformed.description = data.description;
        }

        // For imageUrl: include if it has a value
        // If editing and imageUrl is empty, send empty string to remove the image
        if (imageUrl) {
            transformed.imageUrl = imageUrl;
        } else if (mode === 'edit' && category?.image_url) {
            // If editing and original had an image but now it's empty, send empty to remove it
            transformed.imageUrl = '';
        }

        if (data.parent_id !== undefined) {
            transformed.parentId = data.parent_id;
        }

        if (data.display_order !== undefined) {
            transformed.displayOrder = data.display_order;
        }

        if (data.is_active !== undefined) {
            transformed.isActive = data.is_active;
        }

        return transformed;
    };

    const onSubmit = async (data: CreateCategoryInput) => {
        setLoading(true);
        setError('');

        try {
            // Transform snake_case to camelCase for backend
            const payload = transformToBackendFormat(data);

            if (category) {
                await categoriesApi.updateCategory(category.id, payload);
            } else {
                await categoriesApi.createCategory(payload);
            }

            router.push('/admin/categories');
            router.refresh();
        } catch (err) {
            console.error('Save failed:', err);
            setError(err instanceof Error ? err.message : 'Không thể lưu danh mục');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight font-heading">
                        {mode === 'create' ? 'Thêm danh mục mới' : 'Sửa danh mục'}
                    </h1>
                    <p className="text-muted-foreground mt-1 font-body">
                        {mode === 'create'
                            ? 'Tạo danh mục sản phẩm mới cho cửa hàng'
                            : 'Cập nhật thông tin danh mục'}
                    </p>
                </div>
                <Link href="/admin/categories">
                    <Button variant="outline">
                        <ArrowLeft className="h-4 w-4 mr-2" />
                        Quay lại
                    </Button>
                </Link>
            </div>

            {/* Error Alert */}
            {error && (
                <Alert variant="destructive">
                    <AlertDescription>{error}</AlertDescription>
                </Alert>
            )}

            <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    {/* Left Column - Main Info */}
                    <div className="lg:col-span-2 space-y-6">
                        <Card>
                            <CardHeader>
                                <CardTitle className="font-heading">Thông tin cơ bản</CardTitle>
                                <CardDescription className="font-body">
                                    Tên, mô tả và slug của danh mục
                                </CardDescription>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                <div>
                                    <Label htmlFor="name" className="font-heading">
                                        Tên danh mục *
                                    </Label>
                                    <Input
                                        id="name"
                                        {...register('name')}
                                        placeholder="Ví dụ: Điện thoại"
                                        className="mt-1"
                                    />
                                    {errors.name && (
                                        <p className="mt-1 text-sm text-destructive font-body">
                                            {errors.name.message}
                                        </p>
                                    )}
                                </div>

                                <div>
                                    <Label htmlFor="slug" className="font-heading">
                                        Slug *
                                    </Label>
                                    <Input
                                        id="slug"
                                        {...register('slug')}
                                        placeholder="dien-thoai"
                                        className="mt-1 font-mono"
                                    />
                                    {errors.slug && (
                                        <p className="mt-1 text-sm text-destructive font-body">
                                            {errors.slug.message}
                                        </p>
                                    )}
                                    <p className="mt-1 text-xs text-muted-foreground font-body">
                                        URL-friendly identifier (tự động tạo từ tên)
                                    </p>
                                </div>

                                <div>
                                    <Label htmlFor="description" className="font-heading">
                                        Mô tả
                                    </Label>
                                    <textarea
                                        id="description"
                                        {...register('description')}
                                        rows={4}
                                        placeholder="Mô tả ngắn về danh mục này..."
                                        className="mt-1 flex min-h-[80px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 font-body"
                                    />
                                    {errors.description && (
                                        <p className="mt-1 text-sm text-destructive font-body">
                                            {errors.description.message}
                                        </p>
                                    )}
                                </div>
                            </CardContent>
                        </Card>
                    </div>

                    {/* Right Column - Settings */}
                    <div className="space-y-6">
                        <Card>
                            <CardHeader>
                                <CardTitle className="font-heading">Cài đặt</CardTitle>
                                <CardDescription className="font-body">
                                    Hình ảnh, phân cấp và trạng thái
                                </CardDescription>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                {/* Image Upload */}
                                <div>
                                    <Label className="font-heading">Hình ảnh danh mục</Label>
                                    {imageUrl ? (
                                        <div className="mt-2 relative inline-block">
                                            <img
                                                src={getImageUrl(imageUrl)}
                                                alt="Category"
                                                className="h-32 w-full rounded object-cover"
                                            />
                                            <button
                                                type="button"
                                                onClick={() => {
                                                    setImageUrl('');
                                                    setValue('image_url', '');
                                                }}
                                                className="absolute -top-2 -right-2 bg-destructive text-destructive-foreground rounded-full p-1 hover:bg-destructive/90"
                                            >
                                                <X className="h-3 w-3" />
                                            </button>
                                        </div>
                                    ) : (
                                        <label className="mt-2 inline-flex items-center gap-2 px-4 py-2 border border-dashed rounded-lg cursor-pointer hover:border-admin-primary transition-colors">
                                            {uploadingImage ? (
                                                <Loader2 className="h-4 w-4 animate-spin" />
                                            ) : (
                                                <Upload className="h-4 w-4" />
                                            )}
                                            <span className="text-sm font-body">
                                                {uploadingImage ? 'Đang tải...' : 'Tải lên hình ảnh'}
                                            </span>
                                            <input
                                                type="file"
                                                accept="image/*"
                                                onChange={handleImageUpload}
                                                className="hidden"
                                                disabled={uploadingImage}
                                            />
                                        </label>
                                    )}
                                    {errors.image_url && (
                                        <p className="mt-1 text-sm text-destructive font-body">
                                            {errors.image_url.message}
                                        </p>
                                    )}
                                </div>

                                {/* Parent Category */}
                                <div>
                                    <Label htmlFor="parent_id" className="font-heading">
                                        Danh mục cha
                                    </Label>
                                    <Controller
                                        name="parent_id"
                                        control={control}
                                        render={({ field }) => (
                                            <select
                                                id="parent_id"
                                                {...field}
                                                value={field.value || ''}
                                                onChange={(e) => field.onChange(e.target.value || null)}
                                                className="mt-1 flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 font-body"
                                                disabled={loadingParents}
                                            >
                                                <option value="">Không có (danh mục gốc)</option>
                                                {parentCategories.map((cat) => (
                                                    <option key={cat.id} value={cat.id}>
                                                        {cat.name}
                                                    </option>
                                                ))}
                                            </select>
                                        )}
                                    />
                                    {errors.parent_id && (
                                        <p className="mt-1 text-sm text-destructive font-body">
                                            {errors.parent_id.message}
                                        </p>
                                    )}
                                </div>

                                {/* Display Order */}
                                <div>
                                    <Label htmlFor="display_order" className="font-heading">
                                        Thứ tự hiển thị
                                    </Label>
                                    <Input
                                        id="display_order"
                                        type="number"
                                        {...register('display_order', { valueAsNumber: true })}
                                        min={0}
                                        className="mt-1"
                                    />
                                    {errors.display_order && (
                                        <p className="mt-1 text-sm text-destructive font-body">
                                            {errors.display_order.message}
                                        </p>
                                    )}
                                    <p className="mt-1 text-xs text-muted-foreground font-body">
                                        Số nhỏ hơn sẽ hiển thị trước
                                    </p>
                                </div>

                                {/* Active Status */}
                                <div className="flex items-center space-x-2">
                                    <input
                                        type="checkbox"
                                        id="is_active"
                                        {...register('is_active')}
                                        className="h-4 w-4 rounded border-gray-300 text-admin-primary focus:ring-primary"
                                    />
                                    <Label htmlFor="is_active" className="font-heading cursor-pointer">
                                        Kích hoạt danh mục
                                    </Label>
                                </div>
                            </CardContent>
                        </Card>
                    </div>
                </div>

                {/* Actions */}
                <div className="flex justify-end gap-4">
                    <Link href="/admin/categories">
                        <Button type="button" variant="outline">
                            Hủy
                        </Button>
                    </Link>
                    <Button type="submit" disabled={loading} className="bg-admin-primary text-white hover:bg-admin-primary/80">
                        {loading && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                        {mode === 'create' ? 'Tạo danh mục' : 'Cập nhật'}
                    </Button>
                </div>
            </form>
        </div>
    );
}

