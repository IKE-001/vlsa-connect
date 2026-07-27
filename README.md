# VSLA Connect

> **Live Demo:** [https://vlsa-connect.vercel.app](https://vlsa-connect.vercel.app)
> **InclusionX** · FINOVATE 2026 · Build for Malawi. Build for the Future.

**Team Name:** InclusionX
**University:** University of Livingstonia
**Team Members:** Orama, Yamikani, Jabari, Kilotet, Arthony
**Challenge Track:** Financial Inclusion / AI in Financial Services

---

## Problem Statement

Village Savings and Loan Associations (VSLAs) across rural and peri-urban Malawi keep almost all
record-keeping on paper. This makes records easy to lose or dispute, leaves members with no
verifiable financial history, and gives formal banks no reliable way to assess a group's
creditworthiness for onward lending.

## Proposed Solution

VSLA Connect digitizes the entire VSLA lifecycle — membership, savings, loans, withdrawals,
voting, meetings, and attendance — into a tamper-evident digital ledger, and translates group
behavior into a **Group Health Score** that a National Bank Officer can use to identify VSLAs
eligible for formal credit. Access is provided through a web app and a USSD/SMS channel
(Africa's Talking), so the platform does not exclude members without smartphones.

## Key Features

- Role-based auth (Member, Chairperson, Treasurer, Secretary, National Bank Officer, Admin)
- Savings, loan, and withdrawal management with multi-member voting
- Append-only digital ledger — no silent edits
- USSD/SMS access via Africa's Talking (works on any feature phone, no internet needed)
- PayChangu payment integration (mobile money & card)
- AI chatbot — savings/loan Q&A, eligibility explanations, English ↔ Chichewa translation
- In-app member chat, kept separate from the AI chatbot
- National Bank Dashboard with Group Health Score (0–100)

---

## Technologies Used

| Layer | Technology | Details |
|---|---|
| **Framework** | Next.js (React) + TypeScript |
| **Styling** | Tailwind CSS |
| **Database** | Neon (Serverless PostgreSQL) — *Pooled connection for App, Direct connection for Migrations* |
| **ORM** | Prisma v6 (with `lib/db.ts` singleton) |
| Hosting | Vercel |
| SMS / USSD | Africa's Talking |
| Payments | PayChangu |
| AI | Groq (Llama 3.3) API |
| Media Storage | Cloudinary |
| Email | SMTP (Resend / SendGrid) |

Full technical specification: `docs/SRS.md`

---

## How the Codebase Is Organised

This is a **single Next.js project** — frontend and backend (API routes) live and deploy together. The codebase is deliberately layered so five people can work in parallel without colliding.

### The Full Request Lifecycle

```
Browser / USSD
      │
      ▼
middleware.ts          ← Orama: edge auth check, role guard, redirect to /login if needed
      │
      ▼
app/api/<module>/      ← thin route handler: parse request → call one controller → return response
      │
      ▼
controllers/<module>/  ← business / domain logic (validation, voting rules, ledger rules, score formula)
      │
      ├──▶ services/<module>/   ← data access layer: the ONLY code that talks to Prisma / the DB
      │           │
      │           ▼
      │       lib/db.ts         ← Prisma client singleton (one import, one place)
      │           │
      │           ▼
      │       Neon PostgreSQL   ← the actual database
      │
      └──▶ providers/<adapter>/ ← external calls: PayChangu, Africa's Talking, Groq, Cloudinary, SMTP
```

> **Rule:** Controllers never import Prisma. Services never call providers. Providers never touch the DB.
> This is what lets Jabari (financial logic) and Orama (auth/governance) work in the same repo without breaking each other.

---

### Backend — MCP Separation of Concerns

The backend follows **Model → Controller → Provider** layering, with a **Service layer** between controllers and the database.

#### `app/api/` — Route Handlers (thin shell)

Every file here does three things only: parse the incoming request, check the caller's role, call one controller function, return the response. No business logic lives here.

```
app/api/
  auth/            ← Orama
  groups/          ← Orama
  meetings/        ← Orama
  notifications/   ← Orama
  savings/         ← Jabari
  loans/           ← Jabari
  withdrawals/     ← Jabari
  ledger/          ← Jabari
  health-score/    ← Jabari
  ai/              ← Arthony
  ussd/            ← Arthony
  payments/        ← Arthony
  chat/            ← Kilotet + Orama
```

#### `controllers/` — Business / Domain Logic

Framework-agnostic functions that encode the rules of the system. A controller receives plain data, applies rules (e.g. "a loan requires three votes", "a ledger entry cannot be deleted"), and returns a result. It has no knowledge of HTTP or the database.

```
controllers/
  auth/        healthScore/    savings/
  groups/      ledger/         withdrawals/
  meetings/    loans/          chat/
  notifications/               ai/
```

#### `services/` — Data Access Layer

The only layer that imports `lib/db.ts` (the Prisma client). Each service exposes typed functions for one entity — `createContribution()`, `getBalance()`, `appendLedgerEntry()`. Controllers call services; services call Prisma. This boundary means you can swap the database or mock it in tests without touching any controller.

```
services/
  auth/        healthScore/    savings/
  groups/      ledger/         withdrawals/
  meetings/    loans/          chat/
  notifications/               ai/
```

#### `providers/` — External Adapters

Each provider wraps one vendor behind a stable interface. If a sandbox is down during the hackathon, you swap the implementation file — nothing in a controller or service changes.

```
providers/
  africasTalking/   ← USSD session handler + SMS dispatch
  paychangu/        ← mobile money & card payment processing
  groq/             ← AI chatbot + English ↔ Chichewa translation
  cloudinary/       ← profile photo & file uploads
  smtp/             ← transactional email (password reset, confirmations)
  notifications/    ← fan-out: decides whether to send SMS, in-app, or email
```

#### `prisma/` — Model (Schema & Migrations)

Owned by Arthony. The Prisma schema is the single source of truth for the database shape. No other layer is allowed to define table structure.

```
prisma/
  schema.prisma      ← all table definitions (users, groups, loans, ledger_entries, health_scores…)
  migrations/        ← auto-generated migration history
  seed.ts            ← demo data: multiple groups, mixed loan statuses, varied attendance
```

---

### Frontend — Atomic Component Architecture

Every screen is built from reusable pieces, not hand-rolled per page. Kilotet builds atoms once; every role dashboard reuses them.

```
components/
  atoms/            ← smallest primitives, no business logic
    Button/
    Input/
    Badge/
    Label/
    Spinner/
    Avatar/

  molecules/        ← one atom group with one job
    FormField/        ← Label + Input + error message
    VoteCard/         ← approve / reject card for loans & withdrawals
    ListRow/          ← reusable row for any list
    NotificationItem/
    ChatBubble/

  organisms/        ← composed, screen-level sections
    ContributionTable/
    LoanVotingPanel/
    GroupDirectory/
    LedgerView/
    HealthScoreChart/
    ChatWindow/       ← in-app member chat
    AIChatWindow/     ← AI chatbot (visually distinct from ChatWindow)

  templates/        ← layout shells per role; filled by pages under app/
    MemberShell/
    ChairpersonShell/
    TreasurerShell/
    SecretaryShell/
    BankOfficerShell/
    AdminShell/
```

#### `app/` — Pages (routes)

Pages are thin. They pull data via custom hooks, pass it into a template, and let organisms render it.

```
app/
  (auth)/
    login/           register/           forgot-password/

  (member)/
    dashboard/       profile/            contributions/
    loans/           withdrawals/        chat/
    ai-assistant/

  (chairperson)/     dashboard/          profile/
  (treasurer)/       dashboard/          profile/
  (secretary)/       dashboard/          profile/
  (bank-officer)/    dashboard/          profile/
  (admin)/           dashboard/          profile/
```

#### `hooks/` — Custom React Hooks

Keep pages and organisms thin. Examples: `useAuth()`, `useGroup()`, `useLoan()`, `useContributions()`, `useChat()`. Hooks call the API layer and manage local state — no fetch logic lives in a component.

---

### Shared Utilities

#### `lib/`

| File | Purpose |
|---|---|
| `db.ts` | Prisma client singleton — the **only** file that does `new PrismaClient()` |
| `auth.ts` | Session helpers, token utilities, role check helpers used by middleware |
| `constants.ts` | Role name enums, Health Score weight constants, cycle frequency options |
| `validations/` | Zod schemas per entity — validate API request bodies and generate TypeScript types simultaneously |
| `utils/` | Pure helper functions: `tambalaToMWK()`, `mwkToTambala()`, `calcInterest()`, `formatDate()` |

#### `types/`

Shared TypeScript interfaces and enums imported by both frontend and backend. Examples: `UserRole`, `ApiResponse<T>`, `LedgerEntry`, `HealthScoreBreakdown`, `VoteDecision`.

#### `config/`

Centralised configuration objects — not secrets (those live in `.env.local`). Examples: `healthScoreWeights.ts` (tweak the 0–100 formula without touching controller code), `loanRules.ts`, `ussdMenuTree.ts`.

---

### Tests

Owned by Yamikani. Mirrors the source tree so every module has a natural home.

```
__tests__/
  unit/
    controllers/     ← test business logic in isolation; mock services
    services/        ← test Prisma queries; mock lib/db.ts
    providers/       ← test Africa's Talking / PayChangu adapters; mock HTTP
    lib/             ← test validators, formatters, tambala converter

  integration/
    api/
      auth/          savings/      loans/
      withdrawals/   ledger/       health-score/
      groups/        meetings/     ussd/
      payments/      ai/           chat/

  e2e/               ← Playwright smoke tests (login → contribute → view ledger)
```

> **Critical rule:** Any pull request touching `ledger/` or `health-score/` requires a passing test in `__tests__/integration/api/ledger/` or `__tests__/integration/api/health-score/` and a dual code review before it merges to `main`.

---

### Scripts

One-off Node scripts run outside the app (via `npx ts-node scripts/<file>`).

```
scripts/
  seed.ts          ← populate realistic demo data (multiple groups, mixed loan/repayment statuses, varied attendance) — run before Hour 46
  reset-db.ts      ← drop all data, re-migrate, re-seed (clean slate for a fresh demo)
  health-check.ts  ← ping PayChangu and Africa's Talking sandboxes; used at Hour 20 checkpoint
```

---

### `middleware.ts` (project root)

Next.js Edge Middleware — runs before any page or API route is served. Owned by Orama.

- Verifies the session token on every request to a protected route group
- Redirects unauthenticated users to `/login`
- Guards role-sensitive routes (e.g. only `bank-officer` and `admin` can reach `/(bank-officer)/*`)

---

## Environment Variables

Copy `.env.example` to `.env.local` and fill in real values. Never commit `.env.local`.

| Group | Variables |
|---|---|
| Database | `DATABASE_URL`, `DATABASE_URL_UNPOOLED` |
| Auth / Session | `NEXTAUTH_SECRET`, `NEXTAUTH_URL` |
| Africa's Talking | `AT_API_KEY`, `AT_USERNAME`, `AT_SHORTCODE`, `AT_SENDER_ID` |
| PayChangu | `PAYCHANGU_SECRET_KEY`, `PAYCHANGU_PUBLIC_KEY`, `PAYCHANGU_BASE_URL`, `PAYCHANGU_CALLBACK_URL` |
| Groq AI | `GROQ_API_KEY`, `GROQ_MODEL` |
| Cloudinary | `CLOUDINARY_CLOUD_NAME`, `CLOUDINARY_API_KEY`, `CLOUDINARY_API_SECRET` |
| SMTP | `SMTP_HOST`, `SMTP_PORT`, `SMTP_SECURE`, `SMTP_USER`, `SMTP_PASSWORD`, `SMTP_FROM` |
| App | `NEXT_PUBLIC_APP_URL`, `NODE_ENV` |

---

## Installation & Local Development

```bash
# 1. Clone the repo
git clone https://github.com/<org>/vsla-connect.git
cd vsla-connect

# 2. Install dependencies
npm install

# 3. Set up environment variables
cp .env.example .env.local
# Open .env.local and fill in your Neon, Africa's Talking, PayChangu, Groq, and Cloudinary credentials

# 4. Set up Prisma and Neon Database
# Run these commands to push the database schema directly to Neon
npx prisma db push --accept-data-loss
npx prisma generate

# 5. Start the dev server
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

---

## Using the Database (Backend Team)

We use **Neon** (a serverless PostgreSQL provider) and **Prisma** (our ORM). 

**Do NOT create new database connections in your files.** The connection is pooled and managed centrally to prevent overwhelming the Neon serverless instance.

To read or write from the database in your Controllers, API routes, or Services, simply import the Prisma singleton from `lib/db.ts`:

```typescript
import { db } from "@/lib/db";

export async function createNewGroup(name: string) {
  // Use `db` to interact with Neon
  const group = await db.vslaGroup.create({
    data: { name, ... }
  });
  return group;
}
```

---

## Team & Ownership

| Member | Role | Owns |
|---|---|---|
| **Arthony** | Database, Third-Party Integration & AI Lead | `prisma/`, `providers/africasTalking`, `providers/paychangu`, `providers/groq`, `providers/cloudinary`, `providers/smtp`, `app/api/ai`, `app/api/ussd`, `app/api/payments`, `scripts/` |
| **Kilotet** | Frontend Developer | All `app/(auth)`, `app/(member)`, and role dashboard pages; `components/` (full atomic library); `hooks/`; `app/api/chat` (UI side) |
| **Jabari** | Backend — Financial Logic | `app/api/savings`, `loans`, `withdrawals`, `ledger`, `health-score`; `controllers/` and `services/` for those modules; `config/healthScoreWeights.ts` |
| **Orama** | Backend — Auth, Governance & Integration Support | `app/api/auth`, `groups`, `meetings`, `notifications`; `controllers/` and `services/` for those modules; `middleware.ts`; supports Arthony on integration wiring |
| **Yamikani** | Documentation & Testing Lead | `docs/SRS.md`, `__tests__/` (full test suite), demo script, pitch deck content, QA across web + USSD |

**Shared:** any PR touching `ledger/` or `health-score/` requires review from at least two team members before merging.

---

## Business Model Summary

_To be completed — see `docs/SRS.md` Section 10 and the team's pitch deck._

---

**InclusionX** · FINOVATE 2026 · Build for Malawi. Build for the Future.
