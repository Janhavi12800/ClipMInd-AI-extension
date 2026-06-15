import { serve } from 'https://deno.land/std@0.224.0/http/server.ts';
import { handleCors } from '../_shared/cors.ts';
import { authenticate, createServiceClient } from '../_shared/auth.ts';
import { handleError } from '../_shared/errors.ts';
import { createRequestId, logRequest, hashIp } from '../_shared/logger.ts';
import { getClientIp } from '../_shared/auth.ts';
import {
  handleCheckout,
  handleBillingPortal,
  handleCancelSubscription,
  handleActivateFreePlan,
} from '../_shared/handlers/billing.ts';
import { verifyStripeWebhook } from '../_shared/payments/stripe.ts';
import { verifyRazorpayWebhookSignature } from '../_shared/payments/razorpay.ts';
import {
  getPlanByTier,
  recordPaymentEvent,
  markPaymentEventProcessed,
  upsertUserSubscription,
} from '../_shared/payments/subscriptions.ts';

serve(async (req: Request) => {
  const corsResponse = handleCors(req);
  if (corsResponse) return corsResponse;

  const startTime = Date.now();
  const requestId = req.headers.get('x-request-id') ?? createRequestId();
  const url = new URL(req.url);
  const path = url.pathname.replace(/^\/payments/, '');

  let statusCode = 200;
  let userId: string | undefined;
  let errorMessage: string | undefined;

  try {
    if (path === '/webhooks/stripe' && req.method === 'POST') {
      const payload = await req.text();
      const signature = req.headers.get('stripe-signature') ?? '';

      if (!await verifyStripeWebhook(payload, signature)) {
        statusCode = 400;
        return new Response(JSON.stringify({ error: 'Invalid signature' }), { status: 400 });
      }

      const event = JSON.parse(payload);
      const serviceClient = createServiceClient();
      const isNew = await recordPaymentEvent(
        serviceClient,
        'stripe',
        event.id,
        event.type,
        event,
      );

      if (isNew) {
        try {
          await processStripeEvent(serviceClient, event);
          await markPaymentEventProcessed(serviceClient, 'stripe', event.id);
        } catch (err) {
          await markPaymentEventProcessed(
            serviceClient,
            'stripe',
            event.id,
            err instanceof Error ? err.message : String(err),
          );
          throw err;
        }
      }

      return jsonResponse({ received: true }, requestId);
    }

    if (path === '/webhooks/razorpay' && req.method === 'POST') {
      const payload = await req.text();
      const signature = req.headers.get('x-razorpay-signature') ?? '';

      if (!await verifyRazorpayWebhookSignature(payload, signature)) {
        statusCode = 400;
        return new Response(JSON.stringify({ error: 'Invalid signature' }), { status: 400 });
      }

      const event = JSON.parse(payload);
      const eventId = event.event_id ?? `${event.event}_${Date.now()}`;
      const serviceClient = createServiceClient();
      const isNew = await recordPaymentEvent(
        serviceClient,
        'razorpay',
        eventId,
        event.event,
        event,
      );

      if (isNew) {
        try {
          await processRazorpayEvent(serviceClient, event);
          await markPaymentEventProcessed(serviceClient, 'razorpay', eventId);
        } catch (err) {
          await markPaymentEventProcessed(
            serviceClient,
            'razorpay',
            eventId,
            err instanceof Error ? err.message : String(err),
          );
          throw err;
        }
      }

      return jsonResponse({ received: true }, requestId);
    }

    const auth = await authenticate(req);
    userId = auth.user.id;

    let response: Response;
    switch (path) {
      case '/checkout':
        response = await handleCheckout(req, auth, requestId);
        break;
      case '/portal':
        response = await handleBillingPortal(req, auth, requestId);
        break;
      case '/cancel':
        response = await handleCancelSubscription(req, auth, requestId);
        break;
      case '/activate-free':
        response = await handleActivateFreePlan(req, auth, requestId);
        break;
      default:
        statusCode = 404;
        response = new Response(
          JSON.stringify({ error: { code: 'NOT_FOUND', message: `Route ${path} not found` } }),
          { status: 404, headers: { 'Content-Type': 'application/json' } },
        );
    }

    statusCode = response.status;
    return response;
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
      path: url.pathname,
      statusCode,
      durationMs: Date.now() - startTime,
      userId,
      ipHash: await hashIp(getClientIp(req)),
      userAgent: req.headers.get('user-agent') ?? undefined,
      errorMessage,
    }).catch(() => {});
  }
});

