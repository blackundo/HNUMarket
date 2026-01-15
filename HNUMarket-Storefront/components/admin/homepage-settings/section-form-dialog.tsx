'use client';

import { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Loader2 } from 'lucide-react';
import {
  HomepageSection,
  HomepageSectionConfig,
  homepageSectionsApi,
} from '@/lib/api/homepage-sections';
import { categoriesApi } from '@/lib/api/categories';
import { LayoutConfigurator } from './layout-configurator';
import { ProductPicker } from './product-picker';
import { BannerUploader } from './banner-uploader';

interface Category {
  id: string;
  name: string;
  slug: string;
}

interface SectionFormDialogProps {
  open: boolean;
  onClose: () => void;
  onSuccess: () => void;
  section: HomepageSection | null;
}

export function SectionFormDialog({ open, onClose, onSuccess, section }: SectionFormDialogProps) {
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Form state
  const [categoryId, setCategoryId] = useState<string>('');
  const [displayOrder, setDisplayOrder] = useState<number>(0);
  const [isActive, setIsActive] = useState<boolean>(true);
  const [config, setConfig] = useState<HomepageSectionConfig>({
    layout: {
      row_count: 1,
      display_style: 'slider',
      product_limit: 8,
      columns: 4,
    },
    products: {
      selected_product_ids: [],
      auto_fill: {
        enabled: true,
        criteria: 'newest',
        exclude_out_of_stock: true,
      },
    },
    banner: {
      enabled: false,
      image_url: '',
      link_url: '',
      alt_text: '',
      position: 'right',
      width_ratio: 30,
    },
    display: {
      show_category_header: true,
      custom_title: '',
      show_view_all_link: true,
      animation: 'fade',
    },
  });

  // Load categories
  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const response = await categoriesApi.getCategories({ page: 1, limit: 100 });
        setCategories(response.data || []);
      } catch (error) {
        console.error('Failed to fetch categories:', error);
      }
    };

    if (open) {
      fetchCategories();
    }
  }, [open]);

  // Initialize form with section data
  useEffect(() => {
    if (section) {
      setCategoryId(section.category_id);
      setDisplayOrder(section.display_order);
      setIsActive(section.is_active);
      setConfig(section.config);
    } else {
      // Reset form for new section
      setCategoryId('');
      setDisplayOrder(0);
      setIsActive(true);
      setConfig({
        layout: {
          row_count: 1,
          display_style: 'slider',
          product_limit: 8,
          columns: 4,
        },
        products: {
          selected_product_ids: [],
          auto_fill: {
            enabled: true,
            criteria: 'newest',
            exclude_out_of_stock: true,
          },
        },
        banner: {
          enabled: false,
          image_url: '',
          link_url: '',
          alt_text: '',
          position: 'right',
          width_ratio: 30,
        },
        display: {
          show_category_header: true,
          custom_title: '',
          show_view_all_link: true,
          animation: 'fade',
        },
      });
    }
    setError(null);
  }, [section, open]);

  const handleSubmit = async () => {
    if (!categoryId) {
      setError('Vui lòng chọn danh mục');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const data = {
        categoryId,
        displayOrder,
        isActive,
        config,
      };

      if (section) {
        await homepageSectionsApi.updateHomepageSection(section.id, data);
      } else {
        await homepageSectionsApi.createHomepageSection(data);
      }

      onSuccess();
    } catch (error) {
      setError(error instanceof Error ? error.message : 'Đã xảy ra lỗi');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{section ? 'Chỉnh sửa phần' : 'Thêm phần mới'}</DialogTitle>
          <DialogDescription>
            {section
              ? 'Cập nhật cấu hình phần hiển thị sản phẩm'
              : 'Tạo phần mới để hiển thị sản phẩm trên trang chủ'}
          </DialogDescription>
        </DialogHeader>

        {error && (
          <Alert variant="destructive">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        <div className="space-y-6">
          {/* Basic Settings */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Danh mục *</Label>
              <Select value={categoryId} onValueChange={setCategoryId}>
                <SelectTrigger>
                  <SelectValue placeholder="Chọn danh mục" />
                </SelectTrigger>
                <SelectContent>
                  {categories.map((cat) => (
                    <SelectItem key={cat.id} value={cat.id}>
                      {cat.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Thứ tự hiển thị</Label>
              <Input
                type="number"
                min={0}
                value={displayOrder}
                onChange={(e) => setDisplayOrder(Number(e.target.value))}
              />
            </div>
          </div>

          <div className="flex items-center space-x-2">
            <Switch checked={isActive} onCheckedChange={setIsActive} id="is-active" />
            <Label htmlFor="is-active" className="text-sm font-normal">
              Hiển thị phần này
            </Label>
          </div>

          {/* Tabs for different configurations */}
          <Tabs defaultValue="layout" className="w-full">
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="layout">Hiển thị</TabsTrigger>
              <TabsTrigger value="products">Sản phẩm</TabsTrigger>
              <TabsTrigger value="banner">Banner</TabsTrigger>
              <TabsTrigger value="display">Tùy chọn</TabsTrigger>
            </TabsList>

            <TabsContent value="layout" className="space-y-4">
              <LayoutConfigurator
                config={config.layout}
                onChange={(layout) => setConfig({ ...config, layout })}
              />
            </TabsContent>

            <TabsContent value="products" className="space-y-4">
              <ProductPicker
                categoryId={categoryId || null}
                config={config.products}
                onChange={(products) => setConfig({ ...config, products })}
              />
            </TabsContent>

            <TabsContent value="banner" className="space-y-4">
              <BannerUploader
                config={config.banner}
                onChange={(banner) => setConfig({ ...config, banner })}
                disabled={config.layout.row_count !== 2}
              />
            </TabsContent>

            <TabsContent value="display" className="space-y-4">
              <div className="space-y-4 border rounded-lg p-4">
                <div className="flex items-center space-x-2">
                  <Switch
                    checked={config.display.show_category_header}
                    onCheckedChange={(show_category_header) =>
                      setConfig({
                        ...config,
                        display: { ...config.display, show_category_header },
                      })
                    }
                    id="show-category-header"
                  />
                  <Label htmlFor="show-category-header" className="text-sm font-normal">
                    Hiển thị tiêu đề danh mục
                  </Label>
                </div>

                {config.display.show_category_header && (
                  <div className="space-y-2 ml-6">
                    <Label>Tiêu đề tùy chỉnh (tùy chọn)</Label>
                    <Input
                      placeholder="Để trống để dùng tên danh mục"
                      value={config.display.custom_title || ''}
                      onChange={(e) =>
                        setConfig({
                          ...config,
                          display: { ...config.display, custom_title: e.target.value },
                        })
                      }
                    />
                  </div>
                )}

                <div className="flex items-center space-x-2">
                  <Switch
                    checked={config.display.show_view_all_link}
                    onCheckedChange={(show_view_all_link) =>
                      setConfig({
                        ...config,
                        display: { ...config.display, show_view_all_link },
                      })
                    }
                    id="show-view-all"
                  />
                  <Label htmlFor="show-view-all" className="text-sm font-normal">
                    Hiển thị link "Xem tất cả"
                  </Label>
                </div>

                <div className="space-y-2">
                  <Label>Hiệu ứng</Label>
                  <Select
                    value={config.display.animation || 'fade'}
                    onValueChange={(value: 'fade' | 'slide' | 'none') =>
                      setConfig({
                        ...config,
                        display: { ...config.display, animation: value },
                      })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="fade">Fade</SelectItem>
                      <SelectItem value="slide">Slide</SelectItem>
                      <SelectItem value="none">Không</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </TabsContent>
          </Tabs>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose} disabled={loading}>
            Hủy
          </Button>
          <Button onClick={handleSubmit} disabled={loading}>
            {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            {section ? 'Cập nhật' : 'Tạo mới'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
