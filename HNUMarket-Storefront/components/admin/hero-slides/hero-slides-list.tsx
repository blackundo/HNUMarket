'use client';

import { useTable, LogicalFilter } from '@refinedev/core';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { ImageIcon, Plus, Search, Pencil, Trash2, Eye, EyeOff, GripVertical } from 'lucide-react';
import { useState, useCallback, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { HeroSlide } from '@/lib/api/hero-slides';
import { useDelete } from '@refinedev/core';
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
  useSortable,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { heroSlidesApi } from '@/lib/api/hero-slides';

interface SortableSlideRowProps {
  slide: HeroSlide;
  onEdit: (id: string) => void;
  onDelete: (id: string, title: string) => void;
  disabled?: boolean;
}

function SortableSlideRow({ slide, onEdit, onDelete, disabled }: SortableSlideRowProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: slide.id, disabled });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  return (
    <tr ref={setNodeRef} style={style} className="border-b hover:bg-muted/50">
      <td className="p-2">
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
      <td className="p-2">
        <div
          className={`w-24 aspect-[16/9] rounded overflow-hidden bg-gradient-to-br ${slide.gradient || 'from-gray-400 to-gray-500'}`}
        >
          {slide.image_url ? (
            <img
              src={slide.image_url}
              alt={slide.title}
              className="w-full h-full object-cover"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center">
              <ImageIcon className="h-6 w-6 text-white/50" />
            </div>
          )}
        </div>
      </td>
      <td className="p-2">
        <div>
          <div className="font-medium">{slide.title}</div>
          {slide.subtitle && (
            <div className="text-sm text-muted-foreground">{slide.subtitle}</div>
          )}
        </div>
      </td>
      <td className="p-2">
        <code className="text-xs bg-muted px-2 py-1 rounded">{slide.link}</code>
      </td>
      <td className="p-2 text-center">
        <span className="text-sm">{slide.display_order}</span>
      </td>
      <td className="p-2">
        <Badge variant={slide.is_active ? 'admin' : 'secondary'}>
          {slide.is_active ? (
            <>
              <Eye className="h-3 w-3 mr-1" />
              Hiển thị
            </>
          ) : (
            <>
              <EyeOff className="h-3 w-3 mr-1" />
              Ẩn
            </>
          )}
        </Badge>
      </td>
      <td className="p-2">
        <div className="flex gap-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => onEdit(slide.id)}
          >
            <Pencil className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => onDelete(slide.id, slide.title)}
            className="text-destructive hover:text-destructive"
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      </td>
    </tr>
  );
}

