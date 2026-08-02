import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import bcrypt from 'bcryptjs';
import { db } from '@/db';
import { users } from '@/db/schema';
import { eq } from 'drizzle-orm';
import { signToken } from '@/lib/auth';
import { withMiddleware } from '@/middleware/api';
import { ConflictError, errorResponse } from '@/lib/errors';

const registerSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters'),
  email: z.string().email('Invalid email address'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
  company: z.string().optional(),
  phone: z.string().optional(),
});

const loginSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(1, 'Password is required'),
});

async function handler(request: NextRequest) {
  try {
    const body = await request.json();
    const { action } = body;

    if (action === 'register') {
      const parsed = registerSchema.parse(body);

      const existing = await db
        .select()
        .from(users)
        .where(eq(users.email, parsed.email))
        .limit(1);

      if (existing.length > 0) {
        throw new ConflictError('Email already registered');
      }

      const passwordHash = await bcrypt.hash(parsed.password, 12);

      const [user] = await db
        .insert(users)
        .values({
          email: parsed.email,
          password_hash: passwordHash,
          name: parsed.name,
          company: parsed.company || null,
          phone: parsed.phone || null,
        })
        .returning();

      const token = signToken({ userId: user.id, email: user.email, role: user.role || 'customer' });

      return NextResponse.json({
        success: true,
        data: { token, user: { id: user.id, email: user.email, name: user.name, role: user.role } },
      });
    }

    if (action === 'login') {
      const parsed = loginSchema.parse(body);

      const [user] = await db
        .select()
        .from(users)
        .where(eq(users.email, parsed.email))
        .limit(1);

      if (!user) {
        return NextResponse.json(
          { success: false, error: 'Invalid email or password' },
          { status: 401 }
        );
      }

      // Check if account is locked
      if (user.locked_until && new Date(user.locked_until) > new Date()) {
        const minutes = Math.ceil((new Date(user.locked_until).getTime() - Date.now()) / 60000);
        return NextResponse.json(
          { success: false, error: "Account locked. Try again in " + minutes + " minutes", code: "ACCOUNT_LOCKED" },
          { status: 423 }
        );
      }

      const valid = await bcrypt.compare(parsed.password, user.password_hash);
      if (!valid) {
        const attempts = (user.login_attempts || 0) + 1;
        const updateData: any = { login_attempts: attempts };
        if (attempts >= 5) {
          updateData.locked_until = new Date(Date.now() + 60 * 60 * 1000); // Lock 1 hour
        }
        await db.update(users).set(updateData).where(eq(users.id, user.id));
        return NextResponse.json(
          { success: false, error: 'Invalid email or password', remaining: 5 - attempts },
          { status: 401 }
        );
      }

      // Reset login attempts on success
      await db.update(users).set({ login_attempts: 0, locked_until: null, last_login_at: new Date() }).where(eq(users.id, user.id));

      const token = signToken({ userId: user.id, email: user.email, role: user.role || 'customer' });

      return NextResponse.json({
        success: true,
        data: { token, user: { id: user.id, email: user.email, name: user.name, role: user.role } },
      });
    }

    return NextResponse.json(
      { success: false, error: 'Invalid action' },
      { status: 400 }
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

export const POST = withMiddleware(handler);