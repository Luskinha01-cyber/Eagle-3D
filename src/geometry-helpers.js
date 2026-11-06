import * as THREE from 'three';

/**
 * Extrudes a 2D THREE.Shape and bends it smoothly into a 3D curved hard-surface armor shell.
 */
export function createCurvedPlateGeometry(shape, {
  depth = 0.035,
  bevelThickness = 0.014,
  bevelSize = 0.012,
  bevelSegments = 4,
  curveSegments = 24,
  bendX = 0,
  bendY = 0,
  domeZ = 0,
} = {}) {
  const geo = new THREE.ExtrudeGeometry(shape, {
    depth,
    bevelEnabled: true,
    bevelThickness,
    bevelSize,
    bevelSegments,
    curveSegments,
    steps: 2,
  });

  geo.computeBoundingBox();
  const box = geo.boundingBox;
  const centerX = (box.min.x + box.max.x) * 0.5;
  const centerY = (box.min.y + box.max.y) * 0.5;
  const centerZ = (box.min.z + box.max.z) * 0.5;
  const spanX = Math.max(0.001, (box.max.x - box.min.x) * 0.5);
  const spanY = Math.max(0.001, (box.max.y - box.min.y) * 0.5);

  const pos = geo.attributes.position;
  for (let i = 0; i < pos.count; i++) {
    const x = pos.getX(i) - centerX;
    const y = pos.getY(i) - centerY;
    let z = pos.getZ(i) - centerZ;

    const nx = x / spanX;
    const ny = y / spanY;

    z -= bendX * nx * nx;
    z -= bendY * ny * ny;
    z += domeZ * Math.max(0, 1 - (nx * nx + ny * ny));

    pos.setXYZ(i, x, y, z);
  }

  geo.computeVertexNormals();
  return geo;
}

/**
 * Generates an involute-style toothed mechanical gear geometry with inner spokes.
 */
export function createGearGeometry({
  outerRadius = 0.16,
  innerRadius = 0.115,
  boreRadius = 0.045,
  teeth = 16,
  thickness = 0.032,
  spokes = 5,
} = {}) {
  const shape = new THREE.Shape();
  const step = (Math.PI * 2) / teeth;

  for (let i = 0; i < teeth; i++) {
    const a0 = i * step;
    const a1 = a0 + step * 0.18;
    const a2 = a0 + step * 0.34;
    const a3 = a0 + step * 0.66;
    const a4 = a0 + step * 0.82;

    const p0x = Math.cos(a0) * innerRadius;
    const p0y = Math.sin(a0) * innerRadius;
    if (i === 0) {
      shape.moveTo(p0x, p0y);
    } else {
      shape.lineTo(p0x, p0y);
    }
    shape.lineTo(Math.cos(a1) * innerRadius, Math.sin(a1) * innerRadius);
    shape.lineTo(Math.cos(a2) * outerRadius, Math.sin(a2) * outerRadius);
    shape.lineTo(Math.cos(a3) * outerRadius, Math.sin(a3) * outerRadius);
    shape.lineTo(Math.cos(a4) * innerRadius, Math.sin(a4) * innerRadius);
  }
  shape.closePath();

  const bore = new THREE.Path();
  bore.absarc(0, 0, boreRadius, 0, Math.PI * 2, true);
  shape.holes.push(bore);

  if (spokes > 0 && innerRadius - boreRadius > 0.045) {
    const winInner = boreRadius + 0.018;
    const winOuter = innerRadius - 0.022;
    const spokeStep = (Math.PI * 2) / spokes;
    for (let s = 0; s < spokes; s++) {
      const sa0 = s * spokeStep + spokeStep * 0.16;
      const sa1 = (s + 1) * spokeStep - spokeStep * 0.16;
      if (sa1 > sa0 + 0.12) {
        const hole = new THREE.Path();
        hole.moveTo(Math.cos(sa0) * winInner, Math.sin(sa0) * winInner);
        hole.absarc(0, 0, winOuter, sa0, sa1, false);
        hole.lineTo(Math.cos(sa1) * winInner, Math.sin(sa1) * winInner);
        hole.absarc(0, 0, winInner, sa1, sa0, true);
        shape.holes.push(hole);
      }
    }
  }

  const geo = new THREE.ExtrudeGeometry(shape, {
    depth: thickness,
    bevelEnabled: true,
    bevelThickness: 0.005,
    bevelSize: 0.004,
    bevelSegments: 2,
    curveSegments: 12,
  });
  geo.center();
  geo.computeVertexNormals();
  return geo;
}

/**
 * Generates an aerodynamic, cambered mechanical feather blade anchored at its root (0, 0, 0)
 * extending along -Y (downward when folded, outward when wing unfolds).
 */
