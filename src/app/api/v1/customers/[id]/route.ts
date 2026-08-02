import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { withMiddleware, withAuth } from '@/middleware/api';
import { db } from '@/db';
import { users } from '@/db/schema';
import { eq } from 'drizzle-orm';
import { errorResponse } from '@/lib/errors';
import { NotFoundError } from '@/lib/errors';

const updateSchema = z.object({ name: z.string().min(1).optional(), phone: z.string().optional(), company: z.string().optional(), avatar: z.string().optional() });

async function getHandler(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const [item] = await db.select({ id: users.id, name: users.name, email: users.email, phone: users.phone, company: users.company, avatar: users.avatar_url, role: users.role, isActive: users.is_active, createdAt: users.created_at, lastLoginAt: users.last_login_at }).from(users).where(eq(users.id, parseInt(id))).limit(1);
    if (!item) throw new NotFoundError('User not found');
    return NextResponse.json({ success: true, data: item });
  } catch (e) { const err = errorResponse(e); return NextResponse.json(err, { status: err.statusCode }); }
}

async function updateHandler(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params; const body = await request.json(); const parsed = updateSchema.parse(body);
    const [item] = await db.update(users).set(parsed).where(eq(users.id, parseInt(id))).returning();
    if (!item) throw new NotFoundError('User not found');
    return NextResponse.json({ success: true, data: item });
  } catch (e) {
    if (e instanceof z.ZodError) return NextResponse.json({ success: false, error: 'Validation failed', details: e.issues }, { status: 400 });
    const err = errorResponse(e); return NextResponse.json(err, { status: err.statusCode });
  }
}

export const GET = withMiddleware(withAuth(getHandler));
export const PUT = withMiddleware(withAuth(updateHandler));
