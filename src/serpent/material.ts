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
    float f = clamp(s / uTotal, 0.0, 1.0) * (uCount - 1.0);
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
    p += side * amp * sin(s * 0.043 - uTime * 5.2);
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
    float born = smoothstep(-2.0, 10.0, s) * mix(aTaper, 1.0, uFlat);
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

    float ndl = max(dot(n, l), 0.0);
    float ndh = max(dot(n, h), 0.0);
    float ndv = max(dot(n, v), 0.0);
    float fresnel = pow(1.0 - ndv, 3.0);

    // Obsidian: almost no diffuse, a tight highlight, a wider sheen.
    vec3 color = vec3(0.012);
    color += CANDLE * ndl * 0.05 * atten;
    color += CANDLE * (pow(ndh, 220.0) * 2.2 + pow(ndh, 28.0) * 0.26) * gloss * atten;
    // Lit along its edges by the candle.
    color += CANDLE * fresnel * (0.25 + 0.75 * smoothstep(-0.3, 0.7, dot(n, l))) * 0.5 * atten;
    // A faint cool studio strip overhead so the form reads even in shadow.
    vec3 r = reflect(-v, n);
    color += vec3(0.82, 0.88, 1.0) * pow(max(r.y, 0.0), 5.0) * 0.07 * gloss;
    color += vec3(1.0) * fresnel * 0.035;

    // Emerging from the dark: fade with distance beyond the logo plane.
    float far = max(vViewZ - uCamDist, 0.0) / (uUnit * 1300.0);
    color = mix(INK, color, exp(-far * far * 2.2));

    // Obsidian → flat white, as a wave running head → tail with a soft flash.
    float front = uWhite * 1.25 - (1.0 - vU);
    float white = smoothstep(0.0, 0.2, front) * step(0.001, uWhite);
    float flash = exp(-pow(front / 0.09, 2.0)) * step(0.001, uWhite) * (1.0 - uFlat * 0.5);
    color = mix(color, vec3(1.0), max(white, smoothstep(0.92, 1.0, uFlat)));
    color += CANDLE * flash * 0.9;

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
    },
    side: THREE.DoubleSide,
    transparent: true,
    premultipliedAlpha: true,
    blending: THREE.CustomBlending,
    blendSrc: THREE.OneFactor,
    blendDst: THREE.OneMinusSrcAlphaFactor,
  });
}
