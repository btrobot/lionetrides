import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { withMiddleware, withAdmin } from '@/middleware/api';
import { categoryService } from '@/services/category-service';
import { cacheResponse, errorResponse } from '@/lib/errors';

const updateSchema = z.object({ name: z.string().min(1).optional(), slug: z.string().min(1).optional(), sortOrder: z.number().optional(), isActive: z.boolean().optional() });

async function getHandler(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params; const item = await categoryService.getById(parseInt(id));
    return NextResponse.json({ success: true, data: item }, { headers: cacheResponse(60) });
  } catch (e) { const err = errorResponse(e); return NextResponse.json(err, { status: err.statusCode }); }
}

async function updateHandler(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params; const body = await request.json(); const parsed = updateSchema.parse(body);
    const item = await categoryService.update(parseInt(id), parsed);
    return NextResponse.json({ success: true, data: item });
  } catch (e) {
    if (e instanceof z.ZodError) return NextResponse.json({ success: false, error: 'Validation failed', details: e.issues }, { status: 400 });
    const err = errorResponse(e); return NextResponse.json(err, { status: err.statusCode });
  }
}

async function deleteHandler(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params; await categoryService.remove(parseInt(id));
    return NextResponse.json({ success: true, message: 'Category deleted' });
  } catch (e) { const err = errorResponse(e); return NextResponse.json(err, { status: err.statusCode }); }
}

export const GET = withMiddleware(getHandler);
export const PUT = withMiddleware(withAdmin(updateHandler));
export const DELETE = withMiddleware(withAdmin(deleteHandler));
