import { NextRequest, NextResponse } from 'next/server';
import { withMiddleware, withEditor } from '@/middleware/api';
import { newsService } from '@/services/news-service';
import { cacheResponse, errorResponse } from '@/lib/errors';

async function getHandler(request: NextRequest, { params }: { params: Promise<{ id: string }> }) { try { const { id } = await params; const item = await newsService.getById(parseInt(id)); return NextResponse.json({ success: true, data: item }, { headers: cacheResponse(60) }); } catch (e) { const err = errorResponse(e); return NextResponse.json(err, { status: err.statusCode }); } }
async function updateHandler(request: NextRequest, { params }: { params: Promise<{ id: string }> }) { try { const { id } = await params; const body = await request.json(); const item = await newsService.update(parseInt(id), body); return NextResponse.json({ success: true, data: item }); } catch (e) { const err = errorResponse(e); return NextResponse.json(err, { status: err.statusCode }); } }
async function deleteHandler(request: NextRequest, { params }: { params: Promise<{ id: string }> }) { try { const { id } = await params; await newsService.remove(parseInt(id)); return NextResponse.json({ success: true, message: 'News deleted' }); } catch (e) { const err = errorResponse(e); return NextResponse.json(err, { status: err.statusCode }); } }
export const GET = withMiddleware(getHandler);
export const PUT = withMiddleware(withEditor(updateHandler));
export const DELETE = withMiddleware(withEditor(deleteHandler));
