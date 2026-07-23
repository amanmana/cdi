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

const staffReports = new Hono<Env>();

staffReports.use('*', async (c, next) => {
  const authHeader = c.req.header('Authorization');
  const token = authHeader ? authHeader.replace('Bearer ', '') : null;
  if (!token) return c.json({ error: 'Tidak mempunyai kebenaran akses (Unauthorized).' }, 401);

  const user = await verifyToken(token);
  if (!user) return c.json({ error: 'Sesi anda telah tamat. Sila log masuk semula.' }, 401);

  c.set('user', user);
  await next();
});

// Create report
staffReports.post('/', async (c) => {
  const user = c.get('user');
  const { job_request_id, report_text } = await c.req.json();

  if (!job_request_id || !report_text) {
    return c.json({ error: 'Sila isi kandungan laporan.' }, 400);
  }

  const res = await c.env.DB
    .prepare('INSERT INTO job_staff_reports (job_request_id, staff_id, report_text, created_at) VALUES (?, ?, ?, datetime("now"))')
    .bind(job_request_id, user.id, report_text)
    .run();

  return c.json({ success: true, id: res.meta.last_row_id });
});

// Update report
staffReports.put('/:id', async (c) => {
  const id = c.req.param('id');
  const { report_text } = await c.req.json();

  await c.env.DB
    .prepare('UPDATE job_staff_reports SET report_text = ? WHERE id = ?')
    .bind(report_text, id)
    .run();

  return c.json({ success: true });
});

// Delete report
staffReports.delete('/:id', async (c) => {
  const id = c.req.param('id');

  await c.env.DB
    .prepare('DELETE FROM job_staff_reports WHERE id = ?')
    .bind(id)
    .run();

  return c.json({ success: true });
});

export default staffReports;
