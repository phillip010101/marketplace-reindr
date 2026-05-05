export type ProviderTemplateId =
  | 'craft-paper'
  | 'urban-ink'
  | 'clean-lab'
  | 'executive-grid'
  | 'studio-sand'
  | 'ocean-board';

export type ProviderTemplate = {
  id: ProviderTemplateId;
  name: string;
  fontStack: string;
  bgStart: string;
  bgEnd: string;
  textColor: string;
  accentColor: string;
  cardBackground: string;
  borderColor: string;
};

export const PROVIDER_TEMPLATES: ProviderTemplate[] = [
  {
    id: 'craft-paper',
    name: 'Craft Paper',
    fontStack: '"Trebuchet MS", "Gill Sans", "Segoe UI", sans-serif',
    bgStart: '#f7f2e8',
    bgEnd: '#e8dcc7',
    textColor: '#2a2015',
    accentColor: '#7f4a1c',
    cardBackground: 'rgba(255,255,255,0.75)',
    borderColor: '#c8b79f'
  },
  {
    id: 'urban-ink',
    name: 'Urban Ink',
    fontStack: '"Franklin Gothic Medium", "Arial Narrow", "Segoe UI", sans-serif',
    bgStart: '#f0f3f7',
    bgEnd: '#d7e0ea',
    textColor: '#17212b',
    accentColor: '#0f4f7a',
    cardBackground: 'rgba(255,255,255,0.8)',
    borderColor: '#a7bacd'
  },
  {
    id: 'clean-lab',
    name: 'Clean Lab',
    fontStack: '"Century Gothic", "Segoe UI", sans-serif',
    bgStart: '#f5fbf8',
    bgEnd: '#deefe8',
    textColor: '#183229',
    accentColor: '#0d7a57',
    cardBackground: 'rgba(255,255,255,0.85)',
    borderColor: '#a8d6c5'
  },
  {
    id: 'executive-grid',
    name: 'Executive Grid',
    fontStack: '"Lucida Sans", "Segoe UI", sans-serif',
    bgStart: '#f6f6f6',
    bgEnd: '#e5e5e5',
    textColor: '#1d1d1d',
    accentColor: '#5c2f1f',
    cardBackground: 'rgba(255,255,255,0.88)',
    borderColor: '#c7c7c7'
  },
  {
    id: 'studio-sand',
    name: 'Studio Sand',
    fontStack: '"Verdana", "Segoe UI", sans-serif',
    bgStart: '#fbf7ef',
    bgEnd: '#efe4d4',
    textColor: '#2f2519',
    accentColor: '#99612d',
    cardBackground: 'rgba(255,255,255,0.82)',
    borderColor: '#d8c4a6'
  },
  {
    id: 'ocean-board',
    name: 'Ocean Board',
    fontStack: '"Tahoma", "Segoe UI", sans-serif',
    bgStart: '#eef6f8',
    bgEnd: '#d9e9ef',
    textColor: '#15313c',
    accentColor: '#176f8f',
    cardBackground: 'rgba(255,255,255,0.84)',
    borderColor: '#a8c9d4'
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
