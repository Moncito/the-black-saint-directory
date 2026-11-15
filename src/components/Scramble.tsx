"use client";

import { useCallback, useEffect, useRef } from "react";
import { useStore } from "@/lib/store";

const GLYPHS = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789/+—";

/** Mono label that scrambles into place: on hover, and optionally on mount. */
export function Scramble({
  text,
  onMount = false,
  className,
}: {
  text: string;
  onMount?: boolean;
  className?: string;
}) {
  const el = useRef<HTMLSpanElement>(null);
  const frame = useRef(0);
  const reducedMotion = useStore((s) => s.reducedMotion);

  const run = useCallback(() => {
    const node = el.current;
    if (!node || reducedMotion) return;
    cancelAnimationFrame(frame.current);
    const start = performance.now();
    const duration = 420 + text.length * 22;

    const step = (now: number) => {
      const progress = Math.min((now - start) / duration, 1);
      const settled = Math.floor(progress * text.length);
      let out = "";
      for (let i = 0; i < text.length; i++) {
        const ch = text[i];
        out +=
          i < settled || ch === " " ? ch : GLYPHS[Math.floor(Math.random() * GLYPHS.length)];
      }
      node.textContent = out;
      if (progress < 1) frame.current = requestAnimationFrame(step);
      else node.textContent = text;
    };
    frame.current = requestAnimationFrame(step);
  }, [reducedMotion, text]);

  useEffect(() => {
    const node = el.current;
    if (!node) return;
    const host = node.closest("a, button") ?? node;
    host.addEventListener("pointerenter", run);
    host.addEventListener("focus", run);
    if (onMount) run();
    return () => {
      host.removeEventListener("pointerenter", run);
      host.removeEventListener("focus", run);
      cancelAnimationFrame(frame.current);
    };
  }, [run, onMount]);

  // The accessible name stays stable while the glyphs churn.
  return (
    <span className={className}>
      <span className="sr-only">{text}</span>
      <span ref={el} aria-hidden="true">
        {text}
      </span>
    </span>
  );
}
