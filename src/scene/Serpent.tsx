"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { usePathname } from "next/navigation";
import { useFrame, useThree } from "@react-three/fiber";
import * as THREE from "three";
import { useStore } from "@/lib/store";
import { loadSerpentPath, type SerpentPath } from "@/serpent/path";
import { createSerpentGeometry } from "@/serpent/geometry";
import { createSerpentMaterial } from "@/serpent/material";
import {
  CAMERA_FOV,
  SYMBOL,
  heroLayout,
  listenPointer,
  orbit,
  pointer,
  serpent,
} from "@/serpent/state";

const damp = THREE.MathUtils.damp;
const ortho = new THREE.Matrix4();

/**
 * World units are CSS pixels on the z = 0 plane, origin at the viewport
 * centre. That makes the 3D serpent land on the DOM logo to the pixel, and
 * lets perspective blend into orthographic without anything shifting.
 */
function useStage() {
  const camera = useThree((s) => s.camera) as THREE.PerspectiveCamera;
  const size = useThree((s) => s.size);

  useFrame(() => {
    const dist = size.height / 2 / Math.tan(THREE.MathUtils.degToRad(CAMERA_FOV / 2));
    if (camera.position.z !== dist || camera.far !== dist * 6) {
      camera.fov = CAMERA_FOV;
      camera.position.set(0, 0, dist);
      camera.near = dist * 0.05;
      camera.far = dist * 6;
    }
    camera.updateProjectionMatrix();

    if (serpent.flat > 0) {
      // Blend perspective → orthographic. Both agree on the z = 0 plane.
      ortho.makeOrthographic(
        -size.width / 2,
        size.width / 2,
        size.height / 2,
        -size.height / 2,
        camera.near,
        camera.far,
      );
      const p = camera.projectionMatrix.elements;
      const o = ortho.elements;
      const f = serpent.flat;
      for (let i = 0; i < 16; i++) p[i] += (o[i] - p[i]) * f;
      camera.projectionMatrixInverse.copy(camera.projectionMatrix).invert();
    }
  }, -1);

  return { camera, size };
}

