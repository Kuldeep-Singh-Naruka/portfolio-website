// ─── objects/hash-ring.js ────────────────────────────────────────────────────
// Skill slide 08: Concepts
// Brass armillary sphere (PBR) representing consistent hashing.
// Scroll (p) rotates the rings at different rates.
// ─────────────────────────────────────────────────────────────────────────────

import { Group, Mesh, TorusGeometry, SphereGeometry, MeshStandardMaterial, Color } from 'three';

export function createHashRing() {
  const group = new Group();

  const brassMat = new MeshStandardMaterial({
    color: '#d9a85b',
    roughness: 0.25,
    metalness: 0.9,
  });

  const inkMat = new MeshStandardMaterial({
    color: '#4a5156',
    roughness: 0.7,
    metalness: 0.1,
  });

  const r1 = new Mesh(new TorusGeometry(45, 1.2, 16, 64), brassMat);
  const r2 = new Mesh(new TorusGeometry(38, 0.8, 16, 64), inkMat);
  const r3 = new Mesh(new TorusGeometry(32, 0.5, 16, 64), brassMat);
  
  r2.rotation.x = Math.PI / 2;
  r3.rotation.y = Math.PI / 2;

  group.add(r1);
  group.add(r2);
  group.add(r3);

  // Nodes on outer ring (5 nodes for 5 concepts)
  const N = 5;
  const nodes = [];
  for (let i = 0; i < N; i++) {
    const node = new Mesh(new SphereGeometry(3, 16, 16), new MeshStandardMaterial({ color: '#e9775c', metalness: 0.3, roughness: 0.4 }));
    r1.add(node);
    nodes.push(node);
  }

  // Key point that falls and snaps
  const keyMat = new MeshStandardMaterial({ color: '#5ad1e6', emissive: '#5ad1e6', emissiveIntensity: 0.5 });
  const keyObj = new Mesh(new SphereGeometry(2, 16, 16), keyMat);
  group.add(keyObj);

  let awakeVal = 0;

  return {
    group,
    update({ p, isActive, tiltX, tiltY }) {
      const target = isActive ? 1 : 0.15;
      awakeVal += (target - awakeVal) * 0.04;

      // Group tilt
      group.rotation.x = (tiltX || 0);
      group.rotation.y = (tiltY || 0);

      // Scroll p drives ring rotation
      r1.rotation.z = (p - 0.5) * Math.PI * 4;
      r2.rotation.x = Math.PI / 2 + (p - 0.5) * Math.PI * 2;
      r3.rotation.y = Math.PI / 2 + (p - 0.5) * Math.PI * -3;

      // Arrange nodes evenly on the main ring
      nodes.forEach((node, i) => {
        const a = (i / N) * Math.PI * 2;
        node.position.set(Math.cos(a) * 45, Math.sin(a) * 45, 0);
        // Dim if not active
        node.material.color.lerpColors(new Color('#4a5156'), new Color('#e9775c'), awakeVal);
      });

      // Key point falling and snapping (0 to 1 loop)
      const loopP = (p * 5) % 1;
      const targetNodeIdx = Math.floor(p * 5) % N;
      const targetA = (targetNodeIdx / N) * Math.PI * 2 + r1.rotation.z;

      if (loopP < 0.8) {
        // Falling
        const drop = 100 - loopP * 120;
        keyObj.position.set(Math.cos(targetA) * 45, drop, 0);
        keyMat.emissiveIntensity = 0.5;
      } else {
        // Snapped
        keyObj.position.set(Math.cos(targetA) * 45, Math.sin(targetA) * 45, 0);
        keyMat.emissiveIntensity = 2.0; // flash
      }
    },
  };
}
