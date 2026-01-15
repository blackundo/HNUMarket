'use client';

import { useList, useDelete } from '@refinedev/core';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { FileText, Search, Plus, Pencil, Trash2 } from 'lucide-react';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

export function PagesList() {
  const router = useRouter();
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState('');

  const listQuery = useList({
    resource: 'pages',
    filters: [
      ...(search ? [{ field: 'title', operator: 'contains' as const, value: search }] : []),
      ...(status ? [{ field: 'status', operator: 'eq' as const, value: status }] : []),
    ],
    pagination: {
      mode: 'server' as const,
    },
  });

  const data = listQuery.result?.data || [];
  const total = listQuery.result?.total || 0;
  const isLoading = listQuery.query.isLoading || false;
  const error = listQuery.query.error;

  useEffect(() => {
    console.log('[PagesList] Full query result:', listQuery);
    console.log('[PagesList] Parsed:', { data, total, isLoading, error });
  }, [listQuery, data, total, isLoading, error]);

  const { mutate: deletePage } = useDelete();

  const handleDelete = (id: string) => {
    if (confirm('Bạn có chắc muốn xóa trang này?')) {
      deletePage(
        {
          resource: 'pages',
          id,
        },
        {
          onSuccess: () => {
            // Refetch handled by Refine
          },
        }
      );
    }
  };

  const formatDate = (date: string) => {
    return new Date(date).toLocaleDateString('vi-VN', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'published':
        return <Badge className="bg-green-100 text-green-800">Đã xuất bản</Badge>;
      case 'draft':
        return <Badge className="bg-yellow-100 text-yellow-800">Bản nháp</Badge>;
      case 'archived':
        return <Badge className="bg-gray-100 text-gray-800">Đã lưu trữ</Badge>;
      default:
        return <Badge>{status}</Badge>;
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight flex items-center gap-2">

            Quản lý trang tĩnh
          </h1>
          <p className="text-muted-foreground mt-1">
            Quản lý nội dung các trang tĩnh như About, Terms, Policy
          </p>
        </div>
        <Link href="/admin/pages/new">
          <Button>
            <Plus className="h-4 w-4 mr-2" />
            Trang mới
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
          <CardTitle>Tìm kiếm & Lọc</CardTitle>
          <CardDescription>Tìm trang theo tiêu đề hoặc trạng thái</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex gap-4">
            <div className="relative flex-1 max-w-sm">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Tìm kiếm trang..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-10"
              />
            </div>
            <select
              value={status}
              onChange={(e) => setStatus(e.target.value)}
              className="rounded-md border border-gray-300 px-3 py-2 text-sm"
            >
              <option value="">Tất cả trạng thái</option>
              <option value="draft">Bản nháp</option>
              <option value="published">Đã xuất bản</option>
              <option value="archived">Đã lưu trữ</option>
            </select>
          </div>
        </CardContent>
      </Card>

      {/* Pages Table */}
      <Card>
        <CardHeader>
          <CardTitle>Tất cả trang</CardTitle>
          <CardDescription>
            {isLoading ? 'Đang tải...' : `${total} trang`}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex justify-center py-8">
              <div className="animate-spin h-8 w-8 border-4 border-admin-primary border-t-transparent rounded-full"></div>
            </div>
          ) : !data || data.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <FileText className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>Không tìm thấy trang</p>
            </div>
          ) : (
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Trang</TableHead>
                    <TableHead>Slug</TableHead>
                    <TableHead>Trạng thái</TableHead>
                    <TableHead>Cập nhật</TableHead>
                    <TableHead className="text-right">Thao tác</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {data.map((page: any) => (
                    <TableRow key={page.id}>
                      <TableCell>
                        <div>
                          <div className="font-medium">{page.title}</div>
                          {page.meta_title && (
                            <div className="text-sm text-muted-foreground">
                              {page.meta_title}
                            </div>
                          )}
                        </div>
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground">{page.slug}</TableCell>
                      <TableCell>{getStatusBadge(page.status)}</TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        {formatDate(page.updated_at || page.created_at)}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-2">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => router.push(`/admin/pages/${page.id}/edit`)}
                            title="Sửa"
                          >
                            <Pencil className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleDelete(page.id)}
                            title="Xóa"
                          >
                            <Trash2 className="h-4 w-4 text-destructive" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
