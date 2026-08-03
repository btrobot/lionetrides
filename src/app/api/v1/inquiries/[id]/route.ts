import { NextRequest, NextResponse } from 'next/server';
import { withMiddleware, withAuth, AuthenticatedRequest } from '@/middleware/api';
import { inquiryService } from '@/services/inquiry-service';
import { errorResponse } from '@/lib/errors';

// GET /api/v1/inquiries/[id] — Get inquiry detail (authenticated)
async function handler(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const inquiryId = parseInt(id);
    const user = (request as AuthenticatedRequest).user;

    const inquiry = await inquiryService.getById(inquiryId);

    // Only allow the owner or admin/editor to view
    if (user?.userId && inquiry.user_id && inquiry.user_id !== user.userId) {
      if (user.role !== 'admin' && user.role !== 'super_admin' && user.role !== 'editor') {
        return NextResponse.json(
          { success: false, error: 'Forbidden' },
          { status: 403 }
        );
      }
    }

    return NextResponse.json({ success: true, data: inquiry });
  } catch (error) {
    const err = errorResponse(error);
    return NextResponse.json(
      { success: err.success, error: err.error, code: err.code },
      { status: err.statusCode }
    );
  }
}

export const GET = withMiddleware(withAuth(handler));