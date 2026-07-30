import { Hono } from 'hono';
import { AuthUser, verifyToken } from '../auth';
import { WorkflowEngine } from '../services/workflow';
import { sendGmail } from '../utils/mailer';

async function notifyClientCancellation({
  clientEmail,
  clientName,
  ticketNo,
  title,
  managerName,
  managerUnit,
  reason,
  origin,
}: {
  clientEmail: string;
  clientName: string;
  ticketNo: string;
  title: string;
  managerName: string;
  managerUnit?: string;
  reason: string;
  origin: string;
}) {
  if (!clientEmail) return;

  const trackUrl = `${origin}/track/${ticketNo}`;

  const emailHtml = `
    <!DOCTYPE html>
    <html>
    <head><meta charset="utf-8"><title>Job Request Cancelled</title></head>
    <body style="margin:0; padding:0; background-color:#f8fafc; font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif;">
      <!-- Hidden Preheader -->
      <div style="display:none; max-height:0px; overflow:hidden;">
        Important notification regarding your job request #${ticketNo}.
      </div>
      <div style="max-width: 580px; margin: 20px auto; padding: 24px; border: 1px solid #e2e8f0; border-radius: 20px; background-color: #ffffff;">
        <div style="background: linear-gradient(135deg, #991b1b, #dc2626); padding: 28px; text-align: center; border-radius: 16px;">
          <h1 style="color: #ffffff; margin: 0; font-size: 20px; font-weight: 900; letter-spacing: -0.5px;">REQUEST CANCELLED</h1>
          <p style="color: #fca5a5; margin: 6px 0 0 0; font-size: 12px; font-weight: 600;">CDI Corporate Communication & Identity Portal</p>
        </div>
        <div style="padding: 24px 8px; text-align: left; color: #1e293b;">
          <p style="font-size: 14px; color: #475569;">Hello <strong>${clientName || 'Client'}</strong>,</p>
          <p style="font-size: 14px; color: #475569; line-height: 1.6;">Your job request <strong>#${ticketNo}</strong> (${title}) has been cancelled/rejected by the Manager.</p>
          
          <div style="background-color: #fef2f2; border-left: 4px solid #dc2626; padding: 16px; border-radius: 12px; margin: 20px 0;">
            <p style="margin: 0 0 6px 0; font-size: 13px;"><strong>Ticket Number:</strong> <span style="color: #dc2626; font-weight: 800;">#${ticketNo}</span></p>
            <p style="margin: 0 0 6px 0; font-size: 13px;"><strong>Project Title:</strong> ${title}</p>
            <p style="margin: 0 0 6px 0; font-size: 13px;"><strong>Action By:</strong> ${managerName} (${managerUnit || 'Manager'})</p>
            <p style="margin: 0; font-size: 13px; color: #991b1b;"><strong>Cancellation Reason:</strong> ${reason || 'No specific reason provided.'}</p>
          </div>

          <div style="text-align: center; margin: 28px 0;">
            <a href="${trackUrl}" style="background-color: #1e293b; color: #ffffff; padding: 14px 28px; text-decoration: none; font-weight: 800; font-size: 14px; border-radius: 12px; display: inline-block;">
              View Ticket Details &rarr;
            </a>
          </div>
          <hr style="border: 0; border-top: 1px solid #f1f5f9; margin: 24px 0;" />
          <p style="font-size: 11px; color: #94a3b8; text-align: center; margin: 0;">Official System Notification — CDI Management System</p>
        </div>
      </div>
    </body>
    </html>
  `;

  try {
    await sendGmail({
      to: clientEmail,
      subject: `[CANCELLED] Job Request #${ticketNo} - ${title}`,
      html: emailHtml,
    });
  } catch (err) {
    console.error('Failed to dispatch client cancellation email:', err);
  }
}

