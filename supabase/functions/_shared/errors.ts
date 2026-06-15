export class ApiError extends Error {
  constructor(
    public statusCode: number,
    public code: string,
    message: string,
    public details?: unknown,
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

export const Errors = {
  unauthorized: (msg = 'Authentication required') =>
    new ApiError(401, 'UNAUTHORIZED', msg),

  forbidden: (msg = 'Insufficient permissions') =>
    new ApiError(403, 'FORBIDDEN', msg),

  notFound: (resource = 'Resource') =>
    new ApiError(404, 'NOT_FOUND', `${resource} not found`),

  badRequest: (msg: string, details?: unknown) =>
    new ApiError(400, 'BAD_REQUEST', msg, details),

  validation: (details: unknown) =>
    new ApiError(422, 'VALIDATION_ERROR', 'Request validation failed', details),

  rateLimited: (resetAt?: string) =>
    new ApiError(429, 'RATE_LIMITED', 'Too many requests', { reset_at: resetAt }),

  quotaExceeded: (msg = 'API usage quota exceeded') =>
    new ApiError(402, 'QUOTA_EXCEEDED', msg),

  conflict: (msg: string) =>
    new ApiError(409, 'CONFLICT', msg),

  internal: (msg = 'Internal server error') =>
    new ApiError(500, 'INTERNAL_ERROR', msg),
};

export function handleError(error: unknown, requestId: string): Response {
  if (error instanceof ApiError) {
    return new Response(
      JSON.stringify({
        error: {
          code: error.code,
          message: error.message,
          details: error.details ?? null,
          request_id: requestId,
        },
      }),
      {
        status: error.statusCode,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*',
          'X-Request-Id': requestId,
        },
      },
    );
  }

  console.error(`[${requestId}] Unhandled error:`, error);

  return new Response(
    JSON.stringify({
      error: {
        code: 'INTERNAL_ERROR',
        message: 'An unexpected error occurred',
        request_id: requestId,
      },
    }),
    {
      status: 500,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
        'X-Request-Id': requestId,
      },
    },
  );
}
