// ─── scene/index.js ──────────────────────────────────────────────────────────
// Orrery 3D scene manager. Lazy-loaded after first paint.
//
// SCROLL AS ENGINE:
//  - All animation (except drag, hover, tiny twinkle) is driven by scroll.
//  - Each object tracks a smoothed local scroll progress 'p' (0 to 1) 
//    via a critically damped spring.
// ─────────────────────────────────────────────────────────────────────────────

import {
  WebGLRenderer, Scene, PerspectiveCamera, Color, SRGBColorSpace, Vector2, Raycaster
} from 'three';

import { createSun }               from './objects/sun.js';
import { createRagCloud }          from './objects/rag-cloud.js';
import { createConstellationGraph }from './objects/constellation.js';
import { createPlanetMoons }       from './objects/planet-moons.js';
import { createRingedPlanet }      from './objects/ringed-planet.js';
import { createStrataPlanet }      from './objects/strata-planet.js';
import { createSatellite }         from './objects/satellite.js';
import { createOrbitPlanet }       from './objects/orbit-planet.js';
import { createHashRing }          from './objects/hash-ring.js';
import { createFlightRoute }       from './objects/flight-route.js';
import { createBeacon }            from './objects/beacon.js';
import { createOrreryOverview }    from './objects/orrery-overview.js';

const FACTORIES = {
  'sun':            createSun,
  'rag-cloud':      createRagCloud,
  'constellation':  createConstellationGraph,
  'planet-moons':   createPlanetMoons,
  'ringed-planet':  createRingedPlanet,
  'strata-planet':  createStrataPlanet,
  'satellite':      createSatellite,
  'orbit-planet':   createOrbitPlanet,
  'hash-ring':      createHashRing,
  'flight-route':   createFlightRoute,
  'orrery-overview':createOrreryOverview,
  'pale-dot':       createPlanetMoons,
  'beacon':         createBeacon,
  'exp-ring':       createOrreryOverview,
};

const objects = {}; // id -> { group, update, slotEl, drag, spring }
let renderer, scene, camera;
let threeOn = true;
let isRunning = true;
let pixelRatio;
let fov = 55;
const mouse2d = new Vector2();
let rafId;

// Drag state
const drag = { active: false, id: null, px: 0, py: 0 };

