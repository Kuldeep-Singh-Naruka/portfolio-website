// ─── objects/sun.js ──────────────────────────────────────────────────────────
// Hero sun: pale coral disc offset to top-right, behind text.
// Sized to ≤38vw at any viewport. Dark ember glow in Night mode.
// ─────────────────────────────────────────────────────────────────────────────

import {
  Group, Mesh, CircleGeometry, RingGeometry,
  ShaderMaterial, MeshBasicMaterial, Color, DoubleSide,
} from 'three';

export function createSun() {
  const group = new Group();

  // Main disc — warm soft sun, radius = 80 units (object fills ±100 space)
  const disc = new Mesh(
    new CircleGeometry(80, 64),
    new ShaderMaterial({
      uniforms: {
        uColor:  { value: new Color('#e9775c') },
        uPale:   { value: new Color('#f5c5a3') },
        uNight:  { value: 0 },  // 0=day, 1=night
        uTime:   { value: 0 },
      },
      vertexShader: `
        varying vec2 vUv;
        void main() {
          vUv = uv;
          gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
        }
      `,
      fragmentShader: `
        uniform vec3 uColor;
        uniform vec3 uPale;
        uniform float uNight;
        uniform float uTime;
        varying vec2 vUv;

        float grain(vec2 uv, float t) {
          float n = fract(sin(dot(uv * 200.0 + t, vec2(12.9898, 78.233))) * 43758.5453);
          return (n - 0.5) * 0.06;
        }

        void main() {
          vec2 c = vUv - 0.5;
          float d = length(c);
          float alpha = smoothstep(0.5, 0.32, d);

          // Day: warm coral → pale; Night: dark ember center
          vec3 dayCol   = mix(uColor, uPale, smoothstep(0.0, 0.5, d));
          vec3 nightCol = mix(vec3(0.3, 0.05, 0.02), vec3(0.08, 0.03, 0.01), smoothstep(0.0, 0.5, d));
          vec3 col = mix(dayCol, nightCol, uNight);

          col += grain(vUv, uTime * 0.25) * (1.0 - uNight * 0.5);
          col *= 1.0 - smoothstep(0.28, 0.5, d) * 0.35;

          gl_FragColor = vec4(col, alpha * 0.88);
        }
      `,
      transparent: true,
      depthWrite: false,
    })
  );

  // Offset disc to upper-right so it doesn't cover the text block
  disc.position.set(30, 20, -10);
  group.add(disc);

  // Faint orbit rings
  for (let i = 1; i <= 2; i++) {
    const r = 80 + i * 22;
    const ring = new Mesh(
      new RingGeometry(r - 0.8, r + 0.8, 80),
      new MeshBasicMaterial({ color: '#1c2226', transparent: true, opacity: 0.05, side: DoubleSide })
    );
    ring.position.copy(disc.position);
    group.add(ring);
  }

  // Atmospherics — very soft rim
  const rim = new Mesh(
    new CircleGeometry(90, 64),
    new ShaderMaterial({
      uniforms: { uNight: { value: 0 } },
      vertexShader: `varying vec2 vUv; void main() { vUv = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }`,
      fragmentShader: `
        uniform float uNight;
        varying vec2 vUv;
        void main() {
          float d = length(vUv - 0.5);
          float a = smoothstep(0.5, 0.4, d) * smoothstep(0.3, 0.5, d) * 0.18;
          vec3 col = mix(vec3(0.95, 0.7, 0.5), vec3(0.9, 0.2, 0.0), uNight);
          gl_FragColor = vec4(col, a * (1.0 - uNight * 0.6));
        }
      `,
      transparent: true,
      depthWrite: false,
    })
  );
  rim.position.copy(disc.position);
  rim.position.z = -11;
  group.add(rim);

  // Cache mat refs for update
  const mats = [disc.material, rim.material];

  return {
    group,
    update({ t }) {
      const isNight = document.body.classList.contains('night') ? 1 : 0;
      mats.forEach(m => {
        if (m.uniforms.uTime) m.uniforms.uTime.value = t;
        if (m.uniforms.uNight) m.uniforms.uNight.value += (isNight - m.uniforms.uNight.value) * 0.05;
      });
      const breathe = 1 + Math.sin(t * 0.35) * 0.012;
      disc.scale.setScalar(breathe);
      rim.scale.setScalar(breathe + 0.02);
    },
  };
}
