"use client";

import { useRef, type ReactNode } from "react";
import { gsap } from "@/lib/gsap";
import { useScrollScene } from "@/lib/useScrollScene";

/**
 * The footer reveal: the page lifts away and the footer is uncovered beneath
 * it, rather than scrolling up like one more section.
 */
export function FooterLift({ children }: { children: ReactNode }) {
  const root = useRef<HTMLDivElement>(null);

  useScrollScene(root, (el) => {
    const inner = el.firstElementChild as HTMLElement;
    gsap.fromTo(
      inner,
      { yPercent: -42 },
      {
        yPercent: 0,
        ease: "none",
        scrollTrigger: {
          trigger: el,
          start: "top bottom",
          end: () => `+=${Math.min(el.offsetHeight, window.innerHeight)}`,
          scrub: true,
          invalidateOnRefresh: true,
        },
      },
    );
  });

  return (
    <div ref={root} className="relative z-[5] overflow-clip">
      <div className="will-change-transform">{children}</div>
    </div>
  );
}
