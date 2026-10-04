import { SHAPES } from './master.js';

export const SECTION_STATES = {
  'hero': {
    shape: SHAPES.HERO,
    coreScale: 1.5,
    coreOpacity: 1,
    camZ: 10,
    camRotX: 0,
    camRotY: 0,
    noiseAmp: 0.05
  },
  'summary': {
    shape: SHAPES.HERO,
    coreScale: 1.0,
    coreOpacity: 0.8,
    camZ: 12,
    camRotX: 0.2,
    camRotY: -0.2,
    noiseAmp: 0.08
  },
  'skill-gen-ai': {
    shape: SHAPES.GEN_AI,
    coreScale: 0.2,
    coreOpacity: 0.2,
    camZ: 14,
    camRotX: 0.1,
    camRotY: 0.1,
    noiseAmp: 0.2
  },
  'skill-agentic-ai': {
    shape: SHAPES.AGENTIC,
    coreScale: 0.5,
    coreOpacity: 0.5,
    camZ: 13,
    camRotX: 0.4,
    camRotY: -0.1,
    noiseAmp: 0.05
  },
  'skill-languages': {
    shape: SHAPES.LANGUAGES,
    coreScale: 0.0,
    coreOpacity: 0.0,
    camZ: 14,
    camRotX: 0.3,
    camRotY: 0.4,
    noiseAmp: 0.0
  },
  'skill-backend': {
    shape: SHAPES.AGENTIC,
    coreScale: 0.8,
    coreOpacity: 0.8,
    camZ: 15,
    camRotX: -0.2,
    camRotY: 0.3,
    noiseAmp: 0.1
  },
  'skill-databases': {
    shape: SHAPES.DATABASES,
    coreScale: 0.0,
    coreOpacity: 0.0,
    camZ: 12,
    camRotX: 0.2,
    camRotY: -0.4,
    noiseAmp: 0.0
  },
  'skill-devops': {
    shape: SHAPES.DEVOPS,
    coreScale: 0.3,
    coreOpacity: 0.5,
    camZ: 14,
    camRotX: -0.3,
    camRotY: 0.2,
    noiseAmp: 0.3
  },
  'skill-payments': {
    shape: SHAPES.PAYMENTS,
    coreScale: 0.1,
    coreOpacity: 0.2,
    camZ: 11,
    camRotX: 0.1,
    camRotY: 0.5,
    noiseAmp: 0.1
  },
  'skill-concepts': {
    shape: SHAPES.ARCHITECTURE,
    coreScale: 0.1,
    coreOpacity: 0.2,
    camZ: 8,  // Dolly in close!
    camRotX: 0.3,
    camRotY: -0.8,
    noiseAmp: 0.02
  },
  'overview': {
    shape: SHAPES.ARCHITECTURE,
    coreScale: 1.0,
    coreOpacity: 1.0,
    camZ: 25,
    camRotX: 0,
    camRotY: 0,
    noiseAmp: 0.05
  },
  'projects': {
    shape: SHAPES.PROJECTS,
    coreScale: 0.4,
    coreOpacity: 0.5,
    camZ: 13,
    camRotX: 0.3,
    camRotY: -0.3,
    noiseAmp: 0.4
  },
  'project-api-monitor': {
    shape: SHAPES.PROJECTS,
    coreScale: 0.4,
    coreOpacity: 0.5,
    camZ: 12,
    camRotX: 0.1,
    camRotY: -0.5,
    noiseAmp: 0.5
  },
  'project-hireflow': {
    shape: SHAPES.PROJECTS,
    coreScale: 0.4,
    coreOpacity: 0.5,
    camZ: 12,
    camRotX: -0.1,
    camRotY: 0.5,
    noiseAmp: 0.5
  },
  'experience': {
    shape: SHAPES.HERO,
    coreScale: 1.2,
    coreOpacity: 0.8,
    camZ: 14,
    camRotX: 0.0,
    camRotY: 0.0,
    noiseAmp: 0.02
  },
  'education': {
    shape: SHAPES.LANGUAGES,
    coreScale: 0.0,
    coreOpacity: 0.0,
    camZ: 15,
    camRotX: 0.1,
    camRotY: -0.1,
    noiseAmp: 0.0
  },
  'contact': {
    shape: SHAPES.HERO,
    coreScale: 0.5,
    coreOpacity: 0.6,
    camZ: 12,
    camRotX: 0,
    camRotY: 0,
    noiseAmp: 0.01
  }
};
