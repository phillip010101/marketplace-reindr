import { Hono } from 'hono';
import { z } from 'zod';
import { ApiRequestError, errorResponse } from '../lib/api-errors';
import { getPool } from '../lib/db';
import { requireProviderActor } from '../lib/request-actor';

const TopupSchema = z.object({
  amount: z.coerce.number().int().positive().max(10000000)
});

async function resolveProviderIdFromAccount(accountId: string): Promise<string> {
  const pool = getPool();
  const result = await pool.query<{ id: string; status: string }>(
    `SELECT id, status FROM providers WHERE account_id = $1 LIMIT 1`,
    [accountId]
  );
  if (result.rowCount === 0) {
    throw new ApiRequestError(403, {
      code: 'FORBIDDEN',
      message: 'La cuenta autenticada no tiene perfil provider.'
    });
  }
  if (result.rows[0].status === 'suspended') {
    throw new ApiRequestError(403, {
      code: 'FORBIDDEN',
      message: 'Tu perfil esta suspendido.'
    });
  }
  return result.rows[0].id;
}

export const walletRoute = new Hono();

type WalletTransactionRow = {
  id: string;
  type: string;
  amount: number;
  reason: string;
  lead_opportunity_id: string | null;
  created_at: string;
};

// ── Provider wallet ──────────────────────────────────────────────

walletRoute.get('/', async (c) => {
  try {
    const actor = requireProviderActor(c);
    const providerId = await resolveProviderIdFromAccount(actor.accountId);
    const pool = getPool();

    const [balanceResult, txResult] = await Promise.all([
      pool.query<{ balance: string }>(
        `SELECT COALESCE(SUM(
          CASE
            WHEN type IN ('credit', 'refund') THEN amount
            WHEN type IN ('debit') THEN -amount
            ELSE 0
          END
        ), 0)::text AS balance
        FROM wallet_transactions
        WHERE provider_id = $1`,
        [providerId]
      ),
      pool.query<WalletTransactionRow>(
        `SELECT id::text, type, amount, reason, lead_opportunity_id::text, created_at
         FROM wallet_transactions
         WHERE provider_id = $1
         ORDER BY created_at DESC
         LIMIT 20`,
        [providerId]
      )
    ]);

    return c.json({
      ok: true,
      data: {
        balance: Number(balanceResult.rows[0].balance),
        transactions: txResult.rows
      }
    });
  } catch (error) {
    if (error instanceof ApiRequestError) {
      const failure = errorResponse(error.status, error.payload);
      return c.json(failure.body, failure.status);
    }
    const failure = errorResponse(500, {
      code: 'INTERNAL_ERROR',
      message: 'No fue posible consultar wallet.'
    });
    return c.json(failure.body, failure.status);
  }
});

walletRoute.post('/topup', async (c) => {
  try {
    const actor = requireProviderActor(c);
    const providerId = await resolveProviderIdFromAccount(actor.accountId);
    const parsed = TopupSchema.safeParse(await c.req.json());
    if (!parsed.success) {
      const failure = errorResponse(400, {
        code: 'VALIDATION_ERROR',
        message: 'Monto invalido.',
        fields: parsed.error.flatten().fieldErrors
      });
      return c.json(failure.body, failure.status);
    }

    const pool = getPool();
    const result = await pool.query<WalletTransactionRow>(
      `INSERT INTO wallet_transactions (provider_id, type, amount, reason)
       VALUES ($1, 'credit', $2, 'topup')
       RETURNING id::text, type, amount, reason, created_at`,
      [providerId, parsed.data.amount]
    );

    return c.json({ ok: true, data: result.rows[0] }, 201);
  } catch (error) {
    if (error instanceof ApiRequestError) {
      const failure = errorResponse(error.status, error.payload);
      return c.json(failure.body, failure.status);
    }
    const failure = errorResponse(500, {
      code: 'INTERNAL_ERROR',
      message: 'No fue posible cargar saldo.'
    });
    return c.json(failure.body, failure.status);
  }
});
