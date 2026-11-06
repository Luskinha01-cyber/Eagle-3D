import * as THREE from 'three';

/**
 * Creates shared physically-based materials tuned for studio lighting
 * (RoomEnvironment + ACESFilmicToneMapping) matching the bionic white/gold/gunmetal eagle.
 */
export function createEagleMaterials() {
  const ceramicWhite = new THREE.MeshPhysicalMaterial({
    name: 'CeramicWhite',
    color: new THREE.Color('#f6f8fb'),
    roughness: 0.16,
    metalness: 0.05,
    clearcoat: 0.88,
    clearcoatRoughness: 0.11,
    reflectivity: 0.72,
  });

  const ceramicWarmWhite = new THREE.MeshPhysicalMaterial({
    name: 'CeramicWarmWhite',
    color: new THREE.Color('#e8edf4'),
    roughness: 0.23,
    metalness: 0.09,
    clearcoat: 0.55,
    clearcoatRoughness: 0.16,
  });

  const silverArmor = new THREE.MeshPhysicalMaterial({
    name: 'SilverArmor',
    color: new THREE.Color('#cbd3df'),
    roughness: 0.22,
    metalness: 0.82,
    clearcoat: 0.35,
    clearcoatRoughness: 0.18,
  });

  const darkChassis = new THREE.MeshStandardMaterial({
    name: 'DarkChassis',
    color: new THREE.Color('#161a22'),
    roughness: 0.38,
    metalness: 0.84,
  });

  const carbonMatte = new THREE.MeshStandardMaterial({
    name: 'CarbonMatte',
    color: new THREE.Color('#0d1016'),
    roughness: 0.65,
    metalness: 0.38,
  });

  const brushedSteel = new THREE.MeshStandardMaterial({
    name: 'BrushedSteel',
    color: new THREE.Color('#b8c2cf'),
    roughness: 0.18,
    metalness: 0.94,
  });

  const chromeClaw = new THREE.MeshPhysicalMaterial({
    name: 'ChromeClaw',
    color: new THREE.Color('#dde4ee'),
    roughness: 0.09,
    metalness: 0.98,
    clearcoat: 0.6,
    clearcoatRoughness: 0.08,
  });

  const brassGold = new THREE.MeshStandardMaterial({
    name: 'BrassGold',
    color: new THREE.Color('#d88e20'),
    roughness: 0.22,
    metalness: 0.92,
  });

  const bronzeDark = new THREE.MeshStandardMaterial({
    name: 'BronzeDark',
    color: new THREE.Color('#9e6416'),
    roughness: 0.32,
    metalness: 0.88,
  });

  const beakAmber = new THREE.MeshPhysicalMaterial({
    name: 'BeakAmber',
    color: new THREE.Color('#d98014'),
    roughness: 0.26,
    metalness: 0.22,
    clearcoat: 0.55,
    clearcoatRoughness: 0.18,
  });

  const eyeCyanOuter = new THREE.MeshStandardMaterial({
    name: 'EyeCyanOuter',
    color: new THREE.Color('#0ea5e9'),
    emissive: new THREE.Color('#0284c7'),
    emissiveIntensity: 2.6,
    roughness: 0.12,
    metalness: 0.1,
  });

  const eyeCyanInner = new THREE.MeshStandardMaterial({
    name: 'EyeCyanInner',
    color: new THREE.Color('#e0f2fe'),
    emissive: new THREE.Color('#38bdf8'),
    emissiveIntensity: 3.8,
    roughness: 0.08,
    metalness: 0.05,
  });

  const allMaterials = [
    ceramicWhite,
    ceramicWarmWhite,
    silverArmor,
    darkChassis,
    carbonMatte,
    brushedSteel,
    chromeClaw,
    brassGold,
    bronzeDark,
    beakAmber,
    eyeCyanOuter,
    eyeCyanInner,
  ];

  function setWireframe(enabled) {
    for (const mat of allMaterials) {
      if (mat !== eyeCyanOuter && mat !== eyeCyanInner) {
        mat.wireframe = enabled;
      }
    }
  }

  function dispose() {
    for (const mat of allMaterials) {
      mat.dispose();
    }
  }

  return {
    ceramicWhite,
    ceramicWarmWhite,
    silverArmor,
    darkChassis,
    carbonMatte,
    brushedSteel,
    chromeClaw,
    brassGold,
    bronzeDark,
    beakAmber,
    eyeCyanOuter,
    eyeCyanInner,
    setWireframe,
    dispose,
  };
}
