import { Group, Mesh, BoxGeometry, SphereGeometry, MeshBasicMaterial } from 'three';

export function createSatellite() {
  const group = new Group();
  const body = new Mesh(new BoxGeometry(24,14,10), new MeshBasicMaterial({ color: '#8da3c1', transparent: true }));
  group.add(body);
  const pGeo = new BoxGeometry(28,8,1); const pMat = new MeshBasicMaterial({ color: '#4a5156', transparent: true, opacity: 0.7 });
  const pL = new Mesh(pGeo, pMat); pL.position.set(-28,0,0); group.add(pL);
  const pR = new Mesh(pGeo, pMat); pR.position.set(28,0,0); group.add(pR);
  const N = 8; const MC = ['#9fb7a3','#8da3c1','#c9694f','#d9a85b','#b5a7d4','#5f8a8b','#d9a3a8','#7a4658'];
  const mods = Array.from({length:N}, (_, i) => { const m = new Mesh(new BoxGeometry(6,6,6), new MeshBasicMaterial({ color: MC[i], transparent: true, opacity: 0 })); m.position.set(-20+i*6, 12+Math.sin(i)*4, 0); group.add(m); return m; });
  return { group, update({ t, isActive }) {
    const awake = isActive ? 1 : 0.3; body.material.opacity = 0.3+awake*0.65; group.rotation.z = Math.sin(t*0.2)*0.1;
    mods.forEach((m, i) => { const d = Math.max(0, Math.min(1, awake*N-i)); m.material.opacity = d*0.9; m.position.y = 12+Math.sin(i)*4-(1-d)*30; });
  }};
}
