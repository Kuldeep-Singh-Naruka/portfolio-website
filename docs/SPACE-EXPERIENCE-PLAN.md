# Space Experience Plan — Kuldeep Singh Portfolio

> Audit of the current build (localhost:4173, Oct 17 2026) and the plan for a full, uncluttered 3D space journey.
> Written so it can be handed to a coding agent one phase at a time.

> **Status (Oct 17 2026): implemented.** All 4 phases are built. Deviations from the plan: the glows (sun, supernova, disk) are drawn with shaders instead of a bloom pass, which is lighter and works in both themes; the probe and telescope are procedural instead of NASA glTF models (no extra downloads); planet maps are from Planet Pixel Emporium (Earth and Moon from NASA). See README.md for how it all fits together.

---

## 1. What's wrong today (audit)

| # | Problem | Where | Severity |
|---|---|---|---|
| 1 | **Nothing looks like space.** The scene is 1 black metallic ball, black octahedra, wireframe icosahedra and a particle cloud. No sun, moon, planet, or anything else you'd recognise. | `src/scene/master.js` | Critical |
| 2 | **3D sits on top of the text.** Hero, "SYSTEM" overview and Experience all have the black sphere over the headline (worst in light mode). There's one shared object group that jumps to whichever anchor is nearest. | `scene/index.js → getActiveAnchor()` | Critical |
| 3 | **Promises that aren't real.** The overview says "Hover any body to navigate" but nothing can be hovered. You can't drag or click any object. | `index.html:361` | High |
| 4 | **Way too long.** The page is ~30,900px (34 screens). The 8 skill slides take 21,600px of that (300vh each). | `--slide-height: 300vh` | High |
| 5 | **3D-Off mode shows cartoon PNGs** rendered from an older scene that doesn't exist any more (flat orange disc, striped balls). They don't match. | `public/fallback/*.png` | High |
| 6 | **Night mode hero name was invisible** (inline `color:var(--color-ink)` beat the night CSS). | `main.css` | ✅ fixed |
| 7 | The render loop runs 60fps forever, even while nothing moves, which drains laptop and phone batteries. | `scene/index.js loop()` | Medium |
| 8 | `THREE.Clock` is deprecated (console warning). | `scene/index.js` | Low |
| 9 | Redundant devDeps: `playwright` + `@playwright/browser-chromium` + `@playwright/test`. | `package.json` | Low |
| 10 | `og-image.png` is 658 KB. It should be under 150 KB. | `public/` | Low |
| 11 | README still describes `content.js` as the "single source of truth" (it was never imported). | `README.md` | Low |

The **good parts to keep:** content lives in static HTML (SEO + readability), anchor-based placement (3D never needs a separate coordinate system), Lenis + GSAP scroll, the Ctrl+K palette (it works now: clicking an item navigates and toggles correctly), adaptive pixel ratio, and reduced-motion handling.

## 2. Cleanup already done

Deleted (all still recoverable from git history):

- `src/scene/objects/` (12 files: sun, beacon, constellation, flight-route, hash-ring, orbit-planet, orrery-overview, planet-moons, rag-cloud, ringed-planet, satellite, strata-planet). Nothing imported any of them.
- `src/scene/SystemScene.js` (empty file)
- `src/data/content.js` (never imported; it would only drift from the HTML)
- `scripts/render-fallbacks.mjs` (broken: depends on `window.__sceneObjects`, which no longer exists), `scripts/update-html.mjs` (one-time migration, already applied), `scripts/test-page.mjs` (debug)
- `test-results/` (Playwright output, now in `.gitignore`)
- `public/fallback/beacon.png`, `orrery-overview.png` (not referenced anywhere)

Fixed: night-mode ink tokens in `main.css` (hero name readable again).

Kept for now (replace in Phase 4): the other 10 `public/fallback/*.png`, because 3D-Off still uses them.

Note: `index.html` shows as modified in git with no real changes. Only the line endings differ (CRLF vs LF). Run `git config core.autocrlf true` or add a `.gitattributes` with `* text=auto` before the next commit.

---

## 3. The concept: "One flight, outward"

Scrolling is a camera journey from the Sun out to a black hole. **Every section has exactly one hero object.** It always sits in the half of the screen the text doesn't use. Three rules prevent crowding:

