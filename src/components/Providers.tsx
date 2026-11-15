"use client";

import { useEffect, type ReactNode } from "react";
import { useStore } from "@/lib/store";
import { tick } from "@/lib/sound";
import { SmoothScroll } from "./SmoothScroll";
import { TransitionProvider } from "./Transition";
import { Motion } from "./Motion";
import { Cursor } from "./Cursor";

export function Providers({ children }: { children: ReactNode }) {
  const setReducedMotion = useStore((s) => s.setReducedMotion);

  useEffect(() => {
    const query = matchMedia("(prefers-reduced-motion: reduce)");
    const update = () => setReducedMotion(query.matches);
    update();
    query.addEventListener("change", update);
    return () => query.removeEventListener("change", update);
  }, [setReducedMotion]);

  // Quiet UI tick on every button press once sound is on.
  useEffect(() => {
    const onClick = (e: MouseEvent) => {
      if ((e.target as Element | null)?.closest("button, a")) tick("click");
    };
    window.addEventListener("click", onClick, { passive: true });
    return () => window.removeEventListener("click", onClick);
  }, []);

  return (
    <SmoothScroll>
      <TransitionProvider>
        {children}
        <Motion />
        <Cursor />
      </TransitionProvider>
    </SmoothScroll>
  );
}
