// ─── Director ────────────────────────────────────────────────────────────────
// Owns one body per `[data-body]` slot. Creates bodies when their section is
// near, disposes them when far, places each one on its slot (1 world unit = 1
// CSS px at z = 0) and feeds it scroll progress, pointer and drag state.
import { Vector3, Vector2, Raycaster } from 'three';
import { REGISTRY } from './registry.js';

const NEAR = 1.6;   // create when within N screens
const FAR = 4.5;    // dispose when beyond N screens

export function createDirector({ scene, camera, ctx, request, stillMode = false, root = document }) {
  const recs = [...root.querySelectorAll('[data-body]')]
    .filter(el => REGISTRY[el.dataset.body])
    .map(el => ({
      el,
      id: el.dataset.body,
      cfg: REGISTRY[el.dataset.body],
      stage: el.closest('[data-stage]') || el,
      body: null,
      hover: false,
      user: { yaw: 0, pitch: 0, ty: 0, tp: 0 },
      visible: false,
    }));

  const state = { dark: true, lite: false, reduced: false };
  const tmp = new Vector3();
  const targetLight = new Vector3(-0.6, 0.45, 0.65).normalize();

  // ── Pointer interaction on slots ───────────────────────────────────────
  const tip = document.createElement('div');
  tip.className = 'body-tip';
  tip.setAttribute('aria-hidden', 'true');
  document.body.appendChild(tip);
  const ray = new Raycaster();
  const ndc = new Vector2();
  let drag = null;

  function pick(rec, e) {
    if (!rec.body?.pick) return null;
    ndc.set((e.clientX / innerWidth) * 2 - 1, -(e.clientY / innerHeight) * 2 + 1);
    ray.setFromCamera(ndc, camera);
    return rec.body.pick(ray);
  }

  for (const rec of recs) {
    const el = rec.el;
    el.addEventListener('pointerenter', () => { rec.hover = true; request(); });
    el.addEventListener('pointerleave', () => {
      rec.hover = false;
      tip.classList.remove('show');
      el.style.cursor = '';
      if (rec.body?.pick) rec.body.pick({ intersectObjects: () => [] });
      request();
    });
    el.addEventListener('pointerdown', e => {
      if (e.pointerType === 'mouse' && e.button !== 0) return;
      drag = { rec, x: e.clientX, y: e.clientY, t: performance.now(), moved: 0, type: e.pointerType };
      if (e.pointerType !== 'touch') { el.setPointerCapture?.(e.pointerId); el.classList.add('dragging'); }
    });
    el.addEventListener('pointermove', e => {
      if (rec.body?.pick && !drag) {
        const hit = pick(rec, e);
        if (hit) {
          tip.textContent = hit.label;
          tip.style.transform = `translate(${e.clientX + 14}px, ${e.clientY + 14}px)`;
          tip.classList.add('show');
          el.style.cursor = 'pointer';
        } else {
          tip.classList.remove('show');
          el.style.cursor = '';
        }
        request();
      }
    });
    el.addEventListener('click', e => {
      if (!rec.body?.pick || (drag && drag.moved > 6)) return;
      const hit = pick(rec, e);
      if (hit?.href) {
        const target = document.querySelector(hit.href);
        if (target) window.__lenis ? window.__lenis.scrollTo(target, { duration: 1.6, force: true }) : target.scrollIntoView();
      }
    });
  }

  window.addEventListener('pointermove', e => {
    if (!drag || drag.type === 'touch') return;
    const dx = e.clientX - drag.x, dy = e.clientY - drag.y;
    drag.moved += Math.abs(dx) + Math.abs(dy);
    drag.x = e.clientX; drag.y = e.clientY;
    const u = drag.rec.user;
    u.ty += dx * 0.009;
    u.tp = Math.max(-0.9, Math.min(0.9, u.tp + dy * 0.006));
    request();
  }, { passive: true });

  window.addEventListener('pointerup', e => {
    if (!drag) return;
    const d = drag;
    d.rec.el.classList.remove('dragging');
    // tap on touch → gentle spin
    if (d.type === 'touch' && performance.now() - d.t < 350 && Math.hypot(e.clientX - d.x, e.clientY - d.y) < 10) {
      d.rec.user.ty += 1.2;
      request();
    }
    setTimeout(() => { if (drag === d) drag = null; }, 0);
  });

  // ── Lifecycle ───────────────────────────────────────────────────────────
  function create(rec) {
    rec.body = rec.cfg.make({ ...ctx, lite: state.lite });
    rec.body.setTheme(state.dark);
    rec.body.setQuality(state.lite);
    scene.add(rec.body.root);
  }
  function destroy(rec) {
    rec.body.dispose();
    rec.body = null;
  }

  function update({ dt, scrollY, pointer, dpr }) {
    const W = innerWidth, H = innerHeight;
    let busy = false;
    let best = null, bestD = Infinity;

    for (const rec of recs) {
      const rect = rec.el.getBoundingClientRect();
      if (!rect.width || !rect.height) {
        if (rec.body) { rec.body.root.visible = false; }
        continue;
      }
      const cy = rect.top + rect.height / 2;
      const screens = cy < 0 ? -cy / H : cy > H ? (cy - H) / H : 0;
      if (!rec.body && (stillMode || screens < NEAR)) create(rec);
      if (rec.body && !stillMode && screens > FAR) { destroy(rec); continue; }
      if (!rec.body) continue;

      const fit = stillMode ? rec.cfg.still : (rec.body.fit ?? rec.cfg.fit) * (parseFloat(rec.el.dataset.scale) || 1);
      const radius = Math.min(rect.width, rect.height) * fit;
      const cx = rect.left + rect.width / 2;
      const visible = stillMode || (rect.bottom + radius > -40 && rect.top - radius < H + 40);
      rec.body.root.visible = visible;
      if (!visible) continue;

      rec.body.root.position.set(cx - W / 2, H / 2 - cy, 0);
      rec.body.root.scale.setScalar(radius);

      // drag springs
      const u = rec.user;
      const k = Math.min(1, dt * 8);
      u.yaw += (u.ty - u.yaw) * k;
      u.pitch += (u.tp - u.pitch) * k;
      if (Math.abs(u.ty - u.yaw) > 0.001 || Math.abs(u.tp - u.pitch) > 0.001) busy = true;

      const sr = rec.stage.getBoundingClientRect();
      const p = stillMode ? (rec.el.dataset.p ? parseFloat(rec.el.dataset.p) : 0.5)
        : Math.min(1, Math.max(0, (H - sr.top) / (sr.height + H)));

      if (rec.body.update({
        p, dt, pointer, dpr, scrollY,
        yaw: u.yaw, pitch: u.pitch, hover: rec.hover,
        dark: state.dark, lite: state.lite, reduced: state.reduced,
      })) busy = true;

      const d = Math.abs(cy - H / 2);
      if (d < bestD) { bestD = d; best = rec; }
    }

    // key light follows the stage closest to the viewport centre
    if (best?.body?.meta?.light) targetLight.set(...best.body.meta.light).normalize();
    tmp.copy(ctx.lightDir).lerp(targetLight, Math.min(1, dt * 4)).normalize();
    if (tmp.distanceTo(targetLight) > 0.002) busy = true;
    ctx.lightDir.copy(tmp);
    return busy;
  }

  return {
    update,
    setTheme(dark) { state.dark = dark; recs.forEach(r => r.body?.setTheme(dark)); },
    setQuality(lite) {
      if (state.lite === lite) return;
      state.lite = lite;
      // rebuild so particle counts / textures follow the new quality
      recs.forEach(r => { if (r.body) { destroy(r); } });
    },
    setReduced(v) { state.reduced = v; },
    loadingDone: () => true,
  };
}
