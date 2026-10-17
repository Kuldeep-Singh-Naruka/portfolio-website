// ─── Orrery (Overview "SYSTEM") ──────────────────────────────────────────────
// The whole stack at once: Sun + 7 planets + asteroid belt on thin orbits.
// Hover a body → label. Click → jump to that skill slide.
import {
  Group, Mesh, SphereGeometry, ShaderMaterial, LineLoop, BufferGeometry, BufferAttribute,
  LineBasicMaterial, Points, PointsMaterial, TorusGeometry, MeshBasicMaterial, Vector3, Color,
} from 'three';
import { rig, applyUser, glowBlend, disposeTree } from './common.js';
import { starMaterial, coronaMesh } from './sun.js';
import { ringMesh } from './planet.js';
import { rng, gauss } from '../lib/assets.js';

const BODIES = [
  { id: 'mercury', tex: 'mercury', r: 0.2,  size: 0.017, skill: 'Languages',               href: '#skill-languages', a: 0.4 },
  { id: 'earth',   tex: 'earth',   r: 0.3,  size: 0.027, skill: 'Backend',                 href: '#skill-backend',   a: 2.2 },
  { id: 'mars',    tex: 'mars',    r: 0.39, size: 0.021, skill: 'Databases',               href: '#skill-databases', a: 4.1 },
  { id: 'jupiter', tex: 'jupiter', r: 0.62, size: 0.056, skill: 'Generative AI & LLMs',    href: '#skill-gen-ai',    a: 5.3 },
  { id: 'saturn',  tex: 'saturn',  r: 0.75, size: 0.045, skill: 'Agentic AI',              href: '#skill-agentic-ai', a: 1.1, ring: true },
  { id: 'uranus',  tex: 'uranus',  r: 0.87, size: 0.033, skill: 'DevOps & Tools',          href: '#skill-devops',    a: 3.4 },
  { id: 'neptune', tex: 'neptune', r: 0.98, size: 0.032, skill: 'Payments & Integrations', href: '#skill-payments',  a: 0.0 },
];
const NAMES = { mercury: 'Mercury', earth: 'Earth', mars: 'Mars', jupiter: 'Jupiter', saturn: 'Saturn', uranus: 'Uranus', neptune: 'Neptune' };

function litMaterial(map, sunPos) {
  return new ShaderMaterial({
    uniforms: { uMap: { value: map }, uSun: { value: sunPos }, uAmb: { value: 0.08 }, uBoost: { value: 0 } },
    vertexShader: /* glsl */ `
      varying vec2 vUv; varying vec3 vWN; varying vec3 vW;
      void main(){ vUv = uv; vec4 w = modelMatrix * vec4(position,1.0); vW = w.xyz; vWN = normalize(mat3(modelMatrix) * normal); gl_Position = projectionMatrix * viewMatrix * w; }`,
    fragmentShader: /* glsl */ `
      uniform sampler2D uMap; uniform vec3 uSun; uniform float uAmb; uniform float uBoost;
      varying vec2 vUv; varying vec3 vWN; varying vec3 vW;
      void main(){
        vec3 c = texture2D(uMap, vUv).rgb;
        float d = max(dot(normalize(vWN), normalize(uSun - vW)), 0.0);
        gl_FragColor = vec4(c * (uAmb + d * 1.15 + uBoost), 1.0);
        #include <colorspace_fragment>
      }`,
  });
}

function orbitLine(radius, mat) {
  const n = 160;
  const pts = new Float32Array(n * 3);
  for (let i = 0; i < n; i++) {
    const a = (i / n) * Math.PI * 2;
    pts[i * 3] = Math.cos(a) * radius; pts[i * 3 + 2] = Math.sin(a) * radius;
  }
  const g = new BufferGeometry();
  g.setAttribute('position', new BufferAttribute(pts, 3));
  return new LineLoop(g, mat);
}

