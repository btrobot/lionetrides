import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { inquiryService } from '@/services/inquiry-service';
import { withMiddleware, withAuth, AuthenticatedRequest } from '@/middleware/api';
import { cacheResponse, errorResponse } from '@/lib/errors';

const inquirySchema = z.object({
  name: z.string().min(1, 'Name is required'),
  email: z.string().email('Invalid email'),
  phone: z.string().optional(),
  company: z.string().optional(),
  quantity: z.coerce.number().min(1).default(1),
  message: z.string().min(10, 'Message must be at least 10 characters'),
  product_id: z.number().optional(),
});

// POST /api/v1/inquiries — Submit a new inquiry (public)
async function createHandler(request: NextRequest, _context: { params: Promise<Record<string, string>> }) {
  try {
    const body = await request.json();
    const parsed = inquirySchema.parse(body);

    // Check if user is authenticated
    const user = (request as AuthenticatedRequest).user || null;

    const inquiry = await inquiryService.create({
      ...parsed,
      user_id: user?.userId || undefined,
    });

    return NextResponse.json(
      { success: true, data: inquiry },
      {
        status: 201,
        headers: cacheResponse(5),
      }
    );
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

// GET /api/v1/inquiries — List inquiries (authenticated)
async function listHandler(request: NextRequest, _context: { params: Promise<Record<string, string>> }) {
  try {
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const pageSize = parseInt(searchParams.get('pageSize') || '10');
    const status = searchParams.get('status') || undefined;
    const startDate = searchParams.get('startDate') || undefined;
    const endDate = searchParams.get('endDate') || undefined;

    const user = (request as AuthenticatedRequest).user;
    const result = await inquiryService.list({
      page,
      pageSize,
      userId: user?.userId,
      status,
      startDate,
      endDate,
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

export const POST = withMiddleware(createHandler);
export const GET = withMiddleware(withAuth(listHandler));