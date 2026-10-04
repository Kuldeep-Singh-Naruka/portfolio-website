// ─── objects/ringed-planet.js ────────────────────────────────────────────────
// Skill slide 04: Backend (Saturn)
// Procedural gas-giant with ring. Ring shadow cast on planet.
// Scroll (p) opens ring tilt from edge-on to open, and moves satellites.
// ─────────────────────────────────────────────────────────────────────────────

import { Group, Mesh, SphereGeometry, RingGeometry, ShaderMaterial, MeshBasicMaterial, Color, DoubleSide } from 'three';

const PLANET_VERT = `
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

const PLANET_FRAG = `
  varying vec3 vNormal;
  varying vec3 vWorldPos;
  varying vec2 vUv;
  uniform vec3  uColor;
  uniform float uAwake;
  uniform float uRingTilt;

  float bands(float y) {
    return sin(y * 22.0 + sin(y * 8.0) * 2.5) * 0.5 + 0.5;
  }
  float hash(vec2 p) { return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453); }

  void main() {
    vec3 lightDir = normalize(vec3(-0.6, 0.8, 0.5));
    float diff = max(dot(vNormal, lightDir), 0.0);
    float terminator = smoothstep(-0.1, 0.15, dot(vNormal, lightDir));

    float band = bands(vUv.y);
    float cloud = hash(vUv * 8.0) * 0.15;
    vec3 bandCol = mix(uColor * 0.8, uColor * 1.1 + vec3(0.05, 0.03, 0.0), band + cloud);
    
    // Ring shadow: affected by tilt
    float shadowY = 0.5 - sin(uRingTilt) * 0.1;
    float ringShadow = smoothstep(0.03, 0.0, abs(vUv.y - shadowY));
    bandCol *= 1.0 - ringShadow * 0.5 * (1.0 - diff);

    vec3 col = mix(uColor * 0.15, bandCol, terminator);
    col += vec3(0.8, 0.7, 0.5) * pow(diff, 2.0) * 0.2; // warm spec

    vec3 viewDir = normalize(-vWorldPos);
    float rim = pow(1.0 - max(dot(vNormal, viewDir), 0.0), 3.5);
    col += uColor * rim * 0.3 * uAwake;

    col = mix(vec3(0.25), col, uAwake);
    gl_FragColor = vec4(col, mix(0.5, 1.0, uAwake));
  }
`;

export function createRingedPlanet() {
  const group = new Group();
  const planetColor = new Color('#c9694f');

  const planetMat = new ShaderMaterial({
    uniforms: { uColor: { value: planetColor }, uAwake: { value: 0 }, uRingTilt: { value: 0 } },
    vertexShader: PLANET_VERT,
    fragmentShader: PLANET_FRAG,
    transparent: true,
  });
  
  const planet = new Mesh(new SphereGeometry(42, 64, 64), planetMat);
  group.add(planet);

  // Ring
  const ringMat = new ShaderMaterial({
    uniforms: { uColor: { value: new Color('#d9a85b') }, uAwake: { value: 0 } },
    vertexShader: `varying vec2 vUv; void main() { vUv = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }`,
    fragmentShader: `
      uniform vec3 uColor; uniform float uAwake; varying vec2 vUv;
      void main() {
        float r = length(vUv - 0.5) * 2.0;
        // Ring gaps
        float gap = smoothstep(0.7, 0.72, r) - smoothstep(0.74, 0.76, r);
        float a = smoothstep(1.0, 0.95, r) * smoothstep(0.4, 0.5, r) * (1.0 - gap * 0.8) * 0.6 * uAwake;
        gl_FragColor = vec4(uColor + vec3(0.1), a);
      }`,
    transparent: true, depthWrite: false, side: DoubleSide,
  });
  const ringGroup = new Group();
  const ring = new Mesh(new RingGeometry(52, 85, 90), ringMat);
  ring.rotation.x = Math.PI / 2;
  ringGroup.add(ring);
  group.add(ringGroup);

  // Satellites
  const N = 8;
  const SAT_COLORS = ['#e9775c','#c9694f','#d9a3a8','#9fb7a3','#8da3c1','#5f8a8b','#b5a7d4','#7a4658'];
  const sats = Array.from({ length: N }, (_, i) => {
    const m = new Mesh(
      new SphereGeometry(2.5, 12, 12),
      new MeshBasicMaterial({ color: SAT_COLORS[i], transparent: true })
    );
    ringGroup.add(m);
    return m;
  });

  return {
    group,
    update({ p, isActive, tiltX, tiltY }) {
      const target = isActive ? 1 : 0.15;
      planetMat.uniforms.uAwake.value += (target - planetMat.uniforms.uAwake.value) * 0.04;
      ringMat.uniforms.uAwake.value = planetMat.uniforms.uAwake.value;

      // Scroll p drives tilt from edge-on (0) to open (~45 deg)
      const baseTilt = (p - 0.5) * 1.2; 
      ringGroup.rotation.x = baseTilt + (tiltX || 0);
      ringGroup.rotation.y = (tiltY || 0);
      planetMat.uniforms.uRingTilt.value = ringGroup.rotation.x;

      planet.rotation.y = p * Math.PI * 2 + (tiltY || 0);
      planet.rotation.x = (tiltX || 0);

      sats.forEach((s, i) => {
        const a = (i / N) * Math.PI * 2 + p * Math.PI * 4;
        const r = 70 + (i % 2) * 8;
        s.position.set(Math.cos(a) * r, 0, Math.sin(a) * r);
        s.material.opacity = 0.15 + planetMat.uniforms.uAwake.value * 0.85;
      });
    },
  };
}
