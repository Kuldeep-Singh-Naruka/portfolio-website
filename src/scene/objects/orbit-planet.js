// ─── objects/orbit-planet.js ─────────────────────────────────────────────────
// Skill slide 07: Payments & Integrations (Earth at night)
// Procedural night earth with city lights. Scroll p rotates globe and draws idempotent arcs.
// ─────────────────────────────────────────────────────────────────────────────

import { Group, Mesh, SphereGeometry, ShaderMaterial, Color, Curve, Vector3, TubeGeometry, MeshBasicMaterial } from 'three';

const EARTH_VERT = `
  varying vec3 vNormal;
  varying vec3 vWorldPos;
  varying vec2 vUv;
  void main() {
    vNormal   = normalize(normalMatrix * normal);
    vWorldPos = (modelMatrix * vec4(position, 1.0)).xyz;
    vUv       = uv;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`;

const EARTH_FRAG = `
  varying vec3 vNormal;
  varying vec3 vWorldPos;
  varying vec2 vUv;
  uniform float uAwake;

  float hash(vec2 p) { return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453); }
  float noise(vec2 p) {
    vec2 i = floor(p), f = fract(p);
    vec2 u = f*f*(3.0-2.0*f);
    return mix(mix(hash(i + vec2(0.0,0.0)), hash(i + vec2(1.0,0.0)), u.x),
               mix(hash(i + vec2(0.0,1.0)), hash(i + vec2(1.0,1.0)), u.x), u.y);
  }

  void main() {
    // City lights map (procedural continents)
    float land = smoothstep(0.45, 0.55, noise(vUv * 10.0));
    float cities = pow(noise(vUv * 40.0), 4.0) * land;

    vec3 baseCol = vec3(0.02, 0.05, 0.1); // Ocean
    baseCol = mix(baseCol, vec3(0.05, 0.08, 0.1), land); // Land
    
    // Add glowing cities
    vec3 col = baseCol + vec3(1.0, 0.9, 0.6) * cities * 2.0;

    // Rim lighting (atmosphere)
    vec3 viewDir = normalize(-vWorldPos);
    float rim = pow(1.0 - max(dot(vNormal, viewDir), 0.0), 3.0);
    col += vec3(0.2, 0.5, 0.8) * rim * 0.5 * uAwake;

    col = mix(vec3(0.15), col, uAwake);
    gl_FragColor = vec4(col, mix(0.7, 1.0, uAwake));
  }
`;

// Simple cubic bezier curve for arcs
class ArcCurve extends Curve {
  constructor(p1, p2, height) {
    super();
    this.p1 = p1;
    this.p2 = p2;
    // Midpoint elevated
    const mid = p1.clone().lerp(p2, 0.5).normalize().multiplyScalar(45 + height);
    this.mid = mid;
  }
  getPoint(t, optionalTarget = new Vector3()) {
    // Quadratic bezier
    const x = (1-t)*(1-t)*this.p1.x + 2*(1-t)*t*this.mid.x + t*t*this.p2.x;
    const y = (1-t)*(1-t)*this.p1.y + 2*(1-t)*t*this.mid.y + t*t*this.p2.y;
    const z = (1-t)*(1-t)*this.p1.z + 2*(1-t)*t*this.mid.z + t*t*this.p2.z;
    return optionalTarget.set(x, y, z);
  }
}

export function createOrbitPlanet() {
  const group = new Group();

  const planetMat = new ShaderMaterial({
    uniforms: { uAwake: { value: 0 } },
    vertexShader: EARTH_VERT,
    fragmentShader: EARTH_FRAG,
    transparent: true,
  });
  
  const planet = new Mesh(new SphereGeometry(45, 64, 64), planetMat);
  group.add(planet);

  // Idempotent Arcs
  const arcs = [];
  const arcCount = 7;
  for (let i = 0; i < arcCount; i++) {
    // Randomish points on sphere
    const lat1 = (Math.random() - 0.5) * Math.PI;
    const lon1 = (Math.random() - 0.5) * Math.PI * 2;
    const lat2 = (Math.random() - 0.5) * Math.PI;
    const lon2 = (Math.random() - 0.5) * Math.PI * 2;

    const p1 = new Vector3(Math.cos(lat1)*Math.cos(lon1), Math.sin(lat1), Math.cos(lat1)*Math.sin(lon1)).multiplyScalar(45);
    const p2 = new Vector3(Math.cos(lat2)*Math.cos(lon2), Math.sin(lat2), Math.cos(lat2)*Math.sin(lon2)).multiplyScalar(45);
    
    const curve = new ArcCurve(p1, p2, 10 + Math.random() * 10);
    const geo = new TubeGeometry(curve, 32, 0.4, 8, false);
    
    // Shader to draw arc based on progress
    const mat = new ShaderMaterial({
      uniforms: { uDrawProgress: { value: 0 }, uColor: { value: new Color('#5ad1e6') } },
      vertexShader: `
        varying vec2 vUv;
        void main() { vUv = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }
      `,
      fragmentShader: `
        varying vec2 vUv;
        uniform float uDrawProgress;
        uniform vec3 uColor;
        void main() {
          if (vUv.x > uDrawProgress) discard;
          // Glowing head
          float head = smoothstep(uDrawProgress - 0.1, uDrawProgress, vUv.x);
          gl_FragColor = vec4(uColor + vec3(head), 0.7 + head * 0.3);
        }
      `,
      transparent: true,
    });
    
    const mesh = new Mesh(geo, mat);
    planet.add(mesh);
    
    // Each arc triggers at a specific global scroll p
    arcs.push({ mesh, mat, triggerP: i / arcCount });
  }

  return {
    group,
    update({ p, isActive, tiltX, tiltY }) {
      const target = isActive ? 1 : 0.15;
      planetMat.uniforms.uAwake.value += (target - planetMat.uniforms.uAwake.value) * 0.04;

      // Group rotation
      planet.rotation.x = (tiltX || 0);
      planet.rotation.y = (p - 0.5) * Math.PI * 2 + (tiltY || 0);

      // Idempotent arcs: once p passes triggerP, draw it.
      arcs.forEach(arc => {
        // Draw rapidly over a small p window
        const drawP = Math.max(0, Math.min((p - arc.triggerP) * 10, 1.0));
        arc.mat.uniforms.uDrawProgress.value = drawP;
      });
    },
  };
}
