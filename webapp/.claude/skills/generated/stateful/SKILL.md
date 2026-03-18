---
name: stateful
description: "Skill for the Stateful area of webapp. 10 symbols across 4 files."
---

# Stateful

10 symbols | 4 files | Cohesion: 100%

## When to Use

- Working with code in `src/`
- Understanding how DaemonDashboard, fetchInitialEvents, getLevelColor work
- Modifying stateful-related functionality

## Key Files

| File | Symbols |
|------|---------|
| `src/components/stateful/DaemonDashboard.tsx` | DaemonDashboard, fetchInitialEvents, getLevelColor, getLevelBg |
| `src/components/stateful/TruthFeedback.tsx` | recordFeedback, handleSubmitDown |
| `src/components/stateful/LegalFactCheck.tsx` | ScoreCircle, getColor |
| `src/components/stateful/AsyncQueueTracker.tsx` | AsyncQueueTracker, fetchTasks |

## Entry Points

Start here when exploring this area:

- **`DaemonDashboard`** (Function) — `src/components/stateful/DaemonDashboard.tsx:15`
- **`fetchInitialEvents`** (Function) — `src/components/stateful/DaemonDashboard.tsx:22`
- **`getLevelColor`** (Function) — `src/components/stateful/DaemonDashboard.tsx:62`
- **`getLevelBg`** (Function) — `src/components/stateful/DaemonDashboard.tsx:73`
- **`recordFeedback`** (Function) — `src/components/stateful/TruthFeedback.tsx:15`

## Key Symbols

| Symbol | Type | File | Line |
|--------|------|------|------|
| `DaemonDashboard` | Function | `src/components/stateful/DaemonDashboard.tsx` | 15 |
| `fetchInitialEvents` | Function | `src/components/stateful/DaemonDashboard.tsx` | 22 |
| `getLevelColor` | Function | `src/components/stateful/DaemonDashboard.tsx` | 62 |
| `getLevelBg` | Function | `src/components/stateful/DaemonDashboard.tsx` | 73 |
| `recordFeedback` | Function | `src/components/stateful/TruthFeedback.tsx` | 15 |
| `handleSubmitDown` | Function | `src/components/stateful/TruthFeedback.tsx` | 69 |
| `AsyncQueueTracker` | Function | `src/components/stateful/AsyncQueueTracker.tsx` | 10 |
| `fetchTasks` | Function | `src/components/stateful/AsyncQueueTracker.tsx` | 17 |
| `ScoreCircle` | Function | `src/components/stateful/LegalFactCheck.tsx` | 29 |
| `getColor` | Function | `src/components/stateful/LegalFactCheck.tsx` | 34 |

## How to Explore

1. `gitnexus_context({name: "DaemonDashboard"})` — see callers and callees
2. `gitnexus_query({query: "stateful"})` — find related execution flows
3. Read key files listed above for implementation details
