"use client";

import { useEffect } from "react";
import { usePathname } from "next/navigation";
import { Canvas, advance, useThree } from "@react-three/fiber";
import { useStore } from "@/lib/store";
import { tierSettings } from "@/lib/tier";
import { CAMERA_FOV, isCapture } from "@/serpent/state";
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
    (window as unknown as { __bsdRender?: (ms: number) => void }).__bsdRender = (ms) => {
      advance(ms, true);
      // The fog lives on its own canvas; step it in the same frame.
      window.dispatchEvent(new CustomEvent("bsd:capture-frame", { detail: ms }));
    };
  }, []);
  return null;
}

/**
 * The intro's 3D scene: the serpent alone. It mounts only while the intro
 * plays (see SceneRoot); the fog and candle live on their own light canvas.
 */
export default function Scene({ tier }: { tier: "full" | "lite" }) {
  const pathname = usePathname();
  const reducedMotion = useStore((s) => s.reducedMotion);
  const settings = tierSettings[tier];
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
      {reducedMotion && <Still deps={pathname} />}
      {capture && <CaptureBridge />}
      <Serpent
        segments={settings.serpentSegments}
        radial={settings.serpentRadial}
        scales={settings.scales}
      />
    </Canvas>
  );
}
