import { readFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import { agentConfigSchema } from '@/schemas';

export async function loadAgentConfig(configPath: string) {
  const fullPath = resolve(process.cwd(), configPath);
  const raw = await readFile(fullPath, 'utf-8');
  const parsed = JSON.parse(raw);
  return agentConfigSchema.parse(parsed);
}
