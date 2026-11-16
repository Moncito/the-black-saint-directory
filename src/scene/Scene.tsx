"use client";

import { useEffect } from "react";
import { usePathname } from "next/navigation";
import { Canvas, advance, useThree } from "@react-three/fiber";
import { PerformanceMonitor } from "@react-three/drei";
import { useStore } from "@/lib/store";
import { tierSettings } from "@/lib/tier";
import { CAMERA_FOV, isCapture } from "@/serpent/state";
import { Fog } from "./Fog";
import { Serpent } from "./Serpent";

/** With reduced motion the scene renders single still frames on demand. */
function Still({ deps }: { deps: unknown }) {
  const invalidate = useThree((s) => s.invalidate);
  useEffect(() => {
    invalidate();
    const onScroll = () => invalidate();
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("bsd:invalidate", onScroll);
    return () => {
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("bsd:invalidate", onScroll);
    };
  }, [deps, invalidate]);
  return null;
}

/** Capture mode: frames are stepped by scripts/capture-intro.mjs, not the clock. */
function CaptureBridge() {
  useEffect(() => {
    (window as unknown as { __bsdRender?: (ms: number) => void }).__bsdRender = (ms) =>
      advance(ms, true);
  }, []);
  return null;
}

/**
 * The one WebGL canvas. It mounts once in the root layout and survives every
 * route change, so the serpent travels between pages without re-initialising.
 * Routes only change what the scene is asked to show.
 */
export default function Scene({ tier }: { tier: "full" | "lite" }) {
  const pathname = usePathname();
  const reducedMotion = useStore((s) => s.reducedMotion);
  const introDone = useStore((s) => s.introDone);
  const downgrade = useStore((s) => s.downgrade);
  const settings = tierSettings[tier];
  const intensity = pathname === "/" ? 1 : 0.55;
  const capture = isCapture();

  return (
    <Canvas
      className="!absolute inset-0"
      dpr={capture ? 1 : settings.dpr}
      frameloop={capture ? "never" : reducedMotion ? "demand" : "always"}
      gl={{
        antialias: settings.antialias,
        alpha: true,
        powerPreference: "high-performance",
        stencil: false,
      }}
      camera={{ fov: CAMERA_FOV, position: [0, 0, 1000], near: 50, far: 6000 }}
      eventSource={typeof document !== "undefined" ? document.body : undefined}
      eventPrefix="client"
    >
      {/* Sustained low frame rate steps the device down a tier — never mid-intro. */}
      {!reducedMotion && !capture && introDone && (
        <PerformanceMonitor bounds={() => [40, 120]} flipflops={2} onDecline={downgrade} />
      )}
      {reducedMotion && <Still deps={pathname} />}
      {capture && <CaptureBridge />}
      <Fog octaves={settings.fogOctaves} intensity={intensity} />
      <Serpent
        segments={settings.serpentSegments}
        radial={settings.serpentRadial}
        scales={settings.scales}
      />
    </Canvas>
  );
}
