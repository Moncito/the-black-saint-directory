"use client";

import { useMemo, useRef } from "react";
import { useFrame, useThree } from "@react-three/fiber";
import * as THREE from "three";

const vertex = /* glsl */ `
  varying vec2 vUv;
  void main() {
    vUv = uv;
    gl_Position = vec4(position.xy, 0.0, 1.0);
  }
`;

const fragment = /* glsl */ `
  precision highp float;
  varying vec2 vUv;
  uniform float uTime;
  uniform float uAspect;
  uniform float uIntensity;
  uniform vec2 uPointer;

  float hash(vec2 p) {
    p = fract(p * vec2(123.34, 456.21));
    p += dot(p, p + 45.32);
    return fract(p.x * p.y);
  }

  float noise(vec2 p) {
    vec2 i = floor(p);
    vec2 f = fract(p);
    vec2 u = f * f * (3.0 - 2.0 * f);
    return mix(
      mix(hash(i), hash(i + vec2(1.0, 0.0)), u.x),
      mix(hash(i + vec2(0.0, 1.0)), hash(i + vec2(1.0, 1.0)), u.x),
      u.y
    );
  }

  float fbm(vec2 p) {
    float v = 0.0;
    float a = 0.5;
    for (int i = 0; i < OCTAVES; i++) {
      v += a * noise(p);
      p = p * 2.03 + vec2(17.1, 9.2);
      a *= 0.5;
    }
    return v;
  }

  void main() {
    vec2 p = vec2(vUv.x * uAspect, vUv.y) * 1.6;
    p += uPointer * 0.06;
    float t = uTime * 0.018;

    // Domain-warped fog, drifting slowly.
    vec2 q = vec2(fbm(p + vec2(t, -t * 0.6)), fbm(p + vec2(-t * 0.4, t) + 4.7));
    float f = fbm(p + q * 1.4 + vec2(t * 0.5, 0.0));

    // Denser toward the floor, clear at the top edge for the nav.
    float falloff = smoothstep(1.15, 0.1, vUv.y) * 0.75 + 0.25;
    float fog = smoothstep(0.38, 0.95, f) * falloff;

    float alpha = fog * 0.11 * uIntensity;
    gl_FragColor = vec4(vec3(alpha), alpha);
  }
`;

/**
 * Faint drifting fog: the atmosphere every route shares. One fullscreen
 * triangle; octave count scales with the quality tier.
 */
export function Fog({ octaves, intensity }: { octaves: number; intensity: number }) {
  const material = useRef<THREE.ShaderMaterial>(null);
  const size = useThree((s) => s.size);

  const geometry = useMemo(() => {
    const g = new THREE.BufferGeometry();
    g.setAttribute(
      "position",
      new THREE.BufferAttribute(new Float32Array([-1, -1, 0, 3, -1, 0, -1, 3, 0]), 3),
    );
    g.setAttribute("uv", new THREE.BufferAttribute(new Float32Array([0, 0, 2, 0, 0, 2]), 2));
    return g;
  }, []);

  const uniforms = useMemo(
    () => ({
      uTime: { value: 0 },
      uAspect: { value: 1 },
      uIntensity: { value: 0 },
      uPointer: { value: new THREE.Vector2() },
    }),
    [],
  );

  useFrame((state, delta) => {
    const u = material.current?.uniforms;
    if (!u) return;
    const dt = Math.min(delta, 0.1);
    u.uTime.value += dt;
    u.uAspect.value = size.width / Math.max(size.height, 1);
    // Heavy easing toward the route's target — nothing snaps.
    u.uIntensity.value =
      state.frameloop === "demand"
        ? intensity
        : THREE.MathUtils.damp(u.uIntensity.value, intensity, 1.2, dt);
    (u.uPointer.value as THREE.Vector2).lerp(state.pointer, 1 - Math.exp(-dt * 1.5));
  });

  return (
    <mesh geometry={geometry} frustumCulled={false} renderOrder={-1}>
      <shaderMaterial
        key={octaves}
        ref={material}
        vertexShader={vertex}
        fragmentShader={fragment}
        uniforms={uniforms}
        defines={{ OCTAVES: octaves }}
        transparent
        depthTest={false}
        depthWrite={false}
        blending={THREE.CustomBlending}
        blendSrc={THREE.OneFactor}
        blendDst={THREE.OneMinusSrcAlphaFactor}
      />
    </mesh>
  );
}
