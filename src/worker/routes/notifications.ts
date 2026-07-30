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

export const notificationsRouter = new Hono<Env>();

// GET /api/notifications — Fetch user notification alerts (new job assignments, status changes)
notificationsRouter.get('/', async (c) => {
  const db = c.env.DB;
  const user = c.get('user');

  try {
    let query = '';
    const params: any[] = [];

    if (user.role === 'staff' && !user.is_acting_manager) {
      // Find jobs assigned to this staff member
      query = `
        SELECT j.id, j.ticket_no, j.title, j.client_name, j.status, j.unit, j.created_at, j.updated_at,
               (SELECT comment FROM workflow_logs WHERE job_request_id = j.id ORDER BY id DESC LIMIT 1) as latest_comment
        FROM job_requests j
        WHERE (j.assigned_staff_ids LIKE ? OR j.assigned_staff_ids LIKE ? OR j.assigned_staff_ids = ?)
          AND j.status = 'staff_processing'
        ORDER BY j.updated_at DESC
        LIMIT 10
      `;
      params.push(`%,${user.id},%`, `${user.id},%`, `${user.id}`);
    } else if (user.role === 'manager' || user.is_acting_manager) {
      // Manager notifications for pending approvals & staff updates
      const managerUnit = user.acting_manager_unit || user.unit;
      query = `
        SELECT j.id, j.ticket_no, j.title, j.client_name, j.status, j.unit, j.created_at, j.updated_at,
               (SELECT comment FROM workflow_logs WHERE job_request_id = j.id ORDER BY id DESC LIMIT 1) as latest_comment
        FROM job_requests j
        LEFT JOIN units un ON (j.unit_id = un.id OR j.unit = un.name)
        WHERE (LOWER(TRIM(j.unit)) = LOWER(TRIM(?)) OR LOWER(TRIM(un.name)) = LOWER(TRIM(?)))
          AND j.status IN ('manager_approval', 'staff_processing', 'completed')
        ORDER BY j.updated_at DESC
        LIMIT 10
      `;
      params.push(managerUnit, managerUnit);
    } else {
      // Admin / Director notifications
      query = `
        SELECT j.id, j.ticket_no, j.title, j.client_name, j.status, j.unit, j.created_at, j.updated_at,
               (SELECT comment FROM workflow_logs WHERE job_request_id = j.id ORDER BY id DESC LIMIT 1) as latest_comment
        FROM job_requests j
        ORDER BY j.updated_at DESC
        LIMIT 10
      `;
    }

    const { results } = params.length > 0
      ? await db.prepare(query).bind(...params).all<any>()
      : await db.prepare(query).all<any>();

    const notifications = (results || []).map((r) => {
      let msg = `Job #${r.ticket_no} - ${r.title}`;
      if (r.status === 'manager_approval') msg = `New Request #${r.ticket_no} awaiting approval`;
      if (r.status === 'staff_processing') msg = `Job #${r.ticket_no} assigned for processing`;
      if (r.status === 'completed') msg = `Job #${r.ticket_no} marked as completed`;

      return {
        id: r.id,
        ticket_no: r.ticket_no,
        title: r.title,
        status: r.status,
        unit: r.unit,
        message: msg,
        created_at: r.updated_at || r.created_at,
      };
    });

    return c.json({
      notifications,
    });
  } catch (err: any) {
    console.error('Error fetching notifications:', err);
    return c.json({ notifications: [] });
  }
});
