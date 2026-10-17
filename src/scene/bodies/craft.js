// ─── Spacecraft: monitoring probe (API Monitor) + space telescope (HireFlow) ─
import {
  Group, Mesh, BoxGeometry, CylinderGeometry, LatheGeometry, ConeGeometry, SphereGeometry,
  TorusGeometry, Shape, ShapeGeometry, MeshStandardMaterial, MeshBasicMaterial, Vector2,
  DoubleSide, AdditiveBlending, NormalBlending, Color,
} from 'three';
import { rig, applyUser, disposeTree } from './common.js';
import { canvasTex } from '../lib/assets.js';

function foilTexture() {
  return canvasTex(256, 256, (g, w, h) => {
    g.fillStyle = '#b8892a'; g.fillRect(0, 0, w, h);
    for (let i = 0; i < 900; i++) {
      const x = Math.random() * w, y = Math.random() * h, l = 6 + Math.random() * 26;
      const a = Math.random() * Math.PI;
      g.strokeStyle = `rgba(${Math.random() < 0.5 ? '255,226,150' : '90,60,15'},${0.12 + Math.random() * 0.25})`;
      g.lineWidth = 1 + Math.random() * 2;
      g.beginPath(); g.moveTo(x, y); g.lineTo(x + Math.cos(a) * l, y + Math.sin(a) * l); g.stroke();
    }
  }, { repeat: true });
}

function panelTexture() {
  return canvasTex(256, 512, (g, w, h) => {
    g.fillStyle = '#0d1a3a'; g.fillRect(0, 0, w, h);
    const cw = w / 6, ch = h / 12;
    for (let x = 0; x < 6; x++) for (let y = 0; y < 12; y++) {
      const shade = 22 + Math.random() * 18;
      g.fillStyle = `rgb(${shade * 0.5},${shade * 0.8},${shade * 2.2})`;
      g.fillRect(x * cw + 2, y * ch + 2, cw - 4, ch - 4);
    }
    g.strokeStyle = 'rgba(190,200,220,0.55)'; g.lineWidth = 2;
    for (let x = 0; x <= 6; x++) { g.beginPath(); g.moveTo(x * cw, 0); g.lineTo(x * cw, h); g.stroke(); }
  });
}

