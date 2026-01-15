'use client';

import { Table } from '@tanstack/react-table';
import { ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

interface ProductsPaginationProps<TData> {
  table: Table<TData>;
  total: number;
}

/**
 * Pagination controls with page navigation and page size selector
 * Shows "Showing X-Y of Z products"
 */
export function ProductsPagination<TData>({
  table,
  total,
}: ProductsPaginationProps<TData>) {
  const pageIndex = table.getState().pagination.pageIndex;
  const pageSize = table.getState().pagination.pageSize;
  const pageCount = table.getPageCount();

  const from = pageIndex * pageSize + 1;
  const to = Math.min((pageIndex + 1) * pageSize, total);

  // Generate page buttons (max 7 visible with ellipsis)
  const getPageButtons = () => {
    const buttons: (number | 'ellipsis')[] = [];
    const maxVisible = 7;

    if (pageCount <= maxVisible) {
      // Show all pages
      for (let i = 0; i < pageCount; i++) {
        buttons.push(i);
      }
    } else {
      // Show first, last, and pages around current
      if (pageIndex <= 3) {
        // Near start
        for (let i = 0; i < 5; i++) {
          buttons.push(i);
        }
        buttons.push('ellipsis');
        buttons.push(pageCount - 1);
      } else if (pageIndex >= pageCount - 4) {
        // Near end
        buttons.push(0);
        buttons.push('ellipsis');
        for (let i = pageCount - 5; i < pageCount; i++) {
          buttons.push(i);
        }
      } else {
        // Middle
        buttons.push(0);
        buttons.push('ellipsis');
        buttons.push(pageIndex - 1);
        buttons.push(pageIndex);
        buttons.push(pageIndex + 1);
        buttons.push('ellipsis');
        buttons.push(pageCount - 1);
      }
    }

    return buttons;
  };

  return (
    <div className="flex flex-col sm:flex-row items-center justify-between gap-4 px-2">
      {/* Total count display */}
      <div className="text-sm text-muted-foreground">
        Hiển thị <span className="font-medium">{from}</span>-
        <span className="font-medium">{to}</span> trong{' '}
        <span className="font-medium">{total}</span> sản phẩm
      </div>

      <div className="flex flex-col sm:flex-row items-center gap-4">
        {/* Page size selector */}
        <div className="flex items-center gap-2">
          <span className="text-sm text-muted-foreground">Hiển thị:</span>
          <Select
            value={String(pageSize)}
            onValueChange={(value) => {
              table.setPageSize(Number(value));
            }}
          >
            <SelectTrigger className="h-8 w-[70px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent side="top">
              {[10, 25, 50, 100].map((size) => (
                <SelectItem key={size} value={String(size)}>
                  {size}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Page navigation */}
        <div className="flex items-center gap-2">
          {/* First page */}
          <Button
            variant="outline"
            size="icon"
            className="h-8 w-8"
            onClick={() => table.setPageIndex(0)}
            disabled={!table.getCanPreviousPage()}
          >
            <ChevronsLeft className="h-4 w-4" />
          </Button>

          {/* Previous page */}
          <Button
            variant="outline"
            size="icon"
            className="h-8 w-8"
            onClick={() => table.previousPage()}
            disabled={!table.getCanPreviousPage()}
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>

          {/* Page numbers */}
          <div className="flex items-center gap-1">
            {getPageButtons().map((page, index) =>
              page === 'ellipsis' ? (
                <span key={`ellipsis-${index}`} className="px-2 text-muted-foreground">
                  ...
                </span>
              ) : (
                <Button
                  key={page}
                  variant={pageIndex === page ? 'admin' : 'outline'}
                  size="icon"
                  className="h-8 w-8"
                  onClick={() => table.setPageIndex(page)}
                >
                  {page + 1}
                </Button>
              )
            )}
          </div>

          {/* Next page */}
          <Button
            variant="outline"
            size="icon"
            className="h-8 w-8"
            onClick={() => table.nextPage()}
            disabled={!table.getCanNextPage()}
          >
            <ChevronRight className="h-4 w-4" />
          </Button>

          {/* Last page */}
          <Button
            variant="outline"
            size="icon"
            className="h-8 w-8"
            onClick={() => table.setPageIndex(pageCount - 1)}
            disabled={!table.getCanNextPage()}
          >
            <ChevronsRight className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  );
}
