import sharp from "sharp";
import { writeFile, mkdir } from "node:fs/promises";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const publicDir = resolve(__dirname, "..", "public");
const iconsDir = resolve(publicDir, "icons");

const BG = "#09090b";
const FG = "#fafafa";
const ACCENT = "#6366f1";

function iconSvg({ size, inset = 0 }) {
  const c = size / 2;
  const strokeW = size * 0.08;
  const barY = size * 0.78;
  const barX1 = size * (0.25 + inset);
  const barX2 = size * (0.75 - inset);
  const fontSize = size * (0.56 - inset * 1.2);
  return `
<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 ${size} ${size}">
  <rect width="${size}" height="${size}" fill="${BG}"/>
  <text x="${c}" y="${c + fontSize * 0.15}" font-family="ui-sans-serif, system-ui, -apple-system, Segoe UI, Helvetica, Arial" font-size="${fontSize}" font-weight="800" fill="${FG}" text-anchor="middle" dominant-baseline="middle" letter-spacing="-${fontSize * 0.04}">X</text>
  <line x1="${barX1}" y1="${barY}" x2="${barX2}" y2="${barY}" stroke="${ACCENT}" stroke-width="${strokeW}" stroke-linecap="round"/>
</svg>`;
}

async function render(svg, size, outPath) {
  const png = await sharp(Buffer.from(svg)).resize(size, size).png().toBuffer();
  await writeFile(outPath, png);
  console.log("wrote", outPath);
}

async function main() {
  await mkdir(iconsDir, { recursive: true });

  // full-bleed
  await render(iconSvg({ size: 512 }), 192, resolve(iconsDir, "icon-192.png"));
  await render(iconSvg({ size: 512 }), 512, resolve(iconsDir, "icon-512.png"));

  // maskable — inset content ~15% so it survives Android circular mask
  await render(iconSvg({ size: 512, inset: 0.12 }), 512, resolve(iconsDir, "icon-512-maskable.png"));

  // apple-touch-icon — 180×180, must live at /apple-touch-icon.png in public root
  await render(iconSvg({ size: 512 }), 180, resolve(publicDir, "apple-touch-icon.png"));
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
