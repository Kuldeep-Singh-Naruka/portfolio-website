import { Group, Mesh, SphereGeometry, MeshBasicMaterial, LineSegments, BufferGeometry, Float32BufferAttribute } from 'three';

export function createConstellationGraph() {
  const group = new Group();
  const N = 7;
  const EDGES = [[0,1],[1,2],[2,3],[3,4],[4,5],[5,6],[6,0],[2,5]];
  const positions = Array.from({ length: N }, (_, i) => { const a = (i/N)*Math.PI*2; const r = 55+(i%2)*20; return { x: Math.cos(a)*r, y: Math.sin(a)*r }; });
  const AWAKE_COLORS = ['#d9a85b','#c9694f','#b5a7d4','#9fb7a3','#8da3c1','#5f8a8b','#7a4658'];
  const stars = positions.map((p) => { const m = new Mesh(new SphereGeometry(4,8,8), new MeshBasicMaterial({ color: '#4a5156', transparent: true })); m.position.set(p.x,p.y,0); group.add(m); return m; });
  const edgePts = EDGES.flatMap(([a,b]) => [positions[a].x,positions[a].y,0,positions[b].x,positions[b].y,0]);
  const eGeo = new BufferGeometry(); eGeo.setAttribute('position', new Float32BufferAttribute(new Float32Array(edgePts), 3));
  const eMat = new MeshBasicMaterial({ color: '#4a5156', transparent: true, opacity: 0.15 });
  group.add(new LineSegments(eGeo, eMat));
  const packet = new Mesh(new SphereGeometry(3,8,8), new MeshBasicMaterial({ color: '#d9a85b', transparent: true, opacity: 0 }));
  group.add(packet);
  let pT = 0;
  return { group, update({ dt, isActive }) {
    const awake = isActive ? 1 : 0;
    eMat.opacity = 0.08 + awake * 0.25;
    if (isActive) pT += dt * 0.8;
    const edge = EDGES[Math.floor(pT) % EDGES.length];
    const frac = pT % 1;
    const a = positions[edge[0]], b = positions[edge[1]];
    packet.position.set(a.x+(b.x-a.x)*frac, a.y+(b.y-a.y)*frac, 1);
    packet.material.opacity = awake;
    stars.forEach((star, i) => { star.material.color.set(awake > 0 ? AWAKE_COLORS[i] : '#4a5156'); star.material.opacity = 0.2 + awake * 0.8; });
  }};
}
