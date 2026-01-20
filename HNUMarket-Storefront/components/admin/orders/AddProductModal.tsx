'use client';

import { useState, useEffect } from 'react';
import { Search, Plus, X } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { storefrontProductsApi, StorefrontProduct } from '@/lib/api/storefront-products';
import { VariantSelector } from '@/components/product/variant-selector';
import { useVariantSelection } from '@/hooks/use-variant-selection';
import { formatCurrency } from '@/lib/format';
import { getImageUrl as getImageUrlFromPath } from '@/lib/image';
import Image from 'next/image';

interface AddProductModalProps {
  open: boolean;
  onClose: () => void;
  onAdd: (productId: string, variantId: string | undefined, quantity: number) => void;
  adding?: boolean;
}

/**
 * Modal for adding products to existing orders
 * Features: product search, variant selection, quantity input
 */
export function AddProductModal({ open, onClose, onAdd, adding = false }: AddProductModalProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [products, setProducts] = useState<StorefrontProduct[]>([]);
  const [selectedProduct, setSelectedProduct] = useState<StorefrontProduct | null>(null);
  const [quantity, setQuantity] = useState(1);
  const [searching, setSearching] = useState(false);

  // Variant selection hook
  // Note: StorefrontProduct has correct runtime data (options + variants with attributes)
  // but TypeScript types don't fully match ProductWithNormalizedVariants
  // Safe to cast because backend populates all required fields
  const {
    selectedAttributes,
    selectedVariant,
    selectAttribute,
    getAvailableValues,
    isValueSelected,
    isValueAvailable,
    reset: resetVariantSelection,
  } = useVariantSelection(selectedProduct as any);

  // Debounced product search
  useEffect(() => {
    if (!searchQuery.trim()) {
      setProducts([]);
      return;
    }

    setSearching(true);
    const timer = setTimeout(async () => {
      try {
        const response = await storefrontProductsApi.getProducts({
          search: searchQuery,
          limit: 10,
        });
        setProducts(response.data);
      } catch (error) {
        console.error('Failed to search products:', error);
        setProducts([]);
      } finally {
        setSearching(false);
      }
    }, 300);

    return () => clearTimeout(timer);
  }, [searchQuery]);

  // Reset state when modal closes
  useEffect(() => {
    if (!open) {
      setSearchQuery('');
      setProducts([]);
      setSelectedProduct(null);
      setQuantity(1);
      resetVariantSelection();
    }
  }, [open, resetVariantSelection]);

  // Helper to get valid image URL or placeholder
  const placeholderImage = '/images/product-placeholder.svg';
  const getImageUrl = (product: StorefrontProduct): string => {
    const image = product.images?.[0];

    // Handle undefined/null
    if (!image) {
      return placeholderImage;
    }

    const url = image.url;
    return url && url !== '' ? getImageUrlFromPath(url) : placeholderImage;
  };

  // Calculate max quantity
  const maxQuantity = selectedVariant?.stock || selectedProduct?.stock || 999;

  // Handle product selection
  const handleSelectProduct = (product: StorefrontProduct) => {
    setSelectedProduct(product);
    setSearchQuery(''); // Clear search after selection
    setProducts([]);
  };

  // Handle add to order
  const handleAdd = () => {
    if (!selectedProduct) return;

    // If product has variants, ensure a variant is selected
    if (selectedProduct.options && selectedProduct.options.length > 0) {
      if (!selectedVariant) {
        return; // Variant required but not selected
      }
      onAdd(selectedProduct.id, selectedVariant.id, quantity);
    } else {
      // No variants, add product directly
      onAdd(selectedProduct.id, undefined, quantity);
    }
  };

  const canAdd = selectedProduct && quantity >= 1 && quantity <= maxQuantity &&
    (!selectedProduct.options?.length || selectedVariant);

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Thêm sản phẩm vào đơn hàng</DialogTitle>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* Search Input */}
          {!selectedProduct && (
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                type="text"
                placeholder="Tìm kiếm sản phẩm..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
                autoFocus
              />
              {searching && (
                <div className="absolute right-3 top-1/2 -translate-y-1/2">
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-primary"></div>
                </div>
              )}
            </div>
          )}

          {/* Search Results */}
          {products.length > 0 && !selectedProduct && (
            <div className="border rounded-lg divide-y max-h-[400px] overflow-y-auto">
              {products.map((product) => (
                <button
                  key={product.id}
                  onClick={() => handleSelectProduct(product)}
                  className="w-full flex items-center gap-3 p-3 hover:bg-gray-50 transition-colors text-left"
                >
                  <div className="relative w-12 h-12 rounded overflow-hidden flex-shrink-0 bg-gray-100">
                    <Image
                      src={getImageUrl(product)}
                      alt={product.name}
                      fill
                      className="object-cover"
                      sizes="48px"
                    />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h4 className="font-medium text-gray-900 truncate">{product.name}</h4>
                    <p className="text-sm text-primary font-semibold">{formatCurrency(product.price)}</p>
                  </div>
                  <div className="text-right text-sm text-gray-500">
                    Còn: {product.stock}
                  </div>
                </button>
              ))}
            </div>
          )}

          {/* Selected Product Card */}
          {selectedProduct && (
            <div className="border rounded-lg p-4 bg-gray-50 space-y-4">
              <div className="flex items-start gap-3">
                <div className="relative w-20 h-20 rounded overflow-hidden flex-shrink-0 bg-white">
                  <Image
                    src={getImageUrl(selectedProduct)}
                    alt={selectedProduct.name}
                    fill
                    className="object-cover"
                    sizes="80px"
                  />
                </div>
                <div className="flex-1">
                  <div className="flex items-start justify-between">
                    <div>
                      <h3 className="font-semibold text-gray-900">{selectedProduct.name}</h3>
                      <p className="text-primary font-semibold mt-1">
                        {formatCurrency(selectedVariant?.price || selectedProduct.price)}
                      </p>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setSelectedProduct(null)}
                      className="h-8 w-8 p-0"
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </div>

              {/* Variant Selector */}
              {selectedProduct.options && selectedProduct.options.length > 0 && (
                <div>
                  <VariantSelector
                    options={selectedProduct.options}
                    selectedAttributes={selectedAttributes}
                    onSelect={selectAttribute}
                    getAvailableValues={getAvailableValues}
                    isValueSelected={isValueSelected}
                    isValueAvailable={isValueAvailable}
                  />
                </div>
              )}

              {/* Quantity Input */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Số lượng
                </label>
                <div className="flex items-center gap-3">
                  <Input
                    type="number"
                    value={quantity}
                    onChange={(e) => setQuantity(Math.max(1, parseInt(e.target.value) || 1))}
                    min={1}
                    max={maxQuantity}
                    className="w-32"
                  />
                  <span className="text-sm text-gray-500">
                    Tối đa: {maxQuantity}
                  </span>
                </div>
                {quantity > maxQuantity && (
                  <p className="text-sm text-destructive mt-1">
                    Số lượng vượt quá tồn kho
                  </p>
                )}
              </div>
            </div>
          )}

          {/* Empty State */}
          {!selectedProduct && !searchQuery && (
            <div className="text-center py-12 text-gray-500">
              <Search className="h-12 w-12 mx-auto mb-3 opacity-50" />
              <p>Tìm kiếm sản phẩm để thêm vào đơn hàng</p>
            </div>
          )}

          {/* No Results */}
          {searchQuery && products.length === 0 && !searching && !selectedProduct && (
            <div className="text-center py-12 text-gray-500">
              <p>Không tìm thấy sản phẩm nào</p>
            </div>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose} disabled={adding}>
            Hủy
          </Button>
          <Button onClick={handleAdd} disabled={!canAdd || adding}>
            {adding ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                Đang thêm...
              </>
            ) : (
              <>
                <Plus className="h-4 w-4 mr-2" />
                Thêm vào đơn hàng
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
