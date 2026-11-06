import * as THREE from 'three';
import {
  createCurvedPlateGeometry,
  createFeatherBladeGeometry,
  createGearGeometry,
  createHydraulicStrut,
  createTalonClawGeometry,
  mirrorGeometryX,
} from './geometry-helpers.js';

/**
 * Builds an articulated 4-toe Raptor Talon Foot (3 forward toes + 1 rear hallux)
 * with segmented gunmetal phalanges, brass knuckle collars, and curved chrome claws.
 */
function createRaptorFoot(materials, side, clawGeo, knuckleGearGeo) {
  const footGroup = new THREE.Group();
  footGroup.name = side > 0 ? 'LeftFoot' : 'RightFoot';

  // Heavy Ankle / Tarsus Hub
  const ankleBlock = new THREE.Mesh(
    new THREE.CylinderGeometry(0.095, 0.11, 0.12, 18),
    materials.darkChassis
  );
  ankleBlock.position.y = 0.02;
  ankleBlock.castShadow = true;
  footGroup.add(ankleBlock);

  const ankleGear = new THREE.Mesh(knuckleGearGeo, materials.brassGold);
  ankleGear.rotation.y = Math.PI * 0.5;
  ankleGear.position.set(side * 0.085, 0.03, 0);
  footGroup.add(ankleGear);

  const phalangeGeo = new THREE.CylinderGeometry(0.036, 0.032, 0.13, 14);
  phalangeGeo.rotateX(Math.PI * 0.5);

  const collarGeo = new THREE.TorusGeometry(0.038, 0.009, 10, 18);

  const toeConfigs = [
    { name: 'InnerToe', yaw: side * -0.44, scale: 0.90, zOff: 0.05, segments: 2 },
    { name: 'CenterToe', yaw: 0.0, scale: 1.08, zOff: 0.07, segments: 3 },
    { name: 'OuterToe', yaw: side * 0.44, scale: 0.92, zOff: 0.05, segments: 2 },
    { name: 'RearHallux', yaw: Math.PI, scale: 0.86, zOff: -0.05, segments: 2 },
  ];

  const toes = [];

  for (const cfg of toeConfigs) {
    const toeRoot = new THREE.Group();
    toeRoot.position.set(
      Math.sin(cfg.yaw) * 0.04,
      -0.03,
      cfg.zOff
    );
    toeRoot.rotation.y = cfg.yaw;
    toeRoot.scale.setScalar(cfg.scale);

    let parent = toeRoot;
    const joints = [toeRoot];

    for (let s = 0; s < cfg.segments; s++) {
      const segGroup = new THREE.Group();
      if (s > 0) {
        segGroup.position.set(0, -0.008, 0.115);
      }

      const segMesh = new THREE.Mesh(phalangeGeo, materials.darkChassis);
      segMesh.position.z = 0.06;
      segMesh.castShadow = true;
      segMesh.receiveShadow = true;
      segGroup.add(segMesh);

      const collar = new THREE.Mesh(collarGeo, materials.brassGold);
      collar.position.z = 0.115;
      segGroup.add(collar);

      parent.add(segGroup);
      parent = segGroup;
      if (s > 0) joints.push(segGroup);
    }

    // Razor-sharp curved chrome claw at tip of final phalange
    const clawPivot = new THREE.Group();
    clawPivot.position.set(0, 0.005, 0.115);
    const clawMesh = new THREE.Mesh(clawGeo, materials.chromeClaw);
    clawMesh.castShadow = true;
    clawPivot.add(clawMesh);
    parent.add(clawPivot);
    joints.push(clawPivot);

    footGroup.add(toeRoot);
    toes.push({
      isRear: cfg.name === 'RearHallux',
      joints,
    });
  }

  return { footGroup, toes, ankleGear };
}

/**
 * Builds the Bionic Eagle's heavy exoskeleton legs (Left & Right) + Articulated Tail Fan.
 */
