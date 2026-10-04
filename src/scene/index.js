// ─── scene/index.js ──────────────────────────────────────────────────────────
import {
  WebGLRenderer, Scene, PerspectiveCamera, SRGBColorSpace, Vector2, MathUtils, Clock,
  AmbientLight, DirectionalLight, Color
} from 'three';
import { createMasterScene } from './master.js';
import { SECTION_STATES } from './state.js';

let renderer, scene, camera, masterScene;
let threeOn = true;
let isRunning = true;
let fov = 55;
const mouse2d = new Vector2();
let rafId;
let scrollContext = null;
let clock = new Clock();

// Spring states
const posSpring = { x: 0, y: 0, vx: 0, vy: 0, omega: 12 };
const rotSpring = { x: 0, y: 0, vx: 0, vy: 0, omega: 8 };

// Milestones mapped from DOM
let milestones = [];

export function initScene(scrollCtx) {
  scrollContext = scrollCtx;
  const canvas = document.getElementById('orrery-canvas');
  if (!canvas) return;

  try {
    const testCtx = canvas.getContext('webgl2') || canvas.getContext('webgl');
    if (!testCtx) throw new Error('no webgl');
  } catch {
    document.body.classList.add('no-webgl');
    return;
  }

  const pixelRatio = Math.min(window.devicePixelRatio, 2);
  renderer = new WebGLRenderer({ canvas, alpha: true, antialias: pixelRatio < 1.5 });
  renderer.setPixelRatio(pixelRatio);
  renderer.setSize(window.innerWidth, window.innerHeight);
  renderer.setClearColor(0x000000, 0);
  renderer.outputColorSpace = SRGBColorSpace;

  scene = new Scene();
  camera = new PerspectiveCamera(fov, window.innerWidth / window.innerHeight, 0.1, 3000);
  updateCameraZ();

  const isMobile = window.innerWidth < 768;
  masterScene = createMasterScene(isMobile);
  scene.add(masterScene.group);

  // Lighting setup
  const ambientLight = new AmbientLight(0xffffff, 0.4);
  scene.add(ambientLight);

  const dirLight = new DirectionalLight(0xfff0dd, 2.5);
  dirLight.position.set(5, 5, 4);
  scene.add(dirLight);

  const fillLight = new DirectionalLight(0xddeeff, 1.2);
  fillLight.position.set(-5, -2, -2);
  scene.add(fillLight);

  const threeBtn = document.getElementById('three-toggle');
  threeBtn?.addEventListener('click', () => {
    threeOn = !threeOn;
    canvas.classList.toggle('hidden-3d', !threeOn);
    threeBtn.textContent = threeOn ? '3D On' : '3D Off';
    threeBtn.setAttribute('aria-pressed', String(threeOn));
    document.body.classList.toggle('three-off', !threeOn);
    if (!threeOn) showFallbacks(); else hideFallbacks();
  });

  window.addEventListener('pointermove', e => {
    mouse2d.x = (e.clientX / window.innerWidth) * 2 - 1;
    mouse2d.y = -((e.clientY / window.innerHeight) * 2 - 1);
  }, { passive: true });

  document.addEventListener('visibilitychange', () => {
    isRunning = !document.hidden;
    if (isRunning) rafId = requestAnimationFrame(loop);
  });

  window.addEventListener('resize', onResize);
  
  // Calculate scroll milestones
  recalcMilestones();
  window.addEventListener('resize', () => setTimeout(recalcMilestones, 500));

  clock.start();
  rafId = requestAnimationFrame(loop);
}

