// ─── scroll/index.js ─────────────────────────────────────────────────────────
// Lenis smooth scroll + GSAP ScrollTrigger sync.
// Manages slide tints, ghost numeral fade, slide counter.
// ─────────────────────────────────────────────────────────────────────────────

import Lenis from 'lenis';
import 'lenis/dist/lenis.css';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

gsap.registerPlugin(ScrollTrigger);

// Slide background tints in order (hero + 8 skills + overview + projects + exp + edu + contact)
const SLIDE_TINTS = {
  hero:           '#f5eee6',
  'skill-gen-ai': '#f7f3f0',
  'skill-agentic-ai': '#f5eee6',
  'skill-languages': '#e9e5e4',
  'skill-backend': '#ded8da',
  'skill-databases': '#d3c8cc',
  'skill-devops': '#e9e5e4',
  'skill-payments': '#f5eee6',
  'skill-concepts': '#f7f3f0',
  overview:       '#f0ebe5',
  projects:       '#e9e5e4',
  experience:     '#f5eee6',
  education:      '#f7f3f0',
  contact:        '#e1d6d1',
};

export async function initScroll(prefersReduced) {
  const tintEl = document.getElementById('slide-tint');

  // ─── Lenis setup ──────────────────────────────────────────────────────────
  const lenis = new Lenis({
    lerp: prefersReduced ? 1 : 0.1,
    smoothWheel: !prefersReduced,
    touchMultiplier: 1.5,
  });

  // Sync Lenis with GSAP ticker
  lenis.on('scroll', ScrollTrigger.update);
  gsap.ticker.add((t) => lenis.raf(t * 1000));
  gsap.ticker.lagSmoothing(0);

  const scrollCtx = {
    lenis,
    progress: 0,
    velocity: 0,
    activeSection: 'hero',
  };

  // Expose lenis globally so palette & other modules can call .scrollTo
  window.__lenis = lenis;

  // ─── Per-section tint triggers ─────────────────────────────────────────────
  const sections = document.querySelectorAll('.section-wrap, [data-slide-index]');

  sections.forEach((el) => {
    const id = el.id || el.closest('[id]')?.id;
    if (!id) return;

    ScrollTrigger.create({
      trigger: el,
      start: 'top 55%',
      end: 'bottom 45%',
      onEnter: () => applyTint(id, tintEl),
      onEnterBack: () => applyTint(id, tintEl),
    });
  });

  // ─── Skill slides tint (from data-tint attribute on sticky) ───────────────
  document.querySelectorAll('.skill-sticky[data-tint]').forEach((sticky) => {
    const slide = sticky.closest('.skill-slide');
    if (!slide) return;
    const tint = sticky.dataset.tint;

    ScrollTrigger.create({
      trigger: slide,
      start: 'top 60%',
      end: 'bottom 40%',
      onEnter: () => setTint(tintEl, tint),
      onEnterBack: () => setTint(tintEl, tint),
    });
  });

  // ─── Global scroll progress ────────────────────────────────────────────────
  ScrollTrigger.create({
    trigger: document.documentElement,
    start: 'top top',
    end: 'bottom bottom',
    onUpdate: (self) => {
      scrollCtx.progress = self.progress;
      scrollCtx.velocity = self.getVelocity();
    },
  });

  // ─── Generic reveal animations (JS-enhanced, not content-blocking) ────────
  if (!prefersReduced) {
    gsap.utils.toArray('.reveal').forEach((el) => {
      gsap.fromTo(el,
        { opacity: 0, y: 24 },
        {
          opacity: 1,
          y: 0,
          duration: 0.7,
          ease: 'power2.out',
          scrollTrigger: {
            trigger: el,
            start: 'top 85%',
            toggleActions: 'play none none none',
          },
        }
      );
    });
  }

  return scrollCtx;
}

function applyTint(id, tintEl) {
  const color = SLIDE_TINTS[id];
  if (color && tintEl) setTint(tintEl, color);
}

function setTint(tintEl, color) {
  if (!tintEl) return;
  // Night mode handled by CSS; only change when in day mode
  if (!document.body.classList.contains('night')) {
    tintEl.style.backgroundColor = color;
  }
}
