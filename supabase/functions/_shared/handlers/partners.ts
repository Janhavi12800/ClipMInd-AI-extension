import { type AuthContext } from '../auth.ts';
import { Errors } from '../errors.ts';
import { parseBody, requiredString } from '../validation.ts';
import { getPlanByTier, upsertUserSubscription } from '../payments/subscriptions.ts';

export async function handleAffiliateTrack(
  req: Request,
  auth: AuthContext,
  requestId: string,
): Promise<Response> {
  if (req.method !== 'POST') throw Errors.badRequest(`Method ${req.method} not allowed`);

  const body = await parseBody<{ code: string }>(req);
  const code = requiredString(body.code, 'code', 50).toUpperCase();

  const { data: affiliate, error } = await auth.serviceClient
    .from('affiliates')
    .select('id, status')
    .eq('code', code)
    .eq('status', 'active')
    .maybeSingle();

  if (error) throw Errors.internal(error.message);
  if (!affiliate) throw Errors.notFound('Affiliate code');

  const { data: profile } = await auth.supabase
    .from('profiles')
    .select('metadata')
    .eq('id', auth.user.id)
    .single();

  const metadata = {
    ...(typeof profile?.metadata === 'object' && profile.metadata ? profile.metadata : {}),
    referred_by: affiliate.id,
    affiliate_code: code,
  };

  await auth.serviceClient
    .from('profiles')
    .update({ metadata })
    .eq('id', auth.user.id);

  return jsonOk({ tracked: true, affiliate_id: affiliate.id }, requestId);
}

export async function handleAppSumoRedeem(
  req: Request,
  auth: AuthContext,
  requestId: string,
): Promise<Response> {
  if (req.method !== 'POST') throw Errors.badRequest(`Method ${req.method} not allowed`);

  const body = await parseBody<{ code: string }>(req);
  const code = requiredString(body.code, 'code', 100).toUpperCase();

  const { data: license, error } = await auth.serviceClient
    .from('appsumo_licenses')
    .select('*')
    .eq('code', code)
    .eq('is_active', true)
    .maybeSingle();

  if (error) throw Errors.internal(error.message);
  if (!license) throw Errors.notFound('License code');
  if (license.redeemed_by && license.redeemed_by !== auth.user.id) {
    throw Errors.conflict('License code already redeemed');
  }

  const tierMap: Record<string, string> = {
    pro: 'pro',
    business: 'business',
    business_plus: 'business',
  };
  const planTier = tierMap[license.tier] ?? 'pro';
  const plan = await getPlanByTier(auth.serviceClient, planTier);

  await auth.serviceClient
    .from('appsumo_licenses')
    .update({ redeemed_by: auth.user.id, redeemed_at: new Date().toISOString() })
    .eq('id', license.id);

  await upsertUserSubscription(auth.serviceClient, {
    userId: auth.user.id,
    planId: plan.id,
    planTier,
    provider: 'manual',
    status: 'active',
  });

  await auth.serviceClient.rpc('write_audit_log', {
    p_action: 'create',
    p_resource_type: 'appsumo_license',
    p_resource_id: license.id,
    p_new_values: { code, tier: license.tier },
  });

  return jsonOk({ redeemed: true, plan: planTier }, requestId);
}

function jsonOk(data: unknown, requestId: string): Response {
  return new Response(JSON.stringify({ data, request_id: requestId }), {
    status: 200,
    headers: {
      'Content-Type': 'application/json',
      'Access-Control-Allow-Origin': '*',
      'X-Request-Id': requestId,
    },
  });
}
