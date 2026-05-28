export type ProviderTemplateId =
  | 'craft-paper' | 'urban-ink' | 'clean-lab' | 'executive-grid'
  | 'studio-sand' | 'ocean-board' | 'sunset-brick' | 'mono-print'
  | 'botanic-leaf' | 'dark-slate' | 'soft-blush' | 'tech-blue'
  | 'amber-glow' | 'minimal-cream';

export type TemplateCategory = 'calido' | 'moderno' | 'corporativo' | 'creativo' | 'minimal';

export type CustomStyleOverrides = {
  fontStack?: string;
  bgStart?: string;
  bgEnd?: string;
  textColor?: string;
  accentColor?: string;
  cardBackground?: string;
  borderColor?: string;
  headingFont?: string;
  bodyFont?: string;
}

export type ProviderTemplate = {
  id: ProviderTemplateId;
  name: string;
  description: string;
  tags: string[];
  category: TemplateCategory;
  fontStack: string;
  headingFont: string;
  bodyFont: string;
  bgStart: string;
  bgEnd: string;
  textColor: string;
  accentColor: string;
  cardBackground: string;
  borderColor: string;
  customizable: (keyof CustomStyleOverrides)[];
};

export const PROVIDER_TEMPLATES: ProviderTemplate[] = [
  // ── Calido ──────────────────────────────────────────────────────
  {
    id: 'craft-paper', name: 'Craft Paper', category: 'calido',
    description: 'Tonos kraft, papel reciclado. Ideal para productos artesanales, comida, botanica.',
    tags: ['artesanal', 'natural', 'sostenible', 'calido'],
    headingFont: '"Trebuchet MS", "Gill Sans", serif',
    bodyFont: '"Segoe UI", system-ui, sans-serif',
    fontStack: '"Trebuchet MS", "Gill Sans", "Segoe UI", sans-serif',
    bgStart: '#f7f2e8', bgEnd: '#e8dcc7', textColor: '#2a2015',
    accentColor: '#7f4a1c', cardBackground: 'rgba(255,255,255,0.75)', borderColor: '#c8b79f',
    customizable: ['accentColor', 'bgStart', 'bgEnd', 'headingFont', 'bodyFont']
  },
  {
    id: 'amber-glow', name: 'Amber Glow', category: 'calido',
    description: 'Dorados y ambar, elegancia calida. Para marcas premium, joyeria, eventos.',
    tags: ['premium', 'dorado', 'elegancia', 'calido'],
    headingFont: '"Georgia", "Times New Roman", serif',
    bodyFont: '"Segoe UI", system-ui, sans-serif',
    fontStack: '"Georgia", "Segoe UI", sans-serif',
    bgStart: '#fef9f0', bgEnd: '#f5e6d0', textColor: '#3d2b1a',
    accentColor: '#b8860b', cardBackground: 'rgba(255,255,255,0.7)', borderColor: '#d4b896',
    customizable: ['accentColor', 'bgStart', 'bgEnd', 'headingFont', 'bodyFont']
  },
  {
    id: 'studio-sand', name: 'Studio Sand', category: 'calido',
    description: 'Arena, tierra, calidez de estudio. Para diseñadores, creativos, agencias.',
    tags: ['creativo', 'diseno', 'agencia', 'calido'],
    headingFont: '"Verdana", "Segoe UI", sans-serif',
    bodyFont: '"Segoe UI", system-ui, sans-serif',
    fontStack: '"Verdana", "Segoe UI", sans-serif',
    bgStart: '#fbf7ef', bgEnd: '#efe4d4', textColor: '#2f2519',
    accentColor: '#99612d', cardBackground: 'rgba(255,255,255,0.82)', borderColor: '#d8c4a6',
    customizable: ['accentColor', 'bgStart', 'bgEnd', 'headingFont', 'bodyFont']
  },

  // ── Moderno ─────────────────────────────────────────────────────
  {
    id: 'urban-ink', name: 'Urban Ink', category: 'moderno',
    description: 'Alto contraste, editorial bold. Para marcas modernas, streetwear, cultura.',
    tags: ['editorial', 'contraste', 'bold', 'moderno'],
    headingFont: '"Franklin Gothic Medium", "Arial Narrow", sans-serif',
    bodyFont: '"Segoe UI", system-ui, sans-serif',
    fontStack: '"Franklin Gothic Medium", "Arial Narrow", "Segoe UI", sans-serif',
    bgStart: '#f0f3f7', bgEnd: '#d7e0ea', textColor: '#17212b',
    accentColor: '#0f4f7a', cardBackground: 'rgba(255,255,255,0.8)', borderColor: '#a7bacd',
    customizable: ['accentColor', 'bgStart', 'textColor', 'headingFont', 'bodyFont']
  },
  {
    id: 'dark-slate', name: 'Dark Slate', category: 'moderno',
    description: 'Oscuro sofisticado, texto claro. Para tecnologia, gaming, servicios nocturnos.',
    tags: ['oscuro', 'tech', 'gaming', 'moderno'],
    headingFont: '"Arial Black", "Impact", sans-serif',
    bodyFont: '"Segoe UI", system-ui, sans-serif',
    fontStack: '"Segoe UI", system-ui, sans-serif',
    bgStart: '#1e1e2e', bgEnd: '#2d2d3f', textColor: '#e0e0e0',
    accentColor: '#7c3aed', cardBackground: 'rgba(30,30,46,0.9)', borderColor: '#3d3d55',
    customizable: ['accentColor', 'bgStart', 'textColor', 'headingFont', 'bodyFont']
  },
  {
    id: 'tech-blue', name: 'Tech Blue', category: 'moderno',
    description: 'Azules tecnologicos, gradientes frescos. Para SaaS, startups, software.',
    tags: ['tech', 'startup', 'saas', 'moderno'],
    headingFont: '"Segoe UI", system-ui, sans-serif',
    bodyFont: '"Segoe UI", system-ui, sans-serif',
    fontStack: '"Segoe UI", system-ui, sans-serif',
    bgStart: '#e8f0fe', bgEnd: '#d0e0ff', textColor: '#1a2236',
    accentColor: '#2563eb', cardBackground: 'rgba(255,255,255,0.85)', borderColor: '#b0c4de',
    customizable: ['accentColor', 'bgStart', 'bgEnd', 'headingFont', 'bodyFont']
  },

  // ── Corporativo ─────────────────────────────────────────────────
  {
    id: 'executive-grid', name: 'Executive Grid', category: 'corporativo',
    description: 'Sobrio, profesional, escala de grises. Para B2B, consultoria, finanzas.',
    tags: ['profesional', 'b2b', 'finanzas', 'corporativo'],
    headingFont: '"Lucida Sans", "Segoe UI", sans-serif',
    bodyFont: '"Segoe UI", system-ui, sans-serif',
    fontStack: '"Lucida Sans", "Segoe UI", sans-serif',
    bgStart: '#f6f6f6', bgEnd: '#e5e5e5', textColor: '#1d1d1d',
    accentColor: '#5c2f1f', cardBackground: 'rgba(255,255,255,0.88)', borderColor: '#c7c7c7',
    customizable: ['accentColor', 'bgStart', 'textColor', 'headingFont', 'bodyFont']
  },
  {
    id: 'mono-print', name: 'Mono Print', category: 'corporativo',
    description: 'Blanco y negro, tipografia mono. Para imprentas, editorial, servicios graficos.',
    tags: ['imprenta', 'editorial', 'blanco-negro', 'corporativo'],
    headingFont: '"Courier New", "SF Mono", monospace',
    bodyFont: '"Segoe UI", system-ui, sans-serif',
    fontStack: '"Courier New", monospace',
    bgStart: '#ffffff', bgEnd: '#f0f0f0', textColor: '#111111',
    accentColor: '#000000', cardBackground: 'rgba(0,0,0,0.03)', borderColor: '#cccccc',
    customizable: ['accentColor', 'bgStart', 'textColor', 'headingFont', 'bodyFont']
  },
  {
    id: 'ocean-board', name: 'Ocean Board', category: 'corporativo',
    description: 'Azules corporativos, confianza. Para servicios profesionales, salud, educacion.',
    tags: ['confianza', 'salud', 'educacion', 'corporativo'],
    headingFont: '"Tahoma", "Segoe UI", sans-serif',
    bodyFont: '"Segoe UI", system-ui, sans-serif',
    fontStack: '"Tahoma", "Segoe UI", sans-serif',
    bgStart: '#eef6f8', bgEnd: '#d9e9ef', textColor: '#15313c',
    accentColor: '#176f8f', cardBackground: 'rgba(255,255,255,0.84)', borderColor: '#a8c9d4',
    customizable: ['accentColor', 'bgStart', 'bgEnd', 'headingFont', 'bodyFont']
  },

  // ── Creativo ────────────────────────────────────────────────────
  {
    id: 'sunset-brick', name: 'Sunset Brick', category: 'creativo',
    description: 'Terracota y naranja, vibrante. Para fotografia, arte, gastronomia.',
    tags: ['vibrante', 'arte', 'gastronomia', 'creativo'],
    headingFont: '"Palatino Linotype", "Georgia", serif',
    bodyFont: '"Segoe UI", system-ui, sans-serif',
    fontStack: '"Palatino Linotype", "Segoe UI", sans-serif',
    bgStart: '#fef5ee', bgEnd: '#fde4d0', textColor: '#3d1f0a',
    accentColor: '#d35400', cardBackground: 'rgba(255,248,240,0.9)', borderColor: '#e8b896',
    customizable: ['accentColor', 'bgStart', 'bgEnd', 'headingFont', 'bodyFont']
  },
  {
    id: 'soft-blush', name: 'Soft Blush', category: 'creativo',
    description: 'Rosas suaves, femenino moderno. Para belleza, moda, bienestar, kids.',
    tags: ['femenino', 'belleza', 'moda', 'creativo'],
    headingFont: '"Arial Rounded MT Bold", "Segoe UI", sans-serif',
    bodyFont: '"Segoe UI", system-ui, sans-serif',
    fontStack: '"Segoe UI", system-ui, sans-serif',
    bgStart: '#fdf2f6', bgEnd: '#fce4ec', textColor: '#4a2030',
    accentColor: '#c2185b', cardBackground: 'rgba(255,245,248,0.9)', borderColor: '#f0c0d0',
    customizable: ['accentColor', 'bgStart', 'bgEnd', 'headingFont', 'bodyFont']
  },

  // ── Minimal ─────────────────────────────────────────────────────
  {
    id: 'minimal-cream', name: 'Minimal Cream', category: 'minimal',
    description: 'Blanco roto, tipografia limpia. Para arquitectura, interiorismo, lujo minimal.',
    tags: ['minimal', 'lujo', 'arquitectura', 'blanco'],
    headingFont: '"Helvetica Neue", "Arial", sans-serif',
    bodyFont: '"Segoe UI", system-ui, sans-serif',
    fontStack: '"Helvetica Neue", "Segoe UI", sans-serif',
    bgStart: '#fafaf8', bgEnd: '#f0efe8', textColor: '#2c2c2c',
    accentColor: '#8b7355', cardBackground: 'rgba(255,255,255,0.95)', borderColor: '#e0ded5',
    customizable: ['accentColor', 'bgStart', 'textColor', 'headingFont', 'bodyFont']
  },
  {
    id: 'clean-lab', name: 'Clean Lab', category: 'minimal',
    description: 'Verde menta, limpio, quirurgico. Para laboratorios, salud, alimentos organicos.',
    tags: ['limpio', 'salud', 'organico', 'minimal'],
    headingFont: '"Century Gothic", "Segoe UI", sans-serif',
    bodyFont: '"Segoe UI", system-ui, sans-serif',
    fontStack: '"Century Gothic", "Segoe UI", sans-serif',
    bgStart: '#f5fbf8', bgEnd: '#deefe8', textColor: '#183229',
    accentColor: '#0d7a57', cardBackground: 'rgba(255,255,255,0.85)', borderColor: '#a8d6c5',
    customizable: ['accentColor', 'bgStart', 'bgEnd', 'headingFont', 'bodyFont']
  },
  {
    id: 'botanic-leaf', name: 'Botanic Leaf', category: 'minimal',
    description: 'Verde oscuro, natural, sereno. Para viveros, paisajismo, productos eco.',
    tags: ['eco', 'natural', 'botanico', 'minimal'],
    headingFont: '"Garamond", "Georgia", serif',
    bodyFont: '"Segoe UI", system-ui, sans-serif',
    fontStack: '"Garamond", "Segoe UI", sans-serif',
    bgStart: '#f4f9f4', bgEnd: '#e0efe0', textColor: '#1a3020',
    accentColor: '#2d6a4f', cardBackground: 'rgba(255,255,255,0.8)', borderColor: '#b8d4b8',
    customizable: ['accentColor', 'bgStart', 'bgEnd', 'headingFont', 'bodyFont']
  }
];

export function getProviderTemplateById(templateId: ProviderTemplateId): ProviderTemplate | undefined {
  return PROVIDER_TEMPLATES.find((template) => template.id === templateId);
}

export function isProviderTemplateId(value: string): value is ProviderTemplateId {
  return PROVIDER_TEMPLATES.some((template) => template.id === value);
}

export function getProviderTemplateIds(): ProviderTemplateId[] {
  return PROVIDER_TEMPLATES.map((template) => template.id);
}
