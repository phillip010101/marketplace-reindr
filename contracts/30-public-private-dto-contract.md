---
id: DTO_BOUNDARY_30
title: Public and Private DTO Boundary Contract
type: api
status: active
priority: high
version: 1.0.0
applies_to:
  - backend
  - frontend
depends_on:
  - DATA_05
  - SECURITY_15
  - API_06
related:
  - SEO_07
  - PROVIDER_PANEL_11
  - ADMIN_12
agent_read_policy: always_when_touching_module
---

# 30 - Public and Private DTO Boundary Contract

## Purpose

Prevent accidental PII leaks by defining strict DTO boundaries by audience.

## Non-Negotiable Rules

- API responses must use explicit DTO mappers, never raw DB row dumps.
- Public DTOs must never include client email, phone, or internal notes.
- Provider DTOs must include only the data needed for assigned opportunities.
- Admin DTOs can include sensitive fields, but only on admin routes.
- Any new route must declare which DTO profile it returns.

## DTO Profiles

- `public`
  - provider public profile
  - service/city listings
  - approved reviews
- `provider_private`
  - own opportunities
  - own lead contact data for assigned opportunities
  - own quotes and status timeline
- `admin_private`
  - moderation payloads
  - dispute fields
  - billing-related fields

## Endpoint to DTO Profile Mapping (Mandatory)

- Public:
  - `GET /api/search` -> `public`
  - `GET /api/services/:slug/related` -> `public`
  - `POST /api/leads` -> `public` response profile
- Provider private:
  - `GET /api/provider/me` -> `provider_private`
  - `PATCH /api/provider/me` -> `provider_private`
  - `GET /api/provider/leads` -> `provider_private`
  - `GET /api/provider/leads/:opportunityId` -> `provider_private`
  - `POST /api/provider/leads/:opportunityId/status` -> `provider_private`
  - `POST /api/provider/leads/:opportunityId/quote` -> `provider_private`
- Admin private:
  - `GET /api/admin/leads` -> `admin_private`
  - `GET /api/admin/providers` -> `admin_private`
  - `POST /api/admin/services` -> `admin_private`
  - `PATCH /api/admin/services/:id` -> `admin_private`
  - `POST /api/admin/service-relations` -> `admin_private`
  - `PATCH /api/admin/service-relations/:id` -> `admin_private`
  - `POST /api/admin/providers/:id/approve` -> `admin_private`
  - `POST /api/admin/reviews/:id/moderate` -> `admin_private`

## Sensitive Fields Policy

- Never public:
  - `client_email`
  - `client_phone`
  - internal moderation notes
  - billing internals
- Provider-visible only when assigned:
  - lead contact data
  - lead description details

## Validation Rule

- Add automated checks for public endpoints to ensure sensitive fields are absent.

## Acceptance Criteria

- Public endpoints pass no-PII integration tests.
- Provider endpoints pass ownership + DTO boundary tests.
- Admin endpoints pass role guard tests.