export function Serpent({ segments, radial, scales }: { segments: number; radial: number; scales: boolean }) {
  const pathname = usePathname();
  const reducedMotion = useStore((s) => s.reducedMotion);
  const setSceneReady = useStore((s) => s.setSceneReady);
  const gl = useThree((s) => s.gl);
  const scene = useThree((s) => s.scene);
  const invalidate = useThree((s) => s.invalidate);
  const { camera, size } = useStage();

  const [path, setPath] = useState<SerpentPath | null>(null);
  const mesh = useRef<THREE.Mesh>(null);
  const home = pathname === "/";

  useEffect(() => {
    listenPointer();
    let cancelled = false;
    loadSerpentPath().then((p) => {
      if (cancelled) return;
      serpent.approach = 1 - p.body / p.total;
      setPath(p);
    });
    return () => {
      cancelled = true;
    };
  }, []);

  const geometry = useMemo(() => createSerpentGeometry(segments, radial), [segments, radial]);
  const material = useMemo(
    () => (path ? createSerpentMaterial(path, scales) : null),
    [path, scales],
  );

  useEffect(() => () => geometry.dispose(), [geometry]);
  useEffect(() => () => material?.dispose(), [material]);

  // Compile before the intro asks for the first frame, then report ready.
  useEffect(() => {
    if (!material || !mesh.current) return;
    mesh.current.visible = true;
    // Off the main thread where the browser supports parallel shader compilation.
    let cancelled = false;
    gl.compileAsync(scene, camera).then(() => {
      if (cancelled) return;
      setSceneReady(true);
      invalidate();
    });
    return () => {
      cancelled = true;
    };
  }, [material, gl, scene, camera, setSceneReady, invalidate]);

  useFrame((state, delta) => {
    const m = mesh.current;
    if (!m || !material) return;
    const dt = Math.min(delta, 0.1);
    const u = material.uniforms;
    const { width: w, height: h } = size;

    if (serpent.mode === "hero") {
      const rest = heroLayout(w, h);
      const scroll = window.scrollY;
      const visible = home ? 1 - THREE.MathUtils.smoothstep(scroll, h * 0.35, h * 1.05) : 0;

      if (reducedMotion) {
        serpent.fade = visible;
        serpent.rotY = -0.5;
        serpent.rotX = 0.08;
        serpent.lightX = rest.x - rest.height * 0.5;
        serpent.lightY = rest.y + rest.height * 0.35;
      } else {
        serpent.time += dt;
        serpent.fade = damp(serpent.fade, visible, visible > serpent.fade ? 1.4 : 5, dt);

        // Drag to orbit: inertia after release, then a slow ease back.
        if (!orbit.dragging) {
          orbit.yaw += orbit.vYaw * dt;
          orbit.pitch += orbit.vPitch * dt;
          orbit.vYaw = damp(orbit.vYaw, 0, 2.2, dt);
          orbit.vPitch = damp(orbit.vPitch, 0, 2.2, dt);
          orbit.yaw = damp(orbit.yaw, 0, 0.9, dt);
          orbit.pitch = damp(orbit.pitch, 0, 0.9, dt);
        }
        orbit.pitch = THREE.MathUtils.clamp(orbit.pitch, -0.9, 0.9);

        // Candle: the cursor, or a slow drift where there is no cursor.
        const t = serpent.time;
        const lx = pointer.active ? pointer.x : rest.x + Math.sin(t * 0.37) * w * 0.3;
        const ly = pointer.active ? pointer.y : rest.y + Math.cos(t * 0.29) * h * 0.24;
        serpent.lightX = damp(serpent.lightX, lx, 5, dt);
        serpent.lightY = damp(serpent.lightY, ly, 5, dt);

        // Slowly turning, leaning toward the light with weight.
        const tiltY = ((serpent.lightX - rest.x) / w) * 0.7;
        const tiltX = (-(serpent.lightY - rest.y) / h) * 0.45;
        serpent.rotY = damp(serpent.rotY, Math.sin(t * 0.21) * 0.55 + tiltY, 2, dt);
        serpent.rotX = damp(serpent.rotX, tiltX, 2, dt);
      }

      serpent.x = rest.x;
      serpent.y = rest.y + scroll * 0.88;
      serpent.height = rest.height;
      serpent.zoom = 1;
      serpent.head = 1;
      serpent.wiggle = 0;
      serpent.flat = 0;
      serpent.white = 0;
      serpent.core = damp(serpent.core, pointer.fine ? 0.22 : 0.5, 2, dt);
      serpent.light = damp(serpent.light, 1.9, 2, dt);
      serpent.fog = damp(serpent.fog, 1, 1.2, dt);
    }

    const unit = (serpent.height / SYMBOL.height) * serpent.zoom;
    m.visible = serpent.fade > 0.003 && unit > 0;
    if (!m.visible) return;

    m.position.set(serpent.x, serpent.y, 0);
    m.scale.setScalar(unit);
    m.rotation.set(
      serpent.rotX + (serpent.mode === "hero" ? orbit.pitch : 0),
      serpent.rotY + (serpent.mode === "hero" ? orbit.yaw : 0),
      0,
    );

    u.uHead.value = serpent.head;
    u.uWiggle.value = serpent.wiggle;
    u.uTime.value = serpent.time;
    u.uFlat.value = serpent.flat;
    u.uWhite.value = serpent.white;
    u.uFade.value = serpent.fade;
    u.uLight.value = serpent.light;
    u.uUnit.value = unit;
    u.uCamDist.value = camera.position.z;
    (u.uLightPos.value as THREE.Vector3).set(serpent.lightX, serpent.lightY, unit * 95);
  });

  if (!material) return null;
  return <mesh ref={mesh} geometry={geometry} material={material} frustumCulled={false} />;
}
