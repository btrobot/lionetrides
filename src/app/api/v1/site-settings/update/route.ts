import { NextRequest, NextResponse } from 'next/server';
import { withSuperAdmin } from '@/middleware/api';
import { upsertSiteSetting } from '@/services/site-settings-service';

async function handler(request: NextRequest) {
  try {
    const body = await request.json();
    const { key, value, locale, type, section, label, sortOrder } = body;

    if (!key) {
      return NextResponse.json(
        { success: false, error: 'key is required' },
        { status: 400 },
      );
    }

    const result = await upsertSiteSetting({
      key,
      value: value ?? '',
      locale: locale || 'en',
      type: type || 'text',
      section: section || 'general',
      label: label || key,
      sortOrder: sortOrder || 0,
    });

    return NextResponse.json({ success: true, data: result });
  } catch (error) {
    console.error('Failed to update site setting:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to update site setting' },
      { status: 500 },
    );
  }
}

export const POST = withSuperAdmin(handler);
export const PUT = withSuperAdmin(handler);