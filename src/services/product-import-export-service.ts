import { db } from '@/db';
import { products, categories, brands } from '@/db/schema';
import { eq, and, isNull } from 'drizzle-orm';
import Papa from 'papaparse';

// ─── Types ──────────────────────────────────────────────
export interface ProductExportRow {
  sku: string;
  name: string;
  slug: string;
  description: string;
  short_description: string;
  category: string;
  brand: string;
  price: string;
  weight: string;
  dimensions: string;
  material: string;
  capacity: string;
  power: string;
  warranty: string;
  certification: string;
  min_order_qty: number;
  main_image: string;
  status: string;
  is_featured: string;
  meta_title: string;
  meta_description: string;
}

export interface ImportResult {
  total: number;
  created: number;
  updated: number;
  skipped: number;
  errors: Array<{ row: number; field: string; message: string }>;
}

// ─── CSV Column Headers (bilingual) ─────────────────────
export const CSV_HEADERS: Record<string, string> = {
  sku: 'SKU',
  name: '产品名称/Name',
  slug: 'Slug',
  description: '描述/Description',
  short_description: '简短描述/Short Description',
  category: '分类/Category',
  brand: '品牌/Brand',
  price: '价格/Price',
  weight: '重量/Weight',
  dimensions: '尺寸/Dimensions',
  material: '材质/Material',
  capacity: '容量/Capacity',
  power: '功率/Power',
  warranty: '保修/Warranty',
  certification: '认证/Certification',
  min_order_qty: '最小起订量/MOQ',
  main_image: '主图URL/Main Image',
  status: '状态/Status (draft/published/archived)',
  is_featured: '推荐/Featured (true/false)',
  meta_title: 'SEO标题/Meta Title',
  meta_description: 'SEO描述/Meta Description',
};

// ─── Export Products ────────────────────────────────────
export async function exportProductsToCSV(): Promise<string> {
  const allProducts = await db
    .select()
    .from(products)
    .where(isNull(products.deleted_at))
    .orderBy(products.created_at);

  // Pre-load categories and brands for name resolution
  const allCategories = await db.select().from(categories).where(isNull(categories.deleted_at));
  const allBrands = await db.select().from(brands).where(isNull(brands.deleted_at));

  const categoryMap = new Map(allCategories.map((c) => [c.id, c.name]));
  const brandMap = new Map(allBrands.map((b) => [b.id, b.name]));

  const rows: ProductExportRow[] = allProducts.map((p) => ({
    sku: p.sku,
    name: p.name,
    slug: p.slug,
    description: p.description || '',
    short_description: p.short_description || '',
    category: p.category_id ? (categoryMap.get(p.category_id) || '') : '',
    brand: p.brand_id ? (brandMap.get(p.brand_id) || '') : '',
    price: p.price || '',
    weight: p.weight || '',
    dimensions: p.dimensions || '',
    material: p.material || '',
    capacity: p.capacity || '',
    power: p.power || '',
    warranty: p.warranty || '',
    certification: p.certification || '',
    min_order_qty: p.min_order_qty || 1,
    main_image: p.main_image || '',
    status: p.status || 'draft',
    is_featured: p.is_featured ? 'true' : 'false',
    meta_title: p.meta_title || '',
    meta_description: p.meta_description || '',
  }));

  // Build CSV with bilingual headers
  const headerRow = Object.values(CSV_HEADERS);
  const dataRows = rows.map((row) =>
    Object.keys(CSV_HEADERS).map((key) => {
      const val = row[key as keyof ProductExportRow];
      return String(val ?? '');
    })
  );

  const csv = Papa.unparse([headerRow, ...dataRows]);
  return csv;
}

// ─── Export Products to JSON (for Excel) ────────────────
export async function exportProductsToJSON(): Promise<ProductExportRow[]> {
  const allProducts = await db
    .select()
    .from(products)
    .where(isNull(products.deleted_at))
    .orderBy(products.created_at);

  const allCategories = await db.select().from(categories).where(isNull(categories.deleted_at));
  const allBrands = await db.select().from(brands).where(isNull(brands.deleted_at));

  const categoryMap = new Map(allCategories.map((c) => [c.id, c.name]));
  const brandMap = new Map(allBrands.map((b) => [b.id, b.name]));

  return allProducts.map((p) => ({
    sku: p.sku,
    name: p.name,
    slug: p.slug,
    description: p.description || '',
    short_description: p.short_description || '',
    category: p.category_id ? (categoryMap.get(p.category_id) || '') : '',
    brand: p.brand_id ? (brandMap.get(p.brand_id) || '') : '',
    price: p.price || '',
    weight: p.weight || '',
    dimensions: p.dimensions || '',
    material: p.material || '',
    capacity: p.capacity || '',
    power: p.power || '',
    warranty: p.warranty || '',
    certification: p.certification || '',
    min_order_qty: p.min_order_qty || 1,
    main_image: p.main_image || '',
    status: p.status || 'draft',
    is_featured: p.is_featured ? 'true' : 'false',
    meta_title: p.meta_title || '',
    meta_description: p.meta_description || '',
  }));
}

