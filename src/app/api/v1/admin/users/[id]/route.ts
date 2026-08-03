import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { withSuperAdmin } from '@/middleware/api';
import { db } from '@/db';
import { users } from '@/db/schema';
import { eq } from 'drizzle-orm';
import { errorResponse } from '@/lib/errors';

const updateSchema = z.object({
  name: z.string().min(1).optional(),
  role: z.enum(['customer', 'admin', 'super_admin', 'editor', 'viewer']).optional(),
  isActive: z.boolean().optional(),
  company: z.string().optional(),
  phone: z.string().optional(),
});

async function updateHandler(
  request: NextRequest,
  { params }: { params: Promise<Record<string, string>> }
) {
  try {
    const { id } = await params;
    const userId = Number(id);
    if (!userId) {
      return NextResponse.json({ success: false, error: 'Invalid user ID' }, { status: 400 });
    }
    const body = await request.json();
    const parsed = updateSchema.parse(body);
    const updateData: Record<string, string | boolean | null> = {};
    if (parsed.name !== undefined) updateData.name = parsed.name;
    if (parsed.role !== undefined) updateData.role = parsed.role;
    if (parsed.isActive !== undefined) updateData.is_active = parsed.isActive;
    if (parsed.company !== undefined) updateData.company = parsed.company;
    if (parsed.phone !== undefined) updateData.phone = parsed.phone;
    if (Object.keys(updateData).length === 0) {
      return NextResponse.json({ success: false, error: 'No fields to update' }, { status: 400 });
    }
    const [user] = await db.update(users)
      .set({ ...updateData, updated_at: new Date() })
      .where(eq(users.id, userId))
      .returning({ id: users.id, name: users.name, email: users.email, role: users.role, isActive: users.is_active });
    if (!user) {
      return NextResponse.json({ success: false, error: 'User not found' }, { status: 404 });
    }
    return NextResponse.json({ success: true, data: user });
  } catch (e) {
    if (e instanceof z.ZodError) return NextResponse.json({ success: false, error: 'Validation failed', details: e.issues }, { status: 400 });
    const err = errorResponse(e); return NextResponse.json(err, { status: err.statusCode });
  }
}

export const PUT = withSuperAdmin(updateHandler);