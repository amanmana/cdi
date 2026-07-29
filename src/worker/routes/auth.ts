import { Hono } from 'hono';
import { D1Database } from '@cloudflare/workers-types';
import { AuthUser, createToken, verifyPassword, verifyToken, hashPassword } from '../auth';
import { sendGmail } from '../utils/mailer';

type Env = {
  Bindings: {
    DB: D1Database;
  };
  Variables: {
    user: AuthUser;
  };
};

const auth = new Hono<Env>();

auth.post('/login', async (c) => {
  const { email, password, turnstileToken } = await c.req.json();
  if (!email || !password) {
    return c.json({ error: 'Sila isi e-mel dan kata laluan.' }, 400);
  }

  // Verify Turnstile Security
  const turnstileSecret = (c.env as any).TURNSTILE_SECRET_KEY;
  if (turnstileSecret && turnstileToken && turnstileToken !== 'demo_turnstile_pass_token') {
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
      console.error('Turnstile verification failed on login:', verifyData);
      return c.json({ error: 'Security verification (Turnstile) failed. Please try again.' }, 403);
    }
  }

  const user = await c.env.DB
    .prepare(`
      SELECT u.id, u.name, u.email, u.password_hash, u.role, u.unit_id, u.phone, COALESCE(un.name, u.unit) as unit 
      FROM users u 
      LEFT JOIN units un ON (u.unit_id = un.id OR u.unit = un.name) 
      WHERE u.email = ?
    `)
    .bind(email)
    .first<{ id: number; name: string; email: string; password_hash: string; role: 'admin' | 'manager' | 'staff' | 'client' | 'director'; unit_id?: number | null; unit: string; phone?: string | null }>();

  if (!user) {
    return c.json({ error: 'Invalid email or password.' }, 401);
  }

  if ((user.role as string) === 'archived') {
    return c.json({ error: 'Your account has been deactivated. Please contact the System Administrator.' }, 403);
  }

  const isValid = await verifyPassword(password, user.password_hash);
  if (!isValid) {
    return c.json({ error: 'E-mel atau kata laluan tidak sah.' }, 401);
  }

  const authUser: AuthUser = {
    id: user.id,
    name: user.name,
    email: user.email,
    role: user.role,
    unit: user.unit,
    phone: user.phone || null,
  };

  const token = await createToken(authUser);

  return c.json({
    success: true,
    user: authUser,
    token,
  });
});

auth.post('/register', async (c) => {
  const { name, email, password, role, unit, company, phone, turnstileToken, unit_id } = await c.req.json();
  if (!name || !email || !password) {
    return c.json({ error: 'Please fill in name, email, and password.' }, 400);
  }

  // Verify Turnstile
  const turnstileSecret = (c.env as any).TURNSTILE_SECRET_KEY;
  if (turnstileSecret && turnstileToken && turnstileToken !== 'demo_turnstile_pass_token') {
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
      console.error('Turnstile verification failed on register:', verifyData);
      return c.json({ error: 'Security verification (Turnstile) failed. Please try again.' }, 403);
    }
  }

  const existing = await c.env.DB
    .prepare('SELECT id FROM users WHERE email = ?')
    .bind(email)
    .first();

  if (existing) {
    return c.json({ error: 'This email is already registered in the system.' }, 400);
  }

  const pwdHash = await hashPassword(password);
  const userRole = role || 'client';
  const companyVal = company || unit || null;

  const res = await c.env.DB
    .prepare('INSERT INTO users (name, email, password_hash, role, unit_id, unit, phone, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, datetime("now"))')
    .bind(name, email, pwdHash, userRole, unit_id || null, companyVal, phone || null)
    .run();

  const newUser: AuthUser = {
    id: res.meta.last_row_id as number,
    name,
    email,
    role: userRole,
    unit: companyVal,
    phone: phone || null,
  };

  const token = await createToken(newUser);

  return c.json({
    success: true,
    user: newUser,
    token,
  });
});

