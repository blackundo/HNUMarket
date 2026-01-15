import { ProductsTrashList } from '@/components/admin/products/products-trash-list';

export const metadata = {
  title: 'Thùng rác - Quản lý sản phẩm',
  description: 'Quản lý sản phẩm đã xóa',
};

export default function TrashPage() {
  return <ProductsTrashList />;
}
