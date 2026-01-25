import Link from "next/link";
import { Button } from "@/components/ui/button";
import { ArrowLeft, ShoppingBag } from "lucide-react";
import { SearchInput } from "@/components/search/search-input";

export default function NotFound() {
    return (
        <div className="flex min-h-[70vh] flex-col items-center justify-center gap-6 px-4 text-center">
            <div className="flex h-20 w-20 items-center justify-center rounded-full bg-muted">
                <ShoppingBag className="h-10 w-10 text-muted-foreground" />
            </div>
            <div className="space-y-2">
                <h1 className="text-4xl font-bold tracking-tight sm:text-5xl">404</h1>
                <h2 className="text-2xl font-semibold tracking-tight">
                    Trang không tìm thấy
                </h2>
                <p className="max-w-[500px] text-muted-foreground">
                    Xin lỗi, chúng tôi không thể tìm thấy trang bạn đang tìm kiếm. Có thể trang đã bị xóa hoặc đường dẫn không chính xác.
                </p>
            </div>

            <div className="w-full max-w-sm py-2">
                <SearchInput />
            </div>

            <div className="flex flex-col gap-2 sm:flex-row">
                <Button asChild variant="outline">
                    <Link href="/">
                        <ArrowLeft className="mr-2 h-4 w-4" />
                        Trở về trang chủ
                    </Link>
                </Button>
                <Button asChild>
                    <Link href="/">
                        Tiếp tục mua sắm
                    </Link>
                </Button>
            </div>
        </div>
    );
}
