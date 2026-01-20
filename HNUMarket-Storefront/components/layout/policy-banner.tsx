"use client";

import { Flame, Undo2, Headphones, Sparkles } from "lucide-react";

export function PolicyBanner() {
    return (
        <div className="bg-primary py-20 relative z-10 w-full">
            <div className="max-w-screen mx-auto px-4 sm:px-6 lg:px-8">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
                    {/* Item 1 */}
                    <div className="flex items-start gap-4">
                        <div className="flex-shrink-0 w-12 h-12 rounded-full bg-white flex items-center justify-center">
                            <Flame className="w-6 h-6 text-primary" strokeWidth={2} />
                        </div>
                        <div>
                            <h4 className="text-white font-bold text-base mb-1">Giá tốt nhất & Ưu đãi</h4>
                            <p className="text-primary-foreground/80 text-sm leading-relaxed">
                                Chúng tôi đã chuẩn bị những ưu đãi đặc biệt cho bạn trên các sản phẩm tạp hóa.
                            </p>
                        </div>
                    </div>

                    {/* Item 2 */}
                    <div className="flex items-start gap-4">
                        <div className="flex-shrink-0 w-12 h-12 rounded-full bg-white flex items-center justify-center">
                            <Undo2 className="w-6 h-6 text-primary" strokeWidth={2} />
                        </div>
                        <div>
                            <h4 className="text-white font-bold text-base mb-1">Hoàn tiền 100%</h4>
                            <p className="text-primary-foreground/80 text-sm leading-relaxed">
                                Chúng tôi đảm bảo hoàn tiền nếu sản phẩm không đúng chất lượng cam kết.
                            </p>
                        </div>
                    </div>

                    {/* Item 3 */}
                    <div className="flex items-start gap-4">
                        <div className="flex-shrink-0 w-12 h-12 rounded-full bg-white flex items-center justify-center">
                            <Headphones className="w-6 h-6 text-primary" strokeWidth={2} />
                        </div>
                        <div>
                            <h4 className="text-white font-bold text-base mb-1">Hỗ trợ 24/7</h4>
                            <p className="text-primary-foreground/80 text-sm leading-relaxed">
                                Đội ngũ hỗ trợ của chúng tôi luôn sẵn sàng giải đáp mọi thắc mắc của bạn.
                            </p>
                        </div>
                    </div>

                    {/* Item 4 */}
                    <div className="flex items-start gap-4">
                        <div className="flex-shrink-0 w-12 h-12 rounded-full bg-white flex items-center justify-center">
                            <Sparkles className="w-6 h-6 text-primary" strokeWidth={2} />
                        </div>
                        <div>
                            <h4 className="text-white font-bold text-base mb-1">Ưu đãi Hàng Ngày</h4>
                            <p className="text-primary-foreground/80 text-sm leading-relaxed">
                                Khám phá các ưu đãi mới mỗi ngày để tiết kiệm hơn khi mua sắm.
                            </p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
