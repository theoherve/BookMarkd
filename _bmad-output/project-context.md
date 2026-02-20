---
project_name: 'book-markd'
user_name: 'Theo.herve'
date: '2026-02-18'
sections_completed: ['technology_stack', 'language_rules', 'framework_rules', 'testing_rules', 'quality_rules', 'workflow_rules', 'anti_patterns']
status: 'complete'
rule_count: 52
optimized_for_llm: true
---

# Project Context for AI Agents

_This file contains critical rules and patterns that AI agents must follow when implementing code in this project. Focus on unobvious details that agents might otherwise miss._

---

## Technology Stack & Versions

- **Next.js** 16.0.10 — App Router, Server Components, Server Actions
- **React** 19.2.0 — with React Compiler enabled (babel-plugin-react-compiler 1.0.0)
- **TypeScript** ^5 — strict mode
- **TailwindCSS** ^4 — PostCSS-based (NOT v3 config format)
- **shadcn/ui** + Radix UI — pre-built components in `src/components/ui/`
- **Zustand** ^5.0.8 — client UI state
- **TanStack Query** ^5.90.8 — server/async state (React Query)
- **NextAuth** ^4.24.13 — authentication
- **Supabase JS** ^2.81.1 — database client (PostgreSQL)
- **next-pwa** ^5.6.0 / Workbox ^7.3.0 — PWA / Service Worker
- **Vitest** ^4.0.8 + React Testing Library ^16.3.0 — unit tests
- **Playwright** ^1.56.1 — E2E tests
- **pnpm** 10.10.0 — package manager (use pnpm, NOT npm/yarn)
- **bcryptjs** ^3.0.3 — password hashing
- **Resend** ^6.9.2 — email sending
- **@dnd-kit** — drag and drop (lists)
- **Build**: webpack (`next build --webpack`), Turbopack disabled

## Critical Implementation Rules

### Language-Specific Rules

- **TypeScript strict mode** is enabled — no `any`, no implicit returns, no unused vars
- **Path alias**: always use `@/` for imports from `src/` (e.g., `@/lib/auth/session`) — NEVER use relative `../../` paths crossing feature boundaries
- **Import order**: external packages first, then `@/` aliases, then relative imports
- **Async/await** preferred over raw Promise chains
- **Discriminated union result pattern** for Server Actions:
  ```ts
  type Result = { success: true } | { success: false; message: string }
  ```
- **Domain types** live in `src/features/{domain}/types.ts` — never inline complex types in components
- **`isolatedModules: true`** — every file must be a module (add `export {}` if needed)
- **Error messages shown to users are in French** — internal logs/comments can be in English or French
- **Never cast with `as` to bypass type errors** — fix the type properly
- **`db.toCamel<Type>()`** must be called on all Supabase query results — DB returns snake_case, TypeScript uses camelCase

### Framework-Specific Rules

#### Next.js App Router
- **Pages are async Server Components by default** — only add `"use client"` when strictly needed (event handlers, hooks, browser APIs, Zustand, TanStack Query)
- **Auth guard pattern** in every protected page:
  ```ts
  const session = await getCurrentSession();
  const userId = await resolveSessionUserId(session);
  if (!userId) redirect("/login?callbackUrl=/your-path");
  ```
- **`export const dynamic = "force-dynamic"` + `export const revalidate = 0`** on data-heavy/real-time pages
- **All pages wrapped in `<AppShell>`** layout component — never bypass it
- **Page header pattern**: `<Badge>` label → `<h1>` title → `<p>` description
- **API routes** in `src/app/api/{resource}/route.ts` — use `NextResponse.json()`
- **Server Actions** in `src/server/actions/{domain}.ts` — always `"use server"` at top of file
- **Image domains** must be declared in `next.config.ts` `remotePatterns` before use

#### React & Components
- **React Compiler is enabled** — do NOT add `useMemo`/`useCallback` manually; the compiler handles it
- **Component files**: one default export per file, named same as the file (PascalCase)
- **`"use client"`** required for: Zustand stores, TanStack Query hooks, `useState`/`useEffect`, event listeners
- **shadcn/ui components** are in `src/components/ui/` — use them before creating new primitives
- **`cn()` utility** (clsx + tailwind-merge) for conditional class names

