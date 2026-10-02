import { Group, Mesh, SphereGeometry, MeshBasicMaterial, BufferGeometry, Float32BufferAttribute, Line, LineBasicMaterial } from 'three';

export function createFlightRoute(data) {
  const group = new Group();
  const waypointsRaw = (data?.waypoints || 'A,B,C,D,E').split(',');
  const N = waypointsRaw.length;
  const pts = Array.from({length:N}, (_, i) => { const a=(i/(N-1))*Math.PI-Math.PI/2; const r=60; return { x:Math.cos(a)*r, y:Math.sin(a)*r*0.5, label:waypointsRaw[i].trim() }; });
  const rGeo = new BufferGeometry();
  rGeo.setAttribute('position', new Float32BufferAttribute(new Float32Array(pts.flatMap(p=>[p.x,p.y,0])), 3));
  const routeLine = new Line(rGeo, new LineBasicMaterial({ color: '#4a5156', transparent: true, opacity: 0.3 }));
  group.add(routeLine);
  const COLORS = ['#c9694f','#d9a85b','#9fb7a3','#8da3c1','#b5a7d4'];
  const stars = pts.map((p, i) => { const m=new Mesh(new SphereGeometry(5,12,12),new MeshBasicMaterial({color:COLORS[i%COLORS.length],transparent:true,opacity:0.3})); m.position.set(p.x,p.y,0); group.add(m); return m; });
  const probe = new Mesh(new SphereGeometry(6,10,10),new MeshBasicMaterial({color:'#e9775c',transparent:true}));
  group.add(probe);
  return { group, update({ t, isActive }) {
    const awake = isActive ? 1 : 0.2; routeLine.material.opacity = 0.1+awake*0.25;
    const pT = isActive ? (t*0.2)%1 : 0;
    const seg = pT*(N-1); const sIdx = Math.min(Math.floor(seg),N-2); const frac=seg-sIdx;
    probe.position.set(pts[sIdx].x+(pts[sIdx+1].x-pts[sIdx].x)*frac, pts[sIdx].y+(pts[sIdx+1].y-pts[sIdx].y)*frac, 1);
    probe.material.opacity = awake;
    stars.forEach((s, i) => { const passed=seg>=i; s.material.opacity=passed?0.3+awake*0.6:0.15; const ts=passed?1.4:1; s.scale.setScalar(s.scale.x+(ts-s.scale.x)*0.08); });
  }};
}
