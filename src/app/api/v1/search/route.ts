import { NextRequest, NextResponse } from 'next/server';
import { productService } from '@/services/product-service';
import { newsService } from '@/services/news-service';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const q = searchParams.get('q')?.trim() || '';
    const type = searchParams.get('type') || 'all'; // all | products | news
    const page = Math.max(1, Number(searchParams.get('page')) || 1);
    const pageSize = Math.min(50, Math.max(1, Number(searchParams.get('pageSize')) || 12));

    if (!q) {
      return NextResponse.json({
        success: true,
        data: { products: [], news: [], total: 0, query: '' },
      });
    }

    const results: { products: unknown[]; news: unknown[]; total: number } = {
      products: [],
      news: [],
      total: 0,
    };

    if (type === 'all' || type === 'products') {
      const productResult = await productService.list({ search: q, page, pageSize, sortBy: 'created_at', sortOrder: 'desc' });
      results.products = productResult.items;
      results.total += productResult.total;
    }

    if (type === 'all' || type === 'news') {
      const newsResult = await newsService.list({ search: q, page, pageSize });
      results.news = newsResult.items;
      results.total += newsResult.total;
    }

    return NextResponse.json({ success: true, data: results, query: q });
  } catch (error) {
    console.error('Search API error:', error);
    return NextResponse.json(
      { success: false, error: '搜索失败', code: 'SEARCH_ERROR', statusCode: 500 },
      { status: 500 }
    );
  }
}