# Test Plan — HelpDesk Pro

| | |
|---|---|
| **Version** | 0.1 (draft — updated weekly) |
| **Author** | Reniel Perez |
| **Last updated** | 2026-10-27 |

## 1. Purpose

Describe how HelpDesk Pro is tested: what is covered, which kinds of tests are used,
and when the product is considered ready to release.

## 2. Scope

### In scope

| Area | Key risks to test |
|---|---|
| Authentication | Invalid logins, session persistence after refresh, sign-out |
| Authorization (roles) | Users accessing data or actions outside their role |
| Tickets | Create, assign, status lifecycle, validation, notes |
| Search & filters | Correct results, empty results, combined filters |
| Dashboard | Counts match the underlying data for each role |
| Assets | Create, edit, assign, unique tag/serial, employee visibility |

### Out of scope

- Performance and load testing
- Email notifications, file attachments (not built in the MVP)
- Browsers other than Chromium (may be added later)
- Supabase's own platform (we trust its authentication service)

## 3. Test levels and tools

| Level | What it checks | Tool | Location | Runs |
|---|---|---|---|---|
| **Unit** | Pure functions (validation, filters, formatting) | Vitest | `src/**/*.test.ts` | `npm test`, CI |
| **Component** | A single screen behaves correctly for each role | Vitest + React Testing Library | `src/**/*.test.tsx` | `npm test`, CI |
| **Security (RLS)** | The database blocks actions outside each role | Vitest + Supabase client | `tests/rls/` | `npm run test:rls` (manual) |
| **End-to-end** | Full user journeys in a real browser | Playwright | `e2e/` | `npm run test:e2e` (Week 4) |
| **Manual / exploratory** | Usability, layout, edge cases not yet automated | Browser | `docs/test-cases.md` (from Week 2) | Before each release |

Why RLS tests are not in CI: they run against the real Supabase project and need the
demo account passwords. Keeping them manual avoids storing passwords in GitHub for now.

## 4. Test environment

| Item | Value |
|---|---|
| Frontend | Local dev server (`npm run dev`) on Chromium |
| Backend | Supabase cloud project (free tier) |
| Test accounts | `admin@helpdesk.test`, `staff@helpdesk.test`, `employee@helpdesk.test` |
| Test data | Created and deleted by the tests themselves (prefixed `[RLS <id>]`) |

## 5. Entry and exit criteria

**Testing starts when** a feature is merged to `main` and CI is green.

**A release is ready when:**
- All automated tests pass (unit, component, RLS, E2E)
- Every row of the [permission matrix](permission-matrix.md) has a passing RLS test
- No open **Critical** or **High** severity bugs
- Manual test cases for the release have been executed and results recorded

## 6. Defect management

Bugs are written up in [`docs/bug-reports/`](bug-reports/) using this severity scale:

| Severity | Meaning | Example |
|---|---|---|
| **Critical** | Security hole or data loss | Employee can read another employee's tickets |
| **High** | Core feature broken, no workaround | Cannot create a ticket |
| **Medium** | Feature broken, workaround exists | Filter ignores priority, but search still works |
| **Low** | Cosmetic or minor | Misaligned button on mobile |

## 7. Current status

| Area | Automated tests | Status |
|---|---|---|
| Login form validation | 10 unit + 5 component | ✅ Passing |
| Route protection | 6 component | ✅ Passing |
| Role-based navigation | 5 component | ✅ Passing |
| RLS / permissions | 32 security tests | ✅ Passing |
| Ticket validation | 14 unit | ✅ Passing |
| Tickets UI (list, create, detail, notes) | 20 component + [38 manual cases](test-cases.md) | ✅ Automated passing · ⏳ Manual run pending |
| Assets, search, dashboard | — | Week 3 |
| End-to-end journeys | — | Week 4 |
