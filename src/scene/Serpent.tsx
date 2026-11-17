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
  serpent,
} from "@/serpent/state";

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
 * which then flies to the nav. The scene unmounts after that.
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
    const u = material.uniforms;

    // Once the logo has flown to the nav the serpent rests; the fog canvas
    // keeps the candle.
    if (serpent.mode === "hero") serpent.fade = 0;

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
