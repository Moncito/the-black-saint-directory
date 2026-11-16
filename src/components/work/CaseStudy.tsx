"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";
import { gsap } from "@/lib/gsap";
import { useScrollScene } from "@/lib/useScrollScene";
import { tick } from "@/lib/sound";

/**
 * Case-study behaviour that needs the client:
 *
 *   - "How we built it": press W (or the button) to strip the page back to its
 *     wireframe — every image becomes a crossed box, every block an outline.
 *   - Scroll-scrubbed media: the screen settles into its frame as you scroll.
 */
export function CaseStudyShell({ children }: { children: ReactNode }) {
  const root = useRef<HTMLElement>(null);
  const [built, setBuilt] = useState(false);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key.toLowerCase() !== "w" || e.metaKey || e.ctrlKey || e.altKey) return;
      const target = e.target as HTMLElement | null;
      if (target?.closest("input, textarea, select, [contenteditable]")) return;
      setBuilt((b) => !b);
      tick("click");
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  useScrollScene(root, (el) => {
    el.querySelectorAll<HTMLElement>("[data-scrub]").forEach((frame) => {
      const media = frame.querySelector("img");
      gsap.fromTo(
        frame,
        { clipPath: "inset(9% 7% 9% 7% round 18px)" },
        {
          clipPath: "inset(0% 0% 0% 0% round 18px)",
          ease: "none",
          scrollTrigger: { trigger: frame, start: "top 92%", end: "top 28%", scrub: 0.6 },
        },
      );
      if (media)
        gsap.fromTo(
          media,
          { scale: 1.16, yPercent: -4 },
          {
            scale: 1,
            yPercent: 0,
            ease: "none",
            scrollTrigger: { trigger: frame, start: "top 92%", end: "bottom 40%", scrub: 0.6 },
          },
        );
    });
  });

  return (
    <article ref={root} className="case" data-built={built || undefined}>
      {children}
      <button
        type="button"
        aria-pressed={built}
        onClick={() => {
          setBuilt((b) => !b);
          tick("click");
        }}
        className="case__toggle t-label"
      >
        <span>How we built it</span>
        <kbd aria-hidden="true">W</kbd>
      </button>
    </article>
  );
}
