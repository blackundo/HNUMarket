'use client';

import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Slider } from '@/components/ui/slider';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { LayoutConfig } from '@/lib/api/homepage-sections';

interface LayoutConfiguratorProps {
  config: LayoutConfig;
  onChange: (config: LayoutConfig) => void;
}

export function LayoutConfigurator({ config, onChange }: LayoutConfiguratorProps) {
  const updateConfig = (updates: Partial<LayoutConfig>) => {
    onChange({ ...config, ...updates });
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Cấu hình hiển thị</CardTitle>
        <CardDescription>Tùy chỉnh cách hiển thị sản phẩm</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Row Count */}
        <div className="space-y-2">
          <Label>Số hàng</Label>
          <Select
            value={String(config.row_count)}
            onValueChange={(value) => updateConfig({ row_count: Number(value) as 1 | 2 })}
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="1">1 hàng (ngang)</SelectItem>
              <SelectItem value="2">2 hàng (lưới + banner)</SelectItem>
            </SelectContent>
          </Select>
          <p className="text-xs text-muted-foreground">
            1 hàng: hiển thị ngang, 2 hàng: lưới với tùy chọn banner
          </p>
        </div>

        {/* Display Style */}
        <div className="space-y-2">
          <Label>Kiểu hiển thị</Label>
          <Select
            value={config.display_style}
            onValueChange={(value: 'slider' | 'grid' | 'carousel') =>
              updateConfig({ display_style: value })
            }
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="slider">Slider (cuộn ngang)</SelectItem>
              <SelectItem value="grid">Grid (lưới)</SelectItem>
              <SelectItem value="carousel">Carousel (tự động chuyển)</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Product Limit */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <Label>Số lượng sản phẩm</Label>
            <span className="text-sm font-medium">{config.product_limit}</span>
          </div>
          <Slider
            value={[config.product_limit]}
            onValueChange={(value) => updateConfig({ product_limit: value[0] })}
            min={4}
            max={24}
            step={1}
            className="w-full"
          />
          <p className="text-xs text-muted-foreground">Từ 4 đến 24 sản phẩm</p>
        </div>

        {/* Columns (for grid and carousel) */}
        {(config.display_style === 'grid' || config.display_style === 'carousel') && (
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label>
                {config.display_style === 'grid' ? 'Số cột (grid)' : 'Số slides hiển thị'}
              </Label>
              <span className="text-sm font-medium">{config.columns || 4}</span>
            </div>
            <Slider
              value={[config.columns || 4]}
              onValueChange={(value) => updateConfig({ columns: value[0] })}
              min={2}
              max={6}
              step={1}
              className="w-full"
            />
            <p className="text-xs text-muted-foreground">
              {config.display_style === 'grid'
                ? 'Từ 2 đến 6 cột'
                : 'Từ 2 đến 6 slides cùng lúc trên desktop'}
            </p>
          </div>
        )}

        {/* Autoplay Delay (for carousel only) */}
        {config.display_style === 'carousel' && (
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label>Tốc độ chuyển slide</Label>
              <span className="text-sm font-medium">{(config.autoplay_delay || 3000) / 1000}s</span>
            </div>
            <Slider
              value={[config.autoplay_delay || 3000]}
              onValueChange={(value) => updateConfig({ autoplay_delay: value[0] })}
              min={2000}
              max={10000}
              step={1000}
              className="w-full"
            />
            <p className="text-xs text-muted-foreground">Từ 2 đến 10 giây</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
