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
    .prepare('SELECT * FROM users WHERE email = ?')
    .bind(email)
    .first<{ id: number; name: string; email: string; password_hash: string; role: 'admin' | 'manager' | 'staff' | 'client'; unit: string }>();

  if (!user) {
    return c.json({ error: 'E-mel atau kata laluan tidak sah.' }, 401);
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
  const { name, email, password, role, unit } = await c.req.json();
  if (!name || !email || !password) {
    return c.json({ error: 'Sila lengkapkan nama, e-mel dan kata laluan.' }, 400);
  }

  const existing = await c.env.DB
    .prepare('SELECT id FROM users WHERE email = ?')
    .bind(email)
    .first();

  if (existing) {
    return c.json({ error: 'E-mel telah berdaftar dalam sistem.' }, 400);
  }

  const pwdHash = await hashPassword(password);
  const userRole = role || 'client';

  const res = await c.env.DB
    .prepare('INSERT INTO users (name, email, password_hash, role, unit, created_at) VALUES (?, ?, ?, ?, ?, datetime("now"))')
    .bind(name, email, pwdHash, userRole, unit || null)
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
    .prepare('SELECT id, name, email, role, unit FROM users WHERE id = ?')
    .bind(payload.id)
    .first<AuthUser>();

  if (!user) {
    return c.json({ user: null });
  }

  const today = new Date().toISOString().split('T')[0];
  const delegation = await c.env.DB
    .prepare(
      `SELECT d.*, m.unit as manager_unit, m.role as manager_role
       FROM delegations d
       JOIN users m ON d.manager_id = m.id
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

export default auth;
