import { Group, Mesh, RingGeometry, MeshBasicMaterial, CircleGeometry, ShaderMaterial, Color, DoubleSide } from 'three';

export function createSun() {
  const group = new Group();
  const disc = new Mesh(
    new CircleGeometry(100, 64),
    new ShaderMaterial({
      uniforms: { uColor: { value: new Color('#e9775c') }, uPale: { value: new Color('#f5c5a3') }, uTime: { value: 0 } },
      vertexShader: `varying vec2 vUv; void main() { vUv = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }`,
      fragmentShader: `uniform vec3 uColor; uniform vec3 uPale; uniform float uTime; varying vec2 vUv;
        float grain(vec2 uv, float t) { float n = fract(sin(dot(uv * 300.0 + t, vec2(12.9898, 78.233))) * 43758.5453); return (n - 0.5) * 0.08; }
        void main() { vec2 c = vUv - 0.5; float d = length(c); float alpha = smoothstep(0.5, 0.35, d); vec3 col = mix(uColor, uPale, smoothstep(0.0, 0.5, d)); col += grain(vUv, uTime * 0.3); col *= 1.0 - smoothstep(0.3, 0.5, d) * 0.4; gl_FragColor = vec4(col, alpha * 0.9); }`,
      transparent: true, depthWrite: false
    })
  );
  group.add(disc);
  for (let i = 1; i <= 3; i++) {
    const ring = new Mesh(new RingGeometry(100 + i * 30, 101 + i * 30, 80), new MeshBasicMaterial({ color: '#1c2226', transparent: true, opacity: 0.06, side: DoubleSide }));
    group.add(ring);
  }
  return { group, update({ t }) { disc.material.uniforms.uTime.value = t; const s = 1 + Math.sin(t * 0.4) * 0.015; disc.scale.setScalar(s); } };
}
