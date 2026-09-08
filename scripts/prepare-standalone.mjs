import { cpSync, existsSync, mkdirSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const projectRoot = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const standaloneRoot = join(projectRoot, '.next', 'standalone');
const serverEntry = join(standaloneRoot, 'server.js');

if (!existsSync(serverEntry)) {
  throw new Error('Missing .next/standalone/server.js. Run next build first.');
}

const copies = [
  [join(projectRoot, 'public'), join(standaloneRoot, 'public')],
  [join(projectRoot, '.next', 'static'), join(standaloneRoot, '.next', 'static')],
];

for (const [source, destination] of copies) {
  if (!existsSync(source)) continue;
  mkdirSync(dirname(destination), { recursive: true });
  cpSync(source, destination, { recursive: true, force: true });
}

console.log('Standalone runtime prepared with public and Next.js static assets.');
