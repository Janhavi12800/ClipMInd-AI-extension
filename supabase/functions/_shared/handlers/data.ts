import { type AuthContext } from '../auth.ts';
import { Errors } from '../errors.ts';
import {
  requiredString,
  requiredUrl,
  requiredEnum,
  requiredNumber,
  optionalEnum,
  optionalString,
  parsePagination,
  parseBody,
} from '../validation.ts';

const SCAN_TYPES = ['security', 'seo', 'phishing', 'malware', 'tech'] as const;
const RISK_LEVELS = ['low', 'medium', 'high', 'critical'] as const;
const ANALYTICS_EVENT_TYPES = [
  'page_view', 'feature_use', 'scan_completed', 'prompt_generated',
  'content_generated', 'login', 'logout', 'subscription_change', 'api_call', 'error',
] as const;

export async function handleScans(
  req: Request,
  auth: AuthContext,
  requestId: string,
  scanId?: string,
): Promise<Response> {
  const { supabase, user } = auth;
  const url = new URL(req.url);

  if (!scanId && req.method === 'GET') {
    const { page, limit, offset } = parsePagination(url);
    const scanType = url.searchParams.get('type');

    let query = supabase
      .from('scan_history')
      .select('*', { count: 'exact' })
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);

    if (scanType) query = query.eq('scan_type', scanType);

    const { data, error, count } = await query;
    if (error) throw Errors.internal(error.message);
    return jsonOk({ items: data, total: count, page, limit }, requestId);
  }

  if (!scanId && req.method === 'POST') {
    const body = await parseBody<Record<string, unknown>>(req);

    const { data: profile } = await supabase
      .from('profiles')
      .select('organization_id')
      .eq('id', user.id)
      .single();

    const { data, error } = await supabase
      .from('scan_history')
      .insert({
        user_id: user.id,
        organization_id: profile?.organization_id,
        scan_type: requiredEnum(body.scan_type, 'scan_type', SCAN_TYPES),
        url: requiredUrl(body.url, 'url'),
        title: optionalString(body.title, 500),
        score: body.score !== undefined ? requiredNumber(body.score, 'score', 0, 100) : null,
        risk_level: optionalEnum(body.risk_level, RISK_LEVELS),
        results: body.results ?? {},
        findings: body.findings ?? [],
        metrics: body.metrics ?? {},
        ssl_info: body.ssl_info ?? null,
        duration_ms: body.duration_ms ?? null,
      })
      .select()
      .single();

    if (error) throw Errors.internal(error.message);

    await supabase.from('analytics_events').insert({
      user_id: user.id,
      organization_id: profile?.organization_id,
      event_type: 'scan_completed',
      event_name: `${body.scan_type}_scan`,
      properties: { url: body.url, score: body.score },
    });

    return jsonCreated(data, requestId);
  }

  if (scanId && req.method === 'GET') {
    const { data, error } = await supabase
      .from('scan_history')
      .select('*')
      .eq('id', scanId)
      .eq('user_id', user.id)
      .single();

    if (error || !data) throw Errors.notFound('Scan');
    return jsonOk(data, requestId);
  }

  if (scanId && req.method === 'DELETE') {
    const { error } = await supabase
      .from('scan_history')
      .delete()
      .eq('id', scanId)
      .eq('user_id', user.id);

    if (error) throw Errors.internal(error.message);
    return jsonNoContent(requestId);
  }

  throw Errors.badRequest(`Method ${req.method} not allowed`);
}

