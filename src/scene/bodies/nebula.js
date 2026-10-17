// ─── Nebula (Education — where stars are born) ───────────────────────────────
// Layered noise billboards in 3 hues + young stars. Layers parallax with the
// pointer; the gas only drifts when you scroll.
import { Group, Mesh, PlaneGeometry, ShaderMaterial, AdditiveBlending, Color, Points, BufferGeometry, BufferAttribute } from 'three';
import { NOISE } from '../lib/glsl.js';
import { rig, glowBlend, disposeTree } from './common.js';
import { rng, gauss } from '../lib/assets.js';

const LAYERS = [
  // x, y, z, size, rot, colorA, colorB, seed
  [0.0, 0.0, -0.3, 1.9, 0.2, '#3d7bd1', '#20335f', 1.0],
  [-0.25, 0.15, -0.15, 1.5, 1.4, '#d1477f', '#5a1d4a', 2.3],
  [0.28, -0.12, -0.05, 1.35, 2.6, '#ff8a4c', '#7a2c2a', 3.7],
  [0.05, 0.25, 0.05, 1.1, 0.9, '#5ec8d8', '#1a4a5a', 5.1],
  [-0.1, -0.22, 0.12, 1.0, 4.0, '#f2b36b', '#7d3f22', 6.6],
  [0.2, 0.18, 0.2, 0.8, 5.2, '#b56cf0', '#3a1f5e', 8.2],
];

export function createNebula(ctx) {
  const r = rig();
  const layers = [];
  const geo = new PlaneGeometry(1, 1);
  const count = ctx.lite ? 4 : LAYERS.length;
  for (let i = 0; i < count; i++) {
    const [x, y, z, size, rot, ca, cb, seed] = LAYERS[i];
    const mat = new ShaderMaterial({
      uniforms: {
        uA: { value: new Color(ca) }, uB: { value: new Color(cb) }, uSeed: { value: seed },
        uT: { value: 0 }, uDark: { value: 1 },
      },
      vertexShader: /* glsl */ `varying vec2 vUv; void main(){ vUv = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }`,
      fragmentShader: /* glsl */ `
        ${NOISE}
        uniform vec3 uA; uniform vec3 uB; uniform float uSeed; uniform float uT; uniform float uDark;
        varying vec2 vUv;
        void main(){
          vec2 q = vUv * 2.0 - 1.0;
          float r = length(q);
          if (r > 1.0) discard;
          vec3 p = vec3(q * 1.6, uSeed + uT);
          vec3 w = vec3(fbm3(p + 1.7), fbm3(p + 9.2), 0.0);
          float n = fbm3(p * 1.3 + w * 1.4) * 0.5 + 0.5;
          float mask = smoothstep(1.0, 0.15, r) * smoothstep(0.38, 0.85, n);
          float dust = smoothstep(0.55, 0.8, fbm3(p * 2.6 + 4.0) * 0.5 + 0.5);
          mask *= 1.0 - dust * 0.6;
          vec3 c = mix(uB, uA, smoothstep(0.4, 0.95, n));
          if (uDark > 0.5) gl_FragColor = vec4(c * mask * 1.1, mask);
          else gl_FragColor = vec4(c * 1.15, mask * 0.5);
        }`,
      transparent: true, depthWrite: false, blending: AdditiveBlending,
    });
    const m = new Mesh(geo, mat);
    m.position.set(x, y, z);
    m.scale.setScalar(size * 1.35);
    m.rotation.z = rot;
    m.renderOrder = 1 + i;
    m.userData.base = [x, y, z];
    layers.push(m);
    r.root.add(m);
  }

  // young stars
  const rand = rng(3);
  const sn = 70;
  const sp = new Float32Array(sn * 3), ss = new Float32Array(sn);
  for (let i = 0; i < sn; i++) {
    sp.set([gauss(rand) * 0.35, gauss(rand) * 0.3, 0.25], i * 3);
    ss[i] = rand() < 0.1 ? 7 : 1.5 + rand() * 2;
  }
  const sg = new BufferGeometry();
  sg.setAttribute('position', new BufferAttribute(sp, 3));
  sg.setAttribute('aSize', new BufferAttribute(ss, 1));
  const starMat = new ShaderMaterial({
    uniforms: { uDpr: { value: 1 }, uDark: { value: 1 } },
    vertexShader: /* glsl */ `uniform float uDpr; attribute float aSize; void main(){ gl_Position = projectionMatrix * modelViewMatrix * vec4(position,1.0); gl_PointSize = aSize * uDpr; }`,
    fragmentShader: /* glsl */ `uniform float uDark; void main(){ vec2 q = gl_PointCoord - 0.5; float r = length(q);
      float spike = max(smoothstep(0.06, 0.0, abs(q.x)), smoothstep(0.06, 0.0, abs(q.y))) * smoothstep(0.5, 0.0, r);
      float a = max(smoothstep(0.5, 0.0, r * 1.6), spike * 0.7); if (a < 0.01) discard;
      gl_FragColor = uDark > 0.5 ? vec4(vec3(0.9, 0.95, 1.0), a) : vec4(vec3(0.2, 0.22, 0.3), a * 0.7); }`,
    transparent: true, depthWrite: false, blending: AdditiveBlending,
  });
  const stars = new Points(sg, starMat);
  stars.renderOrder = 20;
  r.root.add(stars);

  const mats = [...layers.map(l => l.material), starMat];
  return {
    root: r.root,
    meta: { light: [-0.5, 0.5, 0.7], name: 'Nebula' },
    update(s) {
      const t = s.p * 0.9;
      for (const l of layers) {
        const [x, y, z] = l.userData.base;
        const depth = (z + 0.4) * 0.12;
        l.position.set(x + s.pointer.x * depth + s.yaw * depth * 0.6, y + s.pointer.y * depth - s.pitch * depth * 0.6, z);
        l.material.uniforms.uT.value = t;
      }
      stars.position.set(s.pointer.x * 0.07 + s.yaw * 0.04, s.pointer.y * 0.07, 0);
      starMat.uniforms.uDpr.value = s.dpr;
      return false;
    },
    setTheme(dark) { mats.forEach(m => glowBlend(m, dark)); },
    setQuality() {},
    dispose() { disposeTree(r.root); },
  };
}
