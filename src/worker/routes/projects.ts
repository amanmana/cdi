import { Hono } from 'hono';
import { D1Database } from '@cloudflare/workers-types';
import { AuthUser, verifyToken } from '../auth';

type Env = {
  Bindings: {
    DB: D1Database;
  };
  Variables: {
    user: AuthUser;
  };
};

const projectsRouter = new Hono<Env>();

projectsRouter.use('*', async (c, next) => {
  const authHeader = c.req.header('Authorization');
  const token = authHeader ? authHeader.replace('Bearer ', '') : null;
  if (!token) return c.json({ error: 'Unauthorized' }, 401);

  const payload = await verifyToken(token);
  if (!payload) return c.json({ error: 'Session expired' }, 401);

  c.set('user', payload);
  await next();
});

// GET /api/projects - List all mega projects with live progress & unit stats
projectsRouter.get('/', async (c) => {
  const db = c.env.DB;

  try {
    const { results: projectRows } = await db
      .prepare(
        `SELECT p.*, u.name as creator_name, u.role as creator_role
         FROM projects p
         LEFT JOIN users u ON p.created_by_user_id = u.id
         ORDER BY p.created_at DESC`
      )
      .all<any>();

    // Fetch all job requests linked to any project
    const { results: jobRows } = await db
      .prepare(
        `SELECT id, ticket_no, title, unit, unit_id, status, project_id, deadline, created_at
         FROM job_requests
         WHERE project_id IS NOT NULL`
      )
      .all<any>();

    // Fetch all active units for name lookup
    const { results: unitRows } = await db
      .prepare(`SELECT id, name FROM units`)
      .all<{ id: number; name: string }>();
    const unitMap = new Map(unitRows?.map(u => [u.id, u.name]));

    const projectsWithProgress = (projectRows || []).map((p) => {
      const linkedJobs = (jobRows || []).filter((j) => j.project_id === p.id);
      const totalJobs = linkedJobs.length;
      const completedJobs = linkedJobs.filter((j) => j.status === 'completed').length;
      const inProgressJobs = linkedJobs.filter((j) => j.status === 'staff_processing').length;
      const pendingJobs = linkedJobs.filter((j) => j.status === 'manager_approval' || j.status === 'on_hold').length;

      // Calculate progress percentage based on completed jobs ratio
      let progressPercent = 0;
      if (totalJobs > 0) {
        progressPercent = Math.round((completedJobs / totalJobs) * 100);
      }

      // Parse assigned unit ids
      let assignedUnitIds: number[] = [];
      try {
        if (p.assigned_unit_ids) {
          assignedUnitIds = JSON.parse(p.assigned_unit_ids);
        }
      } catch {
        assignedUnitIds = [];
      }

      const assignedUnits = assignedUnitIds.map((uid) => ({
        id: uid,
        name: unitMap.get(uid) || `Unit #${uid}`,
        has_task: linkedJobs.some((j) => j.unit_id === uid),
        is_completed: linkedJobs.some((j) => j.unit_id === uid && j.status === 'completed'),
      }));

      return {
        ...p,
        total_jobs: totalJobs,
        completed_jobs: completedJobs,
        in_progress_jobs: inProgressJobs,
        pending_jobs: pendingJobs,
        progress_percent: progressPercent,
        assigned_units: assignedUnits,
        jobs: linkedJobs,
      };
    });

    return c.json({
      success: true,
      projects: projectsWithProgress,
    });
  } catch (err: any) {
    console.error('Error fetching projects:', err);
    return c.json({ error: err.message || 'Failed to fetch projects.' }, 500);
  }
});

