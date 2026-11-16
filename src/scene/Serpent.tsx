"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useFrame, useThree } from "@react-three/fiber";
import * as THREE from "three";
import { useStore } from "@/lib/store";
import { loadIntroPath, type SerpentPath } from "@/serpent/path";
import { createSerpentGeometry } from "@/serpent/geometry";
import { createSerpentMaterial } from "@/serpent/material";
import {
  CAMERA_FOV,
  SYMBOL,
  listenPointer,
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

/**
 * The serpent exists for the intro: it slithers in and folds into the logo,
 * which then flies to the nav. After that the mesh rests and only its candle
 * stays — the cursor light that rakes across the fog on every page.
 */
export function Serpent({
  segments,
  radial,
  scales,
}: {
  segments: number;
  radial: number;
  scales: boolean;
}) {
  const reducedMotion = useStore((s) => s.reducedMotion);
  const setSceneReady = useStore((s) => s.setSceneReady);
  const gl = useThree((s) => s.gl);
  const scene = useThree((s) => s.scene);
  const invalidate = useThree((s) => s.invalidate);
  const { camera, size } = useStage();

  const [intro, setIntro] = useState<SerpentPath | null>(null);
  const mesh = useRef<THREE.Mesh>(null);

  useEffect(() => {
    listenPointer();
    let cancelled = false;
    loadIntroPath().then((p) => {
      if (cancelled) return;
      serpent.approach = 1 - p.body / p.total;
      setIntro(p);
    });
    return () => {
      cancelled = true;
    };
  }, []);

  const geometry = useMemo(() => createSerpentGeometry(segments, radial), [segments, radial]);
  const material = useMemo(
    () => (intro ? createSerpentMaterial(intro, scales) : null),
    [intro, scales],
  );

  useEffect(() => () => geometry.dispose(), [geometry]);
  useEffect(() => () => material?.dispose(), [material]);
  useEffect(() => () => intro?.texture.dispose(), [intro]);

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
      // Candle: the cursor, or a slow drift where there is no cursor.
      serpent.fade = 0;
      if (reducedMotion) {
        serpent.lightX = w * 0.24;
        serpent.lightY = h * 0.18;
      } else {
        serpent.time += dt;
        const t = serpent.time;
        const lx = pointer.active ? pointer.x : w * 0.2 + Math.sin(t * 0.37) * w * 0.22;
        const ly = pointer.active ? pointer.y : h * 0.1 + Math.cos(t * 0.29) * h * 0.2;
        serpent.lightX = damp(serpent.lightX, lx, 5, dt);
        serpent.lightY = damp(serpent.lightY, ly, 5, dt);
      }
      serpent.core = damp(serpent.core, pointer.fine ? 0.2 : 0.5, 2, dt);
      serpent.light = damp(serpent.light, 1.7, 2, dt);
      serpent.fog = damp(serpent.fog, 1, 1.2, dt);
    }

    const scale = (serpent.height / SYMBOL.height) * serpent.zoom;
    m.visible = serpent.fade > 0.003 && scale > 0;
    if (!m.visible) return;

    m.position.set(serpent.x, serpent.y, 0);
    m.scale.setScalar(scale);
    m.rotation.set(serpent.rotX, serpent.rotY, 0);

    u.uHead.value = serpent.head;
    u.uWiggle.value = serpent.wiggle;
    u.uTime.value = serpent.time;
    u.uFlat.value = serpent.flat;
    u.uWhite.value = serpent.white;
    u.uFade.value = serpent.fade;
    u.uLight.value = serpent.light;
    u.uUnit.value = scale;
    u.uCamDist.value = camera.position.z;
    (u.uLightPos.value as THREE.Vector3).set(serpent.lightX, serpent.lightY, scale * 95);
  });

  if (!material) return null;
  return <mesh ref={mesh} geometry={geometry} material={material} frustumCulled={false} />;
}
