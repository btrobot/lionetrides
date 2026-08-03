import { NextResponse } from 'next/server';
import { withMiddleware, withAdmin } from '@/middleware/api';
import { db } from '@/db';
import {
  products,
  inquiries,
  users,
  categories,
  reviews,
  news,
} from '@/db/schema';
import { eq, isNull, and, count, sql, desc } from 'drizzle-orm';
import { errorResponse } from '@/lib/errors';

// GET /api/v1/admin/dashboard — Dashboard statistics & chart data
async function handler() {
  try {
    // ─── 1. Overview counts ──────────────────────────────
    const [productCount] = await db
      .select({ count: count() })
      .from(products)
      .where(isNull(products.deleted_at));
    const [inquiryCount] = await db
      .select({ count: count() })
      .from(inquiries)
      .where(isNull(inquiries.deleted_at));
    const [userCount] = await db
      .select({ count: count() })
      .from(users)
      .where(isNull(users.deleted_at));
    const [categoryCount] = await db
      .select({ count: count() })
      .from(categories)
      .where(isNull(categories.deleted_at));
    const [reviewCount] = await db
      .select({ count: count() })
      .from(reviews)
      .where(isNull(reviews.deleted_at));
    const [newsCount] = await db
      .select({ count: count() })
      .from(news)
      .where(isNull(news.deleted_at));

    // ─── 2. Product status distribution ──────────────────
    const productStatusDist = await db
      .select({
        status: products.status,
        count: count(),
      })
      .from(products)
      .where(isNull(products.deleted_at))
      .groupBy(products.status)
      .orderBy(products.status);

    // ─── 3. Inquiry status breakdown ─────────────────────
    const inquiryStatusDist = await db
      .select({
        status: inquiries.status,
        count: count(),
      })
      .from(inquiries)
      .where(isNull(inquiries.deleted_at))
      .groupBy(inquiries.status)
      .orderBy(inquiries.status);

    // ─── 4. Monthly inquiry trends (last 12 months) ──────
    const monthlyInquiries = await db
      .select({
        month: sql<string>`to_char(${inquiries.created_at}, 'YYYY-MM')`,
        count: count(),
      })
      .from(inquiries)
      .where(
        and(
          isNull(inquiries.deleted_at),
          sql`${inquiries.created_at} >= NOW() - INTERVAL '12 months'`
        )
      )
      .groupBy(sql`to_char(${inquiries.created_at}, 'YYYY-MM')`)
      .orderBy(sql`to_char(${inquiries.created_at}, 'YYYY-MM')`);

    // ─── 5. Category distribution (products per category) ─
    const categoryDist = await db
      .select({
        name: categories.name,
        count: count(),
      })
      .from(products)
      .innerJoin(categories, eq(products.category_id, categories.id))
      .where(
        and(
          isNull(products.deleted_at),
          eq(products.status, 'published'),
          isNull(categories.deleted_at)
        )
      )
      .groupBy(categories.name)
      .orderBy(desc(count()));

    // ─── 6. User registration trends (last 12 months) ────
    const monthlyUsers = await db
      .select({
        month: sql<string>`to_char(${users.created_at}, 'YYYY-MM')`,
        count: count(),
      })
      .from(users)
      .where(
        and(
          isNull(users.deleted_at),
          sql`${users.created_at} >= NOW() - INTERVAL '12 months'`
        )
      )
      .groupBy(sql`to_char(${users.created_at}, 'YYYY-MM')`)
      .orderBy(sql`to_char(${users.created_at}, 'YYYY-MM')`);

    // ─── 7. User role distribution ───────────────────────
    const userRoleDist = await db
      .select({
        role: users.role,
        count: count(),
      })
      .from(users)
      .where(isNull(users.deleted_at))
      .groupBy(users.role)
      .orderBy(users.role);

    // ─── 8. Top products by inquiry count ────────────────
    const topProducts = await db
      .select({
        id: products.id,
        name: products.name,
        inquiryCount: count(),
      })
      .from(inquiries)
      .innerJoin(products, eq(inquiries.product_id, products.id))
      .where(
        and(
          isNull(inquiries.deleted_at),
          isNull(products.deleted_at)
        )
      )
      .groupBy(products.id, products.name)
      .orderBy(desc(count()))
      .limit(10);

    // ─── 9. Recent activity (last 7 inquiries) ──────────
    const recentActivity = await db
      .select({
        id: inquiries.id,
        inquiryNo: inquiries.inquiry_no,
        contactName: inquiries.contact_name,
        companyName: inquiries.company_name,
        status: inquiries.status,
        createdAt: inquiries.created_at,
      })
      .from(inquiries)
      .where(isNull(inquiries.deleted_at))
      .orderBy(desc(inquiries.created_at))
      .limit(7);

    return NextResponse.json({
      success: true,
      data: {
        overview: {
          products: Number(productCount.count),
          inquiries: Number(inquiryCount.count),
          users: Number(userCount.count),
          categories: Number(categoryCount.count),
          reviews: Number(reviewCount.count),
          news: Number(newsCount.count),
        },
        productStatusDistribution: productStatusDist.map((s) => ({
          status: s.status,
          count: Number(s.count),
        })),
        inquiryStatusDistribution: inquiryStatusDist.map((s) => ({
          status: s.status,
          count: Number(s.count),
        })),
        monthlyInquiries: monthlyInquiries.map((m) => ({
          month: m.month,
          count: Number(m.count),
        })),
        categoryDistribution: categoryDist.map((c) => ({
          name: c.name,
          count: Number(c.count),
        })),
        monthlyUsers: monthlyUsers.map((m) => ({
          month: m.month,
          count: Number(m.count),
        })),
        userRoleDistribution: userRoleDist.map((r) => ({
          role: r.role,
          count: Number(r.count),
        })),
        topProducts: topProducts.map((p) => ({
          id: p.id,
          name: p.name,
          count: Number(p.inquiryCount),
        })),
        recentActivity: recentActivity.map((a) => ({
          ...a,
          createdAt: a.createdAt?.toISOString(),
        })),
      },
    });
  } catch (error) {
    const err = errorResponse(error);
    return NextResponse.json(
      { success: err.success, error: err.error, code: err.code },
      { status: err.statusCode }
    );
  }
}

export const GET = withMiddleware(withAdmin(handler));