import { ResourceProps } from '@refinedev/core';

export const resources: ResourceProps[] = [
  {
    name: 'products',
    list: '/admin/products',
    create: '/admin/products/new',
    edit: '/admin/products/:id/edit',
    show: '/admin/products/:id',
    meta: {
      label: 'Sản phẩm',
      icon: 'Package',
    },
  },
  {
    name: 'categories',
    list: '/admin/categories',
    create: '/admin/categories/new',
    edit: '/admin/categories/:id/edit',
    show: '/admin/categories/:id',
    meta: {
      label: 'Danh mục',
      icon: 'FolderTree',
    },
  },
  {
    name: 'posts',
    list: '/admin/posts',
    create: '/admin/posts/new',
    edit: '/admin/posts/:id/edit',
    show: '/admin/posts/:id',
    meta: {
      label: 'Bài viết',
      icon: 'FileText',
    },
  },
  {
    name: 'pages',
    list: '/admin/pages',
    create: '/admin/pages/new',
    edit: '/admin/pages/:id/edit',
    meta: {
      label: 'Trang tĩnh',
      icon: 'FileText',
    },
  },
  {
    name: 'hero-slides',
    list: '/admin/hero-slides',
    create: '/admin/hero-slides/new',
    edit: '/admin/hero-slides/:id/edit',
    meta: {
      label: 'Hero Slider',
      icon: 'ImageIcon',
    },
  },
  {
    name: 'dashboard',
    list: '/admin/dashboard',
    meta: {
      label: 'Dashboard',
      icon: 'LayoutDashboard',
    },
  },
];
