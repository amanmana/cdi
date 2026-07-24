import { Hono } from 'hono';
import { AuthUser, verifyToken } from '../auth';
import { WorkflowEngine } from '../services/workflow';

type Env = {
  Bindings: {
    DB: D1Database;
  };
  Variables: {
    user: AuthUser;
  };
};

export const jobRequestsRouter = new Hono<Env>();

// Middleware to verify authentication token
jobRequestsRouter.use('*', async (c, next) => {
  const authHeader = c.req.header('Authorization');
  const token = authHeader ? authHeader.replace('Bearer ', '') : null;
  if (!token) return c.json({ error: 'Unauthorized' }, 401);

  const user = await verifyToken(token);
  if (!user) return c.json({ error: 'Session expired' }, 401);

  c.set('user', user);
  await next();
});

// Helper to find job request by ID or ticket_no
async function findJobRequest(db: D1Database, param: string) {
  const numId = parseInt(param, 10);
  if (!isNaN(numId)) {
    const req = await db.prepare('SELECT * FROM job_requests WHERE id = ? OR ticket_no = ?').bind(numId, param).first<any>();
    if (req) return req;
  }
  return await db.prepare('SELECT * FROM job_requests WHERE ticket_no = ? OR CAST(id AS TEXT) = ?').bind(param, param).first<any>();
}

// GET /api/job-requests - List all job requests (Filtered by user role & unit)
jobRequestsRouter.get('/', async (c) => {
  const db = c.env.DB;
  const user = c.get('user');
  const search = c.req.query('search');

  let query = `
    SELECT j.*, 
           (SELECT GROUP_CONCAT(name, ', ') FROM users WHERE INSTR(',' || j.assigned_staff_ids || ',', ',' || id || ',') > 0) as assigned_staff_name
    FROM job_requests j
    WHERE 1=1
  `;
  const params: any[] = [];

  // Role Scoping
  if (user && user.role === 'staff') {
    query += ` AND INSTR(',' || j.assigned_staff_ids || ',', ',' || ? || ',') > 0 AND j.status != 'manager_approval'`;
    params.push(String(user.id));
  } else if (user && user.role === 'client') {
    query += ` AND j.client_email = ?`;
    params.push(user.email);
  }

  if (search) {
    query += ` AND (j.ticket_no LIKE ? OR j.title LIKE ? OR j.client_name LIKE ?)`;
    params.push(`%${search}%`, `%${search}%`, `%${search}%`);
  }

  query += ` ORDER BY j.created_at DESC`;

  const { results } = await db.prepare(query).bind(...params).all();

  // Attach completion stats for assigned staff / tasks
  const enriched = await Promise.all(
    (results || []).map(async (row: any) => {
      const taskStats = await db.prepare(`
        SELECT COUNT(*) as total_tasks,
               SUM(CASE WHEN status = 'completed' THEN 1 ELSE 0 END) as completed_tasks
        FROM job_tasks WHERE job_request_id = ?
      `).bind(row.id).first<any>();

      const totalStaff = row.assigned_staff_ids ? row.assigned_staff_ids.split(',').length : 0;
      return {
        ...row,
        total_staff: taskStats?.total_tasks || totalStaff,
        completed_staff: taskStats?.completed_tasks || 0,
        additional_data: row.additional_data ? JSON.parse(row.additional_data) : null,
      };
    })
  );

  return c.json(enriched);
});

// GET /api/job-requests/staff/my-tasks - List tasks assigned to the current logged-in user
jobRequestsRouter.get('/staff/my-tasks', async (c) => {
  const db = c.env.DB;
  const user = c.get('user');

  const { results } = await db.prepare(`
    SELECT t.*, j.ticket_no, j.title as job_title, j.unit as job_unit, b.name as assigned_by_name
    FROM job_tasks t
    JOIN job_requests j ON t.job_request_id = j.id
    JOIN users b ON t.assigned_by_user_id = b.id
    WHERE t.assigned_to_user_id = ?
    ORDER BY t.created_at DESC
  `).bind(user.id).all();

  return c.json(results || []);
});

