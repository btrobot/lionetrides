import { NextRequest, NextResponse } from 'next/server';
import { withMiddleware, withAdmin } from '@/middleware/api';
import { reviewService } from '@/services/review-service';
import { errorResponse } from '@/lib/errors';
async function handler(request: NextRequest, { params }: { params: Promise<{ id: string }> }) { try { const { id } = await params; const item = await reviewService.hide(parseInt(id)); return NextResponse.json({ success: true, data: item }); } catch (e) { const err = errorResponse(e); return NextResponse.json(err, { status: err.statusCode }); } }
export const PUT = withMiddleware(withAdmin(handler));
