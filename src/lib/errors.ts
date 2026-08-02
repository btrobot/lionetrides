// ─── Domain Error Classes ──────────────────────────────
export class AppError extends Error {
  constructor(
    message: string,
    public statusCode: number = 500,
    public code: string = 'INTERNAL_ERROR'
  ) {
    super(message);
    this.name = this.constructor.name;
  }
}

export class NotFoundError extends AppError {
  constructor(resource: string = 'Resource') {
    super(`${resource} not found`, 404, 'NOT_FOUND');
  }
}

export class ValidationError extends AppError {
  constructor(message: string = 'Validation failed') {
    super(message, 400, 'VALIDATION_ERROR');
  }
}

export class AuthError extends AppError {
  constructor(message: string = 'Authentication required') {
    super(message, 401, 'AUTH_ERROR');
  }
}

export class ForbiddenError extends AppError {
  constructor(message: string = 'Access denied') {
    super(message, 403, 'FORBIDDEN');
  }
}

export class ConflictError extends AppError {
  constructor(message: string = 'Resource already exists') {
    super(message, 409, 'CONFLICT');
  }
}

// ─── Error Response Helper ─────────────────────────────
export function errorResponse(error: unknown) {
  if (error instanceof AppError) {
    return {
      success: false as const,
      error: error.message,
      code: error.code,
      statusCode: error.statusCode,
    };
  }

  if (error instanceof Error) {
    console.error('Unhandled error:', error);
    return {
      success: false as const,
      error: 'Internal server error',
      code: 'INTERNAL_ERROR',
      statusCode: 500,
    };
  }

  return {
    success: false as const,
    error: 'Unknown error',
    code: 'UNKNOWN',
    statusCode: 500,
  };
}

// ─── Pagination ────────────────────────────────────────
export interface PaginationParams {
  page: number;
  pageSize: number;
}

export interface PaginatedResult<T> {
  items: T[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

export function parsePagination(searchParams: URLSearchParams): PaginationParams {
  const page = Math.max(1, parseInt(searchParams.get('page') || '1', 10));
  const pageSize = Math.min(100, Math.max(1, parseInt(searchParams.get('pageSize') || '12', 10)));
  return { page, pageSize };
}

export function paginatedResponse<T>(items: T[], total: number, params: PaginationParams): PaginatedResult<T> {
  return {
    items,
    total,
    page: params.page,
    pageSize: params.pageSize,
    totalPages: Math.ceil(total / params.pageSize),
  };
}

// ─── Cache Helper ──────────────────────────────────────
export function cacheResponse(seconds: number) {
  return {
    'Cache-Control': `public, s-maxage=${seconds}, stale-while-revalidate=${seconds * 2}`,
  };
}