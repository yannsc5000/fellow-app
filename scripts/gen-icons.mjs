// Generates every raster/vector app icon from Fellow's "classic ring" brand mark, so the
// favicon, PWA icons, Apple touch icon and social card all stay in lockstep with the logo.
//   node scripts/gen-icons.mjs
// Writes: src/app/icon.svg (favicon), src/app/apple-icon.png (180),
//         public/icon-192.png, public/icon-512.png, public/icon-maskable-512.png
import { writeFile } from "node:fs/promises";
import sharp from "sharp";

const TEAL_A = "#12a394", TEAL_B = "#0a655c", WHITE = "#ffffff", ACCENT = "#f4511e";

// The ring: 8 seats around a circle. Seven are "people" (white); the eighth, at the bottom,
// is the warm accent (the newcomer). Same geometry as the <Mark> component (viewBox 0..100).
function ringDots(cx, cy, R, dotR, accentR) {
  const out = [];
  for (let k = 0; k < 8; k++) {
    const a = (k * 45 * Math.PI) / 180;         // 0 = top, clockwise
    const x = cx + R * Math.sin(a);
    const y = cy - R * Math.cos(a);
    const isAccent = k === 4;                     // bottom seat
    out.push(`<circle cx="${x.toFixed(2)}" cy="${y.toFixed(2)}" r="${(isAccent ? accentR : dotR).toFixed(2)}" fill="${isAccent ? ACCENT : WHITE}"/>`);
  }
  return out.join("");
}

// size: viewBox size; rounded: corner radius (0 = full-bleed); ringScale: ring radius / (size/2).
// "Sheen" polish: a soft top highlight + a gentle bottom shade, so the tile reads as lit from
// above. Kept faint; the ring dots stay flat and sit on top of the sheen.
function tileSVG({ size = 100, rounded = 22, ringScale = 0.6 } = {}) {
  const c = size / 2;
  const R = c * ringScale;
  const dotR = R * (7 / 30);       // matches Mark: ring R=30, dot r=7
  const accentR = R * (8.5 / 30);
  const rx = rounded ? (size * rounded) / 100 : 0;
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 ${size} ${size}">
  <defs>
    <linearGradient id="g" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0" stop-color="${TEAL_A}"/><stop offset="1" stop-color="${TEAL_B}"/>
    </linearGradient>
    <linearGradient id="sheen" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0" stop-color="#ffffff" stop-opacity="0.20"/>
      <stop offset="0.45" stop-color="#ffffff" stop-opacity="0.02"/>
      <stop offset="0.62" stop-color="#ffffff" stop-opacity="0"/>
    </linearGradient>
    <linearGradient id="vig" x1="0" y1="1" x2="0" y2="0">
      <stop offset="0" stop-color="#003b35" stop-opacity="0.22"/>
      <stop offset="0.4" stop-color="#003b35" stop-opacity="0"/>
    </linearGradient>
    <clipPath id="clip"><rect width="${size}" height="${size}" rx="${rx}"/></clipPath>
  </defs>
  <rect width="${size}" height="${size}" rx="${rx}" fill="url(#g)"/>
  <g clip-path="url(#clip)">
    <rect width="${size}" height="${size}" fill="url(#sheen)"/>
    <rect width="${size}" height="${size}" fill="url(#vig)"/>
  </g>
  ${ringDots(c, c, R, dotR, accentR)}
</svg>`;
}

const png = (svg, px) => sharp(Buffer.from(svg)).resize(px, px).png().toBuffer();

const root = new URL("..", import.meta.url);
const p = (rel) => new URL(rel, root);

// Favicon — crisp vector, rounded tile.
const faviconSVG = tileSVG({ size: 100, rounded: 22, ringScale: 0.6 });
await writeFile(p("src/app/icon.svg"), faviconSVG);

// PWA "any" icons — rounded tile.
const tile = tileSVG({ size: 512, rounded: 22, ringScale: 0.6 });
await writeFile(p("public/icon-192.png"), await png(tile, 192));
await writeFile(p("public/icon-512.png"), await png(tile, 512));

// Maskable — full-bleed teal, ring pulled into the safe zone (~48%).
const maskable = tileSVG({ size: 512, rounded: 0, ringScale: 0.48 });
await writeFile(p("public/icon-maskable-512.png"), await png(maskable, 512));

// Apple touch icon — full-bleed (iOS rounds it), ring a touch smaller.
const apple = tileSVG({ size: 180, rounded: 0, ringScale: 0.56 });
await writeFile(p("src/app/apple-icon.png"), await png(apple, 180));

console.log("+ wrote src/app/icon.svg, src/app/apple-icon.png, public/icon-192.png, public/icon-512.png, public/icon-maskable-512.png");
