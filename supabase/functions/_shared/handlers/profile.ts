import { type AuthContext } from '../auth.ts';
import { Errors } from '../errors.ts';
import { optionalString, requiredString, parsePagination } from '../validation.ts';

export async function handleProfile(
  req: Request,
  auth: AuthContext,
  requestId: string,
): Promise<Response> {
  const { supabase, user } = auth;

  if (req.method === 'GET') {
    const { data, error } = await supabase
      .from('profiles')
      .select(`
        *,
        organizations (id, name, slug, domain, plan, seats, sso_enabled),
        user_settings (*)
      `)
      .eq('id', user.id)
      .single();

    if (error) throw Errors.notFound('Profile');
    return jsonOk(data, requestId);
  }

  if (req.method === 'PATCH') {
    const body = await req.json();
    const updates: Record<string, unknown> = {};

    if (body.full_name !== undefined) updates.full_name = requiredString(body.full_name, 'full_name', 255);
    if (body.role !== undefined) updates.role = optionalString(body.role, 100);
    if (body.department !== undefined) updates.department = optionalString(body.department, 100);
    if (body.timezone !== undefined) updates.timezone = optionalString(body.timezone, 50);
    if (body.locale !== undefined) updates.locale = optionalString(body.locale, 10);
    if (body.avatar_url !== undefined) updates.avatar_url = optionalString(body.avatar_url, 2048);

    const { data, error } = await supabase
      .from('profiles')
      .update(updates)
      .eq('id', user.id)
      .select()
      .single();

    if (error) throw Errors.internal(error.message);

    await supabase.rpc('write_audit_log', {
      p_action: 'update',
      p_resource_type: 'profile',
      p_resource_id: user.id,
      p_new_values: updates,
    });

    return jsonOk(data, requestId);
  }

  throw Errors.badRequest(`Method ${req.method} not allowed`);
}

export async function handleSettings(
  req: Request,
  auth: AuthContext,
  requestId: string,
): Promise<Response> {
  const { supabase, user } = auth;

  if (req.method === 'GET') {
    const { data, error } = await supabase
      .from('user_settings')
      .select('*')
      .eq('user_id', user.id)
      .single();

    if (error) throw Errors.notFound('Settings');
    return jsonOk(data, requestId);
  }

  if (req.method === 'PATCH') {
    const body = await req.json();
    const allowed = [
      'theme', 'email_notifications', 'security_alerts', 'weekly_digest',
      'pii_redaction', 'auto_scan', 'compact_mode', 'language',
      'default_ai_model', 'phishing_sensitivity', 'preferences',
    ];

    const updates: Record<string, unknown> = {};
    for (const key of allowed) {
      if (body[key] !== undefined) updates[key] = body[key];
    }

    const { data, error } = await supabase
      .from('user_settings')
      .update(updates)
      .eq('user_id', user.id)
      .select()
      .single();

    if (error) throw Errors.internal(error.message);
    return jsonOk(data, requestId);
  }

  throw Errors.badRequest(`Method ${req.method} not allowed`);
}

export async function handlePlans(
  req: Request,
  auth: AuthContext,
  requestId: string,
): Promise<Response> {
  if (req.method !== 'GET') throw Errors.badRequest(`Method ${req.method} not allowed`);

  const { data, error } = await auth.supabase
    .from('subscription_plans')
    .select('*')
    .eq('is_active', true)
    .order('sort_order');

  if (error) throw Errors.internal(error.message);
  return jsonOk(data, requestId);
}

export async function handleSubscription(
  req: Request,
  auth: AuthContext,
  requestId: string,
): Promise<Response> {
  if (req.method !== 'GET') throw Errors.badRequest(`Method ${req.method} not allowed`);

  const { data, error } = await auth.supabase
    .from('user_subscriptions')
    .select('*, subscription_plans (*)')
    .eq('user_id', auth.user.id)
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle();

  if (error) throw Errors.internal(error.message);
  return jsonOk(data, requestId);
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

export { parsePagination };
