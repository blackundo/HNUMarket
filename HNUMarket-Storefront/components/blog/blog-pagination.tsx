'use client';

import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import {
    Pagination,
    PaginationContent,
    PaginationItem,
    PaginationLink,
    PaginationPrevious,
    PaginationNext,
    PaginationEllipsis,
} from '@/components/ui/pagination';

interface BlogPaginationProps {
    currentPage: number;
    totalPages: number;
    basePath?: string;
}

export function BlogPagination({
    currentPage,
    totalPages,
    basePath = '/blog',
}: BlogPaginationProps) {
    const searchParams = useSearchParams();

    if (totalPages <= 1) {
        return null;
    }

    // Build URL with page parameter
    const buildPageUrl = (page: number) => {
        const params = new URLSearchParams(searchParams.toString());
        if (page === 1) {
            params.delete('page');
        } else {
            params.set('page', String(page));
        }
        const queryString = params.toString();
        return queryString ? `${basePath}?${queryString}` : basePath;
    };

    // Generate page numbers to display
    const getPageNumbers = () => {
        const pages: (number | 'ellipsis')[] = [];
        const showEllipsisThreshold = 7;

        if (totalPages <= showEllipsisThreshold) {
            // Show all pages
            for (let i = 1; i <= totalPages; i++) {
                pages.push(i);
            }
        } else {
            // Always show first page
            pages.push(1);

            if (currentPage > 3) {
                pages.push('ellipsis');
            }

            // Show pages around current page
            const start = Math.max(2, currentPage - 1);
            const end = Math.min(totalPages - 1, currentPage + 1);

            for (let i = start; i <= end; i++) {
                pages.push(i);
            }

            if (currentPage < totalPages - 2) {
                pages.push('ellipsis');
            }

            // Always show last page
            pages.push(totalPages);
        }

        return pages;
    };

    const pageNumbers = getPageNumbers();

    return (
        <Pagination className="mt-8">
            <PaginationContent>
                {/* Previous Button */}
                <PaginationItem>
                    {currentPage > 1 ? (
                        <Link href={buildPageUrl(currentPage - 1)} passHref legacyBehavior>
                            <PaginationPrevious className="cursor-pointer">
                                Trước
                            </PaginationPrevious>
                        </Link>
                    ) : (
                        <PaginationPrevious className="pointer-events-none opacity-50">
                            Trước
                        </PaginationPrevious>
                    )}
                </PaginationItem>

                {/* Page Numbers */}
                {pageNumbers.map((page, index) => (
                    <PaginationItem key={`page-${index}`}>
                        {page === 'ellipsis' ? (
                            <PaginationEllipsis />
                        ) : (
                            <Link href={buildPageUrl(page)} passHref legacyBehavior>
                                <PaginationLink
                                    isActive={page === currentPage}
                                    className="cursor-pointer"
                                >
                                    {page}
                                </PaginationLink>
                            </Link>
                        )}
                    </PaginationItem>
                ))}

                {/* Next Button */}
                <PaginationItem>
                    {currentPage < totalPages ? (
                        <Link href={buildPageUrl(currentPage + 1)} passHref legacyBehavior>
                            <PaginationNext className="cursor-pointer">Sau</PaginationNext>
                        </Link>
                    ) : (
                        <PaginationNext className="pointer-events-none opacity-50">
                            Sau
                        </PaginationNext>
                    )}
                </PaginationItem>
            </PaginationContent>
        </Pagination>
    );
}