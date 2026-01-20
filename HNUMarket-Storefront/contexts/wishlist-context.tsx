"use client";

import { createContext, useContext, useState, useEffect, useCallback, ReactNode } from "react";
import { Product } from "@/types";

// Wishlist item interface
export interface WishlistItem {
    productId: string;
    addedAt: string;
}

// Wishlist context interface
interface WishlistContextValue {
    items: WishlistItem[];
    addItem: (productId: string) => void;
    removeItem: (productId: string) => void;
    toggleItem: (productId: string) => boolean; // Returns new state (true = added, false = removed)
    isInWishlist: (productId: string) => boolean;
    clearWishlist: () => void;
    itemCount: number;
}

// Storage key
const WISHLIST_STORAGE_KEY = "hnu-wishlist";

// Create context
const WishlistContext = createContext<WishlistContextValue | undefined>(undefined);

// Provider component
export function WishlistProvider({ children }: { children: ReactNode }) {
    const [items, setItems] = useState<WishlistItem[]>([]);
    const [isInitialized, setIsInitialized] = useState(false);

    // Load wishlist from localStorage on mount
    useEffect(() => {
        try {
            const stored = localStorage.getItem(WISHLIST_STORAGE_KEY);
            if (stored) {
                const parsed = JSON.parse(stored);
                if (Array.isArray(parsed)) {
                    setItems(parsed);
                }
            }
        } catch (error) {
            console.error("Failed to load wishlist from localStorage:", error);
        }
        setIsInitialized(true);
    }, []);

    // Save to localStorage whenever items change
    useEffect(() => {
        if (isInitialized) {
            try {
                localStorage.setItem(WISHLIST_STORAGE_KEY, JSON.stringify(items));
            } catch (error) {
                console.error("Failed to save wishlist to localStorage:", error);
            }
        }
    }, [items, isInitialized]);

    // Check if product is in wishlist
    const isInWishlist = useCallback(
        (productId: string): boolean => {
            return items.some((item) => item.productId === productId);
        },
        [items]
    );

    // Add item to wishlist
    const addItem = useCallback((productId: string) => {
        setItems((prev) => {
            // Check if already in wishlist
            if (prev.some((item) => item.productId === productId)) {
                return prev;
            }
            return [
                ...prev,
                {
                    productId,
                    addedAt: new Date().toISOString(),
                },
            ];
        });
    }, []);

    // Remove item from wishlist
    const removeItem = useCallback((productId: string) => {
        setItems((prev) => prev.filter((item) => item.productId !== productId));
    }, []);

    // Toggle item in wishlist (returns new state)
    const toggleItem = useCallback(
        (productId: string): boolean => {
            const exists = isInWishlist(productId);
            if (exists) {
                removeItem(productId);
                return false;
            } else {
                addItem(productId);
                return true;
            }
        },
        [isInWishlist, addItem, removeItem]
    );

    // Clear all items
    const clearWishlist = useCallback(() => {
        setItems([]);
    }, []);

    const value: WishlistContextValue = {
        items,
        addItem,
        removeItem,
        toggleItem,
        isInWishlist,
        clearWishlist,
        itemCount: items.length,
    };

    return (
        <WishlistContext.Provider value={value}>{children}</WishlistContext.Provider>
    );
}

// Hook to use wishlist context
export function useWishlist() {
    const context = useContext(WishlistContext);
    if (!context) {
        throw new Error("useWishlist must be used within a WishlistProvider");
    }
    return context;
}
