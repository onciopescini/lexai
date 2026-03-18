---
name: agents
description: "Skill for the Agents area of webapp. 35 symbols across 18 files."
---

# Agents

35 symbols | 18 files | Cohesion: 83%

## When to Use

- Working with code in `src/`
- Understanding how getGenAI, getEmbeddings, generateSynthesizedAnswer work
- Modifying agents-related functionality

## Key Files

| File | Symbols |
|------|---------|
| `src/lib/gemini.ts` | getGenAI, cacheSet, getEmbeddings, generateSynthesizedAnswer, generateTenthManRebuttal (+2) |
| `src/lib/groq.ts` | callGroq, rerankDocuments, analyzeIntent |
| `src/lib/agents/TenthManAgent.ts` | performExecution, TenthManAgent |
| `src/lib/agents/PicoClawAgent.ts` | performExecution, PicoClawAgent |
| `src/lib/agents/MindMapAgent.ts` | performExecution, MindMapAgent |
| `src/lib/agents/MemoryAgent.ts` | performExecution, MemoryAgent |
| `src/lib/agents/IngestAgent.ts` | performExecution, IngestAgent |
| `src/lib/agents/AtenaSearchAgent.ts` | performExecution, AtenaSearchAgent |
| `src/lib/agents/BaseAgent.ts` | validatePolicy, execute |
| `src/lib/agents/RouterAgent.ts` | performExecution, RouterAgent |

## Entry Points

Start here when exploring this area:

- **`getGenAI`** (Function) — `src/lib/gemini.ts:3`
- **`getEmbeddings`** (Function) — `src/lib/gemini.ts:25`
- **`generateSynthesizedAnswer`** (Function) — `src/lib/gemini.ts:47`
- **`generateTenthManRebuttal`** (Function) — `src/lib/gemini.ts:102`
- **`factCheckResponse`** (Function) — `src/lib/gemini.ts:195`

## Key Symbols

| Symbol | Type | File | Line |
|--------|------|------|------|
| `SocialAgent` | Class | `src/lib/agents/SocialAgent.ts` | 9 |
| `MindMapAgent` | Class | `src/lib/agents/MindMapAgent.ts` | 45 |
| `MemoryAgent` | Class | `src/lib/agents/MemoryAgent.ts` | 16 |
| `IngestAgent` | Class | `src/lib/agents/IngestAgent.ts` | 12 |
| `TenthManAgent` | Class | `src/lib/agents/TenthManAgent.ts` | 8 |
| `PicoClawAgent` | Class | `src/lib/agents/PicoClawAgent.ts` | 4 |
| `AtenaSearchAgent` | Class | `src/lib/agents/AtenaSearchAgent.ts` | 4 |
| `RouterAgent` | Class | `src/lib/agents/RouterAgent.ts` | 4 |
| `LiveWebAgent` | Class | `src/lib/agents/LiveWebAgent.ts` | 8 |
| `getGenAI` | Function | `src/lib/gemini.ts` | 3 |
| `getEmbeddings` | Function | `src/lib/gemini.ts` | 25 |
| `generateSynthesizedAnswer` | Function | `src/lib/gemini.ts` | 47 |
| `generateTenthManRebuttal` | Function | `src/lib/gemini.ts` | 102 |
| `factCheckResponse` | Function | `src/lib/gemini.ts` | 195 |
| `generateSocialSummary` | Function | `src/lib/gemini.ts` | 273 |
| `POST` | Function | `src/app/api/social/route.ts` | 3 |
| `POST` | Function | `src/app/api/mindmap/route.ts` | 3 |
| `GET` | Function | `src/app/api/analyze-memory/route.ts` | 5 |
| `POST` | Function | `src/app/api/admin/ingest/route.ts` | 5 |
| `callGroq` | Function | `src/lib/groq.ts` | 17 |

## Execution Flows

| Flow | Type | Steps |
|------|------|-------|
| `POST → ValidatePolicy` | cross_community | 3 |
| `POST → CallGroq` | cross_community | 3 |
| `POST → ValidatePolicy` | cross_community | 3 |
| `POST → CallGroq` | cross_community | 3 |
| `POST → ValidatePolicy` | intra_community | 3 |
| `POST → ValidatePolicy` | intra_community | 3 |
| `GET → ValidatePolicy` | intra_community | 3 |
| `POST → ValidatePolicy` | intra_community | 3 |

## How to Explore

1. `gitnexus_context({name: "getGenAI"})` — see callers and callees
2. `gitnexus_query({query: "agents"})` — find related execution flows
3. Read key files listed above for implementation details
