// ─── objects/strata-planet.js ────────────────────────────────────────────────
// Skill slide 05: Databases (Jupiter)
// Five prominent bands mapping to 5 databases. Scroll applies differential rotation.
// ─────────────────────────────────────────────────────────────────────────────

import { Group, Mesh, SphereGeometry, ShaderMaterial, Color } from 'three';

const STRATA_VERT = `
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

const STRATA_FRAG = `
  varying vec3 vNormal;
  varying vec3 vWorldPos;
  varying vec2 vUv;
  uniform vec3  uColor;
  uniform float uAwake;
  uniform float uIndex;
  uniform float uActiveBand; // drives which band lights up

  float hash(vec2 p) { return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453); }

  void main() {
    vec3 lightDir = normalize(vec3(-0.6, 0.8, 0.5));
    float diff = max(dot(vNormal, lightDir), 0.0);
    float terminator = smoothstep(-0.15, 0.2, dot(vNormal, lightDir));

    // Gas texture
    float cloud = hash(vUv * 15.0) * 0.1;
    vec3 base = uColor + vec3(cloud);

    vec3 col = base;
    col = mix(col * 0.15, col * (0.6 + diff * 0.5), terminator);
    col += base * pow(diff, 4.0) * 0.3; // specular

    // Highlight active band
    float highlight = smoothstep(0.4, 0.0, abs(uIndex - uActiveBand));
    col += uColor * highlight * 0.5 * uAwake;

    // Rim
    vec3 viewDir = normalize(-vWorldPos);
    float rim = pow(1.0 - max(dot(vNormal, viewDir), 0.0), 3.0);
    col += base * rim * 0.4 * uAwake;

    col = mix(vec3(0.2 + uIndex * 0.06), col, uAwake);
    float alpha = mix(0.6, 1.0, uAwake);
    gl_FragColor = vec4(col, alpha);
  }
`;

// PostgreSQL, MySQL, MongoDB, Redis, ChromaDB
const LAYER_COLORS = ['#5f8a8b', '#4a6b7a', '#9fb7a3', '#8da3c1', '#7a4658'];

export function createStrataPlanet() {
  const group = new Group();
  
  // Cut sphere into 5 stacked bands (slices)
  const layers = LAYER_COLORS.map((c, i) => {
    const mat = new ShaderMaterial({
      uniforms: {
        uColor: { value: new Color(c) },
        uAwake: { value: 0 },
        uIndex: { value: i / (LAYER_COLORS.length - 1) },
        uActiveBand: { value: 0 },
      },
      vertexShader: STRATA_VERT,
      fragmentShader: STRATA_FRAG,
      transparent: true,
    });
    
    // Create a sphere segment (phiStart, phiLength, thetaStart, thetaLength)
    const thetaStart = (i / LAYER_COLORS.length) * Math.PI;
    const thetaLength = (1 / LAYER_COLORS.length) * Math.PI;
    
    const mesh = new Mesh(new SphereGeometry(50, 48, 24, 0, Math.PI * 2, thetaStart, thetaLength), mat);
    group.add(mesh);
    return { mesh, mat, speed: 1.0 + (i % 2 === 0 ? 0.5 : -0.5) };
  });

  return {
    group,
    update({ p, isActive, tiltX, tiltY }) {
      const target = isActive ? 1 : 0.15;
      const sep = isActive ? (p - 0.5) * 8 : 0; // slight separation at edges of scroll

      // Scroll p drives which band lights up
      const activeBand = Math.min(Math.max(p * 1.5 - 0.25, 0.0), 1.0);

      layers.forEach((layer, i) => {
        layer.mat.uniforms.uAwake.value += (target - layer.mat.uniforms.uAwake.value) * 0.04;
        layer.mat.uniforms.uActiveBand.value = activeBand;
        
        // Vertical separation effect
        const targetY = (i - layers.length / 2 + 0.5) * sep;
        layer.mesh.position.y += (targetY - layer.mesh.position.y) * 0.1;
        
        // Differential rotation driven by scroll p
        layer.mesh.rotation.y = (p - 0.5) * Math.PI * 2 * layer.speed + (tiltY || 0);
        layer.mesh.rotation.x = (tiltX || 0);
      });
    },
  };
}