#### Supabase / Database
- **Always use service client**: `import db from "@/lib/supabase/db"` → `db.client`
- **ALWAYS call `db.toCamel<Type>()`** on Supabase query results — critical, DB is snake_case
- **`maybeSingle()`** for nullable single-row queries; **`single()`** only when row is guaranteed
- **DB column names**: snake_case in queries — TypeScript interfaces: camelCase
- **RLS policies** are active — server actions use service client to bypass RLS where needed
- **Error code `"23505"`** = unique constraint violation (handle explicitly)

#### State Management
- **Zustand** for UI state (filters, modals, wizard) — store files in `src/stores/{name}.ts`
- **TanStack Query** for all server/async data — hooks in `src/features/{domain}/api/use-{name}.ts`
- **Query keys** are arrays: `["resource", params]`
- **Invalidate query cache** after mutations via Server Actions

### Testing Rules

#### Test Framework
- **Unit/integration tests**: Vitest ^4.0.8 — run with `pnpm test`
- **E2E tests**: Playwright — run with `pnpm test:ui` (files in `tests/e2e/`)
- **Test environment**: `node` (vitest.config.mts) — use `jsdom` only for React component tests
- **Setup file**: `vitest.setup.ts` is loaded before all tests
- **Coverage**: `pnpm test:coverage` — provider is v8

#### Test File Organization
- Unit/integration test files: co-locate with source as `{filename}.test.ts(x)` or in `__tests__/` beside the file
- E2E test files: `tests/e2e/{feature}-*.spec.ts`
- No test files exist yet — follow Vitest conventions when creating them

#### Writing Tests
- **Mock Supabase** — never call real DB in unit tests
- **Mock NextAuth `getServerSession`** when testing Server Components or actions that require auth
- **React Testing Library**: use `render`, `screen`, `userEvent` — avoid `fireEvent`
- **Prefer `getByRole` and `getByText`** over `data-testid` attributes
- **Async tests**: use `await` with `findBy*` queries for async rendering
- **`globals: true`** in vitest config — `describe`, `it`, `expect` available without import

#### Coverage
- No enforced threshold currently — prioritize tests for Server Actions and critical `src/lib/` functions

### Code Quality & Style Rules

#### Linting & Formatting
- **ESLint 9** with `eslint-config-next/core-web-vitals` + `eslint-config-next/typescript` — run with `pnpm lint`
- No Prettier config — ESLint handles style; match existing code formatting
- Generated files ignored by ESLint: `public/sw.js`, `public/workbox-*.js` (next-pwa output)

#### File & Folder Structure
```
src/
  app/                    ← Next.js App Router (pages, layouts, API routes)
  components/
    ui/                   ← shadcn/ui primitives (DO NOT modify manually)
    layout/               ← AppShell, navigation, providers
    {domain}/             ← feature-scoped components (books/, feed/, lists/, profile/...)
  features/
    {domain}/
      api/                ← TanStack Query hooks (use-{name}.ts)
      server/             ← server-only data functions (get-{name}.ts)
      types.ts            ← domain types
  lib/                    ← shared utilities (auth/, supabase/, pwa/, storage/, utils/)
  server/actions/         ← Next.js Server Actions ({domain}.ts)
  stores/                 ← Zustand stores ({name}.ts)
  hooks/                  ← custom React hooks (use-{name}.ts)
  types/                  ← global/shared TypeScript types
```

#### Naming Conventions
- **Files**: kebab-case everywhere (`feed-section.tsx`, `use-book-search.ts`, `get-user-lists.ts`)
- **React components**: PascalCase export matching filename (`FeedSection`, `AppShell`)
- **Functions/hooks**: camelCase (`getUserLists`, `useBookSearch`)
- **Zustand stores**: `use{Name}Store` pattern (`useFeedFiltersStore`)
- **Server functions**: verb-noun pattern (`getUserLists`, `registerUser`)
- **Types**: PascalCase (`ListSummary`, `ViewerRole`, `SearchParams`)

