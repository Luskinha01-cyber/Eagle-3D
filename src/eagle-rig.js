import * as THREE from 'three';
import { createEagleMaterials } from './materials.js';
import { createEagleHeadAssembly } from './eagle-head.js';
import { createEagleTorsoAssembly } from './eagle-torso.js';
import { createEagleWingsAssembly } from './eagle-wings.js';
import { createEagleLegsAndTail } from './eagle-legs.js';

const { lerp, smootherstep, clamp } = THREE.MathUtils;

/**
 * Assembles the full hierarchical Bionic Eagle Rig (AQUILA MK-IX) and drives
 * scroll-choreographed kinematic poses, gear meshing, optical focus, and exploded armor.
 */
export function createBionicEagleRig() {
  const materials = createEagleMaterials();

  const root = new THREE.Group();
  root.name = 'BionicEagleRoot';

  const chassisPivot = new THREE.Group();
  chassisPivot.name = 'ChassisPivot';
  root.add(chassisPivot);

  // 1. Torso
  const torso = createEagleTorsoAssembly(materials);
  torso.torsoGroup.position.set(0, 1.62, 0.08);
  chassisPivot.add(torso.torsoGroup);

  // 2. Neck & Head
  const head = createEagleHeadAssembly(materials);
  head.neckGroup.position.set(0, 0.45, 0.10);
  torso.torsoGroup.add(head.neckGroup);

  // 3. Articulated Left & Right Wings
  const wings = createEagleWingsAssembly(materials);
  wings.leftWing.shoulderPivot.position.set(0.32, 0.28, -0.04);
  wings.rightWing.shoulderPivot.position.set(-0.32, 0.28, -0.04);
  torso.torsoGroup.add(wings.leftWing.shoulderPivot, wings.rightWing.shoulderPivot);

  // 4. Heavy Bionic Legs + Articulated Tail Fan
  const legsAndTail = createEagleLegsAndTail(materials);
  legsAndTail.leftLeg.hipPivot.position.set(0.29, 1.16, -0.05);
  legsAndTail.rightLeg.hipPivot.position.set(-0.27, 1.16, 0.11);
  chassisPivot.add(legsAndTail.leftLeg.hipPivot, legsAndTail.rightLeg.hipPivot);

  legsAndTail.tailGroup.position.set(0, -0.52, -0.22);
  torso.torsoGroup.add(legsAndTail.tailGroup);

  const allExplodablePlates = [
    ...head.explodablePlates,
    ...torso.explodablePlates,
    ...wings.explodablePlates,
    ...legsAndTail.explodablePlates,
  ];

  let gearPhase = 0;
  let currentExplode = 0;

  function update({
    scrollProgress = 0,
    scrollVelocity = 0,
    elapsed = 0,
    delta = 0.016,
    pointerX = 0,
    pointerY = 0,
    manualExplode = false,
    reducedMotion = false,
  }) {
    const p = clamp(scrollProgress, 0, 1);
    const motionScale = reducedMotion ? 0.2 : 1.0;

    const sHeadFocus = smootherstep(p, 0.14, 0.34) * (1 - smootherstep(p, 0.46, 0.64));
    const sAutoExplode = smootherstep(p, 0.42, 0.56) * (1 - smootherstep(p, 0.64, 0.76));
    const sFlight = smootherstep(p, 0.62, 0.84);
    const sStrikePeak = smootherstep(p, 0.70, 0.82) * (1 - smootherstep(p, 0.88, 0.98));

    const targetExplode = manualExplode ? 1.0 : sAutoExplode;
    currentExplode = THREE.MathUtils.damp(currentExplode, targetExplode, 6.0, delta);

    const breath = Math.sin(elapsed * 1.9) * 0.018 * motionScale;
    const flightFlap = Math.sin(elapsed * 3.1) * 0.065 * sFlight * motionScale;

    // --- 1. Root Turntable & Elevation ---
    // Keep dramatic 3/4 profile angles during Chapters 1-3 so the hooked beak & cyan eye shine!
    const baseYaw =
      lerp(-1.04, -0.82, smootherstep(p, 0.0, 0.34)) +
      lerp(0, 0.48, smootherstep(p, 0.34, 0.62)) +
      lerp(0, 0.34, smootherstep(p, 0.62, 0.85));

    root.rotation.y = baseYaw + pointerX * 0.10 * motionScale;

    const liftY = sFlight * 0.46 + Math.sin(elapsed * 2.4) * 0.045 * sFlight * motionScale;
    chassisPivot.position.y = liftY;
    chassisPivot.rotation.z = clamp(scrollVelocity * -0.35, -0.08, 0.08) * motionScale;

    // --- 2. Torso Pitch ---
    const torsoPitch =
      0.52 +
      breath * 0.6 +
      sStrikePeak * 0.24 -
      smootherstep(p, 0.86, 1.0) * 0.10;
    torso.torsoGroup.rotation.x = torsoPitch;

    // --- 3. Neck, Head, Beak & Optical Iris ---
    head.neckGroup.rotation.x = -0.46 - breath * 0.5 - sStrikePeak * 0.15;
    head.neckGroup.rotation.y = sHeadFocus * 0.10 + pointerX * 0.14 * motionScale;

    head.headGroup.rotation.x =
      0.05 +
      sHeadFocus * 0.06 -
      sStrikePeak * 0.12 -
      pointerY * 0.10 * motionScale;
    head.headGroup.rotation.y = sHeadFocus * 0.08 + pointerX * 0.18 * motionScale;
    head.headGroup.rotation.z = sHeadFocus * -0.06;

    const beakOpen =
      0.025 +
      sHeadFocus * 0.16 +
      sStrikePeak * 0.22 +
      Math.max(0, Math.sin(elapsed * 2.5)) * 0.025 * motionScale;
    head.lowerBeakPivot.rotation.x = beakOpen;

    for (const { group, side } of head.irisRotators) {
      group.rotation.x = elapsed * 0.85 * side * motionScale + p * Math.PI * 3 * side;
      const irisScale = 1.0 + sHeadFocus * 0.12 + Math.sin(elapsed * 4.0) * 0.03 * motionScale;
      group.scale.set(1, irisScale, irisScale);
    }
    head.eyeGlowLight.intensity = 0.75 + sHeadFocus * 0.75 + currentExplode * 0.5;

    // --- 4. Multi-Jointed Wing Choreography ---
    const wingOpen = clamp(sFlight + currentExplode * 0.22, 0, 1);

    for (const wing of [wings.leftWing, wings.rightWing]) {
      const s = wing.side;

      wing.shoulderPivot.rotation.z =
        s * lerp(0.05, 1.32 + flightFlap, wingOpen) +
        s * breath * 0.4;
      wing.shoulderPivot.rotation.x = lerp(-0.22, -0.32, wingOpen);
      wing.shoulderPivot.rotation.y = s * lerp(-0.08, -0.22, wingOpen);

      wing.elbowPivot.rotation.z = s * lerp(-0.04, 0.32 + flightFlap * 0.6, wingOpen);
      wing.elbowPivot.rotation.x = lerp(-0.06, 0.12, wingOpen);

      wing.wristPivot.rotation.z = s * lerp(-0.02, 0.25 + flightFlap * 0.5, wingOpen);
      wing.wristPivot.rotation.x = lerp(-0.24, 0.08, wingOpen);

      for (let c = 0; c < wing.coverts.length; c++) {
        const ct = c / (wing.coverts.length - 1);
        wing.coverts[c].rotation.z = s * lerp(0, 0.20 - ct * 0.35, wingOpen);
      }

      // Secondary flight blades fan across the inner wing to eliminate any mid-wing gap
      for (const sec of wing.secondaries) {
        const secAngle = lerp(
          (0.3 - sec.t) * 0.05,
          -0.08 - sec.t * 0.58,
          wingOpen
        );
        sec.pivot.rotation.z = s * secAngle;
      }

      // 11 Primary Flight Blades fan out progressively
      for (const prim of wing.primaries) {
        const fanAngle = lerp(
          (0.5 - prim.t) * 0.08,
          0.48 - prim.t * 0.74,
          wingOpen
        );
        const aeroFlex = clamp(scrollVelocity * 1.4, -0.14, 0.14) * (1 - prim.t * 0.5) * motionScale;
        prim.pivot.rotation.z = s * fanAngle;
        prim.pivot.rotation.x = aeroFlex;
      }

      wing.shoulderGear.rotation.z = gearPhase * s * 0.8;
      wing.elbowGear.rotation.z = -gearPhase * s * 1.1;
    }

    // --- 5. Legs & 4-Toe Raptor Talons ---
    const leftHipPerch = -0.14;
    const rightHipPerch = -0.30;
    legsAndTail.leftLeg.hipPivot.rotation.x = lerp(
      leftHipPerch,
      -0.68 + sStrikePeak * 0.32,
      sFlight
    );
    legsAndTail.leftLeg.kneePivot.rotation.x = lerp(0.22, 0.88 - sStrikePeak * 0.35, sFlight);
    legsAndTail.leftLeg.footGroup.rotation.x = lerp(-0.08, 0.36 - sStrikePeak * 0.55, sFlight);

    legsAndTail.rightLeg.hipPivot.rotation.x = lerp(
      rightHipPerch,
      -0.62 + sStrikePeak * 0.36,
      sFlight
    );
    legsAndTail.rightLeg.kneePivot.rotation.x = lerp(0.36, 0.82 - sStrikePeak * 0.35, sFlight);
    legsAndTail.rightLeg.footGroup.rotation.x = lerp(-0.06, 0.32 - sStrikePeak * 0.55, sFlight);

    const clawGrip = lerp(0.06, 0.42, sFlight);
    for (const leg of [legsAndTail.leftLeg, legsAndTail.rightLeg]) {
      for (const toe of leg.toes) {
        for (let j = 1; j < toe.joints.length; j++) {
          toe.joints[j].rotation.x = clawGrip * (j === toe.joints.length - 1 ? 1.25 : 0.75);
        }
      }
      for (const g of leg.gears) {
        g.rotation.z = gearPhase * leg.side * 0.7;
      }
    }

    // --- 6. Tail Feather Fan ---
    legsAndTail.tailGroup.rotation.x = lerp(-0.22, 0.38, sFlight);
    for (const tf of legsAndTail.tailFeathers) {
      tf.pivot.rotation.z = tf.centered * lerp(0.035, 0.145, sFlight);
    }

    // --- 7. Counter-Rotating Brass Gear Train ---
    const baseRpm = 0.65 * motionScale;
    const scrollBoost = Math.abs(scrollVelocity) * 32.0 + currentExplode * 1.4;
    gearPhase += delta * (baseRpm + scrollBoost);

    for (const g of torso.gears) {
      g.mesh.rotation.z = gearPhase * g.ratio;
    }

    // --- 8. Exploded Armor Engineering Separation ---
    for (const plate of allExplodablePlates) {
      plate.position.copy(plate.userData.basePos).addScaledVector(
        plate.userData.explodeOffset,
        currentExplode
      );
    }

    return {
      wingSpanDeg: Math.round(lerp(18, 168, wingOpen)),
      explodePercent: Math.round(currentExplode * 100),
      coreRpm: Math.round(840 + (baseRpm + scrollBoost) * 420),
    };
  }

  function dispose() {
    root.traverse((obj) => {
      if (obj.isMesh && obj.geometry) {
        obj.geometry.dispose();
      }
    });
    materials.dispose();
  }

  return {
    root,
    materials,
    update,
    dispose,
  };
}
