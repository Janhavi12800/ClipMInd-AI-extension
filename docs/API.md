# TechShield AI — REST API Documentation

**Version:** 1.0  
**Base URL:** `https://<project-ref>.supabase.co/functions/v1`  
**API Prefix:** `/api/v1`  
**Auth Prefix:** `/auth-session`

---

## Authentication

Protected endpoints require a Bearer token in the `Authorization` header:

```
Authorization: Bearer <access_token>
```

Obtain tokens via the auth-session endpoints. Tokens expire after 1 hour; use the refresh endpoint to renew.

### Error Response Format

All errors follow a consistent structure:

```json
{
  "error": {
    "code": "ERROR_CODE",
    "message": "Human-readable description",
    "details": null,
    "request_id": "req_abc123"
  }
}
```

### Error Codes

| Code | HTTP Status | Description |
|------|-------------|-------------|
| `UNAUTHORIZED` | 401 | Missing or invalid token |
| `FORBIDDEN` | 403 | Insufficient permissions |
| `NOT_FOUND` | 404 | Resource not found |
| `BAD_REQUEST` | 400 | Malformed request |
| `VALIDATION_ERROR` | 422 | Input validation failed |
| `RATE_LIMITED` | 429 | Too many requests |
| `QUOTA_EXCEEDED` | 402 | API usage limit reached |
| `CONFLICT` | 409 | Resource conflict |
| `INTERNAL_ERROR` | 500 | Server error |

---

## Auth Endpoints

Base: `/auth-session`

### Register

```
POST /auth-session/register
```

**Request:**
```json
{
  "email": "user@example.com",
  "password": "securepassword123",
  "full_name": "Jane Doe"
}
```

**Response (201):**
```json
{
  "data": {
    "user": { "id": "uuid", "email": "user@example.com" },
    "session": {
      "access_token": "eyJ...",
      "refresh_token": "v1...",
      "expires_at": 1718467200
    },
    "message": "Account created"
  },
  "request_id": "req_abc123"
}
```

### Login

```
POST /auth-session/login
```

**Request:**
```json
{
  "email": "user@example.com",
  "password": "securepassword123"
}
```

**Response (200):**
```json
{
  "data": {
    "user": { "id": "uuid", "email": "user@example.com" },
    "session": {
      "access_token": "eyJ...",
      "refresh_token": "v1...",
      "expires_at": 1718467200,
      "expires_in": 3600
    }
  },
  "request_id": "req_abc123"
}
```

### Google OAuth

```
GET /auth-session/google
```

**Response (200):**
```json
{
  "data": {
    "url": "https://accounts.google.com/o/oauth2/v2/auth?..."
  },
  "request_id": "req_abc123"
}
```

Redirect the user to the returned URL. After OAuth callback, Supabase handles token exchange.

### Password Reset

```
POST /auth-session/reset-password
```

**Request:**
```json
{
  "email": "user@example.com"
}
```

**Response (200):**
```json
{
  "data": {
    "message": "If an account exists with this email, a password reset link has been sent"
  },
  "request_id": "req_abc123"
}
```

### Update Password

```
POST /auth-session/update-password
Authorization: Bearer <token>
```

**Request:**
```json
{
  "password": "newsecurepassword123"
}
```

### Refresh Token

```
POST /auth-session/refresh
```

**Request:**
```json
{
  "refresh_token": "v1..."
}
```

**Response (200):**
```json
{
  "data": {
    "session": {
      "access_token": "eyJ...",
      "refresh_token": "v1...",
      "expires_at": 1718470800,
      "expires_in": 3600
    }
  },
  "request_id": "req_abc123"
}
```

### Get Current Session

```
GET /auth-session/me
Authorization: Bearer <token>
```

**Response (200):**
```json
{
  "data": {
    "user": { "id": "uuid", "email": "user@example.com" },
    "profile": {
      "id": "uuid",
      "full_name": "Jane Doe",
      "plan": "pro",
      "api_usage": 68420,
      "api_limit": 100000,
      "organizations": { "name": "Acme Corp", "plan": "team" },
      "user_settings": { "theme": "dark", "pii_redaction": true }
    }
  },
  "request_id": "req_abc123"
}
```

### Logout

```
POST /auth-session/logout
Authorization: Bearer <token>
```

---

## API Endpoints

Base: `/api/v1`  
All endpoints require `Authorization: Bearer <token>` unless noted.

