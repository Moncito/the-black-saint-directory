"use client";

import { useEffect, useState } from "react";
import dynamic from "next/dynamic";
import { useStore } from "@/lib/store";
import { detectTier } from "@/lib/tier";
import { FogCanvas } from "./FogCanvas";

// three.js is loaded only for the intro's serpent, and only when it plays.
const Scene = dynamic(() => import("./Scene"), { ssr: false });

/**
 * The persistent background. The fog canvas lives across every route; the 3D
 * serpent scene exists only while the intro needs it, then unmounts and hands
 * its GPU memory back.
 */
export function SceneRoot() {
  const tier = useStore((s) => s.tier);
  const setTier = useStore((s) => s.setTier);
  const introDone = useStore((s) => s.introDone);
  const reducedMotion = useStore((s) => s.reducedMotion);
  const [ready, setReady] = useState(false);
  const [introPlays, setIntroPlays] = useState(false);

  useEffect(() => {
    let cancelled = false;
    const start = () => {
      if (cancelled) return;
      setTier(detectTier());
      setReady(true);
    };
    let id = 0;
    const hasIdle = typeof window.requestIdleCallback === "function";
    const schedule = () => {
      id = hasIdle
        ? window.requestIdleCallback(start, { timeout: 2000 })
        : window.setTimeout(start, 400);
    };
    // The intro needs the scene now; otherwise the atmosphere waits for an idle moment.
    if (document.documentElement.classList.contains("intro-pending")) {
      setIntroPlays(true);
      start();
    } else if (document.readyState === "complete") schedule();
    else window.addEventListener("load", schedule, { once: true });
    return () => {
      cancelled = true;
      window.removeEventListener("load", schedule);
      if (hasIdle) window.cancelIdleCallback(id);
      else window.clearTimeout(id);
    };
  }, [setTier]);

  useEffect(() => {
    if (tier) document.documentElement.dataset.tier = tier;
  }, [tier]);

  const live = ready && tier && tier !== "static";
  // Reduced motion gets a logo fade instead of the serpent: no 3D at all.
  const serpent = live && introPlays && !introDone && !reducedMotion;

  return (
    <div aria-hidden="true" className="pointer-events-none fixed inset-0 z-0">
      {/* Static tier and pre-load: a still, CSS-only atmosphere. */}
      <div className="scene-fallback absolute inset-0" />
      {live && (
        <div className="scene-live absolute inset-0">
          <FogCanvas key={tier} tier={tier} />
          {serpent && <Scene tier={tier} />}
        </div>
      )}
    </div>
  );
}