1. **Max on screen:** 1 hero object, plus at most 1 small accent, plus the background starfield. Never more.
2. **Nothing moves by itself.** All motion is a function of scroll position, pointer, or a click. This matches your earlier direction: objects move only with scroll, but you can still interact with them. A side effect is that we can render on demand only, which saves battery.
3. **Text always wins.** Objects live in their anchor slot. Text gets a soft radial "scrim" behind it in both themes, and objects never cross the text column.

### Section → object map

| Section | Hero object | Why it fits | Accent | Interaction |
|---|---|---|---|---|
| Hero | **The Sun** (right side, 60% visible, cropped by the screen edge) | You're the core of the system | Solar prominence arcs | Drag to rotate; hover brightens the corona; scroll turns the surface |
| Summary | **The Moon** (realistic craters, sharp terminator line) | "Home base" — calm, readable section | — | Drag to rotate; the light angle follows scroll |
| 01 Generative AI & LLMs | **Jupiter** | The biggest body, with storms that keep generating | Great Red Spot catches light | Drag / hover label |
| 02 Agentic AI | **Saturn** | Its rings are a loop, like an agent loop or LangGraph cycle | Ring shadow | Drag tilts the rings |
| 03 Languages | **Mercury** | The smallest planet, closest to the core: the fundamentals | — | Drag |
| 04 Backend | **Earth + atmosphere** | Where everything actually runs | City lights on the night side (dark theme only) | Drag |
| 05 Databases | **Mars** | Layered rock strata, like persisted data | Phobos (tiny) | Drag |
| 06 DevOps & Tools | **Uranus** (tilted 98°) | It runs sideways and keeps everything else steady | Faint rings | Drag |
| 07 Payments & Integrations | **Neptune** | The deep blue, high-pressure outer giant | — | Drag |
| 08 Concepts (System Design) | **Asteroid belt** (instanced rocks, ~400) | Many parts in one designed orbit | — | Scroll pans the camera through the belt |
| Overview "SYSTEM" | **Orrery**: Sun + 8 small planets on thin orbit lines (pulled-back camera) | The whole stack at once | — | **Hover a planet → label; click → jumps to that skill slide** (makes the existing copy true) |
| AI Projects (intro) | **Supernova**: a star swells, flashes, and a shockwave ring blasts outward | "What came out of it" — the big moment of the page | Shockwave distortion ring | Fully scroll-scrubbed (0→1). Scrolling back un-explodes it |
| Project: API Integration Monitor Agent | **Space probe** with antenna dish (NASA-style satellite) | It monitors from orbit | A thin signal pulse to a tiny planet | Drag to rotate the probe |
| Project: HireFlow | **Space telescope** (JWST-style gold mirror) | Scans and evaluates what's out there | — | Drag; hover glints the mirror |
| Experience | **Comet** whose tail follows the timeline line | A career is a trajectory | Tail particles point away from the Sun | The comet moves down the timeline with scroll |
| Education | **Nebula** (soft gas cloud) | Where stars are born | — | Pointer gives slight parallax |
| Contact | **Black hole** with gravitational lensing + accretion disk | Everything gets pulled in. Let's talk. | The starfield bends around it | Pointer moves the lensing; the CTA buttons sit just outside the event horizon |

### Everywhere-layer (background, very light)

- **Starfield:** 3 depth layers (about 1,500 points in total on desktop, 600 on mobile). Real star colours (blue-white to orange), with gentle parallax on scroll and pointer. This replaces the current grey particle cloud.
- **Milky Way band:** one faint textured plane, dark theme only.
- **Meteors (ulkapind):** never random on a timer. They spawn only when (a) you scroll fast (velocity threshold) or (b) you click empty space. Maximum 2 at once, about 0.6s streak. A small delight that never clutters.
- **Easter egg:** `sudo hire kuldeep` in Ctrl+K triggers a mini supernova flash before opening email (replaces the confetti).

### What's deliberately left out

Galaxies spinning in the background, multiple moons per planet, a full asteroid field everywhere, UFOs/rockets, lens flares everywhere, constant twinkling. Each of these is cool alone, but together they turn the page into a screensaver and the text loses.

---

## 4. Experience switches (settings)

Replace the separate "Night" and "3D On" text buttons with **one settings button (gear/planet icon)** in the header. It opens a small popover with 3 segmented controls. The same options also live in Ctrl+K.

| Setting | Options | Default |
|---|---|---|
| **Theme** | Dark (deep space) · Light (observatory) · Auto | Auto (follows OS) |
| **3D** | Full · Lite · Off | Full on desktop; Lite on mobile or low GPU (auto-detect via FPS probe) |
| **Motion** | Full · Reduced | Follows `prefers-reduced-motion` |

