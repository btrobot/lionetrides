import { NextRequest, NextResponse } from 'next/server';
import { withMiddleware, withAdmin } from '@/middleware/api';
import { db } from '@/db';
import { users } from '@/db/schema';
import { isNull, desc, ilike, and } from 'drizzle-orm';
import { errorResponse, paginatedResponse } from '@/lib/errors';

async function listHandler(request: NextRequest, _context: { params: Promise<{}> }) {
  try {
    const { searchParams } = new URL(request.url);
    const page = Math.max(1, Number(searchParams.get('page')) || 1);
    const pageSize = Math.min(100, Math.max(1, Number(searchParams.get('pageSize')) || 10));
    const search = searchParams.get('search');
    const conditions = [isNull(users.deleted_at)];
    if (search) conditions.push(ilike(users.name, `%${search}%`));
    const items = await db.select({ id: users.id, name: users.name, email: users.email, phone: users.phone, company: users.company, role: users.role, isActive: users.is_active, createdAt: users.created_at, lastLoginAt: users.last_login_at }).from(users)
      .where(conditions.length === 1 ? conditions[0] : and(...conditions))
      .orderBy(desc(users.created_at)).limit(pageSize).offset((page - 1) * pageSize);
    const [{ count }] = await db.select({ count: users.id }).from(users)
      .where(conditions.length === 1 ? conditions[0] : and(...conditions));
    return NextResponse.json({ success: true, data: paginatedResponse(items, count, { page, pageSize }) });
  } catch (e) { const err = errorResponse(e); return NextResponse.json(err, { status: err.statusCode }); }
}
export const GET = withMiddleware(withAdmin(listHandler));
