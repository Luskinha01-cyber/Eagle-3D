import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { RoomEnvironment } from 'three/addons/environments/RoomEnvironment.js';
import { createBionicEagleRig } from './eagle-rig.js';

/**
 * Creates a soft radial circle texture in memory for crisp, non-square micro-particles.
 */
function createParticleSpriteTexture() {
  const canvas = document.createElement('canvas');
  canvas.width = 64;
  canvas.height = 64;
  const ctx = canvas.getContext('2d');
  const grad = ctx.createRadialGradient(32, 32, 0, 32, 32, 32);
  grad.addColorStop(0.0, 'rgba(255, 255, 255, 1)');
  grad.addColorStop(0.35, 'rgba(200, 232, 255, 0.65)');
  grad.addColorStop(1.0, 'rgba(200, 232, 255, 0)');
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, 64, 64);
  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.SRGBColorSpace;
  return tex;
}

/**
 * Initializes the Three.js r183 WebGL scene, PBR studio lighting, calibration pedestal,
 * scroll camera cinematography, and interactive 360° controls.
 */
export function createEagleExperience(canvas) {
  const scene = new THREE.Scene();

  const camera = new THREE.PerspectiveCamera(
    40,
    window.innerWidth / window.innerHeight,
    0.1,
    100
  );
  camera.position.set(0.18, 1.52, 4.35);

  const renderer = new THREE.WebGLRenderer({
    canvas,
    antialias: true,
    alpha: true,
    powerPreference: 'high-performance',
  });
  renderer.setSize(window.innerWidth, window.innerHeight);
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.08;
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFShadowMap;

  // PBR Studio Reflections via RoomEnvironment (essential for white clearcoat + brass + chrome)
  const pmremGenerator = new THREE.PMREMGenerator(renderer);
  pmremGenerator.compileEquirectangularShader();
  const roomEnv = new RoomEnvironment();
  const envRT = pmremGenerator.fromScene(roomEnv, 0.04);
  scene.environment = envRT.texture;
  roomEnv.dispose();
  pmremGenerator.dispose();

  // --- Studio Lighting Setup ---
  const hemiLight = new THREE.HemisphereLight(0xffffff, 0xdbe2ec, 0.85);
  hemiLight.position.set(0, 8, 0);
  scene.add(hemiLight);

  const keyLight = new THREE.DirectionalLight(0xfffcf5, 2.1);
  keyLight.position.set(3.8, 6.2, 4.5);
  keyLight.castShadow = true;
  keyLight.shadow.mapSize.width = 2048;
  keyLight.shadow.mapSize.height = 2048;
  keyLight.shadow.camera.near = 1.0;
  keyLight.shadow.camera.far = 18.0;
  keyLight.shadow.camera.left = -4.2;
  keyLight.shadow.camera.right = 4.2;
  keyLight.shadow.camera.top = 4.5;
  keyLight.shadow.camera.bottom = -1.5;
  keyLight.shadow.bias = -0.0005;
  keyLight.shadow.radius = 3.5;
  scene.add(keyLight);

  // Cool cyan-white rim light to sculpt the white ceramic edges
  const rimLight = new THREE.DirectionalLight(0xd8f0ff, 1.35);
  rimLight.position.set(-4.5, 3.6, -3.8);
  scene.add(rimLight);

  // Warm brass bounce light from below-front to illuminate internal gears
  const gearFillLight = new THREE.PointLight(0xffb85c, 0.9, 6.5, 1.8);
  gearFillLight.position.set(1.2, 1.1, 1.8);
  scene.add(gearFillLight);

  // --- Seamless Studio Shadow Catcher + Precision Calibration Rings ---
  const pedestalGroup = new THREE.Group();
  scene.add(pedestalGroup);

  const shadowMaterial = new THREE.ShadowMaterial({
    color: 0x0f172a,
    opacity: 0.17,
  });
  const shadowPlane = new THREE.Mesh(new THREE.PlaneGeometry(16, 16), shadowMaterial);
  shadowPlane.rotation.x = -Math.PI * 0.5;
  shadowPlane.position.y = -0.002;
  shadowPlane.receiveShadow = true;
  pedestalGroup.add(shadowPlane);

  const outerRingMat = new THREE.MeshBasicMaterial({
    color: 0x94a3b8,
    transparent: true,
    opacity: 0.42,
    side: THREE.DoubleSide,
  });
  const outerCalibRing = new THREE.Mesh(
    new THREE.RingGeometry(1.18, 1.195, 96),
    outerRingMat
  );
  outerCalibRing.rotation.x = -Math.PI * 0.5;
  outerCalibRing.position.y = 0.002;
  pedestalGroup.add(outerCalibRing);

  const innerRingMat = new THREE.MeshBasicMaterial({
    color: 0xd89024,
    transparent: true,
    opacity: 0.48,
    side: THREE.DoubleSide,
  });
  const innerCalibRing = new THREE.Mesh(
    new THREE.RingGeometry(0.76, 0.772, 72, 1, 0, Math.PI * 1.65),
    innerRingMat
  );
  innerCalibRing.rotation.x = -Math.PI * 0.5;
  innerCalibRing.position.y = 0.003;
  pedestalGroup.add(innerCalibRing);

  // Radial calibration degree ticks around pedestal
  const tickGroup = new THREE.Group();
  tickGroup.position.y = 0.003;
  const tickGeo = new THREE.PlaneGeometry(0.012, 0.055);
  tickGeo.rotateX(-Math.PI * 0.5);
  for (let i = 0; i < 36; i++) {
    const a = (i / 36) * Math.PI * 2;
    const tick = new THREE.Mesh(tickGeo, outerRingMat);
    tick.position.set(Math.sin(a) * 1.12, 0, Math.cos(a) * 1.12);
    tick.rotation.y = a;
    tickGroup.add(tick);
  }
  pedestalGroup.add(tickGroup);

  // --- Subtle Aerodynamic Telemetry Particles ---
  const particleCount = 160;
  const particlePositions = new Float32Array(particleCount * 3);
  const particleSpeeds = new Float32Array(particleCount);
  for (let i = 0; i < particleCount; i++) {
    particlePositions[i * 3] = (Math.random() - 0.5) * 9.0;
    particlePositions[i * 3 + 1] = Math.random() * 4.4 + 0.1;
    particlePositions[i * 3 + 2] = (Math.random() - 0.5) * 7.0;
    particleSpeeds[i] = 0.25 + Math.random() * 0.75;
  }
  const particleGeo = new THREE.BufferGeometry();
  particleGeo.setAttribute('position', new THREE.BufferAttribute(particlePositions, 3));
  const particleSprite = createParticleSpriteTexture();
  const particleMat = new THREE.PointsMaterial({
    size: 0.055,
    map: particleSprite,
    color: 0x0284c7,
    transparent: true,
    opacity: 0.36,
    depthWrite: false,
  });
  const particles = new THREE.Points(particleGeo, particleMat);
  scene.add(particles);

  // --- Bionic Eagle Rig ---
  const eagle = createBionicEagleRig();
  scene.add(eagle.root);

  // --- Camera Scroll Curve & Focal Targets ---
  const cameraPath = new THREE.CatmullRomCurve3(
    [
      new THREE.Vector3(0.18, 1.52, 4.30),  // 0.00: Iconic 3/4 Profile (matches reference image)
      new THREE.Vector3(-0.48, 2.18, 2.68), // 0.28: Cranial & Cyan Optical Close-Up
      new THREE.Vector3(0.68, 1.62, 3.22),  // 0.55: Exploded Torso & Spinning Brass Gears
      new THREE.Vector3(0.0, 2.02, 5.55),   // 0.80: Full Kinetic Flight Wingspan
      new THREE.Vector3(0.0, 1.78, 4.85),   // 1.00: Heroic 360° Interactive Showcase
    ],
    false,
    'centripetal',
    0.5
  );

  const lookAtPath = new THREE.CatmullRomCurve3(
    [
      new THREE.Vector3(-0.08, 1.44, 0.04), // 0.00: Centered on perched eagle
      new THREE.Vector3(-0.18, 2.12, 0.22), // 0.28: Head/beak/optical iris
      new THREE.Vector3(-0.22, 1.55, 0.02), // 0.55: Internal brass gear core
      new THREE.Vector3(0.0, 1.92, 0.02),   // 0.80: Elevated flight center
      new THREE.Vector3(0.0, 1.72, 0.0),    // 1.00: Showcase center
    ],
    false,
    'centripetal',
    0.5
  );

  // Optional 360° OrbitControls (toggled on in Interactive Mode)
  const controls = new OrbitControls(camera, canvas);
  controls.enableDamping = true;
  controls.dampingFactor = 0.06;
  controls.enableZoom = true;
  controls.minDistance = 2.0;
  controls.maxDistance = 8.5;
  controls.maxPolarAngle = Math.PI * 0.52;
  controls.target.set(0, 1.5, 0);
  controls.enabled = false;

  // --- Interaction & Smooth Scroll State ---
  const state = {
    targetScroll: 0,
    smoothScroll: 0,
    pointerX: 0,
    pointerY: 0,
    smoothPointerX: 0,
    smoothPointerY: 0,
    manualExplode: false,
    wireframe: false,
    freeOrbit: false,
    darkTheme: false,
    reducedMotion: window.matchMedia('(prefers-reduced-motion: reduce)').matches,
    onTelemetry: null,
  };

  const desiredCamPos = new THREE.Vector3();
  const desiredLookAt = new THREE.Vector3();
  const currentLookAt = new THREE.Vector3(-0.08, 1.44, 0.04);

  // Three.js r183 Timer
  const timer = new THREE.Timer();

  renderer.setAnimationLoop(() => {
    timer.update();
    const delta = Math.min(timer.getDelta(), 0.05);
    const elapsed = timer.getElapsed();

    // Silky-smooth exponential scroll damping (eliminates discrete mouse-wheel stepping)
    const prevScroll = state.smoothScroll;
    state.smoothScroll = THREE.MathUtils.damp(
      state.smoothScroll,
      state.targetScroll,
      6.2,
      delta
    );
    const scrollVelocity = (state.smoothScroll - prevScroll) / Math.max(delta, 0.001) * 0.016;

    state.smoothPointerX = THREE.MathUtils.damp(state.smoothPointerX, state.pointerX, 5.0, delta);
    state.smoothPointerY = THREE.MathUtils.damp(state.smoothPointerY, state.pointerY, 5.0, delta);

    // Update Eagle Rig Kinematics
    const telemetry = eagle.update({
      scrollProgress: state.smoothScroll,
      scrollVelocity,
      elapsed,
      delta,
      pointerX: state.smoothPointerX,
      pointerY: state.smoothPointerY,
      manualExplode: state.manualExplode,
      reducedMotion: state.reducedMotion,
    });

    // Rotate pedestal calibration rings smoothly with scroll & time
    innerCalibRing.rotation.z = elapsed * 0.18 + state.smoothScroll * Math.PI * 2.5;
    tickGroup.rotation.y = -state.smoothScroll * Math.PI * 1.5;

    // Update aerodynamic micro-particles
    if (!state.reducedMotion) {
      const posAttr = particleGeo.attributes.position;
      const flightStream = THREE.MathUtils.smootherstep(state.smoothScroll, 0.62, 0.85);
      for (let i = 0; i < particleCount; i++) {
        const speed = particleSpeeds[i] * (0.18 + flightStream * 2.2 + Math.abs(scrollVelocity) * 6);
        let z = posAttr.getZ(i) - delta * speed;
        let y = posAttr.getY(i) + Math.sin(elapsed + i) * delta * 0.05;
        if (z < -3.5) z = 3.5;
        if (y > 4.5) y = 0.2;
        posAttr.setZ(i, z);
        posAttr.setY(i, y);
      }
      posAttr.needsUpdate = true;
    }

    // Camera Control: Scroll-driven CatmullRom path vs Free 360° Orbit
    if (state.freeOrbit) {
      controls.update();
    } else {
      const t = THREE.MathUtils.clamp(state.smoothScroll, 0, 1);
      cameraPath.getPointAt(t, desiredCamPos);
      lookAtPath.getPointAt(t, desiredLookAt);

      // Responsive aspect adjustment so narrow mobile viewports never clip the wingspan or beak
      const aspect = camera.aspect;
      if (aspect < 1.0) {
        const pullBack = 1 / Math.pow(aspect, 0.62);
        desiredCamPos.z *= pullBack;
        desiredCamPos.x *= 0.35;
        desiredLookAt.x = desiredLookAt.x * 0.3 - 0.14;
        desiredLookAt.y -= 0.15;
      } else if (aspect > 1.25) {
        const ch1Offset = (1 - THREE.MathUtils.smootherstep(t, 0.0, 0.22)) * -0.42;
        desiredLookAt.x += ch1Offset;
      }

      // Subtle cursor parallax
      desiredCamPos.x += state.smoothPointerX * 0.16;
      desiredCamPos.y += state.smoothPointerY * 0.11;

      camera.position.lerp(desiredCamPos, 1 - Math.exp(-8.5 * delta));
      currentLookAt.lerp(desiredLookAt, 1 - Math.exp(-8.5 * delta));
      camera.lookAt(currentLookAt);
    }

    if (state.onTelemetry) {
      state.onTelemetry({
        scrollProgress: state.smoothScroll,
        ...telemetry,
      });
    }

    renderer.render(scene, camera);
  });

  function setScrollProgress(progress) {
    state.targetScroll = THREE.MathUtils.clamp(progress, 0, 1);
  }

  function setPointer(nx, ny) {
    state.pointerX = nx;
    state.pointerY = ny;
  }

  function setExploded(enabled) {
    state.manualExplode = enabled;
  }

  function setWireframe(enabled) {
    state.wireframe = enabled;
    eagle.materials.setWireframe(enabled);
  }

  function setFreeOrbit(enabled) {
    state.freeOrbit = enabled;
    controls.enabled = enabled;
    if (enabled) {
      controls.target.copy(currentLookAt);
      controls.update();
    }
  }

  function setTheme(isDark) {
    state.darkTheme = isDark;
    shadowMaterial.opacity = isDark ? 0.42 : 0.17;
    outerRingMat.color.setHex(isDark ? 0x475569 : 0x94a3b8);
    particleMat.color.setHex(isDark ? 0x38bdf8 : 0x0284c7);
    particleMat.opacity = isDark ? 0.55 : 0.36;
    renderer.toneMappingExposure = isDark ? 1.18 : 1.08;
  }

  function handleResize() {
    const w = window.innerWidth;
    const h = window.innerHeight;
    camera.aspect = w / h;
    camera.updateProjectionMatrix();
    renderer.setSize(w, h);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  }

  window.addEventListener('resize', handleResize);

  function dispose() {
    window.removeEventListener('resize', handleResize);
    renderer.setAnimationLoop(null);
    controls.dispose();
    eagle.dispose();
    envRT.dispose();
    particleGeo.dispose();
    particleMat.dispose();
    particleSprite.dispose();
    renderer.dispose();
  }

  return {
    setScrollProgress,
    setPointer,
    setExploded,
    setWireframe,
    setFreeOrbit,
    setTheme,
    onTelemetry(cb) {
      state.onTelemetry = cb;
    },
    dispose,
  };
}

