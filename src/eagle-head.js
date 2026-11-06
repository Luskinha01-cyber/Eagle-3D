import * as THREE from 'three';
import { createCurvedPlateGeometry, createHydraulicStrut } from './geometry-helpers.js';

/**
 * Builds a true 3D tapered, hooked raptor upper mandible geometry extending along +Z.
 */
function createUpperBeakGeometry() {
  const shape = new THREE.Shape();
  shape.moveTo(0.0, 0.105);
  shape.bezierCurveTo(0.20, 0.10, 0.42, 0.035, 0.54, -0.09);
  shape.bezierCurveTo(0.59, -0.155, 0.58, -0.245, 0.52, -0.30);
  shape.bezierCurveTo(0.48, -0.23, 0.45, -0.14, 0.37, -0.09);
  shape.bezierCurveTo(0.24, -0.05, 0.11, -0.045, 0.0, -0.04);
  shape.closePath();

  const geo = new THREE.ExtrudeGeometry(shape, {
    depth: 0.20,
    bevelEnabled: true,
    bevelThickness: 0.014,
    bevelSize: 0.012,
    bevelSegments: 4,
    curveSegments: 28,
  });

  const pos = geo.attributes.position;
  for (let i = 0; i < pos.count; i++) {
    const forward = pos.getX(i);
    let up = pos.getY(i);
    let side = pos.getZ(i) - 0.10;

    const t = THREE.MathUtils.clamp(forward / 0.58, 0, 1);
    const widthScale = Math.pow(1 - t * 0.93, 0.88);
    side *= widthScale;
    up -= Math.abs(side) * (0.42 + t * 0.38);

    pos.setXYZ(i, side, up, forward);
  }

  geo.computeVertexNormals();
  return geo;
}

/**
 * Builds a tapered lower mandible geometry extending along +Z.
 */
function createLowerBeakGeometry() {
  const shape = new THREE.Shape();
  shape.moveTo(0.0, -0.008);
  shape.lineTo(0.34, -0.022);
  shape.quadraticCurveTo(0.39, -0.052, 0.33, -0.088);
  shape.quadraticCurveTo(0.17, -0.096, 0.0, -0.078);
  shape.closePath();

  const geo = new THREE.ExtrudeGeometry(shape, {
    depth: 0.135,
    bevelEnabled: true,
    bevelThickness: 0.009,
    bevelSize: 0.007,
    bevelSegments: 3,
    curveSegments: 18,
  });

  const pos = geo.attributes.position;
  for (let i = 0; i < pos.count; i++) {
    const forward = pos.getX(i);
    const up = pos.getY(i);
    let side = pos.getZ(i) - 0.0675;
    const t = THREE.MathUtils.clamp(forward / 0.38, 0, 1);
    side *= Math.pow(1 - t * 0.88, 0.85);
    pos.setXYZ(i, side, up, forward);
  }

  geo.computeVertexNormals();
  return geo;
}

/**
 * Sculpted aerodynamic White Ceramic Cranial Helmet covering top & nape of the skull
 * seamlessly (so no black ball pokes out the top, while leaving deep lateral eye sockets).
 */
function createSculptedCrownHelmetGeometry() {
  const geo = new THREE.SphereGeometry(0.235, 32, 24, 0, Math.PI * 2, 0, Math.PI * 0.58);
  const pos = geo.attributes.position;

  for (let i = 0; i < pos.count; i++) {
    let x = pos.getX(i);
    let y = pos.getY(i);
    let z = pos.getZ(i);

    // Elongate front-to-back like a sleek raptor cranium
    z *= 1.48;
    x *= 0.88;
    y *= 0.82;

    // Taper front bridge toward the beak cere (+Z) and sweep occipital crest back (-Z)
    if (z > 0) {
      const f = THREE.MathUtils.clamp(z / 0.35, 0, 1);
      x *= 1 - f * 0.52;
      y -= f * f * 0.06;
    } else {
      const b = THREE.MathUtils.clamp(-z / 0.35, 0, 1);
      x *= 1 - b * 0.28;
      y -= b * 0.05;
    }

    pos.setXYZ(i, x, y, z);
  }

  geo.computeVertexNormals();
  return geo;
}

/**
 * Creates a crystal-clear concentric glowing cyan bionic optical eye (left or right).
 */
