// ─── Sky: 3-layer parallax starfield + faint Milky Way band ──────────────────
// Drawn directly in clip space so it always fills the screen and sits behind
// every body. Moves only with scroll + pointer (never on its own).
import {
  BufferGeometry, BufferAttribute, Points, ShaderMaterial, Mesh, PlaneGeometry,
  AdditiveBlending, NormalBlending, Group, Color,
} from 'three';
import { NOISE } from '../lib/glsl.js';
import { rng, gauss } from '../lib/assets.js';

const STAR_COUNT = 1700;

// Real star colours: O/B blue-white → G yellow → K/M orange
const STAR_COLORS = ['#9bb0ff', '#aabfff', '#cad7ff', '#f8f7ff', '#fff4ea', '#ffd2a1', '#ffcc6f'];
const STAR_WEIGHTS = [0.04, 0.08, 0.16, 0.3, 0.22, 0.13, 0.07];

export function createSky() {
  const group = new Group();
  const r = rng(7);

  // ── Stars ────────────────────────────────────────────────────────────────
  const pos = new Float32Array(STAR_COUNT * 3);
  const col = new Float32Array(STAR_COUNT * 3);
  const size = new Float32Array(STAR_COUNT);
  const c = new Color();
  for (let i = 0; i < STAR_COUNT; i++) {
    const depth = Math.pow(r(), 1.8);           // most stars are far
    pos[i * 3] = r() * 2 - 1;
    pos[i * 3 + 1] = r();
    pos[i * 3 + 2] = depth;
    // weighted colour pick
    let x = r(), k = 0;
    while (k < STAR_WEIGHTS.length - 1 && (x -= STAR_WEIGHTS[k]) > 0) k++;
    c.set(STAR_COLORS[k]);
    col.set([c.r, c.g, c.b], i * 3);
    const bright = r();
    size[i] = 0.6 + depth * 1.6 + (bright > 0.985 ? 2.2 : 0);
  }
  const geo = new BufferGeometry();
  geo.setAttribute('position', new BufferAttribute(pos, 3));
  geo.setAttribute('aColor', new BufferAttribute(col, 3));
  geo.setAttribute('aSize', new BufferAttribute(size, 1));

  const starMat = new ShaderMaterial({
    uniforms: {
      uScroll: { value: 0 },
      uPointer: { value: { x: 0, y: 0 } },
      uDpr: { value: 1 },
      uDark: { value: 1 },
      uAspect: { value: 1.6 },
    },
    vertexShader: /* glsl */ `
      uniform float uScroll; uniform vec2 uPointer; uniform float uDpr; uniform float uDark;
      attribute vec3 aColor; attribute float aSize;
      varying vec3 vColor; varying float vAlpha;
      void main(){
        float d = position.z;                       // 0 far … 1 near
        float speed = mix(0.04, 0.32, d);
        float y = fract(position.y + uScroll * speed) * 2.2 - 1.1;
        vec2 p = vec2(position.x * 1.04, y) + uPointer * mix(0.004, 0.03, d);
        gl_Position = vec4(p, 0.9999, 1.0);
        float s = aSize * mix(0.75, 1.0, uDark);
        gl_PointSize = s * uDpr * 1.6;
        vColor = mix(vec3(0.16, 0.19, 0.24), aColor, uDark);
        vAlpha = mix(0.22 + d * 0.35, 0.35 + d * 0.65, uDark);
      }`,
    fragmentShader: /* glsl */ `
      uniform float uDark;
      varying vec3 vColor; varying float vAlpha;
      void main(){
        vec2 q = gl_PointCoord - 0.5;
        float r = length(q);
        float core = smoothstep(0.5, 0.0, r);
        float a = mix(smoothstep(0.5, 0.25, r), pow(core, 1.6), uDark) * vAlpha;
        if (a < 0.003) discard;
        gl_FragColor = vec4(vColor, a);
      }`,
    transparent: true,
    depthWrite: false,
    blending: AdditiveBlending,
  });
  const stars = new Points(geo, starMat);
  stars.frustumCulled = false;
  stars.renderOrder = -20;
  group.add(stars);

  // ── Milky Way band (dark theme only) ─────────────────────────────────────
  const mwMat = new ShaderMaterial({
    uniforms: { uScroll: { value: 0 }, uPointer: { value: { x: 0, y: 0 } }, uAspect: { value: 1.6 }, uOpacity: { value: 1 } },
    vertexShader: /* glsl */ `
      varying vec2 vP;
      void main(){ vP = position.xy; gl_Position = vec4(position.xy, 0.99995, 1.0); }`,
    fragmentShader: /* glsl */ `
      ${NOISE}
      uniform float uScroll; uniform vec2 uPointer; uniform float uAspect; uniform float uOpacity;
      varying vec2 vP;
      void main(){
        vec2 p = vec2(vP.x * uAspect, vP.y + uScroll * 0.06) + uPointer * 0.01;
        // diagonal band
        float ang = -0.55;
        vec2 rp = vec2(cos(ang) * p.x - sin(ang) * p.y, sin(ang) * p.x + cos(ang) * p.y);
        float wobble = fbm3(vec3(rp.x * 0.6, 0.0, 1.7)) * 0.35;
        float band = exp(-pow((rp.y - wobble) / 0.42, 2.0));
        if (band < 0.02) { gl_FragColor = vec4(0.0); return; }
        float cloud = fbm3(vec3(rp * 2.2, 3.1)) * 0.5 + 0.5;
        float dust = smoothstep(0.55, 0.8, fbm3(vec3(rp * vec2(3.0, 7.0), 9.2)) * 0.5 + 0.5);
        float glow = band * cloud * (1.0 - dust * 0.75);
        vec3 col = mix(vec3(0.20, 0.22, 0.42), vec3(0.62, 0.52, 0.48), cloud);
        gl_FragColor = vec4(col * glow * 0.20 * uOpacity, 1.0);
      }`,
    transparent: true,
    depthWrite: false,
    blending: AdditiveBlending,
  });
  const milky = new Mesh(new PlaneGeometry(2, 2), mwMat);
  milky.frustumCulled = false;
  milky.renderOrder = -30;
  group.add(milky);

  let isDark = true, isLite = false;
  function setTheme(dark) {
    isDark = dark;
    starMat.uniforms.uDark.value = dark ? 1 : 0;
    starMat.blending = dark ? AdditiveBlending : NormalBlending;
    starMat.needsUpdate = true;
    milky.visible = isDark && !isLite;
  }

  function setQuality(lite) {
    isLite = lite;
    geo.setDrawRange(0, lite ? Math.floor(STAR_COUNT * 0.55) : STAR_COUNT);
    milky.visible = isDark && !isLite;
  }

  function update({ scrollY, vh, pointer, dpr, aspect }) {
    const s = scrollY / vh * 0.25;
    starMat.uniforms.uScroll.value = s;
    starMat.uniforms.uPointer.value = pointer;
    starMat.uniforms.uDpr.value = dpr;
    mwMat.uniforms.uScroll.value = s;
    mwMat.uniforms.uPointer.value = pointer;
    mwMat.uniforms.uAspect.value = aspect;
  }

  return { group, setTheme, setQuality, update };
}

export { gauss };
