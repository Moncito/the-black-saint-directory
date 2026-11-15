"use client";

import { useEffect, useRef, type ReactNode } from "react";
import { gsap } from "@/lib/gsap";
import { useStore } from "@/lib/store";

/** Pulls its child toward the cursor, then lets it settle back — heavy, no bounce. */
export function Magnetic({
  children,
  strength = 0.3,
  className,
}: {
  children: ReactNode;
  strength?: number;
  className?: string;
}) {
  const el = useRef<HTMLSpanElement>(null);
  const reducedMotion = useStore((s) => s.reducedMotion);

  useEffect(() => {
    const node = el.current;
    if (!node || reducedMotion || !matchMedia("(hover: hover) and (pointer: fine)").matches) return;

    const x = gsap.quickTo(node, "x", { duration: 0.9, ease: "power4.out" });
    const y = gsap.quickTo(node, "y", { duration: 0.9, ease: "power4.out" });

    const move = (e: PointerEvent) => {
      const r = node.getBoundingClientRect();
      x((e.clientX - (r.left + r.width / 2)) * strength);
      y((e.clientY - (r.top + r.height / 2)) * strength);
    };
    const leave = () => {
      x(0);
      y(0);
    };
    node.addEventListener("pointermove", move);
    node.addEventListener("pointerleave", leave);
    return () => {
      node.removeEventListener("pointermove", move);
      node.removeEventListener("pointerleave", leave);
      gsap.set(node, { x: 0, y: 0 });
    };
  }, [reducedMotion, strength]);

  return (
    <span ref={el} className={className ?? "inline-block"}>
      {children}
    </span>
  );
}
