import { Group, Mesh, SphereGeometry, RingGeometry, MeshBasicMaterial, DoubleSide } from 'three';

export function createOrbitPlanet() {
  const group = new Group();
  const orbitRing = new Mesh(new RingGeometry(72,73.5,80), new MeshBasicMaterial({ color: '#d9a3a8', transparent: true, opacity: 0.2, side: DoubleSide }));
  group.add(orbitRing);
  const planet = new Mesh(new SphereGeometry(32,32,32), new MeshBasicMaterial({ color: '#d9a3a8', transparent: true }));
  group.add(planet);
  const N = 7; const PC = ['#e9775c','#c9694f','#d9a3a8','#9fb7a3','#8da3c1','#5f8a8b','#7a4658'];
  const packets = Array.from({length:N}, (_, i) => { const m = new Mesh(new SphereGeometry(4,8,8), new MeshBasicMaterial({ color: PC[i], transparent: true, opacity: 0 })); group.add(m); return { mesh: m, sent: false, t: 0 }; });
  return { group, update({ t, dt, isActive }) {
    const awake = isActive ? 1 : 0.3; planet.material.opacity = 0.2+awake*0.7; orbitRing.material.opacity = awake*0.25;
    planet.position.set(Math.cos(t*0.2)*72, Math.sin(t*0.2)*72, 0);
    packets.forEach((pkt, i) => {
      if (!isActive) { pkt.t=0; pkt.sent=false; pkt.mesh.material.opacity=0; return; }
      if (pkt.sent) { pkt.mesh.material.opacity=0.9; return; }
      if (t > i*0.4) { pkt.t += dt*1.2; const a=pkt.t*Math.PI*2+(i/N)*Math.PI*2; pkt.mesh.position.set(Math.cos(a)*72,Math.sin(a)*72,0); pkt.mesh.material.opacity=Math.min(pkt.t*2,0.9); if(pkt.t>=1){pkt.sent=true;} }
    });
  }};
}
