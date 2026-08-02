import { NextRequest, NextResponse } from 'next/server';
import { productService } from '@/services/product-service';
import { withMiddleware, withAuth, withAdmin, AuthenticatedRequest } from '@/middleware/api';
import { cacheResponse, errorResponse, parsePagination } from '@/lib/errors';

// GET /api/v1/products — Public product listing
async function listHandler(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const { page, pageSize } = parsePagination(searchParams);

    const result = await productService.list({
      page,
      pageSize,
      search: searchParams.get('search') || undefined,
      categoryId: searchParams.get('categoryId') ? parseInt(searchParams.get('categoryId')!) : undefined,
      brandId: searchParams.get('brandId') ? parseInt(searchParams.get('brandId')!) : undefined,
      sortBy: searchParams.get('sortBy') || 'created_at',
      sortOrder: (searchParams.get('sortOrder') as 'asc' | 'desc') || 'desc',
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

// POST /api/v1/products — Admin create product
async function createHandler(request: NextRequest) {
  try {
    const body = await request.json();
    // Product creation would go through admin service
    return NextResponse.json({ success: true, data: body });
  } catch (error) {
    const err = errorResponse(error);
    return NextResponse.json(
      { success: err.success, error: err.error, code: err.code },
      { status: err.statusCode }
    );
  }
}

export const GET = withMiddleware(listHandler);
export const POST = withMiddleware(withAdmin(createHandler));