async function notifyStaffAssignment({
  staffEmail,
  staffName,
  ticketNo,
  title,
  unit,
  clientName,
  managerName,
  startDate,
  deadline,
  comment,
  origin,
}: {
  staffEmail: string;
  staffName: string;
  ticketNo: string;
  title: string;
  unit: string;
  clientName: string;
  managerName: string;
  startDate?: string;
  deadline?: string;
  comment?: string;
  origin: string;
}) {
  if (!staffEmail) return;

  const detailUrl = `${origin}/portal/job-requests`;

  const emailHtml = `
    <!DOCTYPE html>
    <html>
    <head><meta charset="utf-8"><title>New Task Assignment</title></head>
    <body style="margin:0; padding:0; background-color:#f8fafc; font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif;">
      <!-- Hidden Preheader -->
      <div style="display:none; max-height:0px; overflow:hidden;">
        You have been assigned a new project task: #${ticketNo} (${title}).
      </div>
      <div style="max-width: 580px; margin: 20px auto; padding: 24px; border: 1px solid #e2e8f0; border-radius: 20px; background-color: #ffffff;">
        <div style="background: linear-gradient(135deg, #059669, #10b981); padding: 28px; text-align: center; border-radius: 16px;">
          <h1 style="color: #ffffff; margin: 0; font-size: 20px; font-weight: 900; letter-spacing: -0.5px;">NEW JOB ASSIGNED</h1>
          <p style="color: #a7f3d0; margin: 6px 0 0 0; font-size: 12px; font-weight: 600;">Unit: ${unit}</p>
        </div>
        <div style="padding: 24px 8px; text-align: left; color: #1e293b;">
          <p style="font-size: 14px; color: #475569;">Hello <strong>${staffName}</strong>,</p>
          <p style="font-size: 14px; color: #475569; line-height: 1.6;">You have been assigned to handle a new job request by Manager <strong>${managerName}</strong>.</p>
          
          <div style="background-color: #ecfdf5; border-left: 4px solid #10b981; padding: 16px; border-radius: 12px; margin: 20px 0;">
            <p style="margin: 0 0 6px 0; font-size: 13px;"><strong>Ticket Number:</strong> <span style="color: #059669; font-weight: 800;">#${ticketNo}</span></p>
            <p style="margin: 0 0 6px 0; font-size: 13px;"><strong>Project Title:</strong> ${title}</p>
            <p style="margin: 0 0 6px 0; font-size: 13px;"><strong>Client:</strong> ${clientName}</p>
            ${startDate ? `<p style="margin: 0 0 6px 0; font-size: 13px;"><strong>Start Date:</strong> ${startDate}</p>` : ''}
            ${deadline ? `<p style="margin: 0 0 6px 0; font-size: 13px;"><strong>Deadline:</strong> <span style="color: #dc2626; font-weight: 700;">${deadline}</span></p>` : ''}
            ${comment ? `<p style="margin: 6px 0 0 0; font-size: 13px; color: #047857;"><strong>Manager Instructions:</strong> ${comment}</p>` : ''}
          </div>

          <div style="text-align: center; margin: 28px 0;">
            <a href="${detailUrl}" style="background-color: #059669; color: #ffffff; padding: 14px 28px; text-decoration: none; font-weight: 800; font-size: 14px; border-radius: 12px; display: inline-block; box-shadow: 0 4px 12px rgba(5,150,105,0.25);">
              Open Staff Dashboard &rarr;
            </a>
          </div>
          <hr style="border: 0; border-top: 1px solid #f1f5f9; margin: 24px 0;" />
          <p style="font-size: 11px; color: #94a3b8; text-align: center; margin: 0;">Official System Notification — CDI Management System</p>
        </div>
      </div>
    </body>
    </html>
  `;

  try {
    await sendGmail({
      to: staffEmail,
      subject: `[NEW ASSIGNMENT] #${ticketNo} - ${title}`,
      html: emailHtml,
    });
  } catch (err) {
    console.error('Failed to dispatch staff assignment email:', err);
  }
}

type Env = {
  Bindings: {
    DB: D1Database;
  };
  Variables: {
    user: AuthUser;
  };
};

export const jobRequestsRouter = new Hono<Env>();

