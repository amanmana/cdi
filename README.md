# CDI (Creative Digital Innovation) - Project Management Platform

A high-performance creative job request and collaborative workflow management system built on **Cloudflare Workers, D1 Database, R2 Storage, and React (Vite + Tailwind CSS + DaisyUI)**.

---

## 📖 Specifications & Workflow Directives
- **Workflow & Lifecycle Specification**: [`docs/WORKFLOW_SPECIFICATION.md`](docs/WORKFLOW_SPECIFICATION.md) — The single source of truth for all job request lifecycles, permission matrices, multi-unit execution rules, and regression test cases.
- **Agent Rules & Development Guidelines**: [`GEMINI.md`](GEMINI.md) — Directives for AI coding pair programming to maintain architectural invariants.

---

## 🛠️ Tech Stack
- **Frontend**: React 18, Vite, Tailwind CSS, DaisyUI, Lucide React icons
- **Backend / API**: Cloudflare Workers (TypeScript) with Hono framework
- **Database**: Cloudflare D1 (SQLite-compatible serverless database)
- **Object Storage**: Cloudflare R2
- **Deployment**: Cloudflare Workers Assets + Functions

---

## 🚀 Development & Deployment

### Local Development
```bash
# Install dependencies
npm install

# Build frontend
npm run build

# Run local preview with wrangler
npx wrangler dev
```

### Production Deployment
```bash
# Build production bundle
npm run build

# Deploy to Cloudflare Workers
npx wrangler deploy
```

---

## 🔐 Core Workflow Modules
- `src/worker/routes/jobRequests.ts`: Core backend API routing, approval transitions, team assignments, and task completion.
- `src/pages/JobRequestDetail.tsx`: Ticket detail views, dynamic approval/action buttons based on role and unit status.
- `src/pages/JobRequestsList.tsx`: Role-scoped dashboards and filterable job request tables.
- `src/pages/UnitWorkspacePage.tsx`: Unit workspace whiteboard and agile collaboration tools.
