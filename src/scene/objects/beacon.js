// ─── objects/beacon.js ───────────────────────────────────────────────────────
// Contact
// A satellite with a blinking beacon, slowly rotating.
// ─────────────────────────────────────────────────────────────────────────────

import { Group, Mesh, BoxGeometry, CylinderGeometry, SphereGeometry, MeshStandardMaterial, MeshBasicMaterial, Color, DirectionalLight, AmbientLight } from 'three';

export function createBeacon() {
  const group = new Group();
  
  group.add(new DirectionalLight(0xffffff, 1.5));
  group.add(new AmbientLight(0xffffff, 0.4));

  // Gold foil body
  const body = new Mesh(new BoxGeometry(12, 12, 24), new MeshStandardMaterial({ color: '#d9a85b', roughness: 0.3, metalness: 0.8 }));
  group.add(body);

  const panel = new Mesh(new BoxGeometry(40, 1, 10), new MeshStandardMaterial({ color: '#5f8a8b', roughness: 0.2, metalness: 0.9 }));
  group.add(panel);

  const beacon = new Mesh(new SphereGeometry(2, 16, 16), new MeshBasicMaterial({ color: '#e9775c' }));
  beacon.position.z = 14;
  group.add(beacon);

  return {
    group,
    update({ p, tiltX, tiltY }) {
      group.rotation.x = (tiltX || 0) + (p - 0.5) * 1.5;
      group.rotation.y = (tiltY || 0) + (p - 0.5) * 2.0;

      // Beacon blink (driven by p so it's deterministic)
      // Flash rapidly
      const blink = (p * 40) % 1;
      beacon.material.opacity = blink > 0.5 ? 1.0 : 0.1;
      beacon.material.transparent = true;
    },
  };
}
