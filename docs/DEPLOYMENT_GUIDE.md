# TechShield AI — Production Deployment Guide

Enterprise deployment guide for the TechShield AI SaaS platform, Chrome extension, and supporting infrastructure.

## Architecture Overview

```
┌─────────────────┐     ┌──────────────────┐     ┌─────────────────┐
│ Chrome Extension│────▶│ Supabase Edge    │────▶│ PostgreSQL      │
│ (MV3)           │     │ Functions (API)  │     │ + RLS           │
└─────────────────┘     └──────────────────┘     └─────────────────┘
         │                       │                         │
         │              ┌────────┴────────┐                │
         │              │                 │                │
         ▼              ▼                 ▼                ▼
┌─────────────────┐  Stripe          Razorpay         Audit Logs
│ React Frontend  │  Webhooks        Webhooks         Analytics
│ (Docker/Nginx)  │
└─────────────────┘
```

## Prerequisites

| Requirement | Version |
|-------------|---------|
| Node.js | 20+ |
| Docker | 24+ |
| Supabase CLI | Latest |
| GitHub Actions | Enabled |
| Stripe Account | Live mode keys |
| Razorpay Account | Live mode keys (India/APAC) |
| Chrome Web Store Developer | $5 one-time fee |

## 1. Environment Setup

### Supabase

```bash
# Install CLI
npm install -g supabase

# Login and link project
supabase login
supabase link --project-ref YOUR_PROJECT_REF

# Copy and configure environment
cp supabase/.env.example supabase/.env
```

Required secrets (set via `supabase secrets set`):

| Secret | Description |
|--------|-------------|
| `STRIPE_SECRET_KEY` | Stripe live secret key |
| `STRIPE_WEBHOOK_SECRET` | Stripe webhook signing secret |
| `RAZORPAY_KEY_ID` | Razorpay live key ID |
| `RAZORPAY_KEY_SECRET` | Razorpay live key secret |
| `RAZORPAY_WEBHOOK_SECRET` | Razorpay webhook secret |
| `IP_HASH_SALT` | 32-char random string |
| `ENCRYPTION_KEY` | `openssl rand -base64 32` |

### Frontend

```bash
cp frontend/.env.example frontend/.env
```

| Variable | Example |
|----------|---------|
| `VITE_API_URL` | `https://xxx.supabase.co/functions/v1` |
| `VITE_PAYMENTS_URL` | `https://xxx.supabase.co/functions/v1` |
| `VITE_SUPABASE_URL` | `https://xxx.supabase.co` |
| `VITE_SUPABASE_ANON_KEY` | Your anon key |

## 2. Database Migration

```bash
cd supabase
supabase db push                    # Apply all migrations
supabase db reset --linked          # Fresh reset (staging only)
```

Migrations include:
- Core tables, RLS, auth triggers
- Subscription plans (Free, Pro, Business)
- Payment tables (checkout_sessions, payment_events)
- Razorpay + Stripe provider columns

## 3. Payment Provider Setup

### Stripe

1. Create products in Stripe Dashboard:
   - **Pro** — $19/month, $150/year
   - **Business** — $49/month, $470/year
2. Copy Price IDs to `subscription_plans` table:
   ```sql
   UPDATE subscription_plans SET stripe_price_id_monthly = 'price_xxx' WHERE tier = 'pro';
   UPDATE subscription_plans SET stripe_price_id_yearly = 'price_xxx' WHERE tier = 'pro';
   UPDATE subscription_plans SET stripe_price_id_monthly = 'price_xxx' WHERE tier = 'business';
   UPDATE subscription_plans SET stripe_price_id_yearly = 'price_xxx' WHERE tier = 'business';
   ```
3. Configure webhook endpoint:
   - URL: `https://YOUR_PROJECT.supabase.co/functions/v1/payments/webhooks/stripe`
   - Events: `checkout.session.completed`, `customer.subscription.updated`, `customer.subscription.deleted`
4. Enable Stripe Customer Portal in Dashboard settings.

### Razorpay

1. Create subscription plans in Razorpay Dashboard (Pro, Business — monthly/yearly).
2. Update database with plan IDs:
   ```sql
   UPDATE subscription_plans SET razorpay_plan_id_monthly = 'plan_xxx' WHERE tier = 'pro';
   ```
3. Configure webhook:
   - URL: `https://YOUR_PROJECT.supabase.co/functions/v1/payments/webhooks/razorpay`
   - Events: `subscription.activated`, `subscription.charged`, `subscription.cancelled`

## 4. Deploy Edge Functions

