'use client';

import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Slider } from '@/components/ui/slider';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { BannerConfig } from '@/lib/api/homepage-sections';
import { ImageIcon } from 'lucide-react';
import { getImageUrl } from '@/lib/image';

interface BannerUploaderProps {
  config: BannerConfig | undefined;
  onChange: (config: BannerConfig) => void;
  disabled?: boolean;
}

export function BannerUploader({ config, onChange, disabled }: BannerUploaderProps) {
  const bannerConfig: BannerConfig = config || {
    enabled: false,
    image_url: '',
    link_url: '',
    alt_text: '',
    position: 'right',
    width_ratio: 30,
  };
  const placeholderUrl = '/images/banner-placeholder-2rows.svg';
  const isPlaceholderActive = bannerConfig.image_url === placeholderUrl;

  const updateConfig = (updates: Partial<BannerConfig>) => {
    onChange({ ...bannerConfig, ...updates });
  };

  if (disabled) {
    return (
      <Card className="opacity-50">
        <CardHeader>
          <CardTitle className="text-base">Banner</CardTitle>
          <CardDescription>Chỉ khả dụng với chế độ 2 hàng</CardDescription>
        </CardHeader>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="text-base">Banner</CardTitle>
            <CardDescription>Thêm banner bên cạnh lưới sản phẩm</CardDescription>
          </div>
          <Switch
            checked={bannerConfig.enabled}
            onCheckedChange={(enabled) => updateConfig({ enabled })}
          />
        </div>
      </CardHeader>
      {bannerConfig.enabled && (
        <CardContent className="space-y-4">
          {/* Image URL */}
          <div className="space-y-2">
            <Label>URL hình ảnh</Label>
            <Input
              type="url"
              placeholder="https://example.com/banner.jpg"
              value={bannerConfig.image_url || ''}
              onChange={(e) => updateConfig({ image_url: e.target.value })}
            />
            {bannerConfig.image_url && (
              <div className="mt-2 aspect-[1/2] max-w-xs rounded overflow-hidden bg-muted">
                <img
                  src={getImageUrl(bannerConfig.image_url)}
                  alt="Banner preview"
                  className="w-full h-full object-cover"
                  onError={(e) => {
                    e.currentTarget.src = '';
                    e.currentTarget.style.display = 'none';
                  }}
                />
              </div>
            )}
          </div>

          {/* Placeholder */}
          <div className="space-y-2">
            <Label>Placeholder (kích thước 2 hàng)</Label>
            <div className="flex flex-wrap items-center gap-2">
              <Button
                type="button"
                variant={isPlaceholderActive ? 'secondary' : 'outline'}
                size="sm"
                onClick={() => updateConfig({ image_url: placeholderUrl })}
              >
                Dùng placeholder 600 x 1200
              </Button>
              {isPlaceholderActive && (
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => updateConfig({ image_url: '' })}
                >
                  Xóa placeholder
                </Button>
              )}
            </div>
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <ImageIcon className="h-4 w-4" />
              <span>Kích thước gợi ý cho banner ngang 2 hàng sản phẩm.</span>
            </div>
          </div>

          {/* Link URL */}
          <div className="space-y-2">
            <Label>Liên kết (tùy chọn)</Label>
            <Input
              type="url"
              placeholder="/products/san-pham-abc"
              value={bannerConfig.link_url || ''}
              onChange={(e) => updateConfig({ link_url: e.target.value })}
            />
            <p className="text-xs text-muted-foreground">Điều hướng khi click banner</p>
          </div>

          {/* Alt Text */}
          <div className="space-y-2">
            <Label>Mô tả (alt text)</Label>
            <Input
              placeholder="Khuyến mãi đặc biệt"
              value={bannerConfig.alt_text || ''}
              onChange={(e) => updateConfig({ alt_text: e.target.value })}
            />
            <p className="text-xs text-muted-foreground">Cho SEO và accessibility</p>
          </div>

          {/* Position */}
          <div className="space-y-2">
            <Label>Vị trí</Label>
            <Select
              value={bannerConfig.position || 'right'}
              onValueChange={(value: 'left' | 'right') => updateConfig({ position: value })}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="left">Bên trái</SelectItem>
                <SelectItem value="right">Bên phải</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Width Ratio */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label>Độ rộng (%)</Label>
              <span className="text-sm font-medium">{bannerConfig.width_ratio || 30}%</span>
            </div>
            <Slider
              value={[bannerConfig.width_ratio || 30]}
              onValueChange={(value) => updateConfig({ width_ratio: value[0] })}
              min={10}
              max={50}
              step={5}
              className="w-full"
            />
            <p className="text-xs text-muted-foreground">
              Tỷ lệ chiều rộng banner so với toàn bộ phần
            </p>
          </div>
        </CardContent>
      )}
    </Card>
  );
}
