const RAW_API_BASE = import.meta.env.PUBLIC_API_BASE_URL ?? 'http://localhost:8787';
export const API_BASE_URL = RAW_API_BASE.replace(/\/+$/, '');

const TOKEN_STORAGE_KEY = 'reindr_provider_access_token';

export function getStoredAccessToken(): string {
  if (typeof window === 'undefined') return '';
  return window.localStorage.getItem(TOKEN_STORAGE_KEY) ?? '';
}

export function setStoredAccessToken(token: string): void {
  if (typeof window === 'undefined') return;
  const clean = token.trim();
  if (!clean) return;
  window.localStorage.setItem(TOKEN_STORAGE_KEY, clean);
}

export function clearStoredAccessToken(): void {
  if (typeof window === 'undefined') return;
  window.localStorage.removeItem(TOKEN_STORAGE_KEY);
}

function decodeJwtPayload(token: string): Record<string, unknown> | null {
  const parts = token.split('.');
  if (parts.length < 2) return null;
  try {
    const base64 = parts[1].replace(/-/g, '+').replace(/_/g, '/');
    const padded = base64 + '='.repeat((4 - (base64.length % 4)) % 4);
    const json = atob(padded);
    return JSON.parse(json) as Record<string, unknown>;
  } catch {
    return null;
  }
}

export function isStoredTokenExpired(skewSeconds = 10): boolean {
  const token = getStoredAccessToken();
  if (!token) return true;
  const payload = decodeJwtPayload(token);
  const exp = Number(payload?.exp ?? 0);
  if (!exp || Number.isNaN(exp)) return false;
  const nowSeconds = Math.floor(Date.now() / 1000);
  return nowSeconds >= exp - skewSeconds;
}

export function providerAuthHeaders(): HeadersInit {
  const token = getStoredAccessToken();
  return token ? { Authorization: `Bearer ${token}` } : {};
}

export async function apiRequest<TResponse = unknown>(
  path: string,
  init: RequestInit = {}
): Promise<{
  ok: boolean;
  status: number;
  data?: TResponse;
  error?: unknown;
}> {
  const target = `${API_BASE_URL}${path}`;
  const response = await fetch(target, init);
  let payload: any = null;
  try {
    payload = await response.json();
  } catch {
    payload = null;
  }

  if (!response.ok) {
    return {
      ok: false,
      status: response.status,
      error: payload?.error ?? payload ?? { message: 'Request failed' }
    };
  }

  return {
    ok: true,
    status: response.status,
    data: payload?.data ?? payload
  };
}

export function formatCopAmount(amount: number): string {
  return new Intl.NumberFormat('es-CO', {
    style: 'currency',
    currency: 'COP',
    maximumFractionDigits: 0
  }).format(amount);
}

export function statusLabel(status: string): string {
  const labels: Record<string, string> = {
    new: 'Nuevo',
    viewed: 'Visto',
    contacted: 'Contactado',
    quoted: 'Cotizado',
    won: 'Ganado',
    lost: 'Perdido',
    rejected: 'Rechazado',
    invalid: 'Invalido'
  };
  return labels[status] ?? status;
}

type AuthMeResponse = {
  account_id: string;
  role: 'client' | 'provider' | 'admin';
};

export function buildPanelLoginUrl(nextPath: string): string {
  const encoded = encodeURIComponent(nextPath || '/panel');
  return `/panel/login?next=${encoded}`;
}

export async function ensureProviderSession(options: {
  redirectToLogin?: boolean;
  nextPath?: string;
} = {}): Promise<{
  ok: boolean;
  actor?: AuthMeResponse;
}> {
  const token = getStoredAccessToken();
  if (!token) {
    if (options.redirectToLogin && typeof window !== 'undefined') {
      window.location.href = buildPanelLoginUrl(options.nextPath ?? window.location.pathname);
    }
    return { ok: false };
  }

  if (isStoredTokenExpired()) {
    clearStoredAccessToken();
    if (options.redirectToLogin && typeof window !== 'undefined') {
      window.location.href = buildPanelLoginUrl(options.nextPath ?? window.location.pathname);
    }
    return { ok: false };
  }

  const result = await apiRequest<AuthMeResponse>('/api/auth/me', {
    headers: {
      ...providerAuthHeaders()
    }
  });

  if (!result.ok || !result.data || result.data.role !== 'provider') {
    clearStoredAccessToken();
    if (options.redirectToLogin && typeof window !== 'undefined') {
      window.location.href = buildPanelLoginUrl(options.nextPath ?? window.location.pathname);
    }
    return { ok: false };
  }

  return { ok: true, actor: result.data };
}
