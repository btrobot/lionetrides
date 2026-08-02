import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { products } from '@/db/schema';
import { eq, like, and, desc, asc, sql } from 'drizzle-orm';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '20');
    const offset = (page - 1) * limit;
    const category = searchParams.get('category');
    const brand = searchParams.get('brand');
    const search = searchParams.get('search');
    const sort = searchParams.get('sort') || 'newest';

    const conditions = [eq(products.deleted_at, null as unknown as Date)];

    if (category) {
      conditions.push(sql`${products.category_id} IN (SELECT id FROM categories WHERE slug = ${category})`);
    }

    if (search) {
      conditions.push(
        sql`to_tsvector('simple', coalesce(${products.name}, '') || ' ' || coalesce(${products.description}, '')) @@ plainto_tsquery('simple', ${search})`
      );
    }

    const orderBy = sort === 'price-asc' 
      ? asc(products.price)
      : sort === 'price-desc'
      ? desc(products.price)
      : desc(products.created_at);

    const items = await db
      .select()
      .from(products)
      .where(and(...conditions))
      .limit(limit)
      .offset(offset)
      .orderBy(orderBy);

    const total = await db
      .select({ count: sql<number>`count(*)` })
      .from(products)
      .where(and(...conditions))
      .then((r) => Number(r[0].count));

    return NextResponse.json({
      items,
      total,
      page,
      limit,
    });
  } catch (error) {
    console.error('Error fetching products:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}