// ─── Probe ──────────────────────────────────────────────────────────────────
export function createProbe(ctx) {
  const r = rig();
  const env = ctx.envMap();
  const gold = new MeshStandardMaterial({ map: foilTexture(), metalness: 1, roughness: 0.32, envMap: env, envMapIntensity: 1.4, color: 0xffe2a0 });
  const white = new MeshStandardMaterial({ color: 0xe9e6e0, metalness: 0.35, roughness: 0.38, envMap: env, envMapIntensity: 0.9, side: DoubleSide });
  const grey = new MeshStandardMaterial({ color: 0x8a8f99, metalness: 0.8, roughness: 0.4, envMap: env });
  const panelMat = new MeshStandardMaterial({ map: panelTexture(), metalness: 0.55, roughness: 0.28, envMap: env, envMapIntensity: 0.8 });

  const craft = new Group();
  // bus
  const bus = new Mesh(new BoxGeometry(0.42, 0.36, 0.42), gold);
  craft.add(bus);
  const deck = new Mesh(new CylinderGeometry(0.26, 0.26, 0.05, 6), grey);
  deck.position.y = 0.2; craft.add(deck);
  // solar wings
  for (const side of [-1, 1]) {
    const boom = new Mesh(new CylinderGeometry(0.012, 0.012, 0.32, 8), grey);
    boom.rotation.z = Math.PI / 2; boom.position.x = side * 0.37; craft.add(boom);
    for (let k = 0; k < 3; k++) {
      const p = new Mesh(new BoxGeometry(0.34, 0.012, 0.5), panelMat);
      p.position.x = side * (0.62 + k * 0.36);
      craft.add(p);
    }
  }
  // high-gain dish
  const prof = [];
  for (let i = 0; i <= 16; i++) { const x = (i / 16) * 0.42; prof.push(new Vector2(x, x * x * 1.05)); }
  const dish = new Mesh(new LatheGeometry(prof, 48), white);
  dish.position.y = 0.26;
  craft.add(dish);
  const feed = new Mesh(new ConeGeometry(0.03, 0.12, 12), grey);
  feed.position.y = 0.47; feed.rotation.x = Math.PI; craft.add(feed);
  for (let k = 0; k < 3; k++) {
    const a = (k / 3) * Math.PI * 2;
    const strut = new Mesh(new CylinderGeometry(0.005, 0.005, 0.3, 6), grey);
    strut.position.set(Math.cos(a) * 0.17, 0.39, Math.sin(a) * 0.17);
    strut.lookAt(0, 0.52, 0); strut.rotateX(Math.PI / 2);
    craft.add(strut);
  }
  // magnetometer boom + RTG
  const mag = new Mesh(new CylinderGeometry(0.006, 0.006, 0.9, 6), grey);
  mag.rotation.x = Math.PI / 2; mag.position.set(0, -0.08, 0.62); craft.add(mag);
  const rtg = new Mesh(new CylinderGeometry(0.05, 0.05, 0.26, 10), grey);
  rtg.rotation.z = Math.PI / 2.6; rtg.position.set(-0.2, -0.24, -0.25); craft.add(rtg);
  for (let k = 0; k < 4; k++) {
    const t = new Mesh(new ConeGeometry(0.025, 0.06, 10), grey);
    t.position.set((k % 2 ? 1 : -1) * 0.15, -0.21, (k < 2 ? 1 : -1) * 0.15); craft.add(t);
  }

  // Signal rings (scroll-driven, emitted from the dish)
  const sigMat = [];
  const signals = new Group();
  for (let k = 0; k < 3; k++) {
    const m = new MeshBasicMaterial({ color: 0x5ad1e6, transparent: true, opacity: 0, depthWrite: false, blending: AdditiveBlending, side: DoubleSide });
    sigMat.push(m);
    const t = new Mesh(new TorusGeometry(0.42, 0.006, 6, 64), m);
    t.rotation.x = Math.PI / 2;
    signals.add(t);
  }
  craft.add(signals);

  craft.scale.setScalar(0.62);
  r.spin.add(craft);

  return {
    root: r.root,
    meta: { light: [-0.7, 0.5, 0.6], name: 'Space probe' },
    update(s) {
      r.spin.rotation.y = -0.7 + s.p * (s.reduced ? 0 : 1.4);
      r.spin.rotation.x = 0.35;
      r.spin.rotation.z = -0.25;
      applyUser(r.user, s);
      signals.children.forEach((ring, k) => {
        const t = ((s.p * 3.2 + k / 3) % 1 + 1) % 1;
        ring.position.y = 0.55 + t * 1.1;
        ring.scale.setScalar(0.4 + t * 1.6);
        sigMat[k].opacity = (1 - t) * 0.7 * (s.reduced ? 0.4 : 1);
      });
      return false;
    },
    setTheme(dark) {
      sigMat.forEach(m => { m.color = new Color(dark ? 0x5ad1e6 : 0x5b2f3b); m.blending = dark ? AdditiveBlending : NormalBlending; m.needsUpdate = true; });
    },
    setQuality() {},
    dispose() { disposeTree(r.root); },
  };
}

