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
  try {
    const db = c.env.DB;
    const year = c.req.query('year') || '2026';
    const month = c.req.query('month') || 'all';

    let dateFilter = '';
    const dateParams: any[] = [];

    if (year !== 'all') {
      dateFilter += ` AND (created_at LIKE ? OR start_date LIKE ? OR substr(created_at, 1, 4) = ? OR substr(start_date, 1, 4) = ?)`;
      dateParams.push(`${year}-%`, `${year}-%`, year, year);
    }

    if (month !== 'all') {
      const formattedMonth = month.padStart(2, '0');
      dateFilter += ` AND (created_at LIKE ? OR start_date LIKE ? OR substr(created_at, 6, 2) = ? OR substr(start_date, 6, 2) = ?)`;
      dateParams.push(`%-${formattedMonth}-%`, `%-${formattedMonth}-%`, formattedMonth, formattedMonth);
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

    // 2. Canonical Operational Units list & breakdown (strictly from units table)
    const { results: canonicalUnits } = await db.prepare(`
      SELECT u.id, u.name, u.department_id, d.name as department_name 
      FROM units u
      LEFT JOIN departments d ON u.department_id = d.id
      WHERE u.name NOT IN ('Administrator', 'Admin', 'IT Support', 'Executive Management')
      ORDER BY u.name ASC
    `).all<{ id: number; name: string; department_id: number | null; department_name: string | null }>();

    const unitList = canonicalUnits || [];

    const unitBreakdown = await Promise.all(
      unitList.map(async (u) => {
        // Build unit matching condition for single-unit and multi-unit projects
        const isGraphicWeb = u.id === 5 || u.name.toLowerCase().includes('graphic');
        const patternUnit = `%${u.name}%`;
        const patternTargetId = `%"target_unit_id":${u.id}%`;
        const patternTargetIdStr = `%"target_unit_id":"${u.id}"%`;
        const patternTargetName = `%"target_unit_name":"${u.name}"%`;

        const unitFilterSql = ` AND (
          unit_id = ? 
          OR unit = ? 
          OR unit LIKE ? 
          OR additional_data LIKE ? 
          OR additional_data LIKE ? 
          OR additional_data LIKE ?
          ${isGraphicWeb ? "OR unit = 'Graphic' OR unit LIKE '%Graphic%'" : ''}
        )`;
        const unitBinds = [u.id, u.name, patternUnit, patternTargetId, patternTargetIdStr, patternTargetName];

        const statsSql = `
          SELECT 
            COUNT(DISTINCT id) as total_projects,
            COUNT(DISTINCT CASE WHEN status = 'completed' THEN id END) as completed_projects,
            COUNT(DISTINCT CASE WHEN status = 'staff_processing' THEN id END) as active_projects,
            COUNT(DISTINCT CASE WHEN status IN ('manager_approval', 'pending') THEN id END) as pending_projects
          FROM job_requests
          WHERE 1=1 ${unitFilterSql} ${dateFilter}
        `;
        const allBinds = [...unitBinds, ...dateParams];
        const row = await db.prepare(statsSql).bind(...allBinds).first<{
          total_projects: number;
          completed_projects: number;
          active_projects: number;
          pending_projects: number;
        }>();

        const tot = row?.total_projects || 0;
        const dn = row?.completed_projects || 0;
        const active = row?.active_projects || 0;
        const pend = row?.pending_projects || 0;

        const uStaff = await db.prepare(`
          SELECT COUNT(DISTINCT id) as count FROM users 
          WHERE (unit_id = ? OR unit = ? ${isGraphicWeb ? "OR unit = 'Graphic' OR unit LIKE '%Graphic%'" : ''}) 
            AND role = 'staff'
        `).bind(u.id, u.name).first<{ count: number }>();

        return {
          unit_id: u.id,
          unit_name: u.name,
          department_id: u.department_id,
          department_name: u.department_name,
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
      { label: 'On Hold / Cancelled', value: onHoldProjects + cancelledProjects, color: '#ef4444' },
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
  } catch (err: any) {
    console.error('Error computing director stats:', err);
    return c.json({ error: err?.message || 'Failed to compute director statistics' }, 500);
  }
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
  const scope = c.req.query('scope'); // 'all', 'single', 'multi'

  let query = `
    SELECT j.id, j.ticket_no, j.title, j.client_name, j.client_email, j.status, j.current_step_name,
           j.unit_id, COALESCE(un.name, j.unit) as unit_name, j.unit as raw_unit, j.additional_data, j.start_date, j.deadline, j.assigned_staff_ids, j.created_at
    FROM job_requests j
    LEFT JOIN units un ON (j.unit_id = un.id OR j.unit = un.name)
    WHERE 1=1
  `;
  const params: any[] = [];

  if (unit && unit !== 'all') {
    const unitRow = await db.prepare(`
      SELECT id, name FROM units 
      WHERE id = ? OR LOWER(TRIM(name)) = LOWER(TRIM(?))
      LIMIT 1
    `).bind(Number(unit) || 0, unit).first<{ id: number; name: string }>();

    if (unitRow) {
      const isGraphicWeb = unitRow.id === 5 || unitRow.name.toLowerCase().includes('graphic');
      const patternUnit = `%${unitRow.name}%`;
      const patternTargetId = `%"target_unit_id":${unitRow.id}%`;
      const patternTargetIdStr = `%"target_unit_id":"${unitRow.id}"%`;
      const patternTargetName = `%"target_unit_name":"${unitRow.name}"%`;

      query += ` AND (
        j.unit_id = ? 
        OR j.unit = ? 
        OR j.unit LIKE ? 
        OR j.additional_data LIKE ? 
        OR j.additional_data LIKE ? 
        OR j.additional_data LIKE ?
        ${isGraphicWeb ? "OR j.unit = 'Graphic' OR j.unit LIKE '%Graphic%'" : ''}
      )`;
      params.push(unitRow.id, unitRow.name, patternUnit, patternTargetId, patternTargetIdStr, patternTargetName);
    } else {
      query += ` AND (j.unit = ? OR un.name = ? OR j.unit LIKE ?)`;
      params.push(unit, unit, `%${unit}%`);
    }
  }

  if (scope === 'single') {
    query += ` AND (j.ticket_no NOT LIKE 'MU%' AND (j.unit NOT LIKE '%,%' OR j.unit IS NULL))`;
  } else if (scope === 'multi') {
    query += ` AND (j.ticket_no LIKE 'MU%' OR j.unit LIKE '%,%' OR j.additional_data LIKE '%"selected_services":%' OR j.additional_data LIKE '%"unit_assignments":%')`;
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
    query += ` AND (j.created_at LIKE ? OR j.start_date LIKE ? OR substr(j.created_at, 1, 4) = ? OR substr(j.start_date, 1, 4) = ?)`;
    params.push(`${year}-%`, `${year}-%`, year, year);
  }

  if (month && month !== 'all') {
    const formattedMonth = month.padStart(2, '0');
    query += ` AND (j.created_at LIKE ? OR j.start_date LIKE ? OR substr(j.created_at, 6, 2) = ? OR substr(j.start_date, 6, 2) = ?)`;
    params.push(`%-${formattedMonth}-%`, `%-${formattedMonth}-%`, formattedMonth, formattedMonth);
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

      let parsedAdditionalData: any = {};
      try {
        if (p.additional_data) parsedAdditionalData = typeof p.additional_data === 'string' ? JSON.parse(p.additional_data) : p.additional_data;
      } catch (e) {}

      const isMultiUnit = p.ticket_no?.startsWith('MU') || (p.raw_unit && p.raw_unit.includes(',')) || Boolean(parsedAdditionalData?.unit_assignments && Object.keys(parsedAdditionalData.unit_assignments).length > 1);

      return {
        ...p,
        is_multi_unit: isMultiUnit,
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
