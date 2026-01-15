'use client';

import type { MouseEvent, ReactNode } from 'react';
import {
  ColumnDef,
  SortingState,
  flexRender,
  getCoreRowModel,
  getSortedRowModel,
  getPaginationRowModel,
  useReactTable,
  PaginationState,
} from '@tanstack/react-table';
import {
  ContextMenu,
  ContextMenuTrigger,
} from '@/components/ui/context-menu';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Package } from 'lucide-react';
import { DataTableViewOptions } from './data-table-view-options';
import { ProductsPagination } from './products-pagination';
import { cn } from '@/lib/utils';

interface ProductsDataTableProps<TData, TValue> {
  columns: ColumnDef<TData, TValue>[];
  data: TData[];
  total: number;
  isLoading: boolean;
  sorting: SortingState;
  setSorting: (updater: SortingState | ((old: SortingState) => SortingState)) => void;
  pagination: PaginationState;
  setPagination: (updater: PaginationState | ((old: PaginationState) => PaginationState)) => void;
  pageCount: number;
  onRowClick?: (row: TData) => void;
  renderRowContextMenu?: (row: TData) => ReactNode;
  renderMobileCard?: (row: TData) => ReactNode;
}

/**
 * Main TanStack Table component for products
 * Handles sorting, pagination, and column visibility
 */
export function ProductsDataTable<TData, TValue>({
  columns,
  data,
  total,
  isLoading,
  sorting,
  setSorting,
  pagination,
  setPagination,
  pageCount,
  onRowClick,
  renderRowContextMenu,
  renderMobileCard,
}: ProductsDataTableProps<TData, TValue>) {
  const table = useReactTable({
    data,
    columns,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    onSortingChange: setSorting,
    onPaginationChange: setPagination,
    state: {
      sorting,
      pagination,
    },
    pageCount: pageCount,
    manualPagination: true,
    manualSorting: true,
  });

  const handleRowClick = (
    event: MouseEvent<HTMLElement>,
    rowData: TData
  ) => {
    if (!onRowClick) return;
    const target = event.target as HTMLElement | null;
    if (!target) {
      onRowClick(rowData);
      return;
    }

    const isInteractive = !!target.closest(
      'button, a, input, textarea, select, [role="button"], [data-no-row-click]'
    );
    if (!isInteractive) {
      onRowClick(rowData);
    }
  };

  const rows = table.getRowModel().rows;

  return (
    <div className="space-y-4">
      {/* Toolbar with column visibility */}
      <div className={cn('flex items-center justify-end', renderMobileCard && 'hidden md:flex')}>
        <DataTableViewOptions table={table} />
      </div>

      {renderMobileCard && (
        <div className="space-y-4 md:hidden">
          {isLoading ? (
            [...Array(3)].map((_, index) => (
              <div key={index} className="rounded-md border p-4">
                <div className="h-20 bg-gray-200 animate-pulse rounded" />
              </div>
            ))
          ) : rows.length ? (
            rows.map((row) => {
              const card = (
                <div
                  key={row.id}
                  className={cn(
                    'rounded-md border bg-white p-4 shadow-sm',
                    onRowClick && 'cursor-pointer'
                  )}
                  onClick={(event) => handleRowClick(event, row.original)}
                >
                  {renderMobileCard(row.original)}
                </div>
              );

              if (!renderRowContextMenu) {
                return card;
              }

              return (
                <ContextMenu key={row.id}>
                  <ContextMenuTrigger asChild>{card}</ContextMenuTrigger>
                  {renderRowContextMenu(row.original)}
                </ContextMenu>
              );
            })
          ) : (
            <div className="rounded-md border bg-white py-12 text-center">
              <div className="flex flex-col items-center justify-center text-muted-foreground">
                <Package className="h-10 w-10 mb-3 opacity-50" />
                <p>Không tìm thấy sản phẩm</p>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Table */}
      <div className={cn('rounded-md border', renderMobileCard && 'hidden md:block')}>
        <Table>
          <TableHeader>
            {table.getHeaderGroups().map((headerGroup) => (
              <TableRow key={headerGroup.id}>
                {headerGroup.headers.map((header) => {
                  return (
                    <TableHead key={header.id} className="font-heading font-semibold">
                      {header.isPlaceholder
                        ? null
                        : flexRender(
                          header.column.columnDef.header,
                          header.getContext()
                        )}
                    </TableHead>
                  );
                })}
              </TableRow>
            ))}
          </TableHeader>
          <TableBody>
            {isLoading ? (
              // Loading skeleton (3 rows)
              <>
                {[...Array(3)].map((_, i) => (
                  <TableRow key={i}>
                    {columns.map((_, j) => (
                      <TableCell key={j}>
                        <div className="h-8 bg-gray-200 animate-pulse rounded" />
                      </TableCell>
                    ))}
                  </TableRow>
                ))}
              </>
            ) : rows?.length ? (
              rows.map((row) => {
                const rowContent = (
                  <TableRow
                    key={row.id}
                    data-state={row.getIsSelected() && 'selected'}
                    className={cn(
                      'hover:bg-slate-50 transition-colors font-body',
                      onRowClick && 'cursor-pointer'
                    )}
                    onClick={(event) => handleRowClick(event, row.original)}
                  >
                    {row.getVisibleCells().map((cell) => (
                      <TableCell key={cell.id}>
                        {flexRender(cell.column.columnDef.cell, cell.getContext())}
                      </TableCell>
                    ))}
                  </TableRow>
                );

                if (!renderRowContextMenu) {
                  return rowContent;
                }

                return (
                  <ContextMenu key={row.id}>
                    <ContextMenuTrigger asChild>
                      {rowContent}
                    </ContextMenuTrigger>
                    {renderRowContextMenu(row.original)}
                  </ContextMenu>
                );
              })
            ) : (
              // Empty state
              <TableRow>
                <TableCell colSpan={columns.length} className="h-24 text-center">
                  <div className="flex flex-col items-center justify-center text-muted-foreground">
                    <Package className="h-12 w-12 mb-4 opacity-50" />
                    <p>Không tìm thấy sản phẩm</p>
                  </div>
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      {/* Pagination */}
      {!isLoading && total > 0 && (
        <ProductsPagination table={table} total={total} />
      )}
    </div>
  );
}
