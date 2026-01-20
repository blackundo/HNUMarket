'use client';

import { useState } from 'react';
import { CategoriesSidebar } from './categories-sidebar';
import { HeroSlider } from './hero-slider';

interface Category {
    id: string;
    name: string;
    slug: string;
    description?: string;
    image?: string;
    productCount?: number;
}

interface HeroSectionProps {
    categories: Category[];
}

export function HeroSection({ categories }: HeroSectionProps) {
    const [isSidebarOpen, setIsSidebarOpen] = useState(true);

    // Calculate total products from categories
    const totalProducts = categories.reduce(
        (sum, cat) => sum + (cat.productCount || 0),
        0
    );

    const toggleSidebar = () => {
        setIsSidebarOpen(!isSidebarOpen);
    };

    return (
        <section className="bg-gray-200 py-4 sm:py-6">
            <div className="max-w-screen mx-auto px-4">
                <div className="flex gap-4">
                    {/* Categories Sidebar - Desktop only (lg+), 20% width */}
                    <div className="hidden lg:block w-1/5">
                        <CategoriesSidebar
                            categories={categories}
                            isOpen={isSidebarOpen}
                            onToggle={toggleSidebar}
                            totalProducts={totalProducts}
                        />
                    </div>

                    {/* Hero Slider - Full width on mobile, 80% on desktop */}
                    <div className="w-full lg:w-4/5">
                        <HeroSlider />
                    </div>
                </div>
            </div>
        </section>
    );
}
