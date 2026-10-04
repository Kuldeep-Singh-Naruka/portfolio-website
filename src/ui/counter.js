// ─── ui/counter.js ────────────────────────────────────────────────────────────
// Slide counter pill (fixed bottom-right) showing current skill slide.
// ─────────────────────────────────────────────────────────────────────────────

import { ScrollTrigger } from 'gsap/ScrollTrigger';

export function initCounter() {
  const el = document.getElementById('slide-counter');
  if (!el) return;

  const slides = document.querySelectorAll('.skill-slide[data-slide-index]');
  if (!slides.length) return;

  slides.forEach((slide) => {
    const idx = slide.dataset.slideIndex;
    const total = slide.dataset.slideTotal;

    ScrollTrigger.create({
      trigger: slide,
      start: 'top 55%',
      end: 'bottom 45%',
      onEnter: () => updateCounter(el, idx, total),
      onEnterBack: () => updateCounter(el, idx, total),
      onLeave: () => {
        // Check if we've left all slides
        const allLeave = [...slides].every(s => {
          const st = ScrollTrigger.getById(`slide-${s.dataset.slideIndex}`);
          return !st?.isActive;
        });
        if (allLeave) el.classList.remove('visible');
      },
    });
  });
}

function updateCounter(el, idx, total) {
  el.textContent = `${idx}/${total}`;
  el.classList.add('visible');
}