#### Code Style
- **Tailwind classes** directly in JSX — no CSS modules or styled-components
- **TailwindCSS v4**: use CSS variable-based tokens (`text-foreground`, `bg-muted`, `text-muted-foreground`) — not v3 arbitrary value patterns
- **No comments** on obvious code — only comment non-evident business logic

### Development Workflow Rules

#### Git & Branches
- **Branch naming**: `features/{feature-name}` or `fix/{fix-name}`
- **Commit message format**: `[Type] Description` — e.g., `[Feature] Add BackButton Component`, `[Enhancement] Update AppShell Footer`, `[Fix] Correct reading status query`
- **PRs target `main`** branch

#### Dev Scripts
- `pnpm dev` — dev server (Turbopack disabled: `TURBOPACK=0 next dev`)
- `pnpm build` — production build (`next build --webpack`)
- `pnpm lint` — ESLint
- `pnpm test` — Vitest unit tests
- `pnpm test:ui` — Playwright E2E tests
- `pnpm db:reset` — reset local DB
- `pnpm db:test` — test DB connection

#### PWA & Service Worker
- **SW registration is manual** via `ServiceWorkerProvider` — NOT next-pwa auto-register (`register: false`)
- **PWA disabled in development** (`disable: process.env.NODE_ENV === 'development'`)
- **Offline fallback**: `/offline` route
- **Never modify** `public/sw.js` or `public/workbox-*.js` — generated at build time

#### Environment Variables
Required in `.env.local`:
- `BOOK_MARKD_POSTGRES_URL_NON_POOLING`
- `NEXTAUTH_SECRET`, `NEXTAUTH_URL`
- `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`
- `OPEN_LIBRARY_API_URL`
- `RESEND_API_KEY`

#### Deployment
- Target: **Vercel** (Next.js) + **Supabase** (Postgres, Storage, Auth)

### Critical Don't-Miss Rules

#### Absolute Anti-Patterns
- **Never use `npm` or `yarn`** — this project uses `pnpm` exclusively
- **Never modify `src/components/ui/`** manually — managed by shadcn/ui
- **Never create a Supabase client client-side** — always go through Server Actions or API routes
- **Never skip `db.toCamel<Type>()`** after a Supabase query — most common mistake, DB is snake_case
- **Never add `useMemo`/`useCallback`** — React Compiler handles memoization automatically
- **Never use an image domain** without declaring it in `next.config.ts` `remotePatterns` first
- **Never use TailwindCSS v3 config patterns** — project is on v4 (PostCSS-based, no `tailwind.config.js`)
- **Never write user-facing error messages in English** — always in French

#### Security Gotchas
- **Passwords**: always hash with `bcryptjs` (salt rounds: 10) — never store plain text
- **Server Actions**: validate inputs server-side even if already validated client-side
- **Session**: use `getCurrentSession()` + `resolveSessionUserId()` — never trust URL params to identify the current user
- **Supabase service client** bypasses RLS — only use in secured server-side contexts

#### Performance Gotchas
- **`export const dynamic = "force-dynamic"`** disables static cache — use only when necessary
- **TanStack Query** already handles caching — do not duplicate cache logic
- **Use `{ count: "exact", head: true }`** for count queries — never fetch all rows to count them

#### PWA Gotchas
- **Service Worker is disabled in development** — test PWA features in production/preview builds only
- **SW registration is manual** in `ServiceWorkerProvider` — do not set `register: true` in next-pwa config
- **Offline queue** (`src/lib/pwa/offline-queue.ts`) uses IndexedDB via `idb` — never use localStorage for offline actions

---

## Usage Guidelines

**For AI Agents:**
- Read this file before implementing any code in this project
- Follow ALL rules exactly as documented
- When in doubt, prefer the more restrictive option
- Update this file if new patterns emerge during implementation

**For Humans:**
- Keep this file lean and focused on agent needs
- Update when technology stack changes
- Review periodically for outdated rules
- Remove rules that become obvious over time

Last Updated: 2026-02-18
