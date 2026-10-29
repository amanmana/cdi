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

  const payload = await verifyToken(token);
  if (!payload) return c.json({ error: 'Session expired' }, 401);

  const freshUser = await c.env.DB
    .prepare(`
      SELECT u.id, u.name, u.email, u.role, u.unit_id, u.is_unit_head,
             COALESCE(u.department_id, un.department_id, d.id) as department_id,
             COALESCE(un.name, u.unit) as unit,
             d.id as managed_department_id,
             COALESCE(d.name, dept.name) as department_name
      FROM users u 
      LEFT JOIN units un ON (u.unit_id = un.id OR u.unit = un.name) 
      LEFT JOIN departments d ON d.manager_id = u.id
      LEFT JOIN departments dept ON (u.department_id = dept.id OR un.department_id = dept.id)
      WHERE u.id = ?
    `)
    .bind(payload.id)
    .first<any>();

  if (freshUser) {
    const today = new Date().toISOString().split('T')[0];
    const delegation = await c.env.DB
      .prepare(
        `SELECT d.*, m.unit_id as manager_unit_id, m.department_id as manager_department_id, COALESCE(un.name, m.unit) as manager_unit
         FROM delegations d
         JOIN users m ON d.manager_id = m.id
         LEFT JOIN units un ON (m.unit_id = un.id OR m.unit = un.name)
         WHERE d.delegate_id = ? AND d.status = 'active' AND d.start_date <= ? AND d.end_date >= ?
         LIMIT 1`
      )
      .bind(freshUser.id, today, today)
      .first<{ manager_unit_id: number; manager_department_id: number; manager_unit: string }>();

    c.set('user', {
      ...freshUser,
      department_id: freshUser.department_id || (delegation ? delegation.manager_department_id : null),
      is_acting_manager: !!delegation,
      acting_manager_unit_id: delegation ? delegation.manager_unit_id : null,
      acting_manager_unit: delegation ? delegation.manager_unit : null,
      acting_manager_department_id: delegation ? delegation.manager_department_id : null,
    });
  } else {
    c.set('user', payload);
  }

  await next();
});

// Dashboard Stats
admin.get('/dashboard-stats', async (c) => {
  try {
    const db = c.env.DB;
    const user = c.get('user');

    let whereClause = '';
    const params: any[] = [];

    // Scoping for Staff vs Manager vs Client
    const managerUnit = (user as any).acting_manager_unit || user.unit;
    const managerUnitId = (user as any).acting_manager_unit_id || (user as any).unit_id;
    const managerDeptId = (user as any).managed_department_id || (user as any).department_id || (user as any).acting_manager_department_id;

    if (user.role === 'staff') {
      whereClause = ' WHERE INSTR(\',\' || j.assigned_staff_ids || \',\', \',\' || ? || \',\') > 0 AND j.status != \'manager_approval\'';
      params.push(String(user.id));
    } else if (user.role === 'client') {
      whereClause = ' WHERE (j.client_email = ? OR j.client_name = ?)';
      params.push(user.email, user.name);
    } else if ((user.role === 'manager' || (user as any).is_acting_manager)) {
      if (managerDeptId) {
        whereClause = ` WHERE (
          j.department_id = ? 
          OR j.unit_id IN (SELECT id FROM units WHERE department_id = ?) 
          OR j.unit IN (SELECT name FROM units WHERE department_id = ?)
          OR j.unit_id = ? 
          OR j.unit = ?
        )`;
        params.push(managerDeptId, managerDeptId, managerDeptId, managerUnitId || 0, managerUnit || '');
      } else if (managerUnitId || managerUnit) {
        whereClause = ' WHERE (j.unit_id = ? OR j.unit = ? OR j.unit_id IN (SELECT id FROM units WHERE name = ?))';
        params.push(managerUnitId || 0, managerUnit || '', managerUnit || '');
      }
    }

    const totalRequests = await db.prepare(`SELECT COUNT(*) as count FROM job_requests j ${whereClause}`).bind(...params).first<{ count: number }>();
    
    const pendingParams = [...params];
    const pendingClause = whereClause ? `${whereClause} AND j.status = 'manager_approval'` : " WHERE j.status = 'manager_approval'";
    const pendingApprovals = await db.prepare(`SELECT COUNT(*) as count FROM job_requests j ${pendingClause}`).bind(...pendingParams).first<{ count: number }>();

    const procParams = [...params];
    const procClause = whereClause ? `${whereClause} AND j.status = 'staff_processing'` : " WHERE j.status = 'staff_processing'";
    const processing = await db.prepare(`SELECT COUNT(*) as count FROM job_requests j ${procClause}`).bind(...procParams).first<{ count: number }>();

    const compParams = [...params];
    const compClause = whereClause 
      ? `${whereClause} AND (j.status = 'completed' OR j.id IN (SELECT DISTINCT job_request_id FROM workflow_logs WHERE action = 'STAFF_DONE'))` 
      : " WHERE (j.status = 'completed' OR j.id IN (SELECT DISTINCT job_request_id FROM workflow_logs WHERE action = 'STAFF_DONE'))";
    const completed = await db.prepare(`SELECT COUNT(*) as count FROM job_requests j ${compClause}`).bind(...compParams).first<{ count: number }>();

    const holdParams = [...params];
    const holdClause = whereClause ? `${whereClause} AND j.status = 'on_hold'` : " WHERE j.status = 'on_hold'";
    const onHold = await db.prepare(`SELECT COUNT(*) as count FROM job_requests j ${holdClause}`).bind(...holdParams).first<{ count: number }>();

    const cancelParams = [...params];
    const cancelClause = whereClause ? `${whereClause} AND j.status = 'cancelled'` : " WHERE j.status = 'cancelled'";
    const cancelled = await db.prepare(`SELECT COUNT(*) as count FROM job_requests j ${cancelClause}`).bind(...cancelParams).first<{ count: number }>();

    const totalStaff = await db.prepare('SELECT COUNT(*) as count FROM users WHERE role = "staff"').first<{ count: number }>();
    const totalUsers = await db.prepare('SELECT COUNT(*) as count FROM users').first<{ count: number }>();

    const { results: recentRequests } = await db.prepare(
      `SELECT j.*, COALESCE(un.name, j.unit) as unit 
       FROM job_requests j 
       LEFT JOIN units un ON (j.unit_id = un.id OR j.unit = un.name) 
       ${whereClause} 
       ORDER BY j.created_at DESC LIMIT 5`
    ).bind(...params).all();

    return c.json({
      stats: {
        totalRequests: totalRequests?.count || 0,
        pendingApprovals: pendingApprovals?.count || 0,
        processing: processing?.count || 0,
        completed: completed?.count || 0,
        onHold: onHold?.count || 0,
        cancelled: cancelled?.count || 0,
        totalStaff: totalStaff?.count || 0,
        totalUsers: totalUsers?.count || 0,
      },
      recentRequests: recentRequests || [],
    });
  } catch (err: any) {
    console.error('Error in /dashboard-stats:', err);
    return c.json({ error: 'Failed to fetch dashboard stats', details: err?.message }, 500);
  }
});

