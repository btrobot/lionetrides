import { NextRequest, NextResponse } from 'next/server';
import { withMiddleware, withAdmin } from '@/middleware/api';
import { brandService } from '@/services/brand-service';
import { cacheResponse, errorResponse } from '@/lib/errors';

async function getHandler(request: NextRequest, { params }: { params: Promise<{ id: string }> }) { try { const { id } = await params; const item = await brandService.getById(parseInt(id)); return NextResponse.json({ success: true, data: item }, { headers: cacheResponse(60) }); } catch (e) { const err = errorResponse(e); return NextResponse.json(err, { status: err.statusCode }); } }
async function updateHandler(request: NextRequest, { params }: { params: Promise<{ id: string }> }) { try { const { id } = await params; const body = await request.json(); const item = await brandService.update(parseInt(id), body); return NextResponse.json({ success: true, data: item }); } catch (e) { const err = errorResponse(e); return NextResponse.json(err, { status: err.statusCode }); } }
async function deleteHandler(request: NextRequest, { params }: { params: Promise<{ id: string }> }) { try { const { id } = await params; await brandService.remove(parseInt(id)); return NextResponse.json({ success: true, message: 'Brand deleted' }); } catch (e) { const err = errorResponse(e); return NextResponse.json(err, { status: err.statusCode }); } }
export const GET = withMiddleware(getHandler);
export const PUT = withMiddleware(withAdmin(updateHandler));
export const DELETE = withMiddleware(withAdmin(deleteHandler));
