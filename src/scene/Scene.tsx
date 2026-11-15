"use client";

import { useEffect } from "react";
import { usePathname } from "next/navigation";
import { Canvas, useThree } from "@react-three/fiber";
import { PerformanceMonitor } from "@react-three/drei";
import { useStore } from "@/lib/store";
import { tierSettings } from "@/lib/tier";
import { Fog } from "./Fog";

/** With reduced motion the scene renders one still frame per change. */
function Still({ deps }: { deps: unknown }) {
  const invalidate = useThree((s) => s.invalidate);
  useEffect(() => {
    invalidate();
  }, [deps, invalidate]);
  return null;
}

/**
 * The one WebGL canvas. It mounts once in the root layout and survives every
 * route change, so Phase 2's serpent can travel between pages without
 * re-initialising. Routes only change what the scene is asked to show.
 */
export default function Scene({ tier }: { tier: "full" | "lite" }) {
  const pathname = usePathname();
  const reducedMotion = useStore((s) => s.reducedMotion);
  const downgrade = useStore((s) => s.downgrade);
  const settings = tierSettings[tier];
  const intensity = pathname === "/" ? 1 : 0.55;

  return (
    <Canvas
      className="!absolute inset-0"
      dpr={settings.dpr}
      frameloop={reducedMotion ? "demand" : "always"}
      gl={{
        antialias: settings.antialias,
        alpha: true,
        powerPreference: "high-performance",
        stencil: false,
      }}
      camera={{ fov: 35, position: [0, 0, 6], near: 0.1, far: 50 }}
      eventSource={typeof document !== "undefined" ? document.body : undefined}
      eventPrefix="client"
    >
      {/* Sustained low frame rate steps the device down a tier. */}
      {!reducedMotion && (
        <PerformanceMonitor bounds={() => [40, 120]} flipflops={2} onDecline={downgrade} />
      )}
      {reducedMotion && <Still deps={pathname} />}
      <Fog octaves={settings.fogOctaves} intensity={intensity} />
    </Canvas>
  );
}
