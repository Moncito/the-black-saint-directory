import * as THREE from "three";
import type { SerpentPath } from "./path";

const vertex = /* glsl */ `
  precision highp float;
  precision highp sampler2D;

  uniform sampler2D uPath;
  uniform float uCount;
  uniform float uTotal;
  uniform float uBody;
  uniform float uHead;
  uniform float uWiggle;
  uniform float uTime;
  uniform float uFlat;
  uniform float uLoop;

  in vec3 aOffset;
  in vec3 aNormal;
  in float aU;
  in float aAngle;
  in float aTaper;

  out vec3 vWorld;
  out vec3 vNormal;
  out vec3 vTangent;
  out float vU;
  out float vAngle;
  out float vViewZ;

  vec3 fetchRow(float s, int row) {
    // An open path clamps at its ends; a closed loop wraps.
    float t = uLoop > 0.5 ? fract(s / uTotal) : clamp(s / uTotal, 0.0, 1.0);
    float f = t * (uCount - 1.0);
    float i = floor(f);
    vec3 a = texelFetch(uPath, ivec2(int(i), row), 0).xyz;
    vec3 b = texelFetch(uPath, ivec2(int(min(i + 1.0, uCount - 1.0)), row), 0).xyz;
    return mix(a, b, f - i);
  }

  // Centreline at arc length s, with the undulation applied sideways.
  vec3 centerAt(float s, float amp) {
    vec3 p = fetchRow(s, 0);
    vec3 t = normalize(fetchRow(s, 1));
    vec3 side = normalize(cross(t, vec3(0.0, 0.0, 1.0)) + vec3(1e-4, 0.0, 0.0));
    p += side * amp * sin(s * 0.043 - uTime * mix(5.2, 1.6, uLoop));
    p.z *= 1.0 - uFlat;
    return p;
  }

  void main() {
    float s = uHead * uTotal - (1.0 - aU) * uBody;
    // The head leads steadily; the sway grows toward the tail.
    float amp = uWiggle * 13.0 * mix(0.3, 1.0, 1.0 - aU);

    vec3 c = centerAt(s, amp);
    vec3 d = centerAt(s + 1.5, amp) - centerAt(s - 1.5, amp);
    vec3 T = length(d) > 1e-4 ? normalize(d) : normalize(fetchRow(s, 1));
    vec3 B = normalize(cross(T, vec3(0.0, 0.0, 1.0)) + vec3(1e-4, 0.0, 0.0));
    vec3 N = cross(B, T);

    // Nothing exists before the start of the path.
    float born = mix(smoothstep(-2.0, 10.0, s), 1.0, uLoop) * mix(aTaper, 1.0, uFlat);
    float depth = 1.0 - uFlat;

    vec3 local = c + T * aOffset.x + B * aOffset.y * born + N * aOffset.z * born * depth;
    vec3 normal = T * aNormal.x + B * aNormal.y + N * aNormal.z;

    vec4 world = modelMatrix * vec4(local, 1.0);
    vec4 view = viewMatrix * world;
    vWorld = world.xyz;
    vNormal = normalize(mat3(modelMatrix) * normal);
    vTangent = normalize(mat3(modelMatrix) * T);
    vU = aU;
    vAngle = aAngle;
    vViewZ = -view.z;
    gl_Position = projectionMatrix * view;
  }
`;