All three persist in `localStorage` under one key, `space-settings` (wrapped in try/catch). They're applied as `data-theme`, `data-3d` and `data-motion` attributes on `<html>` before first paint, set by a tiny inline script in `<head>`, so there's no flash.

**What each mode does:**

- **Dark:** near-black blue background (`#05070d`), bloom on the sun, supernova and accretion disk, Milky Way visible, Earth city lights on.
- **Light ("observatory"):** warm paper background (keep the current `#f5eee6` family). Stars become fine ink dots. No bloom. Exposure lowered so objects look like plates in a printed astronomy atlas: same real textures, softer light, a soft drop shadow under each object. The black hole becomes an ink-edged disk with lensing still visible. This is how light mode stays "space" without being a dark theme in disguise.
- **3D Full:** everything above, including post-processing and 2K textures.
- **3D Lite:** no post-processing, 1K textures, starfield halved, no meteors, no lensing (the black hole becomes a static shaded disk), DPR capped at 1.25.
- **3D Off:** the canvas isn't even created. Each anchor shows a **realistic still image of the exact same object**, rendered from the real scene by a script (see Phase 4), as transparent WebP with a gentle CSS scroll parallax. No more cartoon fallbacks.
- **Reduced motion:** no camera dolly, no supernova expansion (shows the final frame), no meteors. Objects still render and can still be dragged.

---

## 5. Architecture

Keep: **Vite + vanilla JS + Three.js + GSAP ScrollTrigger + Lenis + Tailwind v4.** No framework needed.

```
src/
  main.js                 boot: settings → scroll → lazy 3D
  settings/store.js       theme / 3d / motion state, persistence, events
  ui/
    settings-popover.js   header control (replaces night.js + 3D button)
    palette.js            (keep; add theme/3D/motion commands)
    phone.js  summary.js  counter.js   (keep)
  scroll/index.js         (keep; expose per-section progress 0..1)
  scene/
    core/
      renderer.js         WebGLRenderer, DPR, resize, render-on-demand
      quality.js          FPS probe → Full/Lite, texture size choice
      loader.js           texture/GLB loader, KTX2 + Draco, cache
      postfx.js           bloom (dark + Full only)
      pointer.js          drag-to-rotate springs, hover raycast, click
    background/
      starfield.js  milkyway.js  meteors.js
    bodies/
      sun.js  moon.js  planet.js (one generic, config-driven)
      rings.js  asteroid-belt.js  orrery.js
      supernova.js  probe.js  telescope.js  comet.js
      nebula.js  blackhole.js
    stages.js             section id → { body, anchor, camera, accent }
    director.js           activates current stage ±1, disposes far ones
public/
  textures/  (webp/ktx2, 1k + 2k)    models/ (glb, draco)
  stills/    (3D-Off WebP renders)
scripts/
  render-stills.mjs       Playwright: renders each stage → public/stills/
  verify-content.js       (keep)
```

**Stage contract:** each body exports `create(ctx) → { object3d, update(progress, pointer, theme), onHover?, onClick?, dispose() }`. The director loads a stage when its section is 1 screen away and disposes it 2 sections later. That way only about 3 bodies are ever in GPU memory.

**Placement:** each stage owns its own object, so nothing teleports between anchors. The stage reads its anchor's `getBoundingClientRect()`, converts it to world space (the existing math is fine), and fits the object to `min(width, height) × 0.8`.

**Render on demand:** call `requestRender()` only on scroll, pointer move, resize, theme change or an active animation (supernova scrub, meteor). Idle means 0 GPU work.

### Key techniques per object