// Gantt Chart Data
admin.get('/gantt', async (c) => {
  const db = c.env.DB;
  const { results } = await db.prepare(`
    SELECT j.*, COALESCE(un.name, j.unit) as unit,
           (SELECT GROUP_CONCAT(name, ', ') FROM users WHERE INSTR(',' || j.assigned_staff_ids || ',', ',' || id || ',') > 0) as assigned_staff_name,
           (SELECT COUNT(*) FROM job_tasks WHERE job_request_id = j.id) as total_staff,
           (SELECT COUNT(*) FROM job_tasks WHERE job_request_id = j.id AND status = 'completed') as completed_staff
    FROM job_requests j
    LEFT JOIN units un ON (j.unit_id = un.id OR j.unit = un.name)
    ORDER BY j.created_at DESC
  `).all();

  return c.json(results || []);
});

// Team workload list & delegations
admin.get('/team', async (c) => {
  const db = c.env.DB;
  const { results: staffMembers } = await db.prepare(`
    SELECT u.id, u.name, u.email, u.avatar_url, u.role, u.unit_id,
           COALESCE(u.department_id, un.department_id, d.id) as department_id,
           u.is_unit_head,
           COALESCE(un.name, u.unit) as unit,
           COALESCE(d.name, dept.name) as department_name,
           (SELECT COUNT(*) FROM job_requests WHERE (',' || assigned_staff_ids || ',') LIKE ('%,' || CAST(u.id AS TEXT) || ',%') AND status != 'completed') as assigned_jobs_count,
           (SELECT COUNT(DISTINCT job_request_id) FROM workflow_logs WHERE actor_id = u.id AND action = 'STAFF_DONE') as completed_jobs_count
    FROM users u
    LEFT JOIN units un ON (u.unit_id = un.id OR u.unit = un.name)
    LEFT JOIN departments d ON (u.department_id = d.id OR un.department_id = d.id)
    LEFT JOIN departments dept ON dept.manager_id = u.id
    WHERE u.role IN ('staff', 'manager') AND u.role != 'admin' AND u.id != 1 AND LOWER(u.name) NOT LIKE '%admin%'
    ORDER BY u.name ASC
  `).all();

  const { results: delegations } = await db.prepare(`
    SELECT d.*, m.name as manager_name, del.name as delegate_name, COALESCE(un.name, d.unit) as unit
    FROM delegations d
    JOIN users m ON d.manager_id = m.id
    JOIN users del ON d.delegate_id = del.id
    LEFT JOIN units un ON (d.unit_id = un.id OR d.unit = un.name)
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
    INSERT INTO delegations (manager_id, delegate_id, unit_id, unit, start_date, end_date, status)
    VALUES (?, ?, ?, ?, ?, ?, 'active')
  `).bind(user.id, delegate_id, (user as any).unit_id || null, user.unit || 'General', start_date, end_date).run();

  return c.json({ success: true, message: 'Delegation created' });
});

// Cancel Delegation
admin.post('/team/delegation/:id/cancel', async (c) => {
  const db = c.env.DB;
  const id = c.req.param('id');

  await db.prepare('UPDATE delegations SET status = "cancelled" WHERE id = ?').bind(id).run();

  return c.json({ success: true, message: 'Delegation cancelled' });
});

// ==========================================
// DEPARTMENTS CRUD & ORG STRUCTURE
// ==========================================