export function initScene(scrollCtx) {
  const canvas = document.getElementById('orrery-canvas');
  if (!canvas) return;

  try {
    const testCtx = canvas.getContext('webgl2') || canvas.getContext('webgl');
    if (!testCtx) throw new Error('no webgl');
  } catch {
    document.body.classList.add('no-webgl');
    return;
  }

  pixelRatio = Math.min(window.devicePixelRatio, 2);
  renderer = new WebGLRenderer({ canvas, alpha: true, antialias: pixelRatio < 1.5 });
  renderer.setPixelRatio(pixelRatio);
  renderer.setSize(window.innerWidth, window.innerHeight);
  renderer.setClearColor(0x000000, 0);
  renderer.outputColorSpace = SRGBColorSpace;

  scene = new Scene();
  camera = new PerspectiveCamera(fov, window.innerWidth / window.innerHeight, 0.1, 3000);
  updateCameraZ();

  document.querySelectorAll('[data-anchor]').forEach(anchorEl => {
    const id = anchorEl.dataset.anchor;
    const type = anchorEl.dataset.object;
    const factory = FACTORIES[type];
    if (!factory) return;

    const slotEl = anchorEl.closest('.skill-object-wrap, .project-object-wrap, #hero, #overview, #contact') || anchorEl.parentElement;
    const obj = factory({ ...anchorEl.dataset });
    if (!obj) return;

    scene.add(obj.group);
    
    // Critical Damped Spring for scroll progress (target p, current p, velocity v)
    const spring = { p: 0, target: 0, v: 0, omega: 18 }; 

    objects[id] = { 
      group: obj.group, 
      update: obj.update, 
      slotEl, 
      drag: { rotX: 0, rotY: 0, velX: 0, velY: 0, impulseX: 0, impulseY: 0 },
      spring
    };

    if (slotEl) wireDrag(slotEl, id);
  });

  const threeBtn = document.getElementById('three-toggle');
  threeBtn?.addEventListener('click', () => {
    threeOn = !threeOn;
    canvas.classList.toggle('hidden-3d', !threeOn);
    threeBtn.textContent = threeOn ? '3D On' : '3D Off';
    threeBtn.setAttribute('aria-pressed', String(threeOn));
    document.body.classList.toggle('three-off', !threeOn);
    if (!threeOn) showFallbacks(); else hideFallbacks();
  });

  let mouseX = 0, mouseY = 0;
  window.addEventListener('pointermove', e => {
    mouseX = (e.clientX / window.innerWidth) * 2 - 1;
    mouseY = -((e.clientY / window.innerHeight) * 2 - 1);
    mouse2d.set(mouseX, mouseY);
  }, { passive: true });

  document.addEventListener('visibilitychange', () => {
    isRunning = !document.hidden;
    if (isRunning) rafId = requestAnimationFrame(loop);
  });

  window.addEventListener('resize', onResize);

  let lastTs = performance.now();
  let settled = false;

  function loop(ts) {
    rafId = requestAnimationFrame(loop);
    if (!isRunning || !threeOn || window.__isFrozen) return;

    const dt = Math.min((ts - lastTs) * 0.001, 0.05);
    lastTs = ts;
    const t = ts * 0.001;

    const activeId = getActiveAnchorId();
    const globalVel = scrollCtx?.velocity || 0;
    
    // Global exposure for tests
    if (window.__orrery) {
      window.__orrery.settled = true;
      window.__orrery.activeId = activeId;
    }

    for (const id in objects) {
      const obj = objects[id];
      const isActive = id === activeId;
      const d = obj.drag;
      const s = obj.spring;

      // Calculate raw scroll progress for this object's slot (0 = entering bottom, 1 = exiting top)
      const rect = obj.slotEl.getBoundingClientRect();
      const h = window.innerHeight;
      const totalDist = h + rect.height;
      let rawP = 0;
      if (rect.bottom > 0 && rect.top < h) {
         rawP = 1.0 - (rect.bottom / totalDist);
      } else if (rect.bottom <= 0) {
         rawP = 1.0;
      }

      s.target = rawP;

      // Critically damped spring towards rawP
      const damping = 2 * s.omega; // critical damping
      const f = -s.omega * s.omega * (s.p - s.target) - damping * s.v;
      s.v += f * dt;
      s.p += s.v * dt;

      if (Math.abs(s.p - s.target) > 0.001 || Math.abs(s.v) > 0.001) {
        if (window.__orrery) window.__orrery.settled = false;
      }

      positionInSlot(obj, rect);

      // Drag inertia
      d.rotX += d.velX * dt;
      d.rotY += d.velY * dt;
      d.velX *= 0.88; 
      d.velY *= 0.88;

      if (!drag.active || drag.id !== id) {
        d.rotX *= 0.95; 
        d.rotY *= 0.95;
      }
      
      // Scroll impulse (velocity adds temporary spin)
      // Decay impulse rapidly
      d.impulseX *= 0.9;
      d.impulseY *= 0.9;
      if (isActive && Math.abs(globalVel) > 0) {
        d.impulseY = Math.max(Math.min(globalVel * 0.005, 0.5), -0.5);
      }

      const tiltX = mouseY * 0.1 + d.rotX + d.impulseX;
      const tiltY = mouseX * 0.1 + d.rotY + d.impulseY;

      if (obj.update && obj.group.visible) {
        obj.update({ t, dt, p: s.p, isActive, mouseNDC: { x: mouseX, y: mouseY }, tiltX, tiltY });
      }
      
      if (isActive && window.__orrery) {
        window.__orrery.progress = s.p;
        window.__orrery.rotation = { x: tiltX, y: tiltY };
      }
    }

    renderer.render(scene, camera);
  }
  
  window.__orrery = { settled: false, activeId: null, progress: 0, rotation: {x:0, y:0} };
  window.__sceneObjects = objects; // For fallback renderer

  // Allow fallback renderer to force active
  window.addEventListener('forceRenderObj', (e) => {
    window.__isFrozen = true;
    const id = e.detail;
    window.__orrery.activeId = id;
    for (const key in objects) {
       objects[key].group.visible = (key === id);
       objects[key].spring.p = 0.5;
       if (objects[key].group.visible) {
         objects[key].group.position.set(0, 0, 0); // Center
         objects[key].group.scale.setScalar(1.5);
         if (objects[key].update) {
           for (let i = 0; i < 100; i++) {
             objects[key].update({ t: 1.0, dt: 0.016, p: 0.5, isActive: true, mouseNDC: {x:0, y:0}, tiltX: 0, tiltY: 0 });
           }
         }
       }
    }
    renderer.render(scene, camera);
  });

  rafId = requestAnimationFrame(loop);
}