async function processStripeEvent(
  client: ReturnType<typeof createServiceClient>,
  event: { type: string; data: { object: Record<string, unknown> } },
): Promise<void> {
  const obj = event.data.object;

  if (event.type === 'checkout.session.completed') {
    const userId = (obj.metadata as Record<string, string>)?.user_id;
    const planTier = (obj.metadata as Record<string, string>)?.plan_tier ?? 'pro';
    if (!userId) return;

    const plan = await getPlanByTier(client, planTier);
    await upsertUserSubscription(client, {
      userId,
      planId: plan.id,
      planTier,
      provider: 'stripe',
      status: 'active',
      stripeCustomerId: obj.customer as string,
      stripeSubscriptionId: obj.subscription as string,
    });
  }

  if (event.type === 'customer.subscription.updated' || event.type === 'customer.subscription.deleted') {
    const userId = (obj.metadata as Record<string, string>)?.user_id;
    if (!userId) return;

    const status = event.type === 'customer.subscription.deleted' ? 'canceled' : (obj.status as string);
    const planTier = (obj.metadata as Record<string, string>)?.plan_tier ?? 'pro';
    const plan = await getPlanByTier(client, planTier);

    await upsertUserSubscription(client, {
      userId,
      planId: plan.id,
      planTier,
      provider: 'stripe',
      status,
      stripeCustomerId: obj.customer as string,
      stripeSubscriptionId: obj.id as string,
      periodStart: obj.current_period_start
        ? new Date((obj.current_period_start as number) * 1000).toISOString()
        : undefined,
      periodEnd: obj.current_period_end
        ? new Date((obj.current_period_end as number) * 1000).toISOString()
        : undefined,
      cancelAtPeriodEnd: Boolean(obj.cancel_at_period_end),
    });
  }
}

async function processRazorpayEvent(
  client: ReturnType<typeof createServiceClient>,
  event: { event: string; payload: { subscription: { entity: Record<string, unknown> } } },
): Promise<void> {
  const sub = event.payload?.subscription?.entity;
  if (!sub) return;

  const notes = sub.notes as Record<string, string> | undefined;
  const userId = notes?.user_id;
  const planTier = notes?.plan_tier ?? 'pro';
  if (!userId) return;

  const plan = await getPlanByTier(client, planTier);

  if (event.event === 'subscription.activated' || event.event === 'subscription.charged') {
    await upsertUserSubscription(client, {
      userId,
      planId: plan.id,
      planTier,
      provider: 'razorpay',
      status: 'active',
      razorpayCustomerId: sub.customer_id as string,
      razorpaySubscriptionId: sub.id as string,
      periodStart: sub.current_start
        ? new Date((sub.current_start as number) * 1000).toISOString()
        : undefined,
      periodEnd: sub.current_end
        ? new Date((sub.current_end as number) * 1000).toISOString()
        : undefined,
    });
  }

  if (event.event === 'subscription.cancelled' || event.event === 'subscription.halted') {
    await upsertUserSubscription(client, {
      userId,
      planId: plan.id,
      planTier,
      provider: 'razorpay',
      status: 'canceled',
      razorpayCustomerId: sub.customer_id as string,
      razorpaySubscriptionId: sub.id as string,
    });
  }
}

function jsonResponse(data: unknown, requestId: string): Response {
  return new Response(JSON.stringify({ data, request_id: requestId }), {
    status: 200,
    headers: {
      'Content-Type': 'application/json',
      'Access-Control-Allow-Origin': '*',
      'X-Request-Id': requestId,
    },
  });
}
