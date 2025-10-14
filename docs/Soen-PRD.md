# Soen — Product Requirements Document (PRD)

## Executive Summary & Vision
Soen is a personal AI that plans, executes, and reflects with you, turning messy ambition into reliable output. It pairs a context-aware copilot with a minimal workflow OS (tasks, notes, calendar, focus), delivering Jobs-level simplicity, Bezos-level customer obsession, and Altman-level AI leverage. Target: the iPhone of productivity—magical, default-on, and indispensable.

## Target Market & User Personas
- Creators, entrepreneurs, productivity enthusiasts.
- Personas:
  - Creator-Operator (content + business, needs focus, repurposing, deadlines).
  - Solo Founder (context switching, prioritization, investor/client comms).
  - Systems Nerd (automation, dashboards, multi-brain capture).

## Competitive Analysis & Positioning
- Direct: Notion AI, Mem, Tana, Reflect, Obsidian (+copilots), Motion/Reclaim/Sunsama/Akiflow, Rewind/ARC Max memory.
- White-space:
  - Unification: planning + execution + reflection in one flow.
  - Proactive copilot: suggests, plans, and negotiates schedule with guardrails.
  - Personal context graph: learns your rituals, energy, commitments.
- Positioning: “The personal operating system that thinks ahead.” Differentiate with proactive plans, one-button daily mode, honest metrics.

## Feature Prioritization & Roadmap
- V0.5 (0–6 weeks)
  - Mobile-responsiveness overhaul.
  - Daily Mode: one-button plan → focus → reflect loop.
  - Context-aware chat actions: create/assign tasks, summarize day.
  - Calendar read-only integration.
- V1 (6–12 weeks)
  - Smart Priorities; Focus Timer + auto-logging.
  - Calendar write; Email/Calendar ingestion.
  - Command Palette; Offline-ready PWA.
- V1.5 (3–4 months)
  - Memory Graph; Routines & Habits; Project briefs; AI compose for updates.
- V2 (6–9 months)
  - iOS app; integrations marketplace; collaborative sharing; voice capture; agentic scheduling.

## Technical Architecture Requirements
- Frontend
  - Next.js + React, Tailwind, Radix; SSR/ISR; mobile-first design.
  - State: Zustand/Redux; offline cache via Service Worker.
- Backend
  - Node/Next API routes or Fastify; Postgres (Neon/Supabase) + Redis; queue (BullMQ).
  - Vector store: pgvector/Supabase/OpenSearch for personal context retrieval.
- AI
  - OpenAI/Anthropic models; function-calling for actions; retrieval over personal context graph.
  - Privacy-first memory controls; evaluation harness for reliability.
- Integrations
  - Google Calendar (later iCloud/Outlook), Gmail, Notion import, Apple Health (iOS later).
- Observability & Security
  - OpenTelemetry, structured logging, analytics, feature flags.
  - OAuth, encryption in transit/at rest; SOC2-ready controls over time.

## Monetization Strategy
- Free: capture + tasks + basic chat.
- Pro ($12–20/mo): advanced AI planning, calendar write, routines, focus analytics, memory graph, integrations, higher model limits.
- Team ($20–30/user/mo): shared projects, roles, summaries, team rhythm reports.
- Add-ons: extra AI credits, creator templates, voice pack, premium agents.
- Enterprise: SSO, admin, data controls, private model routing.
- Affiliate/Rev-share: integrations marketplace.

## Go-to-Market Strategy
- Alpha waitlist; concierge onboarding for 100 creators/founders.
- Publish “Daily Mode” system; build in public on X/YouTube.
- Partner bundles with creator courses.
- Product Hunt launch for V1; referral unlocks; campus founder program.

## Success Metrics & KPIs
- Activation: Day-1 PQA (create tasks, pin priorities, run Daily Mode).
- Engagement: WAU/MAU; 3+ sessions/day; 30+ tasks/week; 2+ Daily Modes/week.
- Retention: D30 > 35%, D90 > 25% (free); Pro churn < 3% monthly.
- Value: time saved/session; commitment completion rate; planning adherence.
- Monetization: Pro conversion > 6% of WAU; ARPMAU > $2; Team expansion.

## Risk Assessment & Mitigation
- Model drift/hallucinations → scoped function-calls; confirmations; sandboxed actions; evals.
- Trust/privacy → local-first cache, selective memory, transparent controls, encryption.
- Integration fragility → retries, webhooks, backoff, decoupled connectors.
- UI complexity creep → Daily Mode default; guardrail constraints.
- Platform risk → multi-provider LLM abstraction; failover models.

---

# Appendix A — V0.5 Engineering Ticket Set

CSV (import to Linear/Jira or use below as checklist).

Columns: ID,Title,Type,Priority,Estimate,Owner,Description,Acceptance Criteria

1,"Mobile: Responsive grid + breakpoints overhaul",Feature,P1,5d,FE,"Audit all pages; implement mobile-first grid/layout; test on iPhone SE/12/14 Pro Max and Android Pixel sizes","All key views pass Lighthouse mobile >90; no horizontal scroll; tap targets >=44px"
2,"Daily Mode: Plan → Focus → Reflect loop (UI shell)",Feature,P1,5d,FE,"Add single entry CTA; 3-step flow; persistence","User can complete loop; progress saved; resumes after refresh"
3,"AI Chat: Action functions (create task, assign, summarize)",Feature,P1,4d,FE+BE,"Add function-calling endpoints; secure server-side execution","From chat, user creates task and sees confirmation; errors handled"
4,"Tasks: Create/Assign from chat + link to dashboard",Feature,P1,3d,FE+BE,"Wire chat actions to task store/db; surface in dashboard widgets","Tasks created via chat appear instantly in dashboard"
5,"Calendar: Read-only integration (Google)",Feature,P1,4d,BE,"OAuth flow; list upcoming events; guardrails for scope","User connects Google; sees next 7 days in dashboard"
6,"Daily Mode: Focus timer + auto-session logging (local)",Feature,P1,3d,FE,"Pomodoro/basic timer; store sessions; show in reflect step","Completed sessions visible with duration and task link"
7,"Performance: Bundle and TTI reductions",Chore,P1,2d,FE,"Code-split heavy routes; defer non-critical JS; image opt","TTI <3s on median mobile; bundle <250KB initial"
8,"Analytics: PQA + event schema",Chore,P1,1d,BE,"Implement activation events; WAU/MAU; Daily Mode events","Events visible in dashboard; funnels queryable"
9,"Testing: E2E smoke (Daily Mode + Chat actions)",Chore,P1,2d,FE,"Cypress/Playwright basic flows; CI gate","Green runs on PR; catches broken flows"
10,"Security: OAuth + token storage hardening",Chore,P1,2d,BE,"PKCE; httpOnly; rotation; secret management","Passes basic security checklist; tokens never in localStorage"

