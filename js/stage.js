/* The 3D stage. One renderer, one scene, a camera that moves between shots
   as the page scrolls, and a garment you can grab and turn. */

import * as THREE from 'three';
import { RoomEnvironment } from 'three/addons/environments/RoomEnvironment.js';
import { EffectComposer } from 'three/addons/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/addons/postprocessing/RenderPass.js';
import { UnrealBloomPass } from 'three/addons/postprocessing/UnrealBloomPass.js';
import { OutputPass } from 'three/addons/postprocessing/OutputPass.js';

import { buildGarment } from './garment.js';
import { garmentTexture, fabricNormalMap, COLORWAYS } from './fabric.js';

const SHOTS = {
  hero:   { pos: [0.0, 0.35, 6.0],  look: [-1.42, 0.05, 0], fov: 34, spin: 0.12, key: 0.7 },
  gate:   { pos: [0.0, 0.20, 12.0], look: [0.0, 1.25, 0], fov: 32, spin: 0.07, key: 0.5 },
  studio: { pos: [0.0, 0.12, 5.05],  look: [0, 0.02, 0], fov: 36, spin: 0.04, key: 1.00 },
  detail: { pos: [0.95, 0.62, 1.9], look: [0.42, 0.46, 0.35], fov: 30, spin: 0.0, key: 1.15 },
  wide:   { pos: [0.0, 0.10, 10.5], look: [0, 1.05, 0], fov: 30, spin: 0.10, key: 0.45 }
};

function darken(hex, k) {
  const c = new THREE.Color(hex);
  c.multiplyScalar(k);
  return c;
}

export class Stage {
  constructor(canvas) {
    this.canvas = canvas;
    this.ok = false;
    this.reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    try {
      this.renderer = new THREE.WebGLRenderer({
        canvas, antialias: true, alpha: false, powerPreference: 'high-performance'
      });
    } catch (e) {
      return;
    }
    if (!this.renderer.capabilities.isWebGL2 && !this.renderer.getContext()) return;

    this.renderer.setPixelRatio(Math.min(devicePixelRatio, 1.75));
    this.renderer.shadowMap.enabled = true;
    this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
    this.renderer.toneMappingExposure = 0.95;

    this.scene = new THREE.Scene();
    this.scene.background = new THREE.Color('#050507');
    this.scene.fog = new THREE.FogExp2('#050507', 0.052);

    this.camera = new THREE.PerspectiveCamera(34, 1, 0.1, 100);
    this.camera.position.set(0, 0.35, 6.4);
    this.lookAt = new THREE.Vector3(0, 0.05, 0);

    const pmrem = new THREE.PMREMGenerator(this.renderer);
    this.scene.environment = pmrem.fromScene(new RoomEnvironment(), 0.04).texture;
    this.scene.environmentIntensity = 0.32;

    this._lights();
    this._ground();
    this._dust();
    this._ring();
    this._materials();
    this._composer();
    this._input();

    this.garments = new Map();
    this.current = null;
    this.shot = 'hero';
    this.shotBlend = { ...SHOTS.hero };
    this.spinTarget = 0;
    this.spin = 0;
    this.userYaw = 0;
    this.userPitch = 0;
    this.swap = 1;             // 1 = settled, drops to 0 while a garment changes
    this.clock = new THREE.Clock();
    this.ok = true;
  }

  /* ---------- setup ---------- */

  _lights() {
    this.scene.add(new THREE.AmbientLight('#26334d', 0.28));

    this.key = new THREE.SpotLight('#fff4de', 150, 26, 0.85, 0.8, 1.5);
    this.key.position.set(2.6, 5.2, 4.4);
    this.key.castShadow = true;
    this.key.shadow.mapSize.set(1024, 1024);
    this.key.shadow.bias = -0.0012;
    this.scene.add(this.key, this.key.target);

    this.rimA = new THREE.PointLight('#f0be5e', 70, 13, 2.0);
    this.rimA.position.set(-3.4, 2.3, -2.8);
    this.scene.add(this.rimA);

    this.rimB = new THREE.PointLight('#c98a2e', 48, 13, 2.0);
    this.rimB.position.set(3.6, 1.8, -2.6);
    this.scene.add(this.rimB);

    const fill = new THREE.PointLight('#8fa4cc', 40, 20, 2);
    fill.position.set(0.5, 0.4, 4.6);
    this.scene.add(fill);

    const bounce = new THREE.DirectionalLight('#cfd8ee', 0.55);
    bounce.position.set(-3.5, 3.0, 2.5);
    this.scene.add(bounce);
  }

