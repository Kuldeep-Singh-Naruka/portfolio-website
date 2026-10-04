// ─── objects/rag-cloud.js ────────────────────────────────────────────────────
// Skill slide 01: Generative AI & LLMs
// A 3D point cloud galaxy. Scroll 'p' brings stars into formation and draws
// connecting RAG links to the central query node.
// ─────────────────────────────────────────────────────────────────────────────

import {
  Group, Mesh, SphereGeometry, ShaderMaterial, Color,
  LineSegments, BufferGeometry, Float32BufferAttribute
} from 'three';

const SPHERE_VERT = `
  varying vec3 vNormal;
  varying vec3 vWorldPos;
  void main() {
    vNormal   = normalize(normalMatrix * normal);
    vWorldPos = (modelMatrix * vec4(position, 1.0)).xyz;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`;

const SPHERE_FRAG = `
  varying vec3 vNormal;
  varying vec3 vWorldPos;
  uniform vec3  uColor;
  uniform float uAwake;
  uniform float uPulse;

  void main() {
    vec3 lightDir = normalize(vec3(-0.5, 0.9, 0.4));
    float diff = max(dot(vNormal, lightDir), 0.0);
    vec3 viewDir = normalize(-vWorldPos);
    float rim = pow(1.0 - max(dot(vNormal, viewDir), 0.0), 3.0);

    vec3 col = uColor * (0.2 + diff * 0.8);
    col += uColor * rim * (0.3 + uPulse * 0.7) * uAwake;
    col = mix(vec3(0.3), col, uAwake);
    gl_FragColor = vec4(col, mix(0.3, 0.95, uAwake));
  }
`;

export function createRagCloud() {
  const group = new Group();
  const N = 7;

  // Final settled positions
  const targetPts = Array.from({ length: N }, (_, i) => {
    const a = (i / N) * Math.PI * 2;
    const r = 38 + Math.sin(i * 1.7) * 12;
    const elev = Math.cos(i * 2.3) * 16;
    return { x: Math.cos(a) * r, y: elev, z: Math.sin(a) * r * 0.5 };
  });

  const queryMat = new ShaderMaterial({
    uniforms: { uColor: { value: new Color('#e9775c') }, uAwake: { value: 0 }, uPulse: { value: 0 } },
    vertexShader: SPHERE_VERT, fragmentShader: SPHERE_FRAG, transparent: true,
  });
  const query = new Mesh(new SphereGeometry(8, 24, 24), queryMat);
  group.add(query);

  const spheres = targetPts.map((_, i) => {
    const mat = new ShaderMaterial({
      uniforms: {
        uColor: { value: new Color('#b5a7d4') },
        uAwake: { value: 0 },
        uPulse: { value: 0 },
      },
      vertexShader: SPHERE_VERT, fragmentShader: SPHERE_FRAG, transparent: true,
    });
    const m = new Mesh(new SphereGeometry(4 + i * 0.5, 16, 16), mat);
    group.add(m);
    return { mesh: m, mat };
  });

  const linePts = new Float32Array(N * 6);
  const lGeo = new BufferGeometry();
  const lAttr = new Float32BufferAttribute(linePts, 3);
  lGeo.setAttribute('position', lAttr);
  const lMat = new ShaderMaterial({
    uniforms: { uAwake: { value: 0 }, uProgress: { value: 0 } },
    vertexShader: `
      varying float vDist;
      void main() { 
        vDist = length(position);
        gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); 
      }
    `,
    fragmentShader: `
      uniform float uAwake; 
      uniform float uProgress;
      varying float vDist;
      void main() { 
        // Fade lines in from center as p increases
        float alpha = smoothstep(100.0 * (1.0 - uProgress), 10.0, vDist);
        gl_FragColor = vec4(0.71, 0.66, 0.83, 0.35 * uAwake * alpha); 
      }
    `,
    transparent: true, depthWrite: false,
  });
  group.add(new LineSegments(lGeo, lMat));

  return {
    group,
    update({ t, p, isActive, tiltX, tiltY }) {
      const target = isActive ? 1 : 0.15;
      queryMat.uniforms.uAwake.value += (target - queryMat.uniforms.uAwake.value) * 0.04;
      queryMat.uniforms.uPulse.value = Math.sin(t * 2.0) * 0.5 + 0.5;
      lMat.uniforms.uAwake.value = queryMat.uniforms.uAwake.value;
      lMat.uniforms.uProgress.value = p;

      targetPts.forEach((tp, i) => {
        // Start scattered, settle into target as p approaches 0.5
        const scatter = (1.0 - Math.sin(p * Math.PI)) * 100 * (i % 2 === 0 ? 1 : -1);
        
        const px = tp.x + scatter + Math.sin(t * 0.35 + i) * 2;
        const py = tp.y + scatter * 0.5 + Math.cos(t * 0.28 + i) * 2;
        const pz = tp.z + Math.sin(t * 0.22 + i * 1.3) * 2;
        
        spheres[i].mesh.position.set(px, py, pz);
        spheres[i].mat.uniforms.uAwake.value += (target - spheres[i].mat.uniforms.uAwake.value) * 0.04;

        lAttr.array[i*6+0] = px; lAttr.array[i*6+1] = py; lAttr.array[i*6+2] = pz;
        lAttr.array[i*6+3] = 0;   lAttr.array[i*6+4] = 0;   lAttr.array[i*6+5] = 0;
      });
      lAttr.needsUpdate = true;

      group.rotation.x = (tiltX || 0) * 0.4 + (p - 0.5) * 1.0;
      group.rotation.y = (tiltY || 0) * 0.4 + (p - 0.5) * 2.0;
    },
  };
}
