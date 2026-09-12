/* Garment surface: print layout, woven normal map, colourways. */

import * as THREE from 'three';
import { getPathArt } from './art.js';

export const COLORWAYS = [
  { id: 'onyx',   name: 'Onyx',        hex: '#0c0c0e', light: false },
  { id: 'bone',   name: 'Bone',        hex: '#c7bca6', light: true  },
  { id: 'olive',  name: 'Field Olive', hex: '#31362a', light: false },
  { id: 'oxblood',name: 'Oxblood',     hex: '#3b161a', light: false }
];

const TEX_W = 2048;
const TEX_H = 1024;

/* ---------- helpers ---------- */

function goldGradient(ctx, x0, y0, x1, y1) {
  const g = ctx.createLinearGradient(x0, y0, x1, y1);
  g.addColorStop(0.00, '#fdf3cd');
  g.addColorStop(0.22, '#f0cd7c');
  g.addColorStop(0.48, '#c2922c');
  g.addColorStop(0.62, '#8a5f18');
  g.addColorStop(0.82, '#e9c76e');
  g.addColorStop(1.00, '#fcf0c2');
  return g;
}

/** Draw centred text with manual letter spacing so it renders the same everywhere. */
function tracked(ctx, text, cx, y, spacing) {
  const chars = [...text];
  const widths = chars.map(c => ctx.measureText(c).width);
  const total = widths.reduce((a, b) => a + b, 0) + spacing * (chars.length - 1);
  let x = cx - total / 2;
  chars.forEach((c, i) => {
    ctx.fillText(c, x, y);
    x += widths[i] + spacing;
  });
  return total;
}

/**
 * Turn black-background art into an alpha-keyed print so it sits on any
 * colourway. The orb itself stays fully opaque — keying it purely on
 * luminance would delete every silhouette inside the scene, which is
 * invisible on black fabric but very visible on bone.
 */
function keyBlack(source) {
  const c = document.createElement('canvas');
  c.width = source.width;
  c.height = source.height;
  const ctx = c.getContext('2d');
  ctx.drawImage(source, 0, 0);
  const img = ctx.getImageData(0, 0, c.width, c.height);
  const d = img.data;
  const cx = c.width * 0.5, cy = c.height * 0.47;
  const rIn = c.width * 0.42, rOut = c.width * 0.48;
  for (let y = 0; y < c.height; y++) {
    for (let x = 0; x < c.width; x++) {
      const i = (y * c.width + x) * 4;
      const lum = Math.max(d[i], d[i + 1], d[i + 2]);
      const soft = Math.min(255, Math.round(Math.pow(lum / 255, 0.62) * 275));
      const dist = Math.hypot(x - cx, y - cy);
      // fully opaque inside the disc, feathering out to the luminance key
      const t = dist <= rIn ? 1 : dist >= rOut ? 0 : 1 - (dist - rIn) / (rOut - rIn);
      const disc = Math.round(255 * (t * t * (3 - 2 * t)));
      d[i + 3] = Math.max(soft, disc);
    }
  }
  ctx.putImageData(img, 0, 0);
  return c;
}

let crestImage = null;
export function loadCrest() {
  if (crestImage) return Promise.resolve(crestImage);
  return new Promise(resolve => {
    const img = new Image();
    img.onload = () => { crestImage = img; resolve(img); };
    img.onerror = () => resolve(null);
    img.src = 'assets/logo-fc.svg';
  });
}

/* ---------- woven normal map ---------- */

let normalTexture = null;
export function fabricNormalMap() {
  if (normalTexture) return normalTexture;
  const N = 256;
  const height = new Float32Array(N * N);
  for (let y = 0; y < N; y++) {
    for (let x = 0; x < N; x++) {
      // plain weave: warp and weft crossing, plus fibre noise
      const weave = Math.sin((x / N) * Math.PI * 2 * 32) * Math.sin((y / N) * Math.PI * 2 * 32);
      const slub = Math.sin(x * 0.7 + Math.sin(y * 0.31) * 2.0) * 0.25;
      height[y * N + x] = weave * 0.6 + slub;
    }
  }
  const c = document.createElement('canvas');
  c.width = c.height = N;
  const ctx = c.getContext('2d');
  const img = ctx.createImageData(N, N);
  const at = (x, y) => height[((y + N) % N) * N + ((x + N) % N)];
  for (let y = 0; y < N; y++) {
    for (let x = 0; x < N; x++) {
      const dx = at(x + 1, y) - at(x - 1, y);
      const dy = at(x, y + 1) - at(x, y - 1);
      const len = Math.hypot(dx, dy, 1);
      const i = (y * N + x) * 4;
      img.data[i]     = ((-dx / len) * 0.5 + 0.5) * 255;
      img.data[i + 1] = ((-dy / len) * 0.5 + 0.5) * 255;
      img.data[i + 2] = ((1 / len) * 0.5 + 0.5) * 255;
      img.data[i + 3] = 255;
    }
  }
  ctx.putImageData(img, 0, 0);
  normalTexture = new THREE.CanvasTexture(c);
  normalTexture.wrapS = normalTexture.wrapT = THREE.RepeatWrapping;
  normalTexture.repeat.set(26, 14);
  return normalTexture;
}

