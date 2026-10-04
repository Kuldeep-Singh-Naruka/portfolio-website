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

// Spring states for physical tracking
const posSpring = { x: 0, y: 0, vx: 0, vy: 0, omega: 12 };
const rotSpring = { x: 0, y: 0, vx: 0, vy: 0, omega: 8 };

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

  // Cinematic Lighting Rig
  const ambientLight = new AmbientLight(0xffffff, 0.2); // Very subtle ambient
  scene.add(ambientLight);

  const keyLight = new DirectionalLight(0xfff0dd, 3.5); // Warm key light
  keyLight.position.set(5, 5, 4);
  scene.add(keyLight);

  const fillLight = new DirectionalLight(0xddeeff, 1.5); // Cool fill light
  fillLight.position.set(-5, -2, -2);
  scene.add(fillLight);

  const rimLight = new DirectionalLight(0xffffff, 4.0); // Strong rim light to separate core from black background
  rimLight.position.set(0, 5, -10);
  scene.add(rimLight);

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

function lerpSec(s1, s2, t) {
  return {
    x: MathUtils.lerp(s1.x, s2.x, t),
    y: MathUtils.lerp(s1.y, s2.y, t),
    z: MathUtils.lerp(s1.z, s2.z, t),
    s: MathUtils.lerp(s1.s, s2.s, t),
    rx: MathUtils.lerp(s1.rx, s2.rx, t),
    ry: MathUtils.lerp(s1.ry, s2.ry, t),
    rz: MathUtils.lerp(s1.rz, s2.rz, t)
  };
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
      const st = t * t * (3 - 2 * t); // Smoothstep
      
      return {
        shape1: m1.state.shape,
        shape2: m2.state.shape,
        shapeBlend: st,
        coreScale: MathUtils.lerp(m1.state.coreScale, m2.state.coreScale, st),
        coreOpacity: MathUtils.lerp(m1.state.coreOpacity, m2.state.coreOpacity, st),
        camZ: MathUtils.lerp(m1.state.camZ, m2.state.camZ, st),
        camRotX: MathUtils.lerp(m1.state.camRotX, m2.state.camRotX, st),
        camRotY: MathUtils.lerp(m1.state.camRotY, m2.state.camRotY, st),
        noiseAmp: MathUtils.lerp(m1.state.noiseAmp, m2.state.noiseAmp, st),
        secA: lerpSec(m1.state.secA, m2.state.secA, st),
        secB: lerpSec(m1.state.secB, m2.state.secB, st),
        secC: lerpSec(m1.state.secC, m2.state.secC, st),
        secD: lerpSec(m1.state.secD, m2.state.secD, st),
        secE: lerpSec(m1.state.secE, m2.state.secE, st)
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
  
  // The core material shifts slightly between a premium dark grey and deep black
  masterScene.coreMat.color.lerp(new Color(isNight ? '#030405' : '#0f1113'), dt * 5);

  const p = scrollContext ? scrollContext.progress : 0;
  const state = getInterpolatedState(p);

  if (state.shapeBlend !== undefined) {
    const weights = [0,0,0,0,0,0,0,0,0];
    weights[state.shape1] = 1.0 - state.shapeBlend;
    weights[state.shape2] = state.shapeBlend;
    masterScene.particleMat.uniforms.uW.value = weights;
  } else {
    const weights = [0,0,0,0,0,0,0,0,0];
    weights[state.shape || 0] = 1.0;
    masterScene.particleMat.uniforms.uW.value = weights;
  }

  masterScene.particleMat.uniforms.uNoiseAmp.value = state.noiseAmp;

  // Apply core scale
  masterScene.coreMesh.scale.setScalar(MathUtils.lerp(masterScene.coreMesh.scale.x, state.coreScale, dt * 4));
  masterScene.coreMat.opacity = MathUtils.lerp(masterScene.coreMat.opacity, state.coreOpacity, dt * 4);

  // Apply Secondary Objects
  const applySec = (mesh, target, idleSpeedX, idleSpeedY, idleSpeedZ) => {
    mesh.position.x = MathUtils.lerp(mesh.position.x, target.x, dt * 4);
    mesh.position.y = MathUtils.lerp(mesh.position.y, target.y, dt * 4);
    mesh.position.z = MathUtils.lerp(mesh.position.z, target.z, dt * 4);
    mesh.scale.setScalar(MathUtils.lerp(mesh.scale.x, target.s, dt * 4));
    
    // Smoothly reach target rotation, then add extremely slow idle rotation
    mesh.rotation.x = MathUtils.lerp(mesh.rotation.x, target.rx + t * idleSpeedX, dt * 4);
    mesh.rotation.y = MathUtils.lerp(mesh.rotation.y, target.ry + t * idleSpeedY, dt * 4);
    mesh.rotation.z = MathUtils.lerp(mesh.rotation.z, target.rz + t * idleSpeedZ, dt * 4);
  };

  // Give each secondary object a distinct, very subtle idle rotation speed
  if (state.secA) applySec(masterScene.secA, state.secA, 0.02, 0.05, 0.01);
  if (state.secB) applySec(masterScene.secB, state.secB, 0.01, 0.02, -0.01);
  if (state.secC) applySec(masterScene.secC, state.secC, -0.05, 0.03, 0.02);
  if (state.secD) applySec(masterScene.secD, state.secD, 0.03, -0.04, 0.01);
  if (state.secE) applySec(masterScene.secE, state.secE, 0.06, 0.01, -0.03);

  // Camera Cinematic Dolly
  camera.position.z = MathUtils.lerp(camera.position.z, state.camZ, dt * 2);
  
  // Positional Spring Tracking (DOM anchor mapping)
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
      targetScale = Math.min((slotSize * pxPerUnit) / 5, 2.0);
    }
  }

  const damping = 2 * posSpring.omega;
  const fx = -posSpring.omega * posSpring.omega * (posSpring.x - targetX) - damping * posSpring.vx;
  const fy = -posSpring.omega * posSpring.omega * (posSpring.y - targetY) - damping * posSpring.vy;
  posSpring.vx += fx * dt;
  posSpring.vy += fy * dt;
  posSpring.x += posSpring.vx * dt;
  posSpring.y += posSpring.vy * dt;

  masterScene.group.position.set(posSpring.x, posSpring.y, 0);
  masterScene.group.scale.setScalar(MathUtils.lerp(masterScene.group.scale.x, targetScale, dt * 4));

  // Cinematic Parallax & Rotation
  const globalVel = scrollContext ? scrollContext.velocity : 0;
  const scrollImpulse = Math.max(Math.min(globalVel * 0.005, 0.5), -0.5); // Tilt on fast scroll
  
  const targetRotX = (state.camRotX || 0) + mouse2d.y * 0.05;
  const targetRotY = (state.camRotY || 0) + mouse2d.x * 0.05 + scrollImpulse;

  const rotDamping = 2 * rotSpring.omega;
  const frx = -rotSpring.omega * rotSpring.omega * (rotSpring.x - targetRotX) - rotDamping * rotSpring.vx;
  const fry = -rotSpring.omega * rotSpring.omega * (rotSpring.y - targetRotY) - rotDamping * rotSpring.vy;
  rotSpring.vx += frx * dt;
  rotSpring.vy += fry * dt;
  rotSpring.x += rotSpring.vx * dt;
  rotSpring.y += rotSpring.vy * dt;

  masterScene.group.rotation.set(rotSpring.x, rotSpring.y, 0);
  
  // Parallax subtle background movement based on mouse
  scene.position.x = MathUtils.lerp(scene.position.x, mouse2d.x * 0.5, dt * 2);
  scene.position.y = MathUtils.lerp(scene.position.y, mouse2d.y * 0.5, dt * 2);

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
