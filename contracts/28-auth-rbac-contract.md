---
id: AUTH_RBAC_28
title: Auth and RBAC Contract
type: security
status: active
priority: critical
version: 1.0.0
applies_to:
  - backend
  - frontend
  - admin
depends_on:
  - DOMAIN_04
  - API_06
  - SECURITY_15
related:
  - PROVIDER_PANEL_11
  - ADMIN_12
agent_read_policy: always_when_touching_module
---

# 28 - Auth and RBAC Contract

## Purpose

Define authentication and authorization rules for public, provider, and admin flows.

## Non-Negotiable Rules

- Contracts are source of truth for RBAC behavior.
- Every private endpoint must validate authentication before business logic.
- Every private endpoint must validate authorization (role and ownership) after authentication.
- Provider users can only read/write opportunities linked to their own provider profile.
- Admin users can access cross-provider data and moderation actions.
- Public users cannot access private lead/opportunity data.
- Authorization failures must return a consistent error shape.

## Identity Model

- `accounts` is the identity root.
- `providers.account_id` represents ownership for provider panel access.
- A provider account maps to exactly one provider profile in MVP.

## Roles

- `client`
- `provider`
- `admin`

## Authorization Matrix

- Public:
  - Can browse public pages and submit lead form.
  - Cannot access provider/admin endpoints.
- Provider:
  - Can read/update own profile.
  - Can read/update own opportunities and create quotes for those opportunities.
  - Cannot read opportunities from other providers.
- Admin:
  - Can moderate providers, reviews, services, relations, and leads across the system.

## Endpoint Guards (Minimum)

- Authentication mechanism:
  - Private endpoints require `Authorization: Bearer <access_token>`.
  - Access token must include account subject and role claims.
  - Missing, invalid, or expired token returns `401` with canonical error shape.
- Provider routes:
  - Guard by `role = provider`.
  - Guard by ownership: `provider_id == current_user.provider_id`.
- Admin routes:
  - Guard by `role = admin`.

## Audit Requirements

- Log denied access attempts for private endpoints.
- Log role-sensitive state transitions and moderation actions.

## Acceptance Criteria

- All private endpoints have explicit auth middleware.
- Provider ownership checks are covered by integration tests.
- Admin-only routes reject non-admin roles.
