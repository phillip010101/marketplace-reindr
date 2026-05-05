import { validateAll } from '../lib/validate';

export function runValidate(config: { repoRoot: string; contractsDir: string; registryDir: string }): void {
  const result = validateAll(config.repoRoot, config.contractsDir, config.registryDir);
  for (const warning of result.warnings) {
    console.warn(`WARN: ${warning}`);
  }
  for (const error of result.errors) {
    console.error(`ERROR: ${error}`);
  }
  if (!result.ok) {
    throw new Error(`Validation failed with ${result.errors.length} error(s).`);
  }
  console.log('Validation passed.');
}
