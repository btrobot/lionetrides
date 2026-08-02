import { NextRequest, NextResponse } from 'next/server';
import { verifyToken, getTokenFromRequest, JwtPayload } from '@/lib/auth';

// ─── Extend NextRequest with user info ─────────────────
export interface AuthenticatedRequest extends NextRequest {
  user: JwtPayload;
}

// ─── Rate Limiter (in-memory) ──────────────────────────
const rateLimitMap = new Map<string, { count: number; resetAt: number }>();

export function rateLimit(
  key: string,
  maxRequests: number = 100,
  windowMs: number = 60_000
): { allowed: boolean; remaining: number; resetAt: number } {
  const now = Date.now();
  const entry = rateLimitMap.get(key);

  if (!entry || now > entry.resetAt) {
    rateLimitMap.set(key, { count: 1, resetAt: now + windowMs });
    return { allowed: true, remaining: maxRequests - 1, resetAt: now + windowMs };
  }

  if (entry.count >= maxRequests) {
    return { allowed: false, remaining: 0, resetAt: entry.resetAt };
  }

  entry.count++;
  return { allowed: true, remaining: maxRequests - entry.count, resetAt: entry.resetAt };
}

// ─── Middleware helpers ─────────────────────────────────
type RouteContext = { params: Promise<Record<string, string>> };
type ApiHandler = (request: NextRequest, context: RouteContext) => Promise<NextResponse>;

export function withMiddleware(handler: ApiHandler): ApiHandler {
  return async (request: NextRequest, context: RouteContext) => {
    // Rate limiting by IP
    const ip = request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || 'unknown';
    const rl = rateLimit(ip);
    if (!rl.allowed) {
      return NextResponse.json(
        { success: false, error: 'Too many requests' },
        {
          status: 429,
          headers: {
            'Retry-After': String(Math.ceil((rl.resetAt - Date.now()) / 1000)),
            'X-RateLimit-Remaining': '0',
          },
        }
      );
    }

    // Security headers
    void new Headers({
      'X-Content-Type-Options': 'nosniff',
      'X-Frame-Options': 'DENY',
      'X-XSS-Protection': '1; mode=block',
      'Referrer-Policy': 'strict-origin-when-cross-origin',
      'Permissions-Policy': 'camera=(), microphone=(), geolocation=()',
      'Strict-Transport-Security': 'max-age=31536000; includeSubDomains',
    });

    return handler(request, context);
  };
}

export function withAuth(handler: ApiHandler): ApiHandler {
  return async (request: NextRequest, context: RouteContext) => {
    const token = getTokenFromRequest(request);
    if (!token) {
      return NextResponse.json(
        { success: false, error: 'Authentication required' },
        { status: 401 }
      );
    }

    try {
      const user = verifyToken(token);
      (request as AuthenticatedRequest).user = user;
    } catch {
      return NextResponse.json(
        { success: false, error: 'Invalid or expired token' },
        { status: 401 }
      );
    }

    return handler(request, context);
  };
}

export function withAdmin(handler: ApiHandler): ApiHandler {
  return async (request: NextRequest, context: RouteContext) => {
    const token = getTokenFromRequest(request);
    if (!token) {
      return NextResponse.json(
        { success: false, error: 'Authentication required' },
        { status: 401 }
      );
    }

    try {
      const user = verifyToken(token);
      if (user.role !== 'admin' && user.role !== 'super_admin') {
        return NextResponse.json(
          { success: false, error: 'Admin access required' },
          { status: 403 }
        );
      }
      (request as AuthenticatedRequest).user = user;
    } catch {
      return NextResponse.json(
        { success: false, error: 'Invalid or expired token' },
        { status: 401 }
      );
    }

    return handler(request, context);
  };
}
