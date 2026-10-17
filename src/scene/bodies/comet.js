// ─── Comet (Experience) ──────────────────────────────────────────────────────
// Icy nucleus + coma + two tails (straight blue ion tail, curved dust tail).
// The comet travels down its column as you read the timeline; tail particles
// stream only while you scroll.
import { Group, Mesh, MeshStandardMaterial, Points, BufferGeometry, BufferAttribute, ShaderMaterial, AdditiveBlending, Vector2 } from 'three';
import { rig, applyUser, glowBlend, disposeTree } from './common.js';
import { rockGeometry } from './planet.js';
import { glowSprite } from './sun.js';
import { rng, gauss } from '../lib/assets.js';

export function createComet(ctx) {
  const r = rig();
  const head = new Group();
  r.root.add(head);

  const nucleus = new Mesh(rockGeometry(3, 7.3, 0.32), new MeshStandardMaterial({ color: 0x6d6a66, roughness: 1, flatShading: false }));
  nucleus.scale.setScalar(0.06);
  head.add(nucleus);
  const coma = glowSprite({ color: [0.55, 0.82, 1.0], falloff: 3.2 });
  const comaG = new Group();
  comaG.scale.setScalar(0.42);
  comaG.add(coma);
  head.add(comaG);

  // Tail particles in the head's local frame. Anti-sun direction = +x, slightly up.
  const n = ctx.lite ? 1400 : 3200;
  const rand = rng(5);
  const t = new Float32Array(n), off = new Float32Array(n * 2), kind = new Float32Array(n);
  for (let i = 0; i < n; i++) {
    t[i] = rand();
    off[i * 2] = gauss(rand); off[i * 2 + 1] = gauss(rand);
    kind[i] = rand() < 0.42 ? 1 : 0; // 1 = ion, 0 = dust
  }
  const g = new BufferGeometry();
  g.setAttribute('position', new BufferAttribute(new Float32Array(n * 3), 3));
  g.setAttribute('aT', new BufferAttribute(t, 1));
  g.setAttribute('aOff', new BufferAttribute(off, 2));
  g.setAttribute('aKind', new BufferAttribute(kind, 1));
  const mat = new ShaderMaterial({
    uniforms: { uFlow: { value: 0 }, uDir: { value: new Vector2(0.94, 0.34) }, uDpr: { value: 1 }, uDark: { value: 1 } },
    vertexShader: /* glsl */ `
      uniform float uFlow; uniform vec2 uDir; uniform float uDpr; uniform float uDark;
      attribute float aT; attribute vec2 aOff; attribute float aKind;
      varying float vA; varying vec3 vC;
      void main(){
        float u = fract(aT + uFlow * (aKind > 0.5 ? 1.0 : 0.55));
        u = pow(u, 1.35);
        vec2 d = normalize(uDir);
        vec2 n = vec2(-d.y, d.x);
        float L = aKind > 0.5 ? 1.9 : 1.4;
        float width = aKind > 0.5 ? (0.016 + u * 0.06) : (0.03 + u * 0.2);
        vec2 p = d * u * L + n * aOff.x * width;
        if (aKind < 0.5) p += n * (-u * u * 0.32);        // dust tail curves
        vec4 mv = modelViewMatrix * vec4(p, aOff.y * width * 0.6, 1.0);
        gl_Position = projectionMatrix * mv;
        gl_PointSize = (aKind > 0.5 ? 2.0 : 2.8) * uDpr * (1.0 - u * 0.35);
        vA = pow(1.0 - u, 1.4) * (aKind > 0.5 ? 0.85 : 0.65);
        vec3 ion = vec3(0.45, 0.72, 1.0), dust = vec3(1.0, 0.9, 0.72);
        vec3 ionL = vec3(0.24, 0.36, 0.55), dustL = vec3(0.55, 0.42, 0.3);
        vC = aKind > 0.5 ? mix(ionL, ion, uDark) : mix(dustL, dust, uDark);
        if (uDark < 0.5) vA *= 0.8;
      }`,
    fragmentShader: /* glsl */ `
      varying float vA; varying vec3 vC;
      void main(){ float a = smoothstep(0.5, 0.0, length(gl_PointCoord - 0.5)) * vA; if (a < 0.004) discard; gl_FragColor = vec4(vC, a); }`,
    transparent: true, depthWrite: false, blending: AdditiveBlending,
  });
  const tail = new Points(g, mat);
  tail.frustumCulled = false;
  tail.renderOrder = 3;
  head.add(tail);

  return {
    root: r.root,
    meta: { light: [-1.0, -0.3, 0.4], name: 'Comet' },
    update(s) {
      const p = s.reduced ? 0.45 : s.p;
      // travel down-left across the column
      const k = Math.min(1, Math.max(0, (p - 0.15) / 0.7));
      head.position.set(0.42 - k * 0.7, 0.62 - k * 1.1, 0);
      mat.uniforms.uFlow.value = -s.scrollY * 0.0009;
      mat.uniforms.uDpr.value = s.dpr;
      nucleus.rotation.set(s.p * 4 + s.pitch, s.p * 6 + s.yaw, 0);
      applyUser(r.user, { pitch: 0, yaw: 0 });
      return false;
    },
    setTheme(dark) { glowBlend(mat, dark); glowBlend(coma.material, dark); },
    setQuality() {},
    dispose() { disposeTree(r.root); },
  };
}
