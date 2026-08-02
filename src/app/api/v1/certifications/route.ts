import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { withMiddleware, withAdmin } from '@/middleware/api';
import { certificationService } from '@/services/certification-service';
import { cacheResponse, errorResponse } from '@/lib/errors';

const createSchema = z.object({ name: z.string().min(1), slug: z.string().min(1), logoUrl: z.string().optional(), description: z.string().optional(), issuingBody: z.string().optional(), certificateNumber: z.string().optional() });
async function listHandler() { try { const items = await certificationService.list(); return NextResponse.json({ success: true, data: items }, { headers: cacheResponse(3600) }); } catch (e) { const err = errorResponse(e); return NextResponse.json(err, { status: err.statusCode }); } }
async function createHandler(request: NextRequest, _context: { params: Promise<{}> }) { try { const body = await request.json(); const parsed = createSchema.parse(body); const item = await certificationService.create(parsed); return NextResponse.json({ success: true, data: item }, { status: 201 }); } catch (e) { if (e instanceof z.ZodError) return NextResponse.json({ success: false, error: 'Validation failed', details: e.issues }, { status: 400 }); const err = errorResponse(e); return NextResponse.json(err, { status: err.statusCode }); } }
export const GET = withMiddleware(listHandler);
export const POST = withMiddleware(withAdmin(createHandler));
