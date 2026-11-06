# CDI Project Directives & Workflow Rules

This file establishes strict project invariants and workflow guidelines for any AI agent working on the **CDI (Creative Digital Innovation)** platform.

Full detailed specification can be found in [`docs/WORKFLOW_SPECIFICATION.md`](docs/WORKFLOW_SPECIFICATION.md).

---

## 1. Technology Stack
- **Backend / API**: Cloudflare Workers with TypeScript & Hono router (`src/worker/`).
- **Database**: Cloudflare D1 SQL (`env.DB`, `cdi-db`).
- **Frontend**: React 18, Vite, Tailwind CSS, DaisyUI, Lucide icons (`src/pages/`, `src/components/`).
- **Storage**: Cloudflare R2 bucket (`env.R2`, `cdi-media`).
- **Deployment**: `npm run build && npx wrangler deploy`.

---

## 2. Critical Workflow Invariants (DO NOT VIOLATE)

### Rule 1: Multi-Unit Parallel Execution (`#MU...`)
- In Multi-Unit jobs, multiple units work concurrently.
- If a unit has been approved by its department manager and assigned by its head of unit, **that unit's assigned staff MUST be able to work immediately**.
- Assigned staff must **never** be blocked with an "Awaiting Manager Approval" screen simply because another unit's manager hasn't approved yet.
- Assigned staff must see the active work notice and the `MARK MY PART AS DONE` button.

### Rule 2: Multi-Unit Safe Completion
- In `/api/job-requests/:id/mark-done`, marking an individual staff's part as done must **never prematurely mark the entire job request as `completed`** if:
  1. The overall request is still in `manager_approval`.
  2. Any participating unit in `additional_data.unit_assignments` is still unapproved or has no assigned staff.
  3. Other assigned staff have not completed their parts yet.

### Rule 3: Unit Head Assignment State
- Once a Head of Unit has assigned staff to their unit (unit status is `accepted` or `assigned_staff_ids.length > 0`):
  - **Never** render the primary green `ASSIGN STAFF TEAM` button or red `REJECT REQUEST` button again.
  - Render the confirmation card: `[UNIT] TEAM ASSIGNED` [Active] with the secondary button `MANAGE [UNIT] TEAM`.

### Rule 4: Staff Dashboard Privacy & Scoping
- Regular staff members (who are not Unit Heads) must **only** see jobs on their personal dashboard if their user ID is explicitly present in `assigned_staff_ids`.
- Tickets pending manager approval or pending unit head assignment must **never** clutter unassigned staff dashboards.

---

## 3. Pre-Commit / Pre-Deploy Checklist
Whenever modifying any workflow code in `src/worker/routes/jobRequests.ts`, `src/pages/JobRequestDetail.tsx`, or `src/pages/JobRequestsList.tsx`:
1. Check that Single-Unit, Multi-Unit, and Inter-Unit paths are preserved.
2. Check that unit heads who assigned their team see `MANAGE TEAM`, not `ASSIGN STAFF TEAM`.
3. Check that assigned staff can finalize their work independently in parallel.
4. Run `npm run build` and ensure 0 TypeScript errors before committing and deploying.
