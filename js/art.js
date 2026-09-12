/* Procedural path artwork.
 *
 * Every design resolves through three tiers, best first:
 *   1. assets/designs/<id>.png      (shipped artwork, if present)
 *   2. path.remoteArt               (hosted artwork, if reachable + CORS-clean)
 *   3. a generated canvas emblem    (always works, never blocks a render)
 *
 * Tier 3 is a real piece of art, not a grey box: a chain-wrapped crystal orb
 * holding a miniature world, drawn in gold on black to match the brand.
 */

const GOLD_LIGHT = '#fdf0c4';
const GOLD = '#e3b955';
const GOLD_DEEP = '#8d6118';

/* ---------- small drawing helpers ---------- */

function figure(ctx, x, y, h, { arms = 'down', color = '#05070c' } = {}) {
  // y is the ground line the figure stands on; h is total height
  const w = h * 0.26;
  ctx.fillStyle = color;
  ctx.beginPath();
  ctx.arc(x, y - h * 0.88, h * 0.12, 0, Math.PI * 2); // head
  ctx.fill();
  ctx.beginPath();                                     // torso
  ctx.moveTo(x - w * 0.5, y - h * 0.74);
  ctx.lineTo(x + w * 0.5, y - h * 0.74);
  ctx.lineTo(x + w * 0.34, y - h * 0.34);
  ctx.lineTo(x - w * 0.34, y - h * 0.34);
  ctx.closePath();
  ctx.fill();
  ctx.lineCap = 'round';
  ctx.strokeStyle = color;
  ctx.lineWidth = h * 0.085;
  ctx.beginPath();                                     // legs
  ctx.moveTo(x - w * 0.2, y - h * 0.36); ctx.lineTo(x - w * 0.3, y);
  ctx.moveTo(x + w * 0.2, y - h * 0.36); ctx.lineTo(x + w * 0.3, y);
  ctx.stroke();
  ctx.lineWidth = h * 0.07;                            // arms
  ctx.beginPath();
  if (arms === 'up') {
    ctx.moveTo(x - w * 0.45, y - h * 0.7); ctx.lineTo(x - w * 1.1, y - h * 1.06);
    ctx.moveTo(x + w * 0.45, y - h * 0.7); ctx.lineTo(x + w * 1.1, y - h * 1.06);
  } else if (arms === 'out') {
    ctx.moveTo(x - w * 0.45, y - h * 0.7); ctx.lineTo(x - w * 1.15, y - h * 0.52);
    ctx.moveTo(x + w * 0.45, y - h * 0.7); ctx.lineTo(x + w * 1.15, y - h * 0.52);
  } else {
    ctx.moveTo(x - w * 0.45, y - h * 0.7); ctx.lineTo(x - w * 0.62, y - h * 0.36);
    ctx.moveTo(x + w * 0.45, y - h * 0.7); ctx.lineTo(x + w * 0.62, y - h * 0.36);
  }
  ctx.stroke();
}

function ridge(ctx, S, baseY, peaks, color) {
  ctx.fillStyle = color;
  ctx.beginPath();
  ctx.moveTo(S(-1.2), S(baseY, 1));
  peaks.forEach(([px, py]) => ctx.lineTo(S(px), S(py, 1)));
  ctx.lineTo(S(1.2), S(baseY, 1));
  ctx.lineTo(S(1.2), S(1.2, 1));
  ctx.lineTo(S(-1.2), S(1.2, 1));
  ctx.closePath();
  ctx.fill();
}

function sky(ctx, S, stops) {
  const g = ctx.createLinearGradient(0, S(-1, 1), 0, S(1, 1));
  stops.forEach(([o, c]) => g.addColorStop(o, c));
  ctx.fillStyle = g;
  ctx.fillRect(S(-1.2), S(-1.2, 1), S(1.2) - S(-1.2), S(1.2, 1) - S(-1.2, 1));
}

function sunDisc(ctx, S, x, y, r, color, glow) {
  const g = ctx.createRadialGradient(S(x), S(y, 1), 0, S(x), S(y, 1), S(r) - S(0));
  g.addColorStop(0, color);
  g.addColorStop(0.25, color);
  g.addColorStop(1, glow);
  ctx.fillStyle = g;
  ctx.beginPath();
  ctx.arc(S(x), S(y, 1), S(r) - S(0), 0, Math.PI * 2);
  ctx.fill();
}

