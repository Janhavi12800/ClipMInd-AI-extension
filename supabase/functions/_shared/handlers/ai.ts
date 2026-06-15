import { type AuthContext } from '../auth.ts';
import { Errors } from '../errors.ts';
import {
  requiredString,
  requiredEnum,
  optionalString,
  optionalEnum,
  parsePagination,
  parseBody,
} from '../validation.ts';

const CONTENT_TYPES = ['blog', 'email', 'social', 'product', 'ad'] as const;
const CONTENT_STATUSES = ['draft', 'completed', 'archived'] as const;

export async function handlePrompts(
  req: Request,
  auth: AuthContext,
  requestId: string,
  promptId?: string,
): Promise<Response> {
  const { supabase, user, serviceClient } = auth;
  const url = new URL(req.url);

  // GET /prompts/templates
  if (!promptId && url.pathname.endsWith('/templates') && req.method === 'GET') {
    const category = url.searchParams.get('category');
    let query = supabase
      .from('prompt_templates')
      .select('*')
      .eq('is_active', true)
      .order('usage_count', { ascending: false });

    if (category && category !== 'All') {
      query = query.eq('category', category);
    }

    const { data, error } = await query;
    if (error) throw Errors.internal(error.message);
    return jsonOk(data, requestId);
  }

  // GET /prompts — list history
  if (!promptId && req.method === 'GET') {
    const { page, limit, offset } = parsePagination(url);
    const savedOnly = url.searchParams.get('saved') === 'true';

    let query = supabase
      .from('prompt_history')
      .select('*', { count: 'exact' })
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);

    if (savedOnly) query = query.eq('is_saved', true);

    const { data, error, count } = await query;
    if (error) throw Errors.internal(error.message);
    return jsonOk({ items: data, total: count, page, limit }, requestId);
  }

  // POST /prompts — create prompt history entry
  if (!promptId && req.method === 'POST') {
    const body = await parseBody<Record<string, unknown>>(req);

    const title = requiredString(body.title, 'title', 500);
    const promptOutput = requiredString(body.prompt_output, 'prompt_output', 50000);
    const category = optionalString(body.category, 100) ?? 'Custom';

    const usageOk = await serviceClient.rpc('increment_api_usage', {
      p_user_id: user.id,
      p_tokens: Number(body.tokens_used ?? 1),
    });

    if (!usageOk.data) throw Errors.quotaExceeded();

    const { data: profile } = await supabase
      .from('profiles')
      .select('organization_id')
      .eq('id', user.id)
      .single();

    const { data, error } = await supabase
      .from('prompt_history')
      .insert({
        user_id: user.id,
        organization_id: profile?.organization_id,
        template_id: body.template_id ?? null,
        title,
        prompt_input: body.prompt_input ?? {},
        prompt_output: promptOutput,
        category,
        tokens_used: Number(body.tokens_used ?? 0),
        model: body.model ?? null,
        is_saved: Boolean(body.is_saved),
        pii_redacted: Boolean(body.pii_redacted),
      })
      .select()
      .single();

    if (error) throw Errors.internal(error.message);

    if (body.template_id) {
      const { data: tmpl } = await serviceClient
        .from('prompt_templates')
        .select('usage_count')
        .eq('id', body.template_id as string)
        .single();

      if (tmpl) {
        await serviceClient
          .from('prompt_templates')
          .update({ usage_count: tmpl.usage_count + 1 })
          .eq('id', body.template_id as string);
      }
    }

    await supabase.from('analytics_events').insert({
      user_id: user.id,
      organization_id: profile?.organization_id,
      event_type: 'prompt_generated',
      event_name: 'prompt_created',
      properties: { category, template_id: body.template_id },
    });

    return jsonCreated(data, requestId);
  }

  // GET /prompts/:id
  if (promptId && req.method === 'GET') {
    const { data, error } = await supabase
      .from('prompt_history')
      .select('*')
      .eq('id', promptId)
      .eq('user_id', user.id)
      .single();

    if (error || !data) throw Errors.notFound('Prompt');
    return jsonOk(data, requestId);
  }

  // PATCH /prompts/:id
  if (promptId && req.method === 'PATCH') {
    const body = await parseBody<Record<string, unknown>>(req);
    const updates: Record<string, unknown> = {};

    if (body.title !== undefined) updates.title = requiredString(body.title, 'title', 500);
    if (body.is_saved !== undefined) updates.is_saved = Boolean(body.is_saved);
    if (body.is_favorite !== undefined) updates.is_favorite = Boolean(body.is_favorite);
    if (body.prompt_output !== undefined) {
      updates.prompt_output = requiredString(body.prompt_output, 'prompt_output', 50000);
    }

    const { data, error } = await supabase
      .from('prompt_history')
      .update(updates)
      .eq('id', promptId)
      .eq('user_id', user.id)
      .select()
      .single();

    if (error || !data) throw Errors.notFound('Prompt');
    return jsonOk(data, requestId);
  }

  // DELETE /prompts/:id
  if (promptId && req.method === 'DELETE') {
    const { error } = await supabase
      .from('prompt_history')
      .delete()
      .eq('id', promptId)
      .eq('user_id', user.id);

    if (error) throw Errors.internal(error.message);
    return jsonNoContent(requestId);
  }

  throw Errors.badRequest(`Method ${req.method} not allowed`);
}