export function createOrrery(ctx) {
  const r = rig();
  const plane = r.spin; // orbital plane
  const sunWorld = new Vector3();

  // Sun
  const sunG = new Group();
  sunG.scale.setScalar(0.075);
  const sun = new Mesh(new SphereGeometry(1, 48, 32), starMaterial());
  sunG.add(sun);
  const corona = coronaMesh({ size: 3.4 });
  r.root.add(sunG); // keep the sun's group unrotated so the corona faces camera
  sunG.add(corona);

  const lineMats = [];
  const items = [];
  const hitMat = new MeshBasicMaterial({ visible: false });

  for (const b of BODIES) {
    const lm = new LineBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0.16, depthWrite: false });
    lineMats.push(lm);
    plane.add(orbitLine(b.r, lm));
    const pivot = new Group();
    const body = new Mesh(new SphereGeometry(b.size, 40, 28), litMaterial(ctx.tex(b.tex), sunWorld));
    body.position.x = b.r;
    pivot.add(body);
    if (b.ring) {
      const ring = ringMesh(ctx.tex, { tex: 'saturn_ring', inner: b.size * 1.25, outer: b.size * 2.3 }, ctx.lightDir);
      ring.material.uniforms.uRadius.value = 0;
      ring.material.uniforms.uAmbient.value = 0.85;
      ring.rotation.x = Math.PI / 2 - 0.45;
      body.add(ring);
    }
    const hit = new Mesh(new SphereGeometry(Math.max(b.size * 2.2, 0.06), 12, 8), hitMat);
    hit.position.x = b.r;
    hit.userData = { label: `${NAMES[b.id]} · ${b.skill}`, href: b.href };
    pivot.add(hit);
    plane.add(pivot);
    items.push({ ...b, pivot, body, hit, lm, scale: 1 });
  }

  // Asteroid belt between Mars and Jupiter
  const rand = rng(11);
  const n = ctx.lite ? 260 : 520;
  const bp = new Float32Array(n * 3);
  for (let i = 0; i < n; i++) {
    const a = rand() * Math.PI * 2, rad = 0.5 + gauss(rand) * 0.028;
    bp[i * 3] = Math.cos(a) * rad; bp[i * 3 + 1] = gauss(rand) * 0.006; bp[i * 3 + 2] = Math.sin(a) * rad;
  }
  const bg = new BufferGeometry();
  bg.setAttribute('position', new BufferAttribute(bp, 3));
  const beltMat = new PointsMaterial({ color: 0xb8aa98, size: 1.6, sizeAttenuation: false, transparent: true, opacity: 0.75, depthWrite: false });
  const belt = new Points(bg, beltMat);
  plane.add(belt);
  const beltHit = new Mesh(new TorusGeometry(0.5, 0.035, 6, 64), hitMat);
  beltHit.rotation.x = Math.PI / 2;
  beltHit.userData = { label: 'Asteroid belt · Concepts', href: '#skill-concepts' };
  plane.add(beltHit);

  const hits = [...items.map(i => i.hit), beltHit];
  let hovered = null;

  return {
    root: r.root,
    meta: { light: [-0.5, 0.5, 0.7], name: 'Solar system' },
    update(s) {
      const k = s.reduced ? 0.2 : 1;
      for (const it of items) {
        const w = 2.2 * Math.pow(0.2 / it.r, 1.2);
        it.pivot.rotation.y = it.a + s.p * w * k * 2.0;
        it.body.rotation.y = s.p * 6;
        const target = hovered === it.hit ? 1.7 : 1;
        it.scale += (target - it.scale) * Math.min(1, s.dt * 10);
        it.body.scale.setScalar(it.scale);
        it.body.material.uniforms.uBoost.value = (it.scale - 1) * 0.35;
        it.body.material.uniforms.uAmb.value = s.dark ? 0.08 : 0.45;
        it.lm.opacity = (s.dark ? 0.16 : 0.22) + (it.scale - 1) * 0.5;
      }
      beltMat.opacity = hovered === beltHit ? 1 : 0.75;
      beltMat.size = hovered === beltHit ? 2.4 : 1.6;
      sun.material.uniforms.uT.value = s.p * 4;
      corona.material.uniforms.uT.value = s.p * 4;
      sunG.getWorldPosition(sunWorld);
      applyUser(r.user, s, { x: 0, y: 0 });
      plane.rotation.x = 0.5;
      return items.some(it => Math.abs((hovered === it.hit ? 1.7 : 1) - it.scale) > 0.01);
    },
    pick(raycaster) {
      const hit = raycaster.intersectObjects(hits, false)[0];
      hovered = hit ? hit.object : null;
      return hit ? { label: hit.object.userData.label, href: hit.object.userData.href, point: hit.point } : null;
    },
    setTheme(dark) {
      glowBlend(corona.material, dark);
      const c = new Color(dark ? 0xffffff : 0x1c2226);
      lineMats.forEach(m => m.color.copy(c));
      beltMat.color.set(dark ? 0xb8aa98 : 0x6b6158);
    },
    setQuality() {},
    dispose() { disposeTree(r.root); },
  };
}
