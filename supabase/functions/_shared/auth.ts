import { createClient, type SupabaseClient, type User } from 'https://esm.sh/@supabase/supabase-js@2.49.1';
import { Errors } from './errors.ts';

export interface AuthContext {
  user: User;
  supabase: SupabaseClient;
  serviceClient: SupabaseClient;
}

export function createServiceClient(): SupabaseClient {
  return createClient(
    Deno.env.get('SUPABASE_URL') ?? '',
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
    { auth: { autoRefreshToken: false, persistSession: false } },
  );
}

export function createUserClient(token: string): SupabaseClient {
  return createClient(
    Deno.env.get('SUPABASE_URL') ?? '',
    Deno.env.get('SUPABASE_ANON_KEY') ?? '',
    {
      global: { headers: { Authorization: `Bearer ${token}` } },
      auth: { autoRefreshToken: false, persistSession: false },
    },
  );
}

export async function authenticate(req: Request): Promise<AuthContext> {
  const authHeader = req.headers.get('Authorization');
  if (!authHeader?.startsWith('Bearer ')) {
    throw Errors.unauthorized('Missing or invalid Authorization header');
  }

  const token = authHeader.replace('Bearer ', '');
  const serviceClient = createServiceClient();

  const { data: { user }, error } = await serviceClient.auth.getUser(token);
  if (error || !user) {
    throw Errors.unauthorized('Invalid or expired token');
  }

  const supabase = createUserClient(token);

  return { user, supabase, serviceClient };
}

export async function optionalAuth(req: Request): Promise<AuthContext | null> {
  const authHeader = req.headers.get('Authorization');
  if (!authHeader?.startsWith('Bearer ')) return null;

  try {
    return await authenticate(req);
  } catch {
    return null;
  }
}

export function getClientIp(req: Request): string {
  return (
    req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ??
    req.headers.get('x-real-ip') ??
    'unknown'
  );
}
