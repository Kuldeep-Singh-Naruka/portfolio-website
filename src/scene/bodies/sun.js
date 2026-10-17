// ─── The Sun (hero) ──────────────────────────────────────────────────────────
// Pure shader, no textures → shows instantly. Surface convection + granulation
// + sunspots advance with scroll, not time. Corona is a camera-facing quad.
import { Mesh, SphereGeometry, ShaderMaterial, PlaneGeometry, AdditiveBlending, Vector3 } from 'three';
import { NOISE } from '../lib/glsl.js';
import { rig, applyUser, glowBlend, disposeTree } from './common.js';

export function starMaterial({ hot = false } = {}) {
  return new ShaderMaterial({
    uniforms: { uT: { value: 0 }, uHover: { value: 0 }, uBoost: { value: 0 }, uHot: { value: hot ? 1 : 0 } },
    vertexShader: /* glsl */ `
      varying vec3 vObj; varying vec3 vN; varying vec3 vV;
      void main(){
        vObj = position;
        vec4 mv = modelViewMatrix * vec4(position, 1.0);
        vN = normalize(normalMatrix * normal);
        vV = normalize(-mv.xyz);
        gl_Position = projectionMatrix * mv;
      }`,
    fragmentShader: /* glsl */ `
      ${NOISE}
      uniform float uT; uniform float uHover; uniform float uBoost; uniform float uHot;
      varying vec3 vObj; varying vec3 vN; varying vec3 vV;
      void main(){
        vec3 p = normalize(vObj);
        float conv = fbm(p * 3.4 + vec3(uT * 0.35, uT * 0.12, -uT * 0.2));
        float gran = snoise(p * 48.0 + vec3(uT * 0.8)) * 0.6 + snoise(p * 96.0 - uT) * 0.4;
        float spotN = snoise(p * vec3(2.4, 5.0, 2.4) + vec3(4.0, 0.0, uT * 0.05));
        float spots = smoothstep(0.74, 0.86, spotN);
        float penumbra = smoothstep(0.64, 0.76, spotN) - spots;
        float heat = 0.78 + 0.16 * conv + 0.06 * gran;
        heat *= 1.0 - spots * 0.75 - penumbra * 0.22;
        float mu = clamp(dot(normalize(vN), normalize(vV)), 0.0, 1.0);
        float limb = pow(mu, 0.42);
        vec3 c0 = vec3(0.42, 0.07, 0.01);
        vec3 c1 = vec3(0.95, 0.42, 0.07);
        vec3 c2 = vec3(1.00, 0.78, 0.38);
        vec3 c3 = vec3(1.00, 0.97, 0.88);
        if (uHot > 0.5) { c0 = vec3(0.25,0.35,0.9); c1 = vec3(0.6,0.75,1.0); c2 = vec3(0.85,0.92,1.0); c3 = vec3(1.0); }
        vec3 col = mix(c0, c1, smoothstep(0.1, 0.5, heat));
        col = mix(col, c2, smoothstep(0.5, 0.8, heat));
        col = mix(col, c3, smoothstep(0.82, 1.0, heat));
        // limb darkening: edges go deeper orange
        col = mix(col * vec3(1.0, 0.62, 0.35), col, limb);
        col *= mix(0.62, 1.08, limb);
        col += (uHover * 0.06 + uBoost) * c3;
        gl_FragColor = vec4(col, 1.0);
      }`,
  });
}

