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

### Rule 5: Per-Unit Routing Target & Direct to Head Unit Invariant
- In Multi-Unit jobs, individual participating units can be routed differently:
  - If a unit has `routing_target: 'head_unit'`, it **bypasses Department Manager review** and goes directly to that unit's Head of Unit for assignment.
  - The approver display name on unit badges and headers **MUST** show the Head of Unit's name (e.g. `Laurence`), **NEVER** the Department Manager's name (e.g. `Faizal`), when the unit is routed direct to head unit.

### Rule 6: Contextual Multi-Unit Dashboard Badges
- In Multi-Unit tickets that are globally in `manager_approval`:
  - Assigned staff whose unit is already approved/active (e.g. Zainal) must see `STAFF PROCESSING` (purple), not a blanket `MANAGER APPROVAL`.
  - Unit Heads who have assigned their team (e.g. Lau) must see `TEAM ASSIGNED` (teal).
  - General / Admin / Manager views with mixed unit statuses must see `PARTIAL APPROVAL` (amber) if some units are ready and others are pending secondary manager approval.

### Rule 7: Multi-Unit Master Status Controls & Completion Safeguards
- In Multi-Unit jobs, Department Managers must **NEVER** have a master `MARK PROJECT COMPLETED` button. Master completion is achieved automatically when all assigned unit staff finalize their parts.
- Manual force completion of an entire Multi-Unit project is strictly restricted to **Admin / Director** (`FORCE COMPLETE (ADMIN OVERRIDE)`), which requires a mandatory justification comment and displays a warning dialog showing pending tasks and staff.
- Backend endpoints `POST /api/job-requests/:id/complete` and `POST /api/job-requests/:id/change-status` enforce strict role authorization (returning 403 if a department manager attempts to force-complete a multi-unit project).
### Rule 8: Direct to Staff Entry Routing & Multi-Staff Assignment (`routing_target: 'staff'`)
- When a Custom Service or Unit is configured with `routing_target: 'staff'`:
  - **Multi-Staff Selection Support**: Admin can select multiple specialist staff (e.g. Akmal & Abe Srox) via checkboxes in `UnitsManagement.tsx`. The database stores comma-separated IDs (`'11,21'`) and names.
  - **Direct Entry Invariant**: Client submission immediately bypasses Manager Review and Unit Head assignment. Initial status is `staff_processing`, step is `Staff Processing`, unit status is `accepted`, and individual tasks are created in `job_tasks`.
  - **Auto-Assignment Failsafe**: If `routing_target: 'staff'` is active but no specific staff was checked, backend MUST NOT regress to `manager_approval`. It automatically assigns ALL active unit staff into `assigned_staff_ids` and sets status directly to `staff_processing`.

---

## 3. Pre-Commit / Pre-Deploy Checklist
Whenever modifying any workflow code in `src/worker/routes/jobRequests.ts`, `src/pages/JobRequestDetail.tsx`, or `src/pages/JobRequestsList.tsx`:
1. Check that Single-Unit, Multi-Unit, and Inter-Unit paths are preserved.
2. Check that unit heads who assigned their team see `MANAGE TEAM`, not `ASSIGN STAFF TEAM`.
3. Check that assigned staff can finalize their work independently in parallel.
4. Check that units with `routing_target: 'head_unit'` attribute their approval to the Unit Head, not the Manager.
5. Check that dashboard status badges reflect the viewing user's active role context.
6. Check that Multi-Unit master completion is restricted to Admin/Director and Department Managers cannot prematurely complete multi-unit projects.
7. Check that Custom Services with `routing_target: 'staff'` route directly to staff with `staff_processing` and multi-staff assignment.
8. Run `npm run build` and ensure 0 TypeScript errors before committing and deploying.
