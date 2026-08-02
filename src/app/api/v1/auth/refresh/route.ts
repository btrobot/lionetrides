import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { signToken, verifyToken } from '@/lib/auth';

const refreshSchema = z.object({
  token: z.string().min(1, 'Refresh token is required'),
});

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { token } = refreshSchema.parse(body);

    const payload = await verifyToken(token);
    if (!payload) {
      return NextResponse.json(
        { success: false, error: 'Invalid or expired refresh token', code: 'TOKEN_EXPIRED' },
        { status: 401 }
      );
    }

    const newToken = await signToken({
      userId: payload.userId,
      email: payload.email,
      role: payload.role,
    });

    return NextResponse.json({
      success: true,
      data: { token: newToken },
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { success: false, error: 'Validation failed', details: error.issues },
        { status: 400 }
      );
    }
    return NextResponse.json(
      { success: false, error: 'Internal server error', code: 'INTERNAL_ERROR' },
      { status: 500 }
    );
  }
}