export function createEagleLegsAndTail(materials) {
  const explodablePlates = [];
  const registerExplodable = (mesh, offsetVec) => {
    mesh.userData.basePos = mesh.position.clone();
    mesh.userData.explodeOffset = offsetVec.clone();
    explodablePlates.push(mesh);
  };

  // Shared Geometries
  const clawGeo = createTalonClawGeometry(0.22, 0.034);
  const hipGearGeo = createGearGeometry({
    outerRadius: 0.135,
    innerRadius: 0.098,
    boreRadius: 0.038,
    teeth: 16,
    thickness: 0.034,
    spokes: 5,
  });
  const knuckleGearGeo = createGearGeometry({
    outerRadius: 0.072,
    innerRadius: 0.052,
    boreRadius: 0.02,
    teeth: 11,
    thickness: 0.026,
    spokes: 0,
  });

  // Sculpted Curved White Thigh Armor Shell (matches rounded white upper-leg armor in photo)
  const thighArmorShape = new THREE.Shape();
  thighArmorShape.moveTo(0, 0.30);
  thighArmorShape.bezierCurveTo(0.20, 0.28, 0.25, 0.08, 0.20, -0.22);
  thighArmorShape.bezierCurveTo(0.14, -0.34, -0.12, -0.34, -0.18, -0.20);
  thighArmorShape.bezierCurveTo(-0.24, 0.06, -0.18, 0.28, 0, 0.30);

  const thighArmorGeoL = createCurvedPlateGeometry(thighArmorShape, {
    depth: 0.034,
    bevelThickness: 0.013,
    bevelSize: 0.012,
    bendX: 0.12,
    bendY: 0.06,
    domeZ: 0.045,
  });
  const thighArmorGeoR = mirrorGeometryX(thighArmorGeoL);

  // Sculpted White Shin / Tibia Greave Shield (front/outer armor with cooling vent louvers)
  const shinArmorShape = new THREE.Shape();
  shinArmorShape.moveTo(0, 0.28);
  shinArmorShape.bezierCurveTo(0.16, 0.26, 0.19, 0.04, 0.13, -0.24);
  shinArmorShape.bezierCurveTo(0.06, -0.30, -0.06, -0.30, -0.13, -0.22);
  shinArmorShape.bezierCurveTo(-0.18, 0.04, -0.15, 0.26, 0, 0.28);

  const shinArmorGeoL = createCurvedPlateGeometry(shinArmorShape, {
    depth: 0.03,
    bevelThickness: 0.011,
    bevelSize: 0.01,
    bendX: 0.10,
    bendY: 0.05,
    domeZ: 0.035,
  });
  const shinArmorGeoR = mirrorGeometryX(shinArmorGeoL);

  const ventSlotGeo = new THREE.BoxGeometry(0.065, 0.01, 0.018);

  function buildSingleLeg(side) {
    const isLeft = side > 0;
    const hipPivot = new THREE.Group();
    hipPivot.name = isLeft ? 'LeftLegHip' : 'RightLegHip';

    // Hip Rotary Actuator & Brass Cog
    const hipDrum = new THREE.Mesh(
      new THREE.CylinderGeometry(0.125, 0.125, 0.14, 20),
      materials.darkChassis
    );
    hipDrum.rotation.z = Math.PI * 0.5;
    hipPivot.add(hipDrum);

    const hipGear = new THREE.Mesh(hipGearGeo, materials.brassGold);
    hipGear.rotation.y = Math.PI * 0.5;
    hipGear.position.set(side * 0.075, 0.02, -0.01);
    hipPivot.add(hipGear);

    // Thigh Endoskeleton Struts + Hydraulic Piston
    const femurCore = new THREE.Mesh(
      new THREE.CylinderGeometry(0.088, 0.075, 0.54, 16),
      materials.darkChassis
    );
    femurCore.position.set(0, -0.25, 0.02);
    femurCore.rotation.x = -0.18;
    femurCore.castShadow = true;
    hipPivot.add(femurCore);

    const thighPiston = createHydraulicStrut(0.46, 0.028, materials);
    thighPiston.position.set(side * -0.04, -0.24, -0.07);
    thighPiston.rotation.x = -0.12;
    hipPivot.add(thighPiston);

    // Curved White Thigh/Knee Armor Shell (wrapping outer-front just like the photo!)
    const thighArmor = new THREE.Mesh(
      isLeft ? thighArmorGeoL : thighArmorGeoR,
      materials.ceramicWhite
    );
    thighArmor.position.set(side * 0.085, -0.24, 0.09);
    thighArmor.rotation.y = side * 0.62;
    thighArmor.rotation.x = -0.14;
    thighArmor.castShadow = true;
    thighArmor.receiveShadow = true;
    hipPivot.add(thighArmor);
    registerExplodable(thighArmor, new THREE.Vector3(side * 0.22, 0.02, 0.16));

    // Cooling louver stripes flush on side of thigh armor
    for (let v = 0; v < 5; v++) {
      const vent = new THREE.Mesh(ventSlotGeo, materials.carbonMatte);
      vent.position.set(side * 0.128, -0.21 - v * 0.026, 0.095 - v * 0.004);
      vent.rotation.y = side * 0.65;
      hipPivot.add(vent);
      registerExplodable(vent, new THREE.Vector3(side * 0.22, 0.02, 0.16));
    }

    // --- Knee / Shin Pivot ---
    const kneePivot = new THREE.Group();
    kneePivot.position.set(0, -0.52, 0.08);
    hipPivot.add(kneePivot);

    const kneeGear = new THREE.Mesh(knuckleGearGeo, materials.brassGold);
    kneeGear.scale.setScalar(1.25);
    kneeGear.rotation.y = Math.PI * 0.5;
    kneeGear.position.set(side * -0.06, 0, -0.03);
    kneePivot.add(kneeGear);

    // Lower Shin / Tibiotarsus Dark Mechanical Frame + Rear Pistons
    const shinCore = new THREE.Mesh(
      new THREE.CylinderGeometry(0.078, 0.068, 0.52, 16),
      materials.darkChassis
    );
    shinCore.position.set(0, -0.25, -0.03);
    shinCore.rotation.x = 0.14;
    shinCore.castShadow = true;
    kneePivot.add(shinCore);

    const calfPiston = createHydraulicStrut(0.44, 0.025, materials);
    calfPiston.position.set(0, -0.24, -0.11);
    calfPiston.rotation.x = 0.18;
    kneePivot.add(calfPiston);

    // Sculpted White Front/Outer Shin Greave
    const shinArmor = new THREE.Mesh(
      isLeft ? shinArmorGeoL : shinArmorGeoR,
      materials.ceramicWhite
    );
    shinArmor.position.set(side * 0.04, -0.22, 0.065);
    shinArmor.rotation.y = side * 0.34;
    shinArmor.rotation.x = 0.12;
    shinArmor.castShadow = true;
    shinArmor.receiveShadow = true;
    kneePivot.add(shinArmor);
    registerExplodable(shinArmor, new THREE.Vector3(side * 0.16, -0.02, 0.20));

    // --- Ankle & 4-Toe Raptor Foot ---
    const { footGroup, toes, ankleGear } = createRaptorFoot(
      materials,
      side,
      clawGeo,
      knuckleGearGeo
    );
    footGroup.position.set(0, -0.52, -0.06);
    kneePivot.add(footGroup);

    return {
      side,
      hipPivot,
      kneePivot,
      footGroup,
      toes,
      gears: [hipGear, kneeGear, ankleGear],
    };
  }

  const leftLeg = buildSingleLeg(1);
  const rightLeg = buildSingleLeg(-1);

  // --- Articulated Bionic Tail Feather Fan ---
  const tailGroup = new THREE.Group();
  tailGroup.name = 'TailGroup';

  const tailHub = new THREE.Mesh(
    new THREE.CylinderGeometry(0.14, 0.09, 0.22, 16),
    materials.darkChassis
  );
  tailHub.rotation.x = Math.PI * 0.35;
  tailGroup.add(tailHub);

  const tailFeatherGeo = createFeatherBladeGeometry({
    length: 0.92,
    width: 0.17,
    thickness: 0.015,
    curveBack: 0.0,
    camber: 0.02,
  });

  const tailFeathers = [];
  const tailCount = 7;
  for (let i = 0; i < tailCount; i++) {
    const centered = i - (tailCount - 1) * 0.5; // -3 .. +3
    const pivot = new THREE.Group();
    pivot.position.set(centered * 0.038, -0.04, -0.06 - Math.abs(centered) * 0.012);

    const blade = new THREE.Mesh(
      tailFeatherGeo,
      Math.abs(centered) % 2 === 1 ? materials.silverArmor : materials.ceramicWhite
    );
    blade.castShadow = true;
    blade.receiveShadow = true;
    pivot.add(blade);

    tailGroup.add(pivot);
    tailFeathers.push({ pivot, centered });
  }

  return {
    leftLeg,
    rightLeg,
    tailGroup,
    tailFeathers,
    explodablePlates,
  };
}

