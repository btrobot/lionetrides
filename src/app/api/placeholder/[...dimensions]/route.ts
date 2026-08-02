import { NextResponse } from 'next/server';

const DEFAULT_WIDTH = 600;
const DEFAULT_HEIGHT = 400;
const MAX_DIMENSION = 2400;

function parseDimension(value: string | undefined, fallback: number) {
  const dimension = Number.parseInt(value ?? '', 10);

  if (!Number.isFinite(dimension) || dimension <= 0) {
    return fallback;
  }

  return Math.min(dimension, MAX_DIMENSION);
}

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ dimensions: string[] }> }
) {
  const { dimensions } = await params;
  const width = parseDimension(dimensions[0], DEFAULT_WIDTH);
  const height = parseDimension(dimensions[1], DEFAULT_HEIGHT);

  // 生成 SVG 占位图
  const svg = `
    <svg width="${width}" height="${height}" xmlns="http://www.w3.org/2000/svg">
      <rect width="100%" height="100%" fill="#e2e8f0"/>
      <text x="50%" y="50%" font-family="Arial, sans-serif" font-size="18" fill="#94a3b8" text-anchor="middle" dy=".3em">${width} x ${height}</text>
    </svg>
  `;

  return new NextResponse(svg, {
    headers: {
      'Content-Type': 'image/svg+xml',
      'Cache-Control': 'public, max-age=31536000, immutable',
    },
  });
}
