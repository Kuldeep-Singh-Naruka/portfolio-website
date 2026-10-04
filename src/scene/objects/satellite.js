// ─── objects/satellite.js ────────────────────────────────────────────────────
// Skill slide 06: DevOps & Tools (Satellite)
// Procedural satellite: gold foil body, solar panels that deploy based on scroll (p).
// ─────────────────────────────────────────────────────────────────────────────

import { Group, Mesh, BoxGeometry, CylinderGeometry, MeshStandardMaterial, Color, DirectionalLight, AmbientLight } from 'three';

export function createSatellite() {
  const group = new Group();
  
  // Create lights local to group so standard material works without scene lighting
  const dirLight = new DirectionalLight(0xffffff, 1.5);
  dirLight.position.set(-1, 1, 1);
  group.add(dirLight);
  group.add(new AmbientLight(0xffffff, 0.4));

  // Gold foil body
  const bodyGeo = new BoxGeometry(12, 12, 24);
  const bodyMat = new MeshStandardMaterial({ 
    color: '#d9a85b', roughness: 0.3, metalness: 0.8 
  });
  const body = new Mesh(bodyGeo, bodyMat);
  group.add(body);

  // Antenna
  const antMat = new MeshStandardMaterial({ color: '#8da3c1', roughness: 0.5, metalness: 0.5 });
  const antenna = new Mesh(new CylinderGeometry(1, 1, 16), antMat);
  antenna.position.z = 16;
  antenna.rotation.x = Math.PI / 2;
  group.add(antenna);

  const dish = new Mesh(new CylinderGeometry(8, 0, 4, 32), antMat);
  dish.position.z = 24;
  dish.rotation.x = Math.PI / 2;
  group.add(dish);

  // Solar panels (blue grid)
  const panelGeo = new BoxGeometry(28, 1, 10);
  const panelMat = new MeshStandardMaterial({
    color: '#5f8a8b', roughness: 0.2, metalness: 0.9,
  });

  const panelL = new Mesh(panelGeo, panelMat);
  panelL.position.x = -20;
  group.add(panelL);

  const panelR = new Mesh(panelGeo, panelMat);
  panelR.position.x = 20;
  group.add(panelR);

  // 8 Docking modules (one per DevOps skill)
  const mods = [];
  const modGeo = new BoxGeometry(4, 4, 4);
  for (let i = 0; i < 8; i++) {
    const modMat = new MeshStandardMaterial({ color: '#c9694f', roughness: 0.6, metalness: 0.2 });
    const mod = new Mesh(modGeo, modMat);
    group.add(mod);
    mods.push(mod);
  }

  let awakeVal = 0;

  return {
    group,
    update({ p, isActive, tiltX, tiltY }) {
      const target = isActive ? 1 : 0.15;
      awakeVal += (target - awakeVal) * 0.04;

      // Scale to full size when active
      group.scale.setScalar(awakeVal);

      // Scroll p drives panel deployment
      // Panels fold up when p is near 0 or 1, flat when in middle
      const deploy = Math.sin(p * Math.PI); 
      panelL.rotation.z = (1 - deploy) * Math.PI / 2;
      panelR.rotation.z = -(1 - deploy) * Math.PI / 2;

      // Scroll p drives docking modules flying in
      mods.forEach((mod, i) => {
        // Target positions on body
        const tx = (i % 2 === 0 ? 1 : -1) * 7;
        const ty = (i < 4 ? 1 : -1) * 7;
        const tz = (i % 4 < 2 ? 1 : -1) * 6;
        
        // Modules fly in from far away as scroll approaches center (p=0.5)
        const dist = 100 * (1 - deploy) * (i + 1) * 0.2;
        mod.position.set(
          tx + (tx > 0 ? dist : -dist),
          ty + (ty > 0 ? dist : -dist),
          tz
        );
        mod.rotation.x = dist * 0.1;
        mod.rotation.y = dist * 0.1;
      });

      // Overall rotation
      group.rotation.x = (p - 0.5) * 1.5 + (tiltX || 0);
      group.rotation.y = (p - 0.5) * 2.0 + (tiltY || 0);
      group.rotation.z = (p - 0.5) * 0.5;
    },
  };
}
