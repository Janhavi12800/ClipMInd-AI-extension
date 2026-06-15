import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.49.1';
import { corsHeaders } from '../cors.ts';
import { Errors } from '../errors.ts';

export async function handleAuthSession(
  req: Request,
  requestId: string,
): Promise<Response> {
  const supabase = createClient(
    Deno.env.get('SUPABASE_URL') ?? '',
    Deno.env.get('SUPABASE_ANON_KEY') ?? '',
  );

  const url = new URL(req.url);
  const action = url.pathname.split('/').pop();

  // POST /auth-session/login
  if (action === 'login' && req.method === 'POST') {
    const { email, password } = await req.json();

    if (!email || !password) {
      throw Errors.validation({ email: 'Email and password are required' });
    }

    const { data, error } = await supabase.auth.signInWithPassword({ email, password });

    if (error) {
      throw Errors.unauthorized(error.message);
    }

    return jsonResponse({
      user: data.user,
      session: {
        access_token: data.session?.access_token,
        refresh_token: data.session?.refresh_token,
        expires_at: data.session?.expires_at,
        expires_in: data.session?.expires_in,
      },
    }, requestId);
  }

  // POST /auth-session/register
  if (action === 'register' && req.method === 'POST') {
    const { email, password, full_name } = await req.json();

    if (!email || !password) {
      throw Errors.validation({ email: 'Email and password are required' });
    }

    if (password.length < 8) {
      throw Errors.validation({ password: 'Password must be at least 8 characters' });
    }

    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: { full_name: full_name ?? email.split('@')[0] },
        emailRedirectTo: `${Deno.env.get('SITE_URL') ?? 'http://localhost:5173'}/auth/callback`,
      },
    });

    if (error) {
      throw Errors.badRequest(error.message);
    }

    return jsonResponse({
      user: data.user,
      session: data.session ? {
        access_token: data.session.access_token,
        refresh_token: data.session.refresh_token,
        expires_at: data.session.expires_at,
      } : null,
      message: data.session ? 'Account created' : 'Check your email to confirm your account',
    }, 201, requestId);
  }

  // POST /auth-session/refresh
  if (action === 'refresh' && req.method === 'POST') {
    const { refresh_token } = await req.json();

    if (!refresh_token) {
      throw Errors.validation({ refresh_token: 'Refresh token is required' });
    }

    const { data, error } = await supabase.auth.refreshSession({ refresh_token });

    if (error) {
      throw Errors.unauthorized(error.message);
    }

    return jsonResponse({
      session: {
        access_token: data.session?.access_token,
        refresh_token: data.session?.refresh_token,
        expires_at: data.session?.expires_at,
        expires_in: data.session?.expires_in,
      },
    }, requestId);
  }

  // POST /auth-session/reset-password
  if (action === 'reset-password' && req.method === 'POST') {
    const { email } = await req.json();

    if (!email) {
      throw Errors.validation({ email: 'Email is required' });
    }

    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${Deno.env.get('SITE_URL') ?? 'http://localhost:5173'}/auth/reset-password`,
    });

    if (error) {
      throw Errors.badRequest(error.message);
    }

    return jsonResponse({
      message: 'If an account exists with this email, a password reset link has been sent',
    }, requestId);
  }

  // POST /auth-session/update-password
  if (action === 'update-password' && req.method === 'POST') {
    const authHeader = req.headers.get('Authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      throw Errors.unauthorized();
    }

    const { password } = await req.json();
    if (!password || password.length < 8) {
      throw Errors.validation({ password: 'Password must be at least 8 characters' });
    }

    const authedClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      { global: { headers: { Authorization: authHeader } } },
    );

    const { error } = await authedClient.auth.updateUser({ password });
    if (error) throw Errors.badRequest(error.message);

    return jsonResponse({ message: 'Password updated successfully' }, requestId);
  }

  // POST /auth-session/logout
  if (action === 'logout' && req.method === 'POST') {
    const authHeader = req.headers.get('Authorization');
    if (authHeader?.startsWith('Bearer ')) {
      const authedClient = createClient(
        Deno.env.get('SUPABASE_URL') ?? '',
        Deno.env.get('SUPABASE_ANON_KEY') ?? '',
        { global: { headers: { Authorization: authHeader } } },
      );
      await authedClient.auth.signOut();
    }

    return jsonResponse({ message: 'Logged out successfully' }, requestId);
  }

  // GET /auth-session/me
  if (action === 'me' && req.method === 'GET') {
    const authHeader = req.headers.get('Authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      throw Errors.unauthorized();
    }

    const serviceClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
    );

    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error } = await serviceClient.auth.getUser(token);

    if (error || !user) throw Errors.unauthorized();

    const { data: profile } = await serviceClient
      .from('profiles')
      .select('*, organizations(*), user_settings(*)')
      .eq('id', user.id)
      .single();

    return jsonResponse({ user, profile }, requestId);
  }

  // GET /auth-session/google — return OAuth URL
  if (action === 'google' && req.method === 'GET') {
    const { data, error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: `${Deno.env.get('SITE_URL') ?? 'http://localhost:5173'}/auth/callback`,
        skipBrowserRedirect: true,
      },
    });

    if (error) throw Errors.internal(error.message);

    return jsonResponse({ url: data.url }, requestId);
  }

  throw Errors.notFound('Auth endpoint');
}

function jsonResponse(data: unknown, requestId: string, status = 200): Response {
  return new Response(JSON.stringify({ data, request_id: requestId }), {
    status,
    headers: {
      ...corsHeaders,
      'Content-Type': 'application/json',
      'X-Request-Id': requestId,
    },
  });
}