function recalcMilestones() {
  const sections = Array.from(document.querySelectorAll('.section-wrap, .project-slide'));
  const totalScroll = Math.max(1, document.documentElement.scrollHeight - window.innerHeight);
  
  milestones = sections.map(el => {
    const id = el.id || el.closest('[id]')?.id;
    const rect = el.getBoundingClientRect();
    const absoluteTop = window.scrollY + rect.top;
    const absoluteCenter = absoluteTop + rect.height / 2;
    
    let p = (absoluteCenter - window.innerHeight / 2) / totalScroll;
    
    if (id === 'hero') p = 0;
    if (id === 'contact') p = 1;
    
    p = Math.max(0, Math.min(1, p));
    
    return {
      id,
      p,
      el,
      state: SECTION_STATES[id] || SECTION_STATES['hero']
    };
  }).filter(m => m.id && m.state).sort((a, b) => a.p - b.p);
}

function getInterpolatedState(p) {
  if (!milestones.length) return SECTION_STATES['hero'];
  if (p <= milestones[0].p) return milestones[0].state;
  if (p >= milestones[milestones.length - 1].p) return milestones[milestones.length - 1].state;
  
  for (let i = 0; i < milestones.length - 1; i++) {
    const m1 = milestones[i];
    const m2 = milestones[i + 1];
    if (p >= m1.p && p <= m2.p) {
      const t = (p - m1.p) / (m2.p - m1.p);
      // Smoothstep for non-linear state morphs
      const st = t * t * (3 - 2 * t);
      
      return {
        shape1: m1.state.shape,
        shape2: m2.state.shape,
        shapeBlend: st, // 0 means shape1, 1 means shape2
        coreScale: MathUtils.lerp(m1.state.coreScale, m2.state.coreScale, st),
        coreOpacity: MathUtils.lerp(m1.state.coreOpacity, m2.state.coreOpacity, st),
        camZ: MathUtils.lerp(m1.state.camZ, m2.state.camZ, st),
        camRotX: MathUtils.lerp(m1.state.camRotX, m2.state.camRotX, st),
        camRotY: MathUtils.lerp(m1.state.camRotY, m2.state.camRotY, st),
        noiseAmp: MathUtils.lerp(m1.state.noiseAmp, m2.state.noiseAmp, st)
      };
    }
  }
  return milestones[milestones.length - 1].state;
}

function getActiveAnchor() {
  const vcy = window.innerHeight / 2;
  let closestEl = null, closestDist = Infinity;

  document.querySelectorAll('.anchor').forEach(el => {
    const slotEl = el.closest('.skill-object-wrap, .project-object-wrap, #hero, #overview, #contact') || el.parentElement;
    const rect = slotEl.getBoundingClientRect();
    const ey = rect.top + rect.height / 2;
    const dist = Math.abs(ey - vcy);
    // Add horizontal distance to disambiguate if needed, but vertical is primary
    if (dist < closestDist) { closestDist = dist; closestEl = slotEl; }
  });
  return closestEl;
}

