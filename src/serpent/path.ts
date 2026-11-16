import * as THREE from "three";
import { SYMBOL } from "./state";

/**
 * The One Line, as data.
 *
 * A path is a float texture, sampled uniformly by arc length: row 0 holds
 * positions, row 1 tangents. The vertex shader slides the body along it.
 *
 * `public/brand/serpent-path.json` holds the logo centreline (tail → head) in
 * the master SVG coordinates. A long winding approach out of the dark is
 * prepended. The body is exactly as long as the centreline, so when the head
 * reaches the end the serpent *is* the logo.
 */

export type SerpentPath = {
  texture: THREE.DataTexture;
  count: number;
  /** Total arc length in logo units. */
  total: number;
  /** Arc length of the logo centreline = the body length. */
  body: number;
};

type PathJson = { centerline: string };

const COUNT = 2048;

/**
 * Off-screen approach in logo units (x right, y up, z toward the camera),
 * ending at the tail of the centreline and heading up into it. A long lazy S.
 */
const APPROACH: [number, number, number][] = [
  [150, 215, -1300],
  [-110, 150, -950],
  [100, 70, -640],
  [-130, 0, -400],
  [112, -72, -205],
  [10, -150, -70],
  [-16, -95, -8],
];

function sampleCenterline(d: string): THREE.Vector3[] {
  const svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
  const path = document.createElementNS("http://www.w3.org/2000/svg", "path");
  path.setAttribute("d", d);
  svg.appendChild(path);
  svg.setAttribute("width", "0");
  svg.setAttribute("height", "0");
  svg.style.position = "absolute";
  document.body.appendChild(svg);

  const length = path.getTotalLength();
  const steps = Math.ceil(length / 0.5);
  const points: THREE.Vector3[] = [];
  for (let i = 0; i <= steps; i++) {
    const s = (i / steps) * length;
    const p = path.getPointAtLength(s);
    // The tail tucks under the first strand of the crossbar, as in the logo.
    const under = 1 - THREE.MathUtils.smoothstep(s, 5, 24);
    points.push(new THREE.Vector3(p.x - SYMBOL.cx, -(p.y - SYMBOL.cy), -12.5 * under));
  }
  svg.remove();
  return points;
}

/** Resample a polyline uniformly by arc length into the two-row texture. */
function toTexture(points: THREE.Vector3[], closed: boolean) {
  const cumulative = new Float32Array(points.length);
  for (let i = 1; i < points.length; i++)
    cumulative[i] = cumulative[i - 1] + points[i].distanceTo(points[i - 1]);
  const total = cumulative[points.length - 1];

  const positions: THREE.Vector3[] = [];
  let j = 0;
  for (let i = 0; i < COUNT; i++) {
    const s = (i / (COUNT - 1)) * total;
    while (j < points.length - 2 && cumulative[j + 1] < s) j++;
    const span = cumulative[j + 1] - cumulative[j] || 1;
    positions.push(points[j].clone().lerp(points[j + 1], (s - cumulative[j]) / span));
  }

  const data = new Float32Array(COUNT * 2 * 4);
  const tangent = new THREE.Vector3();
  const last = COUNT - 1;
  for (let i = 0; i < COUNT; i++) {
    const p = positions[i];
    // On a closed loop the first and last samples coincide, so wrap past them.
    const next = closed ? positions[i === last ? 1 : i + 1] : positions[Math.min(i + 1, last)];
    const prev = closed ? positions[i === 0 ? last - 1 : i - 1] : positions[Math.max(i - 1, 0)];
    tangent.subVectors(next, prev).normalize();
    data.set([p.x, p.y, p.z, 1], i * 4);
    data.set([tangent.x, tangent.y, tangent.z, 0], (COUNT + i) * 4);
  }

  const texture = new THREE.DataTexture(data, COUNT, 2, THREE.RGBAFormat, THREE.FloatType);
  texture.minFilter = THREE.NearestFilter;
  texture.magFilter = THREE.NearestFilter;
  texture.generateMipmaps = false;
  texture.needsUpdate = true;
  return { texture, total };
}

export async function loadIntroPath(): Promise<SerpentPath> {
  const json = (await fetch("/brand/serpent-path.json").then((r) => r.json())) as PathJson;
  const logo = sampleCenterline(json.centerline);

  const lead = [...APPROACH.map((p) => new THREE.Vector3(...p)), logo[0].clone().setZ(0)];
  const approach = new THREE.CatmullRomCurve3(lead, false, "centripetal").getSpacedPoints(1600);
  // Ease the approach down to the tail's depth so the join has no kink.
  const blend = 60;
  for (let i = 0; i < blend; i++) {
    const p = approach[approach.length - 1 - i];
    p.z += logo[0].z * (1 - i / blend);
  }

  let body = 0;
  for (let i = 1; i < logo.length; i++) body += logo[i].distanceTo(logo[i - 1]);

  const { texture, total } = toTexture([...approach.slice(0, -1), ...logo], false);
  return { texture, count: COUNT, total, body };
}