  _ground() {
    const c = document.createElement('canvas');
    c.width = c.height = 512;
    const g = c.getContext('2d');
    const rad = g.createRadialGradient(256, 256, 20, 256, 256, 250);
    rad.addColorStop(0, '#111116');
    rad.addColorStop(0.4, '#08080b');
    rad.addColorStop(1, '#050507');
    g.fillStyle = rad;
    g.fillRect(0, 0, 512, 512);
    const tex = new THREE.CanvasTexture(c);
    tex.colorSpace = THREE.SRGBColorSpace;

    const floor = new THREE.Mesh(
      new THREE.CircleGeometry(11, 64),
      new THREE.MeshStandardMaterial({ map: tex, roughness: 0.78, metalness: 0.04 })
    );
    floor.rotation.x = -Math.PI / 2;
    floor.position.y = -1.45;
    floor.receiveShadow = true;
    this.scene.add(floor);
  }

  _dust() {
    const N = this.reduced ? 400 : 1400;
    const pos = new Float32Array(N * 3);
    const seed = new Float32Array(N);
    for (let i = 0; i < N; i++) {
      const r = 1.6 + Math.random() * 6.5;
      const a = Math.random() * Math.PI * 2;
      pos[i * 3] = Math.cos(a) * r;
      pos[i * 3 + 1] = -1.4 + Math.random() * 6;
      pos[i * 3 + 2] = Math.sin(a) * r;
      seed[i] = Math.random();
    }
    const geo = new THREE.BufferGeometry();
    geo.setAttribute('position', new THREE.BufferAttribute(pos, 3));
    geo.setAttribute('seed', new THREE.BufferAttribute(seed, 1));

    const mat = new THREE.PointsMaterial({
      color: '#e8c070', size: 0.035, sizeAttenuation: true,
      transparent: true, opacity: 0.75, depthWrite: false, blending: THREE.AdditiveBlending
    });
    this.dust = new THREE.Points(geo, mat);
    this.dust.frustumCulled = false;
    this.scene.add(this.dust);
  }

  _ring() {
    const mat = new THREE.MeshStandardMaterial({
      color: '#c79a3e', metalness: 1, roughness: 0.24,
      emissive: '#2a1c05', emissiveIntensity: 0.3
    });
    this.ring = new THREE.Mesh(new THREE.TorusGeometry(1.92, 0.011, 8, 220), mat);
    this.ring.rotation.x = Math.PI / 2.6;
    this.ring.position.set(0, -0.18, -2.3);
    this.scene.add(this.ring);

    this.ring2 = new THREE.Mesh(new THREE.TorusGeometry(2.30, 0.007, 8, 220), mat);
    this.ring2.rotation.x = Math.PI / 2.15;
    this.ring2.rotation.z = 0.5;
    this.ring2.position.set(0, -0.18, -2.7);
    this.scene.add(this.ring2);
  }

  _materials() {
    const normal = fabricNormalMap();
    this.mats = {
      fabric: new THREE.MeshStandardMaterial({
        color: '#ffffff', roughness: 0.93, metalness: 0.02,
        normalMap: normal, normalScale: new THREE.Vector2(0.35, 0.35)
      }),
      plain: new THREE.MeshStandardMaterial({
        color: '#0c0c0e', roughness: 0.95, metalness: 0.02,
        normalMap: normal, normalScale: new THREE.Vector2(0.4, 0.4)
      }),
      rib: new THREE.MeshStandardMaterial({ color: '#08080a', roughness: 0.88, metalness: 0.04 }),
      metal: new THREE.MeshStandardMaterial({
        color: '#d8b25c', metalness: 1, roughness: 0.27,
        emissive: '#2e2007', emissiveIntensity: 0.4
      }),
      lining: new THREE.MeshStandardMaterial({ color: '#060608', roughness: 1, side: THREE.DoubleSide })
    };
  }

  _composer() {
    this.composer = new EffectComposer(this.renderer);
    this.composer.addPass(new RenderPass(this.scene, this.camera));
    this.bloom = new UnrealBloomPass(new THREE.Vector2(1, 1), 0.55, 0.75, 0.82);
    if (!this.reduced) this.composer.addPass(this.bloom);
    this.composer.addPass(new OutputPass());
  }

  _input() {
    let dragging = false, lastX = 0, lastY = 0;
    const down = e => {
      if (!this.interactive) return;
      dragging = true;
      lastX = (e.touches ? e.touches[0].clientX : e.clientX);
      lastY = (e.touches ? e.touches[0].clientY : e.clientY);
      this.canvas.classList.add('grabbing');
    };
    const move = e => {
      if (!dragging) return;
      const x = (e.touches ? e.touches[0].clientX : e.clientX);
      const y = (e.touches ? e.touches[0].clientY : e.clientY);
      this.userYaw += (x - lastX) * 0.008;
      this.userPitch = THREE.MathUtils.clamp(this.userPitch + (y - lastY) * 0.003, -0.35, 0.35);
      lastX = x; lastY = y;
      if (e.cancelable) e.preventDefault();
    };
    const up = () => { dragging = false; this.canvas.classList.remove('grabbing'); };

    this.canvas.addEventListener('pointerdown', down);
    window.addEventListener('pointermove', move, { passive: false });
    window.addEventListener('pointerup', up);
    this.canvas.addEventListener('touchstart', down, { passive: true });
    window.addEventListener('touchmove', move, { passive: false });
    window.addEventListener('touchend', up);
  }

