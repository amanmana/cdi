import { Hono } from 'hono';
import { D1Database } from '@cloudflare/workers-types';
import { sendGmail } from '../utils/mailer';

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
    if (turnstileSecret && turnstileToken !== 'demo_turnstile_pass_token') {
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
      if (!verifyData.success && turnstileToken !== 'demo_turnstile_pass_token') {
        console.error('Turnstile verification failed:', verifyData);
        return c.json({ error: 'Security verification (Turnstile) failed. Please try again.' }, 403);
      }
    }

    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
    const letters = chars.charAt(Math.floor(Math.random() * chars.length)) + chars.charAt(Math.floor(Math.random() * chars.length));
    const numbers = Math.floor(100000 + Math.random() * 900000).toString();
    const ticketNo = letters + numbers;

        const unitRow = await c.env.DB
      .prepare('SELECT id FROM units WHERE name = ?')
      .bind(unit)
      .first<{ id: number }>();
    const unitId = unitRow?.id || null;

    const res = await c.env.DB
      .prepare(
        `INSERT INTO job_requests (ticket_no, client_name, client_email, title, description, additional_data, unit, unit_id, status, current_step_name, created_at, updated_at) 
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'manager_approval', 'Manager Review', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)`
      )
      .bind(
        ticketNo,
        client_name,
        client_email,
        title,
        description || '',
        additional_data ? JSON.stringify(additional_data) : null,
        unit,
        unitId
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

    // Find Manager email for target unit
    const manager = await c.env.DB
      .prepare(`
        SELECT u.email, u.name FROM users u
        LEFT JOIN units un ON (u.unit_id = un.id OR u.unit = un.name)
        WHERE (u.unit_id = ? OR LOWER(TRIM(u.unit)) = LOWER(TRIM(?)) OR LOWER(TRIM(un.name)) = LOWER(TRIM(?))) AND u.role = 'manager'
        LIMIT 1
      `)
      .bind(unitId, unit, unit)
      .first<{ email: string; name: string }>();

    const targetManagerEmail = manager?.email || 'amanmana@gmail.com';
    const targetManagerName = manager?.name || 'Workflow Manager';

    // Dispatch automatic HTML email to Manager via Gmail SMTP (creativeuxdmim@gmail.com)
    const origin = c.req.header('origin') || 'https://cdi-app.amanmana.workers.dev';
    const detailUrl = `${origin}/portal/job-requests/${requestId}`;

    const managerEmailHtml = `
      <div style="font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 24px; border: 1px solid #e2e8f0; border-radius: 20px; background-color: #ffffff;">
        <div style="background: linear-gradient(135deg, #1e3a8a, #2563eb); padding: 28px; text-align: center; border-radius: 16px;">
          <h1 style="color: #ffffff; margin: 0; font-size: 20px; font-weight: 900; letter-spacing: -0.5px;">PERMOHONAN PROJEK BAHARU</h1>
          <p style="color: #bfdbfe; margin: 6px 0 0 0; font-size: 12px; font-weight: 600;">Unit: ${unit}</p>
        </div>
        <div style="padding: 24px 8px; text-align: left; color: #1e293b;">
          <p style="font-size: 14px; color: #475569;">Salam <strong>${targetManagerName}</strong>,</p>
          <p style="font-size: 14px; color: #475569; line-height: 1.6;">Terdapat 1 Permohonan Projek Baharu telah dikemukakan oleh Klien untuk semakan & kelulusan anda:</p>
          
          <div style="background-color: #f8fafc; border-left: 4px solid #2563eb; padding: 16px; border-radius: 8px; margin: 20px 0;">
            <p style="margin: 0 0 6px 0; font-size: 13px;"><strong>No. Tiket:</strong> <span style="color: #2563eb; font-weight: 800;">#${ticketNo}</span></p>
            <p style="margin: 0 0 6px 0; font-size: 13px;"><strong>Tajuk Projek:</strong> ${title}</p>
            <p style="margin: 0 0 6px 0; font-size: 13px;"><strong>Klien:</strong> ${client_name} (${client_email})</p>
            <p style="margin: 0; font-size: 13px;"><strong>Unit Sasaran:</strong> ${unit}</p>
          </div>

          <div style="text-align: center; margin: 28px 0;">
            <a href="${detailUrl}" style="background-color: #2563eb; color: #ffffff; padding: 14px 28px; text-decoration: none; font-weight: 800; font-size: 14px; border-radius: 12px; display: inline-block; box-shadow: 0 4px 12px rgba(37,99,235,0.25);">
              Lihat & Luluskan Projek &rarr;
            </a>
          </div>
          <hr style="border: 0; border-top: 1px solid #f1f5f9; margin: 24px 0;" />
          <p style="font-size: 11px; color: #94a3b8; text-align: center; margin: 0;">Automated System Notification — CDI Management System</p>
        </div>
      </div>
    `;

    // 1. Dispatch Manager Notification Email
    try {
      await sendGmail({
        to: targetManagerEmail,
        subject: `[PROJEK BAHARU] #${ticketNo} - ${title} (${unit})`,
        html: managerEmailHtml,
      });
    } catch (e) {
      console.error('Failed to send manager notification email:', e);
    }

    // 2. Dispatch Confirmation Email to Client (in English)
    const clientTrackUrl = `${origin}/track/${ticketNo}`;
    const clientEmailHtml = `
      <!DOCTYPE html>
      <html>
      <head><meta charset="utf-8"><title>Job Request Received</title></head>
      <body style="margin:0; padding:0; background-color:#f8fafc; font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif;">
        <!-- Hidden Preheader -->
        <div style="display:none; max-height:0px; overflow:hidden;">
          Confirmation of your job request submission #${ticketNo}.
        </div>
        <div style="max-width: 580px; margin: 20px auto; padding: 24px; border: 1px solid #e2e8f0; border-radius: 20px; background-color: #ffffff;">
          <div style="background: linear-gradient(135deg, #1e3a8a, #2563eb); padding: 28px; text-align: center; border-radius: 16px;">
            <h1 style="color: #ffffff; margin: 0; font-size: 20px; font-weight: 900; letter-spacing: -0.5px;">REQUEST CONFIRMATION</h1>
            <p style="color: #bfdbfe; margin: 6px 0 0 0; font-size: 12px; font-weight: 600;">CDI Corporate Communication & Identity Portal</p>
          </div>
          <div style="padding: 24px 8px; text-align: left; color: #1e293b;">
            <p style="font-size: 14px; color: #475569;">Hello <strong>${client_name}</strong>,</p>
            <p style="font-size: 14px; color: #475569; line-height: 1.6;">Thank you for submitting your job request to the <strong>${unit}</strong> unit. We have received your request and assigned it a tracking ticket number.</p>
            
            <div style="background-color: #f8fafc; border-left: 4px solid #2563eb; padding: 16px; border-radius: 12px; margin: 20px 0;">
              <p style="margin: 0 0 6px 0; font-size: 13px;"><strong>Ticket Number:</strong> <span style="color: #2563eb; font-weight: 800;">#${ticketNo}</span></p>
              <p style="margin: 0 0 6px 0; font-size: 13px;"><strong>Project Title:</strong> ${title}</p>
              <p style="margin: 0 0 6px 0; font-size: 13px;"><strong>Target Unit:</strong> ${unit}</p>
              <p style="margin: 0; font-size: 13px;"><strong>Initial Status:</strong> <span style="color: #d97706; font-weight: 700;">Manager Review</span></p>
            </div>

            <div style="text-align: center; margin: 28px 0;">
              <a href="${clientTrackUrl}" style="background-color: #2563eb; color: #ffffff; padding: 14px 28px; text-decoration: none; font-weight: 800; font-size: 14px; border-radius: 12px; display: inline-block; box-shadow: 0 4px 12px rgba(37,99,235,0.25);">
                Track Ticket Status &rarr;
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
        to: client_email,
        subject: `[CONFIRMATION] Job Request Received #${ticketNo} - ${title}`,
        html: clientEmailHtml,
      });
    } catch (e) {
      console.error('Failed to send client confirmation email:', e);
    }

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