// GET /api/projects/:id - Detailed project info with all associated jobs & timeline
projectsRouter.get('/:id', async (c) => {
  const db = c.env.DB;
  const id = Number(c.req.param('id'));

  try {
    const project = await db
      .prepare(
        `SELECT p.*, u.name as creator_name, u.role as creator_role, u.email as creator_email
         FROM projects p
         LEFT JOIN users u ON p.created_by_user_id = u.id
         WHERE p.id = ?`
      )
      .bind(id)
      .first<any>();

    if (!project) {
      return c.json({ error: 'Project not found.' }, 404);
    }

    const { results: linkedJobs } = await db
      .prepare(
        `SELECT j.*, 
                d.name as department_name
         FROM job_requests j
         LEFT JOIN departments d ON j.department_id = d.id
         WHERE j.project_id = ?
         ORDER BY j.created_at DESC`
      )
      .bind(id)
      .all<any>();

    const totalJobs = (linkedJobs || []).length;
    const completedJobs = (linkedJobs || []).filter((j) => j.status === 'completed').length;
    const progressPercent = totalJobs > 0 ? Math.round((completedJobs / totalJobs) * 100) : 0;

    let assignedUnitIds: number[] = [];
    try {
      if (project.assigned_unit_ids) {
        assignedUnitIds = JSON.parse(project.assigned_unit_ids);
      }
    } catch {
      assignedUnitIds = [];
    }

    const { results: unitRows } = await db.prepare(`SELECT id, name FROM units`).all<any>();
    const unitMap = new Map(unitRows?.map((u) => [u.id, u.name]));

    const unitBreakdown = assignedUnitIds.map((uid) => {
      const unitJobs = (linkedJobs || []).filter((j) => j.unit_id === uid);
      const isDone = unitJobs.length > 0 && unitJobs.every((j) => j.status === 'completed');
      return {
        unit_id: uid,
        unit_name: unitMap.get(uid) || `Unit #${uid}`,
        total_tasks: unitJobs.length,
        completed_tasks: unitJobs.filter((j) => j.status === 'completed').length,
        is_done: isDone,
        jobs: unitJobs,
      };
    });

    return c.json({
      success: true,
      project: {
        ...project,
        total_jobs: totalJobs,
        completed_jobs: completedJobs,
        progress_percent: progressPercent,
        unit_breakdown: unitBreakdown,
        jobs: linkedJobs || [],
      },
    });
  } catch (err: any) {
    console.error('Error fetching project detail:', err);
    return c.json({ error: err.message || 'Failed to fetch project detail.' }, 500);
  }
});

// POST /api/projects - Create a new mega project and automatically initialize unit jobs
projectsRouter.post('/', async (c) => {
  const db = c.env.DB;
  const user = c.get('user');

  // Allow director and admin to create mega projects
  if (user.role !== 'director' && user.role !== 'admin') {
    return c.json({ error: 'Only Director or Admin can create Mega Projects.' }, 403);
  }

  try {
    const { code, title, description, start_date, target_deadline, unit_ids } = await c.req.json();

    if (!code || !code.trim()) {
      return c.json({ error: 'Project code (e.g. MTP2026) is required.' }, 400);
    }
    if (!title || !title.trim()) {
      return c.json({ error: 'Project title is required.' }, 400);
    }

    const cleanCode = code.trim().toUpperCase().replace(/[^A-Z0-9_-]/g, '');

    // Check duplicate code
    const existing = await db
      .prepare('SELECT id FROM projects WHERE code = ?')
      .bind(cleanCode)
      .first<{ id: number }>();
    if (existing) {
      return c.json({ error: `Project code "${cleanCode}" is already in use. Please use a unique code.` }, 400);
    }

    const unitIdsArr: number[] = Array.isArray(unit_ids) ? unit_ids.map(Number) : [];
    const assignedJson = JSON.stringify(unitIdsArr);

    // Insert Project
    const projectRes = await db
      .prepare(
        `INSERT INTO projects (code, title, description, created_by_user_id, status, start_date, target_deadline, assigned_unit_ids, created_at, updated_at)
         VALUES (?, ?, ?, ?, 'active', ?, ?, ?, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)`
      )
      .bind(
        cleanCode,
        title.trim(),
        description?.trim() || null,
        user.id,
        start_date || new Date().toISOString().split('T')[0],
        target_deadline || null,
        assignedJson
      )
      .run();

    const projectId = projectRes.meta.last_row_id as number;

    // Automatically spawn initial job request for each selected unit
    if (unitIdsArr.length > 0) {
      const { results: units } = await db
        .prepare(`SELECT id, name, department_id FROM units WHERE id IN (${unitIdsArr.map(() => '?').join(',')})`)
        .bind(...unitIdsArr)
        .all<{ id: number; name: string; department_id: number | null }>();

      for (const unit of units || []) {
        const randNum = Math.floor(100000 + Math.random() * 900000);
        const ticketNo = `PR-${cleanCode}-${randNum}`;

        const jobRes = await db
          .prepare(
            `INSERT INTO job_requests (ticket_no, client_name, client_email, title, description, unit, unit_id, department_id, status, current_step_name, start_date, deadline, project_id, created_at, updated_at)
             VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'staff_processing', 'Staff Processing', ?, ?, ?, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)`
          )
          .bind(
            ticketNo,
            `Mega Project (${cleanCode})`,
            user.email,
            `[${cleanCode}] ${title.trim()} — ${unit.name} Deliverables`,
            `Direct Mega Project assignment initiated by Director ${user.name}.\n\nScope of Work:\n${description?.trim() || 'Please assign unit team members and deliver required tasks.'}`,
            unit.name,
            unit.id,
            unit.department_id,
            start_date || new Date().toISOString().split('T')[0],
            target_deadline || null,
            projectId
          )
          .run();

        const jobId = jobRes.meta.last_row_id as number;

        // Log to workflow_logs
        await db
          .prepare(
            `INSERT INTO workflow_logs (job_request_id, action, actor_id, actor_name, from_step_name, to_step_name, comment)
             VALUES (?, 'PROJECT_DELEGATED', ?, ?, 'Director Initiative', 'Staff Processing', ?)`
          )
          .bind(
            jobId,
            user.id,
            user.name,
            `Director ${user.name} created Mega Project "${cleanCode}" and assigned to unit ${unit.name}`
          )
          .run();
      }
    }

    return c.json({
      success: true,
      message: `Mega Project "${cleanCode}" created with ${unitIdsArr.length} unit assignments.`,
      project_id: projectId,
    });
  } catch (err: any) {
    console.error('Error creating project:', err);
    return c.json({ error: err.message || 'Failed to create project.' }, 500);
  }
});

