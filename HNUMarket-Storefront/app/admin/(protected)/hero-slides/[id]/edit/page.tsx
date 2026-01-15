'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { HeroSlideForm } from '@/components/admin/hero-slides/hero-slide-form';
import { heroSlidesApi, type HeroSlide } from '@/lib/api/hero-slides';
import { Loader2 } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';

/**
 * Edit Hero Slide Page
 *
 * Admin page for editing an existing hero slide.
 *
 * @route /admin/hero-slides/[id]/edit
 */
export default function EditHeroSlidePage() {
  const params = useParams();
  const id = params?.id as string;
  const [slide, setSlide] = useState<HeroSlide | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchSlide = async () => {
      try {
        setLoading(true);
        const data = await heroSlidesApi.getHeroSlide(id);
        setSlide(data);
      } catch (err) {
        console.error('Failed to fetch slide:', err);
        setError(err instanceof Error ? err.message : 'Không thể tải thông tin slide');
      } finally {
        setLoading(false);
      }
    };

    if (id) {
      fetchSlide();
    }
  }, [id]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (error || !slide) {
    return (
      <div className="space-y-6">
        <h1 className="text-3xl font-bold tracking-tight">Lỗi</h1>
        <Alert variant="destructive">
          <AlertDescription>{error || 'Không tìm thấy slide'}</AlertDescription>
        </Alert>
      </div>
    );
  }

  return <HeroSlideForm mode="edit" heroSlide={slide} />;
}