// ─── Space telescope (JWST-style) ───────────────────────────────────────────
export function createTelescope(ctx) {
  const r = rig();
  const env = ctx.envMap();
  const mirrorMat = new MeshStandardMaterial({ color: 0xf2c25a, metalness: 1, roughness: 0.12, envMap: env, envMapIntensity: 1.6 });
  const dark = new MeshStandardMaterial({ color: 0x2a2d33, metalness: 0.6, roughness: 0.5, envMap: env });
  const shieldMat = new MeshStandardMaterial({ color: 0x9a8cc4, metalness: 1, roughness: 0.34, envMap: env, envMapIntensity: 0.55, side: DoubleSide });
  const grey = new MeshStandardMaterial({ color: 0x9aa0aa, metalness: 0.8, roughness: 0.35, envMap: env });

  const scope = new Group();
  const mirror = new Group();
  // 18 hex segments: rings 1 and 2 of a hex grid (flat-top)
  const seg = 0.13;
  const hexGeo = new CylinderGeometry(seg, seg, 0.025, 6);
  hexGeo.rotateX(Math.PI / 2);
  hexGeo.rotateZ(Math.PI / 6);
  const step = seg * Math.sqrt(3) * 1.04;
  const axial = [];
  for (let q = -2; q <= 2; q++) for (let rr = -2; rr <= 2; rr++) {
    const s = -q - rr;
    const d = Math.max(Math.abs(q), Math.abs(rr), Math.abs(s));
    if (d === 1 || d === 2) axial.push([q, rr]);
  }
  for (const [q, rr] of axial) {
    const x = step * (q + rr / 2);
    const y = step * (rr * Math.sqrt(3) / 2);
    const m = new Mesh(hexGeo, mirrorMat);
    m.position.set(x, y, -(x * x + y * y) * 0.18);
    m.lookAt(0, 0, 2.6);
    mirror.add(m);
  }
  const back = new Mesh(new CylinderGeometry(0.58, 0.58, 0.05, 6), dark);
  back.rotation.x = Math.PI / 2; back.rotation.y = Math.PI / 6; back.position.z = -0.09;
  mirror.add(back);
  // secondary mirror on three struts
  const sec = new Mesh(new CylinderGeometry(0.06, 0.06, 0.02, 6), mirrorMat);
  sec.rotation.x = Math.PI / 2; sec.position.z = 0.78;
  mirror.add(sec);
  const strutEnds = [[0, 0.62], [-0.54, -0.31], [0.54, -0.31]];
  for (const [x, y] of strutEnds) {
    const len = Math.hypot(x, y, 0.78);
    const st = new Mesh(new CylinderGeometry(0.007, 0.007, len, 6), grey);
    st.position.set(x / 2, y / 2, 0.39);
    st.lookAt(0, 0, 0.78); st.rotateX(Math.PI / 2);
    mirror.add(st);
  }
  mirror.rotation.x = -0.35;
  mirror.position.y = 0.3;
  scope.add(mirror);

  // 5-layer sunshield (elongated hexagon / kite)
  const shape = new Shape();
  const pts = [[0, 1.05], [0.62, 0.42], [0.62, -0.42], [0, -1.05], [-0.62, -0.42], [-0.62, 0.42]];
  shape.moveTo(...pts[0]); pts.slice(1).forEach(p => shape.lineTo(...p)); shape.closePath();
  const sg = new ShapeGeometry(shape);
  for (let k = 0; k < 5; k++) {
    const layer = new Mesh(sg, shieldMat);
    layer.rotation.x = -Math.PI / 2;
    layer.position.y = -0.36 - k * 0.035;
    layer.scale.setScalar(1 - k * 0.025);
    scope.add(layer);
  }
  // spacecraft bus + panel
  const bus = new Mesh(new BoxGeometry(0.28, 0.14, 0.24), dark);
  bus.position.y = -0.6; scope.add(bus);
  const panel = new Mesh(new BoxGeometry(0.5, 0.01, 0.18), new MeshStandardMaterial({ map: panelTexture(), metalness: 0.5, roughness: 0.3, envMap: env }));
  panel.position.set(0, -0.68, -0.32); panel.rotation.x = 0.4; scope.add(panel);
  // tower
  const tower = new Mesh(new CylinderGeometry(0.035, 0.035, 0.3, 8), grey);
  tower.position.y = -0.2; scope.add(tower);

  scope.scale.setScalar(0.98);
  r.spin.add(scope);

  let glint = 0;
  return {
    root: r.root,
    meta: { light: [-0.5, 0.7, 0.7], name: 'Space telescope' },
    update(s) {
      r.spin.rotation.y = 0.45 + s.p * (s.reduced ? 0 : -1.1);
      r.spin.rotation.x = 0.05;
      applyUser(r.user, s);
      glint += ((s.hover ? 1 : 0) - glint) * Math.min(1, s.dt * 6);
      mirrorMat.envMapIntensity = 1.6 + glint * 1.4;
      mirrorMat.emissive.setRGB(glint * 0.12, glint * 0.08, 0);
      return Math.abs((s.hover ? 1 : 0) - glint) > 0.01;
    },
    setTheme() {},
    setQuality() {},
    dispose() { disposeTree(r.root); },
  };
}

// ─── Space station (RecallOps: five agents, one shared memory) ──────────────
// ISS-like silhouette: long truss, 8 golden solar wings, white radiators and a
// cluster of pressurised modules with a docked capsule.
function arrayTexture() {
  return canvasTex(128, 512, (g, w, h) => {
    g.fillStyle = '#4a3212'; g.fillRect(0, 0, w, h);
    const rows = 32, cols = 2;
    for (let y = 0; y < rows; y++) for (let x = 0; x < cols; x++) {
      const t = 150 + Math.random() * 40;
      g.fillStyle = `rgb(${t},${t * 0.62},${t * 0.22})`;
      g.fillRect(x * (w / cols) + 3, y * (h / rows) + 1, w / cols - 6, h / rows - 2);
    }
    g.fillStyle = 'rgba(30,20,8,0.9)'; g.fillRect(w / 2 - 2, 0, 4, h);
  });
}