### Health Check

```
GET /api/v1/health
```

No authentication required.

**Response (200):**
```json
{
  "status": "healthy",
  "version": "v1",
  "timestamp": "2026-06-15T10:30:00Z",
  "request_id": "req_abc123"
}
```

---

### Profile

#### Get Profile

```
GET /api/v1/profile
```

**Response (200):**
```json
{
  "data": {
    "id": "uuid",
    "email": "user@example.com",
    "full_name": "Jane Doe",
    "plan": "pro",
    "api_usage": 68420,
    "api_limit": 100000,
    "organizations": { "id": "uuid", "name": "Acme Corp", "plan": "team" },
    "user_settings": { "theme": "system", "pii_redaction": true }
  },
  "request_id": "req_abc123"
}
```

#### Update Profile

```
PATCH /api/v1/profile
```

**Request:**
```json
{
  "full_name": "Jane Smith",
  "role": "Marketing Manager",
  "department": "Growth",
  "timezone": "America/Los_Angeles",
  "locale": "en-US"
}
```

---

### Settings

#### Get Settings

```
GET /api/v1/settings
```

#### Update Settings

```
PATCH /api/v1/settings
```

**Request:**
```json
{
  "theme": "dark",
  "pii_redaction": true,
  "auto_scan": true,
  "phishing_sensitivity": "high",
  "default_ai_model": "quality"
}
```

---

### Subscription Plans

#### List Plans

```
GET /api/v1/plans
```

**Response (200):**
```json
{
  "data": [
    {
      "id": "uuid",
      "name": "Pro",
      "tier": "pro",
      "price_monthly_cents": 1900,
      "features": ["Unlimited prompts", "100K AI tokens/month"],
      "limits": { "monthly_tokens": 100000, "daily_scans": -1 }
    }
  ],
  "request_id": "req_abc123"
}
```

#### Get Current Subscription

```
GET /api/v1/subscription
```

---

### Payments

**Base prefix:** `/payments` (separate Edge Function)

#### Create Checkout Session

```
POST /payments/checkout
```

**Request:**
```json
{
  "plan_tier": "pro",
  "provider": "stripe",
  "interval": "monthly",
  "success_url": "https://app.techshield.ai/billing?success=true",
  "cancel_url": "https://app.techshield.ai/billing?canceled=true"
}
```

**Response (200):**
```json
{
  "data": {
    "checkout_url": "https://checkout.stripe.com/...",
    "session_id": "uuid"
  },
  "request_id": "req_abc123"
}
```

#### Stripe Billing Portal

```
POST /payments/portal
```

**Request:**
```json
{ "return_url": "https://app.techshield.ai/billing" }
```

#### Cancel Subscription

```
POST /payments/cancel
```

#### Activate Free Plan

```
POST /payments/activate-free
```

#### Webhooks (no auth)

```
POST /payments/webhooks/stripe
POST /payments/webhooks/razorpay
```

Webhook signatures are verified via `stripe-signature` and `x-razorpay-signature` headers.

**Supported plans:** `free`, `pro`, `business`  
**Supported providers:** `stripe` (global), `razorpay` (India/APAC)

---

### Prompts

#### List Prompt Templates

```
GET /api/v1/prompts/templates?category=SEO
```

#### List Prompt History

```
GET /api/v1/prompts?page=1&limit=20&saved=true
```

**Response (200):**
```json
{
  "data": {
    "items": [
      {
        "id": "uuid",
        "title": "Q3 Launch Blog",
        "prompt_output": "Create a blog post...",
        "category": "Content Marketing",
        "is_saved": true,
        "tokens_used": 150,
        "created_at": "2026-06-15T10:30:00Z"
      }
    ],
    "total": 42,
    "page": 1,
    "limit": 20
  },
  "request_id": "req_abc123"
}
```

#### Create Prompt

```
POST /api/v1/prompts
```

**Request:**
```json
{
  "title": "Q3 Launch Blog Prompt",
  "template_id": "uuid",
  "prompt_input": { "topic": "Cloud Security", "audience": "IT Directors" },
  "prompt_output": "Create a comprehensive blog post about Cloud Security...",
  "category": "Content Marketing",
  "tokens_used": 150,
  "model": "gpt-4o",
  "is_saved": true,
  "pii_redacted": true
}
```

**Response (201):** Created prompt object.

