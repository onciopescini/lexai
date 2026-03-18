---
name: atena
description: "Skill for the Atena area of webapp. 4 symbols across 1 files."
---

# Atena

4 symbols | 1 files | Cohesion: 100%

## When to Use

- Working with code in `src/`
- Understanding how AtenaChat, scrollToBottom, toBase64 work
- Modifying atena-related functionality

## Key Files

| File | Symbols |
|------|---------|
| `src/app/atena/page.tsx` | AtenaChat, scrollToBottom, toBase64, handleSubmit |

## Entry Points

Start here when exploring this area:

- **`AtenaChat`** (Function) — `src/app/atena/page.tsx:19`
- **`scrollToBottom`** (Function) — `src/app/atena/page.tsx:37`
- **`toBase64`** (Function) — `src/app/atena/page.tsx:54`
- **`handleSubmit`** (Function) — `src/app/atena/page.tsx:74`

## Key Symbols

| Symbol | Type | File | Line |
|--------|------|------|------|
| `AtenaChat` | Function | `src/app/atena/page.tsx` | 19 |
| `scrollToBottom` | Function | `src/app/atena/page.tsx` | 37 |
| `toBase64` | Function | `src/app/atena/page.tsx` | 54 |
| `handleSubmit` | Function | `src/app/atena/page.tsx` | 74 |

## Execution Flows

| Flow | Type | Steps |
|------|------|-------|
| `AtenaChat → ToBase64` | intra_community | 3 |

## How to Explore

1. `gitnexus_context({name: "AtenaChat"})` — see callers and callees
2. `gitnexus_query({query: "atena"})` — find related execution flows
3. Read key files listed above for implementation details
