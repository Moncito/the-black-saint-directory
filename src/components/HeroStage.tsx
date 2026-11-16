"use client";

import { useEffect, useRef } from "react";
import { useStore } from "@/lib/store";
import { orbit } from "@/serpent/state";

/**
 * The hero's hit area for the roaming serpent: drag to orbit its coil, with
 * inertia on release. The serpent itself lives in the shared canvas behind
 * the page.
 */
export function HeroStage() {
  const tier = useStore((s) => s.tier);
  const reducedMotion = useStore((s) => s.reducedMotion);
  const el = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const node = el.current;
    if (!node || tier === "static" || tier === null || reducedMotion) return;

    let id = -1;
    let lastX = 0;
    let lastY = 0;
    let lastT = 0;

    const down = (e: PointerEvent) => {
      if (e.pointerType === "mouse" && e.button !== 0) return;
      id = e.pointerId;
      lastX = e.clientX;
      lastY = e.clientY;
      lastT = performance.now();
      orbit.dragging = true;
      orbit.vYaw = 0;
      orbit.vPitch = 0;
      node.setPointerCapture(id);
    };
    const move = (e: PointerEvent) => {
      if (e.pointerId !== id) return;
      const now = performance.now();
      const dt = Math.max((now - lastT) / 1000, 1 / 240);
      const dYaw = ((e.clientX - lastX) / window.innerWidth) * 4.2;
      const dPitch = ((e.clientY - lastY) / window.innerHeight) * 2.4;
      orbit.yaw += dYaw;
      orbit.pitch += dPitch;
      // Smoothed release velocity, capped so a flick never spins wildly.
      orbit.vYaw = Math.max(-7, Math.min(7, orbit.vYaw * 0.6 + (dYaw / dt) * 0.4));
      orbit.vPitch = Math.max(-4, Math.min(4, orbit.vPitch * 0.6 + (dPitch / dt) * 0.4));
      lastX = e.clientX;
      lastY = e.clientY;
      lastT = now;
    };
    const up = (e: PointerEvent) => {
      if (e.pointerId !== id) return;
      id = -1;
      orbit.dragging = false;
      if (performance.now() - lastT > 120) {
        orbit.vYaw = 0;
        orbit.vPitch = 0;
      }
    };

    node.addEventListener("pointerdown", down);
    node.addEventListener("pointermove", move);
    node.addEventListener("pointerup", up);
    node.addEventListener("pointercancel", up);
    return () => {
      orbit.dragging = false;
      node.removeEventListener("pointerdown", down);
      node.removeEventListener("pointermove", move);
      node.removeEventListener("pointerup", up);
      node.removeEventListener("pointercancel", up);
    };
  }, [tier, reducedMotion]);

  // No canvas on the Static tier: the hero is type and atmosphere only.
  if (tier === "static") return null;

  return (
    <div
      ref={el}
      aria-hidden="true"
      data-cursor={reducedMotion ? undefined : "Drag"}
      className="hero-stage"
    />
  );
}
