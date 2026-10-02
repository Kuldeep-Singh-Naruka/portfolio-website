import { Group, Mesh, SphereGeometry, RingGeometry, MeshBasicMaterial, DoubleSide } from 'three';

export function createBeacon() {
  const group = new Group();
  const core = new Mesh(new SphereGeometry(20,32,32),new MeshBasicMaterial({color:'#e9775c',transparent:true,opacity:0.8}));
  group.add(core);
  const rings = Array.from({length:4},(_, i)=>{
    const r = 24+i*20;
    const m=new Mesh(new RingGeometry(r,r+1.5,64),new MeshBasicMaterial({color:'#e9775c',transparent:true,opacity:0,side:DoubleSide}));
    group.add(m); return {mesh:m, offset:i*0.7};
  });
  return { group, update({t}) { core.scale.setScalar(1+Math.sin(t*0.8)*0.06); rings.forEach(r=>{ const p=(t*0.5+r.offset)%2; r.mesh.scale.setScalar(1+p*0.5); r.mesh.material.opacity=Math.max(0,0.4-p*0.2); }); }};
}