auth.get('/me', async (c) => {
  const authHeader = c.req.header('Authorization');
  const token = authHeader ? authHeader.replace('Bearer ', '') : null;

  if (!token) {
    return c.json({ user: null });
  }

  const payload = await verifyToken(token);
  if (!payload) {
    return c.json({ user: null });
  }

  const user = await c.env.DB
    .prepare(`
      SELECT u.id, u.name, u.email, u.role, u.unit_id, COALESCE(un.name, u.unit) as unit 
      FROM users u 
      LEFT JOIN units un ON (u.unit_id = un.id OR u.unit = un.name) 
      WHERE u.id = ?
    `)
    .bind(payload.id)
    .first<AuthUser>();

  if (!user) {
    return c.json({ user: null });
  }

  const today = new Date().toISOString().split('T')[0];
  const delegation = await c.env.DB
    .prepare(
      `SELECT d.*, COALESCE(un.name, m.unit) as manager_unit, m.role as manager_role
       FROM delegations d
       JOIN users m ON d.manager_id = m.id
       LEFT JOIN units un ON (m.unit_id = un.id OR m.unit = un.name)
       WHERE d.delegate_id = ? AND d.status = 'active' AND d.start_date <= ? AND d.end_date >= ?
       LIMIT 1`
    )
    .bind(user.id, today, today)
    .first<{ manager_unit: string; manager_role: string }>();

  return c.json({
    user: {
      ...user,
      is_acting_manager: !!delegation,
      acting_manager_unit: delegation ? delegation.manager_unit : null,
    },
  });
});

auth.post('/change-password', async (c) => {
  const authHeader = c.req.header('Authorization');
  const token = authHeader ? authHeader.replace('Bearer ', '') : null;

  if (!token) {
    return c.json({ error: 'Unauthorized or invalid token.' }, 401);
  }

  const payload = await verifyToken(token);
  if (!payload) {
    return c.json({ error: 'Unauthorized or invalid token.' }, 401);
  }

  const { currentPassword, newPassword } = await c.req.json();
  if (!currentPassword || !newPassword) {
    return c.json({ error: 'Please fill in all password fields.' }, 400);
  }

  // Get current user password_hash
  const user = await c.env.DB
    .prepare('SELECT id, password_hash FROM users WHERE id = ?')
    .bind(payload.id)
    .first<{ id: number; password_hash: string }>();

  if (!user) {
    return c.json({ error: 'User not found.' }, 404);
  }

  // Verify current password
  const isValid = await verifyPassword(currentPassword, user.password_hash);
  if (!isValid) {
    return c.json({ error: 'Current password is incorrect.' }, 400);
  }

  // Hash new password
  const newHash = await hashPassword(newPassword);

  // Update password_hash
  await c.env.DB
    .prepare('UPDATE users SET password_hash = ? WHERE id = ?')
    .bind(newHash, user.id)
    .run();

  return c.json({ success: true, message: 'Password updated successfully.' });
});