function loop() {
  rafId = requestAnimationFrame(loop);
  if (!isRunning || !threeOn || !masterScene) return;

  const dt = Math.min(clock.getDelta(), 0.05);
  const t = clock.getElapsedTime();

  const isNight = document.body.classList.contains('night') ? 1 : 0;
  masterScene.particleMat.uniforms.uTime.value = t;
  masterScene.particleMat.uniforms.uNight.value = MathUtils.lerp(masterScene.particleMat.uniforms.uNight.value, isNight, dt * 5);
  masterScene.coreMat.color.lerp(new Color(isNight ? '#111315' : '#f5eee6'), dt * 5);

  // 1. Get interpolated state based on scroll progress
  const p = scrollContext ? scrollContext.progress : 0;
  const state = getInterpolatedState(p);

  // 2. Apply state
  if (state.shapeBlend !== undefined) {
    // Blending between two shapes
    const weights = [0,0,0,0,0,0,0,0,0];
    weights[state.shape1] = 1.0 - state.shapeBlend;
    weights[state.shape2] = state.shapeBlend;
    masterScene.particleMat.uniforms.uW.value = weights;
  } else {
    // Exact state
    const weights = [0,0,0,0,0,0,0,0,0];
    weights[state.shape || 0] = 1.0;
    masterScene.particleMat.uniforms.uW.value = weights;
  }

  // Set particle noise
  masterScene.particleMat.uniforms.uNoiseAmp.value = state.noiseAmp;

  // Apply core scale & opacity
  masterScene.coreMesh.scale.setScalar(MathUtils.lerp(masterScene.coreMesh.scale.x, state.coreScale, dt * 4));
  masterScene.coreMat.opacity = MathUtils.lerp(masterScene.coreMat.opacity, state.coreOpacity, dt * 4);

  // Camera Z
  camera.position.z = MathUtils.lerp(camera.position.z, state.camZ, dt * 2);
  
  // 3. Position tracking (spring towards active anchor)
  const anchor = getActiveAnchor();
  let targetX = 0, targetY = 0;
  let targetScale = 1;

  if (anchor) {
    const rect = anchor.getBoundingClientRect();
    if (rect.width > 0 && rect.height > 0) {
      const cx = rect.left + rect.width / 2;
      const cy = rect.top  + rect.height / 2;

      const camDist = camera.position.z;
      const fovRad = fov * (Math.PI / 180);
      const halfH = Math.tan(fovRad / 2) * camDist;
      const halfW = halfH * camera.aspect;

      targetX =  ((cx / window.innerWidth)  * 2 - 1) * halfW;
      targetY = -((cy / window.innerHeight) * 2 - 1) * halfH;

      const slotSize = Math.min(rect.width, rect.height) * 0.75;
      const pxPerUnit = halfH / (window.innerHeight / 2);
      targetScale = Math.min((slotSize * pxPerUnit) / 5, 2.0); // clamp max scale
    }
  }

  // Critical spring for position
  const damping = 2 * posSpring.omega;
  const fx = -posSpring.omega * posSpring.omega * (posSpring.x - targetX) - damping * posSpring.vx;
  const fy = -posSpring.omega * posSpring.omega * (posSpring.y - targetY) - damping * posSpring.vy;
  posSpring.vx += fx * dt;
  posSpring.vy += fy * dt;
  posSpring.x += posSpring.vx * dt;
  posSpring.y += posSpring.vy * dt;

  masterScene.group.position.set(posSpring.x, posSpring.y, 0);
  masterScene.group.scale.setScalar(MathUtils.lerp(masterScene.group.scale.x, targetScale, dt * 4));

  // 4. Rotation tracking
  const globalVel = scrollContext ? scrollContext.velocity : 0;
  const scrollImpulse = Math.max(Math.min(globalVel * 0.005, 0.5), -0.5);
  
  const targetRotX = (state.camRotX || 0) + mouse2d.y * 0.1;
  const targetRotY = (state.camRotY || 0) + mouse2d.x * 0.1 + scrollImpulse;

  const rotDamping = 2 * rotSpring.omega;
  const frx = -rotSpring.omega * rotSpring.omega * (rotSpring.x - targetRotX) - rotDamping * rotSpring.vx;
  const fry = -rotSpring.omega * rotSpring.omega * (rotSpring.y - targetRotY) - rotDamping * rotSpring.vy;
  rotSpring.vx += frx * dt;
  rotSpring.vy += fry * dt;
  rotSpring.x += rotSpring.vx * dt;
  rotSpring.y += rotSpring.vy * dt;

  masterScene.group.rotation.set(rotSpring.x, rotSpring.y, 0);

  renderer.render(scene, camera);
}

function onResize() {
  if (!renderer || !camera) return;
  camera.aspect = window.innerWidth / window.innerHeight;
  updateCameraZ();
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
  recalcMilestones();
}

function updateCameraZ() {
  const halfHpx = window.innerHeight / 2;
  camera.position.z = halfHpx / Math.tan((fov / 2) * (Math.PI / 180));
}

function showFallbacks() { document.querySelectorAll('.object-fallback').forEach(el => el.classList.add('visible')); }
function hideFallbacks() { document.querySelectorAll('.object-fallback').forEach(el => el.classList.remove('visible')); }
