import { Hono } from 'hono';
import { errorResponse } from '../lib/api-errors';
import { getPool } from '../lib/db';
import { requireProviderActor } from '../lib/request-actor';

export const plansRoute = new Hono();

type PlanRow = {
  id: string; name: string; price_monthly: number; price_yearly: number;
  max_services: number | null; max_cities: number | null; max_leads_free: number;
  custom_styles_allowed: boolean; custom_domain_allowed: boolean;
  remove_branding: boolean; verified_badge: boolean;
};

type ProviderPlanRow = {
  plan_id: string; plan_name: string;
  max_services: number | null; max_cities: number | null; max_leads_free: number;
  custom_styles_allowed: boolean; custom_domain_allowed: boolean;
  service_count: number; city_count: number;
};

// ── Public plans list ────────────────────────────────────────────

plansRoute.get('/', async (c) => {
  try {
    const pool = getPool();
    const result = await pool.query<PlanRow>(
      `SELECT id, name, price_monthly, price_yearly, max_services, max_cities, max_leads_free,
         custom_styles_allowed, custom_domain_allowed, remove_branding, verified_badge
       FROM plans ORDER BY price_monthly ASC`
    );
    return c.json({ ok: true, data: result.rows });
  } catch {
    const f = errorResponse(500, { code: 'INTERNAL_ERROR', message: 'No fue posible listar planes.' });
    return c.json(f.body, f.status);
  }
});

// ── Provider's current plan ──────────────────────────────────────

plansRoute.get('/me', async (c) => {
  try {
    const actor = requireProviderActor(c);
    const pool = getPool();
    const result = await pool.query<ProviderPlanRow>(
      `SELECT
         COALESCE(p.plan_id, 'free') AS plan_id,
         pl.name AS plan_name,
         pl.max_services, pl.max_cities, pl.max_leads_free,
         pl.custom_styles_allowed, pl.custom_domain_allowed,
         (SELECT COUNT(*) FROM provider_services ps2 WHERE ps2.provider_id = p.id AND ps2.active = true)::int AS service_count,
         (SELECT COUNT(DISTINCT ps2.location_id) FROM provider_services ps2 WHERE ps2.provider_id = p.id AND ps2.active = true)::int AS city_count
       FROM providers p
       JOIN plans pl ON pl.id = COALESCE(p.plan_id, 'free')
       WHERE p.account_id = $1`,
      [actor.accountId]
    );
    if (result.rowCount === 0) {
      const f = errorResponse(404, { code: 'NOT_FOUND', message: 'Perfil no encontrado.' });
      return c.json(f.body, f.status);
    }
    return c.json({ ok: true, data: result.rows[0] });
  } catch (error) {
    const f = errorResponse(500, { code: 'INTERNAL_ERROR', message: 'No fue posible consultar plan.' });
    return c.json(f.body, f.status);
  }
});

// ── Upgrade plan ─────────────────────────────────────────────────

plansRoute.post('/me', async (c) => {
  try {
    const actor = requireProviderActor(c);
    const body = await c.req.json();
    const planId = String(body?.plan_id ?? '').trim();

    const validPlans = ['free', 'pro_monthly', 'pro_yearly'];
    if (!validPlans.includes(planId)) {
      const f = errorResponse(400, { code: 'VALIDATION_ERROR', message: 'Plan no valido.' });
      return c.json(f.body, f.status);
    }

    const pool = getPool();
    const result = await pool.query(
      `UPDATE providers SET plan_id = $1, updated_at = now()
       WHERE account_id = $2
       RETURNING plan_id`,
      [planId, actor.accountId]
    );

    if (result.rowCount === 0) {
      const f = errorResponse(404, { code: 'NOT_FOUND', message: 'Perfil no encontrado.' });
      return c.json(f.body, f.status);
    }

    return c.json({ ok: true, data: { plan_id: planId } });
  } catch (error) {
    const f = errorResponse(500, { code: 'INTERNAL_ERROR', message: 'No fue posible actualizar plan.' });
    return c.json(f.body, f.status);
  }
});