// ─── Slug Generator ─────────────────────────────────────
function generateSlug(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9\u4e00-\u9fff]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .substring(0, 200) || `product-${Date.now()}`;
}

// ─── Import Products from CSV ───────────────────────────
export async function importProductsFromCSV(
  csvContent: string,
  mode: 'create' | 'upsert' = 'create'
): Promise<ImportResult> {
  const result: ImportResult = {
    total: 0,
    created: 0,
    updated: 0,
    skipped: 0,
    errors: [],
  };

  // Parse CSV
  const parsed = Papa.parse<Record<string, string>>(csvContent, {
    header: true,
    skipEmptyLines: true,
    transformHeader: (header: string) => header.trim(),
  });

  if (parsed.errors.length > 0) {
    parsed.errors.forEach((err) => {
      result.errors.push({
        row: (err.row ?? 0) + 1,
        field: err.type || 'parse',
        message: err.message,
      });
    });
  }

  const rows = parsed.data;
  result.total = rows.length;

  if (rows.length === 0) {
    return result;
  }

  // Pre-load categories and brands for name→id resolution
  const allCategories = await db.select().from(categories).where(isNull(categories.deleted_at));
  const allBrands = await db.select().from(brands).where(isNull(brands.deleted_at));

  const categoryByName = new Map(allCategories.map((c) => [c.name.toLowerCase(), c.id]));
  const brandByName = new Map(allBrands.map((b) => [b.name.toLowerCase(), b.id]));

  // Reverse map: CSV header → field key
  const reverseHeaderMap = new Map<string, string>();
  for (const [key, header] of Object.entries(CSV_HEADERS)) {
    reverseHeaderMap.set(header.toLowerCase(), key);
    reverseHeaderMap.set(key.toLowerCase(), key);
  }

  // Process each row
  for (let i = 0; i < rows.length; i++) {
    const row = rows[i];
    const rowNum = i + 2; // 1-indexed + header row

    try {
      // Normalize row keys (match by header or field name)
      const normalized: Record<string, string> = {};
      for (const [rawKey, value] of Object.entries(row)) {
        const mappedKey = reverseHeaderMap.get(rawKey.toLowerCase().trim());
        if (mappedKey) {
          normalized[mappedKey] = (value || '').trim();
        }
      }

      // Validate required fields
      const name = normalized.name;
      const sku = normalized.sku;

      if (!name) {
        result.errors.push({ row: rowNum, field: 'name', message: '产品名称不能为空' });
        result.skipped++;
        continue;
      }
      if (!sku) {
        result.errors.push({ row: rowNum, field: 'sku', message: 'SKU 不能为空' });
        result.skipped++;
        continue;
      }

      // Resolve category and brand IDs
      const categoryName = normalized.category?.toLowerCase();
      const brandName = normalized.brand?.toLowerCase();
      const categoryId = categoryName ? (categoryByName.get(categoryName) ?? null) : null;
      const brandId = brandName ? (brandByName.get(brandName) ?? null) : null;

      // Build product data
      const slug = normalized.slug || generateSlug(name);
      const productData = {
        name,
        sku,
        slug,
        description: normalized.description || null,
        short_description: normalized.short_description || null,
        category_id: categoryId,
        brand_id: brandId,
        price: normalized.price || null,
        weight: normalized.weight || null,
        dimensions: normalized.dimensions || null,
        material: normalized.material || null,
        capacity: normalized.capacity || null,
        power: normalized.power || null,
        warranty: normalized.warranty || null,
        certification: normalized.certification || null,
        min_order_qty: parseInt(normalized.min_order_qty) || 1,
        main_image: normalized.main_image || null,
        status: (['draft', 'published', 'archived'].includes(normalized.status) ? normalized.status : 'draft') as 'draft' | 'published' | 'archived',
        is_featured: normalized.is_featured === 'true',
        meta_title: normalized.meta_title || null,
        meta_description: normalized.meta_description || null,
        updated_at: new Date(),
      };

      // Check if product exists by SKU
      const [existing] = await db
        .select()
        .from(products)
        .where(and(eq(products.sku, sku), isNull(products.deleted_at)))
        .limit(1);

      if (existing && mode === 'upsert') {
        // Update existing product
        await db
          .update(products)
          .set(productData)
          .where(eq(products.id, existing.id));
        result.updated++;
      } else if (existing && mode === 'create') {
        // Skip in create mode
        result.skipped++;
      } else {
        // Create new product
        await db.insert(products).values({
          ...productData,
          created_at: new Date(),
        });
        result.created++;
      }
    } catch (err) {
      result.errors.push({
        row: rowNum,
        field: 'unknown',
        message: err instanceof Error ? err.message : '未知错误',
      });
      result.skipped++;
    }
  }

  return result;
}
