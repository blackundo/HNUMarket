'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Search, Plus, X, GripVertical, Package } from 'lucide-react';
import { ProductsConfig } from '@/lib/api/homepage-sections';
import { productsApi, type Product } from '@/lib/api/products';
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

interface SortableProductCardProps {
  product: Product;
  onRemove: (id: string) => void;
}

function SortableProductCard({ product, onRemove }: SortableProductCardProps) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: product.id,
  });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  const imageUrl = product.images?.[0]?.url;

  return (
    <div
      ref={setNodeRef}
      style={style}
      className="flex items-center gap-2 p-2 border rounded-lg bg-background"
    >
      <button
        type="button"
        className="cursor-grab active:cursor-grabbing p-1 hover:bg-muted rounded"
        {...attributes}
        {...listeners}
      >
        <GripVertical className="h-4 w-4 text-muted-foreground" />
      </button>

      {imageUrl ? (
        <img src={imageUrl} alt={product.name} className="w-12 h-12 rounded object-cover" />
      ) : (
        <div className="w-12 h-12 rounded bg-muted flex items-center justify-center">
          <Package className="h-6 w-6 text-muted-foreground" />
        </div>
      )}

      <div className="flex-1 min-w-0">
        <div className="font-medium text-sm truncate">{product.name}</div>
        <div className="text-xs text-muted-foreground">
          {new Intl.NumberFormat('vi-VN').format(product.price)}₫
        </div>
      </div>

      <Button
        variant="ghost"
        size="sm"
        onClick={() => onRemove(product.id)}
        className="text-destructive hover:text-destructive"
      >
        <X className="h-4 w-4" />
      </Button>
    </div>
  );
}

interface ProductPickerProps {
  categoryId: string | null;
  config: ProductsConfig;
  onChange: (config: ProductsConfig) => void;
}

