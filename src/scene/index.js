// ─── scene/index.js ──────────────────────────────────────────────────────────
// Orrery 3D scene manager. Lazy-loaded after first paint.
// Anchor-based object placement: each object lives in a DOM slot.
// ─────────────────────────────────────────────────────────────────────────────

import {
  WebGLRenderer,
  Scene,
  PerspectiveCamera,
  Vector3,
  Color,
  SRGBColorSpace,
} from 'three';

import { createSun } from './objects/sun.js';
import { createConstellationGraph } from './objects/constellation.js';
import { createRagCloud } from './objects/rag-cloud.js';
import { createPlanetMoons } from './objects/planet-moons.js';
import { createRingedPlanet } from './objects/ringed-planet.js';
import { createStrataPlanet } from './objects/strata-planet.js';
import { createSatellite } from './objects/satellite.js';
import { createOrbitPlanet } from './objects/orbit-planet.js';
import { createHashRing } from './objects/hash-ring.js';
import { createFlightRoute } from './objects/flight-route.js';
import { createBeacon } from './objects/beacon.js';
import { createOrreryOverview } from './objects/orrery-overview.js';

// Map data-object values to factory functions
const OBJECT_FACTORIES = {
  'sun': createSun,
  'rag-cloud': createRagCloud,
  'constellation': createConstellationGraph,
  'planet-moons': createPlanetMoons,
  'ringed-planet': createRingedPlanet,
  'strata-planet': createStrataPlanet,
  'satellite': createSatellite,
  'orbit-planet': createOrbitPlanet,
  'hash-ring': createHashRing,
  'flight-route': createFlightRoute,
  'orrery-overview': createOrreryOverview,
  'exp-ring': null, // Will share with orrery overview
  'pale-dot': createPlanetMoons, // Reuse simple planet for education
  'beacon': createBeacon,
};

let renderer, scene, camera;
let objects = {}; // anchor id -> { mesh, update }
let activeAnchorId = null;
let mouseNDC = { x: 0, y: 0 };
let frameId;
let isRunning = true;
let fps = 60;
let fpsDropCount = 0;
let pixelRatio;
let threeOn = true;

export function initScene(scrollCtx) {
  const canvas = document.getElementById('orrery-canvas');
  if (!canvas) return;

  // WebGL check
  try {
    const ctx = canvas.getContext('webgl2') || canvas.getContext('webgl');
    if (!ctx) throw new Error('No WebGL');
  } catch {
    document.body.classList.add('no-webgl');
    showFallbacks();
    return;
  }

  // Renderer
  pixelRatio = Math.min(window.devicePixelRatio, 2);
  renderer = new WebGLRenderer({ canvas, alpha: true, antialias: true });
  renderer.setPixelRatio(pixelRatio);
  renderer.setSize(window.innerWidth, window.innerHeight);
  renderer.setClearColor(0x000000, 0);
  // sRGB output for colour accuracy
  renderer.outputColorSpace = SRGBColorSpace;

  // Scene
  scene = new Scene();

  // Camera: orthographic-like perspective — 1 unit ≈ 1px at z=0
  const fov = 60;
  const near = 0.1;
  const far = 2000;
  camera = new PerspectiveCamera(fov, window.innerWidth / window.innerHeight, near, far);
  // Place camera so viewport height ≈ world height
  const dist = (window.innerHeight / 2) / Math.tan((fov / 2) * (Math.PI / 180));
  camera.position.z = dist;

  // Build all anchor objects
  const anchors = document.querySelectorAll('[data-anchor]');
  anchors.forEach(anchor => {
    const id = anchor.dataset.anchor;
    const type = anchor.dataset.object;
    const factory = OBJECT_FACTORIES[type];
    if (!factory) return;

    // Extra data from HTML attributes
    const extraData = { ...anchor.dataset };

    const obj = factory(extraData);
    if (!obj) return;

    obj.group.userData.anchorId = id;
    obj.group.userData.anchorEl = anchor;
    scene.add(obj.group);
    objects[id] = obj;
  });

  // 3D toggle button
  const threeBtn = document.getElementById('three-toggle');
  threeBtn?.addEventListener('click', () => {
    threeOn = !threeOn;
    canvas.classList.toggle('hidden-3d', !threeOn);
    threeBtn.textContent = threeOn ? '3D On' : '3D Off';
    threeBtn.setAttribute('aria-pressed', String(threeOn));
    document.body.classList.toggle('three-off', !threeOn);
  });

  // Pointer for parallax
  window.addEventListener('pointermove', (e) => {
    mouseNDC.x = (e.clientX / window.innerWidth) * 2 - 1;
    mouseNDC.y = -((e.clientY / window.innerHeight) * 2 - 1);
  }, { passive: true });

  // Visibility API (pause when tab hidden)
  document.addEventListener('visibilitychange', () => {
    isRunning = !document.hidden;
    if (isRunning) frameId = requestAnimationFrame(loop);
  });

  // Resize
  window.addEventListener('resize', onResize);

  // Start loop
  let lastTime = performance.now();
  function loop(ts) {
    frameId = requestAnimationFrame(loop);
    if (!isRunning || !threeOn) return;

    const dt = Math.min((ts - lastTime) / 1000, 0.05);
    lastTime = ts;

    // FPS monitoring for adaptive quality
    const currentFps = 1 / dt;
    fps = fps * 0.9 + currentFps * 0.1;
    if (fps < 40) {
      fpsDropCount++;
      if (fpsDropCount > 120) adaptQuality();
    } else {
      fpsDropCount = 0;
    }

    // Determine which anchor is in viewport center
    updateActiveAnchor();

    // Update all objects
    const t = ts * 0.001;
    const velocity = Math.abs(scrollCtx.velocity || 0);
    for (const id in objects) {
      const obj = objects[id];
      const isActive = id === activeAnchorId;
      const isNeighbour = false; // for now all render; optimise later

      if (obj.update) {
        obj.update({ t, dt, isActive, mouseNDC, velocity });
      }

      // Position object at anchor
      positionAtAnchor(obj, id);
    }

    renderer.render(scene, camera);
  }

  frameId = requestAnimationFrame(loop);
}

