/* Procedural garment geometry.
 *
 * Every piece is generated from a profile of cross-sections, so the same
 * builder yields a tee, a hoodie or a jacket by changing the numbers.
 *
 * UV convention (shared with fabric.js):
 *   u = theta/2PI + 0.25, running 0.25 -> 1.25 with RepeatWrapping,
 *       which puts centre front at u 0.25 and centre back at u 0.75
 *       with no visible seam.
 *   v = 0 at the hem, 1 at the shoulder.
 */

import * as THREE from 'three';

const lerp = (a, b, t) => a + (b - a) * t;
const smooth = t => t * t * (3 - 2 * t);

function sampleProfile(keys, v) {
  if (v <= keys[0].v) return { ...keys[0] };
  if (v >= keys[keys.length - 1].v) return { ...keys[keys.length - 1] };
  let i = 0;
  while (i < keys.length - 2 && keys[i + 1].v < v) i++;
  const a = keys[i], b = keys[i + 1];
  const t = (v - a.v) / (b.v - a.v);
  const s = smooth(t);
  return { w: lerp(a.w, b.w, s), d: lerp(a.d, b.d, s), y: lerp(a.y, b.y, t) };
}

/** Superellipse cross-section: rounded rectangle, like a body rather than a tube. */
function crossSection(theta, w, d, power) {
  const ct = Math.cos(theta), st = Math.sin(theta);
  const ex = Math.sign(st) * Math.pow(Math.abs(st), 2 / power);
  const ez = Math.sign(ct) * Math.pow(Math.abs(ct), 2 / power);
  return { x: ex * w * 0.5, z: ez * d * 0.5 };
}

/**
 * Body shell. thetaFrom/thetaTo let the same routine carve a pocket or a
 * rib band out of the same surface, so add-ons hug the body exactly.
 */
export function bodyGeometry(keys, {
  rows = 80, radial = 112, power = 2.05, offset = 0,
  v0 = 0, v1 = 1, thetaFrom = 0, thetaTo = Math.PI * 2, closed = true
} = {}) {
  const pos = [], uv = [], idx = [];
  const full = closed && (thetaTo - thetaFrom) >= Math.PI * 2 - 1e-6;
  const cols = radial;

  for (let j = 0; j <= rows; j++) {
    const v = lerp(v0, v1, j / rows);
    const { w, d, y } = sampleProfile(keys, v);
    for (let i = 0; i <= cols; i++) {
      const t = i / cols;
      const theta = lerp(thetaFrom, thetaTo, t);
      const p = crossSection(theta, w, d, power);
      // push the shell outward along its own normal-ish direction
      const len = Math.hypot(p.x, p.z) || 1;
      pos.push(p.x + (p.x / len) * offset, y, p.z + (p.z / len) * offset);
      uv.push(full ? t + 0.25 : theta / (Math.PI * 2) + 0.25, v);
    }
  }
  for (let j = 0; j < rows; j++) {
    for (let i = 0; i < cols; i++) {
      const a = j * (cols + 1) + i;
      const b = a + cols + 1;
      idx.push(a, a + 1, b, b, a + 1, b + 1);
    }
  }
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
  g.setAttribute('uv', new THREE.Float32BufferAttribute(uv, 2));
  g.setIndex(idx);
  g.computeVertexNormals();
  return g;
}

/** Tapered tube along a curve — sleeves, drawstrings, chain. */
export function tubeGeometry(curve, radiusFn, { segments = 40, radial = 28, squash = 1 } = {}) {
  const frames = curve.computeFrenetFrames(segments, false);
  const pos = [], uv = [], idx = [];
  for (let j = 0; j <= segments; j++) {
    const t = j / segments;
    const p = curve.getPointAt(t);
    const N = frames.normals[j], B = frames.binormals[j];
    const r = radiusFn(t);
    for (let i = 0; i <= radial; i++) {
      const a = (i / radial) * Math.PI * 2;
      const cx = Math.cos(a) * r;
      const cz = Math.sin(a) * r * squash;
      pos.push(p.x + N.x * cx + B.x * cz, p.y + N.y * cx + B.y * cz, p.z + N.z * cx + B.z * cz);
      uv.push(i / radial, t);
    }
  }
  for (let j = 0; j < segments; j++) {
    for (let i = 0; i < radial; i++) {
      const a = j * (radial + 1) + i;
      const b = a + radial + 1;
      idx.push(a, a + 1, b, b, a + 1, b + 1);
    }
  }
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
  g.setAttribute('uv', new THREE.Float32BufferAttribute(uv, 2));
  g.setIndex(idx);
  g.computeVertexNormals();
  return g;
}

/* ---------- profiles ---------- */

const TEE = [
  { v: 0.000, w: 1.38, d: 0.62, y: -1.05 },
  { v: 0.080, w: 1.37, d: 0.62, y: -0.93 },
  { v: 0.340, w: 1.34, d: 0.60, y: -0.55 },
  { v: 0.620, w: 1.42, d: 0.66, y: -0.10 },
  { v: 0.800, w: 1.48, d: 0.64, y:  0.26 },
  { v: 0.900, w: 1.50, d: 0.58, y:  0.48 },
  { v: 0.955, w: 1.02, d: 0.50, y:  0.520 },
  { v: 1.000, w: 0.50, d: 0.42, y:  0.545 }
];

