import { cp, mkdir, rm } from 'node:fs/promises';
import { resolve } from 'node:path';

const root = resolve(import.meta.dirname, '..');
const output = resolve(root, 'dist');

await rm(output, { recursive: true, force: true });
await mkdir(output, { recursive: true });
await cp(resolve(root, 'home/dist'), output, { recursive: true });

for (const project of ['light', 'word-game', 'lunar-theater']) {
  await cp(resolve(root, project, 'dist'), resolve(output, project), { recursive: true });
}

console.log('Site ready in dist/');
