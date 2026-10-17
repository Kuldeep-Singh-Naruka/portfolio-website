// ─── Black hole (Contact) ────────────────────────────────────────────────────
// One fragment shader: point-lens deflection of a procedural starfield,
// photon ring, tilted accretion disk with Doppler beaming, and the lensed
// image of the far side of the disk arching over the shadow.
// Pointer shifts the background → you can see space bend.
import { Mesh, PlaneGeometry, ShaderMaterial, Vector2, Vector3 } from 'three';
import { NOISE } from '../lib/glsl.js';
import { rig, disposeTree } from './common.js';

export function createBlackHole(ctx) {
  const r = rig();
  const mat = new ShaderMaterial({
    uniforms: {
      uRot: { value: 0 }, uIncl: { value: 0.2 }, uBgOff: { value: new Vector2() },
      uDark: { value: 1 }, uBg: { value: new Vector3(0.02, 0.027, 0.05) }, uHover: { value: 0 },
      uLite: { value: 0 },
    },
    vertexShader: /* glsl */ `varying vec2 vUv; void main(){ vUv = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position,1.0); }`,
    fragmentShader: /* glsl */ `
      ${NOISE}
      uniform float uRot; uniform float uIncl; uniform vec2 uBgOff; uniform float uDark; uniform vec3 uBg; uniform float uHover; uniform float uLite;
      varying vec2 vUv;

      float stars(vec2 uv, float scale, float thresh){
        vec2 g = uv * scale; vec2 id = floor(g); vec2 f = fract(g) - 0.5;
        float h = hash12(id);
        vec2 o = vec2(hash12(id + 3.1), hash12(id + 7.7)) - 0.5;
        float d = length(f - o * 0.7);
        float b = step(thresh, h) * (h - thresh) / (1.0 - thresh);
        return b * smoothstep(0.09, 0.0, d);
      }
      vec3 background(vec2 q){
        vec2 u = q + uBgOff;
        float s = stars(u, 22.0, 0.9) * 1.4 + stars(u + 5.3, 48.0, 0.93) * 0.9 + stars(u - 2.1, 90.0, 0.95) * 0.6;
        float neb = uLite > 0.5 ? 0.0 : (fbm3(vec3(u * 1.8, 2.0)) * 0.5 + 0.5);
        neb = smoothstep(0.45, 0.85, neb);
        if (uDark > 0.5) return uBg + vec3(0.35, 0.22, 0.55) * neb * 0.16 + vec3(s);
        return uBg - vec3(0.10, 0.08, 0.06) * neb * 0.35 - vec3(s) * 0.55;
      }

      void main(){
        vec2 p = vUv * 2.0 - 1.0;
        float r = length(p);
        float rs = 0.2;                 // shadow radius
        float thetaE = 0.33;            // Einstein radius
        vec2 dir = p / max(r, 1e-4);

        // ── lensed background ───────────────────────────────────────────
        vec2 src = p - dir * (thetaE * thetaE) / max(r, 0.02);
        vec3 col = background(src);
        float einstein = exp(-pow((r - thetaE) / 0.05, 2.0)) * 0.25;
        col += (uDark > 0.5 ? vec3(0.5, 0.55, 0.75) : vec3(-0.15)) * einstein * 0.4;

        // ── shadow ──────────────────────────────────────────────────────
        float shadow = smoothstep(rs * 1.02, rs * 0.96, r);

        // ── accretion disk (thin, tilted) ───────────────────────────────
        float ci = max(uIncl, 0.05);
        vec2 dp = vec2(p.x, p.y / ci);
        float dr = length(dp);
        float ang = atan(dp.y, dp.x);
        float inner = rs * 1.5, outer = 0.78;
        float band = smoothstep(inner, inner + 0.04, dr) * smoothstep(outer, outer - 0.32, dr);
        float swirl = fbm3(vec3(cos(ang - uRot) * dr * 6.0, sin(ang - uRot) * dr * 6.0, dr * 9.0));
        float streak = 0.55 + 0.45 * sin(dr * 70.0 + swirl * 6.0);
        float heat = 1.0 - smoothstep(inner, outer, dr);
        float doppler = 1.0 + 0.75 * (-dp.x / max(dr, 1e-3));
        float diskI = band * (0.55 + 0.45 * swirl) * streak * doppler * (0.4 + heat * 1.3);
        vec3 diskHot = vec3(1.0, 0.93, 0.8), diskWarm = vec3(1.0, 0.55, 0.2), diskCool = vec3(0.75, 0.22, 0.08);
        vec3 diskCol = mix(diskCool, mix(diskWarm, diskHot, smoothstep(0.5, 1.0, heat)), smoothstep(0.0, 0.6, heat));
        // front half (below centre) passes in front of the shadow; back half is hidden by it
        bool front = p.y < 0.0;
        float diskVis = front ? 1.0 : (1.0 - shadow);

        // ── lensed far side of the disk: arc over (and under) the shadow ─
        float arcR = rs * 1.32;
        float arc = exp(-pow((r - arcR) / (rs * 0.22), 2.0));
        float topBias = mix(0.35, 1.0, smoothstep(-0.3, 0.6, p.y / max(r, 1e-3)));
        float arcSwirl = 0.6 + 0.4 * fbm3(vec3(dir * 4.0, uRot * 0.5 + 1.3));
        float arcI = arc * topBias * arcSwirl * (1.0 + 0.5 * (-dir.x)) * 1.1;
        arcI *= 1.0 - smoothstep(0.0, 0.08, abs(p.y)) * (1.0 - step(0.0, p.y)) * 0.0;

        // photon ring
        float ring = exp(-pow((r - rs * 1.05) / 0.008, 2.0)) * 0.9;

        if (uDark > 0.5) {
          col = mix(col, vec3(0.0), shadow);
          col += diskCol * arcI * (1.0 - shadow);
          col += vec3(1.0, 0.85, 0.65) * ring;
          col += diskCol * diskI * diskVis * (1.0 + uHover * 0.3);
        } else {
          // Light theme: draw only ink on transparent paper (no background disc)
          vec2 u = src + uBgOff;
          float st = stars(u, 22.0, 0.9) + stars(u + 5.3, 48.0, 0.93) * 0.7;
          vec3 ink = mix(vec3(0.62, 0.28, 0.1), vec3(0.85, 0.5, 0.2), heat);
          float aDisk = clamp(diskI * diskVis * 0.85, 0.0, 0.92);
          float aArc = clamp(arcI * 0.85 * (1.0 - shadow), 0.0, 0.85);
          float aRing = clamp(ring, 0.0, 0.8);
          float aStar = clamp(st * 0.55, 0.0, 0.6) * smoothstep(1.0, 0.6, r);
          float aSh = shadow;
          vec3 c = vec3(0.16, 0.18, 0.22);
          float a = aStar;
          c = mix(c, vec3(0.04, 0.035, 0.035), aSh); a = max(a, aSh);
          c = mix(c, ink, aArc); a = max(a, aArc);
          c = mix(c, vec3(0.45, 0.2, 0.08), aRing); a = max(a, aRing);
          c = mix(c, ink, aDisk); a = max(a, aDisk);
          gl_FragColor = vec4(c, a);
          return;
        }

        // fade the whole quad into the page/star layer at its edge
        float edge = smoothstep(1.0, 0.72, r);
        gl_FragColor = vec4(col, edge);
      }`,
    transparent: true,
    depthWrite: false,
  });
  const quad = new Mesh(new PlaneGeometry(2, 2), mat);
  quad.renderOrder = 1;
  r.root.add(quad);

  let hover = 0;
  return {
    root: r.root,
    meta: { light: [-0.5, 0.5, 0.7], name: 'Black hole' },
    update(s) {
      mat.uniforms.uRot.value = s.p * 3.0 + s.yaw * 1.5;
      mat.uniforms.uIncl.value = Math.min(0.5, Math.max(0.08, 0.2 - s.pitch * 0.25));
      mat.uniforms.uBgOff.value.set(s.pointer.x * 0.12 + s.scrollY * 0.00002, s.pointer.y * 0.12 + s.p * 0.15);
      hover += ((s.hover ? 1 : 0) - hover) * Math.min(1, s.dt * 6);
      mat.uniforms.uHover.value = hover;
      return Math.abs((s.hover ? 1 : 0) - hover) > 0.01;
    },
    setTheme(dark) {
      mat.uniforms.uDark.value = dark ? 1 : 0;
      mat.uniforms.uBg.value.set(...(dark ? [0.02, 0.027, 0.05] : [0.882, 0.839, 0.82]));
    },
    setQuality(lite) { mat.uniforms.uLite.value = lite ? 1 : 0; },
    dispose() { disposeTree(r.root); },
  };
}
