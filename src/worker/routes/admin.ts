import { Hono } from 'hono';
import { D1Database } from '@cloudflare/workers-types';
import { AuthUser, verifyToken, hashPassword } from '../auth';

type Env = {
  Bindings: {
    DB: D1Database;
  };
  Variables: {
    user: AuthUser;
  };
};

const admin = new Hono<Env>();

admin.use('*', async (c, next) => {
  const authHeader = c.req.header('Authorization');
  const token = authHeader ? authHeader.replace('Bearer ', '') : null;
  if (!token) return c.json({ error: 'Unauthorized' }, 401);

  const user = await verifyToken(token);
  if (!user) return c.json({ error: 'Session expired' }, 401);

  c.set('user', user);
  await next();
});

// Dashboard Stats
admin.get('/dashboard-stats', async (c) => {
  const db = c.env.DB;
  const user = c.get('user');

  let whereClause = '';
  const params: any[] = [];

  // Scoping for Staff vs Manager/Admin
  if (user.role === 'staff') {
    whereClause = ' WHERE INSTR(\',\' || assigned_staff_ids || \',\', \',\' || ? || \',\') > 0 AND status != \'manager_approval\'';
    params.push(String(user.id));
  } else if (user.role === 'client') {
    whereClause = ' WHERE (client_email = ? OR client_name = ?)';
    params.push(user.email, user.name);
  }



  const totalRequests = await db.prepare(`SELECT COUNT(*) as count FROM job_requests ${whereClause}`).bind(...params).first<{ count: number }>();
  
  const pendingParams = [...params];
  const pendingClause = whereClause ? `${whereClause} AND status = 'manager_approval'` : " WHERE status = 'manager_approval'";
  const pendingApprovals = await db.prepare(`SELECT COUNT(*) as count FROM job_requests ${pendingClause}`).bind(...pendingParams).first<{ count: number }>();

  const procParams = [...params];
  const procClause = whereClause ? `${whereClause} AND status = 'staff_processing'` : " WHERE status = 'staff_processing'";
  const processing = await db.prepare(`SELECT COUNT(*) as count FROM job_requests ${procClause}`).bind(...procParams).first<{ count: number }>();

  const compParams = [...params];
  const compClause = whereClause 
    ? `${whereClause} AND (status = 'completed' OR id IN (SELECT DISTINCT job_request_id FROM workflow_logs WHERE action = 'STAFF_DONE'))` 
    : " WHERE (status = 'completed' OR id IN (SELECT DISTINCT job_request_id FROM workflow_logs WHERE action = 'STAFF_DONE'))";
  const completed = await db.prepare(`SELECT COUNT(*) as count FROM job_requests ${compClause}`).bind(...compParams).first<{ count: number }>();

  const totalStaff = await db.prepare('SELECT COUNT(*) as count FROM users WHERE role = "staff"').first<{ count: number }>();
  const totalUsers = await db.prepare('SELECT COUNT(*) as count FROM users').first<{ count: number }>();

  const { results: recentRequests } = await db.prepare(
    `SELECT * FROM job_requests ${whereClause} ORDER BY created_at DESC LIMIT 5`
  ).bind(...params).all();

  return c.json({
    stats: {
      totalRequests: totalRequests?.count || 0,
      pendingApprovals: pendingApprovals?.count || 0,
      processing: processing?.count || 0,
      completed: completed?.count || 0,
      totalStaff: totalStaff?.count || 0,
      totalUsers: totalUsers?.count || 0,
    },
    recentRequests: recentRequests || [],
  });
});

// Gantt Chart Data
admin.get('/gantt', async (c) => {
  const db = c.env.DB;
  const { results } = await db.prepare(`
    SELECT j.*, 
           (SELECT GROUP_CONCAT(name, ', ') FROM users WHERE INSTR(',' || j.assigned_staff_ids || ',', ',' || id || ',') > 0) as assigned_staff_name,
           (SELECT COUNT(*) FROM job_tasks WHERE job_request_id = j.id) as total_staff,
           (SELECT COUNT(*) FROM job_tasks WHERE job_request_id = j.id AND status = 'completed') as completed_staff
    FROM job_requests j
    ORDER BY j.created_at DESC
  `).all();

  return c.json(results || []);
});

