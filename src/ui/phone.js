// ─── ui/phone.js ──────────────────────────────────────────────────────────────
// Click-to-reveal phone number. Assembled from parts in JS at click time.
// NEVER placed in static HTML so scrapers cannot harvest it.
// ─────────────────────────────────────────────────────────────────────────────

export function initPhone(parts) {
  const btn = document.getElementById('reveal-phone');
  const display = document.getElementById('phone-display');
  if (!btn || !display) return;

  btn.addEventListener('click', () => {
    const number = parts.join(' ');
    const link = document.createElement('a');
    link.href = `tel:${parts.join('')}`;
    link.textContent = number;
    link.className = 'ink-link';
    display.innerHTML = '';
    display.appendChild(link);
    display.style.display = 'inline';
    btn.style.display = 'none';
  });

  // Also callable from palette
  window.__revealPhone = () => btn.click();
}
