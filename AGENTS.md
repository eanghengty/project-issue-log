# AGENTS.md

## Project Purpose
Issue Log Tracker is a local-first React SPA for tracking issues across projects, owners, and customers. v1 is browser-only (IndexedDB), with issue lifecycle management, comments, activity history, attachments, in-app notifications, and JSON export/import for backup and migration between machines.

## Tech Stack + Architecture Rules
- Stack: Vite, React, TypeScript, Tailwind CSS, Dexie, dexie-react-hooks, Recharts, lucide-react, date-fns.
- Read pattern: UI/pages use hooks/live queries for reads.
- Write pattern: all issue/comment/attachment writes must go through `src/db/repository.ts`.
- Do: keep domain logic in repository/lib modules.
- Do not: perform direct Dexie write calls in components/pages.
- Do not: bypass activity/notification side effects when changing issue flows.

## Current Product Rules (Do Not Regress)
- Project-to-owner/customer linking is managed in `Projects` page via the Assignments panel (project-centric UX).
- `Owners` and `Customers` pages are profile-management pages; do not reintroduce editable project-link checklists there.
- Issue modal owner/customer options are strictly scoped to the selected project links.
- Edit Issue modal comment actor must be chosen from project-linked participants (grouped `Owners` and `Customers`), not free text defaults.
- Issue comments are displayed in chronological order (oldest to newest).

## Run and Test Commands
- Install: `npm install`
- Dev server: `npm run dev`
- Production build: `npm run build`
- Lint: `npm run lint`
- Production preview: `npm run preview`
- Dev URL: `http://localhost:5180`

## Coding Standards for Agents
- Use TypeScript-first changes with explicit, safe types.
- Keep edits small, targeted, and scoped to the request.
- Reuse existing UI patterns in `components/common`, `components/layout`, `components/issues`, and `pages`.
- Preserve notification popup UX invariants:
  - anchored dropdown behavior near the bell,
  - viewport-safe clamped positioning (must remain readable on small screens),
  - dismiss support via outside click and `Escape`.
- Do not introduce broad refactors unless explicitly requested.

## Change Workflow
- Inspect current implementation before editing.
- Implement the minimum change that satisfies the request.
- Run `npm run build` after meaningful code changes.
- Handoff must include a short verification checklist and any limitations/skipped checks.

## Safety and Scope Constraints
- Do not assume or add a backend/API unless explicitly requested.
- Do not assume or add authentication/login unless explicitly requested.
- Preserve the local-only IndexedDB model and JSON backup/import behavior unless scope is explicitly changed.
- `AGENTS.md` is the primary agent operating guide for this repository.
