import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { withMiddleware } from '@/middleware/api';
import { reviewService } from '@/services/review-service';
import { cacheResponse, errorResponse } from '@/lib/errors';

const createSchema = z.object({ productId: z.number(), rating: z.number().min(1).max(5), title: z.string().optional(), content: z.string().min(1), customerName: z.string().optional(), companyName: z.string().optional() });
async function listHandler(request: NextRequest) { try { const { searchParams } = new URL(request.url); const items = await reviewService.list({ productId: Number(searchParams.get('productId')) || undefined, status: searchParams.get('status') || undefined, page: Number(searchParams.get('page')) || 1, pageSize: Number(searchParams.get('pageSize')) || 10 }); return NextResponse.json({ success: true, data: items }, { headers: cacheResponse(60) }); } catch (e) { const err = errorResponse(e); return NextResponse.json(err, { status: err.statusCode }); } }
async function createHandler(request: NextRequest) { try { const body = await request.json(); const parsed = createSchema.parse(body); const item = await reviewService.create(parsed); return NextResponse.json({ success: true, data: item }, { status: 201 }); } catch (e) { if (e instanceof z.ZodError) return NextResponse.json({ success: false, error: 'Validation failed', details: e.issues }, { status: 400 }); const err = errorResponse(e); return NextResponse.json(err, { status: err.statusCode }); } }
export const GET = withMiddleware(listHandler);
export const POST = withMiddleware(createHandler);
