"use client";

import { useEffect, useRef, useState } from "react";
import dynamic from "next/dynamic";
import { useStore } from "@/lib/store";
// Kept out of ProductScene so three.js stays in its own lazy chunk.
import { HOTSPOTS, type Spin } from "./product";

const ProductScene = dynamic(() => import("./ProductScene"), { ssr: false });

const notes = [
  "Lit in real time. Move the cursor — it is the light.",
  "Procedural form. No model file to download.",
  "Drag to turn it. Let go and it settles.",
];

/**
 * Immersive 3D demo: a spinnable product with hotspots. The scene only mounts
 * when it scrolls into view, and never on the Static tier — where we say so.
 */
export function ProductViewer() {
  const tier = useStore((s) => s.tier);
  const reducedMotion = useStore((s) => s.reducedMotion);
  const root = useRef<HTMLDivElement>(null);
  const spin = useRef<Spin>({ yaw: 0.6, pitch: 0.12, vYaw: 0, vPitch: 0, dragging: false });
  const dots = useRef<(HTMLButtonElement | null)[]>([]);
  const [near, setNear] = useState(false);
  const [open, setOpen] = useState<number | null>(null);

  useEffect(() => {
    const el = root.current;
    if (!el) return;
    const io = new IntersectionObserver(([e]) => e.isIntersecting && setNear(true), {
      rootMargin: "300px",
    });
    io.observe(el);
    return () => io.disconnect();
  }, []);

  // Drag to orbit, with inertia on release.
  useEffect(() => {
    const el = root.current;
    if (!el) return;
    let id = -1;
    let x = 0;
    let y = 0;
    let t = 0;
    const s = spin.current;
    const down = (e: PointerEvent) => {
      if ((e.target as Element).closest("button")) return;
      id = e.pointerId;
      x = e.clientX;
      y = e.clientY;
      t = performance.now();
      s.dragging = true;
      s.vYaw = s.vPitch = 0;
      el.setPointerCapture(id);
    };
    const move = (e: PointerEvent) => {
      if (e.pointerId !== id) return;
      const now = performance.now();
      const dt = Math.max((now - t) / 1000, 1 / 240);
      const dYaw = ((e.clientX - x) / el.clientWidth) * 5;
      const dPitch = ((e.clientY - y) / el.clientHeight) * 2.4;
      s.yaw += dYaw;
      s.pitch += dPitch;
      s.vYaw = Math.max(-8, Math.min(8, s.vYaw * 0.6 + (dYaw / dt) * 0.4));
      s.vPitch = Math.max(-4, Math.min(4, s.vPitch * 0.6 + (dPitch / dt) * 0.4));
      x = e.clientX;
      y = e.clientY;
      t = now;
    };
    const up = (e: PointerEvent) => {
      if (e.pointerId !== id) return;
      id = -1;
      s.dragging = false;
      if (performance.now() - t > 120) s.vYaw = s.vPitch = 0;
    };
    el.addEventListener("pointerdown", down);
    el.addEventListener("pointermove", move);
    el.addEventListener("pointerup", up);
    el.addEventListener("pointercancel", up);
    return () => {
      el.removeEventListener("pointerdown", down);
      el.removeEventListener("pointermove", move);
      el.removeEventListener("pointerup", up);
      el.removeEventListener("pointercancel", up);
    };
  }, []);

  const off = tier === "static";

  return (
    <div className="demo demo--viewer">
      <div ref={root} className="demo-viewer__stage" data-cursor={off ? undefined : "Drag"}>
        {off ? (
          <p className="t-label text-fog">3D is switched off on this device to keep it fast.</p>
        ) : (
          near && tier && <ProductScene spin={spin} dots={dots} lite={tier === "lite"} reducedMotion={reducedMotion} />
        )}
        {!off &&
          HOTSPOTS.map((_, i) => (
            <button
              key={i}
              ref={(el) => {
                dots.current[i] = el;
              }}
              type="button"
              aria-expanded={open === i}
              aria-controls="viewer-note"
              onClick={() => setOpen(open === i ? null : i)}
              className="demo-hotspot t-label"
            >
              <span>{String(i + 1).padStart(2, "0")}</span>
            </button>
          ))}
      </div>
      <p id="viewer-note" aria-live="polite" className="demo-viewer__note t-body">
        {open === null ? (
          <span className="text-fog">Drag to turn. Tap a number.</span>
        ) : (
          <>
            <span className="t-label mr-4 text-fog">{String(open + 1).padStart(2, "0")}</span>
            {notes[open]}
          </>
        )}
      </p>
    </div>
  );
}