function updateActiveAnchor() {
  const cx = window.innerWidth / 2;
  const cy = window.innerHeight / 2;

  let closestId = null;
  let closestDist = Infinity;

  document.querySelectorAll('[data-anchor]').forEach(el => {
    const rect = el.getBoundingClientRect();
    const ex = rect.left + rect.width / 2;
    const ey = rect.top + rect.height / 2;
    const dist = Math.hypot(ex - cx, ey - cy);
    if (dist < closestDist) {
      closestDist = dist;
      closestId = el.dataset.anchor;
    }
  });

  activeAnchorId = closestId;
}

function positionAtAnchor(obj, id) {
  const anchor = document.querySelector(`[data-anchor="${id}"]`);
  if (!anchor) return;

  const rect = anchor.getBoundingClientRect();
  if (rect.width === 0 || rect.height === 0) return;

  // Map screen rect centre to world position
  const cx = rect.left + rect.width / 2;
  const cy = rect.top + rect.height / 2;

  // At camera.position.z, one world unit = one CSS pixel
  // (because dist = height/2/tan(fov/2), so unit = 1)
  const worldX = cx - window.innerWidth / 2;
  const worldY = -(cy - window.innerHeight / 2);

  // Scale by rect size
  const scale = Math.min(rect.width, rect.height) / 200; // 200px = 1 world unit

  obj.group.position.set(worldX, worldY, 0);
  obj.group.scale.setScalar(scale);
}

function onResize() {
  if (!renderer || !camera) return;
  const w = window.innerWidth;
  const h = window.innerHeight;
  camera.aspect = w / h;
  const fov = 60;
  const dist = (h / 2) / Math.tan((fov / 2) * (Math.PI / 180));
  camera.position.z = dist;
  camera.updateProjectionMatrix();
  renderer.setSize(w, h);
}

function adaptQuality() {
  // Drop pixel ratio first, then disable effects
  if (pixelRatio > 1) {
    pixelRatio = 1;
    renderer.setPixelRatio(1);
    fpsDropCount = 0;
    return;
  }
  // Further degradation: signal objects to disable grain
  document.body.classList.add('low-perf');
}

function showFallbacks() {
  document.querySelectorAll('.object-fallback').forEach(el => el.classList.add('visible'));
}
