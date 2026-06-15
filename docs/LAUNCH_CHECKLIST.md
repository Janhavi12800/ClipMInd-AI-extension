# TechShield AI — Launch Checklist

Complete pre-launch and launch-day checklist for production go-live.

## T-30 Days: Foundation

### Product
- [ ] All 14 extension modules tested end-to-end
- [ ] Frontend dashboard connected to live API
- [ ] Billing page functional with Stripe test mode
- [ ] Billing page functional with Razorpay test mode
- [ ] Free → Pro → Business upgrade flow verified
- [ ] Subscription cancellation flow verified
- [ ] Usage metering and quota enforcement tested

### Infrastructure
- [ ] Supabase production project provisioned
- [ ] All migrations applied to production
- [ ] Edge functions deployed (api, auth-session, payments)
- [ ] Frontend deployed to production URL
- [ ] DNS configured with SSL certificate
- [ ] Monitoring stack deployed (Prometheus + Grafana)
- [ ] Backup cron job scheduled and verified
- [ ] CI/CD pipelines green on `main` branch

### Security
- [ ] [Security Checklist](./SECURITY_CHECKLIST.md) completed and signed off
- [ ] Penetration test completed (or scheduled)
- [ ] Rate limiting tested under load
- [ ] RLS policies verified with test accounts

## T-14 Days: Chrome Web Store

- [ ] Extension built and zipped (`extension/dist`)
- [ ] Store listing copy finalized (see [CHROME_WEB_STORE.md](./CHROME_WEB_STORE.md))
- [ ] 5 screenshots captured (1280×800 or 640×400)
- [ ] Promotional tile created (440×280)
- [ ] Privacy Policy URL live
- [ ] Single purpose description written
- [ ] Permission justifications documented
- [ ] Extension submitted for review
- [ ] Review feedback addressed (if any)

## T-7 Days: Payments

- [ ] Stripe switched to live mode
- [ ] Razorpay switched to live mode
- [ ] Production webhook endpoints configured and tested
- [ ] Price IDs synced to database
- [ ] Test purchase completed on each plan (then refunded)
- [ ] Invoice/receipt emails verified
- [ ] Customer portal accessible for Stripe users

## T-3 Days: Marketing Prep

- [ ] Product Hunt launch assets prepared (see [marketing/PRODUCT_HUNT.md](./marketing/PRODUCT_HUNT.md))
- [ ] AppSumo deal structure finalized (see [marketing/APPSUMO.md](./marketing/APPSUMO.md))
- [ ] Landing page SEO optimized (see [marketing/SEO_STRATEGY.md](./marketing/SEO_STRATEGY.md))
- [ ] Affiliate program portal ready (see [marketing/AFFILIATE_PROGRAM.md](./marketing/AFFILIATE_PROGRAM.md))
- [ ] Press kit and media assets prepared
- [ ] Social media accounts created and branded
- [ ] Email launch sequence drafted (3-email drip)

## T-1 Day: Final Verification

- [ ] Full E2E test suite passes against production
- [ ] Load test completed (100 concurrent users, p95 < 500ms)
- [ ] Security scan passes
- [ ] All team members have access to monitoring dashboards
- [ ] On-call rotation scheduled for launch week
- [ ] Rollback procedure documented and tested
- [ ] Status page created (e.g., status.techshield.ai)

## Launch Day (D-Day)

### Morning
- [ ] Verify all services healthy
- [ ] Publish Chrome extension (if approved)
- [ ] Switch DNS to production (if not already)
- [ ] Send launch email to waitlist
- [ ] Post Product Hunt launch (12:01 AM PT)
- [ ] Share on Twitter/X, LinkedIn, Reddit (r/chrome, r/SaaS)

### Afternoon
- [ ] Monitor error rates and payment webhooks
- [ ] Respond to Product Hunt comments
- [ ] Track sign-up conversion rate
- [ ] Address any critical bugs immediately

### Evening
- [ ] Review day's metrics (signups, conversions, errors)
- [ ] Document any issues and resolutions
- [ ] Prepare Day 2 content (blog post, tutorial video)

## T+7 Days: Post-Launch

- [ ] Analyze Product Hunt results (upvotes, ranking, traffic)
- [ ] Review AppSumo interest (if launched)
- [ ] Collect user feedback (NPS survey)
- [ ] Fix top 3 reported bugs
- [ ] Publish "What we learned" blog post
- [ ] Begin affiliate outreach
- [ ] Schedule first monthly backup verification

## T+30 Days: Growth Review

- [ ] Review [Growth Roadmap](./GROWTH_ROADMAP.md) milestones
- [ ] Analyze MRR, churn, and conversion funnel
- [ ] A/B test pricing page
- [ ] Plan v1.1 feature release based on feedback
- [ ] Quarterly security review scheduled

## Key Metrics Targets (Launch Week)

| Metric | Target |
|--------|--------|
| Chrome Web Store installs | 500+ |
| Product Hunt upvotes | 200+ |
| Free signups | 1,000+ |
| Free → Pro conversion | 3%+ |
| API uptime | 99.9% |
| Payment success rate | 98%+ |
| Support response time | < 4 hours |

## Emergency Contacts

| Role | Contact |
|------|---------|
| On-call engineer | oncall@techshield.ai |
| Stripe support | https://support.stripe.com |
| Razorpay support | https://razorpay.com/support |
| Supabase support | https://supabase.com/dashboard/support |
| Chrome Web Store | https://support.google.com/chrome_webstore |
