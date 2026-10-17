// ─── scene/index.js ──────────────────────────────────────────────────────────
// Renderer, camera, lights, sky, meteors and the render-on-demand loop.
// Nothing animates on a clock: a frame is drawn only when scroll, pointer,
// resize, a setting, a texture load or a user-triggered effect asks for one.
import {
  WebGLRenderer, Scene, PerspectiveCamera, SRGBColorSpace, AmbientLight,
  DirectionalLight, Vector3,
} from 'three';
import { createSky } from './sky/sky.js';
import { createMeteors } from './sky/meteors.js';
import { createDirector } from './director.js';
import { initAssets, tex, envMap, loadingCount } from './lib/assets.js';

const FOV = 30;
const NIGHT_BG = 0x05070d;

export function initScene({ scrollCtx, settings, still = null }) {
  const canvas = document.getElementById('space-canvas');
  if (!canvas) return null;

  let renderer;
  try {
    renderer = new WebGLRenderer({ canvas, alpha: true, antialias: true, powerPreference: 'high-performance', preserveDrawingBuffer: !!still });
  } catch {
    document.documentElement.classList.add('no-webgl');
    return null;
  }
  renderer.outputColorSpace = SRGBColorSpace;

  const scene = new Scene();
  const camera = new PerspectiveCamera(FOV, 1, 1, 50000);
  const lightDir = new Vector3(-0.6, 0.45, 0.65).normalize();
  const ambient = new AmbientLight(0xffffff, 0.06);
  const key = new DirectionalLight(0xfff4e6, 3.0);
  scene.add(ambient, key, key.target);

  let raf = 0;
  let enabled = true;
  const request = () => { if (!raf && enabled) raf = requestAnimationFrame(frame); };
  initAssets(renderer, request);

  const ctx = { tex, envMap, lightDir, request };
  const sky = createSky();
  const meteors = createMeteors();
  if (!still) scene.add(sky.group, meteors.group);

  const director = createDirector({ scene, camera, ctx, request, stillMode: !!still, root: still?.root || document });

  // ── State ───────────────────────────────────────────────────────────────
  let dark = true, lite = false, reduced = false;
  let dpr = 1;
  const pointer = { x: 0, y: 0 }, pointerT = { x: 0, y: 0 };
  let last = performance.now();
  let lastScroll = -1;
  const frameTimes = [];

  function size() {
    const W = still ? still.size : innerWidth;
    const H = still ? still.size : innerHeight;
    dpr = still ? 1 : Math.min(devicePixelRatio || 1, lite ? 1.25 : 2);
    renderer.setPixelRatio(dpr);
    renderer.setSize(W, H, !still);
    camera.aspect = W / H;
    camera.position.set(0, 0, (H / 2) / Math.tan((FOV / 2) * Math.PI / 180));
    camera.far = camera.position.z * 20;
    camera.updateProjectionMatrix();
    request();
  }

  function applyTheme(isDark) {
    dark = isDark;
    if (still) renderer.setClearColor(0x000000, 0);
    else renderer.setClearColor(NIGHT_BG, isDark ? 1 : 0);
    ambient.intensity = isDark ? 0.07 : 0.95;
    key.intensity = isDark ? 3.1 : 2.3;
    sky.setTheme(isDark);
    meteors.setTheme(isDark);
    director.setTheme(isDark);
    request();
  }

  function applyQuality(isLite) {
    lite = isLite;
    sky.setQuality(isLite);
    director.setQuality(isLite);
    meteors.setEnabled(!isLite && !reduced);
    size();
  }

  function applyReduced(v) {
    reduced = v;
    director.setReduced(v);
    meteors.setEnabled(!lite && !v);
    request();
  }

  // ── Loop ────────────────────────────────────────────────────────────────
  function frame(now) {
    raf = 0;
    if (!enabled) return;
    const dt = Math.min((now - last) / 1000, 0.05);
    last = now;
    const t0 = performance.now();

    pointer.x += (pointerT.x - pointer.x) * Math.min(1, dt * 5);
    pointer.y += (pointerT.y - pointer.y) * Math.min(1, dt * 5);
    let busy = Math.abs(pointerT.x - pointer.x) + Math.abs(pointerT.y - pointer.y) > 0.002;

    const scrollY = still ? 0 : window.scrollY;
    if (!still) {
      sky.update({ scrollY, vh: innerHeight, pointer, dpr, aspect: innerWidth / innerHeight });
      const v = Math.abs(scrollCtx?.velocity || 0);
      if (v > 2600 && !lite && !reduced) meteors.randomSpawn(innerWidth, innerHeight);
      if (meteors.update(dt)) busy = true;
    }
    if (director.update({ dt, scrollY, pointer, dpr })) busy = true;
    key.position.copy(lightDir).multiplyScalar(1000);

    renderer.render(scene, camera);

    // adaptive quality: if the GPU struggles while scrolling, drop to Lite
    if (!still && scrollY !== lastScroll) {
      frameTimes.push(performance.now() - t0 + (dt * 1000 > 40 ? dt * 1000 : 0));
      if (frameTimes.length > 90) frameTimes.shift();
      if (frameTimes.length === 90 && !lite && settings?.isAuto3D()) {
        const avg = frameTimes.reduce((a, b) => a + b, 0) / 90;
        if (avg > 38) settings.autoDowngrade();
      }
    }
    lastScroll = scrollY;
    if (busy || loadingCount() > 0) request();
  }

  // ── Events ──────────────────────────────────────────────────────────────
  if (!still) {
    window.addEventListener('resize', size);
    window.addEventListener('pointermove', e => {
      pointerT.x = (e.clientX / innerWidth) * 2 - 1;
      pointerT.y = -((e.clientY / innerHeight) * 2 - 1);
      request();
    }, { passive: true });
    scrollCtx?.lenis?.on('scroll', request);
    window.addEventListener('scroll', request, { passive: true });
    document.addEventListener('visibilitychange', () => { if (!document.hidden) request(); });

    // click empty space → a meteor streaks through the click point
    document.addEventListener('click', e => {
      if (!enabled || lite || reduced) return;
      if (e.target.closest('a, button, input, label, [role="dialog"], .body-slot, header, li, p, h1, h2, h3')) return;
      if (String(window.getSelection?.() || '').length) return;
      if (meteors.spawnAt(innerWidth, innerHeight, e.clientX, e.clientY)) request();
    });
  }

  size();

  const api = {
    setTheme: applyTheme,
    setQuality: applyQuality,
    setReduced: applyReduced,
    setEnabled(v) {
      enabled = v;
      canvas.classList.toggle('off', !v);
      if (v) { last = performance.now(); request(); }
    },
    renderNow: () => { last = performance.now(); frame(performance.now()); },
    loading: loadingCount,
  };
  return api;
}
