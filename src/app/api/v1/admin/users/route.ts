import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { withSuperAdmin } from '@/middleware/api';
import { db } from '@/db';
import { users } from '@/db/schema';
import { isNull, desc, ilike, and, eq, count } from 'drizzle-orm';
import { errorResponse, paginatedResponse } from '@/lib/errors';
import bcrypt from 'bcryptjs';

const createSchema = z.object({
  email: z.string().email(),
  password: z.string().min(6),
  name: z.string().min(1),
  role: z.enum(['editor', 'viewer', 'admin']),
  company: z.string().optional(),
  phone: z.string().optional(),
});

async function listHandler(request: NextRequest, _context: { params: Promise<Record<string, string>> }) {
  try {
    const { searchParams } = new URL(request.url);
    const page = Math.max(1, Number(searchParams.get('page')) || 1);
    const pageSize = Math.min(100, Math.max(1, Number(searchParams.get('pageSize')) || 10));
    const search = searchParams.get('search');
    const conditions = [isNull(users.deleted_at)];
    if (search) conditions.push(ilike(users.name, `%${search}%`));
    const items = await db.select({
      id: users.id, name: users.name, email: users.email, phone: users.phone,
      company: users.company, role: users.role, isActive: users.is_active,
      createdAt: users.created_at, lastLoginAt: users.last_login_at,
    }).from(users)
      .where(conditions.length === 1 ? conditions[0] : and(...conditions))
      .orderBy(desc(users.created_at)).limit(pageSize).offset((page - 1) * pageSize);
    const [{ count: total }] = await db.select({ count: count() }).from(users)
      .where(conditions.length === 1 ? conditions[0] : and(...conditions));
    return NextResponse.json({ success: true, data: paginatedResponse(items, total, { page, pageSize }) });
  } catch (e) { const err = errorResponse(e); return NextResponse.json(err, { status: err.statusCode }); }
}

async function createHandler(request: NextRequest) {
  try {
    const body = await request.json();
    const parsed = createSchema.parse(body);
    const existing = await db.select({ id: users.id }).from(users)
      .where(eq(users.email, parsed.email)).limit(1);
    if (existing.length > 0) {
      return NextResponse.json({ success: false, error: '该邮箱已被注册' }, { status: 409 });
    }
    const passwordHash = await bcrypt.hash(parsed.password, 12);
    const [user] = await db.insert(users).values({
      email: parsed.email,
      password_hash: passwordHash,
      name: parsed.name,
      role: parsed.role,
      company: parsed.company || null,
      phone: parsed.phone || null,
      is_active: true,
    }).returning({ id: users.id, name: users.name, email: users.email, role: users.role, isActive: users.is_active, createdAt: users.created_at });
    return NextResponse.json({ success: true, data: user }, { status: 201 });
  } catch (e) {
    if (e instanceof z.ZodError) return NextResponse.json({ success: false, error: 'Validation failed', details: e.issues }, { status: 400 });
    const err = errorResponse(e); return NextResponse.json(err, { status: err.statusCode });
  }
}

export const GET = withSuperAdmin(listHandler);
export const POST = withSuperAdmin(createHandler);