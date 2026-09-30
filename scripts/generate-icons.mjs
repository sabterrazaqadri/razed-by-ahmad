// Renders the PWA icons + favicon from an SVG monogram (gold R on #07060A).
// Run: npm run icons   (writes into public/ — commit the results)
//
// The R is drawn as paths, not text, so it renders identically on every
// machine regardless of installed fonts.

import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import sharp from "sharp";

const OUT = path.resolve("public");
const INK = "#07060A";
const GOLD = "#C6A15B";
const GOLD_HI = "#E9D6AC";

// A Didone-style R in a 512 box: hairline serifs, thick stem, thin/thick bowl.
const R_PATH = [
  // stem
  "M176 136 H212 V376 H176 Z",
  // top + bottom stem serifs (hairlines)
  "M150 136 H236 V142 H150 Z",
  "M150 370 H238 V376 H150 Z",
  // leg + its serif
  "M244 250 H278 L350 370 H316 Z",
  "M300 370 H368 V376 H300 Z",
].join(" ");
const R_BOWL_OUTER = "M212 136 H270 C318 136 346 162 346 196 C346 230 318 256 270 256 H212 Z";
const R_BOWL_INNER = "M212 142 H262 C296 142 312 166 312 196 C312 226 296 250 262 250 H212 Z";

function monogram({ maskable = false } = {}) {
  // Maskable icons get cropped to a circle/squircle: keep the mark within the
  // central 80% safe zone and drop the frame.
  const scale = maskable ? 0.78 : 1;
  const t = (512 - 512 * scale) / 2;
  return `<svg xmlns="http://www.w3.org/2000/svg" width="512" height="512" viewBox="0 0 512 512">
  <defs>
    <linearGradient id="g" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0" stop-color="${GOLD_HI}"/>
      <stop offset=".55" stop-color="${GOLD}"/>
      <stop offset="1" stop-color="#8A6F3C"/>
    </linearGradient>
    <radialGradient id="glow" cx=".5" cy=".42" r=".6">
      <stop offset="0" stop-color="${GOLD}" stop-opacity=".16"/>
      <stop offset="1" stop-color="${GOLD}" stop-opacity="0"/>
    </radialGradient>
  </defs>
  <rect width="512" height="512" fill="${INK}"/>
  <rect width="512" height="512" fill="url(#glow)"/>
  ${maskable ? "" : `<rect x="52" y="52" width="408" height="408" fill="none" stroke="${GOLD}" stroke-opacity=".45" stroke-width="3"/>`}
  <g transform="translate(${t - 3 * scale} ${t}) scale(${scale})" fill="url(#g)">
    <path d="${R_PATH}"/>
    <path fill-rule="evenodd" d="${R_BOWL_OUTER} ${R_BOWL_INNER}"/>
  </g>
</svg>`;
}

async function png(svg, size) {
  return sharp(Buffer.from(svg)).resize(size, size).png({ compressionLevel: 9 }).toBuffer();
}

/** Minimal .ico writer: PNG-compressed entries (supported by every modern browser). */
function ico(images) {
  const header = Buffer.alloc(6);
  header.writeUInt16LE(0, 0);
  header.writeUInt16LE(1, 2);
  header.writeUInt16LE(images.length, 4);
  const dir = Buffer.alloc(16 * images.length);
  let offset = 6 + dir.length;
  images.forEach(({ size, data }, i) => {
    const o = i * 16;
    dir.writeUInt8(size >= 256 ? 0 : size, o);
    dir.writeUInt8(size >= 256 ? 0 : size, o + 1);
    dir.writeUInt8(0, o + 2);
    dir.writeUInt8(0, o + 3);
    dir.writeUInt16LE(1, o + 4);
    dir.writeUInt16LE(32, o + 6);
    dir.writeUInt32LE(data.length, o + 8);
    dir.writeUInt32LE(offset, o + 12);
    offset += data.length;
  });
  return Buffer.concat([header, dir, ...images.map((x) => x.data)]);
}

async function main() {
  await mkdir(path.join(OUT, "icons"), { recursive: true });
  const std = monogram();
  const mask = monogram({ maskable: true });

  await writeFile(path.join(OUT, "icons", "icon.svg"), std);
  await writeFile(path.join(OUT, "icons", "icon-192.png"), await png(std, 192));
  await writeFile(path.join(OUT, "icons", "icon-512.png"), await png(std, 512));
  await writeFile(path.join(OUT, "icons", "icon-maskable-512.png"), await png(mask, 512));
  await writeFile(path.join(OUT, "icons", "apple-touch-icon.png"), await png(mask, 180));

  const favSizes = [16, 32, 48];
  const favs = await Promise.all(favSizes.map(async (size) => ({ size, data: await png(mask, size) })));
  await writeFile(path.join(OUT, "favicon.ico"), ico(favs));

  console.log("Icons written to public/icons and public/favicon.ico");
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