export async function handleContent(
  req: Request,
  auth: AuthContext,
  requestId: string,
  contentId?: string,
): Promise<Response> {
  const { supabase, user, serviceClient } = auth;
  const url = new URL(req.url);

  if (!contentId && req.method === 'GET') {
    const { page, limit, offset } = parsePagination(url);
    const status = url.searchParams.get('status');

    let query = supabase
      .from('saved_content')
      .select('*', { count: 'exact' })
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);

    if (status) query = query.eq('status', status);

    const { data, error, count } = await query;
    if (error) throw Errors.internal(error.message);
    return jsonOk({ items: data, total: count, page, limit }, requestId);
  }

  if (!contentId && req.method === 'POST') {
    const body = await parseBody<Record<string, unknown>>(req);

    const usageOk = await serviceClient.rpc('increment_api_usage', {
      p_user_id: user.id,
      p_tokens: Number(body.tokens_used ?? 10),
    });
    if (!usageOk.data) throw Errors.quotaExceeded();

    const { data: profile } = await supabase
      .from('profiles')
      .select('organization_id')
      .eq('id', user.id)
      .single();

    const { data, error } = await supabase
      .from('saved_content')
      .insert({
        user_id: user.id,
        organization_id: profile?.organization_id,
        title: requiredString(body.title, 'title', 500),
        content_type: requiredEnum(body.content_type, 'content_type', CONTENT_TYPES),
        content: requiredString(body.content, 'content', 100000),
        tone: optionalString(body.tone, 100) ?? 'Professional',
        word_count: Number(body.word_count ?? 0),
        status: optionalEnum(body.status, CONTENT_STATUSES) ?? 'draft',
        keywords: body.keywords ?? [],
        audience: optionalString(body.audience, 500),
        tokens_used: Number(body.tokens_used ?? 0),
        model: body.model ?? null,
        metadata: body.metadata ?? {},
      })
      .select()
      .single();

    if (error) throw Errors.internal(error.message);

    await supabase.from('analytics_events').insert({
      user_id: user.id,
      organization_id: profile?.organization_id,
      event_type: 'content_generated',
      event_name: 'content_created',
      properties: { content_type: body.content_type },
    });

    return jsonCreated(data, requestId);
  }

  if (contentId && req.method === 'GET') {
    const { data, error } = await supabase
      .from('saved_content')
      .select('*')
      .eq('id', contentId)
      .eq('user_id', user.id)
      .single();

    if (error || !data) throw Errors.notFound('Content');
    return jsonOk(data, requestId);
  }

  if (contentId && req.method === 'PATCH') {
    const body = await parseBody<Record<string, unknown>>(req);
    const updates: Record<string, unknown> = {};

    if (body.title !== undefined) updates.title = requiredString(body.title, 'title', 500);
    if (body.content !== undefined) updates.content = requiredString(body.content, 'content', 100000);
    if (body.status !== undefined) updates.status = requiredEnum(body.status, 'status', CONTENT_STATUSES);
    if (body.tone !== undefined) updates.tone = optionalString(body.tone, 100);
    if (body.word_count !== undefined) updates.word_count = Number(body.word_count);

    const { data, error } = await supabase
      .from('saved_content')
      .update(updates)
      .eq('id', contentId)
      .eq('user_id', user.id)
      .select()
      .single();

    if (error || !data) throw Errors.notFound('Content');
    return jsonOk(data, requestId);
  }

  if (contentId && req.method === 'DELETE') {
    const { error } = await supabase
      .from('saved_content')
      .delete()
      .eq('id', contentId)
      .eq('user_id', user.id);

    if (error) throw Errors.internal(error.message);
    return jsonNoContent(requestId);
  }

  throw Errors.badRequest(`Method ${req.method} not allowed`);
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
