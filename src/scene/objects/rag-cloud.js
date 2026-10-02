import { Group, Points, BufferGeometry, Float32BufferAttribute, ShaderMaterial, LineSegments, Color } from 'three';

export function createRagCloud() {
  const group = new Group();
  const N = 7;
  const pts = Array.from({ length: N }, (_, i) => {
    const angle = (i / N) * Math.PI * 2 + Math.random() * 0.5;
    const r = 40 + Math.random() * 40;
    return { x: Math.cos(angle) * r, y: Math.sin(angle) * r, ox: Math.cos(angle) * r, oy: Math.sin(angle) * r };
  });
  const allPts = [...pts, { x: 0, y: 0, ox: 0, oy: 0, isQuery: true }];
  const positions = new Float32Array(allPts.flatMap(p => [p.x, p.y, p.isQuery ? 5 : 0]));
  const geo = new BufferGeometry();
  const posAttr = new Float32BufferAttribute(positions, 3);
  geo.setAttribute('position', posAttr);
  const mat = new ShaderMaterial({
    uniforms: { uColor: { value: new Color('#b5a7d4') }, uAwake: { value: 0 } },
    vertexShader: `uniform float uAwake; void main() { float size = (position.z > 3.0) ? 10.0 : 5.0 + uAwake * 3.0; gl_PointSize = size; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }`,
    fragmentShader: `uniform vec3 uColor; uniform float uAwake; void main() { vec2 c = gl_PointCoord - 0.5; if (length(c) > 0.5) discard; float a = smoothstep(0.5, 0.0, length(c)); vec3 col = mix(vec3(0.4), uColor, uAwake); gl_FragColor = vec4(col, a); }`,
    transparent: true, depthWrite: false
  });
  const cloud = new Points(geo, mat);
  group.add(cloud);
  const lp = new Float32Array(N * 6);
  const lGeo = new BufferGeometry();
  const lAttr = new Float32BufferAttribute(lp, 3);
  lGeo.setAttribute('position', lAttr);
  const lMat = new ShaderMaterial({
    uniforms: { uAwake: { value: 0 } },
    vertexShader: `void main() { gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }`,
    fragmentShader: `uniform float uAwake; void main() { gl_FragColor = vec4(0.71, 0.66, 0.83, 0.3 * uAwake); }`,
    transparent: true, depthWrite: false
  });
  const lines = new LineSegments(lGeo, lMat);
  group.add(lines);
  return { group, update({ t, isActive }) {
    const awake = isActive ? 1 : 0.2; mat.uniforms.uAwake.value += (awake - mat.uniforms.uAwake.value) * 0.05; lMat.uniforms.uAwake.value = mat.uniforms.uAwake.value;
    for (let i = 0; i < N; i++) { posAttr.array[i*3] = pts[i].ox + Math.sin(t*0.4+i)*8; posAttr.array[i*3+1] = pts[i].oy + Math.cos(t*0.3+i)*8; }
    posAttr.needsUpdate = true;
    for (let i = 0; i < N; i++) { lAttr.array[i*6]=posAttr.array[i*3]; lAttr.array[i*6+1]=posAttr.array[i*3+1]; lAttr.array[i*6+2]=0; lAttr.array[i*6+3]=0; lAttr.array[i*6+4]=0; lAttr.array[i*6+5]=0; }
    lAttr.needsUpdate = true;
  }};
}
