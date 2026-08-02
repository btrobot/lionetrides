import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import bcrypt from 'bcryptjs';
import { db } from '@/db';
import { users } from '@/db/schema';
import { eq } from 'drizzle-orm';

const registerSchema = z.object({
  name: z.string().min(2),
  email: z.string().email(),
  password: z.string().min(6),
  company: z.string().optional(),
  phone: z.string().optional(),
});

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});

export async function POST(request: NextRequest) {
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
        return NextResponse.json(
          { success: false, error: 'Email already registered' },
          { status: 409 }
        );
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

      return NextResponse.json({
        success: true,
        data: { id: user.id, email: user.email, name: user.name },
      });
    }

    if (action === 'login') {
      const parsed = loginSchema.parse(body);
      const [user] = await db
        .select()
        .from(users)
        .where(eq(users.email, parsed.email))
        .limit(1);

      if (!user || !(await bcrypt.compare(parsed.password, user.password_hash))) {
        return NextResponse.json(
          { success: false, error: 'Invalid email or password' },
          { status: 401 }
        );
      }

      return NextResponse.json({
        success: true,
        data: { id: user.id, email: user.email, name: user.name, role: user.role },
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
    console.error('Auth error:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}