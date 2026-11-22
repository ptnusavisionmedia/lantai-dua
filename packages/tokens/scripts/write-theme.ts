import { writeFileSync } from 'node:fs';
import { buildThemeCss } from '../src/theme-css.ts';
import { tokens } from '../src/tokens.ts';

const target = new URL('../theme.css', import.meta.url);
writeFileSync(target, buildThemeCss(tokens));
console.log(`theme.css ditulis: ${target.pathname}`);