// PUT /api/job-requests/tasks/:taskId/status - Update sub-task status
jobRequestsRouter.put('/tasks/:taskId/status', async (c) => {
  const db = c.env.DB;
  const user = c.get('user');
  const taskId = c.req.param('taskId');
  const { status } = await c.req.json();

  if (!['pending', 'in_progress', 'completed'].includes(status)) {
    return c.json({ error: 'Invalid status.' }, 400);
  }

  const completedAt = status === 'completed' ? new Date().toISOString() : null;

  await db.prepare(`
    UPDATE job_tasks SET status = ?, completed_at = ? WHERE id = ?
  `).bind(status, completedAt, taskId).run();

  const task = await db.prepare('SELECT job_request_id, title FROM job_tasks WHERE id = ?').bind(taskId).first<any>();

  if (task) {
    await db.prepare(`
      INSERT INTO workflow_logs (job_request_id, action, actor_id, actor_name, comment)
      VALUES (?, 'TASK_STATUS_UPDATED', ?, ?, ?)
    `).bind(task.job_request_id, user.id, user.name, `Updated task "${task.title}" status to ${status}`).run();
  }

  return c.json({ success: true, message: 'Task status updated.' });
});

// DELETE /api/job-requests/tasks/:taskId - Delete sub-task
jobRequestsRouter.delete('/tasks/:taskId', async (c) => {
  const db = c.env.DB;
  const taskId = c.req.param('taskId');

  await db.prepare('DELETE FROM job_tasks WHERE id = ?').bind(taskId).run();

  return c.json({ success: true, message: 'Task deleted.' });
});

// GET /api/job-requests/:id - Single job request detail
jobRequestsRouter.get('/:id', async (c) => {
  const db = c.env.DB;
  const user = c.get('user');
  const idParam = c.req.param('id');

  const request = await findJobRequest(db, idParam);
  if (!request) {
    return c.json({ error: 'Job request not found' }, 404);
  }

  const realId = request.id;

  // Get assigned staff details
  let staffDetails: any[] = [];
  if (request.assigned_staff_ids) {
    const staffIds = request.assigned_staff_ids.split(',');
    const placeholders = staffIds.map(() => '?').join(',');
    const { results } = await db.prepare(`SELECT id, name, email, role, unit FROM users WHERE id IN (${placeholders})`).bind(...staffIds).all();

    const { results: doneLogs } = await db.prepare(`
      SELECT DISTINCT actor_id FROM workflow_logs 
      WHERE job_request_id = ? AND action = 'STAFF_DONE'
    `).bind(realId).all();

    const doneStaffSet = new Set((doneLogs || []).map((l: any) => Number(l.actor_id)));

    staffDetails = (results || []).map((s: any) => ({
      ...s,
      is_done: doneStaffSet.has(Number(s.id)),
    }));
  }

  // Get sub-tasks list
  const { results: tasks } = await db.prepare(`
    SELECT t.*, u.name as assigned_to_name, b.name as assigned_by_name
    FROM job_tasks t
    JOIN users u ON t.assigned_to_user_id = u.id
    JOIN users b ON t.assigned_by_user_id = b.id
    WHERE t.job_request_id = ?
    ORDER BY t.created_at ASC
  `).bind(realId).all();

  // Get history
  const { results: history } = await db.prepare(
    'SELECT * FROM workflow_logs WHERE job_request_id = ? ORDER BY created_at DESC'
  ).bind(realId).all();

  // Get staff progress reports
  const { results: reports } = await db.prepare(`
    SELECT r.*, u.name as staff_name 
    FROM staff_reports r
    JOIN users u ON r.staff_id = u.id
    WHERE r.job_request_id = ?
    ORDER BY r.created_at DESC
  `).bind(realId).all();

  const canAct = WorkflowEngine.canUserPerformAction(request, user);

  return c.json({
    request: {
      ...request,
      additional_data: request.additional_data ? JSON.parse(request.additional_data) : null,
    },
    staffDetails,
    tasks: tasks || [],
    history: history || [],
    reports: reports || [],
    canAct,
  });
});

