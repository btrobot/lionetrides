import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { withMiddleware, withAdmin } from '@/middleware/api';
import { newsService } from '@/services/news-service';
import { cacheResponse, errorResponse } from '@/lib/errors';

const createSchema = z.object({ title: z.string().min(1), slug: z.string().min(1), content: z.string().optional(), summary: z.string().optional(), coverImage: z.string().optional(), category: z.string().optional(), author: z.string().optional() });

async function listHandler(request: NextRequest) { try { const { searchParams } = new URL(request.url); const items = await newsService.list({ search: searchParams.get('search') || undefined, category: searchParams.get('category') || undefined, page: Number(searchParams.get('page')) || 1, pageSize: Number(searchParams.get('pageSize')) || 10 }); return NextResponse.json({ success: true, data: items }, { headers: cacheResponse(60) }); } catch (e) { const err = errorResponse(e); return NextResponse.json(err, { status: err.statusCode }); } }
async function createHandler(request: NextRequest) { try { const body = await request.json(); const parsed = createSchema.parse(body); const item = await newsService.create(parsed); return NextResponse.json({ success: true, data: item }, { status: 201 }); } catch (e) { if (e instanceof z.ZodError) return NextResponse.json({ success: false, error: 'Validation failed', details: e.issues }, { status: 400 }); const err = errorResponse(e); return NextResponse.json(err, { status: err.statusCode }); } }
export const GET = withMiddleware(listHandler);
export const POST = withMiddleware(withAdmin(createHandler));