const HOODIE = [
  { v: 0.000, w: 1.54, d: 0.74, y: -1.10 },
  { v: 0.070, w: 1.52, d: 0.73, y: -0.98 },
  { v: 0.320, w: 1.52, d: 0.74, y: -0.60 },
  { v: 0.620, w: 1.60, d: 0.80, y: -0.10 },
  { v: 0.800, w: 1.68, d: 0.78, y:  0.28 },
  { v: 0.900, w: 1.70, d: 0.70, y:  0.50 },
  { v: 0.955, w: 1.16, d: 0.58, y:  0.552 },
  { v: 1.000, w: 0.58, d: 0.48, y:  0.590 }
];

const JACKET = [
  { v: 0.000, w: 1.58, d: 0.78, y: -1.00 },
  { v: 0.060, w: 1.56, d: 0.77, y: -0.89 },
  { v: 0.300, w: 1.56, d: 0.78, y: -0.54 },
  { v: 0.620, w: 1.66, d: 0.84, y: -0.04 },
  { v: 0.800, w: 1.74, d: 0.82, y:  0.32 },
  { v: 0.900, w: 1.76, d: 0.74, y:  0.54 },
  { v: 0.955, w: 1.22, d: 0.62, y:  0.592 },
  { v: 1.000, w: 0.64, d: 0.52, y:  0.636 }
];

const PROFILES = { tee: TEE, hoodie: HOODIE, jacket: JACKET };

/* ---------- sleeves ---------- */

/**
 * A set-in sleeve hangs from the armhole, not from the top of the shoulder:
 * the tube's centre has to sit roughly one radius below the shoulder line or
 * its upper wall pokes out above the garment.
 */
function sleeveCurve(keys, side, long, r0) {
  const sh = sampleProfile(keys, 0.90);
  const half = sh.w * 0.5;
  const x = k => half * k * side;
  const y0 = sh.y - r0 * 0.72;
  if (!long) {
    return new THREE.CatmullRomCurve3([
      new THREE.Vector3(x(0.50), y0, 0),
      new THREE.Vector3(x(1.00), y0 - 0.15, 0.01),
      new THREE.Vector3(x(1.46), y0 - 0.40, 0.03)
    ]);
  }
  return new THREE.CatmullRomCurve3([
    new THREE.Vector3(x(0.50), y0, 0),
    new THREE.Vector3(x(1.04), y0 - 0.30, 0.02),
    new THREE.Vector3(x(1.30), y0 - 0.94, 0.10),
    new THREE.Vector3(x(1.20), y0 - 1.46, 0.22)
  ]);
}

/* ---------- builders ---------- */

/**
 * @param {'tee'|'hoodie'|'jacket'} type
 * @param {{fabric:THREE.Material, plain:THREE.Material, metal:THREE.Material, lining:THREE.Material}} mats
 */
