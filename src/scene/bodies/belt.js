// ─── Asteroid belt (Concepts / System Design) ────────────────────────────────
// One InstancedMesh → one draw call. Many parts, one designed orbit.
import { InstancedMesh, MeshStandardMaterial, Object3D, Color, Group, Mesh, SphereGeometry } from 'three';
import { rig, applyUser, glowBlend, disposeTree } from './common.js';
import { rockGeometry } from './planet.js';
import { coronaMesh, starMaterial } from './sun.js';
import { rng, gauss } from '../lib/assets.js';

export function createBelt(ctx) {
  const r = rig();
  const count = ctx.lite ? 260 : 520;
  const geo = rockGeometry(1, 2.7, 0.42);
  const mat = new MeshStandardMaterial({ roughness: 1, metalness: 0, flatShading: true });
  const mesh = new InstancedMesh(geo, mat, count);
  const rand = rng(42);
  const o = new Object3D();
  const c = new Color();
  for (let i = 0; i < count; i++) {
    const a = rand() * Math.PI * 2;
    const rad = 0.62 + gauss(rand) * 0.09 + (rand() < 0.08 ? (rand() - 0.5) * 0.4 : 0);
    o.position.set(Math.cos(a) * rad, gauss(rand) * 0.025, Math.sin(a) * rad);
    const big = rand() < 0.04 ? 2.4 : 1;
    const s = (0.006 + Math.pow(rand(), 3) * 0.022) * big;
    o.scale.set(s * (0.7 + rand() * 0.7), s * (0.6 + rand() * 0.5), s * (0.7 + rand() * 0.7));
    o.rotation.set(rand() * 6.3, rand() * 6.3, rand() * 6.3);
    o.updateMatrix();
    mesh.setMatrixAt(i, o.matrix);
    const tone = 0.32 + rand() * 0.28;
    c.setRGB(tone * 1.05, tone * 0.95, tone * 0.85);
    mesh.setColorAt(i, c);
  }
  mesh.instanceMatrix.needsUpdate = true;
  r.spin.add(mesh);

  // distant parent star glow at the centre
  const glow = coronaMesh({ size: 2.6, color: [1.0, 0.78, 0.5], rays: 0.4 });
  const glowG = new Group();
  glowG.scale.setScalar(0.035);
  glowG.add(glow);
  const star = new Mesh(new SphereGeometry(1, 32, 24), starMaterial());
  glowG.add(star);
  r.root.add(glowG);

  return {
    root: r.root,
    meta: { light: [-0.4, 0.6, 0.7], name: 'Asteroid belt' },
    update(s) {
      r.spin.rotation.y = 0.4 + s.p * (s.reduced ? 0 : 1.1);
      applyUser(r.user, s, { x: 0.42, y: 0 });
      glow.material.uniforms.uT.value = s.p * 3;
      star.material.uniforms.uT.value = s.p * 3;
      return false;
    },
    setTheme(dark) { glowBlend(glow.material, dark); },
    setQuality() {},
    dispose() { disposeTree(r.root); },
  };
}
