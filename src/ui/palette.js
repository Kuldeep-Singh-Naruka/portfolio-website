// ─── ui/palette.js ────────────────────────────────────────────────────────────
// Command palette (Ctrl/Cmd+K). Fully keyboard-accessible.
// Includes "sudo hire kuldeep" easter egg.
// ─────────────────────────────────────────────────────────────────────────────

const COMMANDS = [
  { label: 'Go to Hero', action: () => scrollTo('#hero'), hint: '1' },
  { label: 'Go to Skills', action: () => scrollTo('#skills'), hint: '2' },
  { label: 'Go to Projects', action: () => scrollTo('#projects'), hint: '3' },
  { label: 'Go to Experience', action: () => scrollTo('#experience'), hint: '4' },
  { label: 'Go to Contact', action: () => scrollTo('#contact'), hint: '5' },
  { label: 'Open GitHub', action: () => window.open('https://github.com/Kuldeep-Singh-Naruka', '_blank') },
  { label: 'Open LinkedIn', action: () => window.open('https://linkedin.com/in/kuldeep-singh-99b204280', '_blank') },
  { label: 'Send Email', action: () => { window.location.href = 'mailto:artateight@gmail.com'; } },
  { label: 'Download Resume', action: () => { const a = document.createElement('a'); a.href = '/resume/Kuldeep_Singh_Resume.pdf'; a.download = ''; a.click(); } },
  { label: 'Reveal Phone', action: () => window.__revealPhone?.() },
  { label: 'Toggle Night Mode', action: () => window.__toggleNight?.() },
  { label: 'Toggle 3D Scene', action: () => document.getElementById('three-toggle')?.click() },
];

const SECRET = {
  label: 'sudo hire kuldeep',
  action: () => {
    celebrate();
    setTimeout(() => {
      window.location.href = 'mailto:artateight@gmail.com?subject=Let%27s%20work%20together&body=I%20found%20the%20secret%20command!';
    }, 1800);
  },
};

let isOpen = false;
let activeIdx = 0;
let filtered = [...COMMANDS];

export function initPalette() {
  const overlay = document.getElementById('palette-overlay');
  const input = document.getElementById('palette-input');
  const results = document.getElementById('palette-results');
  const openBtn = document.getElementById('palette-open');
  if (!overlay || !input || !results) return;

  function open() {
    isOpen = true;
    overlay.classList.add('open');
    overlay.removeAttribute('aria-hidden');
    input.value = '';
    activeIdx = 0;
    render(COMMANDS);
    requestAnimationFrame(() => input.focus());
    document.addEventListener('keydown', onKey);
  }

  function close() {
    isOpen = false;
    overlay.classList.remove('open');
    overlay.setAttribute('aria-hidden', 'true');
    document.removeEventListener('keydown', onKey);
    openBtn?.focus();
  }

  function render(cmds) {
    filtered = cmds;
    activeIdx = Math.min(activeIdx, cmds.length - 1);
    results.innerHTML = cmds.map((cmd, i) => `
      <div class="palette-item ${i === activeIdx ? 'active' : ''}"
           role="option" data-idx="${i}" tabindex="-1"
           aria-selected="${i === activeIdx}">
        <span>${cmd.label}</span>
        ${cmd.hint ? `<span class="palette-key">${cmd.hint}</span>` : ''}
      </div>
    `).join('');

    results.querySelectorAll('.palette-item').forEach(item => {
      item.addEventListener('click', () => {
        const i = parseInt(item.dataset.idx, 10);
        exec(i);
      });
      item.addEventListener('mouseenter', () => {
        activeIdx = parseInt(item.dataset.idx, 10);
        render(filtered);
      });
    });
  }

  function filter(q) {
    if (!q.trim()) return render(COMMANDS);
    if (q.trim() === 'sudo hire kuldeep') return render([SECRET]);
    const lo = q.toLowerCase();
    render(COMMANDS.filter(c => c.label.toLowerCase().includes(lo)));
  }

  function exec(i) {
    const cmd = filtered[i];
    if (cmd) { close(); cmd.action(); }
  }

  function onKey(e) {
    if (e.key === 'Escape') { close(); return; }
    if (e.key === 'ArrowDown') { e.preventDefault(); activeIdx = Math.min(activeIdx + 1, filtered.length - 1); render(filtered); }
    if (e.key === 'ArrowUp') { e.preventDefault(); activeIdx = Math.max(activeIdx - 1, 0); render(filtered); }
    if (e.key === 'Enter') { e.preventDefault(); exec(activeIdx); }
  }

  // Global toggle shortcut
  document.addEventListener('keydown', (e) => {
    if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
      e.preventDefault();
      isOpen ? close() : open();
    }
  });

  openBtn?.addEventListener('click', open);
  overlay.addEventListener('click', (e) => { if (e.target === overlay) close(); });
  input.addEventListener('input', () => filter(input.value));

  render(COMMANDS);
}

function scrollTo(selector) {
  const el = document.querySelector(selector);
  el?.scrollIntoView({ behavior: 'smooth', block: 'start' });
}

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
      animation:fall ${1+Math.random()}s ease-out ${Math.random()*0.5}s forwards;`;
    container.appendChild(p);
  }

  if (!document.getElementById('celebrate-style')) {
    const s = document.createElement('style');
    s.id = 'celebrate-style';
    s.textContent = '@keyframes fall{to{transform:translateY(100vh) rotate(720deg);opacity:0;}}';
    document.head.appendChild(s);
  }

  setTimeout(() => container.remove(), 3000);
}
