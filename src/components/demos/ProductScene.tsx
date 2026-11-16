"use client";

import { useMemo, useRef, type RefObject } from "react";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import * as THREE from "three";
import { HOTSPOTS, type Spin } from "./product";

const PROFILE: [number, number][] = [
  [0.0, -1.3],
  [0.52, -1.3],
  [0.6, -1.22],
  [0.56, -1.05],
  [0.3, -0.86],
  [0.2, -0.6],
  [0.24, -0.3],
  [0.56, 0.05],
  [0.82, 0.5],
  [0.86, 0.86],
  [0.8, 1.16],
  [0.72, 1.3],
  [0.66, 1.3],
  [0.72, 1.12],
  [0.76, 0.86],
  [0.7, 0.52],
  [0.42, 0.12],
  [0.0, 0.02],
];

function Vessel({
  spin,
  dots,
  reducedMotion,
}: {
  spin: RefObject<Spin>;
  dots: RefObject<(HTMLButtonElement | null)[]>;
  reducedMotion: boolean;
}) {
  const group = useRef<THREE.Group>(null);
  const light = useRef<THREE.PointLight>(null);
  const size = useThree((s) => s.size);
  const camera = useThree((s) => s.camera);

  // Procedural: a lathed profile, no model file to download.
  const geometry = useMemo(() => {
    const curve = new THREE.SplineCurve(PROFILE.map(([x, y]) => new THREE.Vector2(x, y)));
    const g = new THREE.LatheGeometry(curve.getPoints(90), 96);
    g.computeVertexNormals();
    return g;
  }, []);

  const p = useMemo(() => new THREE.Vector3(), []);
  const n = useMemo(() => new THREE.Vector3(), []);

  useFrame((state, delta) => {
    const g = group.current;
    const s = spin.current;
    if (!g || !s) return;
    const dt = Math.min(delta, 0.1);

    if (!s.dragging && !reducedMotion) {
      // Inertia after release, then a slow idle turn.
      s.yaw += (s.vYaw + 0.22) * dt;
      s.pitch += s.vPitch * dt;
      s.vYaw = THREE.MathUtils.damp(s.vYaw, 0, 2, dt);
      s.vPitch = THREE.MathUtils.damp(s.vPitch, 0, 2, dt);
      s.pitch = THREE.MathUtils.damp(s.pitch, 0.12, 1, dt);
    }
    s.pitch = THREE.MathUtils.clamp(s.pitch, -0.7, 0.7);
    g.rotation.set(s.pitch, s.yaw, 0);

    // Candle: the pointer is the light.
    if (light.current) {
      light.current.position.x = THREE.MathUtils.damp(light.current.position.x, state.pointer.x * 3.2, 4, dt);
      light.current.position.y = THREE.MathUtils.damp(light.current.position.y, state.pointer.y * 2.4 + 0.4, 4, dt);
    }

    // Pin each hotspot to its point on the surface; hide it when it turns away.
    g.updateMatrixWorld();
    HOTSPOTS.forEach((spot, i) => {
      const el = dots.current?.[i];
      if (!el) return;
      p.set(...spot.at).applyMatrix4(g.matrixWorld);
      n.set(...spot.normal).transformDirection(g.matrixWorld);
      const facing = n.dot(camera.position.clone().sub(p).normalize());
      p.project(camera);
      el.style.transform = `translate3d(${((p.x + 1) / 2) * size.width}px, ${((1 - p.y) / 2) * size.height}px, 0)`;
      el.style.opacity = String(THREE.MathUtils.smoothstep(facing, -0.05, 0.35));
      el.style.pointerEvents = facing > 0.15 ? "auto" : "none";
    });
  });

  return (
    <>
      <ambientLight intensity={0.25} />
      <directionalLight position={[-3, 4, 2]} intensity={1.1} color="#cfd8ff" />
      <directionalLight position={[4, -1, -3]} intensity={0.7} />
      <pointLight ref={light} position={[2, 1, 3.2]} intensity={34} distance={12} color="#ffdcae" />
      <group ref={group}>
        <mesh geometry={geometry}>
          <meshPhysicalMaterial
            color="#0b0b0c"
            roughness={0.22}
            metalness={0.55}
            clearcoat={1}
            clearcoatRoughness={0.12}
            side={THREE.DoubleSide}
          />
        </mesh>
      </group>
    </>
  );
}

export default function ProductScene({
  spin,
  dots,
  lite,
  reducedMotion,
}: {
  spin: RefObject<Spin>;
  dots: RefObject<(HTMLButtonElement | null)[]>;
  lite: boolean;
  reducedMotion: boolean;
}) {
  return (
    <Canvas
      dpr={lite ? [1, 1.5] : [1, 2]}
      frameloop={reducedMotion ? "demand" : "always"}
      gl={{ antialias: true, alpha: true, powerPreference: "high-performance" }}
      camera={{ fov: 30, position: [0, 0.1, 7.2] }}
    >
      <Vessel spin={spin} dots={dots} reducedMotion={reducedMotion} />
    </Canvas>
  );
}
