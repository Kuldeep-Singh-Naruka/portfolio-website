// ─── Generic textured planet (+ Moon, Earth, rings, atmosphere) ──────────────
import {
  Mesh, SphereGeometry, MeshStandardMaterial, MeshPhongMaterial, ShaderMaterial,
  RingGeometry, DoubleSide, AdditiveBlending, Vector3, Color, IcosahedronGeometry,
  Group, FrontSide,
} from 'three';
import { rig, applyUser, glowBlend, disposeTree } from './common.js';

// Skill planets (and the Moon). `light` is the key-light direction for this stage.
export const PLANETS = {
  moon:    { map: 'moon', bump: 'moon', bumpScale: 4, tilt: 0.12, spin: 0.9, light: [-1.0, 0.25, 0.35], name: 'The Moon' },
  mercury: { map: 'mercury', bump: 'mercury_bump', bumpScale: 3, tilt: 0.02, spin: 1.1, name: 'Mercury' },
  earth:   { earth: true, tilt: 0.41, spin: 1.6, atmo: [0.35, 0.62, 1.0], name: 'Earth' },
  mars:    { map: 'mars', bump: 'mars_bump', bumpScale: 3, tilt: 0.44, spin: 1.2, moonlet: true, atmo: [1.0, 0.55, 0.35], atmoStrength: 0.35, name: 'Mars' },
  jupiter: { map: 'jupiter', tilt: 0.05, spin: 1.4, name: 'Jupiter' },
  saturn:  { map: 'saturn', tilt: 0.47, spin: 1.0, ring: { tex: 'saturn_ring', inner: 1.24, outer: 2.27 }, name: 'Saturn' },
  uranus:  { map: 'uranus', tilt: 1.71, spin: 1.0, ring: { tex: 'uranus_ring', inner: 1.6, outer: 2.05, opacity: 0.55 }, atmo: [0.55, 0.9, 1.0], atmoStrength: 0.6, name: 'Uranus' },
  neptune: { map: 'neptune', tilt: 0.49, spin: 1.2, atmo: [0.35, 0.5, 1.0], atmoStrength: 0.8, name: 'Neptune' },
};

/** Fresnel atmosphere shell, lit only on the day side. */
export function atmosphere(color, strength, lightDirWorld) {
  const mat = new ShaderMaterial({
    uniforms: {
      uColor: { value: new Color(...color) },
      uStrength: { value: strength },
      uLight: { value: lightDirWorld },
      uDark: { value: 1 },
    },
    vertexShader: /* glsl */ `
      varying vec3 vN; varying vec3 vV; varying vec3 vWN;
      void main(){
        vec4 mv = modelViewMatrix * vec4(position, 1.0);
        vN = normalize(normalMatrix * normal);
        vWN = normalize(mat3(modelMatrix) * normal);
        vV = normalize(-mv.xyz);
        gl_Position = projectionMatrix * mv;
      }`,
    fragmentShader: /* glsl */ `
      uniform vec3 uColor; uniform float uStrength; uniform vec3 uLight; uniform float uDark;
      varying vec3 vN; varying vec3 vV; varying vec3 vWN;
      void main(){
        float f = 1.0 - max(dot(normalize(vN), normalize(vV)), 0.0);
        float rim = pow(f, 2.6);
        float day = smoothstep(-0.25, 0.45, dot(normalize(vWN), normalize(uLight)));
        float a = rim * day * uStrength;
        gl_FragColor = vec4(uColor * mix(0.75, 1.0, uDark), a * mix(0.6, 1.0, uDark));
      }`,
    transparent: true,
    depthWrite: false,
    blending: AdditiveBlending,
    side: FrontSide,
  });
  return new Mesh(new SphereGeometry(1.045, 96, 64), mat);
}

/** Ring with planet shadow (ray-sphere test toward the light). */
export function ringMesh(t, { tex: name, inner, outer, opacity = 1 }, lightDirWorld) {
  const geo = new RingGeometry(inner, outer, 160, 1);
  // Radial UVs: u runs inner → outer edge (texture strip is horizontal)
  const pos = geo.attributes.position, uv = geo.attributes.uv;
  const v = new Vector3();
  for (let i = 0; i < pos.count; i++) {
    v.fromBufferAttribute(pos, i);
    uv.setXY(i, (v.length() - inner) / (outer - inner), 0.5);
  }
  const mat = new ShaderMaterial({
    uniforms: {
      uMap: { value: t(name) },
      uLight: { value: lightDirWorld },
      uCenter: { value: new Vector3() },
      uRadius: { value: 1 },
      uAmbient: { value: 0.12 },
      uOpacity: { value: opacity },
    },
    vertexShader: /* glsl */ `
      varying vec2 vUv; varying vec3 vW;
      void main(){ vUv = uv; vec4 w = modelMatrix * vec4(position, 1.0); vW = w.xyz; gl_Position = projectionMatrix * viewMatrix * w; }`,
    fragmentShader: /* glsl */ `
      uniform sampler2D uMap; uniform vec3 uLight; uniform vec3 uCenter; uniform float uRadius; uniform float uAmbient; uniform float uOpacity;
      varying vec2 vUv; varying vec3 vW;
      void main(){
        vec4 c = texture2D(uMap, vUv);
        vec3 L = normalize(uLight);
        vec3 oc = vW - uCenter;
        float b = dot(oc, L);
        float cc = dot(oc, oc) - uRadius * uRadius;
        float h = b * b - cc;
        float shadow = (h > 0.0 && b < 0.0) ? 0.08 : 1.0;
        float lit = mix(uAmbient, 1.0, shadow);
        gl_FragColor = vec4(c.rgb * lit * 1.05, c.a * uOpacity);
        #include <colorspace_fragment>
      }`,
    transparent: true,
    side: DoubleSide,
    depthWrite: false,
  });
  const m = new Mesh(geo, mat);
  m.rotation.x = Math.PI / 2;
  m.renderOrder = 2;
  return m;
}

