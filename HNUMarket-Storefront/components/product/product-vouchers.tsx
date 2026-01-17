"use client";

import { useState } from "react";
import { Truck, Ticket, BadgeDollarSign, Flame, Copy, Check, Info } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import {
    Tooltip,
    TooltipContent,
    TooltipProvider,
    TooltipTrigger,
} from "@/components/ui/tooltip";

interface Voucher {
    id: string;
    code: string;
    title: string;
    description: string;
    expiry: string;
    icon: React.ElementType;
    colorClass: string;
    bgClass: string;
    iconBgClass: string;
}

const VOUCHERS: Voucher[] = [
    {
        id: "1",
        code: "A87TYRT55",
        title: "Miễn phí vận chuyển",
        description: "Đơn hàng từ 300k",
        expiry: "10/04/2026",
        icon: Truck,
        colorClass: "text-red-500",
        bgClass: "bg-red-50 hover:bg-red-100/50",
        iconBgClass: "bg-white",
    },
    {
        id: "2",
        code: "QH5G8JOY",
        title: "Giảm 20%",
        description: "Đơn hàng từ 200k",
        expiry: "05/05/2026",
        icon: Ticket,
        colorClass: "text-blue-500",
        bgClass: "bg-blue-50 hover:bg-blue-100/50",
        iconBgClass: "bg-white",
    },
    {
        id: "3",
        code: "FT45YUO8H",
        title: "Giảm 50k",
        description: "Đơn hàng từ 500k",
        expiry: "10/05/2026",
        icon: BadgeDollarSign,
        colorClass: "text-green-500",
        bgClass: "bg-green-50 hover:bg-green-100/50",
        iconBgClass: "bg-white",
    },
    {
        id: "4",
        code: "A789UYT",
        title: "Giảm 10%",
        description: "Đơn hàng từ 100k",
        expiry: "20/05/2026",
        icon: Flame,
        colorClass: "text-orange-500",
        bgClass: "bg-orange-50 hover:bg-orange-100/50",
        iconBgClass: "bg-white",
    },
];

export function ProductVouchers() {
    const [copiedId, setCopiedId] = useState<string | null>(null);

    const handleCopy = (code: string, id: string) => {
        navigator.clipboard.writeText(code);
        setCopiedId(id);
        toast.success("Đã sao chép mã giảm giá!");
        setTimeout(() => setCopiedId(null), 2000);
    };

    return (
        <div className="flex flex-col gap-4 p-4 lg:p-0">
            <h3 className="text-lg font-bold text-gray-900">Khuyến mãi dành cho bạn</h3>
            <div className="flex flex-col gap-3">
                {VOUCHERS.map((voucher) => (
                    <div
                        key={voucher.id}
                        className={cn(
                            "relative flex flex-col sm:flex-row border border-gray-200 rounded-xl overflow-hidden transition-all duration-300",
                            voucher.bgClass,
                            "hover:shadow-md group"
                        )}
                    >
                        {/* Left Decor / Icon */}
                        <div className="flex sm:w-32 p-4 items-center justify-center relative">
                            {/* Dashed separator line visual trick */}
                            <div className="absolute right-0 top-1/2 -translate-y-1/2 w-[1px] h-[80%] border-r-2 border-dashed border-gray-300/50 hidden sm:block" />

                            {/* Semi-circles for coupon effect */}
                            <div className="absolute -top-3 right-[-12px] w-6 h-6 rounded-full bg-white border border-gray-200 z-10 hidden sm:block" />
                            <div className="absolute -bottom-3 right-[-12px] w-6 h-6 rounded-full bg-white border border-gray-200 z-10 hidden sm:block" />

                            <div className={cn(
                                "w-16 h-16 rounded-full flex items-center justify-center shadow-sm",
                                voucher.iconBgClass
                            )}>
                                <voucher.icon className={cn("w-8 h-8", voucher.colorClass)} strokeWidth={1.5} />
                            </div>
                        </div>

                        {/* Right Content */}
                        <div className="flex-1 p-4 pl-4 sm:pl-6 flex flex-col justify-center min-h-[120px]">
                            <div className="flex justify-between items-start">
                                <div>
                                    <h4 className="font-bold text-base text-gray-900">{voucher.title}</h4>
                                    <p className="text-sm text-gray-600 mt-0.5">{voucher.description}</p>
                                </div>
                                <TooltipProvider>
                                    <Tooltip>
                                        <TooltipTrigger asChild>
                                            <button className="text-gray-400 hover:text-gray-600 transition-colors">
                                                <Info className="w-5 h-5" />
                                            </button>
                                        </TooltipTrigger>
                                        <TooltipContent>
                                            <p>HSD: {voucher.expiry}</p>
                                        </TooltipContent>
                                    </Tooltip>
                                </TooltipProvider>
                            </div>

                            <div className="mt-4 flex flex-wrap items-end justify-between gap-2">
                                <div className="flex flex-col gap-1">
                                    <span className="text-[10px] uppercase text-gray-500 font-semibold tracking-wider">Mã giảm giá</span>
                                    <code className="text-sm font-bold text-gray-800 bg-white/50 px-2 py-1 rounded border border-gray-200/50 w-fit">
                                        {voucher.code}
                                    </code>
                                    <span className="text-[10px] text-gray-400 mt-0.5">HSD: {voucher.expiry}</span>
                                </div>

                                <Button
                                    size="sm"
                                    variant="ghost"
                                    className={cn(
                                        "text-xs font-medium h-8 px-3 transition-colors",
                                        copiedId === voucher.id
                                            ? "bg-green-100 text-green-700 hover:bg-green-100 hover:text-green-700"
                                            : "bg-white text-gray-700 hover:bg-gray-100 hover:text-gray-900 shadow-sm border border-gray-200"
                                    )}
                                    onClick={() => handleCopy(voucher.code, voucher.id)}
                                >
                                    {copiedId === voucher.id ? (
                                        <>
                                            <Check className="w-3.5 h-3.5 mr-1.5" />
                                            Đã chép
                                        </>
                                    ) : (
                                        <>
                                            <Copy className="w-3.5 h-3.5 mr-1.5" />
                                            Sao chép mã
                                        </>
                                    )}
                                </Button>
                            </div>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}
