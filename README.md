# Intently

Personal kanban and daily planning app — sprints, epics, and a day calendar, all in your browser. No backend, no login: everything lives in localStorage.

Built with Nuxt 4 (SSR off) and shadcn-vue.

## Features

- **Home** — kanban for the next 4 days plus a today calendar (00:00–23:59); drag a task onto the calendar to schedule when you'll work on it.
- **Tasks** — list view grouped by sprint, and a status kanban (Backlog, Todo, In Progress, Done, Canceled).
- **Sprints** — active / future / archived; archived sprints show daily productivity (bar chart), time spent per epic (donut chart), and a day-by-day kanban of the sprint.
- **Epics** — Gantt view with priority, due date, and color.
- **Keyboard & mouse** — Escape closes dialogs, right-click a task for actions, drag and drop everywhere.

## Stack

- [Nuxt 4](https://nuxt.com) — `ssr: false`, client-only SPA
- [shadcn-vue](https://www.shadcn-vue.com) via `shadcn-nuxt` (components in `app/components/ui`)
- [Tailwind CSS 4](https://tailwindcss.com)
- [Chart.js](https://www.chartjs.org) + vue-chartjs for sprint charts

## Deploy

No database and no server code, so the app can be hosted as plain static files: `npm run generate` outputs the site to `.output/public` — drop it on any static host (Netlify, Cloudflare Pages, GitHub Pages, S3). `npm run build` + node server also works but is unnecessary.

## Data

All state is persisted to localStorage (`intently.*` keys) — clearing browser data resets the app. See [app/composables/useStore.ts](app/composables/useStore.ts).
