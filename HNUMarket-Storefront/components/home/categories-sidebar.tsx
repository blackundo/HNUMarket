'use client';

import { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { ChevronDown, ChevronRight, Menu, Flame } from 'lucide-react';
import { cn } from '@/lib/utils';

interface Category {
    id: string;
    name: string;
    slug: string;
    description?: string;
    image?: string;
    productCount?: number;
}

interface CategoriesSidebarProps {
    categories: Category[];
    isOpen: boolean;
    onToggle: () => void;
    totalProducts?: number;
}

export function CategoriesSidebar({
    categories,
    isOpen,
    onToggle,
    totalProducts = 0
}: CategoriesSidebarProps) {
    const [hoveredCategory, setHoveredCategory] = useState<string | null>(null);
    const [showAllCategories, setShowAllCategories] = useState(false);

    // Quick links at the bottom
    const quickLinks = [
        { href: '/flash-sale', label: 'Ưu đãi hôm nay', icon: Flame },
    ];

    // Limit categories to 10 unless showing all
    const MAX_VISIBLE = 10;
    const visibleCategories = categories.slice(0, MAX_VISIBLE);
    const extraCategories = categories.slice(MAX_VISIBLE);
    const hasMoreCategories = categories.length > MAX_VISIBLE;

    // Category item component
    const CategoryItem = ({ category }: { category: Category }) => (
        <Link
            key={category.id}
            href={`/categories/${category.slug}`}
            className={cn(
                "flex items-center justify-between px-4 py-3",
                "hover:bg-gray-50 transition-colors duration-150 group"
            )}
            onMouseEnter={() => setHoveredCategory(category.id)}
            onMouseLeave={() => setHoveredCategory(null)}
        >
            <div className="flex items-center gap-3">
                {/* Category Image/Icon */}
                <div className="w-8 h-8 relative flex-shrink-0">
                    {category.image ? (
                        <Image
                            src={category.image}
                            alt={category.name}
                            fill
                            className="object-contain"
                            sizes="32px"
                        />
                    ) : (
                        <div className="w-full h-full bg-gray-100 rounded-lg" />
                    )}
                </div>

                {/* Category Name */}
                <span className={cn(
                    "text-sm text-gray-700 font-medium",
                    "group-hover:text-primary transition-colors duration-150"
                )}>
                    {category.name}
                </span>
            </div>

            {/* Arrow */}
            <ChevronRight
                className={cn(
                    "w-4 h-4 text-gray-400",
                    "group-hover:text-primary group-hover:translate-x-0.5",
                    "transition-all duration-150"
                )}
            />
        </Link>
    );

    return (
        <div className="hidden lg:block relative">
            {/* Categories Header Button */}
            <button
                onClick={onToggle}
                className={cn(
                    "w-full flex items-center justify-between gap-3 px-4 py-3.5",
                    "bg-primary text-white rounded-t-xl",
                    "hover:bg-primary/90 transition-colors duration-200",
                    !isOpen && "rounded-b-xl"
                )}
            >
                <div className="flex items-center gap-3">
                    <Menu className="w-5 h-5" />
                    <div className="text-left">
                        <span className="font-bold text-sm uppercase tracking-wide">Danh mục</span>
                        <p className="text-[10px] opacity-80 uppercase">
                            {totalProducts > 0 ? `${totalProducts} sản phẩm` : 'Tất cả sản phẩm'}
                        </p>
                    </div>
                </div>
                <ChevronDown
                    className={cn(
                        "w-5 h-5 transition-transform duration-300",
                        !isOpen && "-rotate-90"
                    )}
                />
            </button>

            {/* Collapsible Categories List */}
            <div
                className={cn(
                    "bg-white border border-t-0 border-gray-200",
                    "transition-all duration-300 ease-in-out",
                    isOpen ? "opacity-100" : "max-h-0 opacity-0 border-0 overflow-hidden",
                    !hasMoreCategories && "rounded-b-xl"
                )}
            >
                {/* First 10 Categories - Normal flow */}
                <div className="divide-y divide-gray-100">
                    {visibleCategories.map((category) => (
                        <CategoryItem key={category.id} category={category} />
                    ))}
                </div>

                {/* Quick Links (only show if no more categories) */}
                {!hasMoreCategories && (
                    <>
                        <div className="h-px bg-gray-200" />
                        <div className="py-2">
                            {quickLinks.map((link) => {
                                const Icon = link.icon;
                                return (
                                    <Link
                                        key={link.href}
                                        href={link.href}
                                        className={cn(
                                            "flex items-center gap-3 px-4 py-2.5",
                                            "hover:bg-gray-50 transition-colors duration-150 group"
                                        )}
                                    >
                                        <Icon className="w-4 h-4 text-gray-400 group-hover:text-primary transition-colors" />
                                        <span className="text-sm text-gray-600 group-hover:text-primary transition-colors font-medium">
                                            {link.label}
                                        </span>
                                    </Link>
                                );
                            })}
                        </div>
                    </>
                )}
            </div>

            {/* Show More Button & Overlay Dropdown */}
            {hasMoreCategories && isOpen && (
                <div className="relative">
                    {/* Show More / Show Less Button */}
                    <button
                        onClick={() => setShowAllCategories(!showAllCategories)}
                        className={cn(
                            "w-full flex items-center justify-center gap-2 py-2.5 px-4",
                            "bg-white border border-t-0 border-gray-200 rounded-b-xl",
                            "text-sm font-medium text-primary",
                            "hover:bg-gray-50 transition-colors duration-150"
                        )}
                    >
                        <ChevronDown className={cn(
                            "w-4 h-4 transition-transform duration-200",
                            showAllCategories && "rotate-180"
                        )} />
                        <span>
                            {showAllCategories
                                ? 'Thu gọn'
                                : `Xem thêm (${extraCategories.length})`
                            }
                        </span>
                    </button>

                    {/* Floating Dropdown with Extra Categories */}
                    {showAllCategories && (
                        <div
                            className={cn(
                                "absolute top-full left-0 right-0 z-50",
                                "bg-white border border-t-0 border-gray-200 rounded-b-xl",
                                "shadow-lg max-h-[300px] overflow-y-auto",
                                "animate-in fade-in slide-in-from-top-2 duration-200"
                            )}
                        >
                            <div className="divide-y divide-gray-100">
                                {extraCategories.map((category) => (
                                    <CategoryItem key={category.id} category={category} />
                                ))}
                            </div>

                            {/* Quick Links */}
                            <div className="h-px bg-gray-200" />
                            <div className="py-2">
                                {quickLinks.map((link) => {
                                    const Icon = link.icon;
                                    return (
                                        <Link
                                            key={link.href}
                                            href={link.href}
                                            className={cn(
                                                "flex items-center gap-3 px-4 py-2.5",
                                                "hover:bg-gray-50 transition-colors duration-150 group"
                                            )}
                                        >
                                            <Icon className="w-4 h-4 text-gray-400 group-hover:text-primary transition-colors" />
                                            <span className="text-sm text-gray-600 group-hover:text-primary transition-colors font-medium">
                                                {link.label}
                                            </span>
                                        </Link>
                                    );
                                })}
                            </div>
                        </div>
                    )}
                </div>
            )}

            {/* Click outside to close dropdown */}
            {showAllCategories && (
                <div
                    className="fixed inset-0 z-40"
                    onClick={() => setShowAllCategories(false)}
                />
            )}
        </div>
    );
}
