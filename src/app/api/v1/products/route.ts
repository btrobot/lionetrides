import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { withMiddleware, withAdmin } from '@/middleware/api';
import { productService } from '@/services/product-service';
import { cacheResponse, errorResponse } from '@/lib/errors';

const createSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  slug: z.string().min(1, 'Slug is required'),
  sku: z.string().min(1, 'SKU is required'),
  description: z.string().optional(),
  categoryId: z.number().optional(),
  brandId: z.number().optional(),
  price: z.string().min(1, 'Price is required'),
  mainImage: z.string().optional(),
  status: z.enum(['draft', 'published']).optional(),
  isFeatured: z.boolean().optional(),
});

// GET /api/v1/products — List products (public)
async function listHandler(request: NextRequest, _context: { params: Promise<Record<string, string>> }) {
  try {
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const pageSize = parseInt(searchParams.get('pageSize') || '12');
    const search = searchParams.get('search') || undefined;
    const categoryId = searchParams.get('categoryId')
      ? parseInt(searchParams.get('categoryId')!)
      : undefined;
    const brandId = searchParams.get('brandId')
      ? parseInt(searchParams.get('brandId')!)
      : undefined;
    const sortBy = (searchParams.get('sortBy') || 'sort_order') as string;
    const sortOrder = (searchParams.get('sortOrder') || 'asc') as 'asc' | 'desc';

    const result = await productService.list({
      page,
      pageSize,
      search,
      categoryId,
      brandId,
      
      sortBy,
      sortOrder,
    });

    return NextResponse.json(
      { success: true, ...result },
      { headers: cacheResponse(30) }
    );
  } catch (error) {
    const err = errorResponse(error);
    return NextResponse.json(
      { success: err.success, error: err.error, code: err.code },
      { status: err.statusCode }
    );
  }
}

// POST /api/v1/products — Create product (admin)
async function createHandler(request: NextRequest, _context: { params: Promise<Record<string, string>> }) {
  try {
    const body = await request.json();
    const parsed = createSchema.parse(body);
    const product = await productService.create(parsed);
    return NextResponse.json({ success: true, data: product }, { status: 201 });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { success: false, error: 'Validation failed', details: error.issues },
        { status: 400 }
      );
    }
    const err = errorResponse(error);
    return NextResponse.json(
      { success: err.success, error: err.error, code: err.code },
      { status: err.statusCode }
    );
  }
}

export const GET = withMiddleware(listHandler);
export const POST = withMiddleware(withAdmin(createHandler));