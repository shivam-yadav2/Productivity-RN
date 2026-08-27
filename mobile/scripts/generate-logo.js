/**
 * Generates the app's logo assets (OS icon, Android adaptive icon layers, favicon,
 * splash image) from one vector "P" monogram definition, and writes matching PNGs
 * into assets/. Run with: node scripts/generate-logo.js
 *
 * Mark: a bold geometric "P" (stem + bowl) whose counter (the hole in the bowl) is a
 * rounded square rather than the usual oval, echoing the app's own rounded-2xl UI
 * language instead of introducing a new motif.
 */
const fs = require('fs');
const path = require('path');
const sharp = require('sharp');

const ZINC_900 = '#18181B';
const WHITE = '#FFFFFF';

// Glyph paths in a 100x100 viewBox, centered.
const STEM = `<rect x="32" y="24" width="14" height="52" rx="7"/>`;
const BOWL = `<rect x="32" y="24" width="40" height="34" rx="17"/>`;
const COUNTER = `<rect x="46" y="32" width="16" height="18" rx="9"/>`;

function glyphSvg({ size, fill, scale = 1, cutCounter, counterFill }) {
  // scale shrinks the glyph toward canvas center (used for the Android safe zone).
  const t = scale === 1 ? '' : `translate(50 50) scale(${scale}) translate(-50 -50)`;
  const counter = cutCounter
    ? `<g fill="${counterFill}">${COUNTER}</g>`
    : '';
  return `<svg width="${size}" height="${size}" viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg">
    <g transform="${t}">
      <g fill="${fill}">${STEM}${BOWL}</g>
      ${counter}
    </g>
  </svg>`;
}

function backgroundSvg(size, fill) {
  return `<svg width="${size}" height="${size}" viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg">
    <rect x="0" y="0" width="100" height="100" fill="${fill}"/>
  </svg>`;
}

async function renderOpaque(outPath, size, scale) {
  // Opaque icon: bg + glyph, counter punched by filling it with the bg color directly
  // (no real alpha needed — iOS/store icons must be fully opaque, no transparency).
  const bg = sharp(Buffer.from(backgroundSvg(size, ZINC_900))).png();
  const glyph = Buffer.from(
    glyphSvg({ size, fill: WHITE, scale, cutCounter: true, counterFill: ZINC_900 })
  );
  await bg.composite([{ input: glyph }]).toFile(outPath);
  console.log(`Wrote ${outPath}`);
}

async function renderTransparentGlyph(outPath, size, scale) {
  // Transparent glyph (for Android adaptive-icon foreground/monochrome + splash):
  // render the solid glyph, then punch a REAL transparent hole for the counter using
  // dest-out compositing (filling with a color wouldn't work — there's no bg to match).
  const base = sharp(Buffer.from(glyphSvg({ size, fill: WHITE, scale, cutCounter: false })));
  const counterMask = Buffer.from(
    glyphSvg({ size, fill: 'none', scale, cutCounter: true, counterFill: WHITE })
  );
  await base.composite([{ input: counterMask, blend: 'dest-out' }]).png().toFile(outPath);
  console.log(`Wrote ${outPath}`);
}

async function renderSolid(outPath, size, fill) {
  await sharp(Buffer.from(backgroundSvg(size, fill))).png().toFile(outPath);
  console.log(`Wrote ${outPath}`);
}

const outDir = path.join(__dirname, '..', 'assets');

(async () => {
  // Full-bleed square, opaque — OS applies its own corner mask on top.
  await renderOpaque(path.join(outDir, 'icon.png'), 1024, 1);

  // Android adaptive icon: separate background + foreground (+ monochrome) layers.
  // Foreground/monochrome glyph is shrunk to sit inside the ~66% safe zone every
  // launcher mask (circle, squircle, rounded square, ...) can clip to.
  await renderSolid(path.join(outDir, 'android-icon-background.png'), 1024, ZINC_900);
  await renderTransparentGlyph(path.join(outDir, 'android-icon-foreground.png'), 1024, 0.62);
  await renderTransparentGlyph(path.join(outDir, 'android-icon-monochrome.png'), 1024, 0.62);

  // Web favicon — small, so keep it simple/opaque like the main icon.
  await renderOpaque(path.join(outDir, 'favicon.png'), 196, 1);

  // Splash image: transparent glyph only: expo-splash-screen draws it centered over
  // its own configured backgroundColor.
  await renderTransparentGlyph(path.join(outDir, 'splash-icon.png'), 512, 1);

  console.log('Done.');
})();
