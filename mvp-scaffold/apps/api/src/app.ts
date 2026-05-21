import { Hono } from 'hono';
import { cors } from 'hono/cors';
import { adminRoute } from './routes/admin';
import { authRoute } from './routes/auth';
import { leadsRoute } from './routes/leads';
import { providerRoute } from './routes/provider';
import { providersRoute } from './routes/providers';
import { servicesRoute } from './routes/services';

function parseCorsOrigins(value: string | undefined): string[] {
  const configured = String(value ?? '')
    .split(',')
    .map((item) => item.trim())
    .filter(Boolean);

  if (configured.length > 0) {
    return configured;
  }

  return ['https://apps.reindr.org', 'http://localhost:4321'];
}

export function createApp(): Hono {
  const app = new Hono();
  const corsOrigins = parseCorsOrigins(process.env.CORS_ORIGINS);

  app.use('*', cors({
    origin: corsOrigins,
    allowMethods: ['GET', 'POST', 'PATCH', 'OPTIONS'],
    allowHeaders: ['Content-Type', 'Authorization']
  }));

  app.get('/health', (c) => c.json({ ok: true, service: 'reindr-marketplace-api' }));

  app.route('/api/auth', authRoute);
  app.route('/api/leads', leadsRoute);
  app.route('/api/provider', providerRoute);
  app.route('/api/providers', providersRoute);
  app.route('/api/services', servicesRoute);
  app.route('/api/admin', adminRoute);

  return app;
}
