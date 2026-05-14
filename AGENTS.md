# AGENTS.md

## Project Purpose
Issue Log Tracker is a local-first React single-page application for managing project issues across multiple projects, owners, and customers. Version 1 stores all data in browser IndexedDB (no backend), supports issue lifecycle tracking, comments, activity history, attachments, in-app notifications, and JSON export/import for backup and machine-to-machine data transfer.

## Tech Stack + Architecture Rules
- Frontend stack: Vite + React + TypeScript + Tailwind CSS.
- Data layer: Dexie + dexie-react-hooks on IndexedDB.
- Charts/icons/date utilities: Recharts, lucide-react, date-fns.
- Architecture rule: UI components and pages read with live queries/hooks but do not perform direct Dexie writes.
- All writes must go through the repository layer (`src/db/repository.ts`) so issue changes always preserve activity/audit entries and notification behavior.
- Keep business logic in repository/lib modules; keep components focused on rendering and user interaction.

## Run and Test Commands
- Install deps: `npm install`
- Run dev server: `npm run dev`
- Build production bundle: `npm run build`
- Run lint: `npm run lint`
- Preview production build: `npm run preview`
- Dev URL: `http://localhost:5180`

## Coding Standards for Agents
- Use TypeScript-first changes with explicit, safe types.
- Do not add direct database writes in components/pages; route writes through repository methods.
- Preserve audit trail and notification side effects when changing issue/comment/attachment flows.
- Maintain existing UI patterns and reusable component structure across `components/common`, `components/layout`, `components/issues`, and `pages`.
- Keep changes minimal and targeted; avoid unrelated refactors.

## Change Workflow
- Inspect existing implementation before editing.
- Implement the smallest change that satisfies the request.
- After meaningful code changes, run `npm run build` to validate TypeScript + bundling.
- In handoff notes, include a short verification checklist and mention any limitations or skipped checks.

## Safety and Scope Constraints
- Do not assume or introduce a backend/API unless explicitly requested.
- Do not assume or introduce authentication/login flows unless explicitly requested.
- Preserve the local-only IndexedDB model and JSON backup/import behavior unless a request explicitly changes that scope.
- Treat this file as the primary agent operating guide for this repository.
