INSERT INTO accounts (email, role, status) VALUES
('admin@reindr.test', 'admin', 'active'),
('cajas-acme@test.com', 'provider', 'active'),
('troqueles-norte@test.com', 'provider', 'active'),
('printlab@test.com', 'provider', 'active');

INSERT INTO locations (name, slug, type) VALUES
('Colombia', 'colombia', 'country'),
('Bogota', 'bogota', 'city'),
('Medellin', 'medellin', 'city'),
('Cali', 'cali', 'city');

INSERT INTO services (name, slug, description, base_lead_price) VALUES
('Cajas personalizadas', 'cajas-personalizadas', 'Fabricacion de cajas a medida para productos y ecommerce.', 25000),
('Troqueles', 'troqueles', 'Diseno y fabricacion de troqueles para corte.', 22000),
('Impresion', 'impresion', 'Impresion comercial, empaques y material grafico.', 20000),
('Serigrafia / Screen', 'serigrafia-screen', 'Screen y serigrafia para acabados o productos.', 18000),
('Etiquetas', 'etiquetas', 'Etiquetas adhesivas y personalizadas.', 15000),
('Diseno de empaque', 'diseno-empaque', 'Diseno grafico y estructural para empaques.', 30000),
('Fotografia de producto', 'fotografia-producto', 'Fotografia para catalogo, ecommerce y campanas.', 28000),
('Landing page', 'landing-page', 'Landing pages para venta o captacion de leads.', 35000),
('Ecommerce', 'ecommerce', 'Tiendas online y catalogos digitales.', 45000);

INSERT INTO providers (display_name, slug, description, phone, whatsapp, template_id, status, verified_at)
VALUES
('Cajas Acme', 'cajas-acme', 'Fabricamos cajas personalizadas para marcas, ecommerce y productos cosmeticos.', '+5700000001', '+5700000001', 'craft-paper', 'active', now()),
('Troqueles Norte', 'troqueles-norte', 'Troqueles y corte para empaques personalizados.', '+5700000002', '+5700000002', 'urban-ink', 'active', now()),
('PrintLab Bogota', 'printlab-bogota', 'Impresion, etiquetas y acabados para proyectos comerciales.', '+5700000003', '+5700000003', 'clean-lab', 'active', now());

INSERT INTO provider_services (provider_id, service_id, location_id, service_description, active)
SELECT p.id, s.id, l.id, 'Servicio disponible en Bogota', true
FROM providers p, services s, locations l
WHERE l.slug = 'bogota'
AND (
  (p.slug = 'cajas-acme' AND s.slug IN ('cajas-personalizadas', 'diseno-empaque'))
  OR (p.slug = 'troqueles-norte' AND s.slug IN ('troqueles', 'serigrafia-screen'))
  OR (p.slug = 'printlab-bogota' AND s.slug IN ('impresion', 'etiquetas'))
);

INSERT INTO service_relations (source_service_id, target_service_id, relation_type, weight, prompt_label)
SELECT src.id, target.id, 'complement', 100, 'Tambien necesitas ' || target.name || '?'
FROM services src, services target
WHERE src.slug = 'cajas-personalizadas'
AND target.slug IN ('troqueles', 'impresion', 'serigrafia-screen', 'etiquetas', 'diseno-empaque', 'fotografia-producto', 'landing-page', 'ecommerce');

INSERT INTO reviews (provider_id, rating, title, body, status)
SELECT id, 5, 'Buen proveedor', 'Respondieron rapido y explicaron bien el proceso.', 'approved'
FROM providers
WHERE slug = 'cajas-acme';
