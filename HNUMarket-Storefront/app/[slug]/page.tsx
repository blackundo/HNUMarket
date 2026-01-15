import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { cache } from 'react';
import { FileText } from 'lucide-react';
import { storefrontPagesApi, type StorefrontPage } from '@/lib/api/storefront-pages';
import { formatDate } from '@/lib/utils';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

interface StaticPageProps {
  params: Promise<{ slug: string }>;
}

const getPage = cache(async (slug: string): Promise<StorefrontPage> => {
  return storefrontPagesApi.getPageBySlug(slug);
});

const stripHtml = (html?: string) => {
  if (!html) return '';
  return html.replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim();
};

export async function generateMetadata({ params }: StaticPageProps): Promise<Metadata> {
  const { slug } = await params;

  try {
    const page = await getPage(slug);
    const description = page.meta_description || stripHtml(page.content).slice(0, 160);

    return {
      title: page.meta_title || page.title,
      description: description || undefined,
    };
  } catch {
    return {
      title: 'Page not found',
    };
  }
}

export default async function StaticPage({ params }: StaticPageProps) {
  const { slug } = await params;

  let page: StorefrontPage | null = null;
  try {
    page = await getPage(slug);
  } catch (error) {
    console.error('Error loading page:', error);
  }

  if (!page) {
    notFound();
  }

  const updatedLabel = page.published_at || page.updated_at || page.created_at;

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        <div className="bg-white rounded-lg shadow-sm border border-gray-100">
          <div className="px-6 sm:px-10 py-8 border-b border-gray-100">
            <div className="flex items-center gap-2 text-primary">
              <FileText className="w-5 h-5" />
              <span className="text-xs uppercase tracking-[0.2em] text-primary/70">
                Static Page
              </span>
            </div>
            <h1 className="mt-3 text-2xl sm:text-3xl font-bold text-gray-900">
              {page.title}
            </h1>
            {updatedLabel && (
              <p className="mt-2 text-sm text-gray-500">
                Updated {formatDate(updatedLabel)}
              </p>
            )}
          </div>

          <div className="px-6 sm:px-10 py-8">
            {page.content ? (
              <div
                className="text-gray-700 leading-relaxed [&_h1]:text-3xl [&_h1]:font-bold [&_h1]:mt-6 [&_h1]:mb-4 [&_h2]:text-2xl [&_h2]:font-semibold [&_h2]:mt-5 [&_h2]:mb-3 [&_h3]:text-xl [&_h3]:font-semibold [&_h3]:mt-4 [&_h3]:mb-2 [&_p]:mb-4 [&_ul]:list-disc [&_ul]:pl-6 [&_ul]:mb-4 [&_ol]:list-decimal [&_ol]:pl-6 [&_ol]:mb-4 [&_li]:mb-1 [&_blockquote]:border-l-4 [&_blockquote]:border-gray-200 [&_blockquote]:pl-4 [&_blockquote]:italic [&_a]:text-primary [&_a:hover]:underline [&_img]:max-w-full [&_img]:rounded [&_img]:my-4 [&_table]:w-full [&_table]:border-collapse [&_table]:my-4 [&_th]:border [&_th]:border-gray-300 [&_th]:bg-gray-100 [&_th]:px-3 [&_th]:py-2 [&_th]:text-left [&_td]:border [&_td]:border-gray-300 [&_td]:px-3 [&_td]:py-2 [&_code]:bg-gray-100 [&_code]:px-1 [&_code]:rounded [&_code]:text-sm [&_pre]:bg-gray-900 [&_pre]:text-gray-100 [&_pre]:p-4 [&_pre]:rounded [&_pre]:overflow-x-auto"
                dangerouslySetInnerHTML={{ __html: page.content }}
              />
            ) : (
              <p className="text-gray-500">Content is being updated.</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
