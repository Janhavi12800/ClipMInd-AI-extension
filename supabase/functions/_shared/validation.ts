import { Errors } from './errors.ts';

type ValidatorFn<T> = (value: unknown) => T;

export function requiredString(value: unknown, field: string, maxLen = 2048): string {
  if (typeof value !== 'string' || value.trim().length === 0) {
    throw Errors.validation({ [field]: `${field} is required` });
  }
  if (value.length > maxLen) {
    throw Errors.validation({ [field]: `${field} must be at most ${maxLen} characters` });
  }
  return value.trim();
}

export function optionalString(value: unknown, maxLen = 2048): string | undefined {
  if (value === undefined || value === null) return undefined;
  if (typeof value !== 'string') {
    throw Errors.validation({ field: 'Expected string' });
  }
  if (value.length > maxLen) {
    throw Errors.validation({ field: `Must be at most ${maxLen} characters` });
  }
  return value.trim();
}

export function requiredNumber(value: unknown, field: string, min?: number, max?: number): number {
  const num = typeof value === 'number' ? value : Number(value);
  if (isNaN(num)) {
    throw Errors.validation({ [field]: `${field} must be a number` });
  }
  if (min !== undefined && num < min) {
    throw Errors.validation({ [field]: `${field} must be at least ${min}` });
  }
  if (max !== undefined && num > max) {
    throw Errors.validation({ [field]: `${field} must be at most ${max}` });
  }
  return num;
}

export function optionalNumber(value: unknown, min?: number, max?: number): number | undefined {
  if (value === undefined || value === null) return undefined;
  return requiredNumber(value, 'value', min, max);
}

export function requiredEnum<T extends string>(
  value: unknown,
  field: string,
  allowed: readonly T[],
): T {
  if (typeof value !== 'string' || !allowed.includes(value as T)) {
    throw Errors.validation({
      [field]: `${field} must be one of: ${allowed.join(', ')}`,
    });
  }
  return value as T;
}

export function optionalEnum<T extends string>(
  value: unknown,
  allowed: readonly T[],
): T | undefined {
  if (value === undefined || value === null) return undefined;
  return requiredEnum(value, 'value', allowed);
}

export function requiredUrl(value: unknown, field: string): string {
  const str = requiredString(value, field);
  try {
    const url = new URL(str);
    if (!['http:', 'https:'].includes(url.protocol)) {
      throw new Error('Invalid protocol');
    }
    return str;
  } catch {
    throw Errors.validation({ [field]: `${field} must be a valid HTTP(S) URL` });
  }
}

export function requiredObject(value: unknown, field: string): Record<string, unknown> {
  if (typeof value !== 'object' || value === null || Array.isArray(value)) {
    throw Errors.validation({ [field]: `${field} must be an object` });
  }
  return value as Record<string, unknown>;
}

export function optionalArray<T>(value: unknown, itemValidator?: ValidatorFn<T>): T[] | undefined {
  if (value === undefined || value === null) return undefined;
  if (!Array.isArray(value)) {
    throw Errors.validation({ field: 'Expected array' });
  }
  if (itemValidator) {
    return value.map(itemValidator);
  }
  return value as T[];
}

export function parsePagination(url: URL): { page: number; limit: number; offset: number } {
  const page = Math.max(1, parseInt(url.searchParams.get('page') ?? '1', 10) || 1);
  const limit = Math.min(100, Math.max(1, parseInt(url.searchParams.get('limit') ?? '20', 10) || 20));
  const offset = (page - 1) * limit;
  return { page, limit, offset };
}

export async function parseBody<T>(req: Request): Promise<T> {
  const contentType = req.headers.get('content-type') ?? '';
  if (!contentType.includes('application/json')) {
    throw Errors.badRequest('Content-Type must be application/json');
  }

  try {
    return await req.json() as T;
  } catch {
    throw Errors.badRequest('Invalid JSON body');
  }
}
