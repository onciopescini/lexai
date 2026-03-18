---
name: guardian
description: "Skill for the Guardian area of webapp. 4 symbols across 1 files."
---

# Guardian

4 symbols | 1 files | Cohesion: 100%

## When to Use

- Working with code in `src/`
- Understanding how GuardianFeed, fetchAlerts, getImpactColor work
- Modifying guardian-related functionality

## Key Files

| File | Symbols |
|------|---------|
| `src/app/guardian/page.tsx` | GuardianFeed, fetchAlerts, getImpactColor, getImpactDotColor |

## Entry Points

Start here when exploring this area:

- **`GuardianFeed`** (Function) — `src/app/guardian/page.tsx:19`
- **`fetchAlerts`** (Function) — `src/app/guardian/page.tsx:24`
- **`getImpactColor`** (Function) — `src/app/guardian/page.tsx:44`
- **`getImpactDotColor`** (Function) — `src/app/guardian/page.tsx:53`

## Key Symbols

| Symbol | Type | File | Line |
|--------|------|------|------|
| `GuardianFeed` | Function | `src/app/guardian/page.tsx` | 19 |
| `fetchAlerts` | Function | `src/app/guardian/page.tsx` | 24 |
| `getImpactColor` | Function | `src/app/guardian/page.tsx` | 44 |
| `getImpactDotColor` | Function | `src/app/guardian/page.tsx` | 53 |

## How to Explore

1. `gitnexus_context({name: "GuardianFeed"})` — see callers and callees
2. `gitnexus_query({query: "guardian"})` — find related execution flows
3. Read key files listed above for implementation details
