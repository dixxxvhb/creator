// Regenerates the PWA / home-screen icon set from scripts/icon-source.svg.
// Run with: npm run icons
// Renders at 1024 then downscales (small-viewport SVG rasterization is
// unreliable; always render large and shrink). flatten() guards against any
// alpha sneaking through — iOS composites transparent icons onto black.
import sharp from 'sharp';
import { readFileSync, mkdirSync } from 'node:fs';

const IVORY = '#FDFBF7';
const svg = readFileSync(new URL('./icon-source.svg', import.meta.url));
mkdirSync(new URL('../public/icons/', import.meta.url), { recursive: true });

const base = sharp(svg, { density: 300 }).resize(1024, 1024).flatten({ background: IVORY });

const out = (name) => new URL(`../public/icons/${name}`, import.meta.url).pathname;

await base.clone().resize(512).png().toFile(out('icon-512.png'));
await base.clone().resize(512).png().toFile(out('maskable-512.png'));
await base.clone().resize(192).png().toFile(out('icon-192.png'));
await base.clone().resize(180).png().toFile(out('apple-touch-icon.png'));

console.log('icons written to public/icons/');
