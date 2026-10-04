// ─── objects/constellation.js ────────────────────────────────────────────────
// Skill slide 02: Agentic AI
// A proper 3D constellation graph. Stars are lit spheres with depth.
// Edges are line segments drawn by scroll (p). A packet travels the path by p.
// ─────────────────────────────────────────────────────────────────────────────

import { Group, Mesh, SphereGeometry, ShaderMaterial, Color, LineSegments, BufferGeometry, Float32BufferAttribute, LineBasicMaterial } from 'three';

const STAR_VERT = `
  varying vec3 vNormal;
  varying vec3 vWorldPos;
  void main() {
    vNormal   = normalize(normalMatrix * normal);
    vWorldPos = (modelMatrix * vec4(position, 1.0)).xyz;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`;

const STAR_FRAG = `
  varying vec3 vNormal;
  varying vec3 vWorldPos;
  uniform vec3  uColor;
  uniform float uGlow;
  uniform float uAwake;

  void main() {
    vec3 lightDir = normalize(vec3(-0.5, 0.9, 0.4));
    float diff = max(dot(vNormal, lightDir), 0.0);
    vec3 viewDir = normalize(-vWorldPos);
    float rim = pow(1.0 - max(dot(vNormal, viewDir), 0.0), 3.0);

    vec3 col = uColor * (0.2 + diff * 0.8);
    col += uColor * rim * uGlow * 1.2;
    col = mix(vec3(0.35), col, uAwake);
    gl_FragColor = vec4(col, mix(0.4, 0.95, uAwake));
  }
`;

export function createConstellationGraph() {
  const group = new Group();
  const N = 7;
  const EDGES = [[0,1],[1,2],[2,3],[3,4],[4,5],[5,6],[6,0],[2,5],[1,4]];
  const AWAKE_COLORS = ['#d9a85b','#c9694f','#b5a7d4','#9fb7a3','#8da3c1','#5f8a8b','#7a4658'];

  const positions = Array.from({ length: N }, (_, i) => {
    const a = (i / N) * Math.PI * 2;
    const elev = (i % 2 === 0 ? 1 : -1) * 15 + Math.sin(i * 1.3) * 10;
    const r = 50 + (i % 3) * 12;
    return { x: Math.cos(a) * r, y: elev, z: Math.sin(a) * r * 0.4 };
  });

  const stars = positions.map((pos, i) => {
    const mat = new ShaderMaterial({
      uniforms: {
        uColor: { value: new Color('#4a5156') },
        uGlow:  { value: 0 },
        uAwake: { value: 0 },
      },
      vertexShader: STAR_VERT,
      fragmentShader: STAR_FRAG,
      transparent: true,
    });
    const m = new Mesh(new SphereGeometry(5, 16, 16), mat);
    m.position.set(pos.x, pos.y, pos.z);
    group.add(m);
    return { mesh: m, mat, awakeColor: new Color(AWAKE_COLORS[i]) };
  });

  const edgePts = EDGES.flatMap(([a, b]) => [
    positions[a].x, positions[a].y, positions[a].z,
    positions[b].x, positions[b].y, positions[b].z,
  ]);
  const eGeo = new BufferGeometry();
  eGeo.setAttribute('position', new Float32BufferAttribute(new Float32Array(edgePts), 3));
  // We'll use drawRange to reveal edges by scroll
  eGeo.setDrawRange(0, 0); 
  const eMat = new LineBasicMaterial({ color: '#4a5156', transparent: true, opacity: 0.15 });
  const lines = new LineSegments(eGeo, eMat);
  group.add(lines);

  const packetMat = new ShaderMaterial({
    uniforms: { uColor: { value: new Color('#f5c5a3') }, uAwake: { value: 0 } },
    vertexShader: STAR_VERT,
    fragmentShader: `
      varying vec3 vNormal; varying vec3 vWorldPos;
      uniform vec3 uColor; uniform float uAwake;
      void main() {
        vec3 viewDir = normalize(-vWorldPos);
        float rim = pow(1.0 - max(dot(vNormal, viewDir), 0.0), 2.5);
        gl_FragColor = vec4(uColor + rim * 0.5, uAwake);
      }
    `,
    transparent: true,
  });
  const packet = new Mesh(new SphereGeometry(4, 12, 12), packetMat);
  group.add(packet);

  return {
    group,
    update({ p, isActive, tiltX, tiltY }) {
      const target = isActive ? 1 : 0.15;
      eMat.opacity = 0.05 + target * 0.3;
      packetMat.uniforms.uAwake.value = target;

      // Map scroll progress (0-1) to the sequence of edges
      const totalEdges = EDGES.length;
      const progressEdges = p * totalEdges;
      
      // Reveal lines based on scroll
      const linesToDraw = Math.floor(progressEdges) + 1;
      eGeo.setDrawRange(0, Math.min(linesToDraw * 2, totalEdges * 2));

      // Packet travels exactly on the current edge fraction
      const edgeIdx = Math.max(0, Math.min(Math.floor(progressEdges), totalEdges - 1));
      const frac = progressEdges - edgeIdx;
      
      const ea = EDGES[edgeIdx][0], eb = EDGES[edgeIdx][1];
      const pa = positions[ea], pb = positions[eb];
      packet.position.set(pa.x+(pb.x-pa.x)*frac, pa.y+(pb.y-pa.y)*frac, pa.z+(pb.z-pa.z)*frac);

      stars.forEach((star, i) => {
        // Node glows if the packet is currently moving from/to it
        const glow = (i === ea || i === eb) ? (1.0 - Math.abs(0.5 - frac) * 2.0) : 0;
        star.mat.uniforms.uGlow.value += (glow - star.mat.uniforms.uGlow.value) * 0.15;
        star.mat.uniforms.uAwake.value += (target - star.mat.uniforms.uAwake.value) * 0.04;
        if (isActive) {
          star.mat.uniforms.uColor.value.lerp(star.awakeColor, 0.05);
        } else {
          star.mat.uniforms.uColor.value.lerp(new Color('#4a5156'), 0.05);
        }
      });

      group.rotation.x = (tiltX || 0) * 0.4 + (p - 0.5) * 0.5;
      group.rotation.y = (tiltY || 0) * 0.4 + (p - 0.5) * 1.5;
    },
  };
}