// List Departments (with Manager info and Units nested)
admin.get('/departments', async (c) => {
  const db = c.env.DB;
  const { results: depts } = await db.prepare(`
    SELECT d.*, m.name as manager_name, m.email as manager_email,
           (SELECT COUNT(*) FROM units WHERE units.department_id = d.id) as units_count,
           (SELECT COUNT(*) FROM users u WHERE u.department_id = d.id OR u.unit_id IN (SELECT id FROM units WHERE department_id = d.id)) as staff_count
    FROM departments d
    LEFT JOIN users m ON d.manager_id = m.id
    ORDER BY d.id ASC
  `).all();

  const { results: allUnits } = await db.prepare(`
    SELECT u.*, h.name as head_name,
           (SELECT COUNT(*) FROM users WHERE users.unit_id = u.id OR users.unit = u.name) as staff_count
    FROM units u
    LEFT JOIN users h ON u.head_id = h.id
    ORDER BY u.name ASC
  `).all();

  const formatted = (depts || []).map((d: any) => ({
    ...d,
    units: (allUnits || []).filter((u: any) => u.department_id === d.id),
  }));

  return c.json(formatted);
});

// Add Department
admin.post('/departments', async (c) => {
  const db = c.env.DB;
  const { name, description, manager_id } = await c.req.json();
  if (!name || !name.trim()) return c.json({ error: 'Department name is required' }, 400);

  const cleanName = name.trim();
  const res = await db.prepare('INSERT INTO departments (name, description, manager_id) VALUES (?, ?, ?)')
    .bind(cleanName, description || null, manager_id || null)
    .run();

  const newDeptId = res.meta.last_row_id as number;

  if (manager_id) {
    await db.prepare('UPDATE users SET department_id = ? WHERE id = ?').bind(newDeptId, manager_id).run();
  }

  return c.json({ success: true, message: 'Department created successfully', id: newDeptId });
});

// Update Department
admin.put('/departments/:id', async (c) => {
  const db = c.env.DB;
  const id = c.req.param('id');
  const numId = parseInt(id, 10);
  const { name, description, manager_id } = await c.req.json();

  if (!name || !name.trim()) return c.json({ error: 'Department name is required' }, 400);

  await db.prepare('UPDATE departments SET name = ?, description = ?, manager_id = ? WHERE id = ?')
    .bind(name.trim(), description || null, manager_id || null, numId)
    .run();

  if (manager_id) {
    await db.prepare('UPDATE users SET department_id = ? WHERE id = ?').bind(numId, manager_id).run();
  }

  return c.json({ success: true, message: 'Department updated successfully' });
});

// Delete Department (Unlinks units & users)
admin.delete('/departments/:id', async (c) => {
  const db = c.env.DB;
  const id = c.req.param('id');
  const numId = parseInt(id, 10);

  await db.prepare('UPDATE units SET department_id = NULL WHERE department_id = ?').bind(numId).run();
  await db.prepare('UPDATE users SET department_id = NULL WHERE department_id = ?').bind(numId).run();
  await db.prepare('DELETE FROM departments WHERE id = ?').bind(numId).run();

  return c.json({ success: true, message: 'Department deleted successfully' });
});

// ==========================================
// UNITS CRUD & PUBLIC DISPLAY CONFIGURATION
// ==========================================

// Units List (Includes Department, Head, and Public Label details)
admin.get('/units', async (c) => {
  const db = c.env.DB;
  const { results } = await db.prepare(`
    SELECT u.*, 
           d.name as department_name,
           h.name as head_name,
           h.email as head_email,
           (SELECT COUNT(*) FROM users WHERE users.unit_id = u.id OR users.unit = u.name) as staff_count 
    FROM units u 
    LEFT JOIN departments d ON u.department_id = d.id
    LEFT JOIN users h ON u.head_id = h.id
    ORDER BY COALESCE(d.id, 999) ASC, u.name ASC
  `).all();

  const formatted = (results || []).map((u: any) => ({
    ...u,
    display_label: u.public_label && u.public_label.trim() ? u.public_label.trim() : u.name,
    form_schema: u.form_schema ? JSON.parse(u.form_schema) : [],
    staff_count: u.staff_count || 0
  }));
  return c.json(formatted);
});

// Add Unit
admin.post('/units', async (c) => {
  const db = c.env.DB;
  const { name, department_id, public_label, is_public, head_id } = await c.req.json();
  if (!name || !name.trim()) return c.json({ error: 'Name is required' }, 400);

  const cleanName = name.trim();
  const res = await db.prepare(
    'INSERT INTO units (name, department_id, public_label, is_public, head_id, form_schema) VALUES (?, ?, ?, ?, ?, "[]")'
  )
    .bind(
      cleanName,
      department_id || null,
      public_label ? public_label.trim() : null,
      is_public !== undefined ? (is_public ? 1 : 0) : 1,
      head_id || null
    )
    .run();

  const newUnitId = res.meta.last_row_id as number;

  if (head_id) {
    await db.prepare('UPDATE users SET is_unit_head = 1, unit_id = ?, department_id = COALESCE(?, department_id) WHERE id = ?')
      .bind(newUnitId, department_id || null, head_id)
      .run();
  }

  return c.json({ success: true, message: 'Unit added', id: newUnitId });
});

