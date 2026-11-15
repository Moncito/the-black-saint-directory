"use client";

import { useEffect, useRef, useState } from "react";
import { gsap } from "@/lib/gsap";
import { useStore } from "@/lib/store";

/**
 * Custom cursor ring. Reads `data-cursor="View|Drag|Open"` from whatever is
 * under the pointer; grows quietly over plain links. Fine pointers only.
 */
export function Cursor() {
  const ring = useRef<HTMLDivElement>(null);
  const dot = useRef<HTMLDivElement>(null);
  const [label, setLabel] = useState("");
  const [enabled, setEnabled] = useState(false);
  const reducedMotion = useStore((s) => s.reducedMotion);

  useEffect(() => {
    const fine = matchMedia("(hover: hover) and (pointer: fine)");
    const update = () => setEnabled(fine.matches);
    update();
    fine.addEventListener("change", update);
    return () => fine.removeEventListener("change", update);
  }, []);

  useEffect(() => {
    if (!enabled || !ring.current || !dot.current) return;
    const root = document.documentElement;
    root.classList.add("has-cursor");

    const lag = reducedMotion ? 0 : 0.5;
    const ringX = gsap.quickTo(ring.current, "x", { duration: lag, ease: "power4.out" });
    const ringY = gsap.quickTo(ring.current, "y", { duration: lag, ease: "power4.out" });
    const dotX = gsap.quickSetter(dot.current, "x", "px");
    const dotY = gsap.quickSetter(dot.current, "y", "px");

    let shown = false;
    let state = "";

    const setState = (next: string, text: string) => {
      if (next === state) return;
      state = next;
      setLabel(text);
      ring.current!.dataset.state = next;
    };

    const move = (e: PointerEvent) => {
      if (e.pointerType !== "mouse" && e.pointerType !== "pen") return;
      if (!shown) {
        shown = true;
        gsap.set([ring.current, dot.current], { x: e.clientX, y: e.clientY });
        gsap.to([ring.current, dot.current], { autoAlpha: 1, duration: 0.4 });
      }
      ringX(e.clientX);
      ringY(e.clientY);
      dotX(e.clientX);
      dotY(e.clientY);

      const target = e.target as Element | null;
      const labelled = target?.closest<HTMLElement>("[data-cursor]");
      if (labelled) return setState("label", labelled.dataset.cursor ?? "");
      if (target?.closest("a, button, [role='button'], input, textarea, select, label"))
        return setState("link", "");
      setState("", "");
    };

    const leave = () => {
      shown = false;
      gsap.to([ring.current, dot.current], { autoAlpha: 0, duration: 0.3 });
    };
    const down = () => ring.current?.classList.add("is-down");
    const up = () => ring.current?.classList.remove("is-down");

    window.addEventListener("pointermove", move, { passive: true });
    window.addEventListener("pointerdown", down, { passive: true });
    window.addEventListener("pointerup", up, { passive: true });
    document.documentElement.addEventListener("pointerleave", leave);

    return () => {
      root.classList.remove("has-cursor");
      window.removeEventListener("pointermove", move);
      window.removeEventListener("pointerdown", down);
      window.removeEventListener("pointerup", up);
      document.documentElement.removeEventListener("pointerleave", leave);
    };
  }, [enabled, reducedMotion]);

  if (!enabled) return null;

  return (
    <div aria-hidden="true" className="pointer-events-none fixed inset-0 z-[90] mix-blend-difference">
      <div ref={ring} className="cursor-ring invisible absolute left-0 top-0 opacity-0">
        <div className="cursor-ring__circle">
          <span className="t-label cursor-ring__label">{label}</span>
        </div>
      </div>
      <div ref={dot} className="invisible absolute left-0 top-0 opacity-0">
        <div className="cursor-dot" />
      </div>
    </div>
  );
}
