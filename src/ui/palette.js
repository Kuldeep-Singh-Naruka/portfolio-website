// ─── ui/palette.js ────────────────────────────────────────────────────────────
// Command palette (Ctrl/Cmd+K or Ctrl+K on Windows).
// Capture-phase listener beats Chrome address-bar shortcut.
// Navigation uses Lenis.scrollTo with force:true so it works even when
// Lenis is momentarily paused.
// ─────────────────────────────────────────────────────────────────────────────

const HEADER_H = 64; // px offset to clear fixed header

const COMMANDS = [
  { label: 'Go to Hero',       type: 'nav',  target: '#hero',       hint: '1' },
  { label: 'Go to Skills',     type: 'nav',  target: '#skills',     hint: '2' },
  { label: 'Go to Projects',   type: 'nav',  target: '#projects',   hint: '3' },
  { label: 'Go to Experience', type: 'nav',  target: '#experience', hint: '4' },
  { label: 'Go to Contact',    type: 'nav',  target: '#contact',    hint: '5' },
  { label: 'Open GitHub',      type: 'link', target: 'https://github.com/Kuldeep-Singh-Naruka' },
  { label: 'Open LinkedIn',    type: 'link', target: 'https://linkedin.com/in/kuldeep-singh-99b204280' },
  { label: 'Email me',         type: 'link', target: 'mailto:artateight@gmail.com' },
  { label: 'Download Resume',  type: 'action', action: 'resume' },
  { label: 'Reveal Phone',     type: 'action', action: 'phone' },
  { label: 'Toggle Night Mode',type: 'action', action: 'night' },
  { label: 'Toggle 3D Scene',  type: 'action', action: '3d' },
];

const SECRET = {
  label: 'sudo hire kuldeep',
  type: 'action',
  action: 'secret'
};

let isOpen = false;
let activeIdx = 0;
let filtered = [...COMMANDS];
let prevFocus = null;

