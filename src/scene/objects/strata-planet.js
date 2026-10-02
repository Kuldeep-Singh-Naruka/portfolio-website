import { Group, Mesh, CylinderGeometry, MeshBasicMaterial } from 'three';

export function createStrataPlanet() {
  const group = new Group();
  const LAYERS = 5;
  const COLORS = ['#5f8a8b','#4a5156','#9fb7a3','#8da3c1','#7a4658'];
  const meshes = COLORS.map((c, i) => {
    const r = 60-i*8;
    const m = new Mesh(new CylinderGeometry(r,r,16,40,1,false), new MeshBasicMaterial({ color: c, transparent: true, opacity: 0.85 }));
    m.rotation.x = Math.PI/2; m.position.z = i;
    group.add(m); return m;
  });
  return { group, update({ t, isActive }) {
    const awake = isActive ? 1 : 0;
    const sep = awake * 12;
    meshes.forEach((m, i) => { m.position.y += ((i-LAYERS/2)*sep - m.position.y)*0.06; m.material.opacity = 0.3+awake*0.55; m.rotation.z = t*0.05; });
  }};
}
