/**
 * Image URL utilities for handling R2 storage paths
 * 
 * After migrating to Cloudflare R2, database only stores relative paths.
 * This utility converts relative paths to full URLs using the R2 public domain.
 */

/**
 * Get the full image URL from a path
 * 
 * @param path - The image path (can be relative path or full URL)
 * @returns Full URL to the image
 * 
 * @example
 * // Returns full URL from relative path
 * getImageUrl('products/abc123.jpg') 
 * // => 'https://r2.example.com/products/abc123.jpg'
 * 
 * @example
 * // Returns unchanged if already a full URL
 * getImageUrl('https://example.com/image.jpg')
 * // => 'https://example.com/image.jpg'
 */
export const getImageUrl = (path: string | undefined | null): string => {
    // Handle empty/null/undefined
    if (!path) return '';

    // If already a full URL, return as-is
    if (path.startsWith('http://') || path.startsWith('https://')) {
        return path;
    }

    // Get R2 public domain from environment variable
    const domain = process.env.NEXT_PUBLIC_R2_PUBLIC_URL || '';

    // If no domain configured, return the path as-is (fallback)
    if (!domain) {
        console.warn('NEXT_PUBLIC_R2_PUBLIC_URL is not configured. Image URL may not work correctly.');
        return path;
    }

    // Remove leading slash from path if present to avoid double slashes
    const cleanPath = path.startsWith('/') ? path.slice(1) : path;

    // Combine domain and path
    return `${domain}/${cleanPath}`;
};

/**
 * Get image URL from a product image object
 * Handles both string URLs and ProductImage objects
 * 
 * @param image - Product image (can be string, ProductImage object, or undefined)
 * @returns Full URL to the image
 */
export const getProductImageUrl = (
    image: string | { url: string } | undefined | null
): string => {
    if (!image) return '';

    if (typeof image === 'string') {
        return getImageUrl(image);
    }

    if (typeof image === 'object' && 'url' in image) {
        return getImageUrl(image.url);
    }

    return '';
};

/**
 * Get the first image URL from a product's images array
 * 
 * @param images - Array of product images (can be strings or ProductImage objects)
 * @param fallback - Fallback URL if no images available
 * @returns Full URL to the first image or fallback
 */
export const getFirstProductImageUrl = (
    images: (string | { url: string })[] | undefined | null,
    fallback = ''
): string => {
    if (!images || images.length === 0) return fallback;
    return getProductImageUrl(images[0]);
};
