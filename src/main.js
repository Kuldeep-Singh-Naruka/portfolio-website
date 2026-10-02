// ─── main.js ─────────────────────────────────────────────────────────────────
// Orrery portfolio boot. Loads Lenis, GSAP, then lazy-loads Three.js.
// Content is already in static HTML — JS only enhances.
// ─────────────────────────────────────────────────────────────────────────────

import { initScroll } from './scroll/index.js';
import { initPalette } from './ui/palette.js';
import { initNightMode } from './ui/night.js';
import { initPhone } from './ui/phone.js';
import { initSummaryWords } from './ui/summary.js';
import { initCounter } from './ui/counter.js';

// ─── Console greeting ────────────────────────────────────────────────────────
console.log(
  '%c Kuldeep Singh \n%cBackend Engineer · GenAI & Agentic AI\n' +
  'Repo: https://github.com/Kuldeep-Singh-Naruka/portfolio-website\n' +
  'Built by hand. If you\'re reading this, let\'s talk.',
  'background:#5b2f3b; color:#f5eee6; font-size:14px; padding:4px 12px; font-weight:bold;',
  'color:#4a5156; font-size:12px; padding:2px 12px;'
);

// ─── Build info in footer ─────────────────────────────────────────────────────
const buildEl = document.getElementById('build-info');
if (buildEl) {
  const sha = __COMMIT_SHA__ || 'local';
  const date = __BUILD_DATE__ || new Date().toISOString().slice(0, 10);
  buildEl.textContent = `build ${sha.slice(0, 7)} · ${date}`;
}

const yearEl = document.getElementById('footer-year');
if (yearEl) yearEl.textContent = new Date().getFullYear();

// ─── Platform-specific kbd label ─────────────────────────────────────────────
const kbdEl = document.getElementById('palette-kbd');
if (kbdEl) {
  const isMac = navigator.platform.toUpperCase().includes('MAC') || navigator.userAgent.includes('Mac OS');
  kbdEl.textContent = isMac ? '⌘K' : 'Ctrl K';
}

// ─── Feature flags ────────────────────────────────────────────────────────────
const prefersReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

// ─── Boot ─────────────────────────────────────────────────────────────────────
async function boot() {
  // Night mode first (applies class synchronously to avoid flash)
  initNightMode();

  // Phone reveal
  initPhone(['+91', '8290507041']);

  // Command palette
  initPalette();

  // Summary scroll word scrub
  initSummaryWords();

  // Slide counter
  initCounter();

  // Init smooth scroll + scroll animations
  const scrollCtx = await initScroll(prefersReduced);

  // Lazy-load 3D scene after first paint
  if (!prefersReduced) {
    requestIdleCallback(() => {
      import('./scene/index.js').then(({ initScene }) => {
        initScene(scrollCtx);
      }).catch(err => {
        console.warn('3D scene failed to load:', err);
        document.body.classList.add('no-webgl');
      });
    }, { timeout: 2000 });
  } else {
    document.body.classList.add('no-webgl');
    document.getElementById('orrery-canvas')?.classList.add('hidden-3d');
    document.getElementById('three-toggle')?.setAttribute('aria-pressed', 'false');
  }
}

boot();

// ─── Globals for Vite define ──────────────────────────────────────────────────
/* global __COMMIT_SHA__, __BUILD_DATE__ */
