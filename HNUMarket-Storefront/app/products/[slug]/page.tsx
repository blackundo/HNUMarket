import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { Star, ShoppingCart, MessageCircle, ArrowUp } from "lucide-react";
import { storefrontProductsApi } from "@/lib/api/storefront-products";
import {
  transformProduct,
  transformProducts,
  transformProductWithNormalizedVariants,
  hasNormalizedVariants
} from "@/lib/helpers/transform-api-data";
import { ProductImageGallery } from "@/components/product/product-image-gallery";
import { ProductInfo } from "@/components/product/product-info";
import { ProductInfoNormalized } from "@/components/product/product-info-normalized";
import { ProductCard } from "@/components/product/product-card";
import { ProductViewTracker } from "@/components/product/product-view-tracker";
import { ProductVouchers } from "@/components/product/product-vouchers";
import { Separator } from "@/components/ui/separator";

interface ProductPageProps {
  params: Promise<{ slug: string }>;
}

/**
 * Generate metadata for product page
 * Uses first product image if available, otherwise falls back to default meta-image.jpg
 */
export async function generateMetadata({ params }: ProductPageProps): Promise<Metadata> {
  const { slug } = await params;

  try {
    const productData = await storefrontProductsApi.getProductBySlug(slug);

    // Get first product image URL
    let firstImageUrl = "/images/meta-image.jpg";
    if (productData.images && productData.images.length > 0 && productData.images[0]?.url) {
      firstImageUrl = productData.images[0].url;
    }

    // Use absolute URL for Open Graph (needs full URL for social sharing)
    // If image is already absolute URL (starts with http/https), use it directly
    // Otherwise, prepend base URL for relative paths
    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || process.env.NEXT_PUBLIC_SITE_URL || "https://hnumarket.com";
    const ogImageUrl = firstImageUrl.startsWith("http") || firstImageUrl.startsWith("//")
      ? firstImageUrl
      : `${baseUrl}${firstImageUrl.startsWith("/") ? firstImageUrl : `/${firstImageUrl}`}`;

    return {
      title: `${productData.name} | HNUMarket`,
      description: productData.description || `${productData.name} - Sản phẩm chất lượng từ HNUMarket`,
      openGraph: {
        title: `${productData.name} | HNUMarket`,
        description: productData.description || `${productData.name} - Sản phẩm chất lượng từ HNUMarket`,
        images: [
          {
            url: ogImageUrl,
            width: 1200,
            height: 1200,
            alt: productData.name,
          },
        ],
        type: "website",
      },
      twitter: {
        card: "summary_large_image",
        title: `${productData.name} | HNUMarket`,
        description: productData.description || `${productData.name} - Sản phẩm chất lượng từ HNUMarket`,
        images: [ogImageUrl],
      },
    };
  } catch (error) {
    // Fallback to default metadata if product not found
    return {
      title: "Sản phẩm | HNUMarket",
      description: "Sản phẩm chất lượng từ HNUMarket",
      openGraph: {
        images: ["/images/meta-image.jpg"],
      },
    };
  }
}

/**
 * Product detail page with image gallery, product info, and related products
 */
export default async function ProductPage({ params }: ProductPageProps) {
  const { slug } = await params;

  try {
    const productData = await storefrontProductsApi.getProductBySlug(slug);

    // Check if product uses normalized variant system
    const useNormalizedVariants = hasNormalizedVariants(productData);

    // Transform product based on variant system
    const product = useNormalizedVariants
      ? transformProductWithNormalizedVariants(productData)
      : transformProduct(productData);

    // Get related products from same category
    const relatedProductsData = product.categoryId
      ? await storefrontProductsApi.getProducts({
        category_id: product.categoryId,
        limit: 10,
      }).catch(() => ({ data: [] }))
      : { data: [] };

    const relatedProducts = transformProducts(
      relatedProductsData.data.filter((p) => p.id !== product.id)
    );

    return (
      <div className="min-h-screen bg-white">
        {/* Track product view for analytics */}
        <ProductViewTracker
          product={{
            id: product.id,
            name: product.name,
            price: product.price,
            categoryId: product.categoryId,
          }}
        />
        <div className="max-w-screen mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {/* Product Detail Section */}
          <div className="grid grid-cols-1 lg:grid-cols-[6fr_auto_4fr] gap-8 lg:gap-8 mb-12">
            {/* Left: Image Gallery & Vouchers (6fr) */}
            <div className="flex flex-col gap-10">
              <ProductImageGallery
                images={
                  useNormalizedVariants
                    ? (product as any).images.map((img: any) => img.url)
                    : product.images
                }
                productName={product.name}
              />
              {/* <ProductVouchers /> */}
            </div>

            {/* Separator */}
            <Separator orientation="vertical" className="hidden lg:block h-full" />


            {/* Right: Product Info - Conditional rendering based on variant system */}
            {useNormalizedVariants ? (
              <ProductInfoNormalized product={product as any} />
            ) : (
              <ProductInfo product={product as any} />
            )}
          </div>

          <Separator className="my-12" />

          {/* Related Products Section */}
          {relatedProducts.length > 0 && (
            <div>
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl lg:text-3xl font-bold uppercase">
                  Sản phẩm liên quan
                </h2>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3 sm:gap-4">
                {relatedProducts.map((relatedProduct) => (
                  <ProductCard
                    key={relatedProduct.id}
                    product={relatedProduct}
                  />
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    );
  } catch (error) {
    notFound();
  }
}
