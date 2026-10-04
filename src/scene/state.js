import { SHAPES } from './master.js';

// Default hidden state for secondary objects
const secHidden = { x: 0, y: 0, z: -2, s: 0, rx: 0, ry: 0, rz: 0 };

export const SECTION_STATES = {
  'hero': {
    shape: SHAPES.HERO,
    coreScale: 1.5,
    coreOpacity: 1,
    camZ: 10,
    camRotX: 0.05,
    camRotY: -0.05,
    noiseAmp: 0.05,
    secA: { x: 3, y: 2, z: -2, s: 1, rx: 0.1, ry: 0.2, rz: 0 }, // small distant asteroid
    secB: { x: 0, y: 0, z: 0, s: 1, rx: 1.2, ry: 0.5, rz: 0 }, // faint ring
    secC: secHidden,
    secD: secHidden,
    secE: secHidden
  },
  'summary': {
    shape: SHAPES.HERO,
    coreScale: 1.0,
    coreOpacity: 0.9,
    camZ: 12,
    camRotX: 0.1,
    camRotY: -0.1,
    noiseAmp: 0.08,
    secA: { x: 2, y: 3, z: -4, s: 0.8, rx: 0.2, ry: 0.3, rz: 0 },
    secB: { x: 0, y: 0, z: 0, s: 1.2, rx: 1.0, ry: 0.6, rz: 0 },
    secC: secHidden,
    secD: secHidden,
    secE: secHidden
  },
  'skill-gen-ai': {
    shape: SHAPES.GEN_AI,
    coreScale: 0.2, // Core fragments
    coreOpacity: 0.8,
    camZ: 14,
    camRotX: 0.1,
    camRotY: 0.1,
    noiseAmp: 0.2,
    secA: { x: -2, y: 1, z: 1, s: 1.5, rx: 0.5, ry: 0.5, rz: 0.1 }, // fragment 1
    secB: secHidden,
    secC: { x: 2, y: -1, z: -1, s: 1, rx: 0.2, ry: 0.8, rz: 0.2 }, // fragment 2
    secD: { x: 1, y: 2, z: -2, s: 0.8, rx: 1.0, ry: 0, rz: 0.5 }, // wireframe structure
    secE: secHidden
  },
  'skill-agentic-ai': {
    shape: SHAPES.AGENTIC,
    coreScale: 0.6,
    coreOpacity: 1.0,
    camZ: 13,
    camRotX: 0.4,
    camRotY: -0.1,
    noiseAmp: 0.05,
    secA: { x: 3, y: 0, z: 0, s: 0.8, rx: 0, ry: 0, rz: 0 }, // node 1
    secB: { x: 0, y: 0, z: 0, s: 2.0, rx: 1.57, ry: 0.2, rz: 0 }, // orbital path
    secC: { x: -2, y: 1.5, z: 1, s: 0.5, rx: 0.5, ry: 0.5, rz: 0 }, // node 2
    secD: { x: -2, y: -1.5, z: -1, s: 0.4, rx: 0, ry: 0.8, rz: 0 }, // node 3
    secE: secHidden
  },
  'skill-languages': {
    shape: SHAPES.LANGUAGES,
    coreScale: 0.0,
    coreOpacity: 0.0,
    camZ: 14,
    camRotX: 0.3,
    camRotY: 0.4,
    noiseAmp: 0.0,
    secA: { x: -1, y: 1, z: 0, s: 1, rx: 0, ry: 0.5, rz: 0 }, // layered blocks
    secB: secHidden,
    secC: { x: 1, y: 0, z: -1, s: 1.2, rx: 0.2, ry: 0.5, rz: 0 },
    secD: { x: 0, y: -1, z: 1, s: 0.8, rx: -0.2, ry: 0.5, rz: 0 },
    secE: secHidden
  },
  'skill-backend': {
    shape: SHAPES.AGENTIC,
    coreScale: 0.8,
    coreOpacity: 1.0,
    camZ: 15,
    camRotX: -0.2,
    camRotY: 0.3,
    noiseAmp: 0.1,
    secA: { x: 0, y: 3, z: -2, s: 0.7, rx: 0.2, ry: 0.2, rz: 0 }, // satellite
    secB: { x: 0, y: 0, z: 0, s: 1.5, rx: 1.2, ry: -0.4, rz: 0 }, // ring
    secC: secHidden,
    secD: { x: 0, y: 0, z: 0, s: 2.2, rx: 1.2, ry: -0.4, rz: 0.5 }, // outer ring
    secE: secHidden
  },
  'skill-databases': {
    shape: SHAPES.DATABASES,
    coreScale: 0.4,
    coreOpacity: 0.9,
    camZ: 12,
    camRotX: 0.2,
    camRotY: -0.4,
    noiseAmp: 0.02,
    secA: { x: -2, y: 0, z: 0, s: 0.8, rx: 0.2, ry: -0.4, rz: 0 }, // clustered object
    secB: secHidden,
    secC: { x: 2, y: 1, z: -1, s: 0.6, rx: 0.2, ry: -0.4, rz: 0 }, // clustered object
    secD: secHidden,
    secE: secHidden
  },
  'skill-devops': {
    shape: SHAPES.DEVOPS,
    coreScale: 0.5,
    coreOpacity: 0.8,
    camZ: 14,
    camRotX: -0.3,
    camRotY: 0.2,
    noiseAmp: 0.3,
    secA: { x: -3, y: 2, z: -1, s: 0.5, rx: 0, ry: 0, rz: 0 }, // input
    secB: secHidden,
    secC: { x: 0, y: 0, z: 0, s: 0.8, rx: 0.5, ry: 0.5, rz: 0 }, // process
    secD: { x: 3, y: -2, z: 1, s: 0.5, rx: 0, ry: 0, rz: 0 }, // deploy
    secE: secHidden
  },
  'skill-payments': {
    shape: SHAPES.PAYMENTS,
    coreScale: 0.3,
    coreOpacity: 1.0,
    camZ: 11,
    camRotX: 0.1,
    camRotY: 0.5,
    noiseAmp: 0.1,
    secA: { x: -2, y: 0, z: 2, s: 0.6, rx: 0, ry: 0, rz: 0 }, // endpoint
    secB: secHidden,
    secC: { x: 2, y: 1, z: 0, s: 0.5, rx: 0, ry: 0, rz: 0 }, // endpoint
    secD: { x: 1, y: -2, z: -1, s: 0.4, rx: 0, ry: 0, rz: 0 }, // endpoint
    secE: { x: -1, y: -1, z: -2, s: 0.7, rx: 0, ry: 0, rz: 0 } // endpoint
  },
  'skill-concepts': {
    shape: SHAPES.ARCHITECTURE,
    coreScale: 0.1, // very small central core
    coreOpacity: 0.5,
    camZ: 6, // Dolly in very close through the layers
    camRotX: 0.3,
    camRotY: -0.8,
    noiseAmp: 0.02,
    secA: { x: -1, y: 3, z: 0, s: 0.4, rx: 0.1, ry: 0, rz: 0 }, // CLIENT
    secB: { x: 1, y: 1.5, z: -1, s: 0.6, rx: 0, ry: 0.2, rz: 0 }, // EDGE
    secC: { x: 0, y: 0, z: 0, s: 1.0, rx: 0.5, ry: 0.5, rz: 0 }, // APPLICATION
    secD: { x: -1.5, y: -1.5, z: 1, s: 0.5, rx: 0, ry: -0.2, rz: 0 }, // CACHE
    secE: { x: 1.5, y: -1.5, z: -1, s: 0.5, rx: 0, ry: 0.2, rz: 0 } // ASYNC
  },
  'overview': {
    shape: SHAPES.ARCHITECTURE,
    coreScale: 0.8,
    coreOpacity: 1.0,
    camZ: 18, // Pull back to see full system
    camRotX: 0.1,
    camRotY: 0.1,
    noiseAmp: 0.05,
    secA: { x: -2, y: 3, z: 0, s: 0.6, rx: 0.1, ry: 0, rz: 0 }, 
    secB: { x: 2, y: 1.5, z: -1, s: 0.8, rx: 0, ry: 0.2, rz: 0 },
    secC: { x: 0, y: 0, z: 0, s: 1.2, rx: 0.5, ry: 0.5, rz: 0 },
    secD: { x: -2.5, y: -2, z: 1, s: 0.7, rx: 0, ry: -0.2, rz: 0 },
    secE: { x: 2.5, y: -2, z: -1, s: 0.7, rx: 0, ry: 0.2, rz: 0 }
  },
  'projects': {
    shape: SHAPES.PROJECTS,
    coreScale: 0.5,
    coreOpacity: 0.9,
    camZ: 13,
    camRotX: 0.3,
    camRotY: -0.3,
    noiseAmp: 0.4,
    secA: { x: -2, y: 1, z: 1, s: 0.8, rx: 0.2, ry: 0.5, rz: 0.1 },
    secB: { x: 0, y: 0, z: 0, s: 1.5, rx: 1.2, ry: 0.5, rz: 0 }, // orbital path
    secC: { x: 2, y: -1, z: -1, s: 0.6, rx: 0.1, ry: 0.8, rz: 0.2 },
    secD: secHidden,
    secE: secHidden
  },
  'project-api-monitor': {
    shape: SHAPES.PROJECTS,
    coreScale: 0.6,
    coreOpacity: 0.9,
    camZ: 12,
    camRotX: 0.1,
    camRotY: -0.5,
    noiseAmp: 0.5,
    secA: { x: -1, y: 2, z: 0, s: 0.5, rx: 0.5, ry: 0, rz: 0 }, // module
    secB: { x: 1, y: 0, z: 1, s: 0.7, rx: 0, ry: 0.5, rz: 0 }, // module
    secC: { x: -1, y: -2, z: -1, s: 0.4, rx: 0.2, ry: 0.2, rz: 0 }, // module
    secD: secHidden,
    secE: secHidden
  },
  'project-hireflow': {
    shape: SHAPES.PROJECTS,
    coreScale: 0.6,
    coreOpacity: 0.9,
    camZ: 12,
    camRotX: -0.1,
    camRotY: 0.5,
    noiseAmp: 0.5,
    secA: { x: 2, y: 2, z: -1, s: 0.6, rx: 0, ry: 0.5, rz: 0 },
    secB: { x: -2, y: 0, z: 1, s: 0.8, rx: 0.5, ry: 0, rz: 0 },
    secC: { x: 1, y: -2, z: 0, s: 0.5, rx: 0.2, ry: 0.2, rz: 0 },
    secD: secHidden,
    secE: secHidden
  },
  'experience': {
    shape: SHAPES.HERO, // Return to calm core
    coreScale: 1.2,
    coreOpacity: 1.0,
    camZ: 16,
    camRotX: 0.0,
    camRotY: 0.0,
    noiseAmp: 0.02,
    secA: { x: 4, y: 2, z: -5, s: 0.5, rx: 0.1, ry: 0.1, rz: 0 }, // distant object
    secB: secHidden,
    secC: secHidden,
    secD: secHidden,
    secE: secHidden
  },
  'education': {
    shape: SHAPES.LANGUAGES,
    coreScale: 0.0,
    coreOpacity: 0.0,
    camZ: 18,
    camRotX: 0.1,
    camRotY: -0.1,
    noiseAmp: 0.01,
    secA: { x: 0, y: 0, z: -2, s: 1, rx: 0.2, ry: 0.2, rz: 0 }, // simple block
    secB: secHidden,
    secC: secHidden,
    secD: secHidden,
    secE: secHidden
  },
  'contact': {
    shape: SHAPES.HERO,
    coreScale: 0.8,
    coreOpacity: 0.9,
    camZ: 12,
    camRotX: 0,
    camRotY: 0,
    noiseAmp: 0.01,
    secA: { x: 2, y: 1, z: -8, s: 0.3, rx: 0.1, ry: 0.1, rz: 0 }, // drifting away
    secB: secHidden,
    secC: secHidden,
    secD: secHidden,
    secE: secHidden
  }
};