// Team workload list & delegations
admin.get('/team', async (c) => {
  const db = c.env.DB;
  const { results: staffMembers } = await db.prepare(`
    SELECT u.id, u.name, u.email, u.role, u.unit,
           (SELECT COUNT(*) FROM job_tasks WHERE assigned_to_user_id = u.id) as assigned_jobs_count,
           (SELECT COUNT(*) FROM job_tasks WHERE assigned_to_user_id = u.id AND status = 'completed') as completed_jobs_count
    FROM users u
    WHERE u.role IN ('staff', 'manager')
    ORDER BY u.name ASC
  `).all();

  const { results: delegations } = await db.prepare(`
    SELECT d.*, m.name as manager_name, del.name as delegate_name
    FROM delegations d
    JOIN users m ON d.manager_id = m.id
    JOIN users del ON d.delegate_id = del.id
    ORDER BY d.created_at DESC
  `).all();

  return c.json({
    staffMembers: staffMembers || [],
    delegations: delegations || [],
  });
});

// Create Delegation
admin.post('/team/delegation', async (c) => {
  const db = c.env.DB;
  const user = c.get('user');
  const { delegate_id, start_date, end_date } = await c.req.json();

  if (!delegate_id || !start_date || !end_date) {
    return c.json({ error: 'Missing required fields' }, 400);
  }

  await db.prepare(`
    INSERT INTO delegations (manager_id, delegate_id, unit, start_date, end_date, status)
    VALUES (?, ?, ?, ?, ?, 'active')
  `).bind(user.id, delegate_id, user.unit || 'General', start_date, end_date).run();

  return c.json({ success: true, message: 'Delegation created' });
});

// Cancel Delegation
admin.post('/team/delegation/:id/cancel', async (c) => {
  const db = c.env.DB;
  const id = c.req.param('id');

  await db.prepare('UPDATE delegations SET status = "cancelled" WHERE id = ?').bind(id).run();

  return c.json({ success: true, message: 'Delegation cancelled' });
});

// Units List
admin.get('/units', async (c) => {
  const db = c.env.DB;
  const { results } = await db.prepare('SELECT * FROM units ORDER BY name ASC').all();
  const formatted = (results || []).map((u: any) => ({
    ...u,
    form_schema: u.form_schema ? JSON.parse(u.form_schema) : [],
  }));
  return c.json(formatted);
});

// Add Unit
admin.post('/units', async (c) => {
  const db = c.env.DB;
  const { name } = await c.req.json();
  if (!name) return c.json({ error: 'Name is required' }, 400);

  await db.prepare('INSERT INTO units (name, form_schema) VALUES (?, "[]")').bind(name).run();
  return c.json({ success: true, message: 'Unit added' });
});

// Update Unit (name and/or schema) — cascades name change to all users in that unit
admin.put('/units/:id', async (c) => {
  const db = c.env.DB;
  const id = c.req.param('id');
  const { name, form_schema } = await c.req.json();

  // Fetch current unit name before update (needed for cascade)
  const existing = await db.prepare('SELECT name FROM units WHERE id = ?').bind(id).first<{ name: string }>();
  const oldName = existing?.name;

  if (name !== undefined && form_schema !== undefined) {
    await db.prepare('UPDATE units SET name = ?, form_schema = ? WHERE id = ?')
      .bind(name, JSON.stringify(form_schema || []), id)
      .run();
  } else if (name !== undefined) {
    await db.prepare('UPDATE units SET name = ? WHERE id = ?')
      .bind(name, id)
      .run();
  } else {
    await db.prepare('UPDATE units SET form_schema = ? WHERE id = ?')
      .bind(JSON.stringify(form_schema || []), id)
      .run();
  }

  // Cascade: update all users who had the old unit name
  if (name !== undefined && oldName && oldName !== name) {
    await db.prepare('UPDATE users SET unit = ? WHERE unit = ?')
      .bind(name, oldName)
      .run();
  }

  return c.json({ success: true, message: 'Unit updated' });
});

// Delete Unit
admin.delete('/units/:id', async (c) => {
  const db = c.env.DB;
  const id = c.req.param('id');
  await db.prepare('DELETE FROM units WHERE id = ?').bind(id).run();
  return c.json({ success: true, message: 'Unit deleted' });
});

// Users CRUD
admin.get('/users', async (c) => {
  const db = c.env.DB;
  const { results } = await db.prepare('SELECT id, name, email, role, unit, created_at FROM users ORDER BY id ASC').all();
  return c.json(results || []);
});