jobRequestsRouter.use('*', async (c, next) => {
  const authHeader = c.req.header('Authorization');
  const token = authHeader ? authHeader.replace('Bearer ', '') : null;
  if (!token) return c.json({ error: 'Unauthorized' }, 401);

  const payload = await verifyToken(token);
  if (!payload) return c.json({ error: 'Session expired' }, 401);

  const freshUser = await c.env.DB
    .prepare(`
      SELECT u.id, u.name, u.email, u.role, u.unit_id, COALESCE(un.name, u.unit) as unit 
      FROM users u 
      LEFT JOIN units un ON (u.unit_id = un.id OR u.unit = un.name) 
      WHERE u.id = ?
    `)
    .bind(payload.id)
    .first<any>();

  if (freshUser) {
    const today = new Date().toISOString().split('T')[0];
    const delegation = await c.env.DB
      .prepare(
        `SELECT d.*, m.unit_id as manager_unit_id, COALESCE(un.name, m.unit) as manager_unit
         FROM delegations d
         JOIN users m ON d.manager_id = m.id
         LEFT JOIN units un ON (m.unit_id = un.id OR m.unit = un.name)
         WHERE d.delegate_id = ? AND d.status = 'active' AND d.start_date <= ? AND d.end_date >= ?
         LIMIT 1`
      )
      .bind(freshUser.id, today, today)
      .first<{ manager_unit_id: number; manager_unit: string }>();

    c.set('user', {
      ...freshUser,
      is_acting_manager: !!delegation,
      acting_manager_unit_id: delegation ? delegation.manager_unit_id : null,
      acting_manager_unit: delegation ? delegation.manager_unit : null,
    });
  } else {
    c.set('user', payload);
  }

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
           COALESCE(un.name, j.unit) as unit,
           (SELECT GROUP_CONCAT(name, ', ') FROM users WHERE INSTR(',' || j.assigned_staff_ids || ',', ',' || id || ',') > 0) as assigned_staff_name
    FROM job_requests j
    LEFT JOIN units un ON (j.unit_id = un.id OR j.unit = un.name)
    WHERE 1=1
  `;
  const params: any[] = [];

  // Role Scoping
  const managerUnit = (user as any)?.acting_manager_unit || user?.unit;
  if (user && user.role === 'staff') {
    query += ` AND INSTR(',' || j.assigned_staff_ids || ',', ',' || ? || ',') > 0 AND j.status != 'manager_approval'`;
    params.push(String(user.id));
  } else if (user && user.role === 'client') {
    query += ` AND j.client_email = ?`;
    params.push(user.email);
  } else if (user && (user.role === 'manager' || (user as any)?.is_acting_manager) && managerUnit) {
    query += ` AND (j.unit = ? OR j.unit_id IN (SELECT id FROM units WHERE name = ?))`;
    params.push(managerUnit, managerUnit);
  }

  if (search) {
    query += ` AND (
      j.ticket_no LIKE ? 
      OR j.title LIKE ? 
      OR j.client_name LIKE ? 
      OR EXISTS (
        SELECT 1 FROM users u 
        WHERE u.name LIKE ? 
          AND INSTR(',' || j.assigned_staff_ids || ',', ',' || u.id || ',') > 0
      )
    )`;
    params.push(`%${search}%`, `%${search}%`, `%${search}%`, `%${search}%`);
  }

  query += ` ORDER BY j.created_at DESC`;

  const { results } = await db.prepare(query).bind(...params).all();

  // Attach completion stats for assigned staff / tasks
  const enriched = await Promise.all(
    (results || []).map(async (row: any) => {
      let assigned_staff: any[] = [];
      let completedStaffCount = 0;
      let totalStaffCount = 0;

      if (row.assigned_staff_ids) {
        const staffIds = row.assigned_staff_ids.split(',').map((id: string) => id.trim()).filter(Boolean);
        totalStaffCount = staffIds.length;
        if (staffIds.length > 0) {
          const placeholders = staffIds.map(() => '?').join(',');
          const { results: staffUsers } = await db.prepare(`
            SELECT id, name FROM users WHERE id IN (${placeholders})
          `).bind(...staffIds).all();

          const { results: doneLogs } = await db.prepare(`
            SELECT DISTINCT actor_id FROM workflow_logs 
            WHERE job_request_id = ? AND action = 'STAFF_DONE'
          `).bind(row.id).all();
          const doneStaffSet = new Set((doneLogs || []).map((l: any) => Number(l.actor_id)));

          assigned_staff = (staffUsers || []).map((u: any) => ({
            id: u.id,
            name: u.name,
            is_done: doneStaffSet.has(Number(u.id))
          }));

          completedStaffCount = staffIds.filter((id: string) => doneStaffSet.has(Number(id))).length;
        }
      }

      return {
        ...row,
        assigned_staff,
        total_staff: totalStaffCount,
        completed_staff: completedStaffCount,
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

// Preset Management Endpoints (Get, Delete/Hide, Add)
// Preset Management Endpoints (User-Scoped per Staff/Manager/Admin)
jobRequestsRouter.get('/presets', async (c) => {
  const db = c.env.DB;
  const user = c.get('user');
  const userId = user.id;

  try {
    const hiddenClientsRow = await db.prepare("SELECT value FROM system_settings WHERE key = ?").bind(`preset_hidden_clients_${userId}`).first<{ value: string }>();
    const hiddenProjectsRow = await db.prepare("SELECT value FROM system_settings WHERE key = ?").bind(`preset_hidden_projects_${userId}`).first<{ value: string }>();
    const customClientsRow = await db.prepare("SELECT value FROM system_settings WHERE key = ?").bind(`preset_custom_clients_${userId}`).first<{ value: string }>();
    const customProjectsRow = await db.prepare("SELECT value FROM system_settings WHERE key = ?").bind(`preset_custom_projects_${userId}`).first<{ value: string }>();

    const parseArray = (val?: string): string[] => {
      if (!val) return [];
      try {
        const parsed = JSON.parse(val);
        if (Array.isArray(parsed)) return parsed.filter((item) => typeof item === 'string');
        if (typeof parsed === 'string') return [parsed];
      } catch (e) {}
      return [];
    };

    const hiddenClients = parseArray(hiddenClientsRow?.value);
    const hiddenProjects = parseArray(hiddenProjectsRow?.value);
    const customClients = parseArray(customClientsRow?.value);
    const customProjects = parseArray(customProjectsRow?.value);

    // Only return user's own custom items (do NOT auto-populate system/job_requests data)
    const clients = Array.from(new Set(customClients)).filter((c) => !hiddenClients.includes(c));
    const projects = Array.from(new Set(customProjects)).filter((p) => !hiddenProjects.includes(p));

    return c.json({ clients, projects });
  } catch (err: any) {
    console.error('Error fetching presets:', err);
    return c.json({ clients: [], projects: [] });
  }
});

jobRequestsRouter.post('/presets/delete', async (c) => {
  const db = c.env.DB;
  const user = c.get('user');
  const userId = user.id;
  const { type, value } = await c.req.json();

  if (!type || !value) {
    return c.json({ error: 'Type and value are required.' }, 400);
  }

  const keyName = type === 'client' ? `preset_hidden_clients_${userId}` : `preset_hidden_projects_${userId}`;
  const customKeyName = type === 'client' ? `preset_custom_clients_${userId}` : `preset_custom_projects_${userId}`;

  const parseArray = (val?: string): string[] => {
    if (!val) return [];
    try {
      const parsed = JSON.parse(val);
      if (Array.isArray(parsed)) return parsed.filter((item) => typeof item === 'string');
      if (typeof parsed === 'string') return [parsed];
    } catch (e) {}
    return [];
  };

  try {
    const existingHidden = await db.prepare('SELECT value FROM system_settings WHERE key = ?').bind(keyName).first<{ value: string }>();
    let hiddenList: string[] = parseArray(existingHidden?.value);
    if (!hiddenList.includes(value)) {
      hiddenList.push(value);
      await db.prepare('INSERT OR REPLACE INTO system_settings (key, value) VALUES (?, ?)').bind(keyName, JSON.stringify(hiddenList)).run();
    }

    const existingCustom = await db.prepare('SELECT value FROM system_settings WHERE key = ?').bind(customKeyName).first<{ value: string }>();
    if (existingCustom?.value) {
      let customList: string[] = parseArray(existingCustom?.value);
      customList = customList.filter((v) => v !== value);
      await db.prepare('INSERT OR REPLACE INTO system_settings (key, value) VALUES (?, ?)').bind(customKeyName, JSON.stringify(customList)).run();
    }

    return c.json({ success: true, message: `Preset ${type} "${value}" deleted for user.` });
  } catch (err: any) {
    console.error('Error deleting preset:', err);
    return c.json({ error: 'Failed to delete preset: ' + err.message }, 500);
  }
});

jobRequestsRouter.post('/presets/add', async (c) => {
  const db = c.env.DB;
  const user = c.get('user');
  const userId = user.id;
  const { type, value } = await c.req.json();

  if (!type || !value || !value.trim()) {
    return c.json({ error: 'Type and value are required.' }, 400);
  }

  const cleanVal = value.trim();
  const keyName = type === 'client' ? `preset_custom_clients_${userId}` : `preset_custom_projects_${userId}`;
  const hiddenKeyName = type === 'client' ? `preset_hidden_clients_${userId}` : `preset_hidden_projects_${userId}`;

  const parseArray = (val?: string): string[] => {
    if (!val) return [];
    try {
      const parsed = JSON.parse(val);
      if (Array.isArray(parsed)) return parsed.filter((item) => typeof item === 'string');
      if (typeof parsed === 'string') return [parsed];
    } catch (e) {}
    return [];
  };

  try {
    const existingCustom = await db.prepare('SELECT value FROM system_settings WHERE key = ?').bind(keyName).first<{ value: string }>();
    let customList: string[] = parseArray(existingCustom?.value);
    if (!customList.includes(cleanVal)) {
      customList.push(cleanVal);
      await db.prepare('INSERT OR REPLACE INTO system_settings (key, value) VALUES (?, ?)').bind(keyName, JSON.stringify(customList)).run();
    }

    const existingHidden = await db.prepare('SELECT value FROM system_settings WHERE key = ?').bind(hiddenKeyName).first<{ value: string }>();
    if (existingHidden?.value) {
      let hiddenList: string[] = parseArray(existingHidden?.value);
      hiddenList = hiddenList.filter((v) => v !== cleanVal);
      await db.prepare('INSERT OR REPLACE INTO system_settings (key, value) VALUES (?, ?)').bind(hiddenKeyName, JSON.stringify(hiddenList)).run();
    }

    return c.json({ success: true, message: `Preset ${type} "${cleanVal}" added for user.` });
  } catch (err: any) {
    console.error('Error adding preset:', err);
    return c.json({ error: 'Failed to add preset: ' + err.message }, 500);
  }
});

// Weekly Automated Reports Endpoint for Staff & Managers
jobRequestsRouter.get('/reports/weekly', async (c) => {
  const db = c.env.DB;
  const user = c.get('user');

  const startDate = c.req.query('start_date');
  const endDate = c.req.query('end_date');
  const unitFilter = c.req.query('unit');
  const staffIdFilter = c.req.query('staff_id');
  const statusFilter = c.req.query('status');

  try {
    // 1. Fetch relevant staff users
    let staffQuery = "SELECT id, name, email, role, unit FROM users WHERE role IN ('staff', 'manager', 'admin')";
    const staffParams: any[] = [];

    if (user.role === 'staff' && !user.is_acting_manager) {
      // Staff only sees themselves
      staffQuery += ' AND id = ?';
      staffParams.push(user.id);
    } else if (user.role === 'manager') {
      // Manager ONLY sees staff in their unit (or themselves)
      if (staffIdFilter && staffIdFilter !== 'all') {
        staffQuery += ' AND id = ?';
        staffParams.push(staffIdFilter);
      } else if (user.unit) {
        staffQuery += ' AND (unit = ? OR id = ?)';
        staffParams.push(user.unit, user.id);
      }
    } else {
      // Admin role
      if (staffIdFilter && staffIdFilter !== 'all') {
        staffQuery += ' AND id = ?';
        staffParams.push(staffIdFilter);
      } else if (unitFilter && unitFilter !== 'all') {
        staffQuery += ' AND unit = ?';
        staffParams.push(unitFilter);
      }
    }

    staffQuery += ' ORDER BY name ASC';
    const { results: staffList } = await db.prepare(staffQuery).bind(...staffParams).all<{
      id: number;
      name: string;
      email: string;
      role: string;
      unit: string;
    }>();

    // 2. Query all job_requests
    const { results: allJobs } = await db.prepare('SELECT r.* FROM job_requests r ORDER BY r.created_at DESC').all<{
      id: number;
      ticket_no: string;
      title: string;
      client_name: string;
      client_email: string;
      status: string;
      current_step_name: string;
      execution_date: string;
      start_date: string;
      deadline: string;
      created_at: string;
      updated_at: string;
      assigned_staff_ids: string;
      additional_data: string;
      work_details: string;
    }>();

    // Helper to format any date string into YYYY-MM-DD
    const normalizeDateStr = (raw?: string): string | null => {
      if (!raw || !raw.trim()) return null;
      const str = raw.trim();
      try {
        const d = new Date(str);
        if (!isNaN(d.getTime())) {
          return d.toISOString().split('T')[0];
        }
      } catch (e) {}

      const sub = str.substring(0, 10);
      if (sub.includes('-')) return sub;
      if (sub.includes('/')) {
        const parts = sub.split('/');
        if (parts.length === 3) {
          const yr = parts[2].length === 2 ? `20${parts[2]}` : parts[2];
          return `${yr}-${parts[1].padStart(2, '0')}-${parts[0].padStart(2, '0')}`;
        }
      }
      return null;
    };

    // 3. Map entries per staff member
    const reportsByStaff = (staffList || []).map((staff) => {
      const staffIdNum = Number(staff.id);
      const staffEmailLower = (staff.email || '').toLowerCase().trim();

      const staffJobs = (allJobs || []).filter((job) => {
        let belongsToStaff = false;

        // Check if assigned_staff_ids includes staff.id
        if (job.assigned_staff_ids) {
          const ids = job.assigned_staff_ids.split(',').map((id) => Number(id.trim())).filter((n) => !isNaN(n));
          if (ids.includes(staffIdNum)) {
            belongsToStaff = true;
          }
        }

        // Check if self-initiated or logged by staff member email
        if (!belongsToStaff && job.client_email) {
          if (job.client_email.toLowerCase().trim() === staffEmailLower) {
            belongsToStaff = true;
          }
        }

        // Check if staff has a specific task in additional_data.staff_tasks
        if (!belongsToStaff && job.additional_data) {
          try {
            const extra = JSON.parse(job.additional_data);
            if (extra.staff_tasks && (extra.staff_tasks[staffIdNum] || extra.staff_tasks[String(staffIdNum)])) {
              belongsToStaff = true;
            }
          } catch (e) {}
        }

        if (!belongsToStaff) return false;

        // Filter by Status if specified
        if (statusFilter && statusFilter !== 'all') {
          if (statusFilter === 'completed' && job.status !== 'completed') return false;
          if (statusFilter === 'staff_processing' && job.status === 'completed') return false;
        }

        // Weekly Date Range Overlap Filter [startDate, endDate]
        if (startDate && endDate) {
          const rawStart = job.execution_date || job.start_date || job.created_at;
          const rawEnd = job.deadline || (job.status === 'completed' ? job.updated_at : null) || rawStart;

          const jobStart = normalizeDateStr(rawStart);
          const jobEnd = normalizeDateStr(rawEnd);

          const minDate = jobStart && jobEnd ? (jobStart < jobEnd ? jobStart : jobEnd) : (jobStart || jobEnd);
          const maxDate = jobStart && jobEnd ? (jobStart > jobEnd ? jobStart : jobEnd) : (jobStart || jobEnd);

          if (minDate && maxDate) {
            // Check if [minDate, maxDate] overlaps with [startDate, endDate]
            return minDate <= endDate && maxDate >= startDate;
          }

          if (jobStart) {
            return jobStart >= startDate && jobStart <= endDate;
          }

          // Default fallback to true if date parsing fails so job is not silently lost
          return true;
        }

        return true;
      });

      const formattedEntries = staffJobs.map((job) => {
        let extraProject = '';
        let extraWorkDetails = '';
        let staffTask = '';

        if (job.additional_data) {
          try {
            const extra = JSON.parse(job.additional_data);
            if (extra.project) extraProject = extra.project;
            if (extra.work_details) extraWorkDetails = extra.work_details;
            if (extra.staff_tasks && extra.staff_tasks[staff.id]) {
              staffTask = extra.staff_tasks[staff.id];
            }
          } catch (e) {}
        }
        if (!extraWorkDetails && job.work_details) extraWorkDetails = job.work_details;

        const projectName = extraProject || job.title;
        // Priority for task text: individual staff task > extra work details > job title
        const taskText = staffTask || extraWorkDetails || job.title;

        // Start Date formatting (e.g. 21/07/26 or YYYY-MM-DD)
        const rawDate = job.execution_date || job.start_date || (job.created_at ? job.created_at.substring(0, 10) : '');
        let formattedStartDate = rawDate;
        if (rawDate && rawDate.includes('-')) {
          const parts = rawDate.substring(0, 10).split('-');
          if (parts.length === 3) {
            formattedStartDate = `${parts[2]}/${parts[1]}/${parts[0].substring(2)}`;
          }
        }

        return {
          id: job.id,
          ticket_no: job.ticket_no,
          staff_name: staff.name,
          client: job.client_name || 'Corporate Comm',
          project: projectName,
          task: taskText,
          title: taskText,
          start_date: formattedStartDate,
          status: job.status === 'completed' ? 'Completed' : 'Staff Processing',
          raw_status: job.status,
        };
      });

      return {
        staff_id: staff.id,
        staff_name: staff.name,
        staff_email: staff.email,
        staff_unit: staff.unit,
        entries: formattedEntries,
        total_count: formattedEntries.length,
        completed_count: formattedEntries.filter((e) => e.status === 'Completed').length,
        in_progress_count: formattedEntries.filter((e) => e.status !== 'Completed').length,
      };
    });

    return c.json({
      start_date: startDate,
      end_date: endDate,
      reports: reportsByStaff,
    });
  } catch (err: any) {
    console.error('Error generating weekly report:', err);
    return c.json({ error: 'Failed to generate weekly report: ' + err.message }, 500);
  }
});

// POST /api/job-requests/create-internal - Manager/Admin direct job creation
jobRequestsRouter.post('/create-internal', async (c) => {
  const db = c.env.DB;
  const user = c.get('user');

  if (!['admin', 'manager'].includes(user.role) && !user.is_acting_manager) {
    return c.json({ error: 'Unauthorized. Only Managers or Admins can create internal jobs.' }, 403);
  }

  const { title, description, client_name, client_email, unit, assigned_staff_ids, start_date, deadline } = await c.req.json();

  if (!title) {
    return c.json({ error: 'Title is required.' }, 400);
  }

  const targetUnit = unit || user.acting_manager_unit || user.unit || 'Graphic & Web';
  const numbers = Math.floor(100000 + Math.random() * 900000).toString();
  const ticketNo = 'INT' + numbers;

  const unitRow = await db
    .prepare('SELECT id FROM units WHERE name = ?')
    .bind(targetUnit)
    .first<{ id: number }>();
  const unitId = unitRow?.id || null;

  const assignedStr = Array.isArray(assigned_staff_ids) ? assigned_staff_ids.join(',') : (assigned_staff_ids || '');

  const res = await db
    .prepare(
      `INSERT INTO job_requests (ticket_no, client_name, client_email, title, description, unit, unit_id, status, current_step_name, assigned_staff_ids, start_date, deadline, created_at, updated_at) 
       VALUES (?, ?, ?, ?, ?, ?, ?, 'staff_processing', 'Staff Processing & Design', ?, ?, ?, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)`
    )
    .bind(
      ticketNo,
      client_name || 'Pihak Atasan / Management Directive',
      client_email || user.email || 'internal@cdi.app',
      title,
      description || '',
      targetUnit,
      unitId,
      assignedStr,
      start_date || null,
      deadline || null
    )
    .run();

  const requestId = res.meta.last_row_id as number;

  let staffNamesStr = 'None';
  if (Array.isArray(assigned_staff_ids) && assigned_staff_ids.length > 0) {
    const placeholders = assigned_staff_ids.map(() => '?').join(',');
    const { results: staffUsers } = await db.prepare(`
      SELECT name FROM users WHERE id IN (${placeholders})
    `).bind(...assigned_staff_ids).all();
    if (staffUsers && staffUsers.length > 0) {
      staffNamesStr = staffUsers.map((u: any) => u.name).join(', ');
    }
  }

  await db
    .prepare(
      `INSERT INTO workflow_logs (job_request_id, action, actor_id, actor_name, from_step_name, to_step_name, comment)
       VALUES (?, 'INTERNAL_CREATE', ?, ?, 'Direct Creation', 'Staff Processing & Design', ?)`
    )
    .bind(requestId, user.id, user.name, `Created internal job "${title}". Assigned team: ${staffNamesStr}`)
    .run();

  return c.json({
    success: true,
    message: 'Internal job created successfully.',
    ticket_no: ticketNo,
    id: requestId
  });
});

// POST /api/job-requests/self-initiated - Self-Initiated Staff Task Logging
jobRequestsRouter.post('/self-initiated', async (c) => {
  const db = c.env.DB;
  const user = c.get('user');

  const { title, description, client_name, project_name, status, start_date, deadline } = await c.req.json();

  if (!title) {
    return c.json({ error: 'Work title is required.' }, 400);
  }

  const targetUnit = user.acting_manager_unit || user.unit || 'IT Support & Technical';
  const numbers = Math.floor(100000 + Math.random() * 900000).toString();
  const ticketNo = 'SELF' + numbers;

  const unitRow = await db
    .prepare('SELECT id FROM units WHERE name = ?')
    .bind(targetUnit)
    .first<{ id: number }>();
  const unitId = unitRow?.id || null;

  const finalStatus = status === 'completed' ? 'completed' : 'staff_processing';
  const stepName = finalStatus === 'completed' ? 'Completed' : 'Staff Processing';
  const assignedStr = user.id.toString();

  const clientNameVal = client_name?.trim() || `Self-Initiated (${user.name})`;
  const fullDescription = `${description || ''}${project_name ? `\n\n[PROJECT: ${project_name}]` : ''}`.trim();

  // Save typed client_name & project_name to user's custom presets if provided
  if (client_name && client_name.trim()) {
    const cVal = client_name.trim();
    const customClientsRow = await db.prepare("SELECT value FROM system_settings WHERE key = ?").bind(`preset_custom_clients_${user.id}`).first<{ value: string }>();
    let list: string[] = [];
    if (customClientsRow?.value) {
      try { list = JSON.parse(customClientsRow.value); } catch (e) {}
    }
    if (!list.includes(cVal)) {
      list.push(cVal);
      await db.prepare(`
        INSERT INTO system_settings (key, value, updated_at) VALUES (?, ?, CURRENT_TIMESTAMP)
        ON CONFLICT(key) DO UPDATE SET value = excluded.value, updated_at = CURRENT_TIMESTAMP
      `).bind(`preset_custom_clients_${user.id}`, JSON.stringify(list)).run();
    }
  }

  if (project_name && project_name.trim()) {
    const pVal = project_name.trim();
    const customProjectsRow = await db.prepare("SELECT value FROM system_settings WHERE key = ?").bind(`preset_custom_projects_${user.id}`).first<{ value: string }>();
    let list: string[] = [];
    if (customProjectsRow?.value) {
      try { list = JSON.parse(customProjectsRow.value); } catch (e) {}
    }
    if (!list.includes(pVal)) {
      list.push(pVal);
      await db.prepare(`
        INSERT INTO system_settings (key, value, updated_at) VALUES (?, ?, CURRENT_TIMESTAMP)
        ON CONFLICT(key) DO UPDATE SET value = excluded.value, updated_at = CURRENT_TIMESTAMP
      `).bind(`preset_custom_projects_${user.id}`, JSON.stringify(list)).run();
    }
  }

  const res = await db
    .prepare(
      `INSERT INTO job_requests (ticket_no, client_name, client_email, title, description, unit, unit_id, status, current_step_name, assigned_staff_ids, start_date, deadline, created_at, updated_at) 
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)`
    )
    .bind(
      ticketNo,
      clientNameVal,
      user.email || 'staff@cdi.app',
      title,
      fullDescription,
      targetUnit,
      unitId,
      finalStatus,
      stepName,
      assignedStr,
      start_date || new Date().toISOString().split('T')[0],
      deadline || null
    )
    .run();

  const requestId = res.meta.last_row_id as number;

  await db
    .prepare(
      `INSERT INTO workflow_logs (job_request_id, action, actor_id, actor_name, from_step_name, to_step_name, comment)
       VALUES (?, 'SELF_TASK_CREATED', ?, ?, 'Staff Initiative', ?, ?)`
    )
    .bind(requestId, user.id, user.name, stepName, `Self-initiated task created for client "${clientNameVal}"`).run();

  if (finalStatus === 'completed') {
    try {
      await db
        .prepare(
          `INSERT INTO staff_reports (job_request_id, staff_id, report_text)
           VALUES (?, ?, ?)`
        )
        .bind(requestId, user.id, `Self-initiated task "${title}" completed. ${description || ''}`).run();
    } catch (e) {
      console.error('Error inserting staff_reports:', e);
    }

    await db
      .prepare(
        `INSERT INTO workflow_logs (job_request_id, action, actor_id, actor_name, from_step_name, to_step_name, comment)
         VALUES (?, 'STAFF_DONE', ?, ?, 'Staff Processing', 'Completed', 'Completed self-initiated task')`
      )
      .bind(requestId, user.id, user.name).run();
  }

  return c.json({
    success: true,
    message: 'Self-initiated task recorded successfully.',
    request_id: requestId,
    ticket_no: ticketNo,
  });
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
  const newStepName = 'Staff Processing & Design';
  const fromStep = request.current_step_name || 'Manager Review';

  await db.prepare(
    'UPDATE job_requests SET status = ?, current_step_name = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?'
  ).bind(newStatus, newStepName, request.id).run();

  await db.prepare(
    `INSERT INTO workflow_logs (job_request_id, action, actor_id, actor_name, from_step_name, to_step_name, comment)
     VALUES (?, 'APPROVE', ?, ?, ?, ?, ?)`
  ).bind(request.id, user.id, user.name, fromStep, newStepName, comment || 'Approved by Manager').run();

  return c.json({ success: true, message: 'Request approved and moved to Staff Processing & Design.' });
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

  // Dispatch Cancellation Notification Email to Client (with reason)
  const origin = c.req.header('origin') || 'https://cdi-app.amanmana.workers.dev';
  await notifyClientCancellation({
    clientEmail: request.client_email,
    clientName: request.client_name,
    ticketNo: request.ticket_no,
    title: request.title,
    managerName: user.name,
    managerUnit: user.unit,
    reason: comment,
    origin,
  });

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

// POST /api/job-requests/:id/change-status - Manager & Admin status change (Pending/On Hold, Cancelled, Resume, Complete)
jobRequestsRouter.post('/:id/change-status', async (c) => {
  const db = c.env.DB;
  const user = c.get('user');
  const idParam = c.req.param('id');
  const { new_status, reason } = await c.req.json();

  const isManagerOrAdmin = user.role === 'admin' || user.role === 'manager' || user.is_acting_manager;
  if (!isManagerOrAdmin) {
    return c.json({ error: 'Only Admins and Managers are authorized to change the project status.' }, 403);
  }

  const allowed = ['staff_processing', 'on_hold', 'cancelled', 'completed'];
  if (!allowed.includes(new_status)) {
    return c.json({ error: 'The requested status is invalid.' }, 400);
  }

  const request = await findJobRequest(db, idParam);
  if (!request) return c.json({ error: 'Project request not found.' }, 404);

  let stepName = request.current_step_name || 'Staff Processing';
  if (new_status === 'on_hold') stepName = 'Pending / On Hold';
  if (new_status === 'cancelled') stepName = 'Cancelled';
  if (new_status === 'completed') stepName = 'Completed';
  if (new_status === 'staff_processing') stepName = 'Staff Processing';

  await db.prepare(
    'UPDATE job_requests SET status = ?, current_step_name = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?'
  ).bind(new_status, stepName, request.id).run();

  const actionName = new_status === 'on_hold' ? 'STATUS_PENDING' : new_status === 'cancelled' ? 'STATUS_CANCELLED' : new_status === 'completed' ? 'COMPLETE' : 'STATUS_RESUMED';

  await db.prepare(
    `INSERT INTO workflow_logs (job_request_id, action, actor_id, actor_name, from_step_name, to_step_name, comment)
     VALUES (?, ?, ?, ?, ?, ?, ?)`
  ).bind(request.id, actionName, user.id, user.name, request.current_step_name || 'In Progress', stepName, reason || `Status changed to ${stepName}`).run();

  if (new_status === 'cancelled') {
    const origin = c.req.header('origin') || 'https://cdi-app.amanmana.workers.dev';
    await notifyClientCancellation({
      clientEmail: request.client_email,
      clientName: request.client_name,
      ticketNo: request.ticket_no,
      title: request.title,
      managerName: user.name,
      managerUnit: user.unit,
      reason: reason || 'Project cancelled by Manager',
      origin,
    });
  }

  return c.json({ success: true, message: `Project status successfully updated to ${stepName}.` });
});

// POST /api/job-requests/:id/update-team - Update assigned staff team
jobRequestsRouter.post('/:id/update-team', async (c) => {
  const db = c.env.DB;
  const user = c.get('user');
  const idParam = c.req.param('id');
  const { staff_ids, staff_tasks } = await c.req.json();

  const request = await findJobRequest(db, idParam);
  if (!request) return c.json({ error: 'Job request not found' }, 404);

  const assignedStr = Array.isArray(staff_ids) ? staff_ids.join(',') : '';

  // Merge staff_tasks into additional_data
  let additionalDataObj: any = {};
  if (request.additional_data) {
    try {
      additionalDataObj = JSON.parse(request.additional_data);
    } catch (e) {}
  }
  if (staff_tasks && typeof staff_tasks === 'object') {
    additionalDataObj.staff_tasks = {
      ...(additionalDataObj.staff_tasks || {}),
      ...staff_tasks,
    };
  }
  const additionalDataStr = JSON.stringify(additionalDataObj);

  // Automatically set status to staff_processing when staff is assigned
  let newStatus = request.status;
  let newStepName = request.current_step_name;
  if ((request.status === 'manager_approval' || request.status === 'pending') && Array.isArray(staff_ids) && staff_ids.length > 0) {
    newStatus = 'staff_processing';
    newStepName = 'Staff Processing';
  }

  await db.prepare(`
    UPDATE job_requests SET assigned_staff_ids = ?, status = ?, current_step_name = ?, additional_data = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?
  `).bind(assignedStr, newStatus, newStepName, additionalDataStr, request.id).run();

  // Upsert task rows into job_tasks table for individual assigned staff
  if (staff_tasks && typeof staff_tasks === 'object') {
    for (const [sIdStr, taskText] of Object.entries(staff_tasks)) {
      const sId = Number(sIdStr);
      if (!isNaN(sId) && typeof taskText === 'string' && taskText.trim()) {
        const existingTask = await db.prepare(
          `SELECT id FROM job_tasks WHERE job_request_id = ? AND assigned_to_user_id = ? LIMIT 1`
        ).bind(request.id, sId).first<{ id: number }>();

        if (existingTask) {
          await db.prepare(
            `UPDATE job_tasks SET title = ? WHERE id = ?`
          ).bind(taskText.trim(), existingTask.id).run();
        } else {
          await db.prepare(
            `INSERT INTO job_tasks (job_request_id, title, assigned_to_user_id, assigned_by_user_id, status) VALUES (?, ?, ?, ?, 'pending')`
          ).bind(request.id, taskText.trim(), sId, user.id).run();
        }
      }
    }
  }

  let staffDetailsParts: string[] = [];
  if (Array.isArray(staff_ids) && staff_ids.length > 0) {
    const placeholders = staff_ids.map(() => '?').join(',');
    const { results: staffUsers } = await db.prepare(`
      SELECT id, name, email FROM users WHERE id IN (${placeholders})
    `).bind(...staff_ids).all<{ id: number; name: string; email: string }>();
    if (staffUsers && staffUsers.length > 0) {
      staffDetailsParts = staffUsers.map((u: any) => {
        const taskText = staff_tasks && staff_tasks[u.id] ? String(staff_tasks[u.id]).trim() : (additionalDataObj.staff_tasks?.[u.id] || '');
        return taskText ? `${u.name} (Task: "${taskText}")` : u.name;
      });

      const origin = c.req.header('origin') || 'https://cdi-app.amanmana.workers.dev';
      for (const sUser of staffUsers) {
        const sTask = staff_tasks && staff_tasks[sUser.id] ? String(staff_tasks[sUser.id]).trim() : (additionalDataObj.staff_tasks?.[sUser.id] || '');
        await notifyStaffAssignment({
          staffEmail: sUser.email,
          staffName: sUser.name,
          ticketNo: request.ticket_no,
          title: request.title,
          unit: request.unit,
          clientName: request.client_name,
          managerName: user.name,
          startDate: request.start_date,
          deadline: request.deadline,
          comment: sTask || 'You have been assigned to handle this project.',
          origin,
        });
      }
    }
  }

  const logComment = staffDetailsParts.length > 0
    ? `Updated team assignment to: ${staffDetailsParts.join(', ')}`
    : 'Updated team assignment: None';

  await db.prepare(`
    INSERT INTO workflow_logs (job_request_id, action, actor_id, actor_name, comment, created_at)
    VALUES (?, 'UPDATE_TEAM', ?, ?, ?, datetime('now', '+8 hours'))
  `).bind(request.id, user.id, user.name, logComment).run();

  return c.json({ success: true, message: 'Assigned staff updated.' });
});

// POST /api/job-requests/:id/update-timeline - Update start and deadline dates
jobRequestsRouter.post('/:id/update-timeline', async (c) => {
  const db = c.env.DB;
  const user = c.get('user');
  const idParam = c.req.param('id');
  const { start_date, deadline, reason } = await c.req.json();

  const request = await findJobRequest(db, idParam);
  if (!request) return c.json({ error: 'Job request not found' }, 404);

  await db.prepare(`
    UPDATE job_requests SET start_date = ?, deadline = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?
  `).bind(start_date || null, deadline || null, request.id).run();

  const logComment = reason && reason.trim()
    ? `Updated project timeline: ${start_date} to ${deadline} — Reason: ${reason.trim()}`
    : `Updated project timeline: ${start_date} to ${deadline}`;

  await db.prepare(`
    INSERT INTO workflow_logs (job_request_id, action, actor_id, actor_name, comment)
    VALUES (?, 'UPDATE_TIMELINE', ?, ?, ?)
  `).bind(request.id, user.id, user.name, logComment).run();

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

// POST /api/job-requests/:id/reset-dev - Dev reset request to Pending Approval
jobRequestsRouter.post('/:id/reset-dev', async (c) => {
  const db = c.env.DB;
  const user = c.get('user');
  const idParam = c.req.param('id');

  const request = await findJobRequest(db, idParam);
  if (!request) return c.json({ error: 'Job request not found' }, 404);

  // Reset status to manager_approval and step to Manager Review
  await db.prepare(`
    UPDATE job_requests 
    SET status = 'manager_approval', 
        current_step_name = 'Manager Review', 
        updated_at = CURRENT_TIMESTAMP 
    WHERE id = ?
  `).bind(request.id).run();

  // Clear workflow_logs for STAFF_DONE if any
  await db.prepare(`
    DELETE FROM workflow_logs 
    WHERE job_request_id = ? AND action = 'STAFF_DONE'
  `).bind(request.id).run();

  // Log DEV_RESET action
  await db.prepare(`
    INSERT INTO workflow_logs (job_request_id, action, actor_id, actor_name, from_step_name, to_step_name, comment)
    VALUES (?, 'DEV_RESET', ?, ?, ?, 'Manager Review', 'Developer reset project status back to Pending Manager Approval')
  `).bind(request.id, user.id, user.name, request.current_step_name || 'In Progress').run();

  return c.json({ success: true, message: 'Request status reset to Pending Approval.' });
});

export default jobRequestsRouter;
