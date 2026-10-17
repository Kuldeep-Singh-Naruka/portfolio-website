// ─── Header settings popover ─────────────────────────────────────────────────
import { settings } from '../settings/store.js';

export function initSettingsPopover() {
  const btn = document.getElementById('settings-open');
  const panel = document.getElementById('settings-panel');
  if (!btn || !panel) return;

  const open = () => {
    panel.hidden = false;
    btn.setAttribute('aria-expanded', 'true');
    requestAnimationFrame(() => panel.classList.add('open'));
    panel.querySelector('[aria-pressed="true"]')?.focus();
  };
  const close = (focusBtn = false) => {
    panel.classList.remove('open');
    btn.setAttribute('aria-expanded', 'false');
    setTimeout(() => { if (btn.getAttribute('aria-expanded') === 'false') panel.hidden = true; }, 180);
    if (focusBtn) btn.focus();
  };

  btn.addEventListener('click', e => {
    e.stopPropagation();
    panel.hidden ? open() : close();
  });
  document.addEventListener('click', e => {
    if (!panel.hidden && !panel.contains(e.target) && e.target !== btn) close();
  });
  panel.addEventListener('keydown', e => { if (e.key === 'Escape') { e.preventDefault(); close(true); } });

  panel.addEventListener('click', e => {
    const b = e.target.closest('[data-set]');
    if (!b) return;
    settings.set(b.dataset.set, b.dataset.val);
  });

  const sync = r => {
    const current = { theme: r.theme, three: r.threeSetting === 'auto' ? r.three : r.threeSetting, motion: r.motion };
    panel.querySelectorAll('[data-set]').forEach(b => {
      b.setAttribute('aria-pressed', String(current[b.dataset.set] === b.dataset.val));
    });
    const note = panel.querySelector('#three-auto-note');
    if (note) note.hidden = r.threeSetting !== 'auto';
  };
  settings.subscribe(sync);
  sync(settings.get());
}
