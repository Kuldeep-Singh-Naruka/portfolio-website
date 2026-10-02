import { Group, Mesh, SphereGeometry, RingGeometry, MeshBasicMaterial, DoubleSide } from 'three';

const PLANET_COLORS = ['#b5a7d4','#d9a85b','#9fb7a3','#c9694f','#5f8a8b','#8da3c1','#d9a3a8','#7a4658'];

export function createOrreryOverview() {
  const group = new Group();
  const sun = new Mesh(new SphereGeometry(18,24,24),new MeshBasicMaterial({color:'#e9775c',transparent:true}));
  group.add(sun);
  const planets = PLANET_COLORS.map((color, i) => {
    const r = 30+i*14;
    const orbit = new Mesh(new RingGeometry(r-0.5,r+0.5,64),new MeshBasicMaterial({color:'#1c2226',transparent:true,opacity:0.08,side:DoubleSide}));
    group.add(orbit);
    const planet = new Mesh(new SphereGeometry(4+i*0.5,12,12),new MeshBasicMaterial({color,transparent:true}));
    group.add(planet);
    return {planet,orbit,r,speed:0.5-i*0.04,phase:(i/8)*Math.PI*2};
  });
  return { group, update({t,isActive}) {
    const awake=isActive?1:0.5; sun.material.opacity=0.5+awake*0.4; sun.scale.setScalar(1+Math.sin(t*0.4)*0.05);
    planets.forEach(p=>{ const a=t*p.speed+p.phase; p.planet.position.set(Math.cos(a)*p.r,Math.sin(a)*p.r*0.45,0); p.planet.material.opacity=0.2+awake*0.7; p.orbit.material.opacity=awake*0.12; });
  }};
}
