# TechShield AI — Supabase Backend

Production-ready backend infrastructure using **Supabase**, **PostgreSQL**, and **Edge Functions**.

## Architecture

```
Client (React / Chrome Extension)
        │
        ▼
┌───────────────────────────────────┐
│  Supabase Edge Functions (Deno)   │
│  ├── auth-session  (public)       │
│  └── api           (JWT required) │
└───────────────┬───────────────────┘
                │
        ┌───────┴───────┐
        ▼               ▼
  Supabase Auth    PostgreSQL 15
  (Email, Google)  + RLS + Triggers
```

## Quick Start

### Prerequisites

- [Supabase CLI](https://supabase.com/docs/guides/cli) v2+
- [Docker](https://docs.docker.com/get-docker/) (for local development)
- Node.js 18+ (optional, for frontend)

### Local Development

```bash
# 1. Copy environment variables
cp supabase/.env.example supabase/.env

# 2. Start local Supabase stack
cd supabase
supabase start

# 3. Apply migrations
supabase db reset

# 4. Serve edge functions locally
supabase functions serve --env-file .env

# 5. Access services
# API:        http://localhost:54321/functions/v1/api/v1/health
# Auth:       http://localhost:54321/functions/v1/auth-session/login
# Studio:     http://localhost:54323
# Inbucket:   http://localhost:54324 (email testing)
```

### Production Deployment

```bash
# Link to your Supabase project
supabase link --project-ref your-project-ref

# Push database migrations
supabase db push

# Deploy edge functions
supabase functions deploy api --no-verify-jwt
supabase functions deploy auth-session --no-verify-jwt

# Set secrets
supabase secrets set SITE_URL=https://app.techshield.ai
supabase secrets set IP_HASH_SALT=your-random-salt
supabase secrets set GOOGLE_CLIENT_ID=your-client-id
supabase secrets set GOOGLE_CLIENT_SECRET=your-client-secret
```

## Directory Structure

```
supabase/
├── config.toml                 # Supabase project configuration
├── .env.example                # Environment variable template
├── templates/                  # Auth email templates
│   ├── confirmation.html
│   └── recovery.html
├── migrations/                 # PostgreSQL migrations (ordered)
│   ├── 20260615000001_extensions_and_enums.sql
│   ├── 20260615000002_core_tables.sql
│   ├── 20260615000003_subscriptions.sql
│   ├── 20260615000004_feature_tables.sql
│   ├── 20260615000005_analytics_audit_security.sql
│   ├── 20260615000006_functions_triggers.sql
│   ├── 20260615000007_row_level_security.sql
│   └── 20260615000008_seed_data.sql
└── functions/
    ├── _shared/                # Shared utilities
    │   ├── auth.ts             # JWT authentication
    │   ├── cors.ts             # CORS handling
    │   ├── errors.ts           # Error types & handler
    │   ├── logger.ts           # Request logging
    │   ├── rate-limit.ts       # Rate limiting
    │   ├── validation.ts       # Input validation
    │   └── handlers/           # Route handlers
    │       ├── auth.ts         # Auth session endpoints
    │       ├── profile.ts      # Profile & settings
    │       ├── ai.ts           # Prompts & content
    │       └── data.ts         # Scans, notes, analytics
    ├── api/                    # Main REST API (JWT required)
    │   └── index.ts
    └── auth-session/           # Auth endpoints (public)
        └── index.ts
```

## Database Schema

### Core Tables

| Table | Description |
|-------|-------------|
| `organizations` | Multi-tenant workspaces |
| `profiles` | User profiles (extends auth.users) |
| `organization_members` | User-org memberships with roles |
| `user_settings` | Per-user preferences |
| `user_devices` | Extension device registrations |

### Subscription Tables

| Table | Description |
|-------|-------------|
| `subscription_plans` | Plan definitions (Free/Pro/Team/Enterprise) |
| `user_subscriptions` | Active user subscriptions |
| `usage_records` | Metered usage per billing period |

### Feature Tables

| Table | Description |
|-------|-------------|
| `prompt_templates` | System prompt templates |
| `prompt_history` | Generated/saved prompts |
| `scan_history` | Security, SEO, phishing scans |
| `saved_content` | AI-generated content |
| `notes` | URL-anchored notes |

### Security & Observability

| Table | Description |
|-------|-------------|
| `analytics_events` | Product analytics |
| `audit_logs` | Immutable compliance audit trail |
| `rate_limit_buckets` | API rate limiting |
| `api_request_logs` | Request logging |
| `encrypted_secrets` | Encrypted API keys/tokens |

## Authentication

Authentication is handled by **Supabase Auth** with Edge Function wrappers:

| Method | Endpoint | Description |
|--------|----------|-------------|
| Email signup | `POST /auth-session/register` | Create account with email/password |
| Email login | `POST /auth-session/login` | Sign in with email/password |
| Google OAuth | `GET /auth-session/google` | Get Google OAuth redirect URL |
| Password reset | `POST /auth-session/reset-password` | Send reset email |
| Update password | `POST /auth-session/update-password` | Set new password (authenticated) |
| Refresh token | `POST /auth-session/refresh` | Refresh access token |
| Session info | `GET /auth-session/me` | Get current user + profile |
| Logout | `POST /auth-session/logout` | Invalidate session |

On signup, a database trigger automatically:
1. Creates a personal organization
2. Creates a user profile
3. Sets default user settings
4. Writes an audit log entry

## Security Features

- **Row Level Security (RLS)** on all 18 tables
- **Immutable audit logs** (trigger prevents UPDATE/DELETE)
- **Rate limiting** via PostgreSQL sliding window buckets
- **IP hashing** for privacy-compliant logging
- **PII redaction** flag on prompt history
- **Encrypted secrets** storage with BYTEA encryption
- **API usage quotas** enforced per plan tier
- **JWT validation** on all protected endpoints

## API Documentation

See [docs/API.md](../docs/API.md) for the complete REST API reference.

## Rate Limits

| Tier | Limit | Window |
|------|-------|--------|
| Default (read) | 100 requests | 60 seconds |
| Auth endpoints | 20 requests | 60 seconds |
| AI generation | 30 requests | 60 seconds |
| Scan creation | 20 requests | 60 seconds |
| Write operations | 60 requests | 60 seconds |

## Maintenance Jobs

Run via Supabase cron (pg_cron) or scheduled Edge Functions:

```sql
-- Reset monthly API usage (1st of each month)
SELECT public.reset_monthly_api_usage();

-- Clean up old logs (daily)
SELECT public.cleanup_old_logs();
```

## License

Proprietary — TechShield AI
