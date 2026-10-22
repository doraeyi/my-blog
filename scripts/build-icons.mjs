// Rasterises the LIAM seal into every icon size the site serves.
// Run after scripts/make-seal.py regenerates src/lib/assets/brand/*.svg:
//   node scripts/build-icons.mjs
import { readFileSync, writeFileSync } from 'node:fs';
import { Resvg } from '@resvg/resvg-js';

const read = (p) => readFileSync(new URL(`../${p}`, import.meta.url), 'utf8');
const write = (p, data) => writeFileSync(new URL(`../${p}`, import.meta.url), data);
const png = (svg, size) => new Resvg(svg, { fitTo: { mode: 'width', value: size } }).render().asPng();

const small = read('src/lib/assets/brand/seal-small.svg');
const icon = read('src/lib/assets/brand/app-icon.svg');

// Browser tab fallbacks (the SVG favicon is preferred where supported).
const tabSizes = [16, 32, 48];
const tabPngs = tabSizes.map((size) => png(small, size));
tabSizes.forEach((size, i) => write(`static/favicon-${size}.png`, tabPngs[i]));

// favicon.ico: an ICO container holding the three PNGs as-is.
const header = Buffer.alloc(6 + 16 * tabPngs.length);
header.writeUInt16LE(1, 2); // type: icon
header.writeUInt16LE(tabPngs.length, 4);
let offset = header.length;
tabPngs.forEach((data, i) => {
	const e = 6 + i * 16;
	header.writeUInt8(tabSizes[i], e);
	header.writeUInt8(tabSizes[i], e + 1);
	header.writeUInt16LE(1, e + 4); // colour planes
	header.writeUInt16LE(32, e + 6); // bits per pixel
	header.writeUInt32LE(data.length, e + 8);
	header.writeUInt32LE(offset, e + 12);
	offset += data.length;
});
write('static/favicon.ico', Buffer.concat([header, ...tabPngs]));
// Home-screen / PWA icons on opaque card stock.
write('static/apple-touch-icon.png', png(icon, 180));
write('static/icon-192.png', png(icon, 192));
write('static/icon-512.png', png(icon, 512));
console.log('icons written');
