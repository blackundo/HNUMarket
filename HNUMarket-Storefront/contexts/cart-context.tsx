'use client';

import React, { createContext, useContext, useMemo, useEffect, useState, useCallback } from 'react';
import { useLocalStorage } from '@/hooks/use-local-storage';
import { storefrontProductsApi, StorefrontProduct, ProductVariant as ApiProductVariant } from '@/lib/api/storefront-products';
import type { ShippingLocation } from '@/lib/api/shipping';
import type { CartItem, CartSummary } from '@/types';
import { trackAddToCart, trackRemoveFromCart } from '@/lib/analytics/ga-ecommerce';

/**
 * Extended CartItemWithDetails that works with API data
 * 
 * Note: ApiProductVariant supports both legacy and normalized variant systems:
 * - Legacy variants: Uses name, display_name, unit, conversion_rate fields
 * - Normalized variants: Uses attributes field (Record<string, string>)
 * 
 * The variant is matched by:
 * - attributes (if both item and variant have attributes) for normalized variants
 * - variantId for legacy variants
 */
export interface CartItemWithDetails extends CartItem {
  product: StorefrontProduct;
  variant?: ApiProductVariant; // Supports both legacy and normalized variants via attributes field
}

interface CartContextValue {
  items: CartItem[];
  addItem: (params: {
    productId: string;
    variantId?: string;
    attributes?: Record<string, string>;
    quantity: number;
  }) => void;
  removeItem: (productId: string, variantId?: string, attributes?: Record<string, string>) => void;
  updateQuantity: (
    productId: string,
    variantId: string | undefined,
    quantity: number,
    attributes?: Record<string, string>
  ) => void;
  clearCart: () => void;
  getItemDetails: (item: CartItem) => Promise<CartItemWithDetails | null>;
  getItemQuantity: (productId: string, variantId?: string) => number;
  itemCount: number;
  isInitialized: boolean;
  selectedItems: Set<string>;
  toggleItemSelection: (productId: string, variantId?: string) => void;
  selectAll: () => void;
  deselectAll: () => void;
  summary: CartSummary;
  // Products cache for display
  productsCache: Map<string, StorefrontProduct>;
  loadProducts: () => Promise<void>;
  isLoadingProducts: boolean;
  // Shipping location
  selectedShippingLocation: ShippingLocation | null;
  setSelectedShippingLocation: (location: ShippingLocation | null) => void;
  // Order note
  note: string;
  setNote: (note: string) => void;
}

const CartContext = createContext<CartContextValue | undefined>(undefined);

