import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { db } from '@/db';
import { inquiries } from '@/db/schema';

const inquirySchema = z.object({
  name: z.string().min(2),
  email: z.string().email(),
  phone: z.string().optional(),
  company: z.string().optional(),
  quantity: z.coerce.number().min(1).default(1),
  message: z.string().min(10),
  productId: z.number().optional(),
});

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const parsed = inquirySchema.parse(body);

    const inquiryNo = `INQ-${Date.now()}-${Math.random().toString(36).slice(2, 6).toUpperCase()}`;

    const [inquiry] = await db
      .insert(inquiries)
      .values({
        inquiry_no: inquiryNo,
        contact_name: parsed.name,
        contact_email: parsed.email,
        contact_phone: parsed.phone || null,
        company_name: parsed.company || null,
        quantity: parsed.quantity,
        message: parsed.message,
        product_id: parsed.productId || 0,
      })
      .returning();

    return NextResponse.json({
      success: true,
      data: inquiry,
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { success: false, error: 'Validation failed', details: error.issues },
        { status: 400 }
      );
    }
    console.error('Inquiry submission error:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '20');
    const offset = (page - 1) * limit;

    const items = await db
      .select()
      .from(inquiries)
      .limit(limit)
      .offset(offset)
      .orderBy(inquiries.created_at);

    const total = await db.$count(inquiries);

    return NextResponse.json({
      items,
      total,
      page,
      limit,
    });
  } catch (error) {
    console.error('Error fetching inquiries:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}