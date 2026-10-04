import {
  Group, Mesh, IcosahedronGeometry, MeshPhysicalMaterial,
  BufferGeometry, BufferAttribute, Points, ShaderMaterial,
  Color, Vector3
} from 'three';

// Morph target indices
export const SHAPES = {
  HERO: 0,
  GEN_AI: 1,
  AGENTIC: 2,
  LANGUAGES: 3,
  DATABASES: 4,
  DEVOPS: 5,
  PAYMENTS: 6,
  ARCHITECTURE: 7,
  PROJECTS: 8
};

export function createMasterScene(isMobile) {
  const group = new Group();

  // 1. Central Core Object
  const coreGeo = new IcosahedronGeometry(2, 4);
  const coreMat = new MeshPhysicalMaterial({
    color: new Color('#f5eee6'),
    metalness: 0.1,
    roughness: 0.4,
    transmission: 0.8, // glass-like
    thickness: 1.5,
    ior: 1.5,
    envMapIntensity: 1.0,
    transparent: true
  });
  const coreMesh = new Mesh(coreGeo, coreMat);
  group.add(coreMesh);

  // 2. Particle System (Morphing)
  const numParticles = isMobile ? 800 : 2500;
  
  const pBase = new Float32Array(numParticles * 3);
  const pGenAI = new Float32Array(numParticles * 3);
  const pAgentic = new Float32Array(numParticles * 3);
  const pLang = new Float32Array(numParticles * 3);
  const pData = new Float32Array(numParticles * 3);
  const pDev = new Float32Array(numParticles * 3);
  const pPay = new Float32Array(numParticles * 3);
  const pArch = new Float32Array(numParticles * 3);
  const pProj = new Float32Array(numParticles * 3);

  const randomPointInSphere = (radius) => {
    const u = Math.random();
    const v = Math.random();
    const theta = u * 2.0 * Math.PI;
    const phi = Math.acos(2.0 * v - 1.0);
    const r = Math.cbrt(Math.random()) * radius;
    const sinPhi = Math.sin(phi);
    return new Vector3(r * sinPhi * Math.cos(theta), r * sinPhi * Math.sin(theta), r * Math.cos(phi));
  };

  for (let i = 0; i < numParticles; i++) {
    const i3 = i * 3;
    
    // 0: HERO (Orbiting the core closely)
    const h = randomPointInSphere(2.5);
    pBase[i3] = h.x; pBase[i3+1] = h.y; pBase[i3+2] = h.z;

    // 1: GEN AI (Scattered cloud / neural network)
    const g = randomPointInSphere(8);
    pGenAI[i3] = g.x; pGenAI[i3+1] = g.y; pGenAI[i3+2] = g.z;

    // 2: AGENTIC (Concentric rings)
    const ring = Math.floor(Math.random() * 3) + 1; // 3 rings
    const angle = Math.random() * Math.PI * 2;
    const rRadius = ring * 3;
    pAgentic[i3] = Math.cos(angle) * rRadius;
    pAgentic[i3+1] = (Math.random() - 0.5) * 0.5;
    pAgentic[i3+2] = Math.sin(angle) * rRadius;

    // 3: LANGUAGES (Layered geometric planes)
    const layer = Math.floor(Math.random() * 4);
    pLang[i3] = (Math.random() - 0.5) * 10;
    pLang[i3+1] = (layer - 1.5) * 2; // Y layers
    pLang[i3+2] = (Math.random() - 0.5) * 10;

    // 4: DATABASES (3D Grid)
    const gridSize = 4;
    const spacing = 2;
    const gx = Math.floor(Math.random() * gridSize) - gridSize/2;
    const gy = Math.floor(Math.random() * gridSize) - gridSize/2;
    const gz = Math.floor(Math.random() * gridSize) - gridSize/2;
    pData[i3] = gx * spacing + (Math.random()-0.5)*0.2;
    pData[i3+1] = gy * spacing + (Math.random()-0.5)*0.2;
    pData[i3+2] = gz * spacing + (Math.random()-0.5)*0.2;

    // 5: DEVOPS (Flowing tube/path)
    const t = Math.random() * Math.PI * 2; // along path
    const pathRad = 1.5;
    const tubeRad = Math.random() * 1.0;
    const tubeAng = Math.random() * Math.PI * 2;
    pDev[i3] = Math.cos(t) * pathRad * 4 + Math.cos(tubeAng) * tubeRad;
    pDev[i3+1] = Math.sin(t * 2) * 2 + Math.sin(tubeAng) * tubeRad;
    pDev[i3+2] = Math.sin(t) * pathRad * 4;

    // 6: PAYMENTS (Connected node clusters)
    const cluster = Math.floor(Math.random() * 5);
    const cx = Math.cos(cluster * Math.PI * 2 / 5) * 5;
    const cz = Math.sin(cluster * Math.PI * 2 / 5) * 5;
    const cp = randomPointInSphere(1.5);
    pPay[i3] = cx + cp.x;
    pPay[i3+1] = cp.y;
    pPay[i3+2] = cz + cp.z;

    // 7: ARCHITECTURE (7 vertical levels)
    const archLevel = Math.floor(Math.random() * 7);
    const ay = (archLevel - 3) * 1.5; // spread vertically
    const aRad = 3 - Math.abs(archLevel - 3) * 0.3; // wider in middle
    const aAng = Math.random() * Math.PI * 2;
    const aDist = Math.random() * aRad;
    pArch[i3] = Math.cos(aAng) * aDist;
    pArch[i3+1] = ay;
    pArch[i3+2] = Math.sin(aAng) * aDist;

    // 8: PROJECTS (Dynamic noisy field)
    const proj = randomPointInSphere(6);
    pProj[i3] = proj.x; pProj[i3+1] = proj.y; pProj[i3+2] = proj.z;
  }

  const geometry = new BufferGeometry();
  geometry.setAttribute('position', new BufferAttribute(pBase, 3));
  geometry.setAttribute('aGenAI', new BufferAttribute(pGenAI, 3));
  geometry.setAttribute('aAgentic', new BufferAttribute(pAgentic, 3));
  geometry.setAttribute('aLang', new BufferAttribute(pLang, 3));
  geometry.setAttribute('aData', new BufferAttribute(pData, 3));
  geometry.setAttribute('aDev', new BufferAttribute(pDev, 3));
  geometry.setAttribute('aPay', new BufferAttribute(pPay, 3));
  geometry.setAttribute('aArch', new BufferAttribute(pArch, 3));
  geometry.setAttribute('aProj', new BufferAttribute(pProj, 3));

  // Add random offsets for noise animation
  const randoms = new Float32Array(numParticles);
  for(let i=0; i<numParticles; i++) randoms[i] = Math.random();
  geometry.setAttribute('aRandom', new BufferAttribute(randoms, 1));

  const particleMat = new ShaderMaterial({
    uniforms: {
      uTime: { value: 0 },
      uColor: { value: new Color('#1c2226') }, // Ink color
      uNight: { value: 0 },
      uSize: { value: isMobile ? 3.0 : 4.0 },
      uW: { value: [1, 0, 0, 0, 0, 0, 0, 0, 0] }, // Weights for the 9 states
      uNoiseAmp: { value: 0.1 }
    },
    vertexShader: `
      uniform float uTime;
      uniform float uSize;
      uniform float uW[9];
      uniform float uNoiseAmp;

      attribute vec3 aGenAI;
      attribute vec3 aAgentic;
      attribute vec3 aLang;
      attribute vec3 aData;
      attribute vec3 aDev;
      attribute vec3 aPay;
      attribute vec3 aArch;
      attribute vec3 aProj;
      attribute float aRandom;

      varying float vAlpha;

      void main() {
        vec3 pos = position * uW[0] + 
                   aGenAI * uW[1] + 
                   aAgentic * uW[2] + 
                   aLang * uW[3] + 
                   aData * uW[4] + 
                   aDev * uW[5] + 
                   aPay * uW[6] + 
                   aArch * uW[7] + 
                   aProj * uW[8];
        
        // Idle floating movement
        pos.y += sin(uTime * 2.0 + aRandom * 6.28) * uNoiseAmp;
        pos.x += cos(uTime * 1.5 + aRandom * 6.28) * uNoiseAmp;

        vec4 mvPosition = modelViewMatrix * vec4(pos, 1.0);
        gl_PointSize = uSize * (20.0 / -mvPosition.z);
        gl_Position = projectionMatrix * mvPosition;

        vAlpha = 0.5 + 0.5 * sin(uTime * 3.0 + aRandom * 6.28);
      }
    `,
    fragmentShader: `
      uniform vec3 uColor;
      uniform float uNight;
      varying float vAlpha;

      void main() {
        // Circle shape
        vec2 xy = gl_PointCoord.xy - vec2(0.5);
        float ll = length(xy);
        if(ll > 0.5) discard;

        vec3 color = mix(uColor, vec3(0.9, 0.85, 0.8), uNight);
        
        // Soft edge
        float alpha = (0.5 - ll) * 2.0 * vAlpha;
        gl_FragColor = vec4(color, alpha * 0.8);
      }
    `,
    transparent: true,
    depthWrite: false
  });

  const particles = new Points(geometry, particleMat);
  group.add(particles);

  return {
    group,
    coreMesh,
    particles,
    particleMat,
    coreMat
  };
}
