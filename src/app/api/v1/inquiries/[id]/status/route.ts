import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { withMiddleware, withEditor } from '@/middleware/api';
import { inquiryService } from '@/services/inquiry-service';
import { errorResponse } from '@/lib/errors';

const statusSchema = z.object({
  status: z.enum(['pending', 'processing', 'replied', 'closed']),
  note: z.string().optional(),
  reply: z.string().optional(),
});

// PUT /api/v1/inquiries/[id]/status — Update inquiry status (admin)
async function handler(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const inquiryId = parseInt(id);
    const body = await request.json();
    const parsed = statusSchema.parse(body);

    const result = await inquiryService.updateStatus(inquiryId, parsed.status, undefined, parsed.note, parsed.reply);

    return NextResponse.json({ success: true, data: result });
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

export const PUT = withMiddleware(withEditor(handler));
