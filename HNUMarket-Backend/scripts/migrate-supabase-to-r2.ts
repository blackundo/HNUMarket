import { createClient } from '@supabase/supabase-js';
import {
    S3Client,
    PutObjectCommand,
    HeadObjectCommand,
} from '@aws-sdk/client-s3';
import * as dotenv from 'dotenv';

// Load environment variables
dotenv.config();

// ============================================
// CONFIGURATION - Update these values
// ============================================

const SUPABASE_URL = process.env.SUPABASE_URL!;
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_KEY!;
const SUPABASE_BUCKET = 'products';

const R2_ACCOUNT_ID = process.env.R2_ACCOUNT_ID!;
const R2_ACCESS_KEY_ID = process.env.R2_ACCESS_KEY_ID!;
const R2_SECRET_ACCESS_KEY = process.env.R2_SECRET_ACCESS_KEY!;
const R2_BUCKET_NAME = process.env.R2_BUCKET_NAME || 'products';
const R2_PUBLIC_URL = process.env.R2_PUBLIC_URL!;

// Set to true to actually update database URLs after migration
const UPDATE_DATABASE = true;

// Set to true to delete from Supabase after successful migration
const DELETE_FROM_SUPABASE = false;

// ============================================
// CLIENTS
// ============================================

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

const r2Client = new S3Client({
    region: 'auto',
    endpoint: `https://${R2_ACCOUNT_ID}.r2.cloudflarestorage.com`,
    credentials: {
        accessKeyId: R2_ACCESS_KEY_ID,
        secretAccessKey: R2_SECRET_ACCESS_KEY,
    },
});

// ============================================
// HELPER FUNCTIONS
// ============================================

interface MigrationResult {
    success: string[];
    failed: { url: string; error: string }[];
    skipped: string[];
}

/**
 * Extract storage path from Supabase URL
 */
function extractSupabasePath(url: string): string | null {
    try {
        const urlObj = new URL(url);
        const pathMatch = urlObj.pathname.match(
            /\/storage\/v1\/object\/public\/products\/(.+)$/,
        );
        return pathMatch ? pathMatch[1] : null;
    } catch {
        return null;
    }
}

/**
 * Check if file already exists in R2
 */
async function fileExistsInR2(key: string): Promise<boolean> {
    try {
        await r2Client.send(
            new HeadObjectCommand({
                Bucket: R2_BUCKET_NAME,
                Key: key,
            }),
        );
        return true;
    } catch {
        return false;
    }
}

/**
 * Download file from Supabase
 */
async function downloadFromSupabase(path: string): Promise<Buffer | null> {
    const { data, error } = await supabase.storage
        .from(SUPABASE_BUCKET)
        .download(path);

    if (error || !data) {
        console.error(`Failed to download from Supabase: ${path}`, error?.message);
        return null;
    }

    return Buffer.from(await data.arrayBuffer());
}

/**
 * Upload file to R2
 */
async function uploadToR2(
    buffer: Buffer,
    key: string,
    contentType: string,
): Promise<boolean> {
    try {
        await r2Client.send(
            new PutObjectCommand({
                Bucket: R2_BUCKET_NAME,
                Key: key,
                Body: buffer,
                ContentType: contentType,
            }),
        );
        return true;
    } catch (error) {
        console.error(`Failed to upload to R2: ${key}`, error);
        return false;
    }
}

/**
 * Get content type from file extension
 */
function getContentType(path: string): string {
    const ext = path.split('.').pop()?.toLowerCase();
    const types: Record<string, string> = {
        jpg: 'image/jpeg',
        jpeg: 'image/jpeg',
        png: 'image/png',
        gif: 'image/gif',
        webp: 'image/webp',
    };
    return types[ext || ''] || 'application/octet-stream';
}

/**
 * Generate R2 public URL
 */
function getR2PublicUrl(key: string): string {
    const baseUrl = R2_PUBLIC_URL.replace(/\/$/, '');
    return `${baseUrl}/${key}`;
}

// ============================================
// MIGRATION LOGIC
// ============================================

/**
 * Migrate a single image from Supabase to R2
 */