export function createStation(ctx) {
  const r = rig();
  const env = ctx.envMap();
  const white = new MeshStandardMaterial({ color: 0xe8e6e1, metalness: 0.3, roughness: 0.45, envMap: env, envMapIntensity: 0.9 });
  const metal = new MeshStandardMaterial({ color: 0x9aa0aa, metalness: 0.85, roughness: 0.35, envMap: env });
  const radiator = new MeshStandardMaterial({ color: 0xf4f4f2, metalness: 0.1, roughness: 0.6, envMap: env, envMapIntensity: 0.5, side: DoubleSide });
  const arrays = new MeshStandardMaterial({ map: arrayTexture(), metalness: 0.6, roughness: 0.32, envMap: env, envMapIntensity: 1.0, side: DoubleSide });
  const gold = new MeshStandardMaterial({ map: foilTexture(), metalness: 1, roughness: 0.35, envMap: env, color: 0xffe2a0 });

  const st = new Group();
  // integrated truss
  const truss = new Mesh(new BoxGeometry(2.0, 0.07, 0.07), metal);
  st.add(truss);
  for (let i = -9; i <= 9; i++) {
    const rib = new Mesh(new BoxGeometry(0.01, 0.09, 0.09), metal);
    rib.position.x = i * 0.105; st.add(rib);
  }
  // solar wings: two pairs at each end, each pair = one up + one down
  for (const x of [-0.98, -0.78, 0.78, 0.98]) {
    const mast = new Mesh(new CylinderGeometry(0.008, 0.008, 1.5, 6), metal);
    mast.position.x = x; st.add(mast);
    for (const dir of [1, -1]) {
      const wing = new Mesh(new BoxGeometry(0.17, 0.66, 0.008), arrays);
      wing.position.set(x, dir * 0.42, 0);
      st.add(wing);
    }
  }
  // radiators (fold out along z, near the centre of the truss)
  for (const x of [-0.42, 0.42]) {
    for (let k = 0; k < 3; k++) {
      const rad = new Mesh(new BoxGeometry(0.16, 0.006, 0.42), radiator);
      rad.position.set(x + (k - 1) * 0.055, -0.05 - k * 0.015, -0.32);
      st.add(rad);
    }
  }
  // pressurised modules: main stack along z + a node with side modules
  const mod = (len, rad, mat = white) => {
    const m = new Mesh(new CylinderGeometry(rad, rad, len, 24), mat);
    m.rotation.x = Math.PI / 2; return m;
  };
  const stack = [[0.12, 0.6, 0.065], [0.0, 0.3, 0.07], [-0.12, 0.42, 0.06]];
  for (const [y, len, rad] of stack) {
    const m = mod(len, rad, y === 0 ? gold : white);
    m.position.set(0, y * 0.4, 0.2 + (y === -0.12 ? 0.12 : 0));
    st.add(m);
  }
  const lab = mod(0.5, 0.065); lab.position.set(0, 0.03, 0.52); st.add(lab);
  const node = new Mesh(new SphereGeometry(0.075, 20, 14), white); node.position.set(0, 0.03, 0.8); st.add(node);
  for (const side of [-1, 1]) {
    const m = mod(0.3, 0.055); m.rotation.set(0, 0, Math.PI / 2); m.position.set(side * 0.2, 0.03, 0.8); st.add(m);
  }
  const capsule = new Mesh(new ConeGeometry(0.06, 0.13, 20), white);
  capsule.rotation.x = Math.PI / 2; capsule.position.set(0, 0.03, 0.95); st.add(capsule);
  const small = new Mesh(new BoxGeometry(0.06, 0.24, 0.06), gold); small.position.set(0, 0.2, 0.62); st.add(small);

  st.scale.setScalar(0.92);
  r.spin.add(st);

  return {
    root: r.root,
    meta: { light: [-0.6, 0.6, 0.6], name: 'Space station' },
    update(s) {
      r.spin.rotation.y = -0.55 + s.p * (s.reduced ? 0 : 1.2);
      r.spin.rotation.x = 0.42;
      r.spin.rotation.z = -0.12;
      applyUser(r.user, s);
      return false;
    },
    setTheme() {},
    setQuality() {},
    dispose() { disposeTree(r.root); },
  };
}