// POST /api/job-requests/:id/tasks - Create sub-task assigned to designer/staff
jobRequestsRouter.post('/:id/tasks', async (c) => {
  const db = c.env.DB;
  const user = c.get('user');
  const idParam = c.req.param('id');
  const { title, description, assigned_to_user_id, due_date } = await c.req.json();

  if (!title || !assigned_to_user_id) {
    return c.json({ error: 'Title and assigned staff member are required.' }, 400);
  }

  const request = await findJobRequest(db, idParam);
  if (!request) return c.json({ error: 'Job request not found' }, 404);

  await db.prepare(`
    INSERT INTO job_tasks (job_request_id, title, description, assigned_to_user_id, assigned_by_user_id, status, due_date)
    VALUES (?, ?, ?, ?, ?, 'pending', ?)
  `).bind(request.id, title, description || null, assigned_to_user_id, user.id, due_date || null).run();

  // Log action
  await db.prepare(`
    INSERT INTO workflow_logs (job_request_id, action, actor_id, actor_name, comment)
    VALUES (?, 'TASK_CREATED', ?, ?, ?)
  `).bind(request.id, user.id, user.name, `Created sub-task: "${title}"`).run();

  return c.json({ success: true, message: 'Sub-task created successfully.' });
});

// POST /api/job-requests/:id/approve - Manager approve
jobRequestsRouter.post('/:id/approve', async (c) => {
  const db = c.env.DB;
  const user = c.get('user');
  const idParam = c.req.param('id');
  const { comment } = await c.req.json();

  const request = await findJobRequest(db, idParam);
  if (!request) return c.json({ error: 'Job request not found' }, 404);

  const newStatus = 'staff_processing';
  const newStepName = 'Staff Processing';
  const fromStep = request.current_step_name || 'Manager Review';

  await db.prepare(
    'UPDATE job_requests SET status = ?, current_step_name = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?'
  ).bind(newStatus, newStepName, request.id).run();

  await db.prepare(
    `INSERT INTO workflow_logs (job_request_id, action, actor_id, actor_name, from_step_name, to_step_name, comment)
     VALUES (?, 'APPROVE', ?, ?, ?, ?, ?)`
  ).bind(request.id, user.id, user.name, fromStep, newStepName, comment || 'Approved by Manager').run();

  return c.json({ success: true, message: 'Request approved and moved to Staff Processing.' });
});

// POST /api/job-requests/:id/reject - Manager reject
jobRequestsRouter.post('/:id/reject', async (c) => {
  const db = c.env.DB;
  const user = c.get('user');
  const idParam = c.req.param('id');
  const { comment } = await c.req.json();

  if (!comment) return c.json({ error: 'Rejection reason is required.' }, 400);

  const request = await findJobRequest(db, idParam);
  if (!request) return c.json({ error: 'Job request not found' }, 404);

  const newStatus = 'rejected';
  const newStepName = 'Rejected';
  const fromStep = request.current_step_name || 'Manager Review';

  await db.prepare(
    'UPDATE job_requests SET status = ?, current_step_name = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?'
  ).bind(newStatus, newStepName, request.id).run();

  await db.prepare(
    `INSERT INTO workflow_logs (job_request_id, action, actor_id, actor_name, from_step_name, to_step_name, comment)
     VALUES (?, 'REJECT', ?, ?, ?, ?, ?)`
  ).bind(request.id, user.id, user.name, fromStep, newStepName, comment).run();

  return c.json({ success: true, message: 'Request has been rejected.' });
});