#### Get Prompt

```
GET /api/v1/prompts/:id
```

#### Update Prompt

```
PATCH /api/v1/prompts/:id
```

**Request:**
```json
{
  "title": "Updated Title",
  "is_saved": true,
  "is_favorite": true
}
```

#### Delete Prompt

```
DELETE /api/v1/prompts/:id
```

**Response:** 204 No Content

---

### Content

#### List Saved Content

```
GET /api/v1/content?page=1&limit=20&status=completed
```

#### Create Content

```
POST /api/v1/content
```

**Request:**
```json
{
  "title": "10 Ways to Improve Web Security",
  "content_type": "blog",
  "content": "# 10 Ways to Improve Web Security\n\n...",
  "tone": "Professional",
  "word_count": 1247,
  "status": "completed",
  "keywords": ["security", "zero-trust"],
  "audience": "IT professionals",
  "tokens_used": 2500,
  "model": "gpt-4o"
}
```

#### Get / Update / Delete Content

```
GET    /api/v1/content/:id
PATCH  /api/v1/content/:id
DELETE /api/v1/content/:id
```

---

### Scans

#### List Scan History

```
GET /api/v1/scans?type=security&page=1&limit=20
```

#### Create Scan Record

```
POST /api/v1/scans
```

**Request:**
```json
{
  "scan_type": "security",
  "url": "https://acmecorp.com",
  "title": "Acme Corp Security Scan",
  "score": 91,
  "risk_level": "low",
  "findings": [
    {
      "category": "headers",
      "severity": "success",
      "title": "HSTS Enabled",
      "status": "pass"
    }
  ],
  "metrics": {},
  "ssl_info": {
    "valid": true,
    "issuer": "Let's Encrypt",
    "protocol": "TLS 1.3"
  },
  "duration_ms": 2300
}
```

#### Get / Delete Scan

```
GET    /api/v1/scans/:id
DELETE /api/v1/scans/:id
```

---

### Notes

#### List Notes

```
GET /api/v1/notes?tag=security&search=audit&archived=false&page=1&limit=20
```

#### Create Note

```
POST /api/v1/notes
```

**Request:**
```json
{
  "title": "Competitor Analysis",
  "content": "TechRival uses React + Next.js...",
  "url": "https://techrival.io",
  "tags": ["research", "seo"],
  "is_pinned": true
}
```

#### Get / Update / Delete Note

```
GET    /api/v1/notes/:id
PATCH  /api/v1/notes/:id
DELETE /api/v1/notes/:id
```

---

### Analytics

#### Track Event

```
POST /api/v1/analytics
```

**Request:**
```json
{
  "event_type": "feature_use",
  "event_name": "seo_analyzer_opened",
  "properties": { "url": "https://example.com" },
  "session_id": "sess_abc123"
}
```

#### List Events

```
GET /api/v1/analytics?type=scan_completed&days=30&page=1&limit=50
```

---

### Audit Logs

```
GET /api/v1/audit-logs?page=1&limit=50
```

Requires organization admin role for org-wide logs.

---

## Pagination

All list endpoints support pagination:

| Parameter | Default | Max | Description |
|-----------|---------|-----|-------------|
| `page` | 1 | — | Page number (1-indexed) |
| `limit` | 20 | 100 | Items per page |

Response includes `total`, `page`, and `limit` in the `data` object.

## Rate Limit Headers

All API responses include:

```
X-RateLimit-Remaining: 95
X-RateLimit-Reset: 2026-06-15T10:31:00Z
X-Request-Id: req_abc123
```

## CORS

All endpoints support CORS with the following headers:

```
Access-Control-Allow-Origin: *
Access-Control-Allow-Headers: authorization, x-client-info, apikey, content-type, x-request-id
Access-Control-Allow-Methods: GET, POST, PUT, PATCH, DELETE, OPTIONS
```

## SDK Usage Example

```typescript
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY)

// Login
const { data } = await supabase.auth.signInWithPassword({
  email: 'user@example.com',
  password: 'password',
})

// Call API
const response = await fetch(`${SUPABASE_URL}/functions/v1/api/v1/prompts`, {
  headers: {
    Authorization: `Bearer ${data.session.access_token}`,
    'Content-Type': 'application/json',
  },
})

const { data: prompts } = await response.json()
```

---

*TechShield AI API v1.0 — June 2026*
