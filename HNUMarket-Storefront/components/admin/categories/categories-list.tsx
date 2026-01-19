'use client';

import { useTable, LogicalFilter } from '@refinedev/core';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { FolderTree, Plus, Search, Pencil, Trash2, Eye, EyeOff, GripVertical } from 'lucide-react';
import { useState, useCallback, useMemo, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Category, categoriesApi } from '@/lib/api/categories';
import { useDelete } from '@refinedev/core';
import { toast } from 'sonner';
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
} from '@dnd-kit/core';
import {
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
  useSortable,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';

interface SortableCategoryRowProps {
  category: Category;
  onEdit: (id: string) => void;
  onDelete: (id: string, name: string) => void;
  disabled?: boolean;
}

function SortableCategoryRow({ category, onEdit, onDelete, disabled }: SortableCategoryRowProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: category.id, disabled });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  const formatDate = (date: string) => {
    return new Date(date).toLocaleDateString('vi-VN', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  return (
    <tr ref={setNodeRef} style={style} className="border-b transition-colors hover:bg-muted/50">
      <td className="p-2 md:p-4">
        <button
          type="button"
          className={disabled ? "cursor-not-allowed p-1 opacity-50" : "cursor-grab active:cursor-grabbing p-1 hover:bg-muted rounded"}
          disabled={disabled}
          {...attributes}
          {...listeners}
        >
          <GripVertical className="h-5 w-5 text-muted-foreground" />
        </button>
      </td>
      <td className="p-2 md:p-4">
        <div className="flex items-center gap-3">
          {category.image_url && (
            <img
              src={category.image_url}
              alt={category.name}
              className="h-10 w-10 rounded object-cover flex-shrink-0"
            />
          )}
          <div className="min-w-0">
            <div className="font-medium font-heading truncate">{category.name}</div>
            {category.description && (
              <div className="text-sm text-muted-foreground font-body line-clamp-1">
                {category.description}
              </div>
            )}
          </div>
        </div>
      </td>
      <td className="p-4 hidden lg:table-cell">
        <code className="text-xs bg-gray-100 px-2 py-1 rounded font-mono">
          {category.slug}
        </code>
      </td>
      <td className="p-4 hidden md:table-cell">
        {category.parent ? (
          <span className="text-sm font-body">{category.parent.name}</span>
        ) : (
          <span className="text-sm text-muted-foreground font-body">—</span>
        )}
      </td>
      <td className="p-4 hidden md:table-cell">
        <span className="text-sm font-body">{category.display_order}</span>
      </td>
      <td className="p-4">
        <Badge variant={category.is_active ? 'admin' : 'secondary'} className="whitespace-nowrap">
          {category.is_active ? (
            <>
              <Eye className="h-3 w-3 mr-1 inline" />
              Hoạt động
            </>
          ) : (
            <>
              <EyeOff className="h-3 w-3 mr-1 inline" />
              Ẩn
            </>
          )}
        </Badge>
      </td>
      <td className="p-4 hidden xl:table-cell">
        <span className="text-sm text-muted-foreground font-body">
          {formatDate(category.created_at)}
        </span>
      </td>
      <td className="p-2 md:p-4 text-right">
        <div className="flex justify-end gap-1 md:gap-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => onEdit(category.id)}
            title="Sửa"
            className="h-8 w-8 p-0 md:h-9 md:w-auto md:px-3"
          >
            <Pencil className="h-4 w-4 md:mr-2" />
            <span className="hidden md:inline">Sửa</span>
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => onDelete(category.id, category.name)}
            title="Xóa"
            className="h-8 w-8 p-0 md:h-9 md:w-auto md:px-3"
          >
            <Trash2 className="h-4 w-4 text-destructive md:mr-2" />
            <span className="hidden md:inline">Xóa</span>
          </Button>
        </div>
      </td>
    </tr>
  );
}