/* ---------- the print layout ---------- */

const textureCache = new Map();

/**
 * Build the wrapped garment texture.
 * u 0.00-0.50 is the front panel (centre front at u=0.25),
 * u 0.50-1.00 is the back panel  (centre back  at u=0.75).
 * v runs hem (0) to shoulder (1).
 */
export async function garmentTexture(path, colorway, garment) {
  const key = `${path.id}|${colorway.id}|${garment}`;
  if (textureCache.has(key)) return textureCache.get(key);

  const [art, crest] = await Promise.all([getPathArt(path, 1024), loadCrest()]);
  const print = keyBlack(art);

  const c = document.createElement('canvas');
  c.width = TEX_W;
  c.height = TEX_H;
  const ctx = c.getContext('2d');

  ctx.fillStyle = colorway.hex;
  ctx.fillRect(0, 0, TEX_W, TEX_H);

  // subtle garment-dye mottling so the base colour is not dead flat
  ctx.globalAlpha = 0.014;
  for (let i = 0; i < 90; i++) {
    const r = 200 + Math.random() * 420;
    ctx.fillStyle = i % 3 === 0 ? '#ffffff' : '#000000';
    ctx.beginPath();
    ctx.arc(Math.random() * TEX_W, Math.random() * TEX_H, r, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.globalAlpha = 1;

  /* --- back panel: the big graphic --- */
  const bx = TEX_W * 0.75;
  const orbSize = 500;
  ctx.drawImage(print, bx - orbSize / 2, 130, orbSize, orbSize);

  ctx.textAlign = 'left';
  ctx.textBaseline = 'alphabetic';

  ctx.font = '700 104px Anton, Oswald, Impact, sans-serif';
  ctx.fillStyle = goldGradient(ctx, bx - 320, 640, bx + 320, 720);
  tracked(ctx, 'FULL CUSTODY', bx, 710, 6);

  ctx.strokeStyle = 'rgba(226,186,96,0.75)';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(bx - 300, 738); ctx.lineTo(bx - 130, 738);
  ctx.moveTo(bx + 130, 738); ctx.lineTo(bx + 300, 738);
  ctx.stroke();

  ctx.font = '600 34px Oswald, Arial Narrow, sans-serif';
  ctx.fillStyle = '#f2dca8';
  tracked(ctx, 'OWN WHAT MATTERS.', bx, 750, 5);

  ctx.font = '600 26px Oswald, Arial Narrow, sans-serif';
  ctx.fillStyle = 'rgba(226,186,96,0.85)';
  tracked(ctx, path.name.toUpperCase(), bx, 800, 12);

  /* --- front panel: left-chest crest --- */
  const fx = TEX_W * 0.25 + 150;
  if (crest) {
    const ch = 150;
    ctx.drawImage(crest, fx - (ch * 0.8) / 2, 230, ch * 0.8, ch);
  }
  ctx.font = '600 20px Oswald, Arial Narrow, sans-serif';
  ctx.fillStyle = 'rgba(226,186,96,0.8)';
  tracked(ctx, 'PREMIUM EMBROIDERY', fx, 405, 4);

  /* --- inner neck label, readable when the camera swings over the collar --- */
  ctx.font = '600 22px Oswald, Arial Narrow, sans-serif';
  ctx.fillStyle = 'rgba(226,186,96,0.55)';
  tracked(ctx, `FULL CUSTODY  ·  ${garment.toUpperCase()}`, TEX_W * 0.75, 40, 4);

  const tex = new THREE.CanvasTexture(c);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.anisotropy = 8;
  tex.wrapS = THREE.RepeatWrapping;
  textureCache.set(key, tex);
  return tex;
}

/** A standalone print card used by the collection grid and the reveal. */
export async function printCard(path, size = 512) {
  const art = await getPathArt(path, 1024);
  const c = document.createElement('canvas');
  c.width = c.height = size;
  const ctx = c.getContext('2d');
  ctx.fillStyle = '#07070a';
  ctx.fillRect(0, 0, size, size);
  ctx.drawImage(art, 0, 0, size, size);
  return c;
}