auth.post('/forgot-password', async (c) => {
  const { email, turnstileToken } = await c.req.json();
  if (!email || !email.trim()) {
    return c.json({ error: 'Please enter your email address.' }, 400);
  }

  const cleanEmail = email.trim().toLowerCase();

  // Verify Turnstile
  const turnstileSecret = (c.env as any).TURNSTILE_SECRET_KEY;
  if (turnstileSecret && turnstileToken && turnstileToken !== 'demo_turnstile_pass_token') {
    const formData = new FormData();
    formData.append('secret', turnstileSecret);
    formData.append('response', turnstileToken);
    const ip = c.req.header('CF-Connecting-IP');
    if (ip) formData.append('remoteip', ip);

    const verifyRes = await fetch('https://challenges.cloudflare.com/turnstile/v0/siteverify', {
      method: 'POST',
      body: formData,
    });
    const verifyData: any = await verifyRes.json();
    if (!verifyData.success && turnstileToken !== 'demo_turnstile_pass_token') {
      return c.json({ error: 'Security verification (Turnstile) failed. Please try again.' }, 403);
    }
  }

  // Check if user exists
  const user = await c.env.DB
    .prepare('SELECT id, name, email FROM users WHERE LOWER(email) = LOWER(?)')
    .bind(cleanEmail)
    .first<{ id: number; name: string; email: string }>();

  if (!user) {
    return c.json({
      success: true,
      message: 'If this email is registered, a password reset link has been sent.',
    });
  }

  // Generate secure token
  const randomBytes = new Uint8Array(24);
  crypto.getRandomValues(randomBytes);
  const resetToken = 'pr_' + Array.from(randomBytes, b => b.toString(16).padStart(2, '0')).join('');

  // Store token (valid for 15 minutes)
  await c.env.DB
    .prepare(`
      INSERT INTO password_resets (email, token, expires_at)
      VALUES (?, ?, datetime('now', '+15 minutes'))
    `)
    .bind(user.email, resetToken)
    .run();

  const origin = c.req.header('origin') || 'https://cdi-app.amanmana.workers.dev';
  const fullResetUrl = `${origin}/reset-password?token=${resetToken}`;

  const emailHtml = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <title>CDI Portal Password Reset</title>
    </head>
    <body style="margin:0; padding:0; background-color:#f8fafc; font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif;">
      <!-- Hidden Preheader -->
      <div style="display:none; max-height:0px; overflow:hidden;">
        Security verification for your CDI Portal account password reset.
      </div>
      <div style="max-width: 580px; margin: 20px auto; padding: 24px; border: 1px solid #e2e8f0; border-radius: 20px; background-color: #ffffff;">
        <div style="background: linear-gradient(135deg, #1e3a8a, #2563eb); padding: 28px; text-align: center; border-radius: 16px;">
          <h1 style="color: #ffffff; margin: 0; font-size: 22px; font-weight: 900; letter-spacing: -0.5px;">CDI PORTAL</h1>
          <p style="color: #93c5fd; margin: 4px 0 0 0; font-size: 12px; font-weight: 600;">Corporate Communication & Identity Management System</p>
        </div>
        <div style="padding: 24px 8px; text-align: left; color: #1e293b;">
          <h2 style="font-size: 18px; font-weight: 800; color: #0f172a; margin-bottom: 12px;">Reset Your Account Password</h2>
          <p style="font-size: 14px; color: #475569; line-height: 1.6;">Hello <strong>${user.name || user.email}</strong>,</p>
          <p style="font-size: 14px; color: #475569; line-height: 1.6;">We received a request to reset the password for your CDI Portal account (<strong>${user.email}</strong>).</p>
          <div style="text-align: center; margin: 32px 0;">
            <a href="${fullResetUrl}" style="background-color: #2563eb; color: #ffffff; padding: 14px 28px; text-decoration: none; font-weight: 800; font-size: 14px; border-radius: 12px; display: inline-block; box-shadow: 0 4px 12px rgba(37,99,235,0.25);">
              Set New Password &rarr;
            </a>
          </div>
          <p style="font-size: 12px; color: #64748b; line-height: 1.5;">Or copy the following link into your web browser:<br/><a href="${fullResetUrl}" style="color:#2563eb; word-break:break-all;">${fullResetUrl}</a></p>
          <p style="font-size: 12px; color: #94a3b8; line-height: 1.5;">This security link is valid for <strong>15 minutes</strong> only. If you did not request this, please ignore this email.</p>
          <hr style="border: 0; border-top: 1px solid #f1f5f9; margin: 24px 0;" />
          <p style="font-size: 11px; color: #94a3b8; text-align: center; margin: 0;">Official Notification from Corporate Communication & Identity Portal | Secured by Cloudflare & Turnstile Security</p>
        </div>
      </div>
    </body>
    </html>
  `;

  // Dispatch Email via Gmail SMTP (creativeuxdmim@gmail.com)
  const emailSent = await sendGmail({
    to: user.email,
    subject: 'Password Reset Request — Corporate Communication & Identity Portal',
    html: emailHtml,
  });

  return c.json({
    success: true,
    message: emailSent
      ? 'Password reset link has been sent to your email.'
      : 'Password reset link successfully generated.',
    token: resetToken,
    reset_url: fullResetUrl,
    email: user.email,
    email_sent: emailSent,
  });
});

auth.post('/verify-reset-token', async (c) => {
  const { token } = await c.req.json();
  if (!token) {
    return c.json({ error: 'Invalid password reset token.' }, 400);
  }

  const row = await c.env.DB
    .prepare(`
      SELECT email FROM password_resets
      WHERE token = ? AND used = 0 AND expires_at > datetime('now')
    `)
    .bind(token)
    .first<{ email: string }>();

  if (!row) {
    return c.json({ error: 'This password reset link has expired or is invalid.' }, 400);
  }

  return c.json({ success: true, email: row.email });
});

auth.post('/reset-password', async (c) => {
  const { token, newPassword } = await c.req.json();
  if (!token || !newPassword || newPassword.length < 6) {
    return c.json({ error: 'New password must be at least 6 characters long.' }, 400);
  }

  const row = await c.env.DB
    .prepare(`
      SELECT id, email FROM password_resets
      WHERE token = ? AND used = 0 AND expires_at > datetime('now')
    `)
    .bind(token)
    .first<{ id: number; email: string }>();

  if (!row) {
    return c.json({ error: 'This password reset link has expired or is invalid.' }, 400);
  }

  // Hash new password
  const newHash = await hashPassword(newPassword);

  // Update user password
  await c.env.DB
    .prepare('UPDATE users SET password_hash = ? WHERE LOWER(email) = LOWER(?)')
    .bind(newHash, row.email)
    .run();

  // Mark token as used
  await c.env.DB
    .prepare('UPDATE password_resets SET used = 1 WHERE id = ?')
    .bind(row.id)
    .run();

  return c.json({ success: true, message: 'Password updated successfully.' });
});

export default auth;
