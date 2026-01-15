"use client";

import { useQueryState, parseAsInteger, parseAsString } from "nuqs";
import { Filter, ChevronDown } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useCallback, useTransition } from "react";
import { cn } from "@/lib/utils";

interface CategoryControlsProps {
    initialMinPrice?: number;
    initialMaxPrice?: number;
    initialSortBy?: string;
    initialSortOrder?: string;
}

export function CategoryControls({
    initialMinPrice,
    initialMaxPrice,
    initialSortBy,
    initialSortOrder,
}: CategoryControlsProps) {
    const [minPrice, setMinPrice] = useQueryState(
        "min_price",
        parseAsInteger.withDefault(initialMinPrice || 0)
    );
    const [maxPrice, setMaxPrice] = useQueryState(
        "max_price",
        parseAsInteger.withDefault(initialMaxPrice || 0)
    );

    // Sort state
    const [sortBy, setSortBy] = useQueryState(
        "sort_by",
        parseAsString.withDefault(initialSortBy || "created_at")
    );
    const [sortOrder, setSortOrder] = useQueryState(
        "sort_order",
        parseAsString.withDefault(initialSortOrder || "desc")
    );

    // We use useTransition to show loading state if needed, though nuqs updates URL fast
    const [isPending, startTransition] = useTransition();

    const handleApplyFilter = (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        const formData = new FormData(e.currentTarget);
        const min = formData.get("min_price");
        const max = formData.get("max_price");

        startTransition(() => {
            // If value is empty string, set to null to remove from URL
            setMinPrice(min ? Number(min) : null, { shallow: false });
            setMaxPrice(max ? Number(max) : null, { shallow: false });
        });
    };

    const handleSortChange = (newSortBy: string, newSortOrder: string) => {
        startTransition(() => {
            setSortBy(newSortBy, { shallow: false });
            setSortOrder(newSortOrder, { shallow: false });
        });
    };

    const getCurrentSortLabel = () => {
        if (sortBy === "name" && sortOrder === "asc") return "Tên A-Z";
        if (sortBy === "name" && sortOrder === "desc") return "Tên Z-A";
        if (sortBy === "price" && sortOrder === "asc") return "Giá tăng dần";
        if (sortBy === "price" && sortOrder === "desc") return "Giá giảm dần";
        return "Sắp xếp";
    };

    return (
        <>
            {/* Sidebar Filter Control */}
            <div className="bg-white rounded-lg p-6 shadow-sm">
                <div className="flex items-center gap-2 mb-4 font-medium text-lg">
                    <Filter className="w-5 h-5" />
                    <h2>Bộ lọc</h2>
                </div>

                <form onSubmit={handleApplyFilter} className="space-y-4">
                    <div>
                        <label className="text-sm font-medium mb-2 block">Khoảng giá</label>
                        <div className="flex gap-2 items-center">
                            <Input
                                type="number"
                                name="min_price"
                                placeholder="Min"
                                defaultValue={minPrice || ""}
                                className="w-full text-sm"
                            />
                            <span className="text-gray-400">-</span>
                            <Input
                                type="number"
                                name="max_price"
                                placeholder="Max"
                                defaultValue={maxPrice || ""}
                                className="w-full text-sm"
                            />
                        </div>
                    </div>

                    <Button type="submit" className="w-full" disabled={isPending}>
                        {isPending ? "Đang áp dụng..." : "Áp dụng"}
                    </Button>
                </form>
            </div>

            {/* Hidden Sort Control Portal logic or just return it here? 
          Since the layout separates sidebar and header, we might need two components 
          or just render the Sidebar part here and expose the Header Sort part as a separate exported component.
          
          For simplicity, I will export two components from this file or just make this file export multiple components.
      */}
        </>
    );
}

export function CategorySort({
    initialSortBy,
    initialSortOrder
}: {
    initialSortBy?: string,
    initialSortOrder?: string
}) {
    const [sortBy, setSortBy] = useQueryState(
        "sort_by",
        parseAsString.withDefault(initialSortBy || "name")
    );
    const [sortOrder, setSortOrder] = useQueryState(
        "sort_order",
        parseAsString.withDefault(initialSortOrder || "asc")
    );

    const getCurrentSortLabel = () => {
        if (sortBy === "name" && sortOrder === "asc") return "Tên A-Z";
        if (sortBy === "name" && sortOrder === "desc") return "Tên Z-A";
        if (sortBy === "price" && sortOrder === "asc") return "Giá tăng dần";
        if (sortBy === "price" && sortOrder === "desc") return "Giá giảm dần";
        return "Tên A-Z";
    };

    const handleSort = (field: string, order: string) => {
        setSortBy(field, { shallow: false });
        setSortOrder(order, { shallow: false });
    };

    return (
        <div className="relative group z-10">
            <div className="flex items-center gap-2 px-4 py-2 bg-gray-50 hover:bg-gray-100 rounded-md border text-sm font-medium transition-colors cursor-pointer">
                <span>{getCurrentSortLabel()}</span>
                <ChevronDown className="w-4 h-4 text-gray-500 group-hover:rotate-180 transition-transform" />
            </div>

            <div className="absolute right-0 top-full pt-4 w-48 hidden group-hover:block">
                <div className="bg-white rounded-md shadow-lg border py-1">
                    <button
                        onClick={() => handleSort("name", "asc")}
                        className={cn("block w-full text-left px-4 py-2 text-sm hover:bg-gray-50 hover:text-primary",
                            sortBy === "name" && sortOrder === "asc" && "text-primary font-medium bg-gray-50")}
                    >
                        Tên A-Z
                    </button>
                    <button
                        onClick={() => handleSort("name", "desc")}
                        className={cn("block w-full text-left px-4 py-2 text-sm hover:bg-gray-50 hover:text-primary",
                            sortBy === "name" && sortOrder === "desc" && "text-primary font-medium bg-gray-50")}
                    >
                        Tên Z-A
                    </button>
                    <button
                        onClick={() => handleSort("price", "asc")}
                        className={cn("block w-full text-left px-4 py-2 text-sm hover:bg-gray-50 hover:text-primary",
                            sortBy === "price" && sortOrder === "asc" && "text-primary font-medium bg-gray-50")}
                    >
                        Giá tăng dần
                    </button>
                    <button
                        onClick={() => handleSort("price", "desc")}
                        className={cn("block w-full text-left px-4 py-2 text-sm hover:bg-gray-50 hover:text-primary",
                            sortBy === "price" && sortOrder === "desc" && "text-primary font-medium bg-gray-50")}
                    >
                        Giá giảm dần
                    </button>
                </div>
            </div>
        </div>
    );
}
