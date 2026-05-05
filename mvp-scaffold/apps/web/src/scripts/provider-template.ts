import { PROVIDER_TEMPLATES } from '../data/provider-templates';
import type { ProviderTemplate } from '../data/provider-templates';

export function getProviderTemplateById(templateId: string | null | undefined): ProviderTemplate | null {
  if (!templateId) return null;
  return PROVIDER_TEMPLATES.find((template) => template.id === templateId) ?? null;
}

export function resolveProviderTemplateWithFallback(templateId?: string | null): ProviderTemplate {
  const explicit = getProviderTemplateById(templateId);
  if (explicit) return explicit;
  return PROVIDER_TEMPLATES[0];
}

export function providerTemplateInlineStyle(template: ProviderTemplate): string {
  return [
    `--provider-font:${template.fontStack}`,
    `--provider-bg-start:${template.bgStart}`,
    `--provider-bg-end:${template.bgEnd}`,
    `--provider-text:${template.textColor}`,
    `--provider-accent:${template.accentColor}`,
    `--provider-card-bg:${template.cardBackground}`,
    `--provider-border:${template.borderColor}`,
    'margin:0',
    'background:linear-gradient(160deg,var(--provider-bg-start),var(--provider-bg-end))',
    'color:var(--provider-text)'
  ].join('; ');
}

export function applyProviderTemplateToDocument(template: ProviderTemplate): void {
  if (typeof document === 'undefined') return;

  const body = document.body;
  body.style.setProperty('--provider-font', template.fontStack);
  body.style.setProperty('--provider-bg-start', template.bgStart);
  body.style.setProperty('--provider-bg-end', template.bgEnd);
  body.style.setProperty('--provider-text', template.textColor);
  body.style.setProperty('--provider-accent', template.accentColor);
  body.style.setProperty('--provider-card-bg', template.cardBackground);
  body.style.setProperty('--provider-border', template.borderColor);
  body.style.margin = '0';
  body.style.background = 'linear-gradient(160deg,var(--provider-bg-start),var(--provider-bg-end))';
  body.style.color = 'var(--provider-text)';

  const root = document.querySelector<HTMLElement>('main[data-provider-template]');
  if (root) root.dataset.providerTemplate = template.id;

  const label = document.querySelector<HTMLElement>('#provider-template-label');
  if (label) label.textContent = `Template: ${template.name}`;
}