// Update Unit (name, department, public_label, is_public, head_id, form_schema)
admin.put('/units/:id', async (c) => {
  const db = c.env.DB;
  const id = c.req.param('id');
  const numId = parseInt(id, 10);
  const { name, department_id, public_label, is_public, head_id, form_schema } = await c.req.json();

  // Fetch current unit info before update (needed for cascade)
  const existing = await db.prepare('SELECT name, head_id FROM units WHERE id = ?').bind(numId).first<any>();
  const oldName = existing?.name;
  const oldHeadId = existing?.head_id;

  const updates: string[] = [];
  const params: any[] = [];

  if (name !== undefined) {
    updates.push('name = ?');
    params.push(name.trim());
  }
  if (department_id !== undefined) {
    updates.push('department_id = ?');
    params.push(department_id || null);
  }
  if (public_label !== undefined) {
    updates.push('public_label = ?');
    params.push(public_label ? public_label.trim() : null);
  }
  if (is_public !== undefined) {
    updates.push('is_public = ?');
    params.push(is_public ? 1 : 0);
  }
  if (head_id !== undefined) {
    updates.push('head_id = ?');
    params.push(head_id || null);
  }
  if (form_schema !== undefined) {
    updates.push('form_schema = ?');
    params.push(JSON.stringify(form_schema || []));
  }

  if (updates.length > 0) {
    params.push(numId);
    await db.prepare(`UPDATE units SET ${updates.join(', ')} WHERE id = ?`).bind(...params).run();
  }

  // Sync unit head status
  if (head_id !== undefined && head_id !== oldHeadId) {
    if (oldHeadId) {
      await db.prepare('UPDATE users SET is_unit_head = 0 WHERE id = ?').bind(oldHeadId).run();
    }
    if (head_id) {
      await db.prepare('UPDATE users SET is_unit_head = 1, unit_id = ?, department_id = COALESCE(?, department_id) WHERE id = ?')
        .bind(numId, department_id || null, head_id)
        .run();
    }
  }

  // Cascade name changes if name updated
  if (name !== undefined && oldName && oldName !== name.trim()) {
    const newName = name.trim();
    await db.prepare('UPDATE users SET unit = ?, unit_id = ? WHERE unit = ? OR unit_id = ?')
      .bind(newName, numId, oldName, numId)
      .run();
    await db.prepare('UPDATE job_requests SET unit = ?, unit_id = ? WHERE unit = ? OR unit_id = ?')
      .bind(newName, numId, oldName, numId)
      .run();
    await db.prepare('UPDATE delegations SET unit = ?, unit_id = ? WHERE unit = ? OR unit_id = ?')
      .bind(newName, numId, oldName, numId)
      .run();
  }

  return c.json({ success: true, message: 'Unit updated' });
});

// Delete Unit (Blocked if staff or job requests are assigned to it)
admin.delete('/units/:id', async (c) => {
  const db = c.env.DB;
  const id = c.req.param('id');
  const numId = parseInt(id, 10);

  const unit = await db.prepare('SELECT id, name FROM units WHERE id = ?').bind(numId).first<{ id: number; name: string }>();
  if (!unit) {
    return c.json({ error: 'Unit not found' }, 404);
  }

  // Check if any users belong to this unit
  const assigned = await db.prepare('SELECT COUNT(*) as count FROM users WHERE unit_id = ? OR unit = ?').bind(numId, unit.name).first<{ count: number }>();
  if (assigned && assigned.count > 0) {
    return c.json({
      error: `Tidak boleh memadam unit '${unit.name}' kerana terdapat ${assigned.count} orang pengguna/staf di dalamnya. Sila tukar unit pengguna tersebut terlebih dahulu.`
    }, 400);
  }

  // Check if any job requests belong to this unit
  const assignedJobs = await db.prepare('SELECT COUNT(*) as count FROM job_requests WHERE unit_id = ? OR unit = ?').bind(numId, unit.name).first<{ count: number }>();
  if (assignedJobs && assignedJobs.count > 0) {
    return c.json({
      error: `Cannot delete unit '${unit.name}' because it has ${assignedJobs.count} job request(s) assigned to it.`
    }, 400);
  }

  await db.prepare('DELETE FROM units WHERE id = ?').bind(numId).run();
  return c.json({ success: true, message: 'Unit deleted' });
});

// Users CRUD
admin.get('/users', async (c) => {
  const db = c.env.DB;
  const { results } = await db.prepare(`
    SELECT u.id, u.name, u.email, u.avatar_url, u.role, u.unit, u.unit_id,
           COALESCE(u.department_id, d.id, dept.id) as department_id,
           u.is_unit_head, u.created_at,
           COALESCE(d.name, dept.name) as department_name,
           (SELECT COUNT(*) FROM job_requests j WHERE j.client_email = u.email OR LOWER(TRIM(j.client_name)) = LOWER(TRIM(u.name))) as project_count
    FROM users u
    LEFT JOIN departments d ON u.department_id = d.id
    LEFT JOIN departments dept ON dept.manager_id = u.id
    ORDER BY u.id ASC
  `).all();
  return c.json(results || []);
});

