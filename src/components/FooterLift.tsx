"use client";

import { useRef, type ReactNode } from "react";
import { gsap } from "@/lib/gsap";
import { useScrollScene } from "@/lib/useScrollScene";

/**
 * The footer reveal: the page lifts away and the footer is uncovered beneath
 * it, rather than scrolling up like one more section.
 *
 * The offset is a small fixed distance, never a share of the footer's height:
 * the footer is taller than the screen, and a proportional offset hid the top
 * of the call to action for most of the scroll. The reveal also ends exactly
 * at the bottom of the page, so it always finishes — on short pages too.
 */
export function FooterLift({ children }: { children: ReactNode }) {
  const root = useRef<HTMLDivElement>(null);

  useScrollScene(root, (el) => {
    const inner = el.firstElementChild as HTMLElement;
    gsap.fromTo(
      inner,
      { y: () => -Math.min(110, window.innerHeight * 0.14) },
      {
        y: 0,
        ease: "none",
        scrollTrigger: {
          trigger: el,
          start: "top bottom",
          // Fully settled once a screen of footer is in view, or at the very
          // end of the page — whichever comes first.
          end: () => `+=${Math.min(el.offsetHeight, window.innerHeight * 0.7)}`,
          scrub: true,
          invalidateOnRefresh: true,
        },
      },
    );
  });

  return (
    <div ref={root} data-footer className="relative z-[5] overflow-clip">
      <div className="will-change-transform">{children}</div>
    </div>
  );
}