```bash
supabase functions deploy api --no-verify-jwt
supabase functions deploy auth-session
supabase functions deploy payments --no-verify-jwt
```

## 5. Frontend Deployment

### Docker (recommended)

```bash
docker compose -f docker/docker-compose.prod.yml up -d --build
```

### Manual build

```bash
cd frontend
npm ci
npm run build
# Serve dist/ via Nginx, Vercel, or CloudFront
```

### AWS ECS

1. Push image to ECR (automated via GitHub Actions `deploy.yml`).
2. Configure ECS service with health check on `/health`.
3. Set ALB with HTTPS (ACM certificate).

## 6. Chrome Extension Deployment

```bash
cd extension
npm ci
npm run build
cd dist && zip -r ../techshield-extension.zip .
```

Upload `techshield-extension.zip` to Chrome Web Store Developer Dashboard.

See [CHROME_WEB_STORE.md](./CHROME_WEB_STORE.md) for listing requirements.

## 7. CI/CD Pipeline

| Workflow | Trigger | Actions |
|----------|---------|---------|
| `ci.yml` | Push/PR | Lint, unit tests, integration tests, build, E2E, security scan |
| `deploy.yml` | Push to `main` | Migrate DB, deploy functions, build Docker, package extension |

### GitHub Secrets Required

```
SUPABASE_ACCESS_TOKEN
SUPABASE_PROJECT_REF
SUPABASE_DB_PASSWORD
STRIPE_SECRET_KEY
STRIPE_WEBHOOK_SECRET
RAZORPAY_KEY_ID
RAZORPAY_KEY_SECRET
RAZORPAY_WEBHOOK_SECRET
IP_HASH_SALT
ENCRYPTION_KEY
AWS_ACCESS_KEY_ID        # if using AWS
AWS_SECRET_ACCESS_KEY
```

## 8. Monitoring & Logging

### Stack

- **Prometheus** — metrics collection (port 9090)
- **Grafana** — dashboards (port 3001)
- **Loki** — log aggregation (port 3100)
- **Supabase Dashboard** — Edge Function logs, DB metrics

### Start monitoring locally

```bash
docker compose -f docker/docker-compose.yml up prometheus grafana loki -d
```

### Key metrics to monitor

| Metric | Alert Threshold |
|--------|----------------|
| API p95 latency | > 2s for 10 min |
| 5xx error rate | > 5% for 5 min |
| Payment webhook failures | > 5 per hour |
| DB connection pool | > 80% utilization |

## 9. Backup Strategy

### Automated daily backups

```bash
# Cron: 0 2 * * *
./scripts/backup.sh /backups/techshield
```

### Configuration

| Variable | Default | Description |
|----------|---------|-------------|
| `SUPABASE_DB_URL` | — | Direct PostgreSQL connection string |
| `BACKUP_S3_BUCKET` | — | S3 bucket for offsite storage |
| `BACKUP_RETENTION_DAYS` | 30 | Local retention period |

### Recovery procedure

```bash
gunzip -c /backups/techshield/techshield_YYYYMMDD.sql.gz | psql $SUPABASE_DB_URL
```

### Backup verification

Run monthly restore test to staging environment.

## 10. Testing Before Go-Live

```bash
# Unit tests
npm run test:unit

# Integration tests (requires Supabase local)
supabase start
npm run test:integration

# E2E tests
npm run test:e2e

# Security scan
npm run test:security

# Load test (requires k6)
npm run test:load
```

## 11. Post-Deployment Checklist

- [ ] All migrations applied
- [ ] Edge functions deployed and healthy (`/api/v1/health`)
- [ ] Stripe webhook receiving events
- [ ] Razorpay webhook receiving events
- [ ] Frontend accessible over HTTPS
- [ ] Extension published to Chrome Web Store
- [ ] Monitoring dashboards configured
- [ ] Backup cron job scheduled
- [ ] DNS and SSL certificates valid
- [ ] Rate limiting verified
- [ ] RLS policies tested with test accounts

## 12. Rollback Procedure

1. **Frontend**: Revert ECS deployment or redeploy previous Docker tag.
2. **Edge Functions**: `supabase functions deploy api --version PREVIOUS`.
3. **Database**: Restore from latest backup (see Section 9).
4. **Extension**: Revert to previous Chrome Web Store version.

## Support

- API Reference: [API.md](./API.md)
- Security: [SECURITY_CHECKLIST.md](./SECURITY_CHECKLIST.md)
- Launch: [LAUNCH_CHECKLIST.md](./LAUNCH_CHECKLIST.md)