const fragment = /* glsl */ `
  precision highp float;

  uniform vec3 uLightPos;
  uniform float uLight;
  uniform float uFlat;
  uniform float uWhite;
  uniform float uFade;
  uniform float uBody;
  uniform float uCamDist;
  uniform float uUnit;
  uniform float uFar;

  in vec3 vWorld;
  in vec3 vNormal;
  in vec3 vTangent;
  in float vU;
  in float vAngle;
  in float vViewZ;

  out vec4 outColor;

  const vec3 CANDLE = vec3(1.0, 0.86, 0.68);
  const vec3 INK = vec3(0.039);

  void main() {
    vec3 n = normalize(vNormal);
    if (!gl_FrontFacing) n = -n;
    vec3 v = normalize(cameraPosition - vWorld);
    float gloss = 1.0;

    #ifdef SCALES
      // Diamond scales, fixed to the body so they travel with it.
      float su = vU * uBody / 5.2;
      float sv = vAngle * 9.0;
      vec2 cell = vec2(fract(su + sv), fract(su - sv)) - 0.5;
      float ridge = abs(cell.x) + abs(cell.y);
      n = normalize(n + vTangent * cell.x * 0.22 + cross(vTangent, n) * cell.y * 0.14);
      gloss = mix(0.5, 1.0, smoothstep(0.18, 0.5, ridge));
    #endif

    vec3 toLight = uLightPos - vWorld;
    float dist = length(toLight);
    vec3 l = toLight / dist;
    vec3 h = normalize(l + v);
    float range = uUnit * 800.0;
    float atten = uLight / (1.0 + (dist * dist) / (range * range));

    float ndl = dot(n, l);
    float ndh = max(dot(n, h), 0.0);
    float ndv = max(dot(n, v), 0.0);
    float fresnel = pow(1.0 - ndv, 4.0);
    // Wrapped falloff: the candle's light rolls around the body instead of cutting off.
    float wrap = smoothstep(-0.45, 1.0, ndl);

    // Obsidian. Near-black body, a broad warm sheen, a tight hot core.
    vec3 color = vec3(0.016, 0.016, 0.017);
    color += CANDLE * wrap * wrap * 0.07 * atten;
    color += CANDLE * pow(ndh, 18.0) * 0.16 * gloss * atten;
    color += mix(CANDLE, vec3(1.0), 0.35) * pow(ndh, 140.0) * 1.15 * gloss * atten;
    // Lit along its edges by the candle — only on the side that faces it.
    color += CANDLE * fresnel * wrap * 0.42 * atten;
    // A cool, very quiet key from above keeps the form readable in shadow.
    vec3 r = reflect(-v, n);
    float sky = smoothstep(0.1, 1.0, r.y);
    color += vec3(0.78, 0.84, 1.0) * sky * sky * 0.05 * gloss;

    // Emerging from the dark: fade with distance beyond the logo plane.
    float far = max(vViewZ - uCamDist, 0.0) / (uUnit * uFar);
    color = mix(INK, color, exp(-far * far * 2.2));

    // Obsidian → flat white: a warm front runs head → tail, cooling to white behind it.
    float front = uWhite * 1.4 - (1.0 - vU);
    float on = step(0.001, uWhite);
    float white = smoothstep(0.0, 0.34, front) * on;
    float glow = exp(-pow((front - 0.06) / 0.16, 2.0)) * on * (1.0 - uFlat * 0.4);
    vec3 lit = mix(color + CANDLE * 0.5, vec3(1.0), smoothstep(0.1, 0.34, front));
    color = mix(color, lit, max(white, smoothstep(0.9, 1.0, uFlat)));
    color += CANDLE * glow * 0.55;

    // Dither: the body is all low-contrast gradient.
    float dn = fract(sin(dot(gl_FragCoord.xy, vec2(12.9898, 78.233))) * 43758.5453)
      + fract(sin(dot(gl_FragCoord.yx, vec2(39.346, 11.135))) * 24634.6345) - 1.0;
    color = max(color + dn * (1.0 / 255.0) * (1.0 - white), 0.0);

    outColor = vec4(min(color, vec3(1.0)) * uFade, uFade);
  }
`;

export function createSerpentMaterial(path: SerpentPath, scales: boolean) {
  return new THREE.ShaderMaterial({
    glslVersion: THREE.GLSL3,
    vertexShader: vertex,
    fragmentShader: fragment,
    defines: scales ? { SCALES: "" } : {},
    uniforms: {
      uPath: { value: path.texture },
      uCount: { value: path.count },
      uTotal: { value: path.total },
      uBody: { value: path.body },
      uHead: { value: 1 },
      uWiggle: { value: 0 },
      uTime: { value: 0 },
      uFlat: { value: 0 },
      uWhite: { value: 0 },
      uFade: { value: 0 },
      uLight: { value: 1 },
      uLightPos: { value: new THREE.Vector3() },
      uCamDist: { value: 1000 },
      uUnit: { value: 1 },
      uFar: { value: 1300 },
      uLoop: { value: 0 },
    },
    side: THREE.DoubleSide,
    transparent: true,
    premultipliedAlpha: true,
    blending: THREE.CustomBlending,
    blendSrc: THREE.OneFactor,
    blendDst: THREE.OneMinusSrcAlphaFactor,
  });
}