// Add User
admin.post('/users', async (c) => {
  const db = c.env.DB;
  const { name, email, password, role, unit, department_id, is_unit_head } = await c.req.json();
  if (!name || !email || !password) return c.json({ error: 'Missing required fields' }, 400);

  const cleanEmail = email.toLowerCase().trim();

  try {
    const existing = await db.prepare('SELECT id FROM users WHERE LOWER(email) = ?').bind(cleanEmail).first();
    if (existing) {
      return c.json({ error: 'Email address is already in use. Please use a different email.' }, 400);
    }

    const isManager = role === 'manager';
    const unitRow = (!isManager && unit) ? await db.prepare('SELECT id, department_id FROM units WHERE name = ?').bind(unit).first<any>() : null;
    const unitId = unitRow?.id || null;
    const resolvedDeptId = isManager ? (department_id ? Number(department_id) : null) : (unitRow?.department_id || null);
    const resolvedUnit = isManager ? null : (unit || null);
    const resolvedIsUnitHead = isManager ? 0 : (is_unit_head ? 1 : 0);

    const hash = await hashPassword(password);
    const res = await db.prepare('INSERT INTO users (name, email, password_hash, role, unit_id, unit, department_id, is_unit_head) VALUES (?, ?, ?, ?, ?, ?, ?, ?)')
      .bind(name.trim(), cleanEmail, hash, role || 'staff', unitId, resolvedUnit, resolvedDeptId, resolvedIsUnitHead)
      .run();

    const newUserId = res.meta.last_row_id as number;

    if (isManager && resolvedDeptId) {
      await db.prepare('UPDATE departments SET manager_id = ? WHERE id = ?').bind(newUserId, resolvedDeptId).run();
    }

    return c.json({ success: true, message: 'User created' });
  } catch (err: any) {
    return c.json({ error: err?.message || 'Failed to create user' }, 400);
  }
});

// Update User
admin.put('/users/:id', async (c) => {
  const db = c.env.DB;
  const id = c.req.param('id');
  const { name, email, password, role, unit, department_id, is_unit_head } = await c.req.json();

  const numId = parseInt(id, 10);
  const targetId = isNaN(numId) ? id : numId;
  const cleanEmail = email.toLowerCase().trim();

  try {
    const existing = await db.prepare('SELECT id FROM users WHERE LOWER(email) = ? AND id != ? AND CAST(id AS TEXT) != ?')
      .bind(cleanEmail, targetId, String(id))
      .first();
    if (existing) {
      return c.json({ error: 'Email address is already in use by another user. Please use a different email.' }, 400);
    }

    const isManager = role === 'manager';
    const unitRow = (!isManager && unit) ? await db.prepare('SELECT id, department_id FROM units WHERE name = ?').bind(unit).first<any>() : null;
    const unitId = unitRow?.id || null;
    const resolvedDeptId = isManager
      ? (department_id !== undefined && department_id !== '' ? Number(department_id) : null)
      : (unitRow?.department_id || null);
    const resolvedUnit = isManager ? null : (unit || null);
    const resolvedIsUnitHead = isManager ? 0 : (is_unit_head ? 1 : 0);

    if (password) {
      const hash = await hashPassword(password);
      await db.prepare('UPDATE users SET name = ?, email = ?, password_hash = ?, role = ?, unit_id = ?, unit = ?, department_id = ?, is_unit_head = ? WHERE id = ? OR CAST(id AS TEXT) = ?')
        .bind(name.trim(), cleanEmail, hash, role, unitId, resolvedUnit, resolvedDeptId, resolvedIsUnitHead, targetId, id)
        .run();
    } else {
      await db.prepare('UPDATE users SET name = ?, email = ?, role = ?, unit_id = ?, unit = ?, department_id = ?, is_unit_head = ? WHERE id = ? OR CAST(id AS TEXT) = ?')
        .bind(name.trim(), cleanEmail, role, unitId, resolvedUnit, resolvedDeptId, resolvedIsUnitHead, targetId, id)
        .run();
    }

    if (isManager && resolvedDeptId) {
      // Clear previous department if any
      await db.prepare('UPDATE departments SET manager_id = NULL WHERE manager_id = ? AND id != ?').bind(targetId, resolvedDeptId).run();
      // Link to new department
      await db.prepare('UPDATE departments SET manager_id = ? WHERE id = ?').bind(targetId, resolvedDeptId).run();
    } else if (!isManager) {
      // If user changed away from manager, clear any department manager_id pointing to this user
      await db.prepare('UPDATE departments SET manager_id = NULL WHERE manager_id = ?').bind(targetId).run();
    }

    return c.json({ success: true, message: 'User updated' });
  } catch (err: any) {
    return c.json({ error: err?.message || 'Failed to update user' }, 400);
  }
});

