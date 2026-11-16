import * as THREE from "three";

/**
 * Body + head as one mesh. Vertices carry no world position: only where they
 * sit on the body (`aU`, 0 tail → 1 head) and their offset in the path's
 * frame (`aOffset`: along the tangent, sideways, out of the plane). The vertex
 * shader places them.
 */

/** Stroke weight of the logo is 12 units, so the tube radius is 6. */
export const RADIUS = 6;

/** Head silhouette, matched to the logo's head: [distance past the path end, radius]. */
const HEAD: [number, number][] = [
  [0, 6],
  [2, 6.6],
  [5, 7.6],
  [7.5, 7.8],
  [10, 6.9],
  [12.5, 5.0],
  [14.5, 3.0],
  [15.8, 1.3],
  [16.4, 0],
];

const HEAD_FLATTEN = 0.72;

const taper = (u: number) =>
  Math.sqrt(Math.min(u / 0.012, 1)) * (0.5 + 0.5 * THREE.MathUtils.smoothstep(u, 0, 0.06));

export function createSerpentGeometry(lengthSegments: number, radialSegments: number) {
  const aU: number[] = [];
  const aOffset: number[] = [];
  const aNormal: number[] = [];
  const aAngle: number[] = [];
  const aTaper: number[] = [];
  const index: number[] = [];

  const ring = (
    u: number,
    along: number,
    radius: number,
    slope: number,
    squash: number,
    thin: number,
  ) => {
    for (let j = 0; j <= radialSegments; j++) {
      const a = (j / radialSegments) * Math.PI * 2;
      const c = Math.cos(a);
      const s = Math.sin(a);
      aU.push(u);
      aOffset.push(along, c * radius, s * radius * squash);
      const n = new THREE.Vector3(-slope, c, s / squash).normalize();
      aNormal.push(n.x, n.y, n.z);
      aAngle.push(j / radialSegments);
      aTaper.push(thin);
    }
  };

  for (let i = 0; i <= lengthSegments; i++) {
    const u = i / lengthSegments;
    // The tail thins in 3D only; flat, it is the logo stroke at full weight.
    ring(u, 0, RADIUS, 0, 1, taper(u));
  }
  for (let k = 1; k < HEAD.length; k++) {
    const [along, radius] = HEAD[k];
    const [pa, pr] = HEAD[k - 1];
    const [na, nr] = HEAD[Math.min(k + 1, HEAD.length - 1)];
    const slope = (nr - pr) / Math.max(na - pa, 1e-3);
    // Ease from a round neck into the flatter head.
    const squash = THREE.MathUtils.lerp(1, HEAD_FLATTEN, Math.min(along / 6, 1));
    ring(1, along, Math.max(radius, 0.001), slope, squash, 1);
  }

  const rings = lengthSegments + HEAD.length;
  const stride = radialSegments + 1;
  for (let i = 0; i < rings - 1; i++) {
    for (let j = 0; j < radialSegments; j++) {
      const a = i * stride + j;
      const b = a + stride;
      index.push(a, b, a + 1, b, b + 1, a + 1);
    }
  }

  const geometry = new THREE.BufferGeometry();
  // three.js wants a `position` attribute; the shader ignores it.
  geometry.setAttribute("position", new THREE.Float32BufferAttribute(aOffset, 3));
  geometry.setAttribute("aOffset", new THREE.Float32BufferAttribute(aOffset, 3));
  geometry.setAttribute("aNormal", new THREE.Float32BufferAttribute(aNormal, 3));
  geometry.setAttribute("aU", new THREE.Float32BufferAttribute(aU, 1));
  geometry.setAttribute("aAngle", new THREE.Float32BufferAttribute(aAngle, 1));
  geometry.setAttribute("aTaper", new THREE.Float32BufferAttribute(aTaper, 1));
  geometry.setIndex(index);
  return geometry;
}
