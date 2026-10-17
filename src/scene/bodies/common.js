// ─── Shared helpers for bodies ───────────────────────────────────────────────
import { Group, AdditiveBlending, NormalBlending } from 'three';

/**
 * Standard rig:
 *   root  (positioned + uniformly scaled by the director, never rotated)
 *   └ user  (drag rotation: x = pitch, y = yaw)
 *     └ tilt (axial tilt)
 *       └ spin (scroll-driven rotation)
 */
export function rig({ tilt = 0 } = {}) {
  const root = new Group();
  const user = new Group();
  const tiltG = new Group();
  const spin = new Group();
  tiltG.rotation.z = tilt;
  root.add(user); user.add(tiltG); tiltG.add(spin);
  return { root, user, tilt: tiltG, spin };
}

export function applyUser(user, s, base = { x: 0, y: 0 }) {
  user.rotation.x = base.x + s.pitch;
  user.rotation.y = base.y + s.yaw;
}

/** Switch a glow material between additive (dark) and normal (light). */
export function glowBlend(mat, dark) {
  mat.blending = dark ? AdditiveBlending : NormalBlending;
  if (mat.uniforms?.uDark) mat.uniforms.uDark.value = dark ? 1 : 0;
  mat.needsUpdate = true;
}

export function disposeTree(obj) {
  obj.traverse(o => {
    o.geometry?.dispose?.();
    const m = o.material;
    if (Array.isArray(m)) m.forEach(x => x.dispose());
    else m?.dispose?.();
  });
  obj.removeFromParent();
}

export const clamp01 = x => Math.min(1, Math.max(0, x));
export const smooth = (a, b, x) => { const t = clamp01((x - a) / (b - a)); return t * t * (3 - 2 * t); };
