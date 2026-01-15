'use client';

import { useState, useRef, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useRouter } from 'next/navigation';
import { createHeroSlideSchema, type CreateHeroSlideInput } from '@/lib/validations/hero-slide';
import { heroSlidesApi, type HeroSlide } from '@/lib/api/hero-slides';
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

interface HeroSlideFormProps {
    heroSlide?: HeroSlide;
    mode: 'create' | 'edit';
}

const GRADIENT_OPTIONS = [
    { value: 'from-rose-500 to-pink-600', label: 'Hồng', preview: 'bg-gradient-to-br from-rose-500 to-pink-600' },
    { value: 'from-orange-500 to-amber-600', label: 'Cam', preview: 'bg-gradient-to-br from-orange-500 to-amber-600' },
    { value: 'from-emerald-500 to-teal-600', label: 'Xanh lá', preview: 'bg-gradient-to-br from-emerald-500 to-teal-600' },
    { value: 'from-blue-500 to-indigo-600', label: 'Xanh dương', preview: 'bg-gradient-to-br from-blue-500 to-indigo-600' },
    { value: 'from-purple-500 to-violet-600', label: 'Tím', preview: 'bg-gradient-to-br from-purple-500 to-violet-600' },
    { value: 'from-red-500 to-rose-600', label: 'Đỏ', preview: 'bg-gradient-to-br from-red-500 to-rose-600' },
    { value: 'from-yellow-500 to-orange-600', label: 'Vàng', preview: 'bg-gradient-to-br from-yellow-500 to-orange-600' },
    { value: 'from-green-500 to-emerald-600', label: 'Xanh ngọc', preview: 'bg-gradient-to-br from-green-500 to-emerald-600' },
];

/**
 * Hero Slide Form Component
 *
 * Reusable form for creating and editing hero slides.
 * Includes image upload with 16:9 ratio, gradient selection, and link input.
 */
