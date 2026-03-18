---
name: stripe
description: "Skill for the Stripe area of webapp. 10 symbols across 2 files."
---

# Stripe

10 symbols | 2 files | Cohesion: 100%

## When to Use

- Working with code in `src/`
- Understanding how sendPremiumWelcomeEmail, sendCancellationEmail, sendSubscriptionUpdateEmail work
- Modifying stripe-related functionality

## Key Files

| File | Symbols |
|------|---------|
| `src/lib/resend.ts` | getResend, premiumWelcomeHTML, subscriptionCancelledHTML, subscriptionUpdatedHTML, sendPremiumWelcomeEmail (+2) |
| `src/app/api/webhook/stripe/route.ts` | getStripe, getSupabaseAdmin, POST |

## Entry Points

Start here when exploring this area:

- **`sendPremiumWelcomeEmail`** (Function) — `src/lib/resend.ts:114`
- **`sendCancellationEmail`** (Function) — `src/lib/resend.ts:133`
- **`sendSubscriptionUpdateEmail`** (Function) — `src/lib/resend.ts:152`
- **`POST`** (Function) — `src/app/api/webhook/stripe/route.ts:26`

## Key Symbols

| Symbol | Type | File | Line |
|--------|------|------|------|
| `sendPremiumWelcomeEmail` | Function | `src/lib/resend.ts` | 114 |
| `sendCancellationEmail` | Function | `src/lib/resend.ts` | 133 |
| `sendSubscriptionUpdateEmail` | Function | `src/lib/resend.ts` | 152 |
| `POST` | Function | `src/app/api/webhook/stripe/route.ts` | 26 |
| `getResend` | Function | `src/lib/resend.ts` | 5 |
| `premiumWelcomeHTML` | Function | `src/lib/resend.ts` | 16 |
| `subscriptionCancelledHTML` | Function | `src/lib/resend.ts` | 54 |
| `subscriptionUpdatedHTML` | Function | `src/lib/resend.ts` | 85 |
| `getStripe` | Function | `src/app/api/webhook/stripe/route.ts` | 12 |
| `getSupabaseAdmin` | Function | `src/app/api/webhook/stripe/route.ts` | 18 |

## Execution Flows

| Flow | Type | Steps |
|------|------|-------|
| `POST → GetResend` | intra_community | 3 |
| `POST → PremiumWelcomeHTML` | intra_community | 3 |
| `POST → SubscriptionCancelledHTML` | intra_community | 3 |

## How to Explore

1. `gitnexus_context({name: "sendPremiumWelcomeEmail"})` — see callers and callees
2. `gitnexus_query({query: "stripe"})` — find related execution flows
3. Read key files listed above for implementation details
