import { NextResponse } from 'next/server';
import { db } from '@/db';
import { users } from '@/db/schema';
import { eq } from 'drizzle-orm';
import { withMiddleware, withAuth, AuthenticatedRequest } from '@/middleware/api';
import { NotFoundError, errorResponse } from '@/lib/errors';

async function handler(request: AuthenticatedRequest, _context: { params: Promise<{}> }) {
  try {
    const userId = request.user.userId;

    const [user] = await db
      .select({
        id: users.id,
        email: users.email,
        name: users.name,
        role: users.role,
        phone: users.phone,
        company: users.company,
        avatar_url: users.avatar_url,
        is_active: users.is_active,
        last_login_at: users.last_login_at,
        created_at: users.created_at,
      })
      .from(users)
      .where(eq(users.id, userId))
      .limit(1);

    if (!user) {
      throw new NotFoundError('User');
    }

    return NextResponse.json({ success: true, data: user });
  } catch (error) {
    const err = errorResponse(error);
    return NextResponse.json(
      { success: err.success, error: err.error, code: err.code },
      { status: err.statusCode }
    );
  }
}

export const GET = withMiddleware(withAuth(handler));
