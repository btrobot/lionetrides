import { NextRequest, NextResponse } from 'next/server';
import { withMiddleware, withEditor } from '@/middleware/api';
import { importProductsFromCSV } from '@/services/product-import-export-service';

// POST /api/v1/products/import — Import products from CSV
async function handler(request: NextRequest) {
  try {
    const contentType = request.headers.get('content-type') || '';
    let csvContent = '';
    const mode = request.nextUrl.searchParams.get('mode') || 'create';

    if (contentType.includes('text/csv') || contentType.includes('application/csv')) {
      csvContent = await request.text();
    } else if (contentType.includes('application/json')) {
      const body = await request.json();
      csvContent = body.csv || '';
      if (!csvContent) {
        return NextResponse.json(
          { success: false, error: 'Missing "csv" field in request body' },
          { status: 400 }
        );
      }
    } else if (contentType.includes('multipart/form-data')) {
      const formData = await request.formData();
      const file = formData.get('file');
      if (!file || !(file instanceof File)) {
        return NextResponse.json(
          { success: false, error: 'No file uploaded. Use "file" field.' },
          { status: 400 }
        );
      }
      csvContent = await file.text();
    } else {
      // Try reading as plain text (CSV)
      csvContent = await request.text();
    }

    if (!csvContent.trim()) {
      return NextResponse.json(
        { success: false, error: 'CSV content is empty' },
        { status: 400 }
      );
    }

    // Validate mode
    if (!['create', 'upsert'].includes(mode)) {
      return NextResponse.json(
        { success: false, error: 'Invalid mode. Use "create" or "upsert".' },
        { status: 400 }
      );
    }

    const result = await importProductsFromCSV(csvContent, mode as 'create' | 'upsert');

    return NextResponse.json({
      success: true,
      data: result,
    });
  } catch (error) {
    console.error('Import error:', error);
    return NextResponse.json(
      { success: false, error: 'Import failed' },
      { status: 500 }
    );
  }
}

export const POST = withMiddleware(withEditor(handler));
