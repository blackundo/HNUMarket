/**
 * Format number as Korean Won (bán hàng Việt cho người Hàn)
 * @example formatPrice(299000) => "₩299,000"
 */
export function formatPrice(price: number): string {
  return new Intl.NumberFormat('vi-VN', {
    style: 'currency',
    currency: 'KRW',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(price);
}

/**
 * Calculate discount percentage
 * @example calculateDiscount(299000, 399000) => 25
 */
export function calculateDiscount(currentPrice: number, originalPrice: number): number {
  if (!originalPrice || originalPrice <= currentPrice) return 0;
  return Math.round(((originalPrice - currentPrice) / originalPrice) * 100);
}

/**
 * Format number with thousand separators
 * @example formatNumber(12345) => "12,345"
 */
export function formatNumber(num: number): string {
  return new Intl.NumberFormat('vi-VN').format(num);
}

/**
 * Alias for formatPrice (for consistency with backend)
 * @example formatCurrency(299000) => "₩299,000"
 */
export function formatCurrency(price: number): string {
  return formatPrice(price);
}

/**
 * Format date to Vietnamese format
 * @example formatDate(new Date()) => "18/12/2025"
 */
export function formatDate(date: Date | string): string {
  const d = typeof date === 'string' ? new Date(date) : date;
  return new Intl.DateTimeFormat('vi-VN', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  }).format(d);
}

/**
 * Format date with time
 * @example formatDateTime(new Date()) => "18/12/2025, 14:30"
 */
export function formatDateTime(date: Date | string): string {
  const d = typeof date === 'string' ? new Date(date) : date;
  return new Intl.DateTimeFormat('vi-VN', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  }).format(d);
}

/**
 * Format relative time (Vietnamese)
 * @example formatRelativeTime(Date.now() - 3600000) => "1 giờ trước"
 */
export function formatRelativeTime(date: Date | string): string {
  const d = typeof date === 'string' ? new Date(date) : date;
  const now = new Date();
  const diffMs = now.getTime() - d.getTime();
  const diffSec = Math.floor(diffMs / 1000);
  const diffMin = Math.floor(diffSec / 60);
  const diffHour = Math.floor(diffMin / 60);
  const diffDay = Math.floor(diffHour / 24);

  if (diffSec < 60) return 'Vừa xong';
  if (diffMin < 60) return `${diffMin} phút trước`;
  if (diffHour < 24) return `${diffHour} giờ trước`;
  if (diffDay < 7) return `${diffDay} ngày trước`;
  return formatDate(d);
}

/**
 * Truncate text with ellipsis
 * @example truncateText("Long text here", 10) => "Long text..."
 */
export function truncateText(text: string, maxLength: number): string {
  if (text.length <= maxLength) return text;
  return text.substring(0, maxLength).trim() + '...';
}

/**
 * Generate star rating display
 * @example getStarRating(4.5) => "★★★★☆"
 */
export function getStarRating(rating: number): string {
  const fullStars = Math.floor(rating);
  const hasHalfStar = rating % 1 >= 0.5;
  const emptyStars = 5 - fullStars - (hasHalfStar ? 1 : 0);

  return '★'.repeat(fullStars) +
    (hasHalfStar ? '⭐' : '') +
    '☆'.repeat(emptyStars);
}

/**
 * Create slug from Vietnamese text
 * @example createSlug("Áo thun nam") => "ao-thun-nam"
 */
export function createSlug(text: string): string {
  return text
    .toLowerCase()
    .normalize('NFD') // Decompose Vietnamese characters
    .replace(/[\u0300-\u036f]/g, '') // Remove diacritics
    .replace(/đ/g, 'd')
    .replace(/[^a-z0-9\s-]/g, '')
    .trim()
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-');
}

/**
 * Validate Vietnamese phone number
 */
export function isValidVietnamesePhone(phone: string): boolean {
  const phoneRegex = /^(0|\+84)[1-9]\d{8}$/;
  return phoneRegex.test(phone.replace(/\s/g, ''));
}

/**
 * Format Vietnamese phone number
 * @example formatPhone("0912345678") => "091 234 5678"
 */
export function formatPhone(phone: string): string {
  const cleaned = phone.replace(/\s/g, '');
  if (cleaned.length === 10 && cleaned.startsWith('0')) {
    return `${cleaned.slice(0, 3)} ${cleaned.slice(3, 6)} ${cleaned.slice(6)}`;
  }
  return phone;
}
