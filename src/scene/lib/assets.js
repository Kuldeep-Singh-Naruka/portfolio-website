// ─── Texture + environment cache ─────────────────────────────────────────────
import {
  TextureLoader, SRGBColorSpace, NoColorSpace, LinearMipmapLinearFilter,
  PMREMGenerator, CanvasTexture, RepeatWrapping,
} from 'three';
import { RoomEnvironment } from 'three/addons/environments/RoomEnvironment.js';

const loader = new TextureLoader();
const cache = new Map();
let pending = 0;
let onChange = () => {};
let renderer = null;
let envTex = null;

export function initAssets(r, changed) {
  renderer = r;
  onChange = changed;
}

export function loadingCount() { return pending; }

/** Load a texture once. `color: true` marks albedo maps as sRGB. */
export function tex(name, { color = true } = {}) {
  const key = name + (color ? ':c' : ':d');
  if (cache.has(key)) return cache.get(key);
  pending++;
  const t = loader.load(
    `/textures/${name}.webp`,
    () => { pending--; onChange(); },
    undefined,
    () => { pending--; onChange(); },
  );
  t.colorSpace = color ? SRGBColorSpace : NoColorSpace;
  t.anisotropy = Math.min(8, renderer?.capabilities.getMaxAnisotropy() || 1);
  t.minFilter = LinearMipmapLinearFilter;
  cache.set(key, t);
  return t;
}

/** Soft studio reflections for metal parts (probe, telescope). */
export function envMap() {
  if (envTex || !renderer) return envTex;
  const pm = new PMREMGenerator(renderer);
  envTex = pm.fromScene(new RoomEnvironment(), 0.04).texture;
  pm.dispose();
  return envTex;
}

/** Procedural canvas texture helper. */
export function canvasTex(w, h, draw, { color = true, repeat = false } = {}) {
  const c = document.createElement('canvas');
  c.width = w; c.height = h;
  draw(c.getContext('2d'), w, h);
  const t = new CanvasTexture(c);
  t.colorSpace = color ? SRGBColorSpace : NoColorSpace;
  if (repeat) t.wrapS = t.wrapT = RepeatWrapping;
  return t;
}

/** Deterministic PRNG so every visitor sees the same sky. */
export function rng(seed = 1) {
  let s = seed >>> 0;
  return () => {
    s = (s + 0x6D2B79F5) >>> 0;
    let t = s;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export function gauss(r) {
  return Math.sqrt(-2 * Math.log(r() + 1e-9)) * Math.cos(2 * Math.PI * r());
}
