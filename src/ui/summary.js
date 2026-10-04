// ─── ui/summary.js ────────────────────────────────────────────────────────────
// Scrubs summary paragraph words from pale to ink as user scrolls through.
// Words are wrapped in spans by JS; content remains accessible as-is without JS.
// ─────────────────────────────────────────────────────────────────────────────

import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

gsap.registerPlugin(ScrollTrigger);

export function initSummaryWords() {
  const para = document.getElementById('summary-para');
  if (!para) return;

  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

  // Split into words, keeping content accessible
  const originalText = para.textContent;
  para.setAttribute('aria-label', originalText);

  const words = originalText.split(/(\s+)/);
  para.innerHTML = words
    .map((chunk) =>
      chunk.trim()
        ? `<span class="summary-word" aria-hidden="true">${chunk}</span>`
        : chunk
    )
    .join('');

  const wordEls = para.querySelectorAll('.summary-word');

  gsap.fromTo(
    wordEls,
    { opacity: 0.12 },
    {
      opacity: 1,
      stagger: 0.04,
      ease: 'none',
      scrollTrigger: {
        trigger: para.parentElement,
        start: 'top 70%',
        end: 'bottom 30%',
        scrub: 0.4,
      },
    }
  );
}
