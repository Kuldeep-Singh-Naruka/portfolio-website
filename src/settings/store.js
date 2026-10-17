// ─── Settings store: theme · 3D · motion ─────────────────────────────────────
// Persisted under one localStorage key. The same logic runs as a tiny inline
// script in <head> so the right classes are on <html> before first paint.
const KEY = 'space-settings';
const mqDark = matchMedia('(prefers-color-scheme: dark)');
const mqReduce = matchMedia('(prefers-reduced-motion: reduce)');

function read() {
  try { return JSON.parse(localStorage.getItem(KEY)) || {}; } catch { return {}; }
}
function write(v) {
  try { localStorage.setItem(KEY, JSON.stringify(v)); } catch { /* private mode */ }
}

function autoThree() {
  const low = (navigator.hardwareConcurrency || 8) <= 4 || (navigator.deviceMemory || 8) <= 4 ||
    navigator.connection?.saveData || innerWidth < 768;
  return low ? 'lite' : 'full';
}

let raw = read();
let downgraded = false;
const subs = new Set();

export function resolved() {
  const theme = raw.theme || 'auto';
  const dark = theme === 'dark' || (theme === 'auto' && mqDark.matches);
  let three = raw.three || autoThree();
  if (!raw.three && downgraded) three = 'lite';
  const reduced = raw.motion ? raw.motion === 'reduced' : mqReduce.matches;
  return { theme, dark, three, threeSetting: raw.three || 'auto', reduced, motion: reduced ? 'reduced' : 'full' };
}

function apply() {
  const r = resolved();
  const h = document.documentElement;
  h.classList.toggle('night', r.dark);
  h.classList.toggle('three-off', r.three === 'off');
  h.classList.toggle('three-lite', r.three === 'lite');
  h.classList.toggle('reduced-motion', r.reduced);
  h.dataset.theme = r.dark ? 'dark' : 'light';
  h.dataset.three = r.three;
  h.style.colorScheme = r.dark ? 'dark' : 'light';
  subs.forEach(fn => fn(r));
}

export const settings = {
  get: resolved,
  set(key, value) {
    raw = { ...raw, [key]: value };
    if (key === 'theme' && value === 'auto') delete raw.theme;
    write(raw);
    apply();
  },
  cycleTheme() { this.set('theme', resolved().dark ? 'light' : 'dark'); },
  subscribe(fn) { subs.add(fn); return () => subs.delete(fn); },
  isAuto3D: () => !raw.three,
  autoDowngrade() { if (!downgraded) { downgraded = true; apply(); } },
  init() {
    mqDark.addEventListener('change', apply);
    mqReduce.addEventListener('change', apply);
    apply();
  },
};
