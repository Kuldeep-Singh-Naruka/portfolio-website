// Framing for each body, shared by the live scene and the 3D-Off stills.
// fit   = body radius as a fraction of min(slot width, slot height)
// still = radius fraction used when rendering scripts/render-stills.mjs
export const FITS = {
  sun:       { fit: 0.36, still: 0.2 },
  moon:      { fit: 0.4,  still: 0.44 },
  jupiter:   { fit: 0.4,  still: 0.44 },
  saturn:    { fit: 0.21, still: 0.21 },
  mercury:   { fit: 0.34, still: 0.42 },
  earth:     { fit: 0.38, still: 0.42 },
  mars:      { fit: 0.33, still: 0.26 },
  uranus:    { fit: 0.24, still: 0.22 },
  neptune:   { fit: 0.38, still: 0.42 },
  belt:      { fit: 0.72, still: 0.74 },
  orrery:    { fit: 0.56, still: 0.48 },
  supernova: { fit: 0.42, still: 0.36 },
  probe:     { fit: 0.46, still: 0.4 },
  telescope: { fit: 0.42, still: 0.42 },
  station:   { fit: 0.44, still: 0.44 },
  comet:     { fit: 0.6,  still: 0.3 },
  nebula:    { fit: 0.62, still: 0.36 },
  blackhole: { fit: 0.56, still: 0.5 },
};

/** Size the 3D-Off still images so they match the live framing. */
export function applyStillSizes(root = document) {
  root.querySelectorAll('.body-slot[data-body]').forEach(el => {
    const f = FITS[el.dataset.body];
    if (f) el.style.setProperty('--k', (f.fit / f.still).toFixed(3));
  });
}
