'use client';

import { useTable, LogicalFilter } from '@refinedev/core';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import {
  ImageIcon,
  Plus,
  Search,
  Pencil,
  Trash2,
  Eye,
  EyeOff,
  GripVertical,
  Layout,
  Package,
} from 'lucide-react';
import { useState, useCallback, useMemo } from 'react';
import { HomepageSection } from '@/lib/api/homepage-sections';
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
import { homepageSectionsApi } from '@/lib/api/homepage-sections';
import { SectionFormDialog } from './section-form-dialog';
import { useIsMobile } from '@/hooks/use-media-query';

interface SortableSectionRowProps {
  section: HomepageSection;
  onEdit: (section: HomepageSection) => void;
  onDelete: (id: string, categoryName: string) => void;
  disabled?: boolean;
}

function SortableSectionRow({
  section,
  onEdit,
  onDelete,
  disabled,
}: SortableSectionRowProps) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: section.id,
    disabled,
  });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  const { layout, products } = section.config;
  const categoryName = section.category?.name || 'N/A';
  const productCount = products.selected_product_ids.length;

  return (
    <tr ref={setNodeRef} style={style} className="border-b hover:bg-muted/50">
      <td className="p-2">
        <button
          type="button"
          className={
            disabled
              ? 'cursor-not-allowed p-1 opacity-50'
              : 'cursor-grab active:cursor-grabbing p-1 hover:bg-muted rounded'
          }
          disabled={disabled}
          {...attributes}
          {...listeners}
        >
          <GripVertical className="h-5 w-5 text-muted-foreground" />
        </button>
      </td>
      <td className="p-2">
        <div className="w-16 h-16 rounded overflow-hidden bg-muted">
          {section.category?.image_url ? (
            <img
              src={section.category.image_url}
              alt={categoryName}
              className="w-full h-full object-cover"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center">
              <ImageIcon className="h-6 w-6 text-muted-foreground" />
            </div>
          )}
        </div>
      </td>
      <td className="p-2">
        <div className="font-medium">{categoryName}</div>
      </td>
      <td className="p-2">
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Layout className="h-4 w-4" />
          <span>
            {layout.row_count} hàng • {layout.display_style} • {layout.product_limit} sản phẩm
          </span>
        </div>
      </td>
      <td className="p-2">
        <div className="flex items-center gap-2 text-sm">
          <Package className="h-4 w-4 text-muted-foreground" />
          <span>
            {productCount} thủ công
            {products.auto_fill.enabled && (
              <span className="text-muted-foreground ml-1">+ tự động</span>
            )}
          </span>
        </div>
      </td>
      <td className="p-2 text-center">
        <span className="text-sm">{section.display_order}</span>
      </td>
      <td className="p-2">
        <Badge variant={section.is_active ? 'admin' : 'secondary'}>
          {section.is_active ? (
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
          <Button variant="ghost" size="sm" onClick={() => onEdit(section)}>
            <Pencil className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => onDelete(section.id, categoryName)}
            className="text-destructive hover:text-destructive"
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      </td>
    </tr>
  );
}

function SortableSectionCard({
  section,
  onEdit,
  onDelete,
  disabled,
}: SortableSectionRowProps) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: section.id,
    disabled,
  });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  const { layout, products } = section.config;
  const categoryName = section.category?.name || 'N/A';
  const productCount = products.selected_product_ids.length;

  return (
    <div
      ref={setNodeRef}
      style={style}
      className="rounded-lg border bg-white p-4 shadow-sm"
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-start gap-3">
          <div className="w-14 h-14 rounded overflow-hidden bg-muted">
            {section.category?.image_url ? (
              <img
                src={section.category.image_url}
                alt={categoryName}
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center">
                <ImageIcon className="h-5 w-5 text-muted-foreground" />
              </div>
            )}
          </div>
          <div>
            <div className="font-medium">{categoryName}</div>
            <div className="text-xs text-muted-foreground">
              Thứ tự: {section.display_order}
            </div>
          </div>
        </div>
        <Badge variant={section.is_active ? 'admin' : 'secondary'}>
          {section.is_active ? (
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
      </div>

      <div className="mt-3 space-y-2 text-sm text-muted-foreground">
        <div className="flex items-center gap-2">
          <Layout className="h-4 w-4" />
          <span>
            {layout.row_count} hàng • {layout.display_style} • {layout.product_limit} sản phẩm
          </span>
        </div>
        <div className="flex items-center gap-2">
          <Package className="h-4 w-4" />
          <span>
            {productCount} thủ công
            {products.auto_fill.enabled && <span className="ml-1">+ tự động</span>}
          </span>
        </div>
      </div>

      <div className="mt-4 flex items-center justify-between">
        <button
          type="button"
          className={
            disabled
              ? 'cursor-not-allowed p-1 opacity-50'
              : 'cursor-grab active:cursor-grabbing p-1 hover:bg-muted rounded'
          }
          disabled={disabled}
          {...attributes}
          {...listeners}
        >
          <GripVertical className="h-5 w-5 text-muted-foreground" />
        </button>
        <div className="flex gap-2">
          <Button variant="ghost" size="sm" onClick={() => onEdit(section)}>
            <Pencil className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => onDelete(section.id, categoryName)}
            className="text-destructive hover:text-destructive"
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  );
}

