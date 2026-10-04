// ─── objects/flight-route.js ─────────────────────────────────────────────────
// Projects
// A small spacecraft flying a glowing arc between realistic small bodies, 
// scrubbed by scroll progress (p).
// ─────────────────────────────────────────────────────────────────────────────

import { Group, Mesh, SphereGeometry, TubeGeometry, MeshStandardMaterial, MeshBasicMaterial, Color, Curve, Vector3, DirectionalLight, AmbientLight, BoxGeometry } from 'three';

class ArcCurve extends Curve {
  constructor(p1, p2, height) {
    super();
    this.p1 = p1;
    this.p2 = p2;
    this.mid = p1.clone().lerp(p2, 0.5).add(new Vector3(0, height, 0));
  }
  getPoint(t, optionalTarget = new Vector3()) {
    const x = (1-t)*(1-t)*this.p1.x + 2*(1-t)*t*this.mid.x + t*t*this.p2.x;
    const y = (1-t)*(1-t)*this.p1.y + 2*(1-t)*t*this.mid.y + t*t*this.p2.y;
    const z = (1-t)*(1-t)*this.p1.z + 2*(1-t)*t*this.mid.z + t*t*this.p2.z;
    return optionalTarget.set(x, y, z);
  }
}

export function createFlightRoute() {
  const group = new Group();

  group.add(new DirectionalLight(0xffffff, 1.2));
  group.add(new AmbientLight(0xffffff, 0.4));

  // Planets
  const p1 = new Vector3(-35, -10, 0);
  const p2 = new Vector3(35, 15, -15);

  const m1 = new Mesh(new SphereGeometry(12, 32, 32), new MeshStandardMaterial({ color: '#5f8a8b', roughness: 0.8 }));
  m1.position.copy(p1);
  group.add(m1);

  const m2 = new Mesh(new SphereGeometry(16, 32, 32), new MeshStandardMaterial({ color: '#c9694f', roughness: 0.8 }));
  m2.position.copy(p2);
  group.add(m2);

  // Flight path
  const curve = new ArcCurve(p1, p2, 30);
  const pathGeo = new TubeGeometry(curve, 64, 0.4, 8, false);
  const pathMat = new MeshBasicMaterial({ color: '#1c2226', transparent: true, opacity: 0.2 });
  group.add(new Mesh(pathGeo, pathMat));

  // Spacecraft (simplified satellite)
  const ship = new Group();
  const body = new Mesh(new BoxGeometry(3, 3, 6), new MeshStandardMaterial({ color: '#d9a85b', metalness: 0.8 }));
  const panel = new Mesh(new BoxGeometry(12, 0.5, 4), new MeshStandardMaterial({ color: '#5f8a8b', metalness: 0.8 }));
  ship.add(body);
  ship.add(panel);
  group.add(ship);

  return {
    group,
    update({ p, tiltX, tiltY }) {
      // Group tilt
      group.rotation.x = (tiltX || 0);
      group.rotation.y = (tiltY || 0);

      // Ship position scrubbed by scroll p
      const t = Math.max(0, Math.min(p, 1));
      const pos = curve.getPoint(t);
      ship.position.copy(pos);

      // Ship looks forward along the path
      if (t < 0.99) {
        const nextPos = curve.getPoint(t + 0.01);
        ship.lookAt(nextPos);
      }
    },
  };
}