/** Small irregular rock (Phobos / asteroids / comet nucleus). */
export function rockGeometry(detail = 3, seed = 1, rough = 0.28) {
  const g = new IcosahedronGeometry(1, detail);
  const p = g.attributes.position;
  const v = new Vector3();
  const f = (x, y, z) =>
    Math.sin(x * 2.1 + seed) * Math.cos(y * 2.7 - seed * 0.7) * 0.5 +
    Math.sin(y * 5.3 + z * 4.1 + seed * 2.3) * 0.25 +
    Math.cos(z * 9.7 - x * 7.3 + seed) * 0.12;
  for (let i = 0; i < p.count; i++) {
    v.fromBufferAttribute(p, i).normalize();
    const d = 1 + f(v.x, v.y, v.z) * rough;
    p.setXYZ(i, v.x * d, v.y * d * 0.82, v.z * d);
  }
  g.computeVertexNormals();
  return g;
}

export function createPlanet(id, ctx) {
  const cfg = PLANETS[id];
  const r = rig({ tilt: cfg.tilt });
  const lightW = ctx.lightDir; // shared world-space key light direction (Vector3)
  const parts = { atmo: null, clouds: null, ring: null, moonlet: null };
  const segs = 128;

  let surface;
  if (cfg.earth) {
    const mat = new MeshPhongMaterial({
      map: ctx.tex(ctx.lite ? 'earth' : 'earth_2k'),
      normalMap: ctx.tex('earth_normal', { color: false }),
      specularMap: ctx.tex('earth_spec', { color: false }),
      specular: new Color(0x3a4a5a),
      shininess: 22,
      emissiveMap: ctx.tex('earth_lights'),
      emissive: new Color(0xffc477),
      emissiveIntensity: 1.4,
    });
    mat.userData.uLightView = { value: new Vector3() };
    mat.onBeforeCompile = (sh) => {
      sh.uniforms.uLightView = mat.userData.uLightView;
      sh.fragmentShader = 'uniform vec3 uLightView;\n' + sh.fragmentShader.replace(
        '#include <emissivemap_fragment>',
        `#ifdef USE_EMISSIVEMAP
          vec4 emissiveColor = texture2D( emissiveMap, vEmissiveMapUv );
          float nightSide = smoothstep(0.05, -0.3, dot(normal, normalize(uLightView)));
          totalEmissiveRadiance *= emissiveColor.rgb * nightSide;
        #endif`,
      );
    };
    surface = new Mesh(new SphereGeometry(1, segs, 96), mat);
    const clouds = new Mesh(
      new SphereGeometry(1.012, 96, 64),
      new MeshStandardMaterial({ color: 0xffffff, alphaMap: ctx.tex('earth_clouds', { color: false }), transparent: true, depthWrite: false, roughness: 1 }),
    );
    r.spin.add(clouds);
    parts.clouds = clouds;
  } else {
    const mat = new MeshStandardMaterial({
      map: ctx.tex(cfg.map),
      roughness: 0.95,
      metalness: 0,
    });
    if (cfg.bump) { mat.bumpMap = ctx.tex(cfg.bump, { color: false }); mat.bumpScale = cfg.bumpScale; }
    surface = new Mesh(new SphereGeometry(1, segs, 96), mat);
  }
  r.spin.add(surface);

  if (cfg.atmo) {
    parts.atmo = atmosphere(cfg.atmo, cfg.atmoStrength ?? 1.0, lightW);
    r.tilt.add(parts.atmo);
  }
  if (cfg.ring) {
    parts.ring = ringMesh(ctx.tex, cfg.ring, lightW);
    r.tilt.add(parts.ring);
  }
  if (cfg.moonlet) {
    const pivot = new Group();
    const m = new Mesh(rockGeometry(2, 4.2, 0.35), new MeshStandardMaterial({ color: 0x8a7d70, roughness: 1, flatShading: true }));
    m.scale.setScalar(0.07);
    m.position.set(1.75, 0, 0);
    pivot.add(m);
    pivot.rotation.x = 0.35;
    r.tilt.add(pivot);
    parts.moonlet = pivot;
  }

  const wc = new Vector3();
  return {
    root: r.root,
    meta: { light: cfg.light || [-0.65, 0.4, 0.6], name: cfg.name },
    update(s) {
      const k = s.reduced ? 0 : 1;
      r.spin.rotation.y = -0.6 + s.p * cfg.spin * 2.2 * k;
      if (parts.clouds) parts.clouds.rotation.y = s.p * 0.35 * k;
      if (parts.moonlet) parts.moonlet.rotation.y = 0.8 + s.p * 3.0 * k;
      applyUser(r.user, s, { x: 0.12, y: 0 });
      if (parts.ring) {
        r.root.getWorldPosition(wc);
        const u = parts.ring.material.uniforms;
        u.uCenter.value.copy(wc);
        u.uRadius.value = r.root.scale.x;
        u.uAmbient.value = s.dark ? 0.1 : 0.5;
      }
      if (cfg.earth) {
        // light dir in view space == world space here (camera never rotates)
        surface.material.userData.uLightView.value.copy(lightW);
        surface.material.emissiveIntensity = s.dark ? 1.4 : 0;
      }
      return false;
    },
    setTheme(dark) {
      if (parts.atmo) glowBlend(parts.atmo.material, dark);
    },
    setQuality() {},
    dispose() { disposeTree(r.root); },
  };
}