// Check if a user has any linked job records (for smart delete UI)
admin.get('/users/:id/job-links', async (c) => {
  const db = c.env.DB;
  const idParam = c.req.param('id');
  const numId = parseInt(idParam, 10);
  const userId = !isNaN(numId) ? numId : null;

  if (userId === null) {
    return c.json({ hasJobLinks: false });
  }

  try {
    // Fetch the user's role and email
    const userRecord = await db.prepare('SELECT id, name, email, role FROM users WHERE id = ?').bind(userId).first<{ id: number; name: string; email: string; role: string }>();
    if (!userRecord) {
      return c.json({ hasJobLinks: false });
    }

    if (userRecord.role === 'admin' || userRecord.role === 'manager' || userRecord.role === 'director') {
      return c.json({ hasJobLinks: true, reason: 'role', details: { role: userRecord.role } });
    }

    const userEmail = userRecord.email ? userRecord.email.toLowerCase().trim() : '';

    // 1. Check assigned_staff_ids and client_email in job_requests
    const jobCheck = await db.prepare(
      `SELECT COUNT(*) as count FROM job_requests 
       WHERE INSTR(',' || COALESCE(assigned_staff_ids, '') || ',', ',' || ? || ',') > 0
          OR LOWER(TRIM(client_email)) = ?`
    ).bind(String(userId), userEmail).first<{ count: number }>();

    // 2. Check job_tasks (assigned_to_user_id or assigned_by_user_id)
    const taskCheck = await db.prepare(
      `SELECT COUNT(*) as count FROM job_tasks WHERE assigned_to_user_id = ? OR assigned_by_user_id = ?`
    ).bind(userId, userId).first<{ count: number }>();

    // 3. Check workflow_logs as actor
    const logCheck = await db.prepare(
      `SELECT COUNT(*) as count FROM workflow_logs WHERE actor_id = ?`
    ).bind(userId).first<{ count: number }>();

    // 4. Check staff_reports
    const reportCheck = await db.prepare(
      `SELECT COUNT(*) as count FROM staff_reports WHERE staff_id = ?`
    ).bind(userId).first<{ count: number }>();

    // 5. Check delegations (as manager or as delegate)
    const delegationCheck = await db.prepare(
      `SELECT COUNT(*) as count FROM delegations WHERE manager_id = ? OR delegate_id = ?`
    ).bind(userId, userId).first<{ count: number }>();

    // 6. Check projects (created_by_user_id)
    const projectCheck = await db.prepare(
      `SELECT COUNT(*) as count FROM projects WHERE created_by_user_id = ?`
    ).bind(userId).first<{ count: number }>();

    const jobCount = jobCheck?.count ?? 0;
    const taskCount = taskCheck?.count ?? 0;
    const logCount = logCheck?.count ?? 0;
    const reportCount = reportCheck?.count ?? 0;
    const delegationCount = delegationCheck?.count ?? 0;
    const projectCount = projectCheck?.count ?? 0;

    const hasJobLinks =
      jobCount > 0 ||
      taskCount > 0 ||
      logCount > 0 ||
      reportCount > 0 ||
      delegationCount > 0 ||
      projectCount > 0;

    return c.json({
      hasJobLinks,
      counts: {
        jobs: jobCount,
        tasks: taskCount,
        logs: logCount,
        reports: reportCount,
        delegations: delegationCount,
        projects: projectCount,
      }
    });
  } catch (err: any) {
    console.error('Error in job-links check:', err);
    return c.json({ hasJobLinks: false, error: err.message });
  }
});

