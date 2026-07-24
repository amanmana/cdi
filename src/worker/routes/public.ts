import { Hono } from 'hono';
import { D1Database } from '@cloudflare/workers-types';

type Env = {
  Bindings: {
    DB: D1Database;
    TURNSTILE_SECRET_KEY: string;
  };
};

const publicApi = new Hono<Env>();

// Get list of units and their form schema
publicApi.get('/units', async (c) => {
  const { results } = await c.env.DB
    .prepare('SELECT id, name, form_schema FROM units ORDER BY name ASC')
    .all<{ id: number; name: string; form_schema: string }>();

  const formatted = (results || []).map((u) => ({
    ...u,
    form_schema: u.form_schema ? JSON.parse(u.form_schema) : [],
  }));

  return c.json(formatted);
});

// Submit a new job request (Public)
publicApi.post('/job-requests', async (c) => {
  try {
    const { client_name, client_email, title, description, unit, additional_data, turnstileToken } = await c.req.json();

    if (!client_name || !client_email || !title || !unit || !turnstileToken) {
      return c.json({ error: 'Please fill in full name, email, title, target unit, and complete the security verification.' }, 400);
    }

    // Verify Turnstile
    const turnstileSecret = c.env.TURNSTILE_SECRET_KEY;
    if (turnstileSecret) {
      const formData = new FormData();
      formData.append('secret', turnstileSecret);
      formData.append('response', turnstileToken);
      
      const ip = c.req.header('CF-Connecting-IP');
      if (ip) {
        formData.append('remoteip', ip);
      }

      const verifyRes = await fetch('https://challenges.cloudflare.com/turnstile/v0/siteverify', {
        method: 'POST',
        body: formData,
      });

      const verifyData: any = await verifyRes.json();
      if (!verifyData.success) {
        console.error('Turnstile verification failed:', verifyData);
        return c.json({ error: 'Security verification (Turnstile) failed. Please try again.' }, 403);
      }
    }

    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
    const letters = chars.charAt(Math.floor(Math.random() * chars.length)) + chars.charAt(Math.floor(Math.random() * chars.length));
    const numbers = Math.floor(100000 + Math.random() * 900000).toString();
    const ticketNo = letters + numbers;

    const res = await c.env.DB
      .prepare(
        `INSERT INTO job_requests (ticket_no, client_name, client_email, title, description, additional_data, unit, status, current_step_name, created_at, updated_at) 
         VALUES (?, ?, ?, ?, ?, ?, ?, 'manager_approval', 'Manager Review', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)`
      )
      .bind(
        ticketNo,
        client_name,
        client_email,
        title,
        description || '',
        additional_data ? JSON.stringify(additional_data) : null,
        unit
      )
      .run();

    const requestId = res.meta.last_row_id as number;

    // Log initial workflow creation
    await c.env.DB
      .prepare(
        `INSERT INTO workflow_logs (job_request_id, action, actor_name, from_step_name, to_step_name, comment)
         VALUES (?, 'SUBMIT', ?, 'Client Form', 'Manager Review', ?)`
      )
      .bind(requestId, client_name, `Job request submitted by ${client_email}`)
      .run();

    return c.json({
      success: true,
      ticket_no: ticketNo,
      id: requestId,
    });
  } catch (err: any) {
    console.error('Failed to insert job request:', err);
    return c.json({ error: 'Database insert failed: ' + err.message }, 500);
  }
});

// Track Ticket status
publicApi.get('/track/:ticket', async (c) => {
  const ticket = c.req.param('ticket');
  const request = await c.env.DB
    .prepare(`SELECT * FROM job_requests WHERE ticket_no = ?`)
    .bind(ticket)
    .first<any>();

  if (!request) {
    return c.json({ error: 'Job request with this tracking number was not found.' }, 404);
  }

  // Get assigned staff names
  let assignedStaffName = '';
  if (request.assigned_staff_ids) {
    const staffIds = request.assigned_staff_ids.split(',');
    const placeholders = staffIds.map(() => '?').join(',');
    const { results: staffRes } = await c.env.DB.prepare(`SELECT name FROM users WHERE id IN (${placeholders})`).bind(...staffIds).all<{ name: string }>();
    assignedStaffName = (staffRes || []).map((s) => s.name).join(', ');
  }

  // Get tasks list
  const { results: tasks } = await c.env.DB
    .prepare(`SELECT id, title, status, due_date FROM job_tasks WHERE job_request_id = ? ORDER BY created_at ASC`)
    .bind(request.id)
    .all();

  // Get history
  const { results: history } = await c.env.DB
    .prepare(`SELECT * FROM workflow_logs WHERE job_request_id = ? ORDER BY created_at DESC`)
    .bind(request.id)
    .all();

  // Get staff progress reports
  const { results: reports } = await c.env.DB
    .prepare(
      `SELECT r.*, u.name as staff_name 
       FROM staff_reports r 
       JOIN users u ON r.staff_id = u.id 
       WHERE r.job_request_id = ? 
       ORDER BY r.created_at DESC`
    )
    .bind(request.id)
    .all();

  const totalTasks = tasks ? tasks.length : 0;
  const completedTasks = tasks ? tasks.filter((t: any) => t.status === 'completed').length : 0;

  return c.json({
    request: {
      ...request,
      assigned_staff_name: assignedStaffName || 'Pending assignment',
      total_staff: totalTasks,
      completed_staff: completedTasks,
      additional_data: request.additional_data ? JSON.parse(request.additional_data) : null,
    },
    tasks: tasks || [],
    history: history || [],
    reports: reports || [],
  });
});

export default publicApi;