// Add User
admin.post('/users', async (c) => {
  const db = c.env.DB;
  const { name, email, password, role, unit } = await c.req.json();
  if (!name || !email || !password) return c.json({ error: 'Missing required fields' }, 400);

  const cleanEmail = email.toLowerCase().trim();

  try {
    const existing = await db.prepare('SELECT id FROM users WHERE LOWER(email) = ?').bind(cleanEmail).first();
    if (existing) {
      return c.json({ error: `Email address '${cleanEmail}' is already registered.` }, 400);
    }

    const hash = await hashPassword(password);
    await db.prepare('INSERT INTO users (name, email, password_hash, role, unit) VALUES (?, ?, ?, ?, ?)')
      .bind(name.trim(), cleanEmail, hash, role || 'staff', unit || null)
      .run();

    return c.json({ success: true, message: 'User created' });
  } catch (err: any) {
    return c.json({ error: err?.message || 'Failed to create user' }, 400);
  }
});

// Update User
admin.put('/users/:id', async (c) => {
  const db = c.env.DB;
  const id = c.req.param('id');
  const { name, email, password, role, unit } = await c.req.json();

  const numId = parseInt(id, 10);
  const targetId = isNaN(numId) ? id : numId;
  const cleanEmail = email.toLowerCase().trim();

  try {
    const existing = await db.prepare('SELECT id FROM users WHERE LOWER(email) = ? AND id != ? AND CAST(id AS TEXT) != ?')
      .bind(cleanEmail, targetId, String(id))
      .first();
    if (existing) {
      return c.json({ error: `Email address '${cleanEmail}' is already registered to another user.` }, 400);
    }

    if (password) {
      const hash = await hashPassword(password);
      await db.prepare('UPDATE users SET name = ?, email = ?, password_hash = ?, role = ?, unit = ? WHERE id = ? OR CAST(id AS TEXT) = ?')
        .bind(name.trim(), cleanEmail, hash, role, unit || null, targetId, id)
        .run();
    } else {
      await db.prepare('UPDATE users SET name = ?, email = ?, role = ?, unit = ? WHERE id = ? OR CAST(id AS TEXT) = ?')
        .bind(name.trim(), cleanEmail, role, unit || null, targetId, id)
        .run();
    }

    return c.json({ success: true, message: 'User updated' });
  } catch (err: any) {
    return c.json({ error: err?.message || 'Failed to update user' }, 400);
  }
});

// Delete User (Cascades child references in delegations, job_tasks, and staff_reports before deleting user)
admin.delete('/users/:id', async (c) => {
  const db = c.env.DB;
  const idParam = c.req.param('id');
  const numId = parseInt(idParam, 10);

  try {
    if (!isNaN(numId)) {
      // 1. Delete associated delegations
      await db.prepare('DELETE FROM delegations WHERE manager_id = ? OR delegate_id = ?').bind(numId, numId).run();

      // 2. Delete associated job tasks assigned to or by this user
      await db.prepare('DELETE FROM job_tasks WHERE assigned_to_user_id = ? OR assigned_by_user_id = ?').bind(numId, numId).run();

      // 3. Delete associated staff reports
      await db.prepare('DELETE FROM staff_reports WHERE staff_id = ?').bind(numId).run();

      // 4. Delete user record
      await db.prepare('DELETE FROM users WHERE id = ?').bind(numId).run();
    } else {
      await db.prepare('DELETE FROM users WHERE CAST(id AS TEXT) = ?').bind(idParam).run();
    }

    return c.json({ success: true, message: 'User deleted successfully' });
  } catch (err: any) {
    console.error('Failed to delete user:', err);
    return c.json({ error: 'Failed to delete user: ' + err.message }, 500);
  }
});

// Settings
admin.get('/settings', async (c) => {
  const db = c.env.DB;
  const { results } = await db.prepare('SELECT key, value FROM system_settings').all();
  const settings: Record<string, string> = {};
  (results || []).forEach((row: any) => {
    settings[row.key] = row.value;
  });
  return c.json(settings);
});

admin.post('/settings', async (c) => {
  const db = c.env.DB;
  const data = await c.req.json();

  for (const [key, value] of Object.entries(data)) {
    await db.prepare('INSERT OR REPLACE INTO system_settings (key, value) VALUES (?, ?)')
      .bind(key, String(value))
      .run();
  }

  return c.json({ success: true, message: 'Settings saved' });
});

// Backup export
admin.get('/backup/export', async (c) => {
  const db = c.env.DB;
  const users = await db.prepare('SELECT * FROM users').all();
  const requests = await db.prepare('SELECT * FROM job_requests').all();
  const tasks = await db.prepare('SELECT * FROM job_tasks').all();
  const logs = await db.prepare('SELECT * FROM workflow_logs').all();
  const reports = await db.prepare('SELECT * FROM staff_reports').all();

  return c.json({
    timestamp: new Date().toISOString(),
    users: users.results,
    job_requests: requests.results,
    job_tasks: tasks.results,
    workflow_logs: logs.results,
    staff_reports: reports.results,
  });
});

export default admin;
