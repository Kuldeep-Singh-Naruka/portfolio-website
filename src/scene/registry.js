// ─── Body registry: data-body id → factory + framing (see fits.js) ──────────
import { FITS } from './fits.js';
import { createSun } from './bodies/sun.js';
import { createPlanet } from './bodies/planet.js';
import { createBelt } from './bodies/belt.js';
import { createOrrery } from './bodies/orrery.js';
import { createSupernova } from './bodies/supernova.js';
import { createProbe, createTelescope, createStation } from './bodies/craft.js';
import { createComet } from './bodies/comet.js';
import { createNebula } from './bodies/nebula.js';
import { createBlackHole } from './bodies/blackhole.js';

const planet = id => ctx => createPlanet(id, ctx);

const MAKERS = {
  sun: createSun,
  moon: planet('moon'),
  jupiter: planet('jupiter'),
  saturn: planet('saturn'),
  mercury: planet('mercury'),
  earth: planet('earth'),
  mars: planet('mars'),
  uranus: planet('uranus'),
  neptune: planet('neptune'),
  belt: createBelt,
  orrery: createOrrery,
  supernova: createSupernova,
  probe: createProbe,
  telescope: createTelescope,
  station: createStation,
  comet: createComet,
  nebula: createNebula,
  blackhole: createBlackHole,
};

export const REGISTRY = Object.fromEntries(
  Object.entries(MAKERS).map(([id, make]) => [id, { make, ...FITS[id] }]),
);