// POST /api/job-requests/:id/complete - Complete job request
jobRequestsRouter.post('/:id/complete', async (c) => {
  const db = c.env.DB;
  const user = c.get('user');
  const idParam = c.req.param('id');
  const { comment } = await c.req.json();

  const request = await findJobRequest(db, idParam);
  if (!request) return c.json({ error: 'Job request not found' }, 404);

  const newStatus = 'completed';
  const newStepName = 'Completed';
  const fromStep = request.current_step_name || 'Staff Processing';

  await db.prepare(
    'UPDATE job_requests SET status = ?, current_step_name = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?'
  ).bind(newStatus, newStepName, request.id).run();

  // Mark all pending sub-tasks as completed
  await db.prepare(
    `UPDATE job_tasks SET status = 'completed' WHERE job_request_id = ? AND status != 'completed'`
  ).bind(request.id).run();

  await db.prepare(
    `INSERT INTO workflow_logs (job_request_id, action, actor_id, actor_name, from_step_name, to_step_name, comment)
     VALUES (?, 'COMPLETE', ?, ?, ?, ?, ?)`
  ).bind(request.id, user.id, user.name, fromStep, newStepName, comment || 'Project completed').run();

  return c.json({ success: true, message: 'Project marked as completed.' });
});

// POST /api/job-requests/:id/update-team - Update assigned staff team
jobRequestsRouter.post('/:id/update-team', async (c) => {
  const db = c.env.DB;
  const user = c.get('user');
  const idParam = c.req.param('id');
  const { staff_ids } = await c.req.json();

  const request = await findJobRequest(db, idParam);
  if (!request) return c.json({ error: 'Job request not found' }, 404);

  const assignedStr = Array.isArray(staff_ids) ? staff_ids.join(',') : '';

  await db.prepare(`
    UPDATE job_requests SET assigned_staff_ids = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?
  `).bind(assignedStr, request.id).run();

  let staffNamesStr = 'None';
  if (Array.isArray(staff_ids) && staff_ids.length > 0) {
    const placeholders = staff_ids.map(() => '?').join(',');
    const { results: staffUsers } = await db.prepare(`
      SELECT name FROM users WHERE id IN (${placeholders})
    `).bind(...staff_ids).all();
    if (staffUsers && staffUsers.length > 0) {
      staffNamesStr = staffUsers.map((u: any) => u.name).join(', ');
    }
  }

  await db.prepare(`
    INSERT INTO workflow_logs (job_request_id, action, actor_id, actor_name, comment)
    VALUES (?, 'UPDATE_TEAM', ?, ?, ?)
  `).bind(request.id, user.id, user.name, `Updated team assignment to: ${staffNamesStr}`).run();

  return c.json({ success: true, message: 'Assigned staff updated.' });
});

// POST /api/job-requests/:id/update-timeline - Update start and deadline dates
jobRequestsRouter.post('/:id/update-timeline', async (c) => {
  const db = c.env.DB;
  const user = c.get('user');
  const idParam = c.req.param('id');
  const { start_date, deadline } = await c.req.json();

  const request = await findJobRequest(db, idParam);
  if (!request) return c.json({ error: 'Job request not found' }, 404);

  await db.prepare(`
    UPDATE job_requests SET start_date = ?, deadline = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?
  `).bind(start_date || null, deadline || null, request.id).run();

  await db.prepare(`
    INSERT INTO workflow_logs (job_request_id, action, actor_id, actor_name, comment)
    VALUES (?, 'UPDATE_TIMELINE', ?, ?, ?)
  `).bind(request.id, user.id, user.name, `Updated project timeline: ${start_date} to ${deadline}`).run();

  return c.json({ success: true, message: 'Timeline updated.' });
});

// POST /api/job-requests/:id/report - Staff submit note/report
jobRequestsRouter.post('/:id/report', async (c) => {
  const db = c.env.DB;
  const user = c.get('user');
  const idParam = c.req.param('id');
  const { report_text } = await c.req.json();

  if (!report_text) return c.json({ error: 'Report text is required.' }, 400);

  const request = await findJobRequest(db, idParam);
  if (!request) return c.json({ error: 'Job request not found' }, 404);

  // Insert into staff_reports table (ignore if fail)
  try {
    await db.prepare(`
      INSERT INTO staff_reports (job_request_id, staff_id, report_text)
      VALUES (?, ?, ?)
    `).bind(request.id, user.id, report_text).run();
  } catch (e) {
    try {
      await db.prepare(`
        INSERT INTO job_staff_reports (job_request_id, staff_id, report_text)
        VALUES (?, ?, ?)
      `).bind(request.id, user.id, report_text).run();
    } catch (e2) {}
  }

  // Insert into workflow_logs for activity history
  await db.prepare(`
    INSERT INTO workflow_logs (job_request_id, action, actor_id, actor_name, comment)
    VALUES (?, 'REPORTED', ?, ?, ?)
  `).bind(request.id, user.id, user.name, report_text).run();

  return c.json({ success: true, message: 'Report added.' });
});

