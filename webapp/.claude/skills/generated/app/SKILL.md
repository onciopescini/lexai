---
name: app
description: "Skill for the App area of webapp. 4 symbols across 3 files."
---

# App

4 symbols | 3 files | Cohesion: 100%

## When to Use

- Working with code in `src/`
- Understanding how AtenaApp, initAuth, createClient work
- Modifying app-related functionality

## Key Files

| File | Symbols |
|------|---------|
| `src/app/page.tsx` | AtenaApp, initAuth |
| `src/lib/supabase/client.ts` | createClient |
| `src/components/ui/AuthModal.tsx` | AuthModal |

## Entry Points

Start here when exploring this area:

- **`AtenaApp`** (Function) — `src/app/page.tsx:58`
- **`initAuth`** (Function) — `src/app/page.tsx:66`
- **`createClient`** (Function) — `src/lib/supabase/client.ts:4`
- **`AuthModal`** (Function) — `src/components/ui/AuthModal.tsx:11`

## Key Symbols

| Symbol | Type | File | Line |
|--------|------|------|------|
| `AtenaApp` | Function | `src/app/page.tsx` | 58 |
| `initAuth` | Function | `src/app/page.tsx` | 66 |
| `createClient` | Function | `src/lib/supabase/client.ts` | 4 |
| `AuthModal` | Function | `src/components/ui/AuthModal.tsx` | 11 |

## How to Explore

1. `gitnexus_context({name: "AtenaApp"})` — see callers and callees
2. `gitnexus_query({query: "app"})` — find related execution flows
3. Read key files listed above for implementation details
