import { serve } from '@hono/node-server';
import { createApp } from './app';

const app = createApp();

const port = Number(process.env.API_PORT ?? 8787);

const hostname = process.env.NODE_ENV === 'production' ? '127.0.0.1' : '0.0.0.0';

serve({ fetch: app.fetch, port, hostname });

console.log(`API running on http://localhost:${port}`);
