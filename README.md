# HelpDesk Pro

IT Support Ticketing and Asset Management System.

> 🚧 Work in progress — full documentation, screenshots, and setup guide coming soon.

## Tech stack

- React, TypeScript, Vite, Tailwind CSS
- Supabase (PostgreSQL, Authentication, Row Level Security)
- Vitest + React Testing Library (unit and component tests)
- Playwright (end-to-end tests)

## Roles

| Role | Can do |
|---|---|
| Employee | Submit tickets, view own tickets and assigned assets |
| IT Staff | Manage all tickets and assets |
| Admin | Everything above, plus manage user roles and delete records |

## Run locally

```bash
npm install
cp .env.example .env.local   # then fill in your Supabase URL and publishable key
npm run dev
```

## Scripts

| Command | What it does |
|---|---|
| `npm run dev` | Start the dev server |
| `npm test` | Run unit and component tests |
| `npm run test:e2e` | Run Playwright end-to-end tests |
| `npm run typecheck` | Check TypeScript types |
| `npm run lint` | Lint the code |
| `npm run build` | Production build |