- **Sun:** sphere with an fbm-noise surface shader (granulation + sunspots). The noise "time" is driven by scroll, not the clock. An additive fresnel corona shell plus a billboard glow. Bloom in dark mode.
- **Moon:** NASA CGI Moon Kit colour + displacement (public domain), `MeshStandardMaterial`, a single hard directional light for crisp craters at the terminator.
- **Planets:** colour map, plus normal/specular where available. Atmosphere = back-side fresnel shell (Earth, Neptune, Uranus). Saturn and Uranus rings: `RingGeometry` + alpha texture, receiving the planet's shadow.
- **Asteroid belt:** `InstancedMesh` of 3 to 4 low-poly displaced rocks with random scale and rotation (one draw call).
- **Supernova:** an instanced shell of about 4,000 points, with radius = `easeOutExpo(progress)`. Colour goes white → orange → red as it expands. A shockwave ring as a screen-space distortion pass (Full) or an expanding additive torus (Lite).
- **Probe / telescope:** NASA 3D Resources glTF models (free to use; credit NASA), Draco-compressed to under 600 KB each. Optional procedural fallback built from boxes and a dish.
- **Comet:** small icy nucleus plus a particle tail always pointing away from the Sun's world position. Its position along a curve is tied to Experience scroll progress.
- **Nebula:** 8 to 12 large additive billboards with noise textures in 2 to 3 hues, plus slight pointer parallax.
- **Black hole:** full-screen quad shader that bends the starfield UVs around the centre (simple Schwarzschild-style deflection), a black event-horizon disk, and an accretion disk with doppler brightening on one side. The lensing centre lerps slightly toward the pointer.

### Assets and licences

- Planet, sun and Milky Way textures: **Solar System Scope** (CC BY 4.0). Credit in the footer.
- Moon: **NASA SVS CGI Moon Kit** (public domain).
- Probe and telescope models: **NASA 3D Resources** (credit NASA).
- Convert to WebP (or KTX2 via `gltf-transform`/`toktx`) in 1K and 2K sizes.

### Performance budget

| Item | Budget |
|---|---|
| Initial JS (before 3D) | ≤ 60 KB gzip |
| 3D chunk (three + scene) | ≤ 220 KB gzip, lazy after first paint |
| Hero (sun) | **0 textures** (pure shader), so it shows instantly |
| Textures streamed in total | ≤ 4 MB (Full), ≤ 1.5 MB (Lite), loaded per stage |
| Draw calls per frame | ≤ 30 |
| Target | 60fps on a mid laptop iGPU; 30fps+ on mid Android in Lite |
| Lighthouse | Performance ≥ 90 mobile with 3D Lite |

---

## 6. Layout changes that go with it

- Skill slides: **300vh → 140vh** sticky each. This takes the page from about 34 screens to about 18, with the same content.
- Alternate the text side per skill slide (text left / planet right, then swap), so the objects don't all hug one side.
- Overview "SYSTEM": headline moves to the top-left. The orrery fills the centre-right.
- Mobile (<768px): the object sits **above** the text in a 45vh slot, never beside or behind it. Drag is disabled (it fights scrolling); tap spins the object instead.
- Header: wordmark · nav · [settings] [Ctrl K]. That's 2 controls instead of 3 text buttons.
- A soft radial text scrim in both themes (CSS `::before` on text blocks) keeps every paragraph at 4.5:1 contrast or better.

---

## 7. Build phases (hand these to your agent one at a time)

**Phase 1 — Foundation (no new visuals yet)**
Settings store + popover + no-flash head script. Director/stage system. Render on demand. Swap `Clock` for `Timer`. Delete `master.js`/`state.js` once the director runs. Starfield background. Shorter skill slides. Fix the CRLF warning. Clean the devDeps.
*Done when:* the toggles all work and persist, an idle page uses 0% GPU, and the starfield looks right in both themes.

**Phase 2 — Core bodies**
Sun (hero), Moon (summary), the generic planet module + 8 skill planets, Saturn and Uranus rings, Earth atmosphere and city lights, drag-to-rotate + hover labels.
*Done when:* every skill slide shows its recognisable planet beside (never over) the text, in Dark, Light, Full and Lite.

**Phase 3 — Signature moments**
Orrery overview with clickable planets, scroll-scrubbed supernova + shockwave, probe and telescope for projects, comet on the timeline, nebula, black hole with lensing, scroll-velocity and click meteors, the supernova easter egg.

**Phase 4 — 3D Off, polish, ship**
`scripts/render-stills.mjs` renders every stage to `public/stills/*.webp` (transparent, 2x, 40 to 80 KB each). Replace `public/fallback/` and delete the old PNGs. Compress `og-image`. Update the README. Lighthouse and contrast pass. Run the palette test + `verify-content` in CI.

### Acceptance checklist (every phase)

- [ ] No object ever overlaps a line of text at 1440, 1280, 1024, 768 and 375 widths, in both themes
- [ ] All 3 settings work from the popover and from Ctrl+K, and survive a reload
- [ ] Nothing moves when you stop scrolling and stop moving the mouse
- [ ] Each object is recognisable by name without the label
- [ ] All resume content is still present and visible (`npm run verify:content`)
- [ ] No console errors or warnings
