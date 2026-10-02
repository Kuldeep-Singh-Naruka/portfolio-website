// ─── ui/night.js ──────────────────────────────────────────────────────────────
// Day/Night mode toggle with localStorage persistence.
// ─────────────────────────────────────────────────────────────────────────────

export function initNightMode() {
  const btn = document.getElementById('night-toggle');
  if (!btn) return;

  const stored = localStorage.getItem('orrery-night');
  const prefersNight = window.matchMedia('(prefers-color-scheme: dark)').matches;
  const isNight = stored !== null ? stored === '1' : prefersNight;

  if (isNight) enable(btn);

  btn.addEventListener('click', () => {
    if (document.body.classList.contains('night')) {
      disable(btn);
    } else {
      enable(btn);
    }
  });

  // Also usable from palette
  window.__toggleNight = () => btn.click();
}

function enable(btn) {
  document.body.classList.add('night');
  btn.textContent = 'Night';
  btn.setAttribute('aria-pressed', 'true');
  localStorage.setItem('orrery-night', '1');
}

function disable(btn) {
  document.body.classList.remove('night');
  btn.textContent = 'Day';
  btn.setAttribute('aria-pressed', 'false');
  localStorage.setItem('orrery-night', '0');
}
