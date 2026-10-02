import { Group, Mesh, SphereGeometry, RingGeometry, MeshBasicMaterial, DoubleSide } from 'three';

export function createRingedPlanet() {
  const group = new Group();
  const planet = new Mesh(new SphereGeometry(38,32,32), new MeshBasicMaterial({ color: '#c9694f', transparent: true }));
  group.add(planet);
  const ring = new Mesh(new RingGeometry(48,70,80), new MeshBasicMaterial({ color: '#d9a85b', transparent: true, opacity: 0.3, side: DoubleSide }));
  ring.rotation.x = 0.7; group.add(ring);
  const N = 8;
  const SC = ['#e9775c','#c9694f','#d9a3a8','#9fb7a3','#8da3c1','#5f8a8b','#b5a7d4','#7a4658'];
  const sats = Array.from({length:N}, (_, i) => { const m = new Mesh(new SphereGeometry(3.5,8,8), new MeshBasicMaterial({ color: SC[i], transparent: true })); group.add(m); return m; });
  return { group, update({ t, isActive }) {
    const awake = isActive ? 1 : 0.3;
    planet.material.opacity = 0.3+awake*0.65; ring.material.opacity = awake*0.4;
    sats.forEach((s, i) => { const a = (i/N)*Math.PI*2+t*0.3; const r=60; s.position.set(Math.cos(a)*r, Math.sin(a)*r*Math.sin(0.7), Math.sin(a)*r*Math.cos(0.7)); s.material.opacity = 0.2+awake*0.8; });
  }};
}
