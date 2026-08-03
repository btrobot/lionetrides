import { NextRequest, NextResponse } from 'next/server';
import { withMiddleware, withEditor } from '@/middleware/api';
import { exportProductsToCSV, exportProductsToJSON } from '@/services/product-import-export-service';

// GET /api/v1/products/export — Export products as CSV or JSON
async function handler(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const format = searchParams.get('format') || 'csv';

    if (format === 'csv') {
      const csv = await exportProductsToCSV();
      const timestamp = new Date().toISOString().split('T')[0];
      return new NextResponse(csv, {
        headers: {
          'Content-Type': 'text/csv; charset=utf-8',
          'Content-Disposition': `attachment; filename="products-export-${timestamp}.csv"`,
          'Cache-Control': 'no-store',
        },
      });
    }

    if (format === 'json') {
      const data = await exportProductsToJSON();
      const timestamp = new Date().toISOString().split('T')[0];
      return NextResponse.json(
        { success: true, data, filename: `products-export-${timestamp}.json` },
        { headers: { 'Cache-Control': 'no-store' } }
      );
    }

    return NextResponse.json(
      { success: false, error: 'Unsupported format. Use "csv" or "json".' },
      { status: 400 }
    );
  } catch (error) {
    console.error('Export error:', error);
    return NextResponse.json(
      { success: false, error: 'Export failed' },
      { status: 500 }
    );
  }
}

export const GET = withMiddleware(withEditor(handler));