function createBionicEye(materials, sideSign) {
  const eyeGroup = new THREE.Group();

  // Deep recessed gunmetal orbital housing
  const socketGeo = new THREE.CylinderGeometry(0.088, 0.098, 0.062, 28);
  socketGeo.rotateZ(Math.PI * 0.5);
  const socket = new THREE.Mesh(socketGeo, materials.darkChassis);

  // Outer brushed steel lens bezel
  const bezelGeo = new THREE.TorusGeometry(0.080, 0.010, 12, 32);
  bezelGeo.rotateY(Math.PI * 0.5);
  const bezel = new THREE.Mesh(bezelGeo, materials.brushedSteel);
  bezel.position.x = sideSign * 0.025;

  // Dark obsidian ocular backing disc
  const backingGeo = new THREE.CircleGeometry(0.076, 28);
  backingGeo.rotateY(sideSign > 0 ? Math.PI * 0.5 : -Math.PI * 0.5);
  const backing = new THREE.Mesh(backingGeo, materials.carbonMatte);
  backing.position.x = sideSign * 0.027;

  // Vivid outer cyan iris ring
  const outerIrisGeo = new THREE.RingGeometry(0.048, 0.072, 32);
  outerIrisGeo.rotateY(sideSign > 0 ? Math.PI * 0.5 : -Math.PI * 0.5);
  const outerIris = new THREE.Mesh(outerIrisGeo, materials.eyeCyanOuter);
  outerIris.position.x = sideSign * 0.030;

  // Rotating inner bright cyan aperture + precision reticle ticks
  const innerIrisGroup = new THREE.Group();
  innerIrisGroup.position.x = sideSign * 0.033;

  const innerRingGeo = new THREE.RingGeometry(0.027, 0.041, 28);
  innerRingGeo.rotateY(sideSign > 0 ? Math.PI * 0.5 : -Math.PI * 0.5);
  const innerIris = new THREE.Mesh(innerRingGeo, materials.eyeCyanInner);
  innerIrisGroup.add(innerIris);

  const tickGeo = new THREE.BoxGeometry(0.003, 0.011, 0.005);
  for (let i = 0; i < 8; i++) {
    const a = (i / 8) * Math.PI * 2;
    const tick = new THREE.Mesh(tickGeo, materials.eyeCyanInner);
    tick.position.set(0, Math.cos(a) * 0.052, Math.sin(a) * 0.052);
    tick.rotation.x = -a;
    innerIrisGroup.add(tick);
  }

  // Deep obsidian pupil center
  const pupilGeo = new THREE.CircleGeometry(0.025, 24);
  pupilGeo.rotateY(sideSign > 0 ? Math.PI * 0.5 : -Math.PI * 0.5);
  const pupil = new THREE.Mesh(pupilGeo, materials.carbonMatte);
  pupil.position.x = sideSign * 0.035;

  eyeGroup.add(socket, bezel, backing, outerIris, innerIrisGroup, pupil);
  return { eyeGroup, innerIrisGroup };
}

/**
 * Builds the articulated Neck + Head assembly of the Bionic Eagle.
 */
