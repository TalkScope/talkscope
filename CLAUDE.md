# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

---

## Commands

```bash
npm run dev                                    # Start dev server (Next.js + Turbopack)
npm run build                                  # Production build
npm run start                                  # Start production server
npx prisma studio                              # Browse database
npx prisma migrate dev --name <name>           # Create and apply a migration
npx prisma generate                            # Regenerate Prisma client after schema changes
npx tsx scripts/seed_conversations.ts          # Seed test data (10 agents × 10-15 convos)
```

No lint or test scripts configured.

---

## What Is TalkScope

Agent-centric conversation intelligence platform for contact centers. Analyzes transcripts via OpenAI, produces scored agent performance snapshots, detects behavioral patterns, and surfaces coaching priorities. It is NOT analytics-only — it's an operational performance system.

Core scoring dimensions: Overall, Communication, Conversion, Risk, CoachingPriority (all 0-100).

---

## Architecture

### Directory Layout

```
app/
  layout.tsx              # Root layout — only place that imports globals.css, renders <html>/<body>
  globals.css             # Design system: CSS variables + ts-* utility classes
  app/                    # Authenticated app namespace
    layout.tsx            # App shell (Header/Footer) — must NOT import globals.css or return <html>/<body>
    page.tsx              # Transcript analyzer (paste + mode select)
    dashboard/page.tsx    # Operations view: KPIs, coaching queue, batch jobs
    agents/[id]/page.tsx  # Per-agent: scorecard, score history chart, patterns panel, conversations
    patterns/page.tsx     # Pattern reports browser (filter by agent/team/org)
    _components/          # Header.tsx, Footer.tsx
    nav.ts                # Navigation config
  api/
    analyze/              # POST: single transcript → report (rate-limited, saves Report + Conversation)
    agents/score/
      generate/           # POST: conversations → AgentScore snapshot + AgentScoreHistory
      history/            # GET: score trends per agent
    batch/score/
      create/             # POST: creates BatchJob + one BatchTask per agent in scope
      run/                # POST: worker — pulls N tasks, scores sequentially, JSON repair fallback
      status/             # GET: progress polling
    patterns/
      generate/           # POST: multi-level pattern analysis → PatternReport
      list/               # GET: ?level=agent|team|org&refId=...&take=N
    conversations/bulk/   # POST: bulk conversation storage
    dashboard/overview/   # GET: KPI aggregation (high risk, coaching queue, top/low performers)
    meta/                 # GET: orgs, teams, agents, agent/[id] — used for UI dropdowns
    scope/                # GET: list (teams/orgs), agents
    history/              # GET: recent reports, GET [id]: single report
    usage/                # GET: rate limit status
    pdf/                  # POST: PDF export via Puppeteer
lib/
  prisma.ts               # Prisma singleton (globalThis cache prevents connection exhaustion)
prisma/
  schema.prisma           # Data model
scripts/
  seed_conversations.ts   # Test data generator
```

### Database Schema

```
Organization → Team → Agent → Conversation
                                  ↓
                             AgentScore (snapshot per scoring run)
                             AgentScoreHistory (trend row per run)

PatternReport (level: agent|team|org, refId, windowSize, reportJson)
BatchJob → BatchTask (per-agent, status: queued|running|done|failed)
Report (legacy single-analysis output, pre-conversation era)
```

`Conversation.reportJson` — cached analysis JSON string. Scoring and pattern endpoints prefer this over raw transcript to save tokens; fallback is first 1200 chars of transcript.

`AgentScore.strengths`, `.weaknesses`, `.patterns` — stored as JSON strings, parsed in UI.

`PatternReport.reportJson` — serialized pattern structure, parsed in UI.

### OpenAI Integration

- All LLM calls: `client.responses.create()` with `text.format: { type: "json_schema", ... }` for enforced structured output
- Model: `gpt-4.1-mini` (hardcoded everywhere, no abstraction layer)
- Token budgets: ~900 (analysis), ~1600 (scoring), ~2500 (patterns)
- Batch run endpoint: JSON repair fallback — on parse failure, retries once with a repair prompt before marking task failed

### Rate Limiting

In-memory store in `/api/analyze/route.ts`. Limits: 30/day global, 5/day per IP. Resets on server restart — not suitable for multi-instance production.

---

## Design System

Global CSS variables in `app/globals.css`. Always use `ts-*` classes — never raw Tailwind utility classes for component styling.

Key tokens: `--ts-accent` (#406184 brand blue), `--ts-ink`, `--ts-muted`, `--ts-border`, `--ts-success/warn/danger`.

Component classes: `.ts-card`, `.ts-btn`, `.ts-btn-primary`, `.ts-chip`, `.ts-chip-accent/danger/warn/success/muted`, `.ts-table`, `.ts-metric`, `.ts-panel`, `.ts-pagehead`, `.ts-topbar`, `.ts-navlink`.

Chips are outline-style (no loud background fill).

---

## Engineering Rules

- **Layout rule**: `globals.css` import and `<html>`/`<body>` tags belong exclusively in `app/layout.tsx`. Segment layouts (`app/app/layout.tsx` etc.) must not repeat these.
- **Typing**: strict TypeScript. Guard all JSON parsing with try/catch.
- **Prisma**: always import from `@/lib/prisma` (singleton). All queries must be multi-tenant safe (filter by orgId/teamId/agentId as appropriate).
- **UI actions**: avoid duplicate triggers (e.g., double-submit on buttons).
- **Absolute imports**: use `@/` prefix (configured in tsconfig paths).

---

## Environment Variables

```bash
DATABASE_URL=...        # PostgreSQL (Neon) — in .env
OPENAI_API_KEY=...      # In .env.local
DEFAULT_AGENT_ID=...    # Fallback agent for /api/analyze saves — in .env.local
```