// PUT /api/job-requests/reports/:reportId - Update staff report
jobRequestsRouter.put('/reports/:reportId', async (c) => {
  const db = c.env.DB;
  const reportId = c.req.param('reportId');
  const { report_text } = await c.req.json();

  if (!report_text) return c.json({ error: 'Report text is required.' }, 400);

  try {
    await db.prepare('UPDATE staff_reports SET report_text = ? WHERE id = ?').bind(report_text, reportId).run();
  } catch (e) {
    try {
      await db.prepare('UPDATE job_staff_reports SET report_text = ? WHERE id = ?').bind(report_text, reportId).run();
    } catch (e2) {}
  }

  return c.json({ success: true, message: 'Report updated.' });
});

// DELETE /api/job-requests/reports/:reportId - Delete staff report
jobRequestsRouter.delete('/reports/:reportId', async (c) => {
  const db = c.env.DB;
  const reportId = c.req.param('reportId');

  try {
    await db.prepare('DELETE FROM staff_reports WHERE id = ?').bind(reportId).run();
  } catch (e) {
    try {
      await db.prepare('DELETE FROM job_staff_reports WHERE id = ?').bind(reportId).run();
    } catch (e2) {}
  }

  return c.json({ success: true, message: 'Report deleted.' });
});

// POST /api/job-requests/:id/mark-done - Staff mark their part as done
jobRequestsRouter.post('/:id/mark-done', async (c) => {
  const db = c.env.DB;
  const user = c.get('user');
  const idParam = c.req.param('id');

  const request = await findJobRequest(db, idParam);
  if (!request) return c.json({ error: 'Job request not found' }, 404);

  // Update tasks assigned to this staff
  await db.prepare(`
    UPDATE job_tasks SET status = 'completed' WHERE job_request_id = ? AND assigned_to_user_id = ?
  `).bind(request.id, user.id).run();

  // Insert into workflow_logs
  await db.prepare(`
    INSERT INTO workflow_logs (job_request_id, action, actor_id, actor_name, comment)
    VALUES (?, 'STAFF_DONE', ?, ?, ?)
  `).bind(request.id, user.id, user.name, `${user.name} marked their part as completed.`).run();

  // Check if ALL assigned staff members have completed their part
  let allDone = true;
  if (request.assigned_staff_ids) {
    const assignedStaffIds = request.assigned_staff_ids.split(',').map((id: string) => Number(id.trim()));
    
    // Get distinct actors who did STAFF_DONE for this job request
    const { results } = await db.prepare(`
      SELECT DISTINCT actor_id FROM workflow_logs 
      WHERE job_request_id = ? AND action = 'STAFF_DONE'
    `).bind(request.id).all();
    
    const doneStaffIds = (results || []).map((r: any) => Number(r.actor_id));
    
    for (const staffId of assignedStaffIds) {
      if (!doneStaffIds.includes(staffId)) {
        allDone = false;
        break;
      }
    }
  }

  if (allDone) {
    await db.prepare(`
      UPDATE job_requests SET status = 'completed', current_step_name = 'Completed', updated_at = CURRENT_TIMESTAMP WHERE id = ?
    `).bind(request.id).run();
  }

  return c.json({ success: true, message: 'Part marked as done.' });
});

// DELETE /api/job-requests/:id - Delete request
jobRequestsRouter.delete('/:id', async (c) => {
  const db = c.env.DB;
  const idParam = c.req.param('id');

  const request = await findJobRequest(db, idParam);
  if (!request) return c.json({ error: 'Job request not found' }, 404);

  await db.prepare('DELETE FROM job_requests WHERE id = ?').bind(request.id).run();

  return c.json({ success: true, message: 'Job request deleted.' });
});

export default jobRequestsRouter;
