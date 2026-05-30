-- Migration: 0012_templates_table
-- Purpose:
--   Move templates from TypeScript constants to DB for CMS editing.
--   Seed the 14 existing templates.
--
-- Rollback notes:
--   Additive. Existing provider-templates.ts serves as fallback. Rollback drops the table.
--
-- Forward
CREATE TABLE IF NOT EXISTS templates (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT NOT NULL,
  tags TEXT[] NOT NULL DEFAULT '{}',
  category TEXT NOT NULL DEFAULT 'moderno' CHECK (category IN ('calido', 'moderno', 'corporativo', 'creativo', 'minimal')),
  heading_font TEXT NOT NULL,
  body_font TEXT NOT NULL,
  font_stack TEXT NOT NULL,
  bg_start TEXT NOT NULL,
  bg_end TEXT NOT NULL,
  text_color TEXT NOT NULL,
  accent_color TEXT NOT NULL,
  card_background TEXT NOT NULL,
  border_color TEXT NOT NULL,
  customizable TEXT[] NOT NULL DEFAULT '{}',
  active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

INSERT INTO templates (id, name, description, tags, category, heading_font, body_font, font_stack, bg_start, bg_end, text_color, accent_color, card_background, border_color, customizable) VALUES
('craft-paper','Craft Paper','Tonos kraft, papel reciclado. Ideal para productos artesanales.','{"artesanal","natural","sostenible","calido"}','calido','"Trebuchet MS", "Gill Sans", serif','"Segoe UI", system-ui, sans-serif','"Trebuchet MS", "Gill Sans", "Segoe UI", sans-serif','#f7f2e8','#e8dcc7','#2a2015','#7f4a1c','rgba(255,255,255,0.75)','#c8b79f','{"accentColor","bgStart","bgEnd","headingFont","bodyFont"}'),
('amber-glow','Amber Glow','Dorados y ambar, elegancia calida. Para marcas premium.','{"premium","dorado","elegancia","calido"}','calido','"Georgia", "Times New Roman", serif','"Segoe UI", system-ui, sans-serif','"Georgia", "Segoe UI", sans-serif','#fef9f0','#f5e6d0','#3d2b1a','#b8860b','rgba(255,255,255,0.7)','#d4b896','{"accentColor","bgStart","bgEnd","headingFont","bodyFont"}'),
('studio-sand','Studio Sand','Arena, tierra, calidez de estudio. Para disenadores.','{"creativo","diseno","agencia","calido"}','calido','"Verdana", "Segoe UI", sans-serif','"Segoe UI", system-ui, sans-serif','"Verdana", "Segoe UI", sans-serif','#fbf7ef','#efe4d4','#2f2519','#99612d','rgba(255,255,255,0.82)','#d8c4a6','{"accentColor","bgStart","bgEnd","headingFont","bodyFont"}'),
('urban-ink','Urban Ink','Alto contraste, editorial bold. Para marcas modernas.','{"editorial","contraste","bold","moderno"}','moderno','"Franklin Gothic Medium", "Arial Narrow", sans-serif','"Segoe UI", system-ui, sans-serif','"Franklin Gothic Medium", "Arial Narrow", "Segoe UI", sans-serif','#f0f3f7','#d7e0ea','#17212b','#0f4f7a','rgba(255,255,255,0.8)','#a7bacd','{"accentColor","bgStart","textColor","headingFont","bodyFont"}'),
('dark-slate','Dark Slate','Oscuro sofisticado. Para tecnologia, gaming.','{"oscuro","tech","gaming","moderno"}','moderno','"Arial Black", "Impact", sans-serif','"Segoe UI", system-ui, sans-serif','"Segoe UI", system-ui, sans-serif','#1e1e2e','#2d2d3f','#e0e0e0','#7c3aed','rgba(30,30,46,0.9)','#3d3d55','{"accentColor","bgStart","textColor","headingFont","bodyFont"}'),
('tech-blue','Tech Blue','Azules tecnologicos, gradientes frescos. Para SaaS.','{"tech","startup","saas","moderno"}','moderno','"Segoe UI", system-ui, sans-serif','"Segoe UI", system-ui, sans-serif','"Segoe UI", system-ui, sans-serif','#e8f0fe','#d0e0ff','#1a2236','#2563eb','rgba(255,255,255,0.85)','#b0c4de','{"accentColor","bgStart","bgEnd","headingFont","bodyFont"}'),
('executive-grid','Executive Grid','Sobrio, profesional. Para B2B, consultoria.','{"profesional","b2b","finanzas","corporativo"}','corporativo','"Lucida Sans", "Segoe UI", sans-serif','"Segoe UI", system-ui, sans-serif','"Lucida Sans", "Segoe UI", sans-serif','#f6f6f6','#e5e5e5','#1d1d1d','#5c2f1f','rgba(255,255,255,0.88)','#c7c7c7','{"accentColor","bgStart","textColor","headingFont","bodyFont"}'),
('mono-print','Mono Print','Blanco y negro. Para imprentas, editorial.','{"imprenta","editorial","blanco-negro","corporativo"}','corporativo','"Courier New", "SF Mono", monospace','"Segoe UI", system-ui, sans-serif','"Courier New", monospace','#ffffff','#f0f0f0','#111111','#000000','rgba(0,0,0,0.03)','#cccccc','{"accentColor","bgStart","textColor","headingFont","bodyFont"}'),
('ocean-board','Ocean Board','Azules corporativos, confianza. Para salud, educacion.','{"confianza","salud","educacion","corporativo"}','corporativo','"Tahoma", "Segoe UI", sans-serif','"Segoe UI", system-ui, sans-serif','"Tahoma", "Segoe UI", sans-serif','#eef6f8','#d9e9ef','#15313c','#176f8f','rgba(255,255,255,0.84)','#a8c9d4','{"accentColor","bgStart","bgEnd","headingFont","bodyFont"}'),
('sunset-brick','Sunset Brick','Terracota y naranja, vibrante. Para fotografia, gastronomia.','{"vibrante","arte","gastronomia","creativo"}','creativo','"Palatino Linotype", "Georgia", serif','"Segoe UI", system-ui, sans-serif','"Palatino Linotype", "Segoe UI", sans-serif','#fef5ee','#fde4d0','#3d1f0a','#d35400','rgba(255,248,240,0.9)','#e8b896','{"accentColor","bgStart","bgEnd","headingFont","bodyFont"}'),
('soft-blush','Soft Blush','Rosas suaves, femenino moderno. Para belleza, moda.','{"femenino","belleza","moda","creativo"}','creativo','"Arial Rounded MT Bold", "Segoe UI", sans-serif','"Segoe UI", system-ui, sans-serif','"Segoe UI", system-ui, sans-serif','#fdf2f6','#fce4ec','#4a2030','#c2185b','rgba(255,245,248,0.9)','#f0c0d0','{"accentColor","bgStart","bgEnd","headingFont","bodyFont"}'),
('minimal-cream','Minimal Cream','Blanco roto, tipografia limpia. Para arquitectura, lujo.','{"minimal","lujo","arquitectura","blanco"}','minimal','"Helvetica Neue", "Arial", sans-serif','"Segoe UI", system-ui, sans-serif','"Helvetica Neue", "Segoe UI", sans-serif','#fafaf8','#f0efe8','#2c2c2c','#8b7355','rgba(255,255,255,0.95)','#e0ded5','{"accentColor","bgStart","textColor","headingFont","bodyFont"}'),
('clean-lab','Clean Lab','Verde menta, limpio, quirurgico. Para laboratorios, salud.','{"limpio","salud","organico","minimal"}','minimal','"Century Gothic", "Segoe UI", sans-serif','"Segoe UI", system-ui, sans-serif','"Century Gothic", "Segoe UI", sans-serif','#f5fbf8','#deefe8','#183229','#0d7a57','rgba(255,255,255,0.85)','#a8d6c5','{"accentColor","bgStart","bgEnd","headingFont","bodyFont"}'),
('botanic-leaf','Botanic Leaf','Verde oscuro, natural, sereno. Para viveros, paisajismo.','{"eco","natural","botanico","minimal"}','minimal','"Garamond", "Georgia", serif','"Segoe UI", system-ui, sans-serif','"Garamond", "Segoe UI", sans-serif','#f4f9f4','#e0efe0','#1a3020','#2d6a4f','rgba(255,255,255,0.8)','#b8d4b8','{"accentColor","bgStart","bgEnd","headingFont","bodyFont"}')
ON CONFLICT (id) DO NOTHING;

-- Rollback (manual):
-- DROP TABLE IF EXISTS templates;