export function HomepageSettingsList() {
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'inactive'>('all');
  const [reordering, setReordering] = useState(false);
  const [editingSection, setEditingSection] = useState<HomepageSection | null>(null);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const isMobile = useIsMobile();

  // Build filters from local state
  const refineFilters = useMemo((): LogicalFilter[] => {
    const filters: LogicalFilter[] = [];

    // Search filter (category name)
    if (search) {
      filters.push({
        field: 'category.name',
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
  const { tableQuery, currentPage, setCurrentPage, pageSize, setPageSize, pageCount, setFilters } =
    useTable<HomepageSection>({
      resource: 'homepage-sections',
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
        newFilters.push({ field: 'category.name', operator: 'contains', value: newSearch });
      }
      if (statusFilter !== 'all') {
        newFilters.push({
          field: 'is_active',
          operator: 'eq',
          value: statusFilter === 'active',
        });
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
        newFilters.push({ field: 'category.name', operator: 'contains', value: search });
      }
      if (newStatus !== 'all') {
        newFilters.push({ field: 'is_active', operator: 'eq', value: newStatus === 'active' });
      }

      setFilters(newFilters, 'replace');
      setCurrentPage(1);
    },
    [search, setFilters, setCurrentPage]
  );

  const { mutate: deleteSection } = useDelete();

  const handleDelete = (id: string, categoryName: string) => {
    if (confirm(`Bạn có chắc muốn xóa phần "${categoryName}" khỏi trang chủ?`)) {
      deleteSection(
        {
          resource: 'homepage-sections',
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

  const handleEdit = (section: HomepageSection) => {
    setEditingSection(section);
    setIsFormOpen(true);
  };

  const handleAdd = () => {
    setEditingSection(null);
    setIsFormOpen(true);
  };

  const handleFormClose = () => {
    setIsFormOpen(false);
    setEditingSection(null);
  };

  const handleFormSuccess = () => {
    setIsFormOpen(false);
    setEditingSection(null);
    tableQuery.refetch();
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

    const sections = data;
    const oldIndex = sections.findIndex((s) => s.id === active.id);
    const newIndex = sections.findIndex((s) => s.id === over.id);

    // Reorder array
    const reordered = [...sections];
    const [removed] = reordered.splice(oldIndex, 1);
    reordered.splice(newIndex, 0, removed);

    // Update display_order for all items
    const ids = reordered.map((s) => s.id);

    try {
      setReordering(true);
      await homepageSectionsApi.reorderHomepageSections(ids);
      tableQuery.refetch();
    } catch (error) {
      console.error('Reorder failed:', error);
    } finally {
      setReordering(false);
    }
  };

  const data = (tableQuery.data?.data || []) as HomepageSection[];
  const total = tableQuery.data?.total || 0;
  const isLoading = tableQuery.isLoading;
  const error = tableQuery.error;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight flex items-center gap-2 font-heading">
            Quản lý Trang chủ
          </h1>
          <p className="text-muted-foreground mt-1 font-body">
            Tùy chỉnh các phần hiển thị sản phẩm trên trang chủ
          </p>
        </div>
        <Button
          onClick={handleAdd}
          className="w-full bg-admin-primary text-white hover:bg-admin-primary/80 sm:w-auto"
        >
          <Plus className="h-4 w-4 mr-2" />
          Thêm phần
        </Button>
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
            Tìm phần theo danh mục hoặc trạng thái
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col gap-4 md:flex-row">
            <div className="relative w-full md:flex-1 md:max-w-sm">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Tìm kiếm theo danh mục..."
                value={search}
                onChange={(e) => handleSearchChange(e.target.value)}
                className="pl-10"
              />
            </div>
            <select
              value={statusFilter}
              onChange={(e) =>
                handleStatusFilterChange(e.target.value as 'all' | 'active' | 'inactive')
              }
              className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 md:w-56"
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
              <CardTitle className="font-heading">Danh sách phần ({total})</CardTitle>
              <CardDescription className="font-body">
                Kéo thả để sắp xếp lại thứ tự hiển thị
              </CardDescription>
            </div>
            {reordering && <Badge variant="secondary">Đang cập nhật...</Badge>}
          </div>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="text-center py-8 text-muted-foreground">Đang tải dữ liệu...</div>
          ) : data.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              Không tìm thấy phần nào.{' '}
              <button onClick={handleAdd} className="text-admin-primary hover:underline">
                Tạo phần đầu tiên
              </button>
            </div>
          ) : (
            <div className={reordering ? 'pointer-events-none opacity-50' : ''}>
              <DndContext
                sensors={sensors}
                collisionDetection={closestCenter}
                onDragEnd={handleDragEnd}
              >
                {isMobile ? (
                  <SortableContext
                    items={data.map((s) => s.id)}
                    strategy={verticalListSortingStrategy}
                    disabled={isLoading || reordering}
                  >
                    <div className="space-y-4">
                      {data.map((section) => (
                        <SortableSectionCard
                          key={section.id}
                          section={section}
                          onEdit={handleEdit}
                          onDelete={handleDelete}
                          disabled={isLoading || reordering}
                        />
                      ))}
                    </div>
                  </SortableContext>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead>
                        <tr className="border-b">
                          <th className="p-2 text-left w-10"></th>
                          <th className="p-2 text-left">Hình</th>
                          <th className="p-2 text-left">Danh mục</th>
                          <th className="p-2 text-left">Cấu hình hiển thị</th>
                          <th className="p-2 text-left">Sản phẩm</th>
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
                          {data.map((section) => (
                            <SortableSectionRow
                              key={section.id}
                              section={section}
                              onEdit={handleEdit}
                              onDelete={handleDelete}
                              disabled={isLoading || reordering}
                            />
                          ))}
                        </tbody>
                      </SortableContext>
                    </table>
                  </div>
                )}
              </DndContext>
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

      {/* Form Dialog */}
      <SectionFormDialog
        open={isFormOpen}
        onClose={handleFormClose}
        onSuccess={handleFormSuccess}
        section={editingSection}
      />
    </div>
  );
}
