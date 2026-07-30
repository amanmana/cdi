import { Hono } from 'hono';
import { D1Database } from '@cloudflare/workers-types';
import { AuthUser } from '../auth';

type Env = {
  Bindings: {
    DB: D1Database;
  };
  Variables: {
    user: AuthUser;
  };
};

const directorRouter = new Hono<Env>();

// GET /api/director/stats — Executive Dashboard aggregated KPIs & breakdowns with Year & Month filtering
directorRouter.get('/stats', async (c) => {
  const db = c.env.DB;
  const year = c.req.query('year') || '2026';
  const month = c.req.query('month') || 'all';

  let dateFilter = '';
  const dateParams: any[] = [];

  if (year !== 'all') {
    dateFilter += ` AND (strftime('%Y', created_at) = ? OR strftime('%Y', start_date) = ?)`;
    dateParams.push(year, year);
  }

  if (month !== 'all') {
    const formattedMonth = month.padStart(2, '0');
    dateFilter += ` AND (strftime('%m', created_at) = ? OR strftime('%m', start_date) = ?)`;
    dateParams.push(formattedMonth, formattedMonth);
  }

  // Helper query runner
  const countQuery = async (whereClause: string, extraBinds: any[] = []) => {
    const sql = `SELECT COUNT(*) as count FROM job_requests WHERE 1=1 ${whereClause} ${dateFilter}`;
    const binds = [...extraBinds, ...dateParams];
    const res = binds.length > 0
      ? await db.prepare(sql).bind(...binds).first<{ count: number }>()
      : await db.prepare(sql).first<{ count: number }>();
    return res?.count || 0;
  };

  // 1. Overall KPIs
  const total = await countQuery('');
  const completed = await countQuery(`AND status = 'completed'`);
  const processing = await countQuery(`AND status = 'staff_processing'`);
  const pending = await countQuery(`AND status IN ('manager_approval', 'pending')`);
  const onHoldProjects = await countQuery(`AND status = 'on_hold'`);
  const cancelledProjects = await countQuery(`AND status IN ('cancelled', 'rejected')`);
  const completionRate = total > 0 ? Math.round((completed / total) * 100) : 0;

  // 2. Units list & breakdown
  const { results: units } = await db.prepare(`SELECT id, name FROM units ORDER BY name ASC`).all<{ id: number; name: string }>();
  let unitList = (units || []).filter(u => !['administrator', 'admin', 'it support', 'executive management'].includes(u.name.toLowerCase().trim()));

  // Also include units present in job_requests but not in units table
  const { results: extraUnits } = await db.prepare(`SELECT DISTINCT unit FROM job_requests WHERE unit IS NOT NULL AND unit != ''`).all<{ unit: string }>();
  const existingNames = unitList.map(u => u.name);
  (extraUnits || []).forEach(e => {
    if (e.unit && !existingNames.includes(e.unit) && !['administrator', 'admin', 'it support', 'executive management'].includes(e.unit.toLowerCase().trim())) {
      unitList.push({ id: 999, name: e.unit });
    }
  });

  const unitBreakdown = await Promise.all(
    unitList.map(async (u) => {
      const tot = await countQuery(`AND (unit_id = ? OR unit = ?)`, [u.id, u.name]);
      const dn = await countQuery(`AND (unit_id = ? OR unit = ?) AND status = 'completed'`, [u.id, u.name]);
      const active = await countQuery(`AND (unit_id = ? OR unit = ?) AND status = 'staff_processing'`, [u.id, u.name]);
      const pend = await countQuery(`AND (unit_id = ? OR unit = ?) AND status IN ('manager_approval', 'pending')`, [u.id, u.name]);
      const uStaff = await db.prepare(`SELECT COUNT(*) as count FROM users WHERE (unit_id = ? OR unit = ?) AND role = 'staff'`).bind(u.id, u.name).first<{ count: number }>();

      return {
        unit_id: u.id,
        unit_name: u.name,
        total_projects: tot,
        completed_projects: dn,
        active_projects: active,
        pending_projects: pend,
        staff_count: uStaff?.count || 0,
        completion_rate: tot > 0 ? Math.round((dn / tot) * 100) : 0,
      };
    })
  );

  // 3. Status Distribution for Donut Chart
  const statusDistribution = [
    { label: 'Completed', value: completed, color: '#10b981' },
    { label: 'Staff Processing', value: processing, color: '#3b82f6' },
    { label: 'Pending Approval', value: pending, color: '#f59e0b' },
    { label: 'On Hold / Cancelled', value: onHold, color: '#ef4444' },
  ];

  // 4. Executive SLA Health
  const today = new Date().toISOString().split('T')[0];
  const overdueCount = await countQuery(
    `AND status NOT IN ('completed', 'cancelled', 'rejected') AND deadline IS NOT NULL AND deadline != '' AND deadline < ?`,
    [today]
  );

  const onTimeCount = Math.max(0, completed);
  const slaComplianceRate = total > 0 ? Math.max(0, Math.round(((total - overdueCount) / total) * 100)) : 100;

  const slaHealth = {
    sla_compliance_rate: slaComplianceRate,
    on_time_count: onTimeCount,
    overdue_count: overdueCount,
    active_count: processing,
  };

  // 5. Top Client / Department Resource Utilization
  const clientSql = `
    SELECT client_name, client_email, COUNT(*) as project_count,
           SUM(CASE WHEN status = 'completed' THEN 1 ELSE 0 END) as completed_count
    FROM job_requests
    WHERE client_name IS NOT NULL AND client_name != '' ${dateFilter}
    GROUP BY client_name, client_email
    ORDER BY project_count DESC
    LIMIT 5
  `;
  const { results: topClients } = dateParams.length > 0
    ? await db.prepare(clientSql).bind(...dateParams).all<{ client_name: string; client_email: string; project_count: number; completed_count: number }>()
    : await db.prepare(clientSql).all<{ client_name: string; client_email: string; project_count: number; completed_count: number }>();

  const clientDemand = (topClients || []).map((c) => ({
    client_name: c.client_name,
    client_email: c.client_email,
    project_count: c.project_count,
    completed_count: c.completed_count,
    percentage_share: total > 0 ? Math.round((c.project_count / total) * 100) : 0,
  }));

  return c.json({
    selected_year: year,
    selected_month: month,
    kpis: {
      total_projects: total,
      completed_projects: completed,
      active_projects: processing,
      pending_approval: pending,
      on_hold_projects: onHoldProjects,
      cancelled_projects: cancelledProjects,
      on_hold_cancelled: onHoldProjects + cancelledProjects,
      completion_rate: completionRate,
    },
    unit_breakdown: unitBreakdown,
    status_distribution: statusDistribution,
    sla_health: slaHealth,
    client_demand: clientDemand,
  });
});

