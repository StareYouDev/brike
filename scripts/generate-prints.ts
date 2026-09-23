/**
 * Renders every print in the catalog as seamless SVG "fabric" artwork.
 * Reads data/catalog.ts directly (Node 24 type stripping) so the catalog
 * stays the single source of truth.
 *
 * Run: node scripts/generate-prints.ts
 */
import { mkdirSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import {
  collections,
  products,
  type PaletteName,
  type PatternType,
} from "../data/catalog.ts";

const OUT = join(process.cwd(), "public", "prints");
mkdirSync(OUT, { recursive: true });

/* ------------------------------------------------------------------ */
/* palettes                                                            */
/* ------------------------------------------------------------------ */

interface Palette {
  bg: string;
  motif: string;
  accent: string;
}

const palettes: Record<PaletteName, Palette> = {
  navy: { bg: "#16233c", motif: "#f4ead9", accent: "#f2c1ae" },
  blush: { bg: "#f3cfc3", motif: "#1d1d1b", accent: "#e47e56" },
  sage: { bg: "#dbe3d2", motif: "#435830", accent: "#f2c1ae" },
  cherry: { bg: "#a3242f", motif: "#f7efe3", accent: "#e8b64c" },
  butter: { bg: "#f4d987", motif: "#1d1d1b", accent: "#e47e56" },
  lilac: { bg: "#ded6ef", motif: "#3c2f5c", accent: "#e47e56" },
  teal: { bg: "#1f5f5b", motif: "#f4ead9", accent: "#f2c1ae" },
  rust: { bg: "#c4622d", motif: "#f7efe3", accent: "#1d1d1b" },
  ink: { bg: "#1d1d1b", motif: "#f4ead9", accent: "#f2c1ae" },
  sky: { bg: "#cfe0ea", motif: "#16233c", accent: "#e47e56" },
  olive: { bg: "#6b7346", motif: "#f4ead9", accent: "#e8b64c" },
};

/* ------------------------------------------------------------------ */
/* deterministic rng                                                   */
/* ------------------------------------------------------------------ */

function mulberry32(seed: number) {
  let a = seed >>> 0;
  return () => {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function hash(str: string): number {
  let h = 2166136261;
  for (let i = 0; i < str.length; i++) {
    h ^= str.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

const r2 = (n: number) => Math.round(n * 100) / 100;

/* ------------------------------------------------------------------ */
/* motif primitives (drawn around cx,cy at "size" scale)               */
/* ------------------------------------------------------------------ */

function flower(cx: number, cy: number, size: number, p: Palette): string {
  const R = size / 2;
  const pr = R * 0.62;
  const orbit = R - pr;
  let petals = "";
  for (let i = 0; i < 5; i++) {
    const a = (i * 72 - 90) * (Math.PI / 180);
    petals += `<circle cx="${r2(cx + orbit * Math.cos(a))}" cy="${r2(cy + orbit * Math.sin(a))}" r="${r2(pr)}" fill="${p.motif}"/>`;
  }
  return `${petals}<circle cx="${cx}" cy="${cy}" r="${r2(R * 0.42)}" fill="${p.accent}"/>`;
}

function star(cx: number, cy: number, size: number, fill: string): string {
  const R = size / 2;
  const r = R * 0.42;
  const pts: string[] = [];
  for (let i = 0; i < 10; i++) {
    const rad = i % 2 === 0 ? R : r;
    const a = (i * 36 - 90) * (Math.PI / 180);
    pts.push(`${r2(cx + rad * Math.cos(a))},${r2(cy + rad * Math.sin(a))}`);
  }
  return `<polygon points="${pts.join(" ")}" fill="${fill}"/>`;
}

function moon(cx: number, cy: number, size: number, fill: string): string {
  const r = size / 2;
  return `<path d="M ${cx} ${r2(cy - r)} A ${r2(r)} ${r2(r)} 0 1 0 ${cx} ${r2(cy + r)} A ${r2(r * 0.62)} ${r2(r)} 0 1 1 ${cx} ${r2(cy - r)} Z" fill="${fill}"/>`;
}

function snowflake(cx: number, cy: number, size: number, p: Palette): string {
  const R = size / 2;
  let g = "";
  for (let i = 0; i < 3; i++) {
    const a = i * 60 * (Math.PI / 180);
    const dx = R * Math.cos(a);
    const dy = R * Math.sin(a);
    g += `<line x1="${r2(cx - dx)}" y1="${r2(cy - dy)}" x2="${r2(cx + dx)}" y2="${r2(cy + dy)}" stroke="${p.motif}" stroke-width="${r2(R * 0.16)}" stroke-linecap="round"/>`;
    for (const t of [-0.55, 0.55]) {
      const bx = cx + dx * t;
      const by = cy + dy * t;
      const ta = a + (t > 0 ? 0.7 : -0.7);
      g += `<line x1="${r2(bx)}" y1="${r2(by)}" x2="${r2(bx + R * 0.32 * Math.cos(ta))}" y2="${r2(by + R * 0.32 * Math.sin(ta))}" stroke="${p.motif}" stroke-width="${r2(R * 0.13)}" stroke-linecap="round"/>`;
    }
  }
  return `${g}<circle cx="${cx}" cy="${cy}" r="${r2(R * 0.2)}" fill="${p.accent}"/>`;
}

function sprig(x: number, y: number, size: number, rot: number, p: Palette): string {
  const l = size / 2;
  let g = `<line x1="${x}" y1="${r2(y - l)}" x2="${x}" y2="${r2(y + l)}" stroke="${p.motif}" stroke-width="${r2(size * 0.07)}" stroke-linecap="round"/>`;
  for (const t of [-0.62, -0.2, 0.22, 0.64]) {
    const side = t < 0 ? -1 : 1;
    g += `<ellipse cx="${r2(x + side * size * 0.16)}" cy="${r2(y + t * l)}" rx="${r2(size * 0.16)}" ry="${r2(size * 0.085)}" fill="${p.motif}" transform="rotate(${side * 38} ${r2(x + side * size * 0.16)} ${r2(y + t * l)})"/>`;
  }
  return `<g transform="rotate(${rot} ${x} ${y})">${g}</g>`;
}

function dot(cx: number, cy: number, r: number, fill: string): string {
  return `<circle cx="${cx}" cy="${cy}" r="${r2(r)}" fill="${fill}"/>`;
}

/* ------------------------------------------------------------------ */
/* seamless helpers                                                    */
/* ------------------------------------------------------------------ */

/** replicate a group of items across the 3×3 neighbourhood so clipped edges continue seamlessly */
function toss(items: string[], w = 100, h = 100): string {
  const out: string[] = [];
  for (let dx = -1; dx <= 1; dx++) {
    for (let dy = -1; dy <= 1; dy++) {
      out.push(`<g transform="translate(${dx * w} ${dy * h})">${items.join("")}</g>`);
    }
  }
  return out.join("");
}

/** a line centred at position p, duplicated so it survives tile clipping */
function lineH(p: number, thick: number, fill: string, w = 100): string {
  return `<rect x="0" y="${r2(p - thick / 2)}" width="${w}" height="${r2(thick)}" fill="${fill}"/><rect x="0" y="${r2(100 + p - thick / 2)}" width="${w}" height="${r2(thick)}" fill="${fill}"/>`;
}
function lineV(p: number, thick: number, fill: string): string {
  return `<rect x="${r2(p - thick / 2)}" y="0" width="${r2(thick)}" height="100" fill="${fill}"/><rect x="${r2(100 + p - thick / 2)}" y="0" width="${r2(thick)}" height="100" fill="${fill}"/>`;
}

/* ------------------------------------------------------------------ */
/* tile renderers — each draws into a 100×100 pattern tile              */
/* ------------------------------------------------------------------ */

function tileContent(type: PatternType, p: Palette, rng: () => number): string {
  switch (type) {
    case "stripe": {
      const vertical = rng() > 0.55;
      let g = "";
      for (let i = 0; i < 4; i++) {
        const base = i * 25;
        const band = vertical ? lineV(base + 5, 12, p.motif) : lineH(base + 5, 12, p.motif);
        const seam = vertical ? lineV(base + 19, 3, p.accent) : lineH(base + 19, 3, p.accent);
        g += band + seam;
      }
      return g;
    }
    case "gingham": {
      let g = "";
      for (let i = 0; i < 4; i++) {
        const b = i * 25;
        g += `<rect x="0" y="${b + 6}" width="100" height="13" fill="${p.motif}" fill-opacity="0.5"/>`;
        g += `<rect x="${b + 6}" y="0" width="13" height="100" fill="${p.motif}" fill-opacity="0.5"/>`;
      }
      g += lineH(0, 1.5, p.accent) + lineV(0, 1.5, p.accent);
      g += lineH(50, 1.5, p.accent) + lineV(50, 1.5, p.accent);
      return g;
    }
    case "check": {
      let g = "";
      for (const pos of [10, 30, 50, 70, 90]) g += lineV(pos, 5, p.motif) + lineH(pos, 5, p.motif);
      for (const pos of [0, 20, 40, 60, 80]) g += lineV(pos, 2, p.accent) + lineH(pos, 2, p.accent);
      return g;
    }
    case "harlequin": {
      const d = (cx: number, cy: number, fill: string) =>
        `<polygon points="${cx},${cy - 50} ${cx + 50},${cy} ${cx},${cy + 50} ${cx - 50},${cy}" fill="${fill}"/>`;
      let g = d(50, 50, p.motif) + d(0, 0, p.accent) + d(100, 0, p.accent) + d(0, 100, p.accent) + d(100, 100, p.accent);
      g += `<path d="M 50 0 L 100 50 L 50 100 L 0 50 Z M 50 0 L 0 50 L 50 100 L 100 50" fill="none" stroke="${p.bg}" stroke-width="3"/>`;
      g += dot(50, 50, 6, p.bg) + dot(0, 0, 6, p.bg) + dot(100, 0, 6, p.bg) + dot(0, 100, 6, p.bg) + dot(100, 100, 6, p.bg);
      return g;
    }
    case "dot":
      return toss([
        dot(30, 30, 8.5, p.motif),
        dot(76, 74, 8.5, p.motif),
        dot(72, 26, 4.5, p.accent),
        dot(26, 76, 4.5, p.accent),
        dot(52, 54, 2.5, p.motif),
      ]);
    case "floral":
      return toss([
        flower(32, 34, 34, p),
        flower(76, 76, 24, p),
        flower(80, 22, 15, p),
        sprig(18, 80, 30, 34, p),
        sprig(60, 50, 22, -120, p),
        dot(54, 88, 2.5, p.accent),
        dot(12, 44, 2.5, p.accent),
      ]);
    case "celestial":
      return toss([
        moon(32, 30, 30, p.motif),
        star(72, 68, 20, p.motif),
        star(20, 78, 13, p.accent),
        star(84, 22, 11, p.motif),
        dot(54, 52, 3, p.accent),
        dot(46, 92, 2.5, p.motif),
        dot(94, 48, 2.5, p.accent),
      ]);
    case "leaf":
      return toss([
        sprig(34, 32, 40, -28, p),
        sprig(76, 74, 34, 138, p),
        sprig(84, 24, 22, 64, p),
        sprig(18, 82, 24, -132, p),
        dot(56, 56, 3, p.accent),
      ]);
    case "snow":
      return toss([
        snowflake(34, 34, 36, p),
        snowflake(78, 76, 22, p),
        snowflake(20, 82, 15, p),
        dot(74, 24, 4, p.accent),
        dot(54, 60, 2.5, p.motif),
        dot(92, 52, 3, p.accent),
      ]);
  }
}

/* ------------------------------------------------------------------ */
/* full artwork builders                                               */
/* ------------------------------------------------------------------ */

const fabricLighting = `
  <linearGradient id="light" x1="0" y1="0" x2="1" y2="1">
    <stop offset="0" stop-color="#ffffff" stop-opacity="0.14"/>
    <stop offset="0.5" stop-color="#ffffff" stop-opacity="0"/>
    <stop offset="1" stop-color="#000000" stop-opacity="0.12"/>
  </linearGradient>
  <radialGradient id="vig" cx="0.5" cy="0.42" r="0.78">
    <stop offset="0.55" stop-color="#000000" stop-opacity="0"/>
    <stop offset="1" stop-color="#000000" stop-opacity="0.16"/>
  </radialGradient>`;

function patternDef(
  id: string,
  type: PatternType,
  name: PaletteName,
  scale = 1,
  seedKey = "",
): string {
  const p = palettes[name];
  const rng = mulberry32(hash(`${type}-${name}-${seedKey}`));
  const content = tileContent(type, p, rng);
  const transform = scale === 1 ? "" : ` patternTransform="scale(${scale})"`;
  return `<pattern id="${id}" width="100" height="100" patternUnits="userSpaceOnUse"${transform}>${content}</pattern>`;
}

function productPrint(
  type: PatternType,
  name: PaletteName,
  w = 600,
  h = 750,
): string {
  const p = palettes[name];
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}" viewBox="0 0 ${w} ${h}">
  <defs>${patternDef("pat", type, name)}${fabricLighting}</defs>
  <rect width="${w}" height="${h}" fill="${p.bg}"/>
  <rect width="${w}" height="${h}" fill="url(#pat)"/>
  <rect width="${w}" height="${h}" fill="url(#light)"/>
  <rect width="${w}" height="${h}" fill="url(#vig)"/>
</svg>
`;
}

function collectionArt(type: PatternType, a: PaletteName, b: PaletteName, seedKey: string): string {
  const p = palettes[a];
  const alt = palettes[b];
  const rng = mulberry32(hash(`col-${seedKey}`));
  const motifs: string[] = [];
  const spots = [
    [240, 260],
    [960, 640],
    [700, 180],
    [380, 720],
    [1130, 260],
    [140, 620],
  ];
  for (const [x, y] of spots) {
    const s = 70 + Math.floor(rng() * 70);
    if (type === "celestial" || type === "snow" || type === "harlequin") {
      motifs.push(rng() > 0.5 ? star(x, y, s, alt.motif) : moon(x, y, s, alt.motif));
    } else if (type === "stripe" || type === "gingham" || type === "check") {
      motifs.push(flower(x, y, s, alt));
    } else {
      motifs.push(rng() > 0.4 ? flower(x, y, s, alt) : sprig(x, y, s, rng() * 180 - 90, alt));
    }
  }
  return `<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="900" viewBox="0 0 1200 900">
  <defs>
    ${patternDef("pat", type, a, 2, seedKey)}
    <linearGradient id="fade" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0.45" stop-color="#000000" stop-opacity="0"/>
      <stop offset="1" stop-color="#000000" stop-opacity="0.34"/>
    </linearGradient>${fabricLighting}
  </defs>
  <rect width="1200" height="900" fill="${p.bg}"/>
  <rect width="1200" height="900" fill="url(#pat)"/>
  <circle cx="900" cy="240" r="320" fill="${alt.accent}" fill-opacity="0.28"/>
  <circle cx="300" cy="700" r="240" fill="${alt.motif}" fill-opacity="0.14"/>
  ${motifs.join("\n  ")}
  <rect width="1200" height="900" fill="url(#fade)"/>
  <rect width="1200" height="900" fill="url(#light)"/>
</svg>
`;
}

function heroArt(): string {
  return `<svg xmlns="http://www.w3.org/2000/svg" width="1600" height="1000" viewBox="0 0 1600 1000">
  <defs>
    ${patternDef("patA", "celestial", "navy", 1.15, "hero")}
    ${patternDef("patB", "floral", "blush", 1, "hero")}
    ${patternDef("patC", "check", "butter", 0.9, "hero")}
    ${fabricLighting}
  </defs>
  <rect width="1600" height="1000" fill="#f2c1ae"/>
  <circle cx="1310" cy="230" r="400" fill="#fdf6ef" fill-opacity="0.5"/>
  <circle cx="330" cy="820" r="300" fill="#e47e56" fill-opacity="0.22"/>
  <g transform="rotate(-6 1040 520)">
    <rect x="770" y="150" width="540" height="760" rx="30" fill="#16233c"/>
    <rect x="770" y="150" width="540" height="760" rx="30" fill="url(#patA)"/>
    <rect x="770" y="150" width="540" height="760" rx="30" fill="url(#light)"/>
  </g>
  <g transform="rotate(9 1370 640)">
    <rect x="1200" y="420" width="360" height="500" rx="26" fill="#f3cfc3"/>
    <rect x="1200" y="420" width="360" height="500" rx="26" fill="url(#patB)"/>
    <rect x="1200" y="420" width="360" height="500" rx="26" fill="url(#light)"/>
  </g>
  <g transform="rotate(-13 700 780)">
    <rect x="560" y="640" width="300" height="300" rx="22" fill="#f4d987"/>
    <rect x="560" y="640" width="300" height="300" rx="22" fill="url(#patC)"/>
    <rect x="560" y="640" width="300" height="300" rx="22" fill="url(#light)"/>
  </g>
  ${star(470, 210, 64, "#1d1d1b")}
  ${moon(250, 420, 74, "#fdf6ef")}
  ${flower(640, 380, 92, { bg: "#f2c1ae", motif: "#1d1d1b", accent: "#fdf6ef" })}
  ${star(1480, 160, 40, "#fdf6ef")}
  ${dot(170, 170, 12, "#1d1d1b")}
  ${dot(1520, 880, 14, "#1d1d1b")}
</svg>
`;
}

function aboutArt(): string {
  const p = palettes.sage;
  return `<svg xmlns="http://www.w3.org/2000/svg" width="1000" height="1200" viewBox="0 0 1000 1200">
  <defs>${patternDef("pat", "floral", "sage", 1.4, "about")}${fabricLighting}</defs>
  <rect width="1000" height="1200" fill="${p.bg}"/>
  <rect width="1000" height="1200" fill="url(#pat)"/>
  <path d="M 180 1200 L 180 480 A 320 320 0 0 1 820 480 L 820 1200 Z" fill="#fdf6ef"/>
  <path d="M 180 1200 L 180 480 A 320 320 0 0 1 820 480 L 820 1200 Z" fill="url(#light)"/>
  ${flower(500, 640, 240, { bg: "#fdf6ef", motif: "#435830", accent: "#f2c1ae" })}
  ${star(360, 980, 60, "#435830")}
  ${moon(650, 990, 66, "#e47e56")}
  ${sprig(500, 1080, 120, 0, { bg: "#fdf6ef", motif: "#435830", accent: "#f2c1ae" })}
</svg>
`;
}

function charityArt(): string {
  const p = palettes.navy;
  return `<svg xmlns="http://www.w3.org/2000/svg" width="1600" height="440" viewBox="0 0 1600 440">
  <defs>${patternDef("pat", "celestial", "navy", 1.5, "charity")}${fabricLighting}</defs>
  <rect width="1600" height="440" fill="${p.bg}"/>
  <rect width="1600" height="440" fill="url(#pat)"/>
  <rect width="1600" height="440" fill="#000000" fill-opacity="0.18"/>
  <rect width="1600" height="440" fill="url(#vig)"/>
</svg>
`;
}

function motifArt(kind: "star" | "moon" | "flower", tone: "ink" | "cream"): string {
  const colors =
    tone === "ink"
      ? { motif: "#1d1d1b", accent: "#e47e56" }
      : { motif: "#fdf6ef", accent: "#f2c1ae" };
  const p: Palette = { bg: "transparent", ...colors };
  let body = "";
  if (kind === "star") body = star(100, 100, 120, p.motif);
  if (kind === "moon") body = moon(100, 100, 130, p.motif);
  if (kind === "flower") body = flower(100, 100, 150, p);
  return `<svg xmlns="http://www.w3.org/2000/svg" width="200" height="200" viewBox="0 0 200 200">${body}</svg>
`;
}

/* ------------------------------------------------------------------ */
/* write everything                                                    */
/* ------------------------------------------------------------------ */

let count = 0;
const write = (name: string, svg: string) => {
  writeFileSync(join(OUT, name), svg, "utf8");
  count++;
};

for (const product of products) {
  write(`${product.slug}-a.svg`, productPrint(product.print.type, product.print.a));
  write(`${product.slug}-b.svg`, productPrint(product.print.type, product.print.b));
}

for (const collection of collections) {
  write(
    `collection-${collection.slug}.svg`,
    collectionArt(collection.print.type, collection.print.a, collection.print.b, collection.slug),
  );
}

write("hero.svg", heroArt());
write("about.svg", aboutArt());
write("charity.svg", charityArt());

for (const kind of ["star", "moon", "flower"] as const) {
  for (const tone of ["ink", "cream"] as const) {
    write(`motif-${kind}-${tone}.svg`, motifArt(kind, tone));
  }
}

console.log(`✓ generated ${count} SVG files in public/prints`);
