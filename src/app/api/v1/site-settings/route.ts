import { NextRequest, NextResponse } from 'next/server';
import { getSiteConfig } from '@/services/site-settings-service';

export async function GET(request: NextRequest) {
  const locale = request.nextUrl.searchParams.get('locale') || 'en';
  try {
    const config = await getSiteConfig(locale);
    return NextResponse.json({ success: true, data: config });
  } catch (error) {
    console.error('Failed to fetch site config:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch site settings' },
      { status: 500 },
    );
  }
}