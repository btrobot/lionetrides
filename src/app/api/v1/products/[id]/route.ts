import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { withMiddleware, withAdmin } from '@/middleware/api';
import { productService } from '@/services/product-service';
import { cacheResponse, errorResponse } from '@/lib/errors';

const updateSchema = z.object({
  name: z.string().min(1).optional(),
  slug: z.string().min(1).optional(),
  sku: z.string().min(1).optional(),
  description: z.string().optional(),
  categoryId: z.number().optional(),
  brandId: z.number().optional(),
  price: z.string().min(1).optional(),
  mainImage: z.string().optional(),
  status: z.enum(['draft', 'published']).optional(),
  isFeatured: z.boolean().optional(),
  sortOrder: z.number().optional(),
});

async function getHandler(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const productId = parseInt(id);
    const product = await productService.getById(productId);
    return NextResponse.json(
      { success: true, data: product },
      { headers: cacheResponse(60) }
    );
  } catch (error) {
    const err = errorResponse(error);
    return NextResponse.json(
      { success: err.success, error: err.error, code: err.code },
      { status: err.statusCode }
    );
  }
}

async function updateHandler(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const productId = parseInt(id);
    const body = await request.json();
    const parsed = updateSchema.parse(body);
    const product = await productService.update(productId, parsed);
    return NextResponse.json({ success: true, data: product });
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

async function deleteHandler(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const productId = parseInt(id);
    await productService.remove(productId);
    return NextResponse.json({ success: true, message: 'Product deleted' });
  } catch (error) {
    const err = errorResponse(error);
    return NextResponse.json(
      { success: err.success, error: err.error, code: err.code },
      { status: err.statusCode }
    );
  }
}

export const GET = withMiddleware(getHandler);
export const PUT = withMiddleware(withAdmin(updateHandler));
export const DELETE = withMiddleware(withAdmin(deleteHandler));