async function migrateImage(
    supabaseUrl: string,
): Promise<{ newUrl: string | null; error?: string }> {
    const path = extractSupabasePath(supabaseUrl);

    if (!path) {
        return { newUrl: null, error: 'Invalid Supabase URL format' };
    }

    // Check if already exists in R2
    if (await fileExistsInR2(path)) {
        console.log(`  ⏭️  Already exists in R2: ${path}`);
        return { newUrl: getR2PublicUrl(path) };
    }

    // Download from Supabase
    const buffer = await downloadFromSupabase(path);
    if (!buffer) {
        return { newUrl: null, error: 'Failed to download from Supabase' };
    }

    // Upload to R2
    const contentType = getContentType(path);
    const uploaded = await uploadToR2(buffer, path, contentType);

    if (!uploaded) {
        return { newUrl: null, error: 'Failed to upload to R2' };
    }

    console.log(`  ✅ Migrated: ${path}`);

    // Optionally delete from Supabase
    if (DELETE_FROM_SUPABASE) {
        await supabase.storage.from(SUPABASE_BUCKET).remove([path]);
        console.log(`  🗑️  Deleted from Supabase: ${path}`);
    }

    return { newUrl: getR2PublicUrl(path) };
}

/**
 * Migrate all product images
 */
async function migrateProductImages(): Promise<MigrationResult> {
    console.log('\n📦 Migrating product images...\n');

    const result: MigrationResult = {
        success: [],
        failed: [],
        skipped: [],
    };

    // Fetch all product images
    const { data: images, error } = await supabase
        .from('product_images')
        .select('id, url, product_id');

    if (error || !images) {
        console.error('Failed to fetch product images:', error?.message);
        return result;
    }

    console.log(`Found ${images.length} product images to migrate\n`);

    for (const image of images) {
        // Skip if not a Supabase URL
        if (!image.url.includes('supabase')) {
            result.skipped.push(image.url);
            continue;
        }

        console.log(`Processing: ${image.url}`);
        const { newUrl, error: migError } = await migrateImage(image.url);

        if (newUrl) {
            result.success.push(image.url);

            // Update database with new URL
            if (UPDATE_DATABASE && newUrl !== image.url) {
                const { error: updateError } = await supabase
                    .from('product_images')
                    .update({ url: newUrl })
                    .eq('id', image.id);

                if (updateError) {
                    console.log(`  ⚠️  Failed to update DB: ${updateError.message}`);
                } else {
                    console.log(`  📝 Updated DB: ${image.id}`);
                }
            }
        } else {
            result.failed.push({ url: image.url, error: migError || 'Unknown error' });
        }
    }

    return result;
}

/**
 * Migrate product variant images
 */
async function migrateVariantImages(): Promise<MigrationResult> {
    console.log('\n📦 Migrating variant images...\n');

    const result: MigrationResult = {
        success: [],
        failed: [],
        skipped: [],
    };

    // Fetch all variant images
    const { data: variants, error } = await supabase
        .from('product_variants')
        .select('id, image_url')
        .not('image_url', 'is', null);

    if (error || !variants) {
        console.error('Failed to fetch variant images:', error?.message);
        return result;
    }

    console.log(`Found ${variants.length} variant images to migrate\n`);

    for (const variant of variants) {
        if (!variant.image_url) continue;

        // Skip if not a Supabase URL
        if (!variant.image_url.includes('supabase')) {
            result.skipped.push(variant.image_url);
            continue;
        }

        console.log(`Processing: ${variant.image_url}`);
        const { newUrl, error: migError } = await migrateImage(variant.image_url);

        if (newUrl) {
            result.success.push(variant.image_url);

            // Update database with new URL
            if (UPDATE_DATABASE && newUrl !== variant.image_url) {
                const { error: updateError } = await supabase
                    .from('product_variants')
                    .update({ image_url: newUrl })
                    .eq('id', variant.id);

                if (updateError) {
                    console.log(`  ⚠️  Failed to update DB: ${updateError.message}`);
                } else {
                    console.log(`  📝 Updated DB: ${variant.id}`);
                }
            }
        } else {
            result.failed.push({
                url: variant.image_url,
                error: migError || 'Unknown error',
            });
        }
    }

    return result;
}

/**
 * Migrate hero slide images
 */
