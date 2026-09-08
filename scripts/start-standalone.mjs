import { existsSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

const projectRoot = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const serverEntry = join(projectRoot, '.next', 'standalone', 'server.js');

if (!existsSync(serverEntry)) {
  throw new Error('Missing standalone server. Run pnpm build first.');
}

process.env.HOSTNAME = process.env.PORTFOLIO_BIND_HOST?.trim() || '127.0.0.1';
process.env.PORT = process.env.PORTFOLIO_PORT?.trim() || process.env.PORT || '3001';

await import(pathToFileURL(serverEntry).href);