export async function handleNotes(
  req: Request,
  auth: AuthContext,
  requestId: string,
  noteId?: string,
): Promise<Response> {
  const { supabase, user } = auth;
  const url = new URL(req.url);

  if (!noteId && req.method === 'GET') {
    const { page, limit, offset } = parsePagination(url);
    const tag = url.searchParams.get('tag');
    const search = url.searchParams.get('search');
    const archived = url.searchParams.get('archived') === 'true';

    let query = supabase
      .from('notes')
      .select('*', { count: 'exact' })
      .eq('user_id', user.id)
      .eq('is_archived', archived)
      .order('is_pinned', { ascending: false })
      .order('updated_at', { ascending: false })
      .range(offset, offset + limit - 1);

    if (tag && tag !== 'all') query = query.contains('tags', [tag]);
    if (search) query = query.or(`title.ilike.%${search}%,content.ilike.%${search}%`);

    const { data, error, count } = await query;
    if (error) throw Errors.internal(error.message);
    return jsonOk({ items: data, total: count, page, limit }, requestId);
  }

  if (!noteId && req.method === 'POST') {
    const body = await parseBody<Record<string, unknown>>(req);

    const { data: profile } = await supabase
      .from('profiles')
      .select('organization_id')
      .eq('id', user.id)
      .single();

    const { data, error } = await supabase
      .from('notes')
      .insert({
        user_id: user.id,
        organization_id: profile?.organization_id,
        title: requiredString(body.title, 'title', 500),
        content: optionalString(body.content, 100000) ?? '',
        url: optionalString(body.url, 2048),
        tags: body.tags ?? [],
        is_pinned: Boolean(body.is_pinned),
      })
      .select()
      .single();

    if (error) throw Errors.internal(error.message);
    return jsonCreated(data, requestId);
  }

  if (noteId && req.method === 'GET') {
    const { data, error } = await supabase
      .from('notes')
      .select('*')
      .eq('id', noteId)
      .eq('user_id', user.id)
      .single();

    if (error || !data) throw Errors.notFound('Note');
    return jsonOk(data, requestId);
  }

  if (noteId && req.method === 'PATCH') {
    const body = await parseBody<Record<string, unknown>>(req);
    const updates: Record<string, unknown> = {};

    if (body.title !== undefined) updates.title = requiredString(body.title, 'title', 500);
    if (body.content !== undefined) updates.content = optionalString(body.content, 100000) ?? '';
    if (body.url !== undefined) updates.url = optionalString(body.url, 2048);
    if (body.tags !== undefined) updates.tags = body.tags;
    if (body.is_pinned !== undefined) updates.is_pinned = Boolean(body.is_pinned);
    if (body.is_archived !== undefined) updates.is_archived = Boolean(body.is_archived);

    const { data, error } = await supabase
      .from('notes')
      .update(updates)
      .eq('id', noteId)
      .eq('user_id', user.id)
      .select()
      .single();

    if (error || !data) throw Errors.notFound('Note');
    return jsonOk(data, requestId);
  }

  if (noteId && req.method === 'DELETE') {
    const { error } = await supabase
      .from('notes')
      .delete()
      .eq('id', noteId)
      .eq('user_id', user.id);

    if (error) throw Errors.internal(error.message);
    return jsonNoContent(requestId);
  }

  throw Errors.badRequest(`Method ${req.method} not allowed`);
}

export async function handleAnalytics(
  req: Request,
  auth: AuthContext,
  requestId: string,
): Promise<Response> {
  const { supabase, user } = auth;
  const url = new URL(req.url);

  if (req.method === 'POST') {
    const body = await parseBody<Record<string, unknown>>(req);

    const { data: profile } = await supabase
      .from('profiles')
      .select('organization_id')
      .eq('id', user.id)
      .single();

    const { data, error } = await supabase
      .from('analytics_events')
      .insert({
        user_id: user.id,
        organization_id: profile?.organization_id,
        event_type: requiredEnum(body.event_type, 'event_type', ANALYTICS_EVENT_TYPES),
        event_name: requiredString(body.event_name, 'event_name', 255),
        properties: body.properties ?? {},
        session_id: optionalString(body.session_id, 100),
      })
      .select()
      .single();

    if (error) throw Errors.internal(error.message);
    return jsonCreated(data, requestId);
  }

  if (req.method === 'GET') {
    const { page, limit, offset } = parsePagination(url);
    const eventType = url.searchParams.get('type');
    const days = parseInt(url.searchParams.get('days') ?? '30', 10);
    const since = new Date(Date.now() - days * 86400000).toISOString();

    let query = supabase
      .from('analytics_events')
      .select('*', { count: 'exact' })
      .eq('user_id', user.id)
      .gte('created_at', since)
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);

    if (eventType) query = query.eq('event_type', eventType);

    const { data, error, count } = await query;
    if (error) throw Errors.internal(error.message);
    return jsonOk({ items: data, total: count, page, limit }, requestId);
  }

  throw Errors.badRequest(`Method ${req.method} not allowed`);
}

export async function handleAuditLogs(
  req: Request,
  auth: AuthContext,
  requestId: string,
): Promise<Response> {
  if (req.method !== 'GET') throw Errors.badRequest(`Method ${req.method} not allowed`);

  const url = new URL(req.url);
  const { page, limit, offset } = parsePagination(url);

  const { data, error, count } = await auth.supabase
    .from('audit_logs')
    .select('*', { count: 'exact' })
    .order('created_at', { ascending: false })
    .range(offset, offset + limit - 1);

  if (error) throw Errors.internal(error.message);
  return jsonOk({ items: data, total: count, page, limit }, requestId);
}

function jsonOk(data: unknown, requestId: string): Response {
  return new Response(JSON.stringify({ data, request_id: requestId }), {
    status: 200,
    headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*', 'X-Request-Id': requestId },
  });
}

function jsonCreated(data: unknown, requestId: string): Response {
  return new Response(JSON.stringify({ data, request_id: requestId }), {
    status: 201,
    headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*', 'X-Request-Id': requestId },
  });
}

function jsonNoContent(requestId: string): Response {
  return new Response(null, {
    status: 204,
    headers: { 'Access-Control-Allow-Origin': '*', 'X-Request-Id': requestId },
  });
}
