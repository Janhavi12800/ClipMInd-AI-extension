# AppSumo Launch Plan

## Deal Structure

### Tier 1: TechShield AI Pro — Lifetime ($49)
- Unlimited AI prompts
- Full security scanner suite
- SEO analyzer with export
- Unlimited notes
- 1 user license
- Lifetime updates
- **AppSumo take:** ~30% ($14.70 per sale)

### Tier 2: TechShield AI Business — Lifetime ($99)
- Everything in Pro
- Up to 5 team seats
- Shared prompt library
- Priority support
- Audit logs
- **AppSumo take:** ~30% ($29.70 per sale)

### Tier 3: TechShield AI Business — Lifetime ($199)
- Everything in Tier 2
- Up to 25 team seats
- API access
- White-label reports
- **AppSumo take:** ~30% ($59.70 per sale)

## Revenue Projections

| Scenario | Tier 1 Sales | Tier 2 Sales | Tier 3 Sales | Gross Revenue |
|----------|-------------|-------------|-------------|---------------|
| Conservative | 500 | 200 | 50 | $48,450 |
| Moderate | 1,500 | 600 | 150 | $145,350 |
| Optimistic | 3,000 | 1,200 | 300 | $290,700 |

## Pre-Launch Requirements

- [ ] AppSumo partner application approved
- [ ] Lifetime deal redemption flow built (unique license codes)
- [ ] Landing page with AppSumo-specific onboarding
- [ ] Support documentation for LTD customers
- [ ] Refund policy aligned with AppSumo terms (60 days)

## Technical Implementation

### License redemption endpoint
```
POST /api/v1/redeem
{ "code": "APPSUMO-XXXX-XXXX", "user_id": "..." }
```

### Database
```sql
CREATE TABLE appsumo_licenses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  code TEXT UNIQUE NOT NULL,
  tier TEXT NOT NULL,
  redeemed_by UUID REFERENCES profiles(id),
  redeemed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

## Launch Timeline

| Week | Action |
|------|--------|
| -4 | Submit deal proposal to AppSumo |
| -3 | Build license redemption system |
| -2 | Create AppSumo-specific assets (images, video) |
| -1 | Test redemption flow end-to-end |
| 0 | Deal goes live on AppSumo |
| +1 | Monitor support tickets, fix issues |
| +2 | Collect reviews and testimonials |
| +4 | Analyze ROI vs. recurring revenue impact |

## Marketing Assets

- 1280×720 deal hero image
- 3-minute walkthrough video
- Feature comparison table
- FAQ document (20 questions)
- 5 customer testimonial slots (pre-filled with beta users)

## Post-Deal Strategy

- Convert LTD users to annual plans after 12 months (optional upgrade)
- Offer affiliate commission to top AppSumo reviewers
- Use AppSumo email list for v2 launch (with AppSumo approval)
- Track NPS from LTD customers separately

## Risk Mitigation

| Risk | Mitigation |
|------|------------|
| Revenue cannibalization | Cap total LTD seats (5,000 max) |
| Support overload | Dedicated AppSumo support email + FAQ |
| Feature entitlement disputes | Clear tier comparison on redemption page |
| Infrastructure cost | Usage limits on LTD (same as Pro/Business limits) |