export function CartProvider({ children }: { children: React.ReactNode }) {
  const [items, setItems, isInitialized] = useLocalStorage<CartItem[]>('hnumarket-cart', []);
  const [selectedItems, setSelectedItems] = useState<Set<string>>(new Set());
  const [productsCache, setProductsCache] = useState<Map<string, StorefrontProduct>>(new Map());
  const [isLoadingProducts, setIsLoadingProducts] = useState(false);
  const [selectedShippingLocation, setSelectedShippingLocation] = useState<ShippingLocation | null>(null);
  const [note, setNote] = useState<string>('');

  // Generate unique key for cart item
  const getItemKey = (productId: string, variantId?: string, attributes?: Record<string, string>) => {
    if (attributes) {
      // Generate key from attributes for multi-attribute variants
      const attrKey = Object.entries(attributes)
        .sort(([a], [b]) => a.localeCompare(b))
        .map(([k, v]) => `${k}:${v}`)
        .join('|');
      return `${productId}-${attrKey}`;
    }
    return variantId ? `${productId}-${variantId}` : productId;
  };

  // Load products from API when cart items change
  const loadProducts = useCallback(async () => {
    if (items.length === 0) {
      setProductsCache(new Map());
      return;
    }

    // Get unique product IDs that are not in cache
    const productIds = [...new Set(items.map(item => item.productId))];
    const missingIds = productIds.filter(id => !productsCache.has(id));

    if (missingIds.length === 0) return;

    setIsLoadingProducts(true);
    try {
      const products = await storefrontProductsApi.getProductsByIds(missingIds);

      setProductsCache(prev => {
        const newCache = new Map(prev);
        products.forEach(product => {
          newCache.set(product.id, product);
        });
        return newCache;
      });
    } catch (error) {
      console.error('Failed to load products for cart:', error);
    } finally {
      setIsLoadingProducts(false);
    }
  }, [items, productsCache]);

  // Auto-load products when cart initializes or items change
  useEffect(() => {
    if (isInitialized && items.length > 0) {
      loadProducts();
    }
  }, [isInitialized, items.length]);

  // Auto-select all items when cart loads
  useEffect(() => {
    if (isInitialized && items.length > 0) {
      const allKeys = items.map((item) => getItemKey(item.productId, item.variantId, item.attributes));
      setSelectedItems(new Set(allKeys));
    }
  }, [isInitialized]);

  // Helper: Compare attributes deterministically
  const attributesMatch = (attrs1?: Record<string, string>, attrs2?: Record<string, string>): boolean => {
    if (!attrs1 && !attrs2) return true;
    if (!attrs1 || !attrs2) return false;

    const keys1 = Object.keys(attrs1).sort();
    const keys2 = Object.keys(attrs2).sort();

    if (keys1.length !== keys2.length) return false;

    return keys1.every((key, index) =>
      key === keys2[index] && attrs1[key] === attrs2[key]
    );
  };

  const addItem = ({ productId, variantId, attributes, quantity }: {
    productId: string;
    variantId?: string;
    attributes?: Record<string, string>;
    quantity: number;
  }) => {
    setItems((prevItems) => {
      // Match by attributes if available, otherwise by variantId
      const existingItemIndex = prevItems.findIndex((item) => {
        if (item.productId !== productId) return false;

        // Match by attributes if both have attributes
        if (attributes && item.attributes) {
          return attributesMatch(item.attributes, attributes);
        }

        // Match by variantId if no attributes
        return item.variantId === variantId;
      });

      if (existingItemIndex > -1) {
        // Update quantity if item exists
        const newItems = [...prevItems];
        newItems[existingItemIndex].quantity += quantity;
        return newItems;
      } else {
        // Add new item and auto-select it
        const newItem: CartItem = {
          productId,
          variantId,
          attributes,
          quantity,
          addedAt: new Date().toISOString(),
        };

        // Auto-select newly added item
        const key = getItemKey(productId, variantId, attributes);
        setSelectedItems((prev) => new Set(prev).add(key));

        return [...prevItems, newItem];
      }
    });

    // Track add_to_cart event (async, after state update)
    // We use setTimeout to ensure the tracking happens after state update
    setTimeout(() => {
      const product = productsCache.get(productId);
      if (product) {
        // Find variant if applicable
        let variant: ApiProductVariant | undefined;
        if (attributes && product.variants) {
          variant = product.variants.find((v) => {
            if (!v.attributes) return false;
            return attributesMatch(v.attributes, attributes);
          });
        } else if (variantId && product.variants) {
          variant = product.variants.find((v) => v.id === variantId);
        }

        const price = variant?.price ?? product.price;
        const itemName = variant?.display_name
          ? `${product.name} - ${variant.display_name}`
          : product.name;

        trackAddToCart({
          items: [{
            item_id: productId,
            item_name: itemName,
            item_variant: variant?.display_name,
            price: price,
            quantity: quantity,
          }],
          value: price * quantity,
          currency: 'KRW',
        });
      } else {
        // If product not in cache, fetch it then track
        storefrontProductsApi.getProductById(productId)
          .then((fetchedProduct) => {
            // Update cache
            setProductsCache(prev => {
              const newCache = new Map(prev);
              newCache.set(fetchedProduct.id, fetchedProduct);
              return newCache;
            });

            // Find variant
            let variant: ApiProductVariant | undefined;
            if (attributes && fetchedProduct.variants) {
              variant = fetchedProduct.variants.find((v) => {
                if (!v.attributes) return false;
                return attributesMatch(v.attributes, attributes);
              });
            } else if (variantId && fetchedProduct.variants) {
              variant = fetchedProduct.variants.find((v) => v.id === variantId);
            }

            const price = variant?.price ?? fetchedProduct.price;
            const itemName = variant?.display_name
              ? `${fetchedProduct.name} - ${variant.display_name}`
              : fetchedProduct.name;

            trackAddToCart({
              items: [{
                item_id: productId,
                item_name: itemName,
                item_variant: variant?.display_name,
                price: price,
                quantity: quantity,
              }],
              value: price * quantity,
              currency: 'KRW',
            });
          })
          .catch((error) => {
            console.error('Failed to track add_to_cart event:', error);
          });
      }
    }, 0);
  };

  const removeItem = (productId: string, variantId?: string, attributes?: Record<string, string>) => {
    // Get the item being removed for tracking
    const itemToRemove = items.find((item) => {
      if (item.productId !== productId) return false;
      if (attributes && item.attributes) {
        return attributesMatch(item.attributes, attributes);
      }
      return item.variantId === variantId;
    });

    // Remove from selection
    const key = getItemKey(productId, variantId, attributes);
    setSelectedItems((prev) => {
      const newSet = new Set(prev);
      newSet.delete(key);
      return newSet;
    });

    setItems((prevItems) =>
      prevItems.filter((item) => {
        if (item.productId !== productId) return true;

        // Match by attributes if provided
        if (attributes && item.attributes) {
          return !attributesMatch(item.attributes, attributes);
        }

        // Match by variantId if no attributes
        return item.variantId !== variantId;
      })
    );

    // Track remove_from_cart event
    if (itemToRemove) {
      setTimeout(() => {
        const product = productsCache.get(productId);
        if (product) {
          // Find variant if applicable
          let variant: ApiProductVariant | undefined;
          if (attributes && product.variants) {
            variant = product.variants.find((v) => {
              if (!v.attributes) return false;
              return attributesMatch(v.attributes, attributes);
            });
          } else if (variantId && product.variants) {
            variant = product.variants.find((v) => v.id === variantId);
          }

          const price = variant?.price ?? product.price;
          const itemName = variant?.display_name
            ? `${product.name} - ${variant.display_name}`
            : product.name;

          trackRemoveFromCart({
            items: [{
              item_id: productId,
              item_name: itemName,
              item_variant: variant?.display_name,
              price: price,
              quantity: itemToRemove.quantity,
            }],
            value: price * itemToRemove.quantity,
            currency: 'KRW',
          });
        }
      }, 0);
    }
  };

  const updateQuantity = (
    productId: string,
    variantId: string | undefined,
    quantity: number,
    attributes?: Record<string, string>
  ) => {
    if (quantity <= 0) {
      removeItem(productId, variantId, attributes);
      return;
    }

    setItems((prevItems) => {
      const itemIndex = prevItems.findIndex((item) => {
        if (item.productId !== productId) return false;

        // Match by attributes if provided
        if (attributes && item.attributes) {
          return attributesMatch(item.attributes, attributes);
        }

        // Match by variantId if no attributes
        return item.variantId === variantId;
      });

      if (itemIndex > -1) {
        const newItems = [...prevItems];
        newItems[itemIndex].quantity = quantity;
        return newItems;
      }

      return prevItems;
    });
  };

  const clearCart = () => {
    setItems([]);
    setSelectedItems(new Set());
  };

  const toggleItemSelection = (productId: string, variantId?: string) => {
    const key = getItemKey(productId, variantId);
    setSelectedItems((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(key)) {
        newSet.delete(key);
      } else {
        newSet.add(key);
      }
      return newSet;
    });
  };

  const selectAll = () => {
    const allKeys = items.map((item) => getItemKey(item.productId, item.variantId, item.attributes));
    setSelectedItems(new Set(allKeys));
  };

  const deselectAll = () => {
    setSelectedItems(new Set());
  };

  const getItemDetails = useCallback(async (item: CartItem): Promise<CartItemWithDetails | null> => {
    // First check cache
    let product = productsCache.get(item.productId);

    // If not in cache, fetch from API
    if (!product) {
      try {
        product = await storefrontProductsApi.getProductById(item.productId);
        // Update cache
        setProductsCache(prev => {
          const newCache = new Map(prev);
          newCache.set(product!.id, product!);
          return newCache;
        });
      } catch (error) {
        console.error(`Failed to fetch product ${item.productId}:`, error);
        return null;
      }
    }

    // Find variant by attributes or ID
    let variant: ApiProductVariant | undefined;
    if (item.attributes && product.variants) {
      // Match by attributes for normalized variants
      variant = product.variants.find((v) => {
        if (!v.attributes) return false;
        return attributesMatch(v.attributes, item.attributes);
      });
    } else if (item.variantId && product.variants) {
      // Match by ID for legacy variants
      variant = product.variants.find((v) => v.id === item.variantId);
    }

    return {
      ...item,
      product,
      variant,
    };
  }, [productsCache]);

  // Get quantity of specific product/variant in cart
  const getItemQuantity = useCallback((productId: string, variantId?: string): number => {
    const item = items.find(
      (item) => item.productId === productId && item.variantId === variantId
    );
    return item?.quantity ?? 0;
  }, [items]);

  const itemCount = useMemo(() => {
    return items.reduce((total, item) => total + item.quantity, 0);
  }, [items]);

  // Calculate summary for selected items only using cached products
  const summary: CartSummary = useMemo(() => {
    let subtotal = 0;
    let itemCount = 0;

    items.forEach((item) => {
      const key = getItemKey(item.productId, item.variantId, item.attributes);
      const isSelected = selectedItems.has(key);

      if (isSelected) {
        const product = productsCache.get(item.productId);
        if (product) {
          // Use variant price if available, otherwise use product price
          let variant: ApiProductVariant | undefined;

          if (item.attributes && product.variants) {
            // Match by attributes for normalized variants
            variant = product.variants.find((v) => {
              if (!v.attributes) return false;
              return attributesMatch(v.attributes, item.attributes);
            });
          } else if (item.variantId && product.variants) {
            // Match by ID for legacy variants
            variant = product.variants.find(v => v.id === item.variantId);
          }

          const price = variant?.price ?? product.price;
          subtotal += price * item.quantity;
          itemCount += item.quantity;
        }
      }
    });

    // Calculate shipping based on subtotal
    // < 30,000 → 4,000
    // >= 30,000 and < 50,000 → 2,000
    // >= 50,000 → free
    let shipping = 0;
    if (selectedItems.size > 0 && subtotal > 0) {
      if (subtotal >= 50000) {
        shipping = 0; // Free shipping
      } else if (subtotal >= 30000) {
        shipping = 2000;
      } else {
        shipping = 4000;
      }
    }
    const total = subtotal + shipping;

    return {
      subtotal,
      shipping,
      discount: 0,
      total,
      itemCount,
    };
  }, [items, selectedItems, productsCache, selectedShippingLocation]);

  const value: CartContextValue = {
    items,
    addItem,
    removeItem,
    updateQuantity,
    clearCart,
    getItemDetails,
    getItemQuantity,
    itemCount,
    isInitialized,
    selectedItems,
    toggleItemSelection,
    selectAll,
    deselectAll,
    summary,
    productsCache,
    loadProducts,
    isLoadingProducts,
    selectedShippingLocation,
    setSelectedShippingLocation,
    note,
    setNote,
  };

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

export function useCart() {
  const context = useContext(CartContext);
  if (context === undefined) {
    throw new Error('useCart must be used within a CartProvider');
  }
  return context;
}
