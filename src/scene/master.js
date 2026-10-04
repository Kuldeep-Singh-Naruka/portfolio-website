import {
  Group, Mesh, IcosahedronGeometry, MeshPhysicalMaterial, TorusGeometry, OctahedronGeometry,
  MeshBasicMaterial, BufferGeometry, BufferAttribute, Points, ShaderMaterial,
  Color, Vector3, EdgesGeometry, LineSegments, LineBasicMaterial
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

  // 1. Primary Core Object (Premium Dark/Black sculptural sphere)
  const coreGeo = new IcosahedronGeometry(2, 64);
  const coreMat = new MeshPhysicalMaterial({
    color: new Color('#050607'), // Deep rich black base
    emissive: new Color('#000000'),
    roughness: 0.45,
    metalness: 0.7, // Heavy/metallic
    clearcoat: 0.15,
    clearcoatRoughness: 0.2,
    reflectivity: 0.8,
    ior: 1.5,
    transparent: true,
    opacity: 0.98
  });
  const coreMesh = new Mesh(coreGeo, coreMat);
  group.add(coreMesh);

  // 2. Secondary Objects (Abstract digital forms)
  const secA = new Mesh(new IcosahedronGeometry(1, 2), coreMat.clone()); // Asteroid/fragment
  secA.material.roughness = 0.6;
  secA.material.flatShading = true;

  // Thin orbital ring
  const ringGeo = new TorusGeometry(3, 0.005, 16, 100);
  const secB = new Mesh(ringGeo, new MeshBasicMaterial({ 
    color: new Color('#ffffff'), 
    transparent: true, 
    opacity: 0.15,
    depthWrite: false
  }));

  // Small geometric core
  const secC = new Mesh(new OctahedronGeometry(1, 0), coreMat.clone());
  secC.material.metalness = 0.9;
  secC.material.roughness = 0.2; // Shinier

  // Wireframe/Node cluster (Lines instead of solid to add structural feel)
  const wireGeo = new EdgesGeometry(new IcosahedronGeometry(1, 1));
  const secD = new LineSegments(wireGeo, new LineBasicMaterial({
    color: 0xffffff,
    transparent: true,
    opacity: 0.2
  }));

  // Tiny orbiting fragment
  const secE = new Mesh(new IcosahedronGeometry(0.3, 0), coreMat.clone());

  group.add(secA, secB, secC, secD, secE);

  // 3. Particle System (Depth-aware, size variation)
  const numParticles = isMobile ? 600 : 2000; // slightly reduced for performance, making room for secondary objects
  
  const pBase = new Float32Array(numParticles * 3);
  const pGenAI = new Float32Array(numParticles * 3);
  const pAgentic = new Float32Array(numParticles * 3);
  const pLang = new Float32Array(numParticles * 3);
  const pData = new Float32Array(numParticles * 3);
  const pDev = new Float32Array(numParticles * 3);
  const pPay = new Float32Array(numParticles * 3);
  const pArch = new Float32Array(numParticles * 3);
  const pProj = new Float32Array(numParticles * 3);

  // Size variations
  const sizes = new Float32Array(numParticles);
  const randoms = new Float32Array(numParticles);

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
    
    // Assign varying scales for foreground/midground/background depth feel
    const randDepth = Math.random();
    if (randDepth > 0.95) sizes[i] = 3.0; // Few very large close particles
    else if (randDepth > 0.7) sizes[i] = 1.5; // Mid
    else sizes[i] = 0.5; // Many tiny distant dust particles

    randoms[i] = Math.random();
    
    // 0: HERO (Sparse atmosphere around core)
    const h = randomPointInSphere(4.0);
    pBase[i3] = h.x; pBase[i3+1] = h.y; pBase[i3+2] = h.z;

    // 1: GEN AI (Fragmented expansive cloud)
    const g = randomPointInSphere(10);
    pGenAI[i3] = g.x; pGenAI[i3+1] = g.y; pGenAI[i3+2] = g.z;

    // 2: AGENTIC (Networked paths - horizontal disk)
    const aDist = Math.random() * 8 + 2;
    const aAng = Math.random() * Math.PI * 2;
    pAgentic[i3] = Math.cos(aAng) * aDist;
    pAgentic[i3+1] = (Math.random() - 0.5) * 0.5;
    pAgentic[i3+2] = Math.sin(aAng) * aDist;

    // 3: LANGUAGES (Ordered layers)
    const layer = Math.floor(Math.random() * 5);
    pLang[i3] = (Math.random() - 0.5) * 8;
    pLang[i3+1] = (layer - 2) * 1.5;
    pLang[i3+2] = (Math.random() - 0.5) * 8;

    // 4: DATABASES (Clustered data nodes)
    const gridSz = 3;
    const cx = (Math.floor(Math.random() * gridSz) - 1) * 3;
    const cy = (Math.floor(Math.random() * gridSz) - 1) * 3;
    const cz = (Math.floor(Math.random() * gridSz) - 1) * 3;
    const spread = randomPointInSphere(1);
    pData[i3] = cx + spread.x;
    pData[i3+1] = cy + spread.y;
    pData[i3+2] = cz + spread.z;

    // 5: DEVOPS (Flowing tube/path)
    const t = Math.random() * Math.PI * 2;
    const tubeRad = Math.random() * 1.2;
    const tubeAng = Math.random() * Math.PI * 2;
    pDev[i3] = Math.cos(t) * 6 + Math.cos(tubeAng) * tubeRad;
    pDev[i3+1] = Math.sin(t * 3) * 2 + Math.sin(tubeAng) * tubeRad;
    pDev[i3+2] = Math.sin(t) * 6;

    // 6: PAYMENTS (Transaction nodes communicating)
    const cluster = Math.floor(Math.random() * 4);
    const px = Math.cos(cluster * Math.PI / 2) * 4;
    const pz = Math.sin(cluster * Math.PI / 2) * 4;
    const cSpread = randomPointInSphere(1.5);
    pPay[i3] = px + cSpread.x;
    pPay[i3+1] = cSpread.y;
    pPay[i3+2] = pz + cSpread.z;

    // 7: ARCHITECTURE (7 strict system layers)
    const archLevel = Math.floor(Math.random() * 7);
    const ay = (archLevel - 3) * 2.0; // Taller vertical spread
    const aRad = 3.5 - Math.abs(archLevel - 3) * 0.4; // Diamond like structure
    const aa = Math.random() * Math.PI * 2;
    const ad = Math.random() * aRad;
    pArch[i3] = Math.cos(aa) * ad;
    pArch[i3+1] = ay;
    pArch[i3+2] = Math.sin(aa) * ad;

    // 8: PROJECTS (Dynamic noisy field, wrapping projects)
    const proj = randomPointInSphere(7);
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
  geometry.setAttribute('aSize', new BufferAttribute(sizes, 1));
  geometry.setAttribute('aRandom', new BufferAttribute(randoms, 1));

  const particleMat = new ShaderMaterial({
    uniforms: {
      uTime: { value: 0 },
      uColor: { value: new Color('#1c2226') },
      uNight: { value: 0 },
      uBaseSize: { value: isMobile ? 3.0 : 4.0 },
      uW: { value: [1, 0, 0, 0, 0, 0, 0, 0, 0] },
      uNoiseAmp: { value: 0.1 }
    },
    vertexShader: `
      uniform float uTime;
      uniform float uBaseSize;
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
      attribute float aSize;
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
        
        // Organic breathing motion (subtle)
        float noiseTime = uTime * 0.5 + aRandom * 6.28;
        pos.x += sin(noiseTime * 1.3) * uNoiseAmp;
        pos.y += cos(noiseTime * 1.1) * uNoiseAmp;
        pos.z += sin(noiseTime * 0.9) * uNoiseAmp;

        vec4 mvPosition = modelViewMatrix * vec4(pos, 1.0);
        
        // Scale by perspective depth
        gl_PointSize = (uBaseSize * aSize) * (20.0 / -mvPosition.z);
        gl_Position = projectionMatrix * mvPosition;

        // Dim particles that are very far away or close to edges
        vAlpha = 0.2 + 0.8 * (0.5 + 0.5 * sin(noiseTime * 2.0));
      }
    `,
    fragmentShader: `
      uniform vec3 uColor;
      uniform float uNight;
      varying float vAlpha;

      void main() {
        vec2 xy = gl_PointCoord.xy - vec2(0.5);
        float ll = length(xy);
        if(ll > 0.5) discard;

        // Elegant warm white vs dark mode
        vec3 nightColor = mix(vec3(0.9, 0.85, 0.8), vec3(0.6, 0.7, 0.8), vAlpha);
        vec3 color = mix(uColor, nightColor, uNight);
        
        // Soft gaussian-like falloff
        float alpha = pow(1.0 - (ll * 2.0), 1.5) * vAlpha;
        gl_FragColor = vec4(color, alpha * 0.6);
      }
    `,
    transparent: true,
    depthWrite: false,
    blending: 2 // Additive/Normal depending on context, using default normal blending for cleaner look
  });

  const particles = new Points(geometry, particleMat);
  group.add(particles);

  return {
    group,
    coreMesh,
    secA, secB, secC, secD, secE,
    particles,
    particleMat,
    coreMat
  };
}