export function buildGarment(type, mats) {
  const keys = PROFILES[type] || TEE;
  const long = type !== 'tee';
  const group = new THREE.Group();
  group.name = `garment-${type}`;

  const body = new THREE.Mesh(bodyGeometry(keys, { power: type === 'tee' ? 1.95 : 2.15 }), mats.fabric);
  body.name = 'body';
  body.castShadow = body.receiveShadow = true;
  group.add(body);

  // close the neck so you never see straight through the collar
  const neck = sampleProfile(keys, 1);
  const lining = new THREE.Mesh(new THREE.CircleGeometry(neck.w * 0.48, 40), mats.lining);
  lining.rotation.x = -Math.PI / 2;
  lining.scale.z = neck.d / neck.w;
  lining.position.y = neck.y - 0.03;
  group.add(lining);

  // close the hem so the inside never shows from a low angle
  const hemKey = sampleProfile(keys, 0);
  const hemCap = new THREE.Mesh(new THREE.CircleGeometry(hemKey.w * 0.5, 48), mats.lining);
  hemCap.rotation.x = Math.PI / 2;
  hemCap.scale.z = hemKey.d / hemKey.w;
  hemCap.position.y = hemKey.y + 0.02;
  group.add(hemCap);

  // sleeves
  [1, -1].forEach(side => {
    const r0 = type === 'jacket' ? 0.35 : type === 'hoodie' ? 0.33 : 0.30;
    const r1 = long ? 0.155 : 0.235;
    const curve = sleeveCurve(keys, side, long, r0);
    const geo = tubeGeometry(curve, t => lerp(r0, r1, smooth(t)), {
      segments: long ? 56 : 30, radial: 32, squash: 1
    });
    const sleeve = new THREE.Mesh(geo, mats.plain);
    sleeve.name = `sleeve-${side > 0 ? 'r' : 'l'}`;
    group.add(sleeve);

    const end = curve.getPointAt(1);
    const tangent = curve.getTangentAt(1).normalize();
    const aim = new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(0, 0, 1), tangent);

    // cap the opening so you see fabric, not straight through the sleeve
    const cap = new THREE.Mesh(new THREE.CircleGeometry(r1 * 0.99, 28), mats.lining);
    cap.position.copy(end).addScaledVector(tangent, -0.012);
    cap.quaternion.copy(aim);
    group.add(cap);

    if (long) {
      const cuff = new THREE.Mesh(new THREE.TorusGeometry(r1 * 0.97, 0.046, 12, 30), mats.rib);
      cuff.position.copy(end).addScaledVector(tangent, -0.055);
      cuff.quaternion.copy(aim);
      group.add(cuff);
    }
  });

  // collar
  const collarR = neck.w * 0.53;
  const collarTube = type === 'jacket' ? 0.07 : 0.038;
  const collar = new THREE.Mesh(
    new THREE.TorusGeometry(collarR, collarTube, 14, 56), type === 'tee' ? mats.rib : mats.plain
  );
  collar.rotation.x = Math.PI / 2;
  collar.position.y = neck.y - 0.015;
  collar.scale.z = neck.d / neck.w;
  collar.name = 'collar';
  group.add(collar);

  if (type === 'hoodie') {
    // hood resting on the back: a soft folded mass, not a bowl
    const hood = new THREE.Mesh(new THREE.SphereGeometry(0.5, 44, 30), mats.plain);
    hood.scale.set(1.22, 0.80, 0.62);
    hood.position.set(0, neck.y - 0.22, -0.26);
    hood.name = 'hood';
    group.add(hood);

    const fold = new THREE.Mesh(new THREE.SphereGeometry(0.5, 40, 26), mats.plain);
    fold.scale.set(1.04, 0.40, 0.48);
    fold.position.set(0, neck.y - 0.02, -0.17);
    fold.rotation.x = -0.22;
    group.add(fold);

    // kangaroo pocket — a patch of the body surface, so it follows the curve
    const pocket = new THREE.Mesh(
      bodyGeometry(keys, { rows: 26, radial: 44, power: 2.15, offset: 0.016, v0: 0.12, v1: 0.37, thetaFrom: -0.66, thetaTo: 0.66, closed: false }),
      mats.rib
    );
    pocket.name = 'pocket';
    group.add(pocket);

    // drawstrings
    [1, -1].forEach(side => {
      const s = new THREE.CatmullRomCurve3([
        new THREE.Vector3(0.12 * side, neck.y - 0.05, neck.d * 0.46),
        new THREE.Vector3(0.16 * side, neck.y - 0.34, neck.d * 0.62),
        new THREE.Vector3(0.13 * side, neck.y - 0.62, neck.d * 0.60)
      ]);
      group.add(new THREE.Mesh(tubeGeometry(s, () => 0.022, { segments: 24, radial: 10 }), mats.rib));
      const tip = new THREE.Mesh(new THREE.CylinderGeometry(0.028, 0.028, 0.07, 12), mats.metal);
      tip.position.copy(s.getPointAt(1));
      group.add(tip);
    });
  }

  if (type === 'jacket') {
    // centre-front zip: a strip that rides the front contour
    const strip = new THREE.Mesh(
      bodyGeometry(keys, { rows: 60, radial: 8, power: 2.15, offset: 0.03, v0: 0.02, v1: 0.985, thetaFrom: -0.075, thetaTo: 0.075, closed: false }),
      mats.metal
    );
    strip.name = 'zip';
    group.add(strip);

    const placket = new THREE.Mesh(
      bodyGeometry(keys, { rows: 60, radial: 14, power: 2.15, offset: 0.014, v0: 0.02, v1: 0.985, thetaFrom: -0.17, thetaTo: 0.17, closed: false }),
      mats.rib
    );
    group.add(placket);

    const pull = new THREE.Mesh(new THREE.BoxGeometry(0.05, 0.13, 0.02), mats.metal);
    const chest = sampleProfile(keys, 0.66);
    pull.position.set(0, chest.y, chest.d * 0.5 + 0.06);
    group.add(pull);

    // hand pockets
    [1, -1].forEach(side => {
      const p = new THREE.Mesh(
        bodyGeometry(keys, { rows: 16, radial: 22, power: 2.15, offset: 0.024, v0: 0.16, v1: 0.34, thetaFrom: side > 0 ? 0.30 : -0.92, thetaTo: side > 0 ? 0.92 : -0.30, closed: false }),
        mats.plain
      );
      group.add(p);
    });

    // ribbed hem
    const hem = new THREE.Mesh(
      bodyGeometry(keys, { rows: 12, radial: 96, power: 2.15, offset: 0.022, v0: 0.0, v1: 0.075 }),
      mats.rib
    );
    group.add(hem);
  }

  group.traverse(o => { if (o.isMesh) { o.castShadow = true; o.receiveShadow = true; } });
  return group;
}

export const GARMENTS = [
  { id: 'tee',    name: 'Heavyweight Tee',   spec: '240 GSM ringspun cotton',      price: 48 },
  { id: 'hoodie', name: 'Custody Hoodie',    spec: '450 GSM brushed fleece',       price: 96 },
  { id: 'jacket', name: 'Workwear Jacket',   spec: 'Waxed shell, quilted lining',  price: 168 }
];