export function CategoriesList() {
  const router = useRouter();
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'inactive'>('all');
  const [reordering, setReordering] = useState(false);

  // Build filters - will be used in useTable's filters.permanent
  const permanentFilters = useMemo((): LogicalFilter[] => {
    const filters: LogicalFilter[] = [];

    // Search filter
    if (search) {
      filters.push({
        field: 'name',
        operator: 'contains',
        value: search,
      });
    }

    // Status filter
    if (statusFilter !== 'all') {
      filters.push({
        field: 'is_active',
        operator: 'eq',
        value: statusFilter === 'active',
      });
    }

    return filters;
  }, [search, statusFilter]);

  // Use useTable hook from Refine
  const {
    tableQuery,
    currentPage,
    setCurrentPage,
    pageSize,
    setPageSize,
    pageCount,
    sorters,
    setSorters,
  } = useTable<Category>({
    resource: 'categories',
    pagination: {
      mode: 'server',
      pageSize: 10,
    },
    sorters: {
      mode: 'server',
      initial: [
        {
          field: 'display_order',
          order: 'asc',
        },
      ],
    },
    filters: {
      mode: 'server',
      permanent: permanentFilters,
    },
  });

  // Reset to page 1 when filters change
  useEffect(() => {
    if (currentPage !== 1) {
      setCurrentPage(1);
    }
  }, [permanentFilters]); // eslint-disable-line react-hooks/exhaustive-deps

  // Handle search change
  const handleSearchChange = useCallback(
    (newSearch: string) => {
      setSearch(newSearch);
    },
    []
  );

  // Handle status filter change
  const handleStatusFilterChange = useCallback(
    (newStatus: 'all' | 'active' | 'inactive') => {
      setStatusFilter(newStatus);
    },
    []
  );

  // Drag and drop sensors
  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  // Handle drag end
  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event;

    if (!over || active.id === over.id) return;

    const categories = data;
    const oldIndex = categories.findIndex((c) => c.id === active.id);
    const newIndex = categories.findIndex((c) => c.id === over.id);

    if (oldIndex === -1 || newIndex === -1) return;

    // Check if dragged categories have the same parent
    const activeCategory = categories[oldIndex];
    const overCategory = categories[newIndex];

    if (activeCategory.parent_id !== overCategory.parent_id) {
      toast('Chỉ có thể sắp xếp danh mục cùng cấp độ');
      return;
    }

    // Reorder array
    const reordered = [...categories];
    const [removed] = reordered.splice(oldIndex, 1);
    reordered.splice(newIndex, 0, removed);

    // Update display_order for all items with same parent
    const parentId = activeCategory.parent_id;
    const sameLevelCategories = reordered.filter(c => c.parent_id === parentId);
    const ids = sameLevelCategories.map((c) => c.id);

    try {
      setReordering(true);
      await categoriesApi.reorderCategories(ids);
      tableQuery.refetch();
    } catch (error) {
      console.error('Reorder failed:', error);
      toast.error('Không thể sắp xếp lại danh mục. Vui lòng thử lại.');
    } finally {
      setReordering(false);
    }
  };

  const { mutate: deleteCategory } = useDelete();

  const handleEdit = (id: string) => {
    router.push(`/admin/categories/${id}/edit`);
  };

  const handleDelete = (id: string, name: string) => {
    if (confirm(`Bạn có chắc muốn xóa danh mục "${name}"?`)) {
      deleteCategory(
        {
          resource: 'categories',
          id,
        },
        {
          onSuccess: () => {
            // Refetch will be handled automatically by Refine
          },
        }
      );
    }
  };

  const data = (tableQuery.data?.data || []) as Category[];
  const total = tableQuery.data?.total || 0;
  const isLoading = tableQuery.isLoading;
  const error = tableQuery.error;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight flex items-center gap-2 font-heading">
            Quản lý danh mục
          </h1>
          <p className="text-muted-foreground mt-1 font-body">
            Quản lý danh mục sản phẩm và cấu trúc phân cấp
          </p>
        </div>
        <Link href="/admin/categories/new">
          <Button className="bg-admin-primary text-white hover:bg-admin-primary/80">
            <Plus className="h-4 w-4 mr-2" />
            Thêm danh mục
          </Button>
        </Link>
      </div>

      {/* Error Alert */}
      {error && (
        <Alert variant="destructive">
          <AlertDescription>
            Lỗi khi tải dữ liệu: {error instanceof Error ? error.message : 'Unknown error'}
          </AlertDescription>
        </Alert>
      )}

      {/* Search and Filters */}
      <Card>
        <CardHeader>
          <CardTitle className="font-heading">Tìm kiếm & Lọc</CardTitle>
          <CardDescription className="font-body">
            Tìm danh mục theo tên hoặc trạng thái
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex gap-4">
            <div className="relative flex-1 max-w-sm">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Tìm kiếm danh mục..."
                value={search}
                onChange={(e) => handleSearchChange(e.target.value)}
                className="pl-10"
              />
            </div>
            <select
              value={statusFilter}
              onChange={(e) => handleStatusFilterChange(e.target.value as 'all' | 'active' | 'inactive')}
              className="rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
            >
              <option value="all">Tất cả trạng thái</option>
              <option value="active">Hoạt động</option>
              <option value="inactive">Không hoạt động</option>
            </select>
          </div>
        </CardContent>
      </Card>

      {/* Categories Table */}
      <Card>
        <CardHeader>
          <CardTitle className="font-heading">Tất cả danh mục</CardTitle>
          <CardDescription className="font-body">
            {isLoading ? 'Đang tải...' : reordering ? 'Đang sắp xếp...' : `${total} danh mục`}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex justify-center py-8">
              <div className="animate-spin h-8 w-8 border-4 border-admin-primary border-t-transparent rounded-full"></div>
            </div>
          ) : !data || data.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <FolderTree className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>Không tìm thấy danh mục</p>
            </div>
          ) : (
            <div className={reordering ? 'pointer-events-none opacity-50' : ''}>
              <div className="rounded-md border">
                <DndContext
                  sensors={sensors}
                  collisionDetection={closestCenter}
                  onDragEnd={handleDragEnd}
                >
                  <div className="overflow-x-auto">
                    <table className="w-full min-w-[600px] md:min-w-full">
                      <thead>
                        <tr className="border-b bg-muted/50">
                          <th className="h-12 px-4 w-12"></th>
                          <th className="h-12 px-4 text-left align-middle font-medium font-heading">Danh mục</th>
                          <th className="h-12 px-4 text-left align-middle font-medium font-heading hidden lg:table-cell">Slug</th>
                          <th className="h-12 px-4 text-left align-middle font-medium font-heading hidden md:table-cell">Danh mục cha</th>
                          <th className="h-12 px-4 text-left align-middle font-medium font-heading hidden md:table-cell">Thứ tự</th>
                          <th className="h-12 px-4 text-left align-middle font-medium font-heading">Trạng thái</th>
                          <th className="h-12 px-4 text-left align-middle font-medium font-heading hidden xl:table-cell">Ngày tạo</th>
                          <th className="h-12 px-4 text-right align-middle font-medium font-heading">Thao tác</th>
                        </tr>
                      </thead>
                      <SortableContext
                        items={data.map(c => c.id)}
                        strategy={verticalListSortingStrategy}
                        disabled={isLoading || reordering}
                      >
                        <tbody>
                          {data.map((category) => (
                            <SortableCategoryRow
                              key={category.id}
                              category={category}
                              onEdit={handleEdit}
                              onDelete={handleDelete}
                              disabled={isLoading || reordering}
                            />
                          ))}
                        </tbody>
                      </SortableContext>
                    </table>
                  </div>
                </DndContext>

                {/* Pagination */}
                {pageCount > 1 && (
                  <div className="flex items-center justify-between px-4 py-4 border-t">
                    <div className="text-sm text-muted-foreground font-body">
                      Trang {currentPage} / {pageCount}
                    </div>
                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setCurrentPage((prev) => Math.max(1, prev - 1))}
                        disabled={currentPage === 1}
                      >
                        Trước
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setCurrentPage((prev) => Math.min(pageCount, prev + 1))}
                        disabled={currentPage === pageCount}
                      >
                        Sau
                      </Button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