// GET /api/director/projects — Drill-deep detailed project listing with Year & Month filtering
directorRouter.get('/projects', async (c) => {
  const db = c.env.DB;
  const unit = c.req.query('unit');
  const status = c.req.query('status');
  const search = c.req.query('search');
  const year = c.req.query('year');
  const month = c.req.query('month');
  const client = c.req.query('client');

  let query = `
    SELECT j.id, j.ticket_no, j.title, j.client_name, j.client_email, j.status, j.current_step_name,
           j.unit_id, COALESCE(un.name, j.unit) as unit_name, j.start_date, j.deadline, j.assigned_staff_ids, j.created_at
    FROM job_requests j
    LEFT JOIN units un ON (j.unit_id = un.id OR j.unit = un.name)
    WHERE 1=1
  `;
  const params: any[] = [];

  if (unit && unit !== 'all') {
    query += ` AND (j.unit = ? OR un.name = ?)`;
    params.push(unit, unit);
  }

  if (client && client !== 'all') {
    query += ` AND (LOWER(TRIM(j.client_name)) = LOWER(TRIM(?)) OR LOWER(TRIM(j.client_email)) = LOWER(TRIM(?)))`;
    params.push(client, client);
  }

  if (status && status !== 'all') {
    if (status === 'active') {
      query += ` AND j.status = 'staff_processing'`;
    } else if (status === 'pending') {
      query += ` AND j.status IN ('manager_approval', 'pending')`;
    } else if (status === 'on_hold') {
      query += ` AND j.status = 'on_hold'`;
    } else if (status === 'cancelled') {
      query += ` AND j.status IN ('cancelled', 'rejected')`;
    } else {
      query += ` AND j.status = ?`;
      params.push(status);
    }
  }

  if (year && year !== 'all') {
    query += ` AND (strftime('%Y', j.created_at) = ? OR strftime('%Y', j.start_date) = ?)`;
    params.push(year, year);
  }

  if (month && month !== 'all') {
    const formattedMonth = month.padStart(2, '0');
    query += ` AND (strftime('%m', j.created_at) = ? OR strftime('%m', j.start_date) = ?)`;
    params.push(formattedMonth, formattedMonth);
  }

  if (search && search.trim()) {
    query += ` AND (j.ticket_no LIKE ? OR j.title LIKE ? OR j.client_name LIKE ?)`;
    const searchPattern = `%${search.trim()}%`;
    params.push(searchPattern, searchPattern, searchPattern);
  }

  query += ` ORDER BY j.created_at DESC`;

  const stmt = db.prepare(query);
  const { results: projects } = params.length > 0 ? await stmt.bind(...params).all() : await stmt.all();

  // Attach staff details to each project
  const enriched = await Promise.all(
    (projects || []).map(async (p: any) => {
      let staffNames: string[] = [];
      if (p.assigned_staff_ids) {
        const ids = p.assigned_staff_ids.split(',').map((id: string) => Number(id.trim())).filter(Boolean);
        if (ids.length > 0) {
          const placeholders = ids.map(() => '?').join(',');
          const { results: staffRows } = await db.prepare(`SELECT name FROM users WHERE id IN (${placeholders})`).bind(...ids).all<{ name: string }>();
          staffNames = (staffRows || []).map(r => r.name);
        }
      }
      return {
        ...p,
        assigned_staff_names: staffNames,
      };
    })
  );

  let clientProfile = null;
  if (client && client !== 'all') {
    const userRow = await db.prepare(`
      SELECT name, email, unit, phone, role FROM users 
      WHERE LOWER(TRIM(name)) = LOWER(TRIM(?)) OR LOWER(TRIM(email)) = LOWER(TRIM(?))
      LIMIT 1
    `).bind(client, client).first<{ name: string; email: string; unit: string; phone?: string; role: string }>();

    const firstReq = await db.prepare(`
      SELECT client_name, client_email, unit FROM job_requests 
      WHERE LOWER(TRIM(client_name)) = LOWER(TRIM(?)) OR LOWER(TRIM(client_email)) = LOWER(TRIM(?))
      LIMIT 1
    `).bind(client, client).first<{ client_name: string; client_email: string; unit: string }>();

    clientProfile = {
      name: userRow?.name || firstReq?.client_name || client,
      email: userRow?.email || firstReq?.client_email || 'Not specified',
      company: userRow?.unit || firstReq?.unit || 'Corporate Client',
      phone: userRow?.phone || 'Not specified',
      role: userRow?.role || 'Client User',
    };
  }

  return c.json({ projects: enriched, client_profile: clientProfile });
});

export default directorRouter;
