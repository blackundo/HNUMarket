'use client';

import { toast } from 'sonner';

/**
 * Build order confirmation message for Messenger
 */
import { formatCurrency } from "@/lib/utils";

/**
 * Build order confirmation message for Messenger
 */
export function buildOrderConfirmationMessage(orderNumber: string, totalAmount: number): string {
  return `Xin chào! Tôi vừa đặt đơn hàng.\nMã đơn hàng: ${orderNumber}\nTổng tiền: ${formatCurrency(totalAmount)}\n\nVui lòng xác nhận đơn hàng cho tôi. Cảm ơn!`;
}

/**
 * Build order support message for Messenger
 */
export function buildOrderSupportMessage(orderNumber: string): string {
  return `Xin chào! Tôi cần hỗ trợ đơn hàng.\nMã đơn hàng: ${orderNumber}\n\nCảm ơn!`;
}

/**
 * Open Messenger with pre-filled message
 * @param message - The message to pre-fill
 * @param pageId - Facebook Page ID (must be provided by caller)
 */
export function openMessengerWithMessage(
  message: string,
  pageId: string
): void {
  if (!pageId) {
    console.error("Messenger Page ID is not configured");
    toast.error("Chưa cấu hình Messenger Page ID. Vui lòng liên hệ admin.");
    return;
  }

  // Encode message for URL
  const encodedMessage = encodeURIComponent(message);

  // Try to open Messenger app first (mobile), fallback to web
  const messengerAppUrl = `fb-messenger-public://user-thread/${pageId}?intent_trigger=mme&text=${encodedMessage}`;
  const messengerWebUrl = `https://m.me/${pageId}?text=${encodedMessage}`;

  // Detect if on mobile
  const isMobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);

  if (isMobile) {
    // Try to open app, fallback to web after short delay
    window.location.href = messengerAppUrl;
    setTimeout(() => {
      window.open(messengerWebUrl, "_blank");
    }, 1000);
  } else {
    // Desktop: open web version
    window.open(messengerWebUrl, "_blank");
  }
  // window.open(messengerWebUrl, "_blank");
}
