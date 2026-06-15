# TechShield AI — Security Checklist

Pre-production and ongoing security audit checklist for enterprise deployment.

## Authentication & Authorization

- [ ] Supabase Auth configured with email verification enabled
- [ ] Google OAuth redirect URIs restricted to production domains
- [ ] JWT tokens expire within recommended TTL (1 hour access, 7 day refresh)
- [ ] MFA available and encouraged for admin accounts
- [ ] Row Level Security (RLS) enabled on ALL tables
- [ ] RLS policies tested with multiple user roles (owner, admin, member, viewer)
- [ ] Service role key stored only in server-side secrets (never in frontend/extension)
- [ ] API endpoints require Bearer token authentication (except health + webhooks)

## Payment Security

- [ ] Stripe webhook signature verification enabled
- [ ] Razorpay webhook signature verification enabled
- [ ] Payment events table provides audit trail for all webhook payloads
- [ ] Idempotent webhook processing (duplicate event_id rejected)
- [ ] No payment card data stored in application database (PCI DSS scope minimized)
- [ ] Stripe Customer Portal used for payment method management
- [ ] Checkout URLs use HTTPS success/cancel redirects
- [ ] Free plan activation does not bypass payment for paid tiers

## API Security

- [ ] Rate limiting configured per route tier (auth, AI, scan, write)
- [ ] Input validation on all POST/PATCH endpoints
- [ ] SQL injection prevented via parameterized queries (Supabase client)
- [ ] CORS restricted to production domains in production (not `*`)
- [ ] Request ID (`X-Request-Id`) on all responses for tracing
- [ ] IP addresses hashed before storage (IP_HASH_SALT configured)
- [ ] Error responses do not leak stack traces or internal paths
- [ ] Audit logs capture create/update/delete on sensitive resources

## Chrome Extension Security

- [ ] Manifest V3 (no remotely hosted code)
- [ ] Content Security Policy enforced in extension pages
- [ ] Minimal permissions (`activeTab` preferred over broad `<all_urls>` where possible)
- [ ] No `eval()` or `innerHTML` with unsanitized user content
- [ ] Messaging between content script and service worker validates message types
- [ ] Sensitive data stored in `chrome.storage.local` (not `sync`)
- [ ] Auth tokens never logged to console in production builds
- [ ] Phishing/malware overlays clearly branded to prevent social engineering

## Infrastructure Security

- [ ] HTTPS enforced on all endpoints (TLS 1.2+)
- [ ] Security headers configured (see `docker/nginx.conf`):
  - `X-Frame-Options: SAMEORIGIN`
  - `X-Content-Type-Options: nosniff`
  - `Content-Security-Policy`
  - `Referrer-Policy: strict-origin-when-cross-origin`
- [ ] Docker images scanned for vulnerabilities
- [ ] Dependencies audited (`npm audit`) in CI pipeline
- [ ] Secrets managed via GitHub Secrets / Supabase Secrets (not in code)
- [ ] Database backups encrypted at rest (S3 SSE)
- [ ] Grafana/monitoring dashboards not publicly accessible

## Data Protection

- [ ] PII redaction option available in user settings
- [ ] Data retention policy documented and enforced
- [ ] GDPR: right to deletion implemented (account deletion cascade)
- [ ] Privacy Policy published and linked in extension + web app
- [ ] Cookie consent implemented for analytics (if applicable)
- [ ] Encrypted secrets table uses AES-256 (ENCRYPTION_KEY configured)

## Testing & Monitoring

- [ ] Security scan script passes (`npm run test:security`)
- [ ] OWASP Top 10 reviewed for web application
- [ ] Penetration test scheduled (quarterly for enterprise)
- [ ] Alerting configured for:
  - High 5xx error rate
  - Payment webhook failures
  - Unusual login patterns
  - Rate limit breaches
- [ ] Incident response plan documented
- [ ] Security contact email published (security@techshield.ai)

## Compliance

- [ ] Chrome Web Store data usage disclosures completed
- [ ] SOC 2 Type II roadmap documented (see product spec)
- [ ] PCI DSS: Stripe/Razorpay handle card data (SAQ A eligible)
- [ ] CCPA/CPRA privacy rights process documented
- [ ] India DPDP Act compliance for Razorpay users

## Sign-Off

| Role | Name | Date | Signature |
|------|------|------|-----------|
| Security Auditor | | | |
| DevOps Lead | | | |
| Engineering Lead | | | |
| Product Owner | | | |
