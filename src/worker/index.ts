import { Hono } from 'hono';
import { cors } from 'hono/cors';
import { D1Database, Fetcher } from '@cloudflare/workers-types';
import { AuthUser } from './auth';

import authRoutes from './routes/auth';
import publicRoutes from './routes/public';
import jobRequestsRoutes from './routes/jobRequests';
import staffReportsRoutes from './routes/staffReports';
import adminRoutes from './routes/admin';
import directorRoutes from './routes/director';
import { notificationsRouter } from './routes/notifications';

type Env = {
  Bindings: {
    DB: D1Database;
    ASSETS: Fetcher;
  };
  Variables: {
    user: AuthUser;
  };
};

const app = new Hono<Env>();

// Enable CORS
app.use(
  '*',
  cors({
    origin: '*',
    allowMethods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowHeaders: ['Content-Type', 'Authorization'],
  })
);

// Register API Endpoints
app.route('/api/auth', authRoutes);
app.route('/api/public', publicRoutes);
app.route('/api/job-requests', jobRequestsRoutes);
app.route('/api/reports', staffReportsRoutes);
app.route('/api/admin', adminRoutes);
app.route('/api/director', directorRoutes);
app.route('/api/notifications', notificationsRouter);

// Health check
app.get('/api/health', (c) => {
  return c.json({ status: 'ok', timestamp: new Date().toISOString(), env: 'Cloudflare Workers + D1' });
});

// SPA Fallback Routing: Serve index.html for non-API routes when refreshed (F5)
app.get('*', async (c) => {
  const url = new URL(c.req.url);
  if (url.pathname.startsWith('/api/')) {
    return c.json({ error: 'API route not found' }, 404);
  }
  if (c.env.ASSETS) {
    return c.env.ASSETS.fetch(new URL('/index.html', c.req.url));
  }
  return c.text('Not Found', 404);
});

export default app;