export function createFeatherBladeGeometry({
  length = 1.0,
  width = 0.16,
  thickness = 0.014,
  curveBack = 0.12,
  camber = 0.022,
} = {}) {
  const shape = new THREE.Shape();
  shape.moveTo(0, 0.03);
  shape.bezierCurveTo(
    width * 0.55, -length * 0.08,
    width * 0.52, -length * 0.58,
    curveBack, -length
  );
  shape.bezierCurveTo(
    -width * 0.25 + curveBack * 0.55, -length * 0.72,
    -width * 0.48, -length * 0.22,
    0, 0.03
  );

  const geo = new THREE.ExtrudeGeometry(shape, {
    depth: thickness,
    bevelEnabled: true,
    bevelThickness: 0.005,
    bevelSize: 0.005,
    bevelSegments: 2,
    curveSegments: 20,
  });

  const pos = geo.attributes.position;
  for (let i = 0; i < pos.count; i++) {
    const x = pos.getX(i);
    const y = pos.getY(i);
    let z = pos.getZ(i) - thickness * 0.5;

    const t = THREE.MathUtils.clamp(-y / length, 0, 1);
    z *= (1.0 - t * 0.55);
    z += Math.sin(t * Math.PI) * camber;
    pos.setXYZ(i, x, y, z);
  }

  geo.computeVertexNormals();
  return geo;
}

/**
 * Creates a reusable hydraulic cylinder + piston rod assembly along the Y axis.
 */
export function createHydraulicStrut(length, radius, materials) {
  const group = new THREE.Group();

  const sleeveLen = length * 0.58;
  const rodLen = length * 0.56;

  const sleeveGeo = new THREE.CylinderGeometry(radius, radius * 1.06, sleeveLen, 14);
  const sleeve = new THREE.Mesh(sleeveGeo, materials.darkChassis);
  sleeve.position.y = sleeveLen * 0.35;
  sleeve.castShadow = true;

  const collarGeo = new THREE.CylinderGeometry(radius * 1.24, radius * 1.24, length * 0.08, 14);
  const collar = new THREE.Mesh(collarGeo, materials.brassGold);
  collar.position.y = -sleeveLen * 0.12;

  const rodGeo = new THREE.CylinderGeometry(radius * 0.56, radius * 0.56, rodLen, 12);
  const rod = new THREE.Mesh(rodGeo, materials.brushedSteel);
  rod.position.y = -rodLen * 0.45;
  rod.castShadow = true;

  group.add(sleeve, collar, rod);
  return group;
}

/**
 * Creates a curved, razor-sharp raptor talon claw extending along +Z and curving down (-Y).
 */
export function createTalonClawGeometry(length = 0.26, baseRadius = 0.036) {
  const curve = new THREE.CatmullRomCurve3([
    new THREE.Vector3(0, 0, 0),
    new THREE.Vector3(0, 0.012, length * 0.34),
    new THREE.Vector3(0, -length * 0.14, length * 0.72),
    new THREE.Vector3(0, -length * 0.46, length * 0.96),
    new THREE.Vector3(0, -length * 0.64, length * 0.99),
  ]);

  const radialSegments = 12;
  const tubularSegments = 22;
  const geo = new THREE.TubeGeometry(curve, tubularSegments, baseRadius, radialSegments, false);

  const pos = geo.attributes.position;
  const ringVerts = radialSegments + 1;
  const center = new THREE.Vector3();

  for (let i = 0; i <= tubularSegments; i++) {
    const t = i / tubularSegments;
    curve.getPointAt(t, center);
    const taper = Math.pow(1 - t, 0.78);
    for (let j = 0; j < ringVerts; j++) {
      const idx = i * ringVerts + j;
      const vx = pos.getX(idx) - center.x;
      const vy = pos.getY(idx) - center.y;
      const vz = pos.getZ(idx) - center.z;
      pos.setXYZ(
        idx,
        center.x + vx * taper * 0.78,
        center.y + vy * taper * 1.18,
        center.z + vz * taper
      );
    }
  }

  geo.computeVertexNormals();
  return geo;
}

/**
 * Clones and mirrors a BufferGeometry across X = 0 while flipping triangle winding
 * so outward normals and shadow maps remain 100% valid without negative mesh scale.
 */
export function mirrorGeometryX(sourceGeo) {
  const geo = sourceGeo.clone();
  const pos = geo.attributes.position;
  for (let i = 0; i < pos.count; i++) {
    pos.setX(i, -pos.getX(i));
  }

  if (geo.index) {
    const idx = geo.index.array;
    for (let i = 0; i < idx.length; i += 3) {
      const tmp = idx[i + 1];
      idx[i + 1] = idx[i + 2];
      idx[i + 2] = tmp;
    }
    geo.index.needsUpdate = true;
  } else {
    for (let i = 0; i < pos.count; i += 3) {
      const x1 = pos.getX(i + 1), y1 = pos.getY(i + 1), z1 = pos.getZ(i + 1);
      pos.setXYZ(i + 1, pos.getX(i + 2), pos.getY(i + 2), pos.getZ(i + 2));
      pos.setXYZ(i + 2, x1, y1, z1);
    }
  }

  geo.computeVertexNormals();
  return geo;
}
