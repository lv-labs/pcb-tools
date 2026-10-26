import { cp, mkdir, rm } from 'node:fs/promises';
import { resolve } from 'node:path';
const base = (process.env.BASE_PATH || '/tools').replace(/^\/+|\/+$/g, '');
if (!base || base.split('/').some(part => !/^[a-zA-Z0-9_-]+$/.test(part))) throw new Error('Use a non-empty path made of letters, numbers, hyphens or underscores.');
await rm('bundle', { recursive: true, force: true });
await mkdir(resolve('bundle', base), { recursive: true });
await cp('dist', resolve('bundle', base), { recursive: true });
console.log(`Ready to merge bundle/${base}/ into the existing website output.`);