export function ProductPicker({ categoryId, config, onChange }: ProductPickerProps) {
  const [search, setSearch] = useState('');
  const [availableProducts, setAvailableProducts] = useState<Product[]>([]);
  const [selectedProducts, setSelectedProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(false);

  // Fetch available products
  useEffect(() => {
    const fetchProducts = async () => {
      if (!categoryId) {
        setAvailableProducts([]);
        return;
      }

      setLoading(true);
      try {
        const response = await productsApi.getProducts({
          categoryId,
          page: 1,
          limit: 50,
          search: search || undefined,
        });
        setAvailableProducts(response.data || []);
      } catch (error) {
        console.error('Failed to fetch products:', error);
        setAvailableProducts([]);
      } finally {
        setLoading(false);
      }
    };

    fetchProducts();
  }, [categoryId, search]);

  // Fetch selected products details
  useEffect(() => {
    const fetchSelectedProducts = async () => {
      if (!config.selected_product_ids.length) {
        setSelectedProducts([]);
        return;
      }

      try {
        // Fetch products by IDs - need to implement this in products API
        const promises = config.selected_product_ids.map(async (id) => {
          try {
            return await productsApi.getProduct(id);
          } catch {
            return null;
          }
        });
        const products = await Promise.all(promises);
        setSelectedProducts(products.filter((p): p is Product => p !== null));
      } catch (error) {
        console.error('Failed to fetch selected products:', error);
      }
    };

    fetchSelectedProducts();
  }, [config.selected_product_ids]);

  const updateConfig = (updates: Partial<ProductsConfig>) => {
    onChange({ ...config, ...updates });
  };

  const handleAddProduct = (product: Product) => {
    if (!config.selected_product_ids.includes(product.id)) {
      updateConfig({
        selected_product_ids: [...config.selected_product_ids, product.id],
      });
    }
  };

  const handleRemoveProduct = (productId: string) => {
    updateConfig({
      selected_product_ids: config.selected_product_ids.filter((id) => id !== productId),
    });
  };

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;

    if (!over || active.id === over.id) return;

    const oldIndex = selectedProducts.findIndex((p) => p.id === active.id);
    const newIndex = selectedProducts.findIndex((p) => p.id === over.id);

    const reordered = [...selectedProducts];
    const [removed] = reordered.splice(oldIndex, 1);
    reordered.splice(newIndex, 0, removed);

    updateConfig({
      selected_product_ids: reordered.map((p) => p.id),
    });
  };

  const filteredAvailable = availableProducts.filter(
    (p) => !config.selected_product_ids.includes(p.id)
  );

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Sản phẩm</CardTitle>
        <CardDescription>Chọn sản phẩm hiển thị hoặc dùng tự động lấp đầy</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          {/* Available Products */}
          <div className="space-y-2">
            <Label>Sản phẩm khả dụng</Label>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Tìm sản phẩm..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-10"
                disabled={!categoryId}
              />
            </div>
            <div className="border rounded-lg p-2 h-64 overflow-y-auto space-y-1">
              {!categoryId ? (
                <p className="text-sm text-muted-foreground text-center py-8">
                  Chọn danh mục trước
                </p>
              ) : loading ? (
                <p className="text-sm text-muted-foreground text-center py-8">Đang tải...</p>
              ) : filteredAvailable.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-8">Không có sản phẩm</p>
              ) : (
                filteredAvailable.map((product) => {
                  const imageUrl = product.images?.[0]?.url;
                  return (
                    <div
                      key={product.id}
                      className="flex items-center gap-2 p-2 hover:bg-muted rounded-lg cursor-pointer"
                      onClick={() => handleAddProduct(product)}
                    >
                      {imageUrl ? (
                        <img
                          src={imageUrl}
                          alt={product.name}
                          className="w-10 h-10 rounded object-cover"
                        />
                      ) : (
                        <div className="w-10 h-10 rounded bg-muted flex items-center justify-center">
                          <Package className="h-5 w-5 text-muted-foreground" />
                        </div>
                      )}
                      <div className="flex-1 min-w-0">
                        <div className="font-medium text-sm truncate">{product.name}</div>
                        <div className="text-xs text-muted-foreground">
                          {new Intl.NumberFormat('vi-VN').format(product.price)}₫
                        </div>
                      </div>
                      <Plus className="h-4 w-4 text-muted-foreground" />
                    </div>
                  );
                })
              )}
            </div>
          </div>

          {/* Selected Products */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label>Đã chọn ({selectedProducts.length})</Label>
              <Badge variant="secondary" className="text-xs">
                Kéo để sắp xếp
              </Badge>
            </div>
            <div className="border rounded-lg p-2 h-64 overflow-y-auto">
              {selectedProducts.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-8">
                  Chưa chọn sản phẩm nào
                </p>
              ) : (
                <DndContext
                  sensors={sensors}
                  collisionDetection={closestCenter}
                  onDragEnd={handleDragEnd}
                >
                  <SortableContext
                    items={selectedProducts.map((p) => p.id)}
                    strategy={verticalListSortingStrategy}
                  >
                    <div className="space-y-2">
                      {selectedProducts.map((product) => (
                        <SortableProductCard
                          key={product.id}
                          product={product}
                          onRemove={handleRemoveProduct}
                        />
                      ))}
                    </div>
                  </SortableContext>
                </DndContext>
              )}
            </div>
          </div>
        </div>

        {/* Auto-fill Configuration */}
        <div className="border-t pt-4 space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <Label>Tự động lấp đầy</Label>
              <p className="text-xs text-muted-foreground mt-1">
                Tự động thêm sản phẩm nếu chưa đủ số lượng
              </p>
            </div>
            <Switch
              checked={config.auto_fill.enabled}
              onCheckedChange={(enabled) =>
                updateConfig({
                  auto_fill: { ...config.auto_fill, enabled },
                })
              }
            />
          </div>

          {config.auto_fill.enabled && (
            <>
              <div className="space-y-2">
                <Label>Tiêu chí</Label>
                <Select
                  value={config.auto_fill.criteria}
                  onValueChange={(value: 'newest' | 'best_selling' | 'featured' | 'random') =>
                    updateConfig({
                      auto_fill: { ...config.auto_fill, criteria: value },
                    })
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="newest">Mới nhất</SelectItem>
                    <SelectItem value="best_selling">Bán chạy nhất</SelectItem>
                    <SelectItem value="featured">Nổi bật</SelectItem>
                    <SelectItem value="random">Ngẫu nhiên</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="flex items-center space-x-2">
                <Switch
                  checked={config.auto_fill.exclude_out_of_stock || false}
                  onCheckedChange={(exclude_out_of_stock) =>
                    updateConfig({
                      auto_fill: { ...config.auto_fill, exclude_out_of_stock },
                    })
                  }
                  id="exclude-out-of-stock"
                />
                <Label htmlFor="exclude-out-of-stock" className="text-sm font-normal">
                  Loại trừ sản phẩm hết hàng
                </Label>
              </div>
            </>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
