// ─── objects/planet-moons.js ─────────────────────────────────────────────────
// Skill slide 03: Languages (The Moon)
// Procedural craters (voronoi + fbm) or NASA maps if available.
// Scroll `p` drives lunar phases (light direction) and libration.
// ─────────────────────────────────────────────────────────────────────────────

import {
  Group, Mesh, SphereGeometry, ShaderMaterial, Color, DoubleSide, MeshBasicMaterial, RingGeometry, TextureLoader
} from 'three';

const MOON_VERT = `
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

const MOON_FRAG = `
  varying vec3 vNormal;
  varying vec3 vWorldPos;
  varying vec2 vUv;
  uniform float uAwake;
  uniform float uProgress; // Scroll progress
  uniform sampler2D tColor;
  uniform sampler2D tNormal;
  uniform int hasMaps;

  float hash(vec2 p) {
    return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453);
  }
  float voronoi(vec2 uv) {
    vec2 id = floor(uv);
    vec2 f  = fract(uv);
    float minDist = 1.0;
    for (int y = -1; y <= 1; y++) {
      for (int x = -1; x <= 1; x++) {
        vec2 neighbor = vec2(x, y);
        vec2 point = vec2(hash(id + neighbor), hash(id + neighbor + 0.1));
        vec2 diff = neighbor + point - f;
        minDist = min(minDist, length(diff));
      }
    }
    return minDist;
  }

  void main() {
    // Scroll progress p (0 to 1) drives the light direction from -X to +X (phases)
    float angle = (uProgress - 0.5) * 4.0; 
    vec3 lightDir = normalize(vec3(sin(angle), 0.5, cos(angle)));
    
    float diff = max(dot(vNormal, lightDir), 0.0);
    float terminator = smoothstep(-0.05, 0.15, dot(vNormal, lightDir));

    vec3 dayColor;
    if (hasMaps == 1) {
      dayColor = texture2D(tColor, vUv).rgb;
      // Normally we'd use tangent space normals, but for fallback this works
      diff *= 0.5 + 0.5 * texture2D(tNormal, vUv).r; 
    } else {
      vec2 cUv = vUv * 6.0;
      float mare = smoothstep(0.45, 0.55, voronoi(cUv * 0.8));
      float highland = voronoi(cUv * 1.6) * 0.4;
      float craters  = smoothstep(0.18, 0.25, 1.0 - voronoi(cUv * 3.0));
      float base = 0.72 + highland * 0.12 - mare * 0.18 - craters * 0.2;
      dayColor = vec3(base);
    }

    vec3 litTint  = mix(vec3(0.78, 0.76, 0.72), vec3(0.9,  0.88, 0.84), diff);
    vec3 darkTint = vec3(0.08, 0.1, 0.12); // dim but visible shadow side (hemisphere fill)
    
    // Ambient light fill from darkTint, directional light from litTint
    vec3 col = darkTint + dayColor * litTint * diff * terminator;

    // Rim lighting (fresnel)
    vec3 viewDir = normalize(-vWorldPos);
    float rim = pow(1.0 - max(dot(vNormal, viewDir), 0.0), 3.0);
    col += vec3(0.3, 0.35, 0.4) * rim * 0.15 * uAwake;

    col = mix(vec3(0.25), col, uAwake);
    gl_FragColor = vec4(col, mix(0.5, 1.0, uAwake));
  }
`;

export function createPlanetMoons(data) {
  const group = new Group();
  const moonCount = parseInt(data?.moonCount || '4', 10);

  const mat = new ShaderMaterial({
    uniforms: { 
      uAwake: { value: 0 }, 
      uProgress: { value: 0 },
      tColor: { value: null },
      tNormal: { value: null },
      hasMaps: { value: 0 }
    },
    vertexShader: MOON_VERT,
    fragmentShader: MOON_FRAG,
    transparent: true,
  });

  const mesh = new Mesh(new SphereGeometry(70, 96, 96), mat);
  group.add(mesh);

  // Lazy load textures if they exist in public/assets
  const loader = new TextureLoader();
  loader.load('/assets/moon_color.jpg', tex => { mat.uniforms.tColor.value = tex; mat.uniforms.hasMaps.value = 1; }, undefined, () => {});
  loader.load('/assets/moon_normal.jpg', tex => { mat.uniforms.tNormal.value = tex; }, undefined, () => {});

  const MINI_COLORS = ['#c9694f', '#d9a3a8', '#d9a85b', '#8da3c1'];
  const minis = Array.from({ length: moonCount }, (_, i) => {
    const orbitR = 85 + i * 8;
    const m = new Mesh(
      new SphereGeometry(3, 16, 16),
      new MeshBasicMaterial({ color: MINI_COLORS[i % MINI_COLORS.length], transparent: true })
    );
    const ring = new Mesh(
      new RingGeometry(orbitR - 0.4, orbitR + 0.4, 64),
      new MeshBasicMaterial({ color: '#1c2226', transparent: true, opacity: 0.06, side: DoubleSide })
    );
    group.add(ring);
    group.add(m);
    return { mesh: m, orbitR, phase: (i / moonCount) * Math.PI * 2, speed: 2.0 + i * 0.5 };
  });

  return {
    group,
    update({ p, isActive, tiltX, tiltY }) {
      const target = isActive ? 1 : 0.15;
      mat.uniforms.uAwake.value += (target - mat.uniforms.uAwake.value) * 0.04;
      mat.uniforms.uProgress.value = p;

      // Scroll p drives the moon's Y rotation (libration)
      mesh.rotation.y = (p - 0.5) * 1.5 + (tiltY || 0);
      mesh.rotation.x = (tiltX || 0);

      // Scroll p drives the orbit of satellites
      minis.forEach(m => {
        const a = p * m.speed * Math.PI * 2 + m.phase;
        m.mesh.position.set(Math.cos(a) * m.orbitR, Math.sin(a) * m.orbitR * 0.2, Math.sin(a) * m.orbitR * 0.3);
        m.mesh.material.opacity = 0.15 + mat.uniforms.uAwake.value * 0.85;
      });
    },
  };
}
