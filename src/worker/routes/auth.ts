import { Hono } from 'hono';
import { D1Database } from '@cloudflare/workers-types';
import { AuthUser, createToken, verifyPassword, verifyToken, hashPassword } from '../auth';

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
  const { email, password } = await c.req.json();
  if (!email || !password) {
    return c.json({ error: 'Sila isi e-mel dan kata laluan.' }, 400);
  }

  const user = await c.env.DB
    .prepare(`
      SELECT u.id, u.name, u.email, u.password_hash, u.role, u.unit_id, COALESCE(un.name, u.unit) as unit 
      FROM users u 
      LEFT JOIN units un ON (u.unit_id = un.id OR u.unit = un.name) 
      WHERE u.email = ?
    `)
    .bind(email)
    .first<{ id: number; name: string; email: string; password_hash: string; role: 'admin' | 'manager' | 'staff' | 'client'; unit_id?: number | null; unit: string }>();

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
  };

  const token = await createToken(authUser);

  return c.json({
    success: true,
    user: authUser,
    token,
  });
});

auth.post('/register', async (c) => {
  const { name, email, password, role, unit, unit_id } = await c.req.json();
  if (!name || !email || !password) {
    return c.json({ error: 'Please fill in name, email, and password.' }, 400);
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

  const res = await c.env.DB
    .prepare('INSERT INTO users (name, email, password_hash, role, unit_id, unit, created_at) VALUES (?, ?, ?, ?, ?, ?, datetime("now"))')
    .bind(name, email, pwdHash, userRole, unit_id || null, unit || null)
    .run();

  const newUser: AuthUser = {
    id: res.meta.last_row_id as number,
    name,
    email,
    role: userRole,
    unit: unit || null,
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

export default auth;