export function createEagleHeadAssembly(materials) {
  const neckGroup = new THREE.Group();
  neckGroup.name = 'NeckGroup';

  const headGroup = new THREE.Group();
  headGroup.name = 'HeadGroup';
  headGroup.position.set(0, 0.45, 0.14);
  neckGroup.add(headGroup);

  const explodablePlates = [];
  const registerExplodable = (mesh, offsetVec) => {
    mesh.userData.basePos = mesh.position.clone();
    mesh.userData.explodeOffset = offsetVec.clone();
    explodablePlates.push(mesh);
  };

  // --- 1. Dark Mechanical Skull Core (tucked cleanly inside the ceramic helmet) ---
  const skullGeo = new THREE.SphereGeometry(0.185, 24, 18);
  skullGeo.scale(0.84, 0.82, 1.25);
  const skullCore = new THREE.Mesh(skullGeo, materials.darkChassis);
  skullCore.position.set(0, 0.01, 0.02);
  skullCore.castShadow = true;
  headGroup.add(skullCore);

  // --- 2. Seamless Aerodynamic White Crown Helmet ---
  const helmetGeo = createSculptedCrownHelmetGeometry();
  const crownHelmet = new THREE.Mesh(helmetGeo, materials.ceramicWhite);
  crownHelmet.position.set(0, 0.04, 0.02);
  crownHelmet.castShadow = true;
  crownHelmet.receiveShadow = true;
  headGroup.add(crownHelmet);
  registerExplodable(crownHelmet, new THREE.Vector3(0, 0.16, 0.02));

  // Swept Occipital Nape Crest Feathers (sleek layered white plates at back of head)
  const napeShape = new THREE.Shape();
  napeShape.moveTo(0, 0.14);
  napeShape.bezierCurveTo(0.14, 0.12, 0.16, -0.06, 0.08, -0.22);
  napeShape.bezierCurveTo(0.02, -0.26, -0.02, -0.26, -0.08, -0.22);
  napeShape.bezierCurveTo(-0.16, -0.06, -0.14, 0.12, 0, 0.14);
  const napeGeo = createCurvedPlateGeometry(napeShape, {
    depth: 0.026,
    bevelThickness: 0.009,
    bevelSize: 0.008,
    bendX: 0.10,
    domeZ: 0.02,
  });
  const napeCrest = new THREE.Mesh(napeGeo, materials.ceramicWhite);
  napeCrest.position.set(0, 0.04, -0.26);
  napeCrest.rotation.y = Math.PI;
  napeCrest.rotation.x = 0.42;
  napeCrest.castShadow = true;
  headGroup.add(napeCrest);
  registerExplodable(napeCrest, new THREE.Vector3(0, 0.08, -0.15));

  // Fierce Swept Supraorbital Brow Ridges (flush along lateral crown edge, overhanging eyes)
  const browShape = new THREE.Shape();
  browShape.moveTo(-0.16, 0.025);
  browShape.quadraticCurveTo(0.02, 0.055, 0.18, -0.01);
  browShape.quadraticCurveTo(0.04, -0.032, -0.15, -0.018);
  browShape.closePath();
  const browGeo = createCurvedPlateGeometry(browShape, {
    depth: 0.022,
    bevelThickness: 0.008,
    bevelSize: 0.007,
    bendX: 0.035,
  });

  // Temporal / Cheek White Armor Pods (directly behind eyes, matching reference photo!)
  const cheekShape = new THREE.Shape();
  cheekShape.moveTo(-0.11, 0.10);
  cheekShape.quadraticCurveTo(0.08, 0.11, 0.11, 0.03);
  cheekShape.quadraticCurveTo(0.10, -0.10, -0.04, -0.12);
  cheekShape.quadraticCurveTo(-0.13, -0.07, -0.11, 0.10);
  const cheekGeo = createCurvedPlateGeometry(cheekShape, {
    depth: 0.030,
    bevelThickness: 0.010,
    bevelSize: 0.009,
    bendX: 0.035,
    bendY: 0.035,
    domeZ: 0.02,
  });

  const irisRotators = [];
  for (const side of [-1, 1]) {
    const brow = new THREE.Mesh(browGeo, materials.ceramicWhite);
    brow.scale.x = side;
    brow.position.set(side * 0.152, 0.092, 0.125);
    brow.rotation.y = side * Math.PI * 0.44;
    brow.rotation.z = side * -0.18;
    brow.castShadow = true;
    headGroup.add(brow);
    registerExplodable(brow, new THREE.Vector3(side * 0.10, 0.07, 0.03));

    const cheek = new THREE.Mesh(cheekGeo, materials.ceramicWhite);
    cheek.scale.x = side;
    cheek.position.set(side * 0.172, 0.0, -0.065);
    cheek.rotation.y = side * Math.PI * 0.46;
    cheek.castShadow = true;
    cheek.receiveShadow = true;
    headGroup.add(cheek);
    registerExplodable(cheek, new THREE.Vector3(side * 0.14, 0.01, -0.03));

    const { eyeGroup, innerIrisGroup } = createBionicEye(materials, side);
    eyeGroup.position.set(side * 0.132, 0.028, 0.125);
    eyeGroup.rotation.y = side * 0.28;
    eyeGroup.rotation.z = side * -0.05;
    headGroup.add(eyeGroup);
    irisRotators.push({ group: innerIrisGroup, side });
  }

  const eyeGlowLight = new THREE.PointLight(0x38bdf8, 0.75, 1.5, 2);
  eyeGlowLight.position.set(0, 0.03, 0.30);
  headGroup.add(eyeGlowLight);

  // --- 3. Sculpted Beak Bridge & Golden-Amber Hooked Beak ---
  // Sleek dark mechanical cere tucked cleanly into the beak base (never protruding above brow)
  const cereGeo = new THREE.BoxGeometry(0.14, 0.09, 0.12);
  const cere = new THREE.Mesh(cereGeo, materials.darkChassis);
  cere.position.set(0, 0.025, 0.22);
  headGroup.add(cere);

  const upperBeakGeo = createUpperBeakGeometry();
  const upperBeak = new THREE.Mesh(upperBeakGeo, materials.beakAmber);
  upperBeak.position.set(0, 0.015, 0.24);
  upperBeak.castShadow = true;
  headGroup.add(upperBeak);

  const lowerBeakPivot = new THREE.Group();
  lowerBeakPivot.position.set(0, -0.022, 0.22);
  const lowerBeakGeo = createLowerBeakGeometry();
  const lowerBeak = new THREE.Mesh(lowerBeakGeo, materials.beakAmber);
  lowerBeak.castShadow = true;
  lowerBeakPivot.add(lowerBeak);
  headGroup.add(lowerBeakPivot);

  // --- 4. S-Curved Neck Spine, Throat Hydraulics & Overlapping White Laminar Fairings ---
  const spineCurve = new THREE.CatmullRomCurve3([
    new THREE.Vector3(0, -0.08, -0.02),
    new THREE.Vector3(0, 0.12, 0.02),
    new THREE.Vector3(0, 0.30, 0.08),
    new THREE.Vector3(0, 0.45, 0.13),
  ]);
  const spineGeo = new THREE.TubeGeometry(spineCurve, 18, 0.11, 16, false);
  const spineMesh = new THREE.Mesh(spineGeo, materials.darkChassis);
  spineMesh.castShadow = true;
  neckGroup.add(spineMesh);

  for (const side of [-1, 1]) {
    const cableCurve = new THREE.CatmullRomCurve3([
      new THREE.Vector3(side * 0.06, -0.06, 0.10),
      new THREE.Vector3(side * 0.07, 0.14, 0.14),
      new THREE.Vector3(side * 0.05, 0.36, 0.20),
    ]);
    const cableGeo = new THREE.TubeGeometry(cableCurve, 16, 0.018, 10, false);
    const cable = new THREE.Mesh(cableGeo, materials.brushedSteel);
    neckGroup.add(cable);

    const innerCableCurve = new THREE.CatmullRomCurve3([
      new THREE.Vector3(side * 0.03, -0.05, 0.13),
      new THREE.Vector3(side * 0.035, 0.17, 0.16),
      new THREE.Vector3(side * 0.025, 0.38, 0.22),
    ]);
    const innerCableGeo = new THREE.TubeGeometry(innerCableCurve, 14, 0.014, 8, false);
    const innerCable = new THREE.Mesh(innerCableGeo, materials.carbonMatte);
    neckGroup.add(innerCable);

    const neckPiston = createHydraulicStrut(0.36, 0.021, materials);
    neckPiston.position.set(side * 0.105, 0.18, 0.05);
    neckPiston.rotation.x = 0.24;
    neckGroup.add(neckPiston);
  }

  // Dorsal Nape Collars
  const collarShape = new THREE.Shape();
  collarShape.moveTo(0, 0.12);
  collarShape.bezierCurveTo(0.22, 0.11, 0.30, 0.01, 0.26, -0.13);
  collarShape.bezierCurveTo(0.16, -0.10, -0.16, -0.10, -0.26, -0.13);
  collarShape.bezierCurveTo(-0.30, 0.01, -0.22, 0.11, 0, 0.12);
  const collarGeo = createCurvedPlateGeometry(collarShape, {
    depth: 0.026,
    bevelThickness: 0.01,
    bevelSize: 0.009,
    bendX: 0.16,
    bendY: 0.02,
  });

  for (let i = 0; i < 4; i++) {
    const t = i / 3;
    const collar = new THREE.Mesh(
      collarGeo,
      i % 2 === 0 ? materials.ceramicWhite : materials.ceramicWarmWhite
    );
    const scale = 1.18 - t * 0.28;
    collar.scale.set(scale, scale * 0.95, scale);
    collar.position.set(0, 0.02 + t * 0.31, -0.11 + t * 0.05);
    collar.rotation.x = Math.PI + 0.32 - t * 0.10;
    collar.castShadow = true;
    collar.receiveShadow = true;
    neckGroup.add(collar);
    registerExplodable(collar, new THREE.Vector3(0, 0.04, -0.16));
  }

  // Sweeping Lateral Neck-to-Chest White Armor Fairings (signature S-curve in reference image!)
  const sideSweepShape = new THREE.Shape();
  sideSweepShape.moveTo(-0.08, 0.28);
  sideSweepShape.bezierCurveTo(0.10, 0.25, 0.19, 0.04, 0.26, -0.28);
  sideSweepShape.bezierCurveTo(0.12, -0.32, -0.05, -0.24, -0.11, -0.06);
  sideSweepShape.bezierCurveTo(-0.15, 0.10, -0.12, 0.22, -0.08, 0.28);
  const sideSweepGeo = createCurvedPlateGeometry(sideSweepShape, {
    depth: 0.030,
    bevelThickness: 0.011,
    bevelSize: 0.01,
    bendX: 0.06,
    bendY: 0.07,
    domeZ: 0.028,
  });

  for (const side of [-1, 1]) {
    const sweep = new THREE.Mesh(sideSweepGeo, materials.ceramicWhite);
    sweep.scale.x = side;
    sweep.position.set(side * 0.195, 0.15, 0.055);
    sweep.rotation.y = side * Math.PI * 0.42;
    sweep.rotation.z = side * 0.16;
    sweep.castShadow = true;
    sweep.receiveShadow = true;
    neckGroup.add(sweep);
    registerExplodable(sweep, new THREE.Vector3(side * 0.18, 0.03, 0.05));
  }

  return {
    neckGroup,
    headGroup,
    lowerBeakPivot,
    irisRotators,
    eyeGlowLight,
    explodablePlates,
  };
}