async function migrateHeroSlideImages(): Promise<MigrationResult> {
    console.log('\n📦 Migrating hero slide images...\n');

    const result: MigrationResult = {
        success: [],
        failed: [],
        skipped: [],
    };

    const { data: slides, error } = await supabase
        .from('hero_slides')
        .select('id, image_url');

    if (error || !slides) {
        console.error('Failed to fetch hero slides:', error?.message);
        return result;
    }

    console.log(`Found ${slides.length} hero slides to migrate\n`);

    for (const slide of slides) {
        if (!slide.image_url?.includes('supabase')) {
            result.skipped.push(slide.image_url || '');
            continue;
        }

        console.log(`Processing: ${slide.image_url}`);
        const { newUrl, error: migError } = await migrateImage(slide.image_url);

        if (newUrl) {
            result.success.push(slide.image_url);

            if (UPDATE_DATABASE && newUrl !== slide.image_url) {
                await supabase
                    .from('hero_slides')
                    .update({ image_url: newUrl })
                    .eq('id', slide.id);
                console.log(`  📝 Updated DB: ${slide.id}`);
            }
        } else {
            result.failed.push({
                url: slide.image_url,
                error: migError || 'Unknown error',
            });
        }
    }

    return result;
}

/**
 * Migrate category images
 */
async function migrateCategoryImages(): Promise<MigrationResult> {
    console.log('\n📦 Migrating category images...\n');

    const result: MigrationResult = {
        success: [],
        failed: [],
        skipped: [],
    };

    const { data: categories, error } = await supabase
        .from('categories')
        .select('id, image_url')
        .not('image_url', 'is', null);

    if (error || !categories) {
        console.error('Failed to fetch categories:', error?.message);
        return result;
    }

    console.log(`Found ${categories.length} category images to migrate\n`);

    for (const category of categories) {
        if (!category.image_url?.includes('supabase')) {
            result.skipped.push(category.image_url || '');
            continue;
        }

        console.log(`Processing: ${category.image_url}`);
        const { newUrl, error: migError } = await migrateImage(category.image_url);

        if (newUrl) {
            result.success.push(category.image_url);

            if (UPDATE_DATABASE && newUrl !== category.image_url) {
                await supabase
                    .from('categories')
                    .update({ image_url: newUrl })
                    .eq('id', category.id);
                console.log(`  📝 Updated DB: ${category.id}`);
            }
        } else {
            result.failed.push({
                url: category.image_url,
                error: migError || 'Unknown error',
            });
        }
    }

    return result;
}

// ============================================
// MAIN
// ============================================

async function main() {
    console.log('🚀 Starting Supabase to R2 Migration\n');
    console.log('Configuration:');
    console.log(`  - Update Database: ${UPDATE_DATABASE}`);
    console.log(`  - Delete from Supabase: ${DELETE_FROM_SUPABASE}`);
    console.log(`  - R2 Public URL: ${R2_PUBLIC_URL}\n`);

    // Validate configuration
    if (!SUPABASE_URL || !SUPABASE_SERVICE_KEY) {
        console.error('❌ Missing Supabase configuration');
        process.exit(1);
    }

    if (!R2_ACCOUNT_ID || !R2_ACCESS_KEY_ID || !R2_SECRET_ACCESS_KEY) {
        console.error('❌ Missing R2 configuration');
        process.exit(1);
    }

    const results: Record<string, MigrationResult> = {};

    // Migrate all image types
    results.productImages = await migrateProductImages();
    results.variantImages = await migrateVariantImages();
    results.heroSlides = await migrateHeroSlideImages();
    results.categories = await migrateCategoryImages();

    // Print summary
    console.log('\n' + '='.repeat(50));
    console.log('📊 MIGRATION SUMMARY\n');

    for (const [name, result] of Object.entries(results)) {
        console.log(`${name}:`);
        console.log(`  ✅ Success: ${result.success.length}`);
        console.log(`  ❌ Failed: ${result.failed.length}`);
        console.log(`  ⏭️  Skipped: ${result.skipped.length}`);

        if (result.failed.length > 0) {
            console.log('  Failed URLs:');
            result.failed.forEach((f) => console.log(`    - ${f.url}: ${f.error}`));
        }
        console.log();
    }

    console.log('✨ Migration complete!\n');
}

main().catch(console.error);