// PUT /api/projects/:id/status - Update project status & status note (Director, Admin, Manager)
projectsRouter.put('/:id/status', async (c) => {
  const db = c.env.DB;
  const user = c.get('user');
  const id = Number(c.req.param('id'));

  // Only Director, Admin, or Manager can update status
  if (user.role !== 'director' && user.role !== 'admin' && user.role !== 'manager' && !user.is_acting_manager) {
    return c.json({ error: 'Permission denied. Only Director, Admin, or Managers can change project status.' }, 403);
  }

  try {
    const { status, status_note } = await c.req.json();

    const allowedStatuses = ['active', 'pending', 'completed', 'on_hold', 'cancelled'];
    if (!status || !allowedStatuses.includes(status)) {
      return c.json({ error: `Invalid status. Allowed values: ${allowedStatuses.join(', ')}` }, 400);
    }

    await db
      .prepare(
        `UPDATE projects 
         SET status = ?, status_note = ?, updated_at = CURRENT_TIMESTAMP
         WHERE id = ?`
      )
      .bind(status, status_note?.trim() || null, id)
      .run();

    return c.json({
      success: true,
      message: `Project status successfully updated to "${status}".`,
    });
  } catch (err: any) {
    console.error('Error updating project status:', err);
    return c.json({ error: err.message || 'Failed to update project status.' }, 500);
  }
});

// PUT /api/projects/:id - Edit project metadata (Director, Admin)
projectsRouter.put('/:id', async (c) => {
  const db = c.env.DB;
  const user = c.get('user');
  const id = Number(c.req.param('id'));

  if (user.role !== 'director' && user.role !== 'admin') {
    return c.json({ error: 'Permission denied. Only Director or Admin can edit Mega Project details.' }, 403);
  }

  try {
    const { title, description, start_date, target_deadline, unit_ids, status, status_note } = await c.req.json();

    if (!title || !title.trim()) {
      return c.json({ error: 'Project title is required.' }, 400);
    }

    const assignedJson = Array.isArray(unit_ids) ? JSON.stringify(unit_ids.map(Number)) : undefined;

    let updateQuery = `
      UPDATE projects 
      SET title = ?, 
          description = ?, 
          start_date = ?, 
          target_deadline = ?,
          status = COALESCE(?, status),
          status_note = COALESCE(?, status_note),
          updated_at = CURRENT_TIMESTAMP
    `;
    const bindParams: any[] = [
      title.trim(),
      description?.trim() || null,
      start_date || null,
      target_deadline || null,
      status || null,
      status_note !== undefined ? status_note : null,
    ];

    if (assignedJson !== undefined) {
      updateQuery += `, assigned_unit_ids = ?`;
      bindParams.push(assignedJson);
    }

    updateQuery += ` WHERE id = ?`;
    bindParams.push(id);

    await db.prepare(updateQuery).bind(...bindParams).run();

    return c.json({
      success: true,
      message: 'Project details updated successfully.',
    });
  } catch (err: any) {
    console.error('Error editing project:', err);
    return c.json({ error: err.message || 'Failed to edit project.' }, 500);
  }
});

// DELETE /api/projects/:id - Delete project
projectsRouter.delete('/:id', async (c) => {
  const db = c.env.DB;
  const user = c.get('user');
  const id = Number(c.req.param('id'));

  if (user.role !== 'director' && user.role !== 'admin') {
    return c.json({ error: 'Permission denied. Only Director or Admin can delete Mega Projects.' }, 403);
  }

  try {
    // Unlink any jobs before deleting project
    await db.prepare('UPDATE job_requests SET project_id = NULL WHERE project_id = ?').bind(id).run();
    await db.prepare('DELETE FROM projects WHERE id = ?').bind(id).run();

    return c.json({
      success: true,
      message: 'Project deleted successfully.',
    });
  } catch (err: any) {
    console.error('Error deleting project:', err);
    return c.json({ error: err.message || 'Failed to delete project.' }, 500);
  }
});

export default projectsRouter;
