"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { usePathname } from "next/navigation";
import { useFrame, useThree } from "@react-three/fiber";
import * as THREE from "three";
import { useStore } from "@/lib/store";
import { buildLoopPath, loadIntroPath, type SerpentPath } from "@/serpent/path";
import { createSerpentGeometry } from "@/serpent/geometry";
import { createSerpentMaterial } from "@/serpent/material";
import {
  CAMERA_FOV,
  SYMBOL,
  heroUnit,
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

/**
 * One mesh, two lives.
 *
 *   intro  it slithers in along the intro path and folds into the logo.
 *   hero   the logo has flown to the nav, so the serpent does not repeat it:
 *          it uncoils and roams a slow loop through the hero, lit by the
 *          candle, dropping away behind the headline and coming back.
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
  const pathname = usePathname();
  const reducedMotion = useStore((s) => s.reducedMotion);
  const setSceneReady = useStore((s) => s.setSceneReady);
  const gl = useThree((s) => s.gl);
  const scene = useThree((s) => s.scene);
  const invalidate = useThree((s) => s.invalidate);
  const { camera, size } = useStage();

  const [intro, setIntro] = useState<SerpentPath | null>(null);
  const mesh = useRef<THREE.Mesh>(null);
  const travel = useRef(0);
  const home = pathname === "/";

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

  // The hero loop is laid out for the viewport, so it is rebuilt on resize.
  const unit = heroUnit(size.width, size.height);
  const loop = useMemo(
    () => (intro ? buildLoopPath(size.width, size.height, unit, intro.body) : null),
    [intro, size.width, size.height, unit],
  );

  useEffect(() => () => geometry.dispose(), [geometry]);
  useEffect(() => () => material?.dispose(), [material]);
  useEffect(() => () => intro?.texture.dispose(), [intro]);
  useEffect(() => () => loop?.texture.dispose(), [loop]);

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
    if (!m || !material || !intro || !loop) return;
    const dt = Math.min(delta, 0.1);
    const u = material.uniforms;
    const { width: w, height: h } = size;
    const hero = serpent.mode === "hero";

    if (hero) {
      const scroll = window.scrollY;
      const visible = home ? 1 - THREE.MathUtils.smoothstep(scroll, h * 0.35, h * 1.05) : 0;
      const restX = w * 0.26;
      const restY = h * 0.08;

      if (reducedMotion) {
        serpent.fade = visible;
        serpent.rotX = 0;
        serpent.rotY = 0;
        serpent.wiggle = 0;
        serpent.lightX = restX;
        serpent.lightY = restY + h * 0.2;
        travel.current = loop.total * 0.19;
      } else {
        serpent.time += dt;
        serpent.fade = damp(serpent.fade, visible, visible > serpent.fade ? 0.9 : 5, dt);
        serpent.wiggle = damp(serpent.wiggle, 0.42, 1, dt);
        // Slow and heavy: one lap takes the better part of a minute.
        travel.current = (travel.current + dt * 46) % loop.total;

        // Drag to orbit: inertia after release, then a slow ease back.
        if (!orbit.dragging) {
          orbit.yaw += orbit.vYaw * dt;
          orbit.pitch += orbit.vPitch * dt;
          orbit.vYaw = damp(orbit.vYaw, 0, 2.2, dt);
          orbit.vPitch = damp(orbit.vPitch, 0, 2.2, dt);
          orbit.yaw = damp(orbit.yaw, 0, 0.9, dt);
          orbit.pitch = damp(orbit.pitch, 0, 0.9, dt);
        }
        orbit.yaw = THREE.MathUtils.clamp(orbit.yaw, -1.1, 1.1);
        orbit.pitch = THREE.MathUtils.clamp(orbit.pitch, -0.6, 0.6);

        // Candle: the cursor, or a slow drift where there is no cursor.
        const t = serpent.time;
        const lx = pointer.active ? pointer.x : restX + Math.sin(t * 0.37) * w * 0.24;
        const ly = pointer.active ? pointer.y : restY + Math.cos(t * 0.29) * h * 0.22;
        serpent.lightX = damp(serpent.lightX, lx, 5, dt);
        serpent.lightY = damp(serpent.lightY, ly, 5, dt);

        // The whole coil leans toward the light, with weight.
        serpent.rotY = damp(serpent.rotY, (serpent.lightX / w) * 0.34, 1.6, dt);
        serpent.rotX = damp(serpent.rotX, (-serpent.lightY / h) * 0.22, 1.6, dt);
      }

      serpent.x = 0;
      serpent.y = scroll * 0.88;
      serpent.height = unit * SYMBOL.height;
      serpent.zoom = 1;
      serpent.flat = 0;
      serpent.white = 0;
      serpent.core = damp(serpent.core, pointer.fine ? 0.2 : 0.5, 2, dt);
      serpent.light = damp(serpent.light, 1.7, 2, dt);
      serpent.fog = damp(serpent.fog, 1, 1.2, dt);
    }

    const scale = (serpent.height / SYMBOL.height) * serpent.zoom;
    m.visible = serpent.fade > 0.003 && scale > 0;
    if (!m.visible) return;

    m.position.set(serpent.x, serpent.y, 0);
    m.scale.setScalar(scale);
    m.rotation.set(
      serpent.rotX + (hero ? orbit.pitch : 0),
      serpent.rotY + (hero ? orbit.yaw : 0),
      0,
    );

    const path = hero ? loop : intro;
    u.uPath.value = path.texture;
    u.uTotal.value = path.total;
    u.uLoop.value = hero ? 1 : 0;
    u.uHead.value = hero ? travel.current / loop.total : serpent.head;
    u.uFar.value = hero ? 520 : 1300;
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
