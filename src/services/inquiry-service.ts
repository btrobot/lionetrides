import { db } from '@/db';
import { inquiries, inquiry_history } from '@/db/schema';
import { eq, and, isNull, desc, count } from 'drizzle-orm';
import { NotFoundError, paginatedResponse } from '@/lib/errors';

type InquiryStatus = 'pending' | 'replied' | 'closed';

export const inquiryService = {
  async create(data: {
    name: string;
    email: string;
    phone?: string;
    company?: string;
    quantity?: number;
    message: string;
    product_id?: number;
    user_id?: number;
  }) {
    const inquiryNo = `INQ-${Date.now().toString(36).toUpperCase()}-${Math.random().toString(36).slice(2, 6).toUpperCase()}`;

    const [inquiry] = await db
      .insert(inquiries)
      .values({
        inquiry_no: inquiryNo,
        contact_name: data.name,
        contact_email: data.email,
        contact_phone: data.phone || null,
        company_name: data.company || null,
        quantity: data.quantity || 1,
        message: data.message,
        product_id: data.product_id || 0,
        user_id: data.user_id || null,
        status: 'pending',
      })
      .returning();

    return inquiry;
  },

  async list(params: { page?: number; pageSize?: number; userId?: number; status?: string }) {
    const { page = 1, pageSize = 10, userId, status } = params;

    const conditions = [isNull(inquiries.deleted_at)];
    if (userId) conditions.push(eq(inquiries.user_id, userId));
    if (status) conditions.push(eq(inquiries.status, status as InquiryStatus));

    const where = and(...conditions);

    const [totalResult] = await db.select({ count: count() }).from(inquiries).where(where);
    const total = Number(totalResult.count);

    const items = await db
      .select()
      .from(inquiries)
      .where(where)
      .orderBy(desc(inquiries.created_at))
      .limit(pageSize)
      .offset((page - 1) * pageSize);

    return paginatedResponse(items, total, { page, pageSize });
  },

  async getById(id: number) {
    const [inquiry] = await db
      .select()
      .from(inquiries)
      .where(and(eq(inquiries.id, id), isNull(inquiries.deleted_at)))
      .limit(1);

    if (!inquiry) throw new NotFoundError('Inquiry');
    return inquiry;
  },

  async updateStatus(id: number, status: string, changedBy?: number, note?: string) {
    const [inquiry] = await db
      .update(inquiries)
      .set({
        status: status as InquiryStatus,
        updated_at: new Date(),
        ...(status === 'replied' ? { replied_at: new Date() } : {}),
        ...(status === 'closed' ? { closed_at: new Date() } : {}),
      })
      .where(eq(inquiries.id, id))
      .returning();

    if (!inquiry) throw new NotFoundError('Inquiry');

    // Log to inquiry_history
    await db.insert(inquiry_history).values({
      inquiry_id: id,
      previous_status: inquiry.status,
      new_status: status as InquiryStatus,
      changed_by: changedBy || null,
      note: note || null,
    });

    return inquiry;
  },
};