// Deactivate / Delete User (Handles clean foreign key cleanup and safe hard/soft delete)
admin.delete('/users/:id', async (c) => {
  const db = c.env.DB;
  const idParam = c.req.param('id');
  const numId = parseInt(idParam, 10);
  const userId = !isNaN(numId) ? numId : null;
  const modeParam = c.req.query('mode'); // 'permanent' or 'soft'

  if (userId === null) {
    return c.json({ error: 'Invalid user ID' }, 400);
  }

  try {
    // 1. Fetch user to check role and existence
    const userRecord = await db.prepare('SELECT id, name, email, role FROM users WHERE id = ?').bind(userId).first<any>();
    if (!userRecord) {
      return c.json({ error: 'User not found' }, 404);
    }

    // Admins cannot delete the root System Admin account (id 1)
    if (userRecord.role === 'admin' && userRecord.id === 1) {
      return c.json({ error: 'Root System Admin account cannot be deleted.' }, 400);
    }

    const userEmail = userRecord.email ? userRecord.email.toLowerCase().trim() : '';

    // 2. Check linked records across all tables
    const jobCheck = await db.prepare(
      `SELECT COUNT(*) as count FROM job_requests 
       WHERE INSTR(',' || COALESCE(assigned_staff_ids, '') || ',', ',' || ? || ',') > 0
          OR LOWER(TRIM(client_email)) = ?`
    ).bind(String(userId), userEmail).first<{ count: number }>();

    const taskCheck = await db.prepare(
      `SELECT COUNT(*) as count FROM job_tasks WHERE assigned_to_user_id = ? OR assigned_by_user_id = ?`
    ).bind(userId, userId).first<{ count: number }>();

    const logCheck = await db.prepare(
      `SELECT COUNT(*) as count FROM workflow_logs WHERE actor_id = ?`
    ).bind(userId).first<{ count: number }>();

    const reportCheck = await db.prepare(
      `SELECT COUNT(*) as count FROM staff_reports WHERE staff_id = ?`
    ).bind(userId).first<{ count: number }>();

    const delegationCheck = await db.prepare(
      `SELECT COUNT(*) as count FROM delegations WHERE manager_id = ? OR delegate_id = ?`
    ).bind(userId, userId).first<{ count: number }>();

    const projectCheck = await db.prepare(
      `SELECT COUNT(*) as count FROM projects WHERE created_by_user_id = ?`
    ).bind(userId).first<{ count: number }>();

    const hasJobLinks =
      (jobCheck?.count ?? 0) > 0 ||
      (taskCheck?.count ?? 0) > 0 ||
      (logCheck?.count ?? 0) > 0 ||
      (reportCheck?.count ?? 0) > 0 ||
      (delegationCheck?.count ?? 0) > 0 ||
      (projectCheck?.count ?? 0) > 0;

    const isPermanent = modeParam === 'permanent' || (!hasJobLinks && modeParam !== 'soft');

    if (isPermanent) {
      // Clean up foreign keys in child tables so SQLite constraint never blocks deletion:
      await db.prepare('DELETE FROM job_tasks WHERE assigned_to_user_id = ? OR assigned_by_user_id = ?').bind(userId, userId).run();
      await db.prepare('DELETE FROM staff_reports WHERE staff_id = ?').bind(userId).run();
      await db.prepare('UPDATE units SET head_id = NULL WHERE head_id = ?').bind(userId).run();
      await db.prepare('UPDATE departments SET manager_id = NULL WHERE manager_id = ?').bind(userId).run();
      await db.prepare('DELETE FROM delegations WHERE manager_id = ? OR delegate_id = ?').bind(userId, userId).run();

      // Clean up assigned_staff_ids in job_requests
      const jobsWithStaff = await db.prepare(
        `SELECT id, assigned_staff_ids FROM job_requests 
         WHERE INSTR(',' || COALESCE(assigned_staff_ids, '') || ',', ',' || ? || ',') > 0`
      ).bind(String(userId)).all<{ id: number; assigned_staff_ids: string }>();

      if (jobsWithStaff.results && jobsWithStaff.results.length > 0) {
        for (const job of jobsWithStaff.results) {
          const currentIds = (job.assigned_staff_ids || '').split(',').map((s: string) => s.trim()).filter(Boolean);
          const updatedIds = currentIds.filter((id: string) => id !== String(userId)).join(',');
          await db.prepare('UPDATE job_requests SET assigned_staff_ids = ? WHERE id = ?')
            .bind(updatedIds || null, job.id)
            .run();
        }
      }

      // Reassign or clear user-created projects to root admin (id 1)
      await db.prepare('UPDATE projects SET created_by_user_id = 1 WHERE created_by_user_id = ?').bind(userId).run();

      // Finally, delete user from users table
      await db.prepare('DELETE FROM users WHERE id = ?').bind(userId).run();

      return c.json({ success: true, type: 'hard', message: `User "${userRecord.name}" has been permanently deleted from the database.` });
    } else {
      // Soft delete / Deactivate
      await db.prepare("UPDATE users SET role = 'archived' WHERE id = ?").bind(userId).run();
      return c.json({ success: true, type: 'soft', message: `User "${userRecord.name}" has been deactivated. Historical records and audit logs are preserved.` });
    }
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

// Clear database transactions (Preserves users, units, and system_settings)
admin.post('/clear-transactions', async (c) => {
  const db = c.env.DB;
  const { confirm_text } = await c.req.json().catch(() => ({}));

  if (!confirm_text || String(confirm_text).trim().toLowerCase() !== 'clear data') {
    return c.json({ error: 'Security verification failed. You must type "clear data" to confirm.' }, 400);
  }

  try {
    await db.batch([
      db.prepare('DELETE FROM job_tasks'),
      db.prepare('DELETE FROM staff_reports'),
      db.prepare('DELETE FROM workflow_logs'),
      db.prepare('DELETE FROM delegations'),
      db.prepare('DELETE FROM job_requests'),
      db.prepare("DELETE FROM sqlite_sequence WHERE name IN ('job_requests', 'job_tasks', 'staff_reports', 'workflow_logs', 'delegations')"),
    ]);

    return c.json({
      success: true,
      message: 'Database transactions cleared successfully. Users, units, and system settings remain intact.',
    });
  } catch (err: any) {
    console.error('Failed to clear database transactions:', err);
    return c.json({ error: err?.message || 'Failed to clear database transactions.' }, 500);
  }
});

// Backup export
admin.get('/backup/export', async (c) => {
  const db = c.env.DB;
  const users = await db.prepare('SELECT * FROM users').all();
  const units = await db.prepare('SELECT * FROM units').all();
  const settings = await db.prepare('SELECT * FROM system_settings').all();
  const requests = await db.prepare('SELECT * FROM job_requests').all();
  const tasks = await db.prepare('SELECT * FROM job_tasks').all();
  const logs = await db.prepare('SELECT * FROM workflow_logs').all();
  const reports = await db.prepare('SELECT * FROM staff_reports').all();
  const delegations = await db.prepare('SELECT * FROM delegations').all();

  return c.json({
    version: '1.0',
    timestamp: new Date().toISOString(),
    users: users.results || [],
    units: units.results || [],
    system_settings: settings.results || [],
    job_requests: requests.results || [],
    job_tasks: tasks.results || [],
    workflow_logs: logs.results || [],
    staff_reports: reports.results || [],
    delegations: delegations.results || [],
  });
});

// Backup import / restore
admin.post('/backup/import', async (c) => {
  const db = c.env.DB;
  const body = await c.req.json();
  const { mode, data } = body;

  if (!data || typeof data !== 'object') {
    return c.json({ error: 'Invalid backup file format.' }, 400);
  }

  // Validate that the JSON file contains recognized system tables
  const hasValidTables =
    Array.isArray(data.users) ||
    Array.isArray(data.units) ||
    Array.isArray(data.job_requests) ||
    Array.isArray(data.system_settings) ||
    Array.isArray(data.job_tasks);

  if (!hasValidTables) {
    return c.json({
      error: 'Invalid backup file! The uploaded JSON does not contain CDI system database tables. Import aborted.',
    }, 400);
  }

  const isOverwrite = mode === 'overwrite';
  const stmts: D1PreparedStatement[] = [];

  if (isOverwrite) {
    stmts.push(
      db.prepare('DELETE FROM job_tasks'),
      db.prepare('DELETE FROM staff_reports'),
      db.prepare('DELETE FROM workflow_logs'),
      db.prepare('DELETE FROM delegations'),
      db.prepare('DELETE FROM job_requests'),
      db.prepare('DELETE FROM users'),
      db.prepare('DELETE FROM units'),
      db.prepare('DELETE FROM system_settings'),
      db.prepare('DELETE FROM sqlite_sequence')
    );
  }

  // Restore units
  if (Array.isArray(data.units)) {
    for (const u of data.units) {
      stmts.push(
        db.prepare('INSERT OR REPLACE INTO units (id, name, form_schema, created_at) VALUES (?, ?, ?, ?)')
          .bind(u.id, u.name, typeof u.form_schema === 'object' ? JSON.stringify(u.form_schema) : u.form_schema || null, u.created_at || null)
      );
    }
  }

  // Restore users
  if (Array.isArray(data.users)) {
    for (const u of data.users) {
      stmts.push(
        db.prepare('INSERT OR REPLACE INTO users (id, name, email, password_hash, role, unit_id, unit, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?)')
          .bind(u.id, u.name, u.email, u.password_hash, u.role, u.unit_id || null, u.unit || null, u.created_at || null)
      );
    }
  }

  // Restore system_settings
  if (Array.isArray(data.system_settings)) {
    for (const s of data.system_settings) {
      stmts.push(
        db.prepare('INSERT OR REPLACE INTO system_settings (key, value) VALUES (?, ?)')
          .bind(s.key, String(s.value))
      );
    }
  }

  // Restore job_requests
  if (Array.isArray(data.job_requests)) {
    for (const r of data.job_requests) {
      stmts.push(
        db.prepare(`INSERT OR REPLACE INTO job_requests (id, ticket_no, client_name, client_email, title, description, unit_id, unit, status, current_step_name, assigned_staff_ids, start_date, deadline, additional_data, created_at, updated_at)
                    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`)
          .bind(
            r.id,
            r.ticket_no,
            r.client_name,
            r.client_email,
            r.title,
            r.description || null,
            r.unit_id || null,
            r.unit,
            r.status,
            r.current_step_name || null,
            r.assigned_staff_ids || null,
            r.start_date || null,
            r.deadline || null,
            typeof r.additional_data === 'object' ? JSON.stringify(r.additional_data) : r.additional_data || null,
            r.created_at || null,
            r.updated_at || null
          )
      );
    }
  }

  // Restore job_tasks
  if (Array.isArray(data.job_tasks)) {
    for (const t of data.job_tasks) {
      stmts.push(
        db.prepare('INSERT OR REPLACE INTO job_tasks (id, job_request_id, title, description, assigned_to_user_id, assigned_by_user_id, status, due_date, completed_at, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)')
          .bind(t.id, t.job_request_id, t.title, t.description || null, t.assigned_to_user_id, t.assigned_by_user_id, t.status, t.due_date || null, t.completed_at || null, t.created_at || null)
      );
    }
  }

  // Restore staff_reports
  if (Array.isArray(data.staff_reports)) {
    for (const rep of data.staff_reports) {
      stmts.push(
        db.prepare('INSERT OR REPLACE INTO staff_reports (id, job_request_id, staff_id, report_text, created_at) VALUES (?, ?, ?, ?, ?)')
          .bind(rep.id, rep.job_request_id, rep.staff_id, rep.report_text, rep.created_at || null)
      );
    }
  }

  // Restore workflow_logs
  if (Array.isArray(data.workflow_logs)) {
    for (const l of data.workflow_logs) {
      stmts.push(
        db.prepare('INSERT OR REPLACE INTO workflow_logs (id, job_request_id, action, actor_id, actor_name, from_step_name, to_step_name, comment, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)')
          .bind(l.id, l.job_request_id, l.action, l.actor_id || null, l.actor_name || null, l.from_step_name || null, l.to_step_name || null, l.comment || null, l.created_at || null)
      );
    }
  }

  // Restore delegations
  if (Array.isArray(data.delegations)) {
    for (const d of data.delegations) {
      stmts.push(
        db.prepare('INSERT OR REPLACE INTO delegations (id, manager_id, delegate_id, unit_id, unit, start_date, end_date, status, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)')
          .bind(d.id, d.manager_id, d.delegate_id, d.unit_id || null, d.unit, d.start_date, d.end_date, d.status, d.created_at || null)
      );
    }
  }

  try {
    const CHUNK_SIZE = 100;
    for (let i = 0; i < stmts.length; i += CHUNK_SIZE) {
      const chunk = stmts.slice(i, i + CHUNK_SIZE);
      await db.batch(chunk);
    }

    return c.json({
      success: true,
      message: `Database restored successfully (${isOverwrite ? 'Full Overwrite' : 'Smart Merge'}). Processed ${stmts.length} total statements.`,
    });
  } catch (err: any) {
    console.error('Failed to restore database from backup:', err);
    return c.json({ error: err?.message || 'Failed to restore database.' }, 500);
  }
});

export default admin;
