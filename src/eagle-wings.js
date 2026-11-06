import * as THREE from 'three';
import {
  createCurvedPlateGeometry,
  createFeatherBladeGeometry,
  createGearGeometry,
  createHydraulicStrut,
  mirrorGeometryX,
} from './geometry-helpers.js';

/**
 * Builds Left and Right multi-jointed Bionic Wings with:
 * - Arched upper leading-edge white crest
 * - Large convex rounded-teardrop white scapular shoulder shield (zero mesh poke-through)
 * - Exposed gunmetal/brass elbow & wrist actuators
 * - 7 layered upper covert shields + 8 full secondary flight blades + 11 primary flight blades per wing
 */
export function createEagleWingsAssembly(materials) {
  const explodablePlates = [];
  const registerExplodable = (mesh, offsetVec) => {
    mesh.userData.basePos = mesh.position.clone();
    mesh.userData.explodeOffset = offsetVec.clone();
    explodablePlates.push(mesh);
  };

  // 1. Signature Large Convex White Shoulder Shield (Scapular Cowl in reference photo)
  const shoulderShieldShape = new THREE.Shape();
  shoulderShieldShape.moveTo(-0.04, 0.45);
  shoulderShieldShape.bezierCurveTo(0.29, 0.43, 0.41, 0.14, 0.35, -0.25);
  shoulderShieldShape.bezierCurveTo(0.28, -0.52, 0.10, -0.64, -0.08, -0.58);
  shoulderShieldShape.bezierCurveTo(-0.28, -0.46, -0.36, -0.12, -0.32, 0.20);
  shoulderShieldShape.bezierCurveTo(-0.28, 0.38, -0.16, 0.46, -0.04, 0.45);

  const shoulderShieldGeoL = createCurvedPlateGeometry(shoulderShieldShape, {
    depth: 0.036,
    bevelThickness: 0.015,
    bevelSize: 0.014,
    bendX: 0.14,
    bendY: 0.12,
    domeZ: 0.068,
  });
  const shoulderShieldGeoR = mirrorGeometryX(shoulderShieldGeoL);

  // 2. Upper Wing Leading-Edge Arch Crest
  const archCrestShape = new THREE.Shape();
  archCrestShape.moveTo(-0.36, 0.04);
  archCrestShape.bezierCurveTo(-0.14, 0.18, 0.22, 0.16, 0.48, -0.08);
  archCrestShape.bezierCurveTo(0.32, -0.14, -0.08, -0.05, -0.36, -0.04);
  archCrestShape.closePath();

  const archCrestGeoL = createCurvedPlateGeometry(archCrestShape, {
    depth: 0.032,
    bevelThickness: 0.011,
    bevelSize: 0.01,
    bendX: 0.08,
    bendY: 0.04,
    domeZ: 0.025,
  });
  const archCrestGeoR = mirrorGeometryX(archCrestGeoL);

  // 3. Covert Feather Blades (Medium sculpted white layered plates)
  const covertGeoL = createFeatherBladeGeometry({
    length: 0.68,
    width: 0.185,
    thickness: 0.017,
    curveBack: -0.10,
    camber: 0.025,
  });
  const covertGeoR = mirrorGeometryX(covertGeoL);

  // 4. Secondary Flight Blades (Fill the inner-to-mid wing span seamlessly in flight!)
  const secondaryGeoL = createFeatherBladeGeometry({
    length: 1.04,
    width: 0.17,
    thickness: 0.015,
    curveBack: -0.11,
    camber: 0.024,
  });
  const secondaryGeoR = mirrorGeometryX(secondaryGeoL);

  // 5. Long Sleek Primary Flight Blades (3 graduated lengths for realistic eagle wingtip taper)
  const primaryLongGeoL = createFeatherBladeGeometry({
    length: 1.34,
    width: 0.158,
    thickness: 0.015,
    curveBack: -0.15,
    camber: 0.028,
  });
  const primaryLongGeoR = mirrorGeometryX(primaryLongGeoL);

  const primaryMedGeoL = createFeatherBladeGeometry({
    length: 1.14,
    width: 0.148,
    thickness: 0.014,
    curveBack: -0.12,
    camber: 0.024,
  });
  const primaryMedGeoR = mirrorGeometryX(primaryMedGeoL);

  const primaryShortGeoL = createFeatherBladeGeometry({
    length: 0.92,
    width: 0.138,
    thickness: 0.013,
    curveBack: -0.09,
    camber: 0.02,
  });
  const primaryShortGeoR = mirrorGeometryX(primaryShortGeoL);

  const jointGearGeo = createGearGeometry({
    outerRadius: 0.098,
    innerRadius: 0.072,
    boreRadius: 0.028,
    teeth: 14,
    thickness: 0.028,
    spokes: 4,
  });

  const strutSpineGeo = new THREE.BoxGeometry(0.018, 0.56, 0.022);
  const badgeGeo = new THREE.BoxGeometry(0.012, 0.042, 0.088);

  function buildSingleWing(side) {
    const isLeft = side > 0;
    const shoulderPivot = new THREE.Group();
    shoulderPivot.name = isLeft ? 'LeftWingShoulder' : 'RightWingShoulder';

    // Mechanical Shoulder Joint Core (tucked cleanly inside the outer shield)
    const jointBall = new THREE.Mesh(
      new THREE.SphereGeometry(0.095, 20, 16),
      materials.darkChassis
    );
    shoulderPivot.add(jointBall);

    const shoulderGear = new THREE.Mesh(jointGearGeo, materials.brassGold);
    shoulderGear.rotation.y = Math.PI * 0.5;
    shoulderGear.position.set(side * 0.05, -0.04, -0.02);
    shoulderPivot.add(shoulderGear);

    // Upper Humerus Strut + Hydraulic Actuator
    const humerusStrut = createHydraulicStrut(0.50, 0.032, materials);
    humerusStrut.position.set(side * 0.06, -0.22, -0.10);
    humerusStrut.rotation.x = 0.35;
    humerusStrut.rotation.z = side * 0.16;
    shoulderPivot.add(humerusStrut);

    // Upper Leading-Edge White Arch Crest
    const archCrest = new THREE.Mesh(
      isLeft ? archCrestGeoL : archCrestGeoR,
      materials.ceramicWhite
    );
    archCrest.position.set(side * 0.12, 0.22, -0.18);
    archCrest.rotation.y = side * Math.PI * 0.48;
    archCrest.rotation.x = -0.18;
    archCrest.castShadow = true;
    archCrest.receiveShadow = true;
    shoulderPivot.add(archCrest);
    registerExplodable(archCrest, new THREE.Vector3(side * 0.14, 0.18, -0.06));

    const subCrest = new THREE.Mesh(
      isLeft ? archCrestGeoL : archCrestGeoR,
      materials.darkChassis
    );
    subCrest.scale.set(0.96, 0.88, 0.9);
    subCrest.position.set(side * 0.09, 0.18, -0.19);
    subCrest.rotation.copy(archCrest.rotation);
    shoulderPivot.add(subCrest);

    // Signature Large Convex White Shoulder Shield (cleanly outside internal joint!)
    const shoulderShield = new THREE.Mesh(
      isLeft ? shoulderShieldGeoL : shoulderShieldGeoR,
      materials.ceramicWhite
    );
    shoulderShield.position.set(side * 0.245, -0.13, -0.11);
    shoulderShield.rotation.y = side * Math.PI * 0.47;
    shoulderShield.rotation.x = 0.28;
    shoulderShield.rotation.z = side * -0.08;
    shoulderShield.castShadow = true;
    shoulderShield.receiveShadow = true;
    shoulderPivot.add(shoulderShield);
    registerExplodable(shoulderShield, new THREE.Vector3(side * 0.30, 0.06, 0.04));

    // Flush technical emblem badge on shoulder shield
    const badge = new THREE.Mesh(badgeGeo, materials.silverArmor);
    badge.position.set(side * 0.285, 0.02, -0.05);
    badge.rotation.x = 0.28;
    shoulderPivot.add(badge);
    registerExplodable(badge, new THREE.Vector3(side * 0.32, 0.06, 0.04));

    // --- Joint 2: Elbow Pivot ---
    const elbowPivot = new THREE.Group();
    elbowPivot.position.set(side * 0.12, -0.36, -0.22);
    shoulderPivot.add(elbowPivot);

    const elbowDrum = new THREE.Mesh(
      new THREE.CylinderGeometry(0.068, 0.068, 0.06, 18),
      materials.darkChassis
    );
    elbowDrum.rotation.z = Math.PI * 0.5;
    elbowPivot.add(elbowDrum);

    const elbowGear = new THREE.Mesh(jointGearGeo, materials.brassGold);
    elbowGear.scale.setScalar(0.82);
    elbowGear.rotation.y = Math.PI * 0.5;
    elbowGear.position.set(side * 0.02, -0.02, 0.02);
    elbowPivot.add(elbowGear);

    const forearmStrut = createHydraulicStrut(0.46, 0.026, materials);
    forearmStrut.position.set(side * 0.03, -0.20, -0.08);
    forearmStrut.rotation.x = 0.24;
    elbowPivot.add(forearmStrut);

    // 7 Layered White Covert Armor Blades fanning over the mid-wing
    const coverts = [];
    for (let i = 0; i < 7; i++) {
      const t = i / 6;
      const covertPivot = new THREE.Group();
      covertPivot.position.set(
        side * (0.11 - t * 0.015),
        0.10 - t * 0.28,
        -0.02 - t * 0.16
      );

      const blade = new THREE.Mesh(
        isLeft ? covertGeoL : covertGeoR,
        i % 3 === 2 ? materials.ceramicWarmWhite : materials.ceramicWhite
      );
      blade.rotation.y = side * Math.PI * 0.47;
      blade.rotation.x = 0.16 + t * 0.10;
      blade.castShadow = true;
      blade.receiveShadow = true;
      covertPivot.add(blade);

      elbowPivot.add(covertPivot);
      coverts.push(covertPivot);
    }

    // 8 Full Secondary Flight Blades (bridge the inner-to-outer wing seamlessly when open!)
    const secondaries = [];
    const secCount = 8;
    for (let i = 0; i < secCount; i++) {
      const t = i / (secCount - 1);
      const secPivot = new THREE.Group();
      secPivot.position.set(
        side * (0.07 - t * 0.02),
        0.04 - t * 0.34,
        -0.04 - t * 0.16
      );

      const blade = new THREE.Mesh(
        isLeft ? secondaryGeoL : secondaryGeoR,
        i % 2 === 1 ? materials.ceramicWarmWhite : materials.ceramicWhite
      );
      blade.rotation.y = side * Math.PI * 0.48;
      blade.castShadow = true;
      blade.receiveShadow = true;
      secPivot.add(blade);

      const underShaft = new THREE.Mesh(strutSpineGeo, materials.darkChassis);
      underShaft.scale.set(0.85, 0.95, 0.85);
      underShaft.position.set(side * -0.014, -0.32, -0.01);
      secPivot.add(underShaft);

      elbowPivot.add(secPivot);
      secondaries.push({ pivot: secPivot, t });
    }

    // --- Joint 3: Carpal / Wrist Pivot + 11 Primary Flight Blades ---
    const wristPivot = new THREE.Group();
    wristPivot.position.set(side * 0.05, -0.34, -0.18);
    elbowPivot.add(wristPivot);

    const primaries = [];
    const primaryCount = 11;

    for (let i = 0; i < primaryCount; i++) {
      const t = i / (primaryCount - 1);
      const featherPivot = new THREE.Group();
      featherPivot.position.set(
        side * (0.04 - t * 0.035),
        0.06 - t * 0.18,
        0.04 - t * 0.22
      );

      let geo;
      if (i < 5) {
        geo = isLeft ? primaryLongGeoL : primaryLongGeoR;
      } else if (i < 8) {
        geo = isLeft ? primaryMedGeoL : primaryMedGeoR;
      } else {
        geo = isLeft ? primaryShortGeoL : primaryShortGeoR;
      }

      const mat = i % 3 === 1 ? materials.silverArmor : materials.ceramicWhite;
      const blade = new THREE.Mesh(geo, mat);
      blade.rotation.y = side * Math.PI * 0.48;
      blade.castShadow = true;
      blade.receiveShadow = true;
      featherPivot.add(blade);

      const underShaft = new THREE.Mesh(strutSpineGeo, materials.darkChassis);
      underShaft.scale.set(1, 1.3 - t * 0.35, 1);
      underShaft.position.set(side * -0.016, -0.38, -0.01);
      featherPivot.add(underShaft);

      wristPivot.add(featherPivot);
      primaries.push({ pivot: featherPivot, index: i, t });
    }

    return {
      side,
      shoulderPivot,
      elbowPivot,
      wristPivot,
      coverts,
      secondaries,
      primaries,
      shoulderGear,
      elbowGear,
    };
  }

  const leftWing = buildSingleWing(1);
  const rightWing = buildSingleWing(-1);

  return {
    leftWing,
    rightWing,
    explodablePlates,
  };
}
