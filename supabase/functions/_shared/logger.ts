import { createServiceClient } from './auth.ts';

export interface LogEntry {
  requestId: string;
  method: string;
  path: string;
  statusCode: number;
  durationMs: number;
  userId?: string;
  ipHash?: string;
  userAgent?: string;
  errorMessage?: string;
}

export function createRequestId(): string {
  return `req_${crypto.randomUUID().replace(/-/g, '').slice(0, 16)}`;
}

export async function logRequest(entry: LogEntry): Promise<void> {
  const serviceClient = createServiceClient();

  const { error } = await serviceClient.from('api_request_logs').insert({
    request_id: entry.requestId,
    user_id: entry.userId ?? null,
    method: entry.method,
    path: entry.path,
    status_code: entry.statusCode,
    duration_ms: entry.durationMs,
    ip_hash: entry.ipHash ?? null,
    user_agent: entry.userAgent ?? null,
    error_message: entry.errorMessage ?? null,
  });

  if (error) {
    console.error(`[${entry.requestId}] Failed to log request:`, error.message);
  }
}

export function logInfo(requestId: string, message: string, data?: unknown): void {
  console.log(JSON.stringify({ level: 'info', request_id: requestId, message, data }));
}

export function logError(requestId: string, message: string, error?: unknown): void {
  console.error(JSON.stringify({ level: 'error', request_id: requestId, message, error: String(error) }));
}

export async function hashIp(ip: string): Promise<string> {
  const salt = Deno.env.get('IP_HASH_SALT') ?? 'techshield-default-salt';
  const data = new TextEncoder().encode(ip + salt);
  const hash = await crypto.subtle.digest('SHA-256', data);
  return Array.from(new Uint8Array(hash))
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('');
}