function stars(ctx, S, n, rnd) {
  ctx.fillStyle = '#fff';
  for (let i = 0; i < n; i++) {
    const x = rnd() * 2 - 1, y = rnd() * 1.2 - 1;
    ctx.globalAlpha = 0.25 + rnd() * 0.6;
    ctx.beginPath();
    ctx.arc(S(x), S(y, 1), (S(0.006) - S(0)) * (0.5 + rnd()), 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.globalAlpha = 1;
}

function mulberry(seed) {
  let a = seed;
  return function () {
    a |= 0; a = (a + 0x6D2B79F5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/* ---------- the eight inner worlds ---------- */

const SCENES = {
  family(ctx, S) {
    sky(ctx, S, [[0, '#1b2b4a'], [0.45, '#a9632c'], [0.72, '#f0b054'], [1, '#f8dc9a']]);
    sunDisc(ctx, S, 0.08, 0.18, 0.3, '#fff3c9', 'rgba(248,200,110,0)');
    ridge(ctx, S, 0.3, [[-1.2, 0.28], [-0.7, -0.32], [-0.35, 0.05], [0, -0.45], [0.4, -0.05], [0.8, -0.38], [1.2, 0.24]], '#2b3550');
    ridge(ctx, S, 0.48, [[-1.2, 0.46], [-0.5, 0.08], [0.1, 0.3], [0.7, 0.02], [1.2, 0.42]], '#141c2e');
    ridge(ctx, S, 0.66, [[-1.2, 0.62], [-0.2, 0.5], [0.5, 0.58], [1.2, 0.5]], '#070a12');
    const g = 0.66;
    figure(ctx, S(-0.38), S(g, 1), S(0.5) - S(0), { arms: 'out' });
    figure(ctx, S(-0.02), S(g, 1), S(0.47) - S(0));
    figure(ctx, S(0.26), S(g, 1), S(0.3) - S(0));
    figure(ctx, S(0.46), S(g, 1), S(0.26) - S(0));
    ctx.fillStyle = '#05070c';                                  // dog
    ctx.beginPath();
    ctx.ellipse(S(0.68), S(g - 0.045, 1), S(0.09) - S(0), S(0.045) - S(0), 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillRect(S(0.74), S(g - 0.1, 1), S(0.05) - S(0), S(0.06) - S(0));
  },

  discipline(ctx, S) {
    sky(ctx, S, [[0, '#0b1220'], [0.5, '#24384f'], [0.8, '#7d90a3'], [1, '#c8d6e2']]);
    sunDisc(ctx, S, 0.1, -0.12, 0.38, 'rgba(255,246,220,0.95)', 'rgba(255,240,200,0)');
    ridge(ctx, S, 0.55, [[-1.2, 0.5], [-0.4, 0.1], [0.3, 0.22], [1.2, 0.05]], 'rgba(20,30,44,0.75)');
    ctx.fillStyle = '#0a0f18';                                   // staircase in perspective
    for (let i = 0; i < 11; i++) {
      const t = i / 10;
      const y = 0.86 - t * 0.85;
      const halfW = 0.62 - t * 0.5;
      const h = 0.085 - t * 0.062;
      ctx.fillRect(S(-halfW * 0.2 - halfW * 0.8), S(y, 1), (S(halfW) - S(-halfW)) * 0.9, S(h) - S(0));
      ctx.fillStyle = i % 2 ? '#0a0f18' : '#121a27';
    }
    ctx.globalAlpha = 0.35;                                      // fog bands
    ctx.fillStyle = '#8ea6bd';
    for (let i = 0; i < 4; i++) {
      ctx.fillRect(S(-1.2), S(0.15 + i * 0.16, 1), S(1.2) - S(-1.2), S(0.035) - S(0));
    }
    ctx.globalAlpha = 1;
    figure(ctx, S(0.02), S(0.18, 1), S(0.34) - S(0), { arms: 'down', color: '#04060a' });
  },

  purpose(ctx, S) {
    sky(ctx, S, [[0, '#101c33'], [0.5, '#3d4f6e'], [0.82, '#d9853f'], [1, '#f6c878']]);
    sunDisc(ctx, S, -0.1, 0.42, 0.34, '#ffe9b5', 'rgba(255,200,110,0)');
    ctx.strokeStyle = 'rgba(250,215,140,0.85)';                  // compass rose
    ctx.lineWidth = (S(0.012) - S(0));
    const cx = S(0.02), cy = S(-0.34, 1), R = S(0.3) - S(0);
    ctx.beginPath(); ctx.arc(cx, cy, R, 0, Math.PI * 2); ctx.stroke();
    ctx.beginPath(); ctx.arc(cx, cy, R * 0.74, 0, Math.PI * 2); ctx.stroke();
    ctx.fillStyle = 'rgba(253,240,196,0.92)';
    for (let k = 0; k < 4; k++) {
      const a = (k * Math.PI) / 2;
      ctx.beginPath();
      ctx.moveTo(cx + Math.cos(a) * R, cy + Math.sin(a) * R);
      ctx.lineTo(cx + Math.cos(a + 0.32) * R * 0.24, cy + Math.sin(a + 0.32) * R * 0.24);
      ctx.lineTo(cx + Math.cos(a - 0.32) * R * 0.24, cy + Math.sin(a - 0.32) * R * 0.24);
      ctx.closePath(); ctx.fill();
    }
    const rnd = mulberry(7);                                     // skyline
    ctx.fillStyle = '#0a0e18';
    let x = -1.2;
    while (x < 1.2) {
      const w = 0.1 + rnd() * 0.16;
      const h = 0.28 + rnd() * 0.62;
      ctx.fillRect(S(x), S(0.86 - h, 1), S(w) - S(0), S(h) - S(0));
      x += w + 0.015;
    }
    ctx.fillStyle = 'rgba(255,206,124,0.8)';                     // lit windows
    for (let i = 0; i < 90; i++) {
      const wx = -1.1 + rnd() * 2.2, wy = 0.3 + rnd() * 0.5;
      ctx.fillRect(S(wx), S(wy, 1), S(0.016) - S(0), S(0.022) - S(0));
    }
    figure(ctx, S(0.0), S(0.9, 1), S(0.22) - S(0), { arms: 'down', color: '#000' });
  },

  faith(ctx, S) {
    sky(ctx, S, [[0, '#161f3a'], [0.4, '#6b4a58'], [0.7, '#d99553'], [1, '#fbe4ab']]);
    const cx = S(0.0), cy = S(0.1, 1);
    const rays = ctx.createRadialGradient(cx, cy, 0, cx, cy, S(1.1) - S(0));
    rays.addColorStop(0, 'rgba(255,240,200,0.95)');
    rays.addColorStop(0.35, 'rgba(255,216,140,0.35)');
    rays.addColorStop(1, 'rgba(255,200,110,0)');
    ctx.fillStyle = rays;
    ctx.fillRect(S(-1.2), S(-1.2, 1), S(1.2) - S(-1.2), S(1.2, 1) - S(-1.2, 1));
    ctx.save();                                                  // god rays
    ctx.globalAlpha = 0.3;
    ctx.fillStyle = '#ffeec2';
    for (let i = 0; i < 12; i++) {
      const a = (i / 12) * Math.PI * 2 + 0.2;
      ctx.beginPath();
      ctx.moveTo(cx, cy);
      ctx.lineTo(cx + Math.cos(a - 0.05) * (S(1.4) - S(0)), cy + Math.sin(a - 0.05) * (S(1.4) - S(0)));
      ctx.lineTo(cx + Math.cos(a + 0.05) * (S(1.4) - S(0)), cy + Math.sin(a + 0.05) * (S(1.4) - S(0)));
      ctx.closePath(); ctx.fill();
    }
    ctx.restore();
    ridge(ctx, S, 0.7, [[-1.2, 0.72], [-0.3, 0.52], [0.4, 0.55], [1.2, 0.74]], '#0a0d16');
    ctx.fillStyle = '#04060b';                                   // cross
    ctx.fillRect(S(-0.055), S(-0.5, 1), S(0.11) - S(-0.0), S(1.08) - S(0));
    ctx.fillRect(S(-0.26), S(-0.24, 1), S(0.52) - S(0), S(0.1) - S(0));
    figure(ctx, S(0.34), S(0.62, 1), S(0.2) - S(0), { arms: 'down', color: '#04060b' });
  },

  freedom(ctx, S) {
    sky(ctx, S, [[0, '#1d2a46'], [0.42, '#8a5c39'], [0.72, '#e0a054'], [1, '#f7d79c']]);
    sunDisc(ctx, S, 0.42, 0.24, 0.26, '#fff0c6', 'rgba(255,205,120,0)');
    ridge(ctx, S, 0.4, [[-1.2, 0.36], [-0.6, -0.1], [-0.1, 0.16], [0.5, -0.16], [1.2, 0.3]], '#2a3450');
    ridge(ctx, S, 0.58, [[-1.2, 0.55], [-0.3, 0.3], [0.6, 0.42], [1.2, 0.34]], '#121a2b');
    ctx.fillStyle = '#0a0d14';                                   // road
    ctx.beginPath();
    ctx.moveTo(S(-0.9), S(1.2, 1));
    ctx.bezierCurveTo(S(-0.2), S(0.75, 1), S(0.35), S(0.72, 1), S(0.12), S(0.5, 1));
    ctx.lineTo(S(0.02), S(0.5, 1));
    ctx.bezierCurveTo(S(0.1), S(0.74, 1), S(-0.5), S(0.8, 1), S(-1.2), S(1.2, 1));
    ctx.closePath(); ctx.fill();
    ctx.fillStyle = '#0a0d14';
    ctx.beginPath();
    ctx.moveTo(S(-1.2), S(1.2, 1)); ctx.lineTo(S(1.2), S(1.2, 1));
    ctx.lineTo(S(1.2), S(0.86, 1)); ctx.lineTo(S(-1.2), S(0.78, 1));
    ctx.closePath(); ctx.fill();
    ctx.strokeStyle = 'rgba(250,220,150,0.8)';                   // centre line
    ctx.lineWidth = S(0.02) - S(0);
    ctx.setLineDash([S(0.08) - S(0), S(0.07) - S(0)]);
    ctx.beginPath();
    ctx.moveTo(S(-0.62), S(1.15, 1));
    ctx.bezierCurveTo(S(-0.1), S(0.82, 1), S(0.2), S(0.74, 1), S(0.07), S(0.52, 1));
    ctx.stroke();
    ctx.setLineDash([]);
    ctx.fillStyle = '#000';                                      // rider
    ctx.beginPath();
    ctx.ellipse(S(-0.2), S(0.92, 1), S(0.15) - S(0), S(0.07) - S(0), 0, 0, Math.PI * 2);
    ctx.fill();
    figure(ctx, S(-0.2), S(0.9, 1), S(0.3) - S(0), { arms: 'out', color: '#000' });
    ctx.strokeStyle = '#05070c';                                 // eagle
    ctx.lineWidth = S(0.016) - S(0);
    ctx.beginPath();
    ctx.moveTo(S(-0.62), S(-0.44, 1));
    ctx.quadraticCurveTo(S(-0.5), S(-0.54, 1), S(-0.38), S(-0.44, 1));
    ctx.stroke();
  },

  passion(ctx, S) {
    sky(ctx, S, [[0, '#05070f'], [0.55, '#131b2e'], [0.85, '#3a2a2a'], [1, '#6a3a22']]);
    const rnd = mulberry(11);
    stars(ctx, S, 90, rnd);
    ridge(ctx, S, 0.42, [[-1.2, 0.4], [-0.7, -0.08], [-0.3, 0.2], [0.2, -0.14], [0.7, 0.14], [1.2, 0.36]], '#080c16');
    const fx = S(0.34), fy = S(0.74, 1);                         // fire glow
    const fg = ctx.createRadialGradient(fx, fy, 0, fx, fy, S(0.75) - S(0));
    fg.addColorStop(0, 'rgba(255,196,92,0.95)');
    fg.addColorStop(0.3, 'rgba(240,130,40,0.45)');
    fg.addColorStop(1, 'rgba(200,80,20,0)');
    ctx.fillStyle = fg;
    ctx.fillRect(S(-1.2), S(-1.2, 1), S(1.2) - S(-1.2), S(1.2, 1) - S(-1.2, 1));
    ctx.fillStyle = '#ffca6a';                                   // flame
    ctx.beginPath();
    ctx.moveTo(fx, fy - (S(0.3) - S(0)));
    ctx.quadraticCurveTo(fx + (S(0.12) - S(0)), fy - (S(0.08) - S(0)), fx + (S(0.09) - S(0)), fy);
    ctx.lineTo(fx - (S(0.09) - S(0)), fy);
    ctx.quadraticCurveTo(fx - (S(0.12) - S(0)), fy - (S(0.08) - S(0)), fx, fy - (S(0.3) - S(0)));
    ctx.fill();
    ctx.strokeStyle = '#0a0c12';                                 // logs
    ctx.lineWidth = S(0.045) - S(0);
    ctx.lineCap = 'round';
    ctx.beginPath();
    ctx.moveTo(fx - (S(0.2) - S(0)), fy + (S(0.03) - S(0)));
    ctx.lineTo(fx + (S(0.2) - S(0)), fy - (S(0.02) - S(0)));
    ctx.moveTo(fx - (S(0.18) - S(0)), fy - (S(0.03) - S(0)));
    ctx.lineTo(fx + (S(0.19) - S(0)), fy + (S(0.04) - S(0)));
    ctx.stroke();
    figure(ctx, S(-0.34), S(0.86, 1), S(0.44) - S(0), { arms: 'out', color: '#05070c' });
    ctx.fillStyle = '#05070c';                                   // guitar body
    ctx.beginPath();
    ctx.ellipse(S(-0.2), S(0.62, 1), S(0.12) - S(0), S(0.09) - S(0), -0.4, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = '#05070c'; ctx.lineWidth = S(0.022) - S(0);
    ctx.beginPath(); ctx.moveTo(S(-0.24), S(0.56, 1)); ctx.lineTo(S(-0.46), S(0.34, 1)); ctx.stroke();
    ctx.fillStyle = '#ffb254';                                   // embers
    for (let i = 0; i < 34; i++) {
      const ex = 0.34 + (rnd() - 0.5) * 0.7;
      const ey = 0.7 - rnd() * 1.1;
      ctx.globalAlpha = 0.25 + rnd() * 0.7;
      ctx.beginPath();
      ctx.arc(S(ex), S(ey, 1), (S(0.008) - S(0)) * (0.6 + rnd()), 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.globalAlpha = 1;
  },

  growth(ctx, S) {
    sky(ctx, S, [[0, '#12203c'], [0.42, '#4e5f80'], [0.74, '#e0a463'], [1, '#fae0ab']]);
    sunDisc(ctx, S, -0.3, 0.1, 0.3, '#fff2cd', 'rgba(255,210,130,0)');
    ridge(ctx, S, 0.44, [[-1.2, 0.44], [-0.55, 0.02], [0.05, -0.5], [0.62, 0.04], [1.2, 0.42]], '#26324c');
    ctx.fillStyle = 'rgba(226,236,246,0.8)';                     // cloud sea
    for (let i = 0; i < 7; i++) {
      ctx.beginPath();
      ctx.ellipse(S(-1 + i * 0.34), S(0.52 + (i % 3) * 0.05, 1), S(0.3) - S(0), S(0.075) - S(0), 0, 0, Math.PI * 2);
      ctx.fill();
    }
    ridge(ctx, S, 0.62, [[-1.2, 0.66], [-0.3, 0.22], [0.1, -0.34], [0.5, 0.26], [1.2, 0.7]], '#080c16');
    figure(ctx, S(0.08), S(-0.3, 1), S(0.3) - S(0), { arms: 'up', color: '#04060b' });
    ctx.strokeStyle = '#0e1a12'; ctx.lineWidth = S(0.02) - S(0); // sapling
    ctx.beginPath(); ctx.moveTo(S(-0.6), S(1.0, 1)); ctx.lineTo(S(-0.6), S(0.76, 1)); ctx.stroke();
    ctx.fillStyle = '#8fbf72';
    ctx.beginPath(); ctx.ellipse(S(-0.68), S(0.78, 1), S(0.08) - S(0), S(0.04) - S(0), -0.5, 0, Math.PI * 2); ctx.fill();
    ctx.beginPath(); ctx.ellipse(S(-0.52), S(0.8, 1), S(0.08) - S(0), S(0.04) - S(0), 0.5, 0, Math.PI * 2); ctx.fill();
  },

  legacy(ctx, S) {
    sky(ctx, S, [[0, '#1a2140'], [0.4, '#6d4a4a'], [0.72, '#d98f4a'], [1, '#f6d79a']]);
    sunDisc(ctx, S, 0.0, 0.5, 0.3, '#ffeec0', 'rgba(255,200,110,0)');
    ridge(ctx, S, 0.62, [[-1.2, 0.64], [-0.5, 0.5], [0.3, 0.56], [1.2, 0.5]], '#1a2136');
    ctx.fillStyle = '#05080e';                                   // trunk
    ctx.beginPath();
    ctx.moveTo(S(-0.16), S(0.95, 1));
    ctx.lineTo(S(-0.07), S(-0.1, 1));
    ctx.lineTo(S(0.07), S(-0.1, 1));
    ctx.lineTo(S(0.16), S(0.95, 1));
    ctx.closePath(); ctx.fill();
    ctx.strokeStyle = '#05080e'; ctx.lineCap = 'round';          // branches
    const rnd = mulberry(23);
    for (let i = 0; i < 9; i++) {
      const a = -Math.PI / 2 + (rnd() - 0.5) * 2.3;
      const len = (0.45 + rnd() * 0.4);
      ctx.lineWidth = (S(0.03) - S(0)) * (0.5 + rnd());
      ctx.beginPath();
      ctx.moveTo(S(0), S(-0.02, 1));
      ctx.quadraticCurveTo(
        S(Math.cos(a) * len * 0.5), S(-0.02 + Math.sin(a) * len * 0.5, 1),
        S(Math.cos(a) * len), S(-0.05 + Math.sin(a) * len, 1)
      );
      ctx.stroke();
    }
    ctx.fillStyle = 'rgba(6,9,16,0.94)';                         // canopy
    for (let i = 0; i < 16; i++) {
      const a = rnd() * Math.PI * 2, r = rnd() * 0.55;
      ctx.beginPath();
      ctx.ellipse(S(Math.cos(a) * r), S(-0.42 + Math.sin(a) * r * 0.6, 1),
        S(0.24) - S(0), S(0.17) - S(0), 0, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.strokeStyle = 'rgba(233,186,94,0.75)';                   // glowing roots
    for (let i = 0; i < 7; i++) {
      const dir = i % 2 ? 1 : -1;
      ctx.lineWidth = (S(0.016) - S(0)) * (0.6 + rnd());
      ctx.beginPath();
      ctx.moveTo(S(0), S(0.9, 1));
      ctx.quadraticCurveTo(S(dir * 0.3), S(0.95, 1), S(dir * (0.4 + rnd() * 0.7)), S(1.05 + rnd() * 0.1, 1));
      ctx.stroke();
    }
    const g = 0.9;
    figure(ctx, S(-0.5), S(g, 1), S(0.3) - S(0));
    figure(ctx, S(-0.3), S(g, 1), S(0.26) - S(0));
    figure(ctx, S(0.42), S(g, 1), S(0.22) - S(0));
  }
};

/* ---------- the orb, the chain, the frame ---------- */

function drawOrb(ctx, size, pathId) {
  const cx = size * 0.5;
  const cy = size * 0.47;
  const R = size * 0.31;

  // outer bloom behind the glass
  const bloom = ctx.createRadialGradient(cx, cy, R * 0.6, cx, cy, R * 2.1);
  bloom.addColorStop(0, 'rgba(227,185,85,0.34)');
  bloom.addColorStop(0.5, 'rgba(180,130,50,0.11)');
  bloom.addColorStop(1, 'rgba(0,0,0,0)');
  ctx.fillStyle = bloom;
  ctx.fillRect(0, 0, size, size);

  // the world inside
  ctx.save();
  ctx.beginPath();
  ctx.arc(cx, cy, R, 0, Math.PI * 2);
  ctx.clip();
  const S = (v, axis) => (axis ? cy + v * R : cx + v * R);
  (SCENES[pathId] || SCENES.purpose)(ctx, S);
  ctx.restore();

  // glass: shadow terminator + specular
  ctx.save();
  ctx.beginPath();
  ctx.arc(cx, cy, R, 0, Math.PI * 2);
  ctx.clip();
  const shade = ctx.createRadialGradient(cx - R * 0.35, cy - R * 0.4, R * 0.1, cx, cy, R * 1.05);
  shade.addColorStop(0, 'rgba(255,255,255,0.1)');
  shade.addColorStop(0.55, 'rgba(255,255,255,0)');
  shade.addColorStop(1, 'rgba(0,0,0,0.42)');
  ctx.fillStyle = shade;
  ctx.fillRect(cx - R, cy - R, R * 2, R * 2);
  ctx.globalAlpha = 0.2;
  const spec = ctx.createRadialGradient(cx - R * 0.42, cy - R * 0.56, 0, cx - R * 0.42, cy - R * 0.56, R * 0.3);
  spec.addColorStop(0, 'rgba(255,255,255,0.9)');
  spec.addColorStop(1, 'rgba(255,255,255,0)');
  ctx.fillStyle = spec;
  ctx.beginPath();
  ctx.ellipse(cx - R * 0.42, cy - R * 0.56, R * 0.3, R * 0.17, -0.6, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();

  // ornate gold rim
  const rim = ctx.createLinearGradient(cx - R, cy - R, cx + R, cy + R);
  rim.addColorStop(0, GOLD_LIGHT);
  rim.addColorStop(0.35, GOLD);
  rim.addColorStop(0.6, GOLD_DEEP);
  rim.addColorStop(1, GOLD_LIGHT);
  ctx.strokeStyle = rim;
  ctx.lineWidth = size * 0.022;
  ctx.beginPath(); ctx.arc(cx, cy, R * 1.02, 0, Math.PI * 2); ctx.stroke();
  ctx.lineWidth = size * 0.008;
  ctx.beginPath(); ctx.arc(cx, cy, R * 1.08, 0, Math.PI * 2); ctx.stroke();
  ctx.lineWidth = size * 0.004;
  for (let i = 0; i < 72; i++) {
    const a = (i / 72) * Math.PI * 2;
    const r0 = R * 1.03, r1 = R * (i % 6 === 0 ? 1.12 : 1.07);
    ctx.beginPath();
    ctx.moveTo(cx + Math.cos(a) * r0, cy + Math.sin(a) * r0);
    ctx.lineTo(cx + Math.cos(a) * r1, cy + Math.sin(a) * r1);
    ctx.stroke();
  }

  // chain wrapping the lower half
  ctx.lineWidth = size * 0.012;
  for (let i = 0; i < 26; i++) {
    const a = Math.PI * (0.06 + (i / 25) * 0.88);
    const r = R * 1.16 + Math.sin(i * 1.7) * size * 0.006;
    const lx = cx + Math.cos(a) * r;
    const ly = cy + Math.sin(a) * r;
    const link = ctx.createLinearGradient(lx - size * 0.02, ly - size * 0.02, lx + size * 0.02, ly + size * 0.02);
    link.addColorStop(0, GOLD_LIGHT);
    link.addColorStop(0.5, GOLD);
    link.addColorStop(1, GOLD_DEEP);
    ctx.strokeStyle = link;
    ctx.save();
    ctx.translate(lx, ly);
    ctx.rotate(a + Math.PI / 2 + (i % 2 ? Math.PI / 2 : 0));
    ctx.beginPath();
    ctx.ellipse(0, 0, size * 0.026, size * 0.015, 0, 0, Math.PI * 2);
    ctx.stroke();
    ctx.restore();
  }
}

/* ---------- public API ---------- */

export function createEmblemCanvas(path, size = 1024) {
  const c = document.createElement('canvas');
  c.width = c.height = size;
  const ctx = c.getContext('2d');
  ctx.fillStyle = '#000';
  ctx.fillRect(0, 0, size, size);
  drawOrb(ctx, size, path.id);
  // vignette so the art melts into black fabric
  const v = ctx.createRadialGradient(size / 2, size * 0.47, size * 0.26, size / 2, size * 0.5, size * 0.62);
  v.addColorStop(0, 'rgba(0,0,0,0)');
  v.addColorStop(1, 'rgba(0,0,0,1)');
  ctx.fillStyle = v;
  ctx.fillRect(0, 0, size, size);
  return c;
}

function loadImage(src) {
  return new Promise(resolve => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => resolve(img);
    img.onerror = () => resolve(null);
    img.src = src;
  });
}

const artCache = new Map();

/** Resolve the best available artwork for a path as a drawable canvas. */
export async function getPathArt(path, size = 1024) {
  if (artCache.has(path.id)) return artCache.get(path.id);

  let img = await loadImage(path.art);
  if (!img && path.remoteArt) img = await loadImage(path.remoteArt);

  let canvas;
  if (img) {
    canvas = document.createElement('canvas');
    canvas.width = canvas.height = size;
    const ctx = canvas.getContext('2d');
    ctx.fillStyle = '#000';
    ctx.fillRect(0, 0, size, size);
    ctx.drawImage(img, 0, 0, size, size);
  } else {
    canvas = createEmblemCanvas(path, size);
  }
  artCache.set(path.id, canvas);
  return canvas;
}
