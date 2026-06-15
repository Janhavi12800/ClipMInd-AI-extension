import { serve } from 'https://deno.land/std@0.224.0/http/server.ts';
import { handleCors } from '../_shared/cors.ts';
import { handleAuthSession } from '../_shared/handlers/auth.ts';
import { handleError } from '../_shared/errors.ts';
import { checkRateLimit } from '../_shared/rate-limit.ts';
import { createRequestId, logRequest, hashIp } from '../_shared/logger.ts';
import { getClientIp } from '../_shared/auth.ts';

serve(async (req: Request) => {
  const corsResponse = handleCors(req);
  if (corsResponse) return corsResponse;

  const startTime = Date.now();
  const requestId = req.headers.get('x-request-id') ?? createRequestId();
  let statusCode = 200;
  let errorMessage: string | undefined;

  try {
    const ip = await hashIp(getClientIp(req));
    await checkRateLimit(ip, `auth:${req.method}:${new URL(req.url).pathname}`, 'auth');

    const response = await handleAuthSession(req, requestId);
    statusCode = response.status;

    const headers = new Headers(response.headers);
    headers.set('X-Request-Id', requestId);
    headers.set('Access-Control-Allow-Origin', '*');

    return new Response(response.body, { status: response.status, headers });
  } catch (error) {
    statusCode = error instanceof Error && 'statusCode' in error
      ? (error as { statusCode: number }).statusCode
      : 500;
    errorMessage = error instanceof Error ? error.message : String(error);
    return handleError(error, requestId);
  } finally {
    await logRequest({
      requestId,
      method: req.method,
      path: new URL(req.url).pathname,
      statusCode,
      durationMs: Date.now() - startTime,
      ipHash: await hashIp(getClientIp(req)),
      userAgent: req.headers.get('user-agent') ?? undefined,
      errorMessage,
    }).catch(() => {});
  }
});
