-- Migration: 0010_site_content
-- Purpose:
--   Central CMS table for all static site content (hero text, SEO, legal pages).
--   Enables editing content from admin without touching code.
--
-- Rollback notes:
--   Additive. Rollback drops the table.
--
-- Forward
CREATE TABLE IF NOT EXISTS site_content (
  key TEXT PRIMARY KEY,
  value TEXT NOT NULL DEFAULT '',
  type TEXT NOT NULL DEFAULT 'text' CHECK (type IN ('text', 'markdown', 'html', 'json')),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

INSERT INTO site_content (key, value, type) VALUES
  ('home-hero-title', 'Red de servicios conectados', 'text'),
  ('home-hero-subtitle', 'Encuentra proveedores y arma solicitudes multi-servicio', 'text'),
  ('home-cta-text', 'Buscar', 'text'),
  ('home-provider-cta', 'Ofrece tus servicios — Registra tu negocio', 'text'),
  ('seo-site-name', 'Reindr Marketplace', 'text'),
  ('seo-default-description', 'Marketplace local de servicios en Colombia. Encuentra proveedores y solicita cotizaciones.', 'text'),
  ('terms-content', '# Terminos y condiciones

## 1. Aceptacion
Al registrarte como proveedor en Reindr Marketplace, aceptas estos terminos.

## 2. Registro
Debes proporcionar informacion veraz.

## 3. Servicios
Los proveedores son responsables de la veracidad de la informacion publicada.

## 4. Leads
Reindr conecta clientes con proveedores. No garantizamos cierres.

## 5. Contacto
legal@reindr.org', 'markdown'),
  ('privacy-content', '# Politica de privacidad

## 1. Datos recopilados
Email, nombre comercial, telefono, datos de perfil.

## 2. Uso
Gestion de cuenta, conexion con clientes, notificaciones operativas.

## 3. No compartimos tus datos personales con terceros.

## 4. Contacto
privacidad@reindr.org', 'markdown'),
  ('footer-about', 'Reindr conecta proveedores locales con clientes que buscan sus servicios.', 'text'),
  ('footer-email', 'contacto@reindr.org', 'text'),
  ('plans-page-title', 'Planes para proveedores', 'text'),
  ('plans-page-subtitle', 'Elige el plan que mejor se adapte a tu negocio.', 'text')
ON CONFLICT (key) DO NOTHING;

-- Rollback (manual):
-- DROP TABLE IF EXISTS site_content;
