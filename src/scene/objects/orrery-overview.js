// ─── objects/orrery-overview.js ──────────────────────────────────────────────
// Overview & Experience & Education
// Miniatures of the planets on orbits, driven by scroll (p).
// ─────────────────────────────────────────────────────────────────────────────

import { Group, Mesh, SphereGeometry, RingGeometry, MeshStandardMaterial, MeshBasicMaterial, DoubleSide, DirectionalLight, AmbientLight } from 'three';

const PLANET_COLORS = ['#b5a7d4','#d9a85b','#9fb7a3','#c9694f','#5f8a8b','#8da3c1','#d9a3a8','#7a4658'];

export function createOrreryOverview(data) {
  const group = new Group();

  const dl = new DirectionalLight(0xffffff, 1.2);
  dl.position.set(-1, 1, 1);
  group.add(dl);
  group.add(new AmbientLight(0xffffff, 0.4));

  const sun = new Mesh(
    new SphereGeometry(18, 24, 24),
    new MeshBasicMaterial({ color: '#e9775c' })
  );
  group.add(sun);
  
  const planets = PLANET_COLORS.map((color, i) => {
    const r = 30 + i * 10;
    const orbit = new Mesh(
      new RingGeometry(r - 0.4, r + 0.4, 64),
      new MeshBasicMaterial({ color: '#1c2226', transparent: true, opacity: 0.08, side: DoubleSide })
    );
    orbit.rotation.x = Math.PI / 2.2;
    group.add(orbit);
    
    const planet = new Mesh(
      new SphereGeometry(3 + i * 0.4, 16, 16),
      new MeshStandardMaterial({ color, roughness: 0.6, metalness: 0.1 })
    );
    group.add(planet);
    
    return { planet, orbit, r, speed: 2.0 - i * 0.15, phase: (i / 8) * Math.PI * 2 };
  });

  return { 
    group, 
    update({ p, isActive, tiltX, tiltY }) {
      // Rotate overall group with drag
      group.rotation.x = (tiltX || 0);
      group.rotation.y = (tiltY || 0);

      planets.forEach(pObj => { 
        // Orbits driven by scroll p
        const a = p * Math.PI * 2 * pObj.speed + pObj.phase; 
        pObj.planet.position.set(Math.cos(a) * pObj.r, Math.sin(a) * pObj.r * Math.cos(Math.PI / 2.2), Math.sin(a) * pObj.r * Math.sin(Math.PI / 2.2));
      });
    }
  };
}
