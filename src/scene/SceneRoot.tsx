"use client";

import { useEffect, useState } from "react";
import dynamic from "next/dynamic";
import { useStore } from "@/lib/store";
import { detectTier } from "@/lib/tier";

// Three.js stays out of the initial bundle; it loads after first paint.
const Scene = dynamic(() => import("./Scene"), { ssr: false });

export function SceneRoot() {
  const tier = useStore((s) => s.tier);
  const setTier = useStore((s) => s.setTier);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    let cancelled = false;
    const start = () => {
      if (cancelled) return;
      setTier(detectTier());
      setReady(true);
    };
    // Wait for the page to finish loading, then for an idle moment.
    let id = 0;
    const hasIdle = typeof window.requestIdleCallback === "function";
    const schedule = () => {
      id = hasIdle
        ? window.requestIdleCallback(start, { timeout: 2000 })
        : window.setTimeout(start, 400);
    };
    if (document.readyState === "complete") schedule();
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

  return (
    <div aria-hidden="true" className="pointer-events-none fixed inset-0 z-0">
      {/* Static tier and pre-load: a still, CSS-only atmosphere. */}
      <div className="scene-fallback absolute inset-0" />
      {ready && tier && tier !== "static" && (
        <div className="scene-live absolute inset-0">
          <Scene tier={tier} />
        </div>
      )}
    </div>
  );
}
