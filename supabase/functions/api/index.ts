import { serve } from 'https://deno.land/std@0.224.0/http/server.ts';
import { handleCors } from '../_shared/cors.ts';
import { authenticate, getClientIp } from '../_shared/auth.ts';
import { handleError } from '../_shared/errors.ts';
import { checkRateLimit } from '../_shared/rate-limit.ts';
import { createRequestId, logRequest, hashIp } from '../_shared/logger.ts';
import { handleProfile, handleSettings, handlePlans, handleSubscription } from '../_shared/handlers/profile.ts';
import { handlePrompts, handleContent } from '../_shared/handlers/ai.ts';
import { handleScans, handleNotes, handleAnalytics, handleAuditLogs } from '../_shared/handlers/data.ts';

const API_VERSION = 'v1';

serve(async (req: Request) => {
  const corsResponse = handleCors(req);
  if (corsResponse) return corsResponse;

  const startTime = Date.now();
  const requestId = req.headers.get('x-request-id') ?? createRequestId();
  const url = new URL(req.url);
  const path = url.pathname.replace(/^\/api/, '').replace(new RegExp(`^/${API_VERSION}`), '');

  let statusCode = 200;
  let userId: string | undefined;
  let errorMessage: string | undefined;

  try {
    // Health check (no auth)
    if (path === '/health' && req.method === 'GET') {
      return new Response(
        JSON.stringify({
          status: 'healthy',
          version: API_VERSION,
          timestamp: new Date().toISOString(),
          request_id: requestId,
        }),
        {
          status: 200,
          headers: {
            'Content-Type': 'application/json',
            'Access-Control-Allow-Origin': '*',
            'X-Request-Id': requestId,
          },
        },
      );
    }

    const auth = await authenticate(req);
    userId = auth.user.id;

    const ip = await hashIp(getClientIp(req));
    const routeTier = getRouteTier(path, req.method);
    const rateLimit = await checkRateLimit(userId, `${req.method}:${path}`, routeTier);

    const segments = path.split('/').filter(Boolean);
    const resource = segments[0];
    const resourceId = segments[1];
    const subResource = segments[1];
    const subResourceId = segments[2];

    let response: Response;

    switch (resource) {
      case 'profile':
        response = await handleProfile(req, auth, requestId);
        break;

      case 'settings':
        response = await handleSettings(req, auth, requestId);
        break;

      case 'plans':
        response = await handlePlans(req, auth, requestId);
        break;

      case 'subscription':
        response = await handleSubscription(req, auth, requestId);
        break;

      case 'prompts':
        if (subResource === 'templates') {
          response = await handlePrompts(req, auth, requestId);
        } else {
          response = await handlePrompts(req, auth, requestId, resourceId);
        }
        break;

      case 'content':
        response = await handleContent(req, auth, requestId, resourceId);
        break;

      case 'scans':
        response = await handleScans(req, auth, requestId, resourceId);
        break;

      case 'notes':
        response = await handleNotes(req, auth, requestId, resourceId);
        break;

      case 'analytics':
        response = await handleAnalytics(req, auth, requestId);
        break;

      case 'audit-logs':
        response = await handleAuditLogs(req, auth, requestId);
        break;

      default:
        response = new Response(
          JSON.stringify({
            error: { code: 'NOT_FOUND', message: `Route ${path} not found`, request_id: requestId },
          }),
          {
            status: 404,
            headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
          },
        );
    }

    statusCode = response.status;

    const headers = new Headers(response.headers);
    headers.set('X-Request-Id', requestId);
    headers.set('X-RateLimit-Remaining', String(rateLimit.remaining));
    headers.set('X-RateLimit-Reset', rateLimit.resetAt);
    headers.set('Access-Control-Allow-Origin', '*');

    return new Response(response.body, { status: response.status, headers });
  } catch (error) {
    statusCode = error instanceof Error && 'statusCode' in error
      ? (error as { statusCode: number }).statusCode
      : 500;
    errorMessage = error instanceof Error ? error.message : String(error);
    return handleError(error, requestId);
  } finally {
    const durationMs = Date.now() - startTime;
    await logRequest({
      requestId,
      method: req.method,
      path: url.pathname,
      statusCode,
      durationMs,
      userId,
      ipHash: await hashIp(getClientIp(req)),
      userAgent: req.headers.get('user-agent') ?? undefined,
      errorMessage,
    }).catch(() => {});
  }
});

function getRouteTier(
  path: string,
  method: string,
): 'default' | 'auth' | 'ai' | 'scan' | 'write' {
  if (path.startsWith('/prompts') || path.startsWith('/content')) {
    return method === 'POST' ? 'ai' : 'default';
  }
  if (path.startsWith('/scans')) {
    return method === 'POST' ? 'scan' : 'default';
  }
  if (method === 'POST' || method === 'PATCH' || method === 'DELETE') {
    return 'write';
  }
  return 'default';
}
