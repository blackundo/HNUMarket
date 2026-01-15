"use client";

import { ShoppingBag, ChevronRight } from "lucide-react";
import { usePathname } from "next/navigation";
import { useCart } from "@/contexts/cart-context";
import { useMobileCartDrawer } from "@/contexts/mobile-cart-drawer-provider";
import { formatCurrency } from "@/lib/utils";

interface MobileCartBarProps {
    /** Có CTA bar đang hiển thị hay không - để điều chỉnh bottom offset */
    hasCTABar?: boolean;
}

/**
 * Thanh cố định bên dưới màn hình mobile hiển thị thông tin giỏ hàng
 * Chỉ hiển thị khi có sản phẩm trong giỏ
 */
export function MobileCartBar({ hasCTABar = false }: MobileCartBarProps) {
    const pathname = usePathname();
    const { items, summary, isInitialized } = useCart();
    const { openDrawer } = useMobileCartDrawer();

    const totalItems = items.reduce((sum, item) => sum + item.quantity, 0);

    // Ẩn khi đang ở trang cart
    const isCartPage = pathname === "/cart";

    const isAdminPage = pathname.includes("/admin");
    // Chờ cart được load từ localStorage
    // Không hiển thị nếu giỏ hàng trống hoặc đang ở trang cart
    if (!isInitialized || items.length === 0 || isCartPage || isAdminPage) {
        return null;
    }

    return (
        <button
            onClick={openDrawer}
            className={`
        fixed left-0 right-0 z-40 bg-primary text-white
        flex items-center justify-between px-4 py-3
        shadow-lg transition-all duration-300
        md:hidden
        ${hasCTABar ? "bottom-[76px]" : "bottom-0"}
      `}
            style={{
                paddingBottom: hasCTABar ? "12px" : "calc(12px + env(safe-area-inset-bottom))",
            }}
        >
            <div className="flex items-center gap-2">
                <ShoppingBag className="w-4 h-4" />
                <span className="text-sm font-medium">{totalItems} sản phẩm</span>
            </div>

            <span className="text-lg font-bold">{formatCurrency(summary.subtotal)}</span>

            <div className="flex items-center gap-1">
                <span className="text-sm font-medium">Xem chi tiết</span>
                <ChevronRight className="w-4 h-4" />
            </div>
        </button>
    );
}
