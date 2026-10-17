// ─── main.js ─────────────────────────────────────────────────────────────────
// Boot: settings → UI → smooth scroll → lazy 3D. Content is static HTML;
// JS only enhances it.
import { settings } from './settings/store.js';
import { initScroll } from './scroll/index.js';
import { initPalette } from './ui/palette.js';
import { initSettingsPopover } from './ui/settings-popover.js';
import { initPhone } from './ui/phone.js';
import { initSummaryWords } from './ui/summary.js';
import { initCounter } from './ui/counter.js';
import { applyStillSizes } from './scene/fits.js';

console.log(
  '%c Kuldeep Singh \n%cBackend Engineer · GenAI & Agentic AI\n' +
  'Repo: https://github.com/Kuldeep-Singh-Naruka/portfolio-website\n' +
  'Try Ctrl+K → "sudo hire kuldeep".',
  'background:#05070d; color:#f5eee6; font-size:14px; padding:4px 12px; font-weight:bold;',
  'color:#8a93a0; font-size:12px; padding:2px 12px;'
);

const buildEl = document.getElementById('build-info');
if (buildEl) {
  const sha = __COMMIT_SHA__ || 'local';
  buildEl.textContent = `build ${sha.slice(0, 7)} · ${__BUILD_DATE__}`;
}
const yearEl = document.getElementById('footer-year');
if (yearEl) yearEl.textContent = new Date().getFullYear();

const kbdEl = document.getElementById('palette-kbd');
if (kbdEl) {
  const isMac = /Mac|iPhone|iPad/.test(navigator.platform || navigator.userAgent);
  kbdEl.textContent = isMac ? '⌘K' : 'Ctrl K';
}

const stillId = new URLSearchParams(location.search).get('still');

// ─── 3D (lazy) ───────────────────────────────────────────────────────────────
let scene = null;
let loadingScene = null;

function loadScene(scrollCtx) {
  if (scene || loadingScene) return loadingScene;
  loadingScene = import('./scene/index.js').then(({ initScene }) => {
    scene = initScene({ scrollCtx, settings });
    if (!scene) { document.documentElement.classList.add('no-webgl'); return null; }
    const r = settings.get();
    scene.setReduced(r.reduced);
    scene.setQuality(r.three === 'lite');
    scene.setTheme(r.dark);
    scene.setEnabled(r.three !== 'off');
    return scene;
  }).catch(err => {
    console.warn('3D scene failed to load:', err);
    document.documentElement.classList.add('no-webgl');
  });
  return loadingScene;
}

async function boot() {
  settings.init();
  applyStillSizes();
  initSettingsPopover();
  initPhone(['+91', '8290507041']);
  initPalette();
  initSummaryWords();
  initCounter();

  const scrollCtx = await initScroll(settings.get().reduced);

  const start = () => { if (settings.get().three !== 'off') loadScene(scrollCtx); };
  if ('requestIdleCallback' in window) requestIdleCallback(start, { timeout: 1500 });
  else setTimeout(start, 300);

  settings.subscribe(r => {
    if (r.three !== 'off' && !scene) loadScene(scrollCtx);
    if (!scene) return;
    scene.setTheme(r.dark);
    scene.setReduced(r.reduced);
    scene.setQuality(r.three === 'lite');
    scene.setEnabled(r.three !== 'off');
  });
}

// ─── Still renderer (used by scripts/render-stills.mjs) ─────────────────────
async function bootStill(id) {
  const params = new URLSearchParams(location.search);
  const dark = params.get('theme') !== 'light';
  document.documentElement.classList.add('still-mode');
  document.documentElement.classList.toggle('night', dark);
  const stage = document.createElement('div');
  stage.id = 'still-stage';
  stage.dataset.stage = '';
  stage.innerHTML = `<div class="body-slot" data-body="${id}" data-p="${params.get('p') || '0.5'}"></div>`;
  document.body.appendChild(stage);
  const { initScene } = await import('./scene/index.js');
  const s = initScene({ still: { size: 1000, root: stage } });
  s.setQuality(false);
  s.setTheme(dark);
  const settle = () => {
    s.renderNow();
    if (s.loading() > 0) return setTimeout(settle, 120);
    setTimeout(() => { s.renderNow(); s.renderNow(); window.__stillReady = true; }, 300);
  };
  settle();
}

if (stillId) bootStill(stillId);
else boot();

/* global __COMMIT_SHA__, __BUILD_DATE__ */
