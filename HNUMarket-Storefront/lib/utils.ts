import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

/**
 * Merge Tailwind CSS classes with clsx
 */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

// Format currency to Korean Won (bán hàng Việt cho người Hàn)
export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat("ko-KR", {
    style: "currency",
    currency: "KRW",
  }).format(amount);
}

// Format number with thousand separators
export function formatNumber(num: number): string {
  return new Intl.NumberFormat("vi-VN").format(num);
}

// Calculate discount percentage
export function calculateDiscount(original: number, current: number): number {
  return Math.round(((original - current) / original) * 100);
}

// Truncate text with ellipsis
export function truncate(text: string, length: number): string {
  if (text.length <= length) return text;
  return text.slice(0, length) + "...";
}

// Format date to Vietnamese format
export function formatDate(dateString: string): string {
  return new Intl.DateTimeFormat("vi-VN", {
    year: "numeric",
    month: "long",
    day: "numeric",
  }).format(new Date(dateString));
}

// Format relative date (e.g., "2 ngày trước")
export function formatRelativeDate(dateString: string): string {
  const date = new Date(dateString);
  const now = new Date();
  const diffInMs = now.getTime() - date.getTime();
  const diffInSeconds = Math.floor(diffInMs / 1000);
  const diffInMinutes = Math.floor(diffInSeconds / 60);
  const diffInHours = Math.floor(diffInMinutes / 60);
  const diffInDays = Math.floor(diffInHours / 24);
  const diffInWeeks = Math.floor(diffInDays / 7);
  const diffInMonths = Math.floor(diffInDays / 30);
  const diffInYears = Math.floor(diffInDays / 365);

  if (diffInSeconds < 60) {
    return "Vừa xong";
  } else if (diffInMinutes < 60) {
    return `${diffInMinutes} phút trước`;
  } else if (diffInHours < 24) {
    return `${diffInHours} giờ trước`;
  } else if (diffInDays < 7) {
    return `${diffInDays} ngày trước`;
  } else if (diffInWeeks < 4) {
    return `${diffInWeeks} tuần trước`;
  } else if (diffInMonths < 12) {
    return `${diffInMonths} tháng trước`;
  } else {
    return `${diffInYears} năm trước`;
  }
}

// Generate cart checkout message for Messenger
export function generateCartMessage(items: Array<{ name: string; quantity: number; price: number }>): string {
  let message = "🛒 Đơn hàng của tôi:\n\n";

  items.forEach((item, index) => {
    message += `${index + 1}. ${item.name}\n`;
    message += `   Số lượng: ${item.quantity}\n`;
    message += `   Giá: ${formatCurrency(item.price)}\n\n`;
  });

  const total = items.reduce((sum, item) => sum + item.price * item.quantity, 0);
  message += `💰 Tổng cộng: ${formatCurrency(total)}\n\n`;
  message += "Vui lòng tư vấn cho tôi về đơn hàng này. Cảm ơn!";

  return message;
}
