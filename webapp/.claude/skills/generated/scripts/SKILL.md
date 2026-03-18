---
name: scripts
description: "Skill for the Scripts area of webapp. 5 symbols across 2 files."
---

# Scripts

5 symbols | 2 files | Cohesion: 100%

## When to Use

- Working with code in `scripts/`
- Understanding how testEmbedding, testGeneration, run work
- Modifying scripts-related functionality

## Key Files

| File | Symbols |
|------|---------|
| `scripts/test-gemini.ts` | testEmbedding, testGeneration, run |
| `scripts/run-security-tests.ts` | runTestSuite, main |

## Key Symbols

| Symbol | Type | File | Line |
|--------|------|------|------|
| `testEmbedding` | Function | `scripts/test-gemini.ts` | 6 |
| `testGeneration` | Function | `scripts/test-gemini.ts` | 16 |
| `run` | Function | `scripts/test-gemini.ts` | 26 |
| `runTestSuite` | Function | `scripts/run-security-tests.ts` | 53 |
| `main` | Function | `scripts/run-security-tests.ts` | 82 |

## How to Explore

1. `gitnexus_context({name: "testEmbedding"})` — see callers and callees
2. `gitnexus_query({query: "scripts"})` — find related execution flows
3. Read key files listed above for implementation details
