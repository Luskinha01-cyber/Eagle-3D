import * as THREE from 'three';
import {
  createCurvedPlateGeometry,
  createGearGeometry,
  createHydraulicStrut,
} from './geometry-helpers.js';

/**
 * Builds the central Bionic Torso: anatomical tapered raptor endoskeleton (no flat cylinder caps),
 * cooling fins, interlocking counter-rotating golden-brass gears, hydraulic rams, and
 * sculpted white/silver breastplate & dorsal cowls with exploded-view support.
 */
export function createEagleTorsoAssembly(materials) {
  const torsoGroup = new THREE.Group();
  torsoGroup.name = 'TorsoGroup';

  const explodablePlates = [];
  const registerExplodable = (mesh, offsetVec) => {
    mesh.userData.basePos = mesh.position.clone();
    mesh.userData.explodeOffset = offsetVec.clone();
    explodablePlates.push(mesh);
  };

  const gears = [];

  // --- 1. Anatomical Tapered Dark Mechanical Endoskeleton Core ---
  // Smooth organic-mechanical capsule/ovoid chassis so no flat cylinder cap ever sticks out!
  const coreGeo = new THREE.CapsuleGeometry(0.28, 0.62, 14, 24);
  coreGeo.scale(0.95, 1.0, 1.05);
  const coreMesh = new THREE.Mesh(coreGeo, materials.darkChassis);
  coreMesh.position.set(0, 0.0, -0.02);
  coreMesh.castShadow = true;
  coreMesh.receiveShadow = true;
  torsoGroup.add(coreMesh);

  // Cooling fin stack inside mid-torso engine bay
  const finGeo = new THREE.BoxGeometry(0.60, 0.015, 0.50);
  for (let i = 0; i < 9; i++) {
    const fin = new THREE.Mesh(finGeo, i % 2 === 0 ? materials.carbonMatte : materials.darkChassis);
    const y = -0.24 + i * 0.062;
    const scale = 1 - Math.abs(i - 4) * 0.07;
    fin.scale.set(scale, 1, scale);
    fin.position.set(0, y, -0.03);
    torsoGroup.add(fin);
  }

  // Brushed steel central turbine / gyroscope drum
  const drumGeo = new THREE.CylinderGeometry(0.22, 0.22, 0.56, 24);
  drumGeo.rotateZ(Math.PI * 0.5);
  const drum = new THREE.Mesh(drumGeo, materials.brushedSteel);
  drum.position.set(0, -0.06, 0.04);
  torsoGroup.add(drum);

  const drumBandGeo = new THREE.TorusGeometry(0.226, 0.016, 12, 28);
  drumBandGeo.rotateY(Math.PI * 0.5);
  for (const xOff of [-0.16, 0, 0.16]) {
    const band = new THREE.Mesh(drumBandGeo, materials.darkChassis);
    band.position.set(xOff, -0.06, 0.04);
    torsoGroup.add(band);
  }

  // --- 2. Interlocking Golden-Brass Gear Clusters (Left & Right Flanks) ---
  const largeGearGeo = createGearGeometry({
    outerRadius: 0.165,
    innerRadius: 0.125,
    boreRadius: 0.045,
    teeth: 18,
    thickness: 0.036,
    spokes: 5,
  });
  const medGearGeo = createGearGeometry({
    outerRadius: 0.115,
    innerRadius: 0.085,
    boreRadius: 0.032,
    teeth: 13,
    thickness: 0.034,
    spokes: 4,
  });
  const smallGearGeo = createGearGeometry({
    outerRadius: 0.078,
    innerRadius: 0.056,
    boreRadius: 0.022,
    teeth: 10,
    thickness: 0.038,
    spokes: 0,
  });
  const hubPinGeo = new THREE.CylinderGeometry(0.028, 0.028, 0.065, 14);
  hubPinGeo.rotateZ(Math.PI * 0.5);

  for (const side of [-1, 1]) {
    const flankGroup = new THREE.Group();
    flankGroup.position.set(side * 0.30, -0.12, -0.02);
    torsoGroup.add(flankGroup);

    const g1 = new THREE.Mesh(largeGearGeo, materials.brassGold);
    g1.rotation.y = Math.PI * 0.5;
    g1.position.set(0, 0.04, -0.04);
    g1.castShadow = true;
    flankGroup.add(g1);
    gears.push({ mesh: g1, ratio: 1.0 * side });

    const pin1 = new THREE.Mesh(hubPinGeo, materials.brushedSteel);
    pin1.position.copy(g1.position);
    flankGroup.add(pin1);

    const g2 = new THREE.Mesh(medGearGeo, materials.brassGold);
    g2.rotation.y = Math.PI * 0.5;
    g2.position.set(side * 0.012, -0.15, 0.13);
    g2.castShadow = true;
    flankGroup.add(g2);
    gears.push({ mesh: g2, ratio: -1.38 * side });

    const pin2 = new THREE.Mesh(hubPinGeo, materials.darkChassis);
    pin2.position.copy(g2.position);
    flankGroup.add(pin2);

    const g3 = new THREE.Mesh(smallGearGeo, materials.bronzeDark);
    g3.rotation.y = Math.PI * 0.5;
    g3.position.set(side * 0.015, 0.21, 0.09);
    g3.castShadow = true;
    flankGroup.add(g3);
    gears.push({ mesh: g3, ratio: -1.8 * side });

    const g4 = new THREE.Mesh(medGearGeo, materials.brassGold);
    g4.rotation.y = Math.PI * 0.5;
    g4.position.set(-side * 0.01, -0.22, -0.15);
    flankGroup.add(g4);
    gears.push({ mesh: g4, ratio: -1.38 * side });

    const pistonA = createHydraulicStrut(0.48, 0.026, materials);
    pistonA.position.set(side * 0.25, 0.14, 0.13);
    pistonA.rotation.x = -0.32;
    pistonA.rotation.z = side * -0.14;
    torsoGroup.add(pistonA);

    const pistonB = createHydraulicStrut(0.44, 0.023, materials);
    pistonB.position.set(side * 0.24, -0.24, -0.11);
    pistonB.rotation.x = 0.40;
    torsoGroup.add(pistonB);

    const hoseCurve = new THREE.CatmullRomCurve3([
      new THREE.Vector3(side * 0.22, 0.38, 0.08),
      new THREE.Vector3(side * 0.31, 0.12, 0.20),
      new THREE.Vector3(side * 0.28, -0.16, 0.16),
      new THREE.Vector3(side * 0.20, -0.42, 0.04),
    ]);
    const hoseGeo = new THREE.TubeGeometry(hoseCurve, 20, 0.018, 10, false);
    const hose = new THREE.Mesh(hoseGeo, materials.carbonMatte);
    torsoGroup.add(hose);
  }

  // --- 3. Sculpted White & Brushed-Silver Armor Plates ---
  // 3A. Upper Chest / Clavicle White Fairing (smooth sculpted dome shell)
  const upperChestGeo = new THREE.SphereGeometry(0.32, 28, 22, 0, Math.PI * 2, 0, Math.PI * 0.46);
  upperChestGeo.rotateX(Math.PI * 0.5);
  upperChestGeo.scale(0.96, 0.92, 0.55);
  const upperChest = new THREE.Mesh(upperChestGeo, materials.ceramicWhite);
  upperChest.position.set(0, 0.22, 0.18);
  upperChest.rotation.x = -0.22;
  upperChest.castShadow = true;
  upperChest.receiveShadow = true;
  torsoGroup.add(upperChest);
  registerExplodable(upperChest, new THREE.Vector3(0, 0.12, 0.28));

  // 3B. Lower Sternum Keel Shield (Brushed Silver + Gold Trim — smooth tapered keel shell)
  const keelGeo = new THREE.SphereGeometry(0.26, 28, 22, 0, Math.PI * 2, 0, Math.PI * 0.48);
  keelGeo.rotateX(Math.PI * 0.5);
  keelGeo.scale(0.78, 1.32, 0.52);
  const keelPlate = new THREE.Mesh(keelGeo, materials.silverArmor);
  keelPlate.position.set(0, -0.16, 0.18);
  keelPlate.rotation.x = 0.26;
  keelPlate.castShadow = true;
  keelPlate.receiveShadow = true;
  torsoGroup.add(keelPlate);
  registerExplodable(keelPlate, new THREE.Vector3(0, -0.08, 0.28));

  const keelTrimGeo = new THREE.SphereGeometry(0.16, 20, 16, 0, Math.PI * 2, 0, Math.PI * 0.42);
  keelTrimGeo.rotateX(Math.PI * 0.5);
  keelTrimGeo.scale(0.32, 1.45, 0.35);
  const keelTrim = new THREE.Mesh(keelTrimGeo, materials.brassGold);
  keelTrim.position.set(0, -0.18, 0.26);
  keelTrim.rotation.x = 0.26;
  torsoGroup.add(keelTrim);
  registerExplodable(keelTrim, new THREE.Vector3(0, -0.10, 0.34));

  // 3C. Lateral Collar / Rib Fairing Plates (sweeping white arcs framing the exposed engine bay)
  const ribPlateShape = new THREE.Shape();
  ribPlateShape.moveTo(-0.14, 0.34);
  ribPlateShape.bezierCurveTo(0.12, 0.30, 0.22, 0.06, 0.17, -0.22);
  ribPlateShape.bezierCurveTo(0.05, -0.20, -0.06, -0.08, -0.14, 0.08);
  ribPlateShape.closePath();
  const ribPlateGeo = createCurvedPlateGeometry(ribPlateShape, {
    depth: 0.030,
    bevelThickness: 0.011,
    bevelSize: 0.01,
    bendX: 0.06,
    bendY: 0.06,
    domeZ: 0.03,
  });

  for (const side of [-1, 1]) {
    const ribPlate = new THREE.Mesh(ribPlateGeo, materials.ceramicWhite);
    ribPlate.scale.x = side;
    ribPlate.position.set(side * 0.285, 0.20, 0.17);
    ribPlate.rotation.y = side * Math.PI * 0.34;
    ribPlate.rotation.z = side * 0.10;
    ribPlate.castShadow = true;
    ribPlate.receiveShadow = true;
    torsoGroup.add(ribPlate);
    registerExplodable(ribPlate, new THREE.Vector3(side * 0.24, 0.08, 0.12));
  }

  // 3D. Dorsal (Upper Back) Aerodynamic White Armor Fairing
  const dorsalShape = new THREE.Shape();
  dorsalShape.moveTo(0, 0.46);
  dorsalShape.bezierCurveTo(0.28, 0.42, 0.33, 0.08, 0.23, -0.42);
  dorsalShape.bezierCurveTo(0.11, -0.52, -0.11, -0.52, -0.23, -0.42);
  dorsalShape.bezierCurveTo(-0.33, 0.08, -0.28, 0.42, 0, 0.46);
  const dorsalGeo = createCurvedPlateGeometry(dorsalShape, {
    depth: 0.034,
    bevelThickness: 0.012,
    bevelSize: 0.011,
    bendX: 0.16,
    bendY: 0.05,
    domeZ: 0.035,
  });
  const dorsalPlate = new THREE.Mesh(dorsalGeo, materials.ceramicWhite);
  dorsalPlate.position.set(0, 0.10, -0.29);
  dorsalPlate.rotation.y = Math.PI;
  dorsalPlate.rotation.x = 0.12;
  dorsalPlate.castShadow = true;
  dorsalPlate.receiveShadow = true;
  torsoGroup.add(dorsalPlate);
  registerExplodable(dorsalPlate, new THREE.Vector3(0, 0.12, -0.26));

  return {
    torsoGroup,
    gears,
    explodablePlates,
  };
}
