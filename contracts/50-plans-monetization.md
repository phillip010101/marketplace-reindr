---
id: PLANS_MONETIZATION_50
title: Sistema de planes y monetizacion avanzada
type: product
status: active
priority: high
version: 1.0.0
applies_to:
  - product
  - engineering
  - backend
  - frontend
depends_on:
  - MONETIZATION_09
  - WALLET_IMPL_45
  - API_06
related:
  - PROVIDER_PANEL_11
  - AUTH_RBAC_28
---

# 50 — Sistema de planes y monetizacion

## Modelo de negocio

Reindr Marketplace ofrece un modelo freemium con dos fuentes de ingreso:

1. **Suscripcion mensual/anual** — plan Pro con features avanzadas
2. **Pago por lead** — cobro por oportunidad valida (ya implementado)

## Planes

### Plan Gratuito (Free)

| Feature | Limite |
|---------|--------|
| Perfil publico | 1 pagina en `apps.reindr.org/proveedores/[slug]` |
| Templates | 6 templates basicos (sin custom_styles) |
| Servicios ofrecidos | Maximo 3 |
| Ciudades de cobertura | Maximo 1 |
| Leads mensuales | Hasta 10 |
| Wallet / billing | No requiere saldo (gratis hasta 10 leads) |
| Custom domain | No |
| Branding Reindr | Visible ("Powered by Reindr") |
| Soporte | Comunidad / FAQ |

### Plan Pro — Mensual

| Feature | Pro Mensual |
|---------|-------------|
| **Precio** | $49.900 COP / mes |
| Perfil publico | Sin limites |
| Templates | 14 templates + custom_styles (personalizacion completa) |
| Servicios ofrecidos | Ilimitados |
| Ciudades de cobertura | Ilimitadas |
| Leads mensuales | Sin limite (pago por lead a partir del #11) |
| Wallet | Requiere saldo para leads #11 en adelante |
| Custom domain | `mipropiodominio.com` → perfil provider |
| Branding Reindr | Oculto |
| Soporte | Email prioritario |
| Analytics | Metricas avanzadas en dashboard |

### Plan Pro — Anual

| Feature | Pro Anual |
|---------|-----------|
| **Precio** | $499.000 COP / ano (2 meses gratis) |
| Todo lo de Pro Mensual | Si |
| Custom domain | Incluido |
| Badge "Verificado" | Perfil publico |
| Prioridad en busquedas | Mayor visibilidad |

## Custom Domain — como funciona

1. Provider compra dominio en registrador externo (ej. Namecheap, GoDaddy)
2. Configura DNS: CNAME → `apps.reindr.org`
3. En `/panel/dominio`, ingresa el dominio (ej. `cajasacme.com`)
4. Reindr verifica el CNAME
5. Una vez verificado, `cajasacme.com` muestra el perfil del provider
6. El perfil original en `apps.reindr.org/proveedores/cajas-acme` redirige al custom domain

### Infraestructura necesaria

- LiteSpeed: agregar wildcard vhost o manejar via `server_name` dinamico
- Alternativa mas simple: proxy inverso que lee `Host` header y busca en DB
- `providers` table: columna `custom_domain`, `domain_verified_at`

## Implementacion tecnica

### Schema

```sql
CREATE TABLE plans (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  price_monthly INTEGER NOT NULL,
  price_yearly INTEGER NOT NULL,
  max_services INTEGER,
  max_cities INTEGER,
  max_leads_free INTEGER,
  custom_styles_allowed BOOLEAN DEFAULT false,
  custom_domain_allowed BOOLEAN DEFAULT false,
  remove_branding BOOLEAN DEFAULT false,
  priority_boost BOOLEAN DEFAULT false,
  verified_badge BOOLEAN DEFAULT false
);

ALTER TABLE providers ADD COLUMN plan_id TEXT DEFAULT 'free';
ALTER TABLE providers ADD COLUMN custom_domain TEXT;
ALTER TABLE providers ADD COLUMN domain_verified_at TIMESTAMPTZ;
```

### API endpoints

| Metodo | Ruta | Descripcion |
|--------|------|-------------|
| `GET` | `/api/plans` | Listar planes disponibles (publico) |
| `GET` | `/api/provider/me/plan` | Ver plan actual + uso |
| `POST` | `/api/provider/me/plan` | Upgrade de plan |
| `POST` | `/api/provider/me/domain` | Registrar custom domain |
| `GET` | `/api/provider/me/domain/verify` | Verificar CNAME |

### Middleware de enforcement

```ts
function checkPlanLimit(providerId, limit: 'services' | 'cities' | 'leads') {
  // Revisa el plan del provider y bloquea si excede
}
```

Aplicar en:
- `PUT /api/provider/me/services` → max_services, max_cities
- `POST /api/leads` → limitar matching a providers con plan adecuado
- `POST /api/auth/register` → asignar plan 'free' por defecto

### UI

- `/panel/plan` — pagina de plan actual + opciones de upgrade
- `/planes` — pagina publica comparativa de planes
- Badge en perfil publico: "Pro" o "Verificado"

## Roadmap de implementacion

### Fase 1: Planes basicos (ahora)
- [ ] Tabla `plans` + seed data (free, pro_monthly, pro_yearly)
- [ ] Columna `plan_id` en providers
- [ ] API: GET /api/plans, GET/POST /api/provider/me/plan
- [ ] Enforcement: limites de servicios y ciudades

### Fase 2: Custom domain (proxima)
- [ ] Columna `custom_domain` en providers
- [ ] LiteSpeed config para wildcard domains
- [ ] Endpoint de verificacion CNAME
- [ ] Redireccion de apps.reindr.org → custom domain

### Fase 3: Monetizacion completa (futuro)
- [ ] Integracion MercadoPago para cobro de suscripciones
- [ ] Renovacion automatica
- [ ] Facturacion recurrente
- [ ] Panel de facturacion para provider