/** Camera-facing corona/glow. `size` = quad half-size in body radii. */
export function coronaMesh({ size = 3.2, color = [1.0, 0.62, 0.28], rays = 1 } = {}) {
  const mat = new ShaderMaterial({
    uniforms: {
      uT: { value: 0 }, uSize: { value: size }, uColor: { value: new Vector3(...color) },
      uIntensity: { value: 1 }, uDark: { value: 1 }, uRays: { value: rays },
    },
    vertexShader: /* glsl */ `varying vec2 vUv; void main(){ vUv = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }`,
    fragmentShader: /* glsl */ `
      ${NOISE}
      uniform float uT; uniform float uSize; uniform vec3 uColor; uniform float uIntensity; uniform float uDark; uniform float uRays;
      varying vec2 vUv;
      void main(){
        vec2 q = (vUv * 2.0 - 1.0) * uSize;
        float r = length(q);
        if (r < 0.97) discard;
        float ang = atan(q.y, q.x);
        vec2 dir = vec2(cos(ang), sin(ang));
        float streak = fbm3(vec3(dir * 3.0, uT * 0.15)) * 0.5 + 0.5;
        float fine = snoise(vec3(dir * 14.0, uT * 0.3)) * 0.5 + 0.5;
        float rays = mix(1.0, 0.45 + 0.9 * streak * (0.7 + 0.5 * fine), uRays);
        float d = r - 1.0;
        float halo = exp(-d * 7.0) * 1.1;
        float outer = exp(-d * 1.8) * 0.7 * rays;
        float edgeFade = smoothstep(uSize, uSize * 0.72, r);
        float g = (halo + outer) * edgeFade * uIntensity;
        vec3 col = mix(uColor, vec3(1.0, 0.95, 0.85), clamp(halo, 0.0, 1.0) * 0.6);
        float a = mix(clamp(g * 0.55, 0.0, 0.85), g, uDark);
        vec3 lightCol = mix(uColor * vec3(0.95, 0.75, 0.6), uColor, 0.4);
        gl_FragColor = vec4(mix(lightCol, col, uDark), a);
      }`,
    transparent: true,
    depthWrite: false,
    blending: AdditiveBlending,
  });
  const m = new Mesh(new PlaneGeometry(2 * size, 2 * size), mat);
  m.renderOrder = 5;
  return m;
}

export function createSun() {
  const r = rig({ tilt: 0.12 });
  const mat = starMaterial();
  const sphere = new Mesh(new SphereGeometry(1, 128, 96), mat);
  r.spin.add(sphere);
  const corona = coronaMesh({ size: 3.0 });
  r.root.add(corona);

  let hover = 0;
  return {
    root: r.root,
    meta: { light: [-0.6, 0.45, 0.65] },
    update(s) {
      const t = s.p * 6.0 + s.scrollY * 0.0006;
      mat.uniforms.uT.value = t;
      corona.material.uniforms.uT.value = t;
      hover += ((s.hover ? 1 : 0) - hover) * Math.min(1, s.dt * 6);
      mat.uniforms.uHover.value = hover;
      corona.material.uniforms.uIntensity.value = 1 + hover * 0.45;
      r.spin.rotation.y = s.p * 1.4;
      applyUser(r.user, s);
      return Math.abs((s.hover ? 1 : 0) - hover) > 0.01;
    },
    setTheme(dark) { glowBlend(corona.material, dark); },
    setQuality() {},
    dispose() { disposeTree(r.root); },
  };
}

/** Soft round glow without a hole (comet coma, small stars). */
export function glowSprite({ color = [1, 1, 1], falloff = 4.0 } = {}) {
  const mat = new ShaderMaterial({
    uniforms: { uColor: { value: new Vector3(...color) }, uIntensity: { value: 1 }, uDark: { value: 1 }, uT: { value: 0 } },
    vertexShader: /* glsl */ `varying vec2 vUv; void main(){ vUv = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }`,
    fragmentShader: /* glsl */ `
      uniform vec3 uColor; uniform float uIntensity; uniform float uDark;
      varying vec2 vUv;
      void main(){
        float r = length(vUv * 2.0 - 1.0);
        float g = (exp(-r * ${falloff.toFixed(2)}) - exp(-${falloff.toFixed(2)})) * uIntensity + exp(-r * r * 60.0) * 0.8;
        vec3 c = mix(uColor, vec3(1.0), clamp(exp(-r * 10.0), 0.0, 1.0));
        vec3 lc = uColor * 0.55;
        gl_FragColor = uDark > 0.5 ? vec4(c * g, g) : vec4(lc, clamp(g * 0.5, 0.0, 0.8));
      }`,
    transparent: true, depthWrite: false, blending: AdditiveBlending,
  });
  const m = new Mesh(new PlaneGeometry(2, 2), mat);
  m.renderOrder = 4;
  return m;
}
