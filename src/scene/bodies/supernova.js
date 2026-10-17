// ─── Supernova (AI Projects intro) ───────────────────────────────────────────
// Fully scroll-scrubbed: the star swells → flashes → a debris shell and a
// shockwave ring blast outward → remnant glows. Scroll back = un-explode.
import {
  Group, Mesh, SphereGeometry, PlaneGeometry, ShaderMaterial, Points, BufferGeometry,
  BufferAttribute, AdditiveBlending,
} from 'three';
import { NOISE } from '../lib/glsl.js';
import { rig, applyUser, glowBlend, disposeTree, smooth, clamp01 } from './common.js';
import { starMaterial, coronaMesh } from './sun.js';
import { rng, gauss } from '../lib/assets.js';

const quadVert = /* glsl */ `varying vec2 vUv; void main(){ vUv = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position,1.0); }`;

export function createSupernova(ctx) {
  const r = rig();
  const n = ctx.lite ? 2200 : 5000;

  // ── Progenitor star ──────────────────────────────────────────────────────
  const starG = new Group();
  const star = new Mesh(new SphereGeometry(1, 64, 48), starMaterial({ hot: true }));
  starG.add(star);
  const starGlow = coronaMesh({ size: 3.6, color: [0.6, 0.75, 1.0], rays: 0.7 });
  starG.add(starGlow);
  r.root.add(starG);

  // ── Flash + remnant glow (one quad) ──────────────────────────────────────
  const glowMat = new ShaderMaterial({
    uniforms: { uFlash: { value: 0 }, uRemnant: { value: 0 }, uE: { value: 0 }, uT: { value: 0 }, uDark: { value: 1 } },
    vertexShader: quadVert,
    fragmentShader: /* glsl */ `
      ${NOISE}
      uniform float uFlash; uniform float uRemnant; uniform float uE; uniform float uT; uniform float uDark;
      varying vec2 vUv;
      void main(){
        vec2 q = vUv * 2.0 - 1.0;
        float r = length(q);
        float flash = exp(-r * r * 9.0) * uFlash * 1.6 + exp(-r * 3.0) * uFlash * 0.5;
        float shell = mix(0.12, 0.95, uE);
        float warp = fbm(vec3(q * 3.2, uT)) * 0.18;
        float neb = smoothstep(shell + 0.08, shell * 0.5, r + warp) * smoothstep(0.0, shell * 0.9, r + warp * 0.5);
        float fil = pow(abs(snoise(vec3(q * 7.0, uT * 0.7 + 3.0))), 0.5);
        neb *= (0.35 + 0.65 * (1.0 - fil)) * uRemnant;
        vec3 nebCol = mix(vec3(1.0, 0.35, 0.18), vec3(0.85, 0.2, 0.55), smoothstep(0.2, 0.9, r / max(shell, 0.01)));
        nebCol = mix(nebCol, vec3(0.35, 0.65, 1.0), smoothstep(0.25, 0.0, r) * 0.6);
        vec3 col = vec3(1.0, 0.95, 0.88) * flash + nebCol * neb * 0.9;
        float a = clamp(flash + neb * 0.9, 0.0, 1.0);
        vec3 lightCol = mix(vec3(0.95, 0.6, 0.3), nebCol * 0.8, step(0.001, neb));
        gl_FragColor = uDark > 0.5 ? vec4(col, a) : vec4(lightCol, a * 0.7);
      }`,
    transparent: true, depthWrite: false, blending: AdditiveBlending,
  });
  const glow = new Mesh(new PlaneGeometry(2.4, 2.4), glowMat);
  glow.renderOrder = 4;
  r.root.add(glow);

  // ── Debris shell (points) ────────────────────────────────────────────────
  const rand = rng(99);
  const dir = new Float32Array(n * 3), seed = new Float32Array(n);
  // ~18 ejecta jets: most debris clumps along them → filaments, not a fuzzy ball
  const jets = Array.from({ length: 18 }, () => {
    const x = gauss(rand), y = gauss(rand), z = gauss(rand); const l = Math.hypot(x, y, z) || 1;
    return [x / l, y / l, z / l];
  });
  for (let i = 0; i < n; i++) {
    let x = gauss(rand), y = gauss(rand), z = gauss(rand);
    if (rand() < 0.7) {
      const j = jets[(rand() * jets.length) | 0];
      x = j[0] + x * 0.22; y = j[1] + y * 0.22; z = j[2] + z * 0.22;
    }
    const l = Math.hypot(x, y, z) || 1;
    dir.set([x / l, y / l * 0.92, z / l], i * 3);
    seed[i] = rand();
  }
  const pg = new BufferGeometry();
  pg.setAttribute('position', new BufferAttribute(dir, 3));
  pg.setAttribute('aSeed', new BufferAttribute(seed, 1));
  const shellMat = new ShaderMaterial({
    uniforms: { uE: { value: 0 }, uScale: { value: 300 }, uDpr: { value: 1 }, uDark: { value: 1 } },
    vertexShader: /* glsl */ `
      ${NOISE}
      uniform float uE; uniform float uScale; uniform float uDpr; uniform float uDark;
      attribute float aSeed;
      varying float vA; varying vec3 vC;
      void main(){
        float speed = 0.55 + aSeed * 0.5;
        float lobes = 0.75 + 0.45 * snoise(position * 1.8 + 4.0);
        float R = (1.0 - pow(1.0 - uE, 3.0)) * speed * lobes;
        vec3 p = position * R;
        p += 0.05 * uE * vec3(snoise(position * 5.0), snoise(position * 5.0 + 9.0), snoise(position * 5.0 + 17.0));
        vec4 mv = modelViewMatrix * vec4(p, 1.0);
        gl_Position = projectionMatrix * mv;
        gl_PointSize = mix(3.2, 1.4, uE) * uDpr * (0.6 + aSeed * 0.8);
        float on = step(0.001, uE);
        vA = on * mix(1.0, 0.25, uE) * (0.5 + 0.5 * aSeed);
        vec3 hot = vec3(1.0, 0.95, 0.85);
        vec3 warm = vec3(1.0, 0.55, 0.22);
        vec3 cool = mix(vec3(0.9, 0.25, 0.4), vec3(0.4, 0.6, 1.0), step(0.8, aSeed));
        vC = mix(hot, mix(warm, cool, smoothstep(0.35, 0.9, uE)), smoothstep(0.0, 0.3, uE));
        if (uDark < 0.5) { vC = mix(vec3(0.75, 0.32, 0.12), vec3(0.45, 0.18, 0.28), smoothstep(0.35, 0.9, uE)); vA *= 0.75; }
      }`,
    fragmentShader: /* glsl */ `
      varying float vA; varying vec3 vC;
      void main(){
        float d = length(gl_PointCoord - 0.5);
        float a = smoothstep(0.5, 0.0, d) * vA;
        if (a < 0.004) discard;
        gl_FragColor = vec4(vC, a);
      }`,
    transparent: true, depthWrite: false, blending: AdditiveBlending,
  });
  const shell = new Points(pg, shellMat);
  shell.frustumCulled = false;
  r.spin.add(shell);

  // ── Shockwave rings (one camera-facing, one in the equatorial plane) ─────
  const ringFrag = /* glsl */ `
    uniform float uR; uniform float uA; uniform float uDark;
    varying vec2 vUv;
    void main(){
      float r = length(vUv * 2.0 - 1.0);
      float w = 0.007 + uR * 0.012;
      float band = exp(-pow((r - uR) / w, 2.0));
      float inner = smoothstep(uR, uR * 0.55, r) * 0.06;
      float a = (band + inner) * uA;
      vec3 c = mix(vec3(0.85, 0.42, 0.18), vec3(0.75, 0.88, 1.0), uDark);
      gl_FragColor = vec4(c, a * mix(0.7, 1.0, uDark));
    }`;
  const mkRing = () => new Mesh(new PlaneGeometry(2.6, 2.6), new ShaderMaterial({
    uniforms: { uR: { value: 0 }, uA: { value: 0 }, uDark: { value: 1 } },
    vertexShader: quadVert, fragmentShader: ringFrag,
    transparent: true, depthWrite: false, blending: AdditiveBlending,
  }));
  const ringA = mkRing();
  const ringB = mkRing();
  ringB.rotation.x = -1.2;
  ringA.renderOrder = ringB.renderOrder = 6;
  r.root.add(ringA);
  r.spin.add(ringB);

  const mats = [starGlow.material, glowMat, shellMat, ringA.material, ringB.material];

  return {
    root: r.root,
    meta: { light: [-0.5, 0.5, 0.7], name: 'Supernova' },
    update(s) {
      const p = s.reduced ? 1 : clamp01((s.p - 0.12) / 0.62);
      // 0 → 0.35 swell, 0.35 → 0.45 flash, 0.4 → 1 expansion
      const swell = smooth(0.0, 0.36, p);
      const collapse = smooth(0.38, 0.46, p);
      const e = clamp01((p - 0.4) / 0.6);
      const starScale = (0.16 + swell * 0.1) * (1 - collapse * 0.86);
      starG.scale.setScalar(starScale);
      star.material.uniforms.uT.value = s.p * 5;
      star.material.uniforms.uBoost.value = swell * 0.35 + collapse * 0.6;
      starGlow.material.uniforms.uT.value = s.p * 5;
      starGlow.material.uniforms.uIntensity.value = 0.8 + swell * 1.2 + collapse;
      const flash = Math.exp(-Math.pow((p - 0.42) / 0.05, 2));
      glowMat.uniforms.uFlash.value = flash;
      glowMat.uniforms.uRemnant.value = smooth(0.45, 0.8, p);
      glowMat.uniforms.uE.value = e;
      glowMat.uniforms.uT.value = s.p * 1.5;
      shellMat.uniforms.uE.value = e;
      shellMat.uniforms.uDpr.value = s.dpr;
      const ringR = (1 - Math.pow(1 - e, 2.2)) * 0.98;
      for (const ring of [ringA, ringB]) {
        ring.material.uniforms.uR.value = ringR;
        ring.material.uniforms.uA.value = e > 0 ? Math.pow(1 - e, 1.6) * 0.85 : 0;
      }
      r.spin.rotation.y = s.p * 0.6;
      applyUser(r.user, s, { x: 0.1, y: 0 });
      return false;
    },
    setTheme(dark) { mats.forEach(m => glowBlend(m, dark)); },
    setQuality() {},
    dispose() { disposeTree(r.root); },
  };
}
