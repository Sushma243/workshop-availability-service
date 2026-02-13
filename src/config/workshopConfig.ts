/**
 * Loads workshop configuration from workshops.config.json (read-only).
 * Config is loaded once at startup; no mutating operations.
 */

import * as fs from 'fs';
import * as path from 'path';
import type { WorkshopConfig } from '../domain/types';

// From compiled code: __dirname is dist/config; from Lambda zip root may be cwd
function resolveConfigPath(): string {
  const fromDist = path.resolve(__dirname, '../../workshops.config.json');
  if (fs.existsSync(fromDist)) return fromDist;
  return path.resolve(process.cwd(), 'workshops.config.json');
}
const CONFIG_PATH = resolveConfigPath();

let cachedConfig: WorkshopConfig | null = null;

export function loadWorkshopConfig(): WorkshopConfig {
  if (cachedConfig) {
    return cachedConfig;
  }
  const raw = fs.readFileSync(CONFIG_PATH, 'utf-8');
  const parsed = JSON.parse(raw) as WorkshopConfig;
  cachedConfig = parsed;
  return parsed;
}

export function getWorkshopConfig(): WorkshopConfig {
  const config = loadWorkshopConfig();
  if (!config.workshops?.length || !config.services?.length) {
    throw new Error('Invalid workshop config: workshops and services are required');
  }
  return config;
}