export function HeroSlideForm({ heroSlide, mode }: HeroSlideFormProps) {
    const router = useRouter();
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const [uploadingImage, setUploadingImage] = useState(false);
    const [imageUrl, setImageUrl] = useState(heroSlide?.image_url || '');
    const [loadingOrder, setLoadingOrder] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const {
        register,
        handleSubmit,
        formState: { errors },
        setValue,
        watch,
    } = useForm<CreateHeroSlideInput>({
        resolver: zodResolver(createHeroSlideSchema),
        defaultValues: heroSlide
            ? {
                title: heroSlide.title,
                subtitle: heroSlide.subtitle || '',
                imageUrl: heroSlide.image_url || '',
                gradient: heroSlide.gradient || GRADIENT_OPTIONS[0].value,
                link: heroSlide.link,
                displayOrder: heroSlide.display_order ?? 0,
                isActive: heroSlide.is_active ?? true,
            }
            : {
                title: '',
                subtitle: '',
                imageUrl: '',
                gradient: GRADIENT_OPTIONS[0].value,
                link: '#',
                displayOrder: 0,
                isActive: true,
            },
    });

    const selectedGradient = watch('gradient');

    // Auto-calculate next display order for new slides
    useEffect(() => {
        if (mode === 'create') {
            const fetchNextOrder = async () => {
                try {
                    setLoadingOrder(true);
                    const { data } = await heroSlidesApi.getHeroSlides({ limit: 1, sortBy: 'display_order', sortOrder: 'desc' });
                    const nextOrder = data.length > 0 ? (data[0].display_order ?? 0) + 1 : 0;
                    setValue('displayOrder', nextOrder);
                } catch (err) {
                    console.error('Failed to fetch next order:', err);
                    setValue('displayOrder', 0);
                } finally {
                    setLoadingOrder(false);
                }
            };
            fetchNextOrder();
        }
    }, [mode, setValue]);

    // Handle image upload with 16:9 ratio validation
    const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        // Validate image dimensions (16:9 ratio)
        const img = new Image();
        const objectUrl = URL.createObjectURL(file);

        img.onload = async () => {
            const ratio = img.width / img.height;
            const target16x9 = 16 / 9;
            const tolerance = 0.1;

            if (Math.abs(ratio - target16x9) > tolerance) {
                setError(`Vui lòng chọn hình ảnh có tỷ lệ 16:9 (hiện tại: ${img.width}x${img.height})`);
                URL.revokeObjectURL(objectUrl);
                if (fileInputRef.current) {
                    fileInputRef.current.value = '';
                }
                return;
            }

            URL.revokeObjectURL(objectUrl);
            setUploadingImage(true);
            setError('');

            try {
                const { url } = await uploadApi.uploadFile(file);
                setImageUrl(url);
                setValue('imageUrl', url);
            } catch (err) {
                console.error('Upload failed:', err);
                setError('Không thể tải lên hình ảnh');
            } finally {
                setUploadingImage(false);
            }
        };

        img.onerror = () => {
            setError('Không thể đọc file hình ảnh');
            URL.revokeObjectURL(objectUrl);
        };

        img.src = objectUrl;
    };

    const onSubmit = async (data: CreateHeroSlideInput) => {
        setLoading(true);
        setError('');

        try {
            if (heroSlide) {
                await heroSlidesApi.updateHeroSlide(heroSlide.id, data);
            } else {
                await heroSlidesApi.createHeroSlide(data);
            }

            router.push('/admin/hero-slides');
            router.refresh();
        } catch (err) {
            console.error('Save failed:', err);
            setError(err instanceof Error ? err.message : 'Không thể lưu slide');
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
                        {mode === 'create' ? 'Thêm slide mới' : 'Sửa slide'}
                    </h1>
                    <p className="text-muted-foreground mt-1 font-body">
                        {mode === 'create'
                            ? 'Tạo slide banner mới cho trang chủ'
                            : 'Cập nhật thông tin slide'}
                    </p>
                </div>
                <Link href="/admin/hero-slides">
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
                                <CardTitle className="font-heading">Nội dung slide</CardTitle>
                                <CardDescription className="font-body">
                                    Tiêu đề, phụ đề và liên kết của slide
                                </CardDescription>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                <div>
                                    <Label htmlFor="title" className="font-heading">
                                        Tiêu đề *
                                    </Label>
                                    <Input
                                        id="title"
                                        {...register('title')}
                                        placeholder="Ví dụ: Khuyến Mãi Mùa Hè"
                                        className="mt-1"
                                    />
                                    {errors.title && (
                                        <p className="mt-1 text-sm text-destructive font-body">
                                            {errors.title.message}
                                        </p>
                                    )}
                                </div>

                                <div>
                                    <Label htmlFor="subtitle" className="font-heading">
                                        Phụ đề
                                    </Label>
                                    <Input
                                        id="subtitle"
                                        {...register('subtitle')}
                                        placeholder="Ví dụ: Giảm đến 50%"
                                        className="mt-1"
                                    />
                                    {errors.subtitle && (
                                        <p className="mt-1 text-sm text-destructive font-body">
                                            {errors.subtitle.message}
                                        </p>
                                    )}
                                </div>

                                <div>
                                    <Label htmlFor="link" className="font-heading">
                                        Liên kết *
                                    </Label>
                                    <Input
                                        id="link"
                                        {...register('link')}
                                        placeholder="/products hoặc # (không có link)"
                                        className="mt-1 font-mono"
                                    />
                                    {errors.link && (
                                        <p className="mt-1 text-sm text-destructive font-body">
                                            {errors.link.message}
                                        </p>
                                    )}
                                    <p className="mt-1 text-xs text-muted-foreground font-body">
                                        Đường dẫn khi click slide. Dùng "#" để vô hiệu hóa link
                                    </p>
                                </div>
                            </CardContent>
                        </Card>

                        {/* Preview */}
                        <Card>
                            <CardHeader>
                                <CardTitle className="font-heading">Xem trước</CardTitle>
                                <CardDescription className="font-body">
                                    Slide sẽ hiển thị như thế này
                                </CardDescription>
                            </CardHeader>
                            <CardContent>
                                <div
                                    className={`relative aspect-[16/9] rounded-xl overflow-hidden shadow-md bg-gradient-to-br ${selectedGradient || GRADIENT_OPTIONS[0].value}`}
                                >
                                    {imageUrl && (
                                        <img
                                            src={imageUrl}
                                            alt={watch('title') || 'Preview'}
                                            className="absolute inset-0 w-full h-full object-cover"
                                        />
                                    )}
                                    {!imageUrl && (
                                        <div className="absolute inset-0 opacity-20">
                                            <div className="absolute top-4 right-4 w-16 h-16 border-2 border-white/50 rounded-full" />
                                            <div className="absolute bottom-6 left-6 w-10 h-10 border-2 border-white/30 rounded-full" />
                                        </div>
                                    )}
                                    {/* Only show title/subtitle if no image */}
                                    {!imageUrl && (
                                        <div className="absolute inset-0 flex flex-col justify-center px-6">
                                            <h3 className="text-white font-bold text-2xl drop-shadow-lg mb-2">
                                                {watch('title') || 'Tiêu đề slide'}
                                            </h3>
                                            <p className="text-white/90 text-lg drop-shadow">
                                                {watch('subtitle') || 'Phụ đề'}
                                            </p>
                                        </div>
                                    )}
                                </div>
                            </CardContent>
                        </Card>
                    </div>

                    {/* Right Column - Settings */}
                    <div className="space-y-6">
                        <Card>
                            <CardHeader>
                                <CardTitle className="font-heading">Hình ảnh & Màu</CardTitle>
                                <CardDescription className="font-body">
                                    Tải lên hình ảnh 16:9 hoặc chọn gradient
                                </CardDescription>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                {/* Image Upload */}
                                <div>
                                    <Label className="font-heading">Hình ảnh (16:9)</Label>
                                    {imageUrl ? (
                                        <div className="mt-2 relative">
                                            <img
                                                src={imageUrl}
                                                alt="Slide"
                                                className="aspect-[16/9] w-full rounded object-cover"
                                            />
                                            <button
                                                type="button"
                                                onClick={() => {
                                                    setImageUrl('');
                                                    setValue('imageUrl', '');
                                                }}
                                                className="absolute -top-2 -right-2 bg-destructive text-destructive-foreground rounded-full p-1 hover:bg-destructive/90"
                                            >
                                                <X className="h-3 w-3" />
                                            </button>
                                        </div>
                                    ) : (
                                        <label className="mt-2 inline-flex items-center gap-2 px-4 py-2 border border-dashed rounded-lg cursor-pointer hover:border-admin-primary transition-colors w-full justify-center">
                                            {uploadingImage ? (
                                                <Loader2 className="h-4 w-4 animate-spin" />
                                            ) : (
                                                <Upload className="h-4 w-4" />
                                            )}
                                            <span className="text-sm font-body">
                                                {uploadingImage ? 'Đang tải...' : 'Tải lên hình ảnh'}
                                            </span>
                                            <input
                                                ref={fileInputRef}
                                                type="file"
                                                accept="image/*"
                                                onChange={handleImageUpload}
                                                className="hidden"
                                                disabled={uploadingImage}
                                            />
                                        </label>
                                    )}
                                    <p className="mt-1 text-xs text-muted-foreground font-body">
                                        Tỷ lệ 16:9 (Ví dụ: 1920x1080, 1600x900)
                                    </p>
                                </div>

                                {/* Gradient Selection */}
                                <div>
                                    <Label htmlFor="gradient" className="font-heading">
                                        Gradient màu nền
                                    </Label>
                                    <div className="mt-2 grid grid-cols-2 gap-2">
                                        {GRADIENT_OPTIONS.map((option) => (
                                            <button
                                                key={option.value}
                                                type="button"
                                                onClick={() => setValue('gradient', option.value)}
                                                className={`
                                                    relative aspect-[16/9] rounded-lg overflow-hidden border-2 transition-all
                                                    ${selectedGradient === option.value ? 'border-admin-primary ring-2 ring-primary' : 'border-transparent'}
                                                `}
                                            >
                                                <div className={`w-full h-full ${option.preview}`} />
                                                <div className="absolute inset-0 flex items-center justify-center">
                                                    <span className="text-white text-xs font-semibold drop-shadow-md">
                                                        {option.label}
                                                    </span>
                                                </div>
                                            </button>
                                        ))}
                                    </div>
                                    <p className="mt-1 text-xs text-muted-foreground font-body">
                                        Gradient sẽ hiển thị khi không có hình ảnh
                                    </p>
                                </div>

                                {/* Display Order */}
                                <div>
                                    <Label htmlFor="displayOrder" className="font-heading">
                                        Thứ tự hiển thị
                                        {loadingOrder && mode === 'create' && (
                                            <span className="ml-2 text-xs text-muted-foreground">(Đang tính...)</span>
                                        )}
                                    </Label>
                                    <Input
                                        id="displayOrder"
                                        type="number"
                                        {...register('displayOrder', { valueAsNumber: true })}
                                        min={0}
                                        className="mt-1"
                                        disabled={loadingOrder && mode === 'create'}
                                    />
                                    {errors.displayOrder && (
                                        <p className="mt-1 text-sm text-destructive font-body">
                                            {errors.displayOrder.message}
                                        </p>
                                    )}
                                    <p className="mt-1 text-xs text-muted-foreground font-body">
                                        {mode === 'create' ? 'Tự động tính thứ tự tiếp theo' : 'Số nhỏ hơn sẽ hiển thị trước'}
                                    </p>
                                </div>

                                {/* Active Status */}
                                <div className="flex items-center space-x-2">
                                    <input
                                        type="checkbox"
                                        id="isActive"
                                        {...register('isActive')}
                                        className="h-4 w-4 rounded border-gray-300 text-admin-primary focus:ring-primary"
                                    />
                                    <Label htmlFor="isActive" className="font-heading cursor-pointer">
                                        Kích hoạt slide
                                    </Label>
                                </div>
                            </CardContent>
                        </Card>
                    </div>
                </div>

                {/* Actions */}
                <div className="flex justify-end gap-4">
                    <Link href="/admin/hero-slides">
                        <Button type="button" variant="outline">
                            Hủy
                        </Button>
                    </Link>
                    <Button type="submit" disabled={loading}>
                        {loading && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                        <Save className="h-4 w-4 mr-2" />
                        {mode === 'create' ? 'Tạo slide' : 'Cập nhật'}
                    </Button>
                </div>
            </form>
        </div>
    );
}