  /* ---------- content ---------- */

  async setLook({ garment, path, colorway }) {
    if (!this.ok) return;
    const cw = COLORWAYS.find(c => c.id === colorway) || COLORWAYS[0];

    const tex = await garmentTexture(path, cw, garment);
    this.mats.fabric.map = tex;
    this.mats.fabric.needsUpdate = true;
    this.mats.plain.color.set(cw.hex);
    this.lightScale = cw.light ? 0.22 : 1;
    this.exposureTarget = cw.light ? 0.86 : 0.95;
    this.mats.rib.color.copy(darken(cw.hex, 0.62));
    this.mats.lining.color.copy(darken(cw.hex, 0.35));

    if (!this.garments.has(garment)) {
      this.garments.set(garment, buildGarment(garment, this.mats));
    }
    const next = this.garments.get(garment);
    if (next !== this.current) {
      if (this.current) this.scene.remove(this.current);
      this.scene.add(next);
      this.current = next;
      this.swap = 0;                     // plays the grow-in on the next frames
    }
  }

  setShot(name) {
    if (SHOTS[name]) this.shot = name;
    this.interactive = name === 'studio';
  }

  resetRotation() { this.userYaw = 0; this.userPitch = 0; }

  /* ---------- loop ---------- */

  resize() {
    if (!this.ok) return;
    const w = window.innerWidth, h = window.innerHeight;
    this.renderer.setSize(w, h, false);
    this.composer.setSize(w, h);
    this.camera.aspect = w / h;
    // keep the garment in frame on narrow screens
    this.frameBias = w / h < 0.85 ? 1.8 : w / h < 1.2 ? 1.3 : 1;
    this.shiftScale = w / h < 1.15 ? 0 : 1;
    this.camera.updateProjectionMatrix();
  }

  render() {
    if (!this.ok) return;
    const dt = Math.min(this.clock.getDelta(), 0.05);
    const t = this.clock.elapsedTime;
    const target = SHOTS[this.shot];
    const k = 1 - Math.pow(0.0015, dt);   // frame-rate independent damping

    const bias = this.frameBias || 1;
    this.camera.position.lerp(
      new THREE.Vector3(target.pos[0], target.pos[1], target.pos[2] * bias), k
    );
    const sx = this.shiftScale === undefined ? 1 : this.shiftScale;
    this.lookAt.lerp(new THREE.Vector3(target.look[0] * sx, target.look[1], target.look[2]), k);
    this.camera.lookAt(this.lookAt);
    this.camera.fov += (target.fov - this.camera.fov) * k;
    this.camera.updateProjectionMatrix();

    const ls = this.lightScale === undefined ? 1 : this.lightScale;
    this.key.intensity += (150 * target.key * ls - this.key.intensity) * k;
    this.rimA.intensity += (70 * ls - this.rimA.intensity) * k;
    this.rimB.intensity += (48 * ls - this.rimB.intensity) * k;
    this.renderer.toneMappingExposure +=
      ((this.exposureTarget ?? 0.95) - this.renderer.toneMappingExposure) * k;

    if (this.current) {
      this.spin += target.spin * dt;
      this.current.rotation.y = this.spin + this.userYaw;
      this.current.rotation.x = this.userPitch;
      this.current.position.y = Math.sin(t * 0.6) * 0.035;

      this.swap = Math.min(1, this.swap + dt * 2.6);
      const e = 1 - Math.pow(1 - this.swap, 3);
      this.current.scale.setScalar(0.82 + 0.18 * e);
    }

    if (this.dust) {
      this.dust.rotation.y = t * 0.02;
      const p = this.dust.geometry.attributes.position;
      const s = this.dust.geometry.attributes.seed;
      for (let i = 0; i < p.count; i++) {
        p.array[i * 3 + 1] += (0.06 + s.array[i] * 0.12) * dt;
        if (p.array[i * 3 + 1] > 4.8) p.array[i * 3 + 1] = -1.4;
      }
      p.needsUpdate = true;
    }

    this.ring.rotation.z = t * 0.12;
    this.ring2.rotation.z = -t * 0.08 + 0.5;

    this.composer.render();
  }
}
