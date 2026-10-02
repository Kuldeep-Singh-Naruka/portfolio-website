import { Group, Mesh, SphereGeometry, RingGeometry, MeshBasicMaterial, DoubleSide } from 'three';

export function createPlanetMoons(data) {
  const group = new Group();
  const moonCount = parseInt(data?.moonCount || '4', 10);
  const planetColor = data?.planetColor || '#9fb7a3';
  const planet = new Mesh(new SphereGeometry(38,32,32), new MeshBasicMaterial({ color: planetColor, transparent: true, opacity: 0.9 }));
  group.add(planet);
  const MOON_COLORS = ['#c9694f','#d9a3a8','#d9a85b','#8da3c1'];
  const moons = Array.from({ length: moonCount }, (_, i) => {
    const orbitR = 55 + i * 18;
    const mesh = new Mesh(new SphereGeometry(5+i*1.5,10,10), new MeshBasicMaterial({ color: MOON_COLORS[i%MOON_COLORS.length], transparent: true }));
    const orbit = new Mesh(new RingGeometry(orbitR-0.5,orbitR+0.5,64), new MeshBasicMaterial({ color: '#1c2226', transparent: true, opacity: 0.06, side: DoubleSide }));
    group.add(orbit); group.add(mesh);
    return { mesh, orbitR, speed: 0.3+i*0.15, phase: (i/moonCount)*Math.PI*2 };
  });
  return { group, update({ t, isActive }) {
    const awake = isActive ? 1 : 0.3; planet.material.opacity = 0.3 + awake * 0.6;
    moons.forEach(m => { const a = t*m.speed+m.phase; m.mesh.position.set(Math.cos(a)*m.orbitR, Math.sin(a)*m.orbitR*0.4, Math.sin(a)*m.orbitR*0.3); m.mesh.material.opacity = 0.2+awake*0.8; });
  }};
}
