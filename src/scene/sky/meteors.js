// ─── Meteors (ulkapind) ──────────────────────────────────────────────────────
// Never on a timer: a meteor only appears when the visitor scrolls fast or
// clicks empty space. Max 2 at once, ~0.7s each.
import { Mesh, PlaneGeometry, ShaderMaterial, AdditiveBlending, NormalBlending, Group } from 'three';

const MAX = 2;
const LIFE = 0.75;

export function createMeteors() {
  const group = new Group();
  const pool = [];

  for (let i = 0; i < MAX; i++) {
    const mat = new ShaderMaterial({
      uniforms: { uFade: { value: 0 }, uDark: { value: 1 } },
      vertexShader: /* glsl */ `
        varying vec2 vUv;
        void main(){ vUv = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }`,
      fragmentShader: /* glsl */ `
        uniform float uFade; uniform float uDark;
        varying vec2 vUv;
        void main(){
          float along = vUv.x;                       // 0 tail … 1 head
          float across = abs(vUv.y - 0.5) * 2.0;
          float tail = pow(along, 2.6) * smoothstep(1.0, 0.0, across);
          float head = smoothstep(0.985, 1.0, along) * smoothstep(1.0, 0.2, across);
          float a = (tail + head * 1.5) * uFade;
          vec3 dark = mix(vec3(0.55, 0.7, 1.0), vec3(1.0), along);
          vec3 light = vec3(0.16, 0.18, 0.22);
          gl_FragColor = vec4(mix(light, dark, uDark), a * mix(0.55, 1.0, uDark));
        }`,
      transparent: true,
      depthWrite: false,
      blending: AdditiveBlending,
    });
    const m = new Mesh(new PlaneGeometry(1, 1), mat);
    m.visible = false;
    m.frustumCulled = false;
    m.renderOrder = -10;
    group.add(m);
    pool.push({ mesh: m, mat, t: 1, sx: 0, sy: 0, dx: 0, dy: 0, len: 0, travel: 0 });
  }

  let enabled = true;
  let lastRandom = -1e9;

  /** Spawn at viewport pixel coords (sx, sy) moving along (dx, dy). */
  function spawn(W, H, sx, sy, dx, dy) {
    if (!enabled) return false;
    const m = pool.find(p => p.t >= 1);
    if (!m) return false;
    const n = Math.hypot(dx, dy) || 1;
    Object.assign(m, {
      t: 0, sx: sx - W / 2, sy: H / 2 - sy, dx: dx / n, dy: -dy / n,
      len: 180 + Math.random() * 120, travel: 520 + Math.random() * 260,
    });
    m.mesh.visible = true;
    return true;
  }

  function randomSpawn(W, H) {
    const now = performance.now();
    if (now - lastRandom < 1400) return false;
    lastRandom = now;
    const fromLeft = Math.random() < 0.5;
    const sx = fromLeft ? W * (0.1 + Math.random() * 0.35) : W * (0.55 + Math.random() * 0.35);
    const sy = H * (0.06 + Math.random() * 0.25);
    return spawn(W, H, sx, sy, fromLeft ? 1 : -1, 0.55 + Math.random() * 0.3);
  }

  /** Click: the streak passes through the click point. */
  function spawnAt(W, H, x, y) {
    const dir = x < W / 2 ? 1 : -1;
    const dx = dir, dy = 0.6;
    return spawn(W, H, x - dx * 260, y - dy * 260, dx, dy);
  }

  function update(dt) {
    let busy = false;
    for (const m of pool) {
      if (m.t >= 1) continue;
      m.t = Math.min(1, m.t + dt / LIFE);
      const e = 1 - Math.pow(1 - m.t, 2);
      const hx = m.sx + m.dx * m.travel * e;
      const hy = m.sy + m.dy * m.travel * e;
      const len = m.len * Math.min(1, m.t * 3);
      m.mesh.position.set(hx - m.dx * len / 2, hy - m.dy * len / 2, -50);
      m.mesh.rotation.z = Math.atan2(m.dy, m.dx);
      m.mesh.scale.set(len, 2.6, 1);
      m.mat.uniforms.uFade.value = Math.sin(Math.PI * m.t);
      if (m.t >= 1) m.mesh.visible = false;
      busy = true;
    }
    return busy;
  }

  function setTheme(dark) {
    for (const m of pool) {
      m.mat.uniforms.uDark.value = dark ? 1 : 0;
      m.mat.blending = dark ? AdditiveBlending : NormalBlending;
      m.mat.needsUpdate = true;
    }
  }

  function setEnabled(v) {
    enabled = v;
    if (!v) for (const m of pool) { m.t = 1; m.mesh.visible = false; }
  }

  return { group, update, randomSpawn, spawnAt, setTheme, setEnabled };
}
