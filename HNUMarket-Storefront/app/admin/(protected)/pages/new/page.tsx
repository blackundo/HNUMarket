import { PageForm } from '@/components/admin/pages/page-form';

/**
 * New Page
 *
 * Admin page for creating new static pages.
 *
 * @route /admin/pages/new
 */
export default function NewPage() {
  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">New Page</h1>
      <PageForm />
    </div>
  );
}