export function initPalette() {
  const overlay = document.getElementById('palette-overlay');
  const input   = document.getElementById('palette-input');
  const results = document.getElementById('palette-results');
  const openBtn = document.getElementById('palette-open');
  if (!overlay || !input || !results) return;

  // ── Open / Close ────────────────────────────────────────────────────────
  function open() {
    if (isOpen) return;
    prevFocus = document.activeElement;
    isOpen = true;
    overlay.classList.add('open');
    overlay.removeAttribute('aria-hidden');
    input.value = '';
    activeIdx = 0;
    render(COMMANDS);
    requestAnimationFrame(() => input.focus());
  }

  function close() {
    if (!isOpen) return;
    isOpen = false;
    overlay.classList.remove('open');
    overlay.setAttribute('aria-hidden', 'true');
    // Return focus to where it was before opening
    ;(prevFocus instanceof HTMLElement ? prevFocus : openBtn)?.focus();
  }

  // ── Render ───────────────────────────────────────────────────────────────
  function buildItemHTML(cmd, i) {
    const isActive = i === activeIdx ? 'active' : '';
    let tag = 'button';
    let attrs = `type="button"`;

    if (cmd.type === 'nav') {
      tag = 'a';
      attrs = `href="${cmd.target}"`;
    } else if (cmd.type === 'link') {
      tag = 'a';
      attrs = `href="${cmd.target}" target="_blank" rel="noopener noreferrer"`;
    }

    return `
      <${tag} ${attrs} class="palette-item ${isActive}"
           role="option" data-idx="${i}" tabindex="-1"
           aria-selected="${i === activeIdx}">
        <span>${cmd.label}</span>
        ${cmd.hint ? `<span class="palette-key">${cmd.hint}</span>` : ''}
      </${tag}>
    `;
  }

  function render(cmds) {
    filtered = cmds;
    activeIdx = Math.min(Math.max(activeIdx, 0), Math.max(cmds.length - 1, 0));
    results.innerHTML = cmds.map(buildItemHTML).join('');
    scrollToActive();
  }

  function updateActiveState() {
    const items = results.querySelectorAll('.palette-item');
    items.forEach((item, i) => {
      if (i === activeIdx) {
        item.classList.add('active');
        item.setAttribute('aria-selected', 'true');
      } else {
        item.classList.remove('active');
        item.setAttribute('aria-selected', 'false');
      }
    });
    scrollToActive();
  }

  function scrollToActive() {
    const activeEl = results.querySelector('.palette-item.active');
    activeEl?.scrollIntoView({ block: 'nearest' });
  }

  function filter(q) {
    activeIdx = 0;
    if (!q.trim()) { render(COMMANDS); return; }
    if (q.trim().toLowerCase() === 'sudo hire kuldeep') { render([SECRET]); return; }
    const lo = q.toLowerCase();
    render(COMMANDS.filter(c => c.label.toLowerCase().includes(lo)));
  }

  function exec(i) {
    const cmd = filtered[i];
    if (!cmd) return;
    
    try {
      if (cmd.type === 'nav') {
        navTo(cmd.target);
      } else if (cmd.type === 'link') {
        // Handled by native <a> tag if clicked, but triggered here if via keyboard
        window.open(cmd.target, cmd.target.startsWith('mailto:') ? '_self' : '_blank', 'noopener,noreferrer');
      } else if (cmd.type === 'action') {
        if (cmd.action === 'resume') {
          const a = document.createElement('a');
          a.href = '/resume/Kuldeep_Singh_Resume.pdf';
          a.download = '';
          a.click();
        } else if (cmd.action === 'phone') {
          window.__revealPhone?.();
        } else if (cmd.action === 'night') {
          window.__toggleNight?.();
        } else if (cmd.action === '3d') {
          document.getElementById('three-toggle')?.click();
        } else if (cmd.action === 'secret') {
          celebrate();
          setTimeout(() => {
            window.location.href = 'mailto:artateight@gmail.com?subject=Let%27s%20work%20together&body=I%20found%20the%20secret%20command!';
          }, 1800);
        }
      }
    } finally {
      close();
    }
  }

  // Delegated click & hover handler
  results.addEventListener('click', (e) => {
    const item = e.target.closest('.palette-item');
    if (!item) return;
    e.preventDefault(); // Prevent native navigation since we handle it in exec()
    const idx = parseInt(item.dataset.idx, 10);
    exec(idx);
  });

  results.addEventListener('pointermove', (e) => {
    const item = e.target.closest('.palette-item');
    if (!item) return;
    const idx = parseInt(item.dataset.idx, 10);
    if (activeIdx !== idx) {
      activeIdx = idx;
      updateActiveState();
    }
  });

  // ── Keyboard (inside palette) ─────────────────────────────────────────────
  function onPaletteKey(e) {
    if (e.key === 'Escape') { e.preventDefault(); close(); return; }
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      activeIdx = Math.min(activeIdx + 1, filtered.length - 1);
      updateActiveState();
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      activeIdx = Math.max(activeIdx - 1, 0);
      updateActiveState();
    } else if (e.key === 'Enter') {
      e.preventDefault();
      exec(activeIdx);
    } else if (e.key === 'Tab') {
      // Keep focus inside the palette box
      e.preventDefault();
      activeIdx = e.shiftKey
        ? Math.max(activeIdx - 1, 0)
        : Math.min(activeIdx + 1, filtered.length - 1);
      updateActiveState();
    }
  }

  // ── Global shortcut — CAPTURE PHASE to beat Chrome address-bar Ctrl+K ────
  window.addEventListener('keydown', (e) => {
    if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') {
      e.preventDefault();
      e.stopPropagation();
      isOpen ? close() : open();
    }
  }, true); // <-- capture phase

  // ── Wire up elements ──────────────────────────────────────────────────────
  openBtn?.addEventListener('click', () => (isOpen ? close() : open()));
  overlay.addEventListener('click', (e) => { if (e.target === overlay) close(); });
  input.addEventListener('input', () => filter(input.value));
  input.addEventListener('keydown', onPaletteKey);

  // Initial render (hidden)
  render(COMMANDS);

  // Expose for tests
  window.__palette = { open, close, isOpen: () => isOpen };
}

// ── Navigation helper ─────────────────────────────────────────────────────────
function navTo(selector) {
  const el = document.querySelector(selector);
  if (!el) return;
  const lenis = window.__lenis;
  if (lenis) {
    lenis.start(); // resume if paused
    lenis.scrollTo(el, { offset: -HEADER_H, duration: 1.2, force: true });
  } else {
    el.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }
}

// ── Celebrate easter egg ──────────────────────────────────────────────────────
function celebrate() {
  const container = Object.assign(document.createElement('div'), {
    style: 'position:fixed;inset:0;z-index:9999;pointer-events:none;overflow:hidden;',
  });
  document.body.appendChild(container);
  for (let i = 0; i < 60; i++) {
    const p = document.createElement('div');
    const colors = ['#e9775c','#5b2f3b','#d9a3a8','#9fb7a3','#d9a85b','#b5a7d4'];
    p.style.cssText = `position:absolute;width:6px;height:6px;border-radius:50%;
      background:${colors[i % colors.length]};left:${Math.random()*100}%;top:-10px;
      animation:palette-fall ${1+Math.random()}s ease-out ${Math.random()*0.5}s forwards;`;
    container.appendChild(p);
  }
  if (!document.getElementById('celebrate-style')) {
    const s = document.createElement('style');
    s.id = 'celebrate-style';
    s.textContent = '@keyframes palette-fall{to{transform:translateY(100vh) rotate(720deg);opacity:0;}}';
    document.head.appendChild(s);
  }
  setTimeout(() => container.remove(), 3000);
}