function positionInSlot(obj, rect) {
  if (rect.bottom < -window.innerHeight * 2 || rect.top > window.innerHeight * 3) {
    obj.group.visible = false;
    return;
  }
  obj.group.visible = true;
  if (rect.width === 0 || rect.height === 0) return;

  const cx = rect.left + rect.width / 2;
  const cy = rect.top  + rect.height / 2;

  const camDist = camera.position.z;
  const fovRad = fov * (Math.PI / 180);
  const halfH = Math.tan(fovRad / 2) * camDist;
  const halfW = halfH * camera.aspect;

  const worldX =  ((cx / window.innerWidth)  * 2 - 1) * halfW;
  const worldY = -((cy / window.innerHeight) * 2 - 1) * halfH;

  const slotSize = Math.min(rect.width, rect.height) * 0.75;
  const pxPerUnit = halfH / (window.innerHeight / 2);
  const worldSize = slotSize * pxPerUnit;

  const objectRadius = 100;
  const scale = worldSize / (objectRadius * 2);

  obj.group.position.set(worldX, worldY, 0);
  obj.group.scale.setScalar(Math.max(scale, 0.001));
}

function getActiveAnchorId() {
  const vcy = window.innerHeight / 2;
  const vcx = window.innerWidth  / 2;
  let closestId = null, closestDist = Infinity;

  document.querySelectorAll('[data-anchor]').forEach(el => {
    const rect = el.getBoundingClientRect();
    const ex = rect.left + rect.width  / 2;
    const ey = rect.top  + rect.height / 2;
    const dist = Math.hypot(ex - vcx, ey - vcy);
    if (dist < closestDist) { closestDist = dist; closestId = el.dataset.anchor; }
  });
  return closestId;
}

function wireDrag(slotEl, id) {
  slotEl.style.cursor = 'grab';
  slotEl.setAttribute('tabindex', '0');
  slotEl.setAttribute('aria-label', 'Interactive 3D model. Drag to rotate.');

  slotEl.addEventListener('pointerdown', e => {
    if (e.button !== undefined && e.button !== 0) return;
    if (e.pointerType === 'mouse') e.preventDefault(); // allow touch scroll
    slotEl.style.cursor = 'grabbing';
    slotEl.setPointerCapture(e.pointerId);
    drag.active = true;
    drag.id = id;
    drag.px = e.clientX;
    drag.py = e.clientY;
    objects[id].drag.velX = 0;
    objects[id].drag.velY = 0;
  });

  slotEl.addEventListener('pointermove', e => {
    if (!drag.active || drag.id !== id) return;
    const dx = e.clientX - drag.px;
    const dy = e.clientY - drag.py;
    drag.px = e.clientX;
    drag.py = e.clientY;
    objects[id].drag.velX += dy * 0.005;
    objects[id].drag.velY += dx * 0.005;
  });

  const endDrag = () => {
    if (drag.id !== id) return;
    drag.active = false;
    drag.id = null;
    slotEl.style.cursor = 'grab';
  };
  slotEl.addEventListener('pointerup', endDrag);
  slotEl.addEventListener('pointercancel', endDrag);

  slotEl.addEventListener('keydown', e => {
    const d = objects[id]?.drag;
    if (!d) return;
    const step = 0.04;
    if (e.key === 'ArrowLeft')  { d.velY -= step; e.preventDefault(); }
    if (e.key === 'ArrowRight') { d.velY += step; e.preventDefault(); }
    if (e.key === 'ArrowUp')    { d.velX -= step; e.preventDefault(); }
    if (e.key === 'ArrowDown')  { d.velX += step; e.preventDefault(); }
  });
}

function onResize() {
  if (!renderer || !camera) return;
  camera.aspect = window.innerWidth / window.innerHeight;
  updateCameraZ();
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
}

function updateCameraZ() {
  const halfHpx = window.innerHeight / 2;
  camera.position.z = halfHpx / Math.tan((fov / 2) * (Math.PI / 180));
}

function showFallbacks() { document.querySelectorAll('.object-fallback').forEach(el => el.classList.add('visible')); }
function hideFallbacks() { document.querySelectorAll('.object-fallback').forEach(el => el.classList.remove('visible')); }
