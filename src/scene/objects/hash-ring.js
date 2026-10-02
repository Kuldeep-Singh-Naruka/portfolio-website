import { Group, Mesh, RingGeometry, SphereGeometry, MeshBasicMaterial, DoubleSide } from 'three';

export function createHashRing() {
  const group = new Group();
  const N = 5; const R = 65;
  const ring = new Mesh(new RingGeometry(R-1,R+1,80), new MeshBasicMaterial({ color: '#7a4658', transparent: true, opacity: 0.2, side: DoubleSide }));
  group.add(ring);
  const NC = ['#c9694f','#d9a85b','#9fb7a3','#8da3c1','#b5a7d4'];
  const nodes = Array.from({length:N}, (_, i) => { const a=(i/N)*Math.PI*2; const m=new Mesh(new SphereGeometry(7,12,12),new MeshBasicMaterial({color:NC[i],transparent:true})); m.position.set(Math.cos(a)*R,Math.sin(a)*R,0); group.add(m); return m; });
  const keys = Array.from({length:8}, (_, i) => { const m=new Mesh(new SphereGeometry(3,8,8),new MeshBasicMaterial({color:'#5b2f3b',transparent:true,opacity:0})); group.add(m); return {mesh:m, snapNode:i%N, py:R+60+i*10, vy:0, snapped:false}; });
  return { group, update({ t, dt, isActive }) {
    const awake = isActive ? 1 : 0.2; ring.material.opacity = awake*0.25; ring.rotation.z = t*0.05;
    nodes.forEach((n, i) => { n.material.opacity=0.2+awake*0.7; n.scale.setScalar(1+(isActive?0.1*Math.sin(t*1.5+i):0)); });
    keys.forEach((k) => {
      k.mesh.material.opacity = awake*0.8;
      if (!isActive) { k.snapped=false; k.py=R+60; k.vy=0; return; }
      if (!k.snapped) { k.vy -= dt*80; k.py += k.vy*dt; const tgt=nodes[k.snapNode]; if(k.py<=tgt.position.y+8){k.py=tgt.position.y;k.snapped=true;} k.mesh.position.set(tgt.position.x,k.py,2); }
      else { k.mesh.position.set(nodes[k.snapNode].position.x,nodes[k.snapNode].position.y,2); }
    });
  }};
}