export function HeroSlidesList() {
  const router = useRouter();
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'inactive'>('all');
  const [reordering, setReordering] = useState(false);

  // Build filters from local state
  const refineFilters = useMemo((): LogicalFilter[] => {
    const filters: LogicalFilter[] = [];

    // Search filter
    if (search) {
      filters.push({
        field: 'title',
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
    setFilters,
  } = useTable<HeroSlide>({
    resource: 'hero-slides',
    pagination: {
      mode: 'server',
      pageSize: 20,
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
      initial: [],
    },
  });

  // Handle search change
  const handleSearchChange = useCallback(
    (newSearch: string) => {
      setSearch(newSearch);
      const newFilters: LogicalFilter[] = [];

      if (newSearch) {
        newFilters.push({ field: 'title', operator: 'contains', value: newSearch });
      }
      if (statusFilter !== 'all') {
        newFilters.push({ field: 'is_active', operator: 'eq', value: statusFilter === 'active' });
      }

      setFilters(newFilters, 'replace');
      setCurrentPage(1);
    },
    [statusFilter, setFilters, setCurrentPage]
  );

  // Handle status filter change
  const handleStatusFilterChange = useCallback(
    (newStatus: 'all' | 'active' | 'inactive') => {
      setStatusFilter(newStatus);
      const newFilters: LogicalFilter[] = [];

      if (search) {
        newFilters.push({ field: 'title', operator: 'contains', value: search });
      }
      if (newStatus !== 'all') {
        newFilters.push({ field: 'is_active', operator: 'eq', value: newStatus === 'active' });
      }

      setFilters(newFilters, 'replace');
      setCurrentPage(1);
    },
    [search, setFilters, setCurrentPage]
  );

  const { mutate: deleteSlide } = useDelete();

  const handleDelete = (id: string, title: string) => {
    if (confirm(`Bạn có chắc muốn xóa slide "${title}"?`)) {
      deleteSlide(
        {
          resource: 'hero-slides',
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

  const handleEdit = (id: string) => {
    router.push(`/admin/hero-slides/${id}/edit`);
  };

  // Drag and drop handlers
  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event;

    if (!over || active.id === over.id) return;

    const slides = data;
    const oldIndex = slides.findIndex((s) => s.id === active.id);
    const newIndex = slides.findIndex((s) => s.id === over.id);

    // Reorder array
    const reordered = [...slides];
    const [removed] = reordered.splice(oldIndex, 1);
    reordered.splice(newIndex, 0, removed);

    // Update display_order for all items
    const ids = reordered.map((s) => s.id);

    try {
      setReordering(true);
      await heroSlidesApi.reorderHeroSlides(ids);
      tableQuery.refetch();
    } catch (error) {
      console.error('Reorder failed:', error);
    } finally {
      setReordering(false);
    }
  };

  const data = (tableQuery.data?.data || []) as HeroSlide[];
  const total = tableQuery.data?.total || 0;
  const isLoading = tableQuery.isLoading;
  const error = tableQuery.error;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight flex items-center gap-2 font-heading">
            Quản lý Hero Slider
          </h1>
          <p className="text-muted-foreground mt-1 font-body">
            Quản lý các slide banner hiển thị trên trang chủ
          </p>
        </div>
        <Link href="/admin/hero-slides/new">
          <Button className="bg-admin-primary text-white hover:bg-admin-primary/80">
            <Plus className="h-4 w-4 mr-2" />
            Thêm slide
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
            Tìm slide theo tiêu đề hoặc trạng thái
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex gap-4">
            <div className="relative flex-1 max-w-sm">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Tìm kiếm slide..."
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
              <option value="active">Đang hiển thị</option>
              <option value="inactive">Đã ẩn</option>
            </select>
          </div>
        </CardContent>
      </Card>

      {/* Table */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="font-heading">
                Danh sách slides ({total})
              </CardTitle>
              <CardDescription className="font-body">
                Kéo thả để sắp xếp lại thứ tự hiển thị
              </CardDescription>
            </div>
            {reordering && (
              <Badge variant="secondary">Đang cập nhật...</Badge>
            )}
          </div>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="text-center py-8 text-muted-foreground">
              Đang tải dữ liệu...
            </div>
          ) : data.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              Không tìm thấy slide nào. <Link href="/admin/hero-slides/new" className="text-admin-primary hover:underline">Tạo slide đầu tiên</Link>
            </div>
          ) : (
            <div className={reordering ? 'pointer-events-none opacity-50' : ''}>
              <div className="overflow-x-auto">
                <DndContext
                  sensors={sensors}
                  collisionDetection={closestCenter}
                  onDragEnd={handleDragEnd}
                >
                  <table className="w-full">
                    <thead>
                      <tr className="border-b">
                        <th className="p-2 text-left w-10"></th>
                        <th className="p-2 text-left">Hình ảnh</th>
                        <th className="p-2 text-left">Tiêu đề</th>
                        <th className="p-2 text-left">Liên kết</th>
                        <th className="p-2 text-center w-20">Thứ tự</th>
                        <th className="p-2 text-left w-32">Trạng thái</th>
                        <th className="p-2 text-left w-24">Hành động</th>
                      </tr>
                    </thead>
                    <SortableContext
                      items={data.map((s) => s.id)}
                      strategy={verticalListSortingStrategy}
                      disabled={isLoading || reordering}
                    >
                      <tbody>
                        {data.map((slide) => (
                          <SortableSlideRow
                            key={slide.id}
                            slide={slide}
                            onEdit={handleEdit}
                            onDelete={handleDelete}
                            disabled={isLoading || reordering}
                          />
                        ))}
                      </tbody>
                    </SortableContext>
                  </table>
                </DndContext>
              </div>
            </div>
          )}

          {/* Pagination */}
          {pageCount > 1 && (
            <div className="flex items-center justify-between mt-4 pt-4 border-t">
              <div className="text-sm text-muted-foreground">
                Trang {currentPage} / {pageCount}
              </div>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentPage(currentPage - 1)}
                  disabled={currentPage === 1}
                >
                  Trước
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentPage(currentPage + 1)}
                  disabled={currentPage === pageCount}
                >
                  Sau
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
