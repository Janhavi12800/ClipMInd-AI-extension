# Affiliate Program

## Overview

TechShield AI affiliate program offers **30% recurring commission** on all paid subscriptions referred through unique affiliate links.

## Commission Structure

| Plan | Monthly Price | Commission (30%) | Annual Commission |
|------|--------------|-------------------|-------------------|
| Pro | $19/mo | $5.70/mo | $45.00/yr |
| Business | $49/mo | $14.70/mo | $141.00/yr |

- **Cookie duration**: 90 days
- **Payout threshold**: $50 minimum
- **Payout schedule**: Monthly (Net-30)
- **Payout methods**: PayPal, Stripe Connect, bank transfer

## Affiliate Tiers

| Tier | Referrals/mo | Commission | Perks |
|------|-------------|------------|-------|
| **Partner** | 1–10 | 30% | Affiliate dashboard, marketing kit |
| **Pro Partner** | 11–50 | 35% | Priority support, co-branded landing page |
| **Elite Partner** | 51+ | 40% | Dedicated account manager, early access |

## Target Affiliates

| Category | Examples | Approach |
|----------|----------|----------|
| Security bloggers | The Hacker News, Krebs on Security readers | Guest post + affiliate link |
| YouTube creators | Tech review channels (50K+ subs) | Sponsored review + affiliate |
| SaaS newsletters | TLDR, SaaS Weekly | Sponsored placement |
| Cybersecurity courses | Udemy instructors, training platforms | Course integration |
| Marketing agencies | SEO agencies, content agencies | White-label referral |
| Chrome extension reviewers | Extension review blogs | Review + affiliate |

## Application Process

1. Apply at `https://techshield.ai/affiliates`
2. Review within 48 hours
3. Receive unique affiliate link: `https://techshield.ai/?ref=AFFILIATE_ID`
4. Access marketing kit (banners, email templates, social copy)
5. Track conversions in affiliate dashboard

## Marketing Kit Contents

- [ ] 5 banner sizes (728×90, 300×250, 160×600, 468×60, 320×50)
- [ ] 3 email templates (introduction, feature highlight, case study)
- [ ] 10 social media post templates
- [ ] Product demo video (embeddable)
- [ ] Comparison one-pager (PDF)
- [ ] Brand guidelines (logo, colors, tone)

## Tracking & Attribution

### Technical implementation
```
UTM parameters: ?ref=AFFILIATE_ID&utm_source=affiliate&utm_medium=referral
Cookie: techshield_ref (90-day, first-touch attribution)
Webhook: POST /api/v1/affiliates/conversion on subscription.created
```

### Database
```sql
CREATE TABLE affiliates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES profiles(id),
  code TEXT UNIQUE NOT NULL,
  tier TEXT DEFAULT 'partner',
  commission_rate DECIMAL(4,2) DEFAULT 0.30,
  total_earnings_cents INTEGER DEFAULT 0,
  status TEXT DEFAULT 'active',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE affiliate_conversions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  affiliate_id UUID REFERENCES affiliates(id),
  referred_user_id UUID REFERENCES profiles(id),
  subscription_id UUID REFERENCES user_subscriptions(id),
  commission_cents INTEGER NOT NULL,
  status TEXT DEFAULT 'pending',
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

## Affiliate Dashboard Features

- Real-time click and conversion tracking
- Earnings summary (pending, approved, paid)
- Marketing asset downloads
- Referral link generator with UTM builder
- Performance reports (clicks, conversions, revenue)
- Payout history

## Terms & Conditions

- No self-referrals
- No bidding on "TechShield AI" branded keywords in paid ads
- No spam or unsolicited email promotion
- Commissions paid on active subscriptions only (clawed back on refunds within 30 days)
- Affiliates must disclose affiliate relationship per FTC guidelines
- Program terms may change with 30-day notice

## Launch Plan

| Week | Action |
|------|--------|
| 1 | Build affiliate dashboard and tracking |
| 2 | Create marketing kit assets |
| 3 | Recruit 10 seed affiliates (beta users, bloggers) |
| 4 | Public launch on website + affiliate networks (ShareASale, PartnerStack) |
| 5+ | Weekly outreach to 5 potential affiliates |

## Success Metrics

| Metric | Month 1 | Month 3 | Month 6 |
|--------|---------|---------|---------|
| Active affiliates | 10 | 50 | 150 |
| Affiliate-driven signups | 50 | 300 | 1,000 |
| Affiliate revenue % | 5% | 15% | 25% |
| Top affiliate earnings | $100 | $500 | $2,000 |
