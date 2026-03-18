---
name: library
description: "Skill for the Library area of webapp. 3 symbols across 1 files."
---

# Library

3 symbols | 1 files | Cohesion: 100%

## When to Use

- Working with code in `src/`
- Understanding how LibraryPage, loadArticles, handleSourceClick work
- Modifying library-related functionality

## Key Files

| File | Symbols |
|------|---------|
| `src/app/library/page.tsx` | LibraryPage, loadArticles, handleSourceClick |

## Entry Points

Start here when exploring this area:

- **`LibraryPage`** (Function) — `src/app/library/page.tsx:50`
- **`loadArticles`** (Function) — `src/app/library/page.tsx:60`
- **`handleSourceClick`** (Function) — `src/app/library/page.tsx:81`

## Key Symbols

| Symbol | Type | File | Line |
|--------|------|------|------|
| `LibraryPage` | Function | `src/app/library/page.tsx` | 50 |
| `loadArticles` | Function | `src/app/library/page.tsx` | 60 |
| `handleSourceClick` | Function | `src/app/library/page.tsx` | 81 |

## How to Explore

1. `gitnexus_context({name: "LibraryPage"})` — see callers and callees
2. `gitnexus_query({query: "library"})` — find related execution flows
3. Read key files listed above for implementation details
