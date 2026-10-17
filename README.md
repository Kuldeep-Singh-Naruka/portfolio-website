# Kuldeep Singh — Space Portfolio

> Live at: [https://kuldeep-singh-naruka.netlify.app/](https://kuldeep-singh-naruka.netlify.app/)

A scroll-driven 3D portfolio: scrolling flies outward from the Sun to a black hole. Every section has **one** recognisable space object beside the text, and the text never sits under it. Nothing moves on its own; everything responds to scroll, pointer or click.

## The journey

| Section | Object | Interaction |
|---|---|---|
| Hero | The Sun (shader surface + corona) | drag to rotate, hover brightens the corona |
| Summary | The Moon | drag |
| Skills 01–08 | Jupiter · Saturn · Mercury · Earth · Mars · Uranus · Neptune · Asteroid belt | drag; rotation follows scroll |
| Overview | Orrery (whole solar system) | hover a planet for its label, click to jump to that skill |
| AI Projects | Supernova, scrubbed by scroll (scroll back to un-explode) | scroll |
| API Monitor Agent | Space probe with signal rings | drag |
| HireFlow | JWST-style space telescope | drag, hover glints the mirror |
| Experience | Comet travelling down the timeline | drag to spin |
| Education | Nebula | pointer parallax |
| Contact | Black hole with gravitational lensing | move the mouse to bend space, drag to tilt the disk |

Background: a 3-layer parallax starfield, a faint Milky Way (dark theme), and **meteors that appear only when you scroll fast or click empty space** (max 2).

## Display settings

The header **View** button (and `Ctrl K`) controls three settings, saved in `localStorage` under `space-settings`:

- **Theme**: Dark (deep space) · Light (astronomy-atlas look) · Auto (follows the OS)
- **3D**: Full · Lite (lower resolution, fewer particles, no meteors) · Off (still images of the same objects, from `public/stills/`)
- **Motion**: Full · Reduced (no scroll-driven spin; the supernova shows its final frame)

3D defaults to Lite on phones and low-end devices, and drops from Full to Lite automatically if scrolling gets slow.

## Architecture

```
src/
  main.js                 boot: settings → UI → smooth scroll → lazy 3D
  settings/store.js       theme / 3D / motion (+ a no-flash copy inline in index.html)
  ui/                     settings popover, Ctrl K palette, phone reveal, counters
  scroll/index.js         Lenis + GSAP ScrollTrigger
  scene/
    index.js              renderer, lights, render-on-demand loop
    director.js           one body per [data-body] slot: lazy create/dispose, placement, drag, picking
    fits.js               framing per body (shared by live 3D and stills)
    registry.js           data-body id → factory
    sky/                  starfield + Milky Way, meteors
    bodies/               sun, planet (moon/earth/rings/atmosphere), belt, orrery,
                          supernova, craft (probe + telescope), comet, nebula, blackhole
    lib/                  GLSL noise, texture/env cache
public/textures/          planet maps (WebP, ~1.2 MB total, loaded per section)
public/stills/            3D-Off renders (made by `npm run stills`)
```

- **Placement:** every object lives in a `.body-slot[data-body]` element in the HTML. The camera maps 1 world unit to 1 CSS pixel, so each body is drawn exactly over its slot and moves with the page.
- **Render on demand:** frames are drawn only on scroll, pointer, resize, a setting change, a texture load or an active effect, so an idle page uses no GPU.
- **Lazy:** three.js loads after first paint. A body is created about 1.6 screens before its section and disposed about 4.5 screens after, so only a few are in GPU memory at once.
- **Content first:** all resume text is static HTML. `npm run verify:content` checks that every string is present and visible.

## Scripts

```bash
npm install
npm run dev              # local dev server
npm run build            # production build → dist/
npm run preview          # serve dist/ on :4173
npm run stills           # re-render public/stills/*.webp after changing a body
npm run verify:content   # build + check every resume string is visible
npm test                 # Playwright: palette + settings (run `npm run preview` first)
```

## Credits

Planet maps: [Planet Pixel Emporium](https://planetpixelemporium.com/) (James Hastings-Trew), via threex.planets. Earth and Moon maps: NASA (via the three.js examples). Everything else (Sun, supernova, nebula, black hole, comet tails, spacecraft) is procedural.

## Stack

Vite · Three.js · GSAP ScrollTrigger · Lenis · Tailwind CSS v4 · vanilla JS
