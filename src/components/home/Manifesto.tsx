"use client";

import { useRef } from "react";
import { manifesto } from "@/content/site";
import { gsap } from "@/lib/gsap";
import { useScrollScene } from "@/lib/useScrollScene";
import { SectionHead } from "@/components/ui";

const keys = manifesto.keyWords as readonly string[];
const words = manifesto.text.split(" ").map((word) => ({
  word,
  key: keys.includes(word.toLowerCase().replace(/[^a-z]/g, "")),
}));

/**
 * Pinned. As you scroll, each word comes up from 15% to full, and the serpent
 * line draws itself under the words that matter.
 */
export function Manifesto() {
  const root = useRef<HTMLElement>(null);

  useScrollScene(root, (el) => {
    const all = el.querySelectorAll<HTMLElement>(".mw");
    const tl = gsap.timeline({
      defaults: { ease: "none" },
      scrollTrigger: {
        trigger: el,
        start: "top top",
        end: () => `+=${window.innerHeight * 1.6}`,
        pin: true,
        scrub: 0.6,
        invalidateOnRefresh: true,
      },
    });
    // 36% is the dimmest the words go and still read as large text (3:1).
    tl.fromTo(all, { opacity: 0.36 }, { opacity: 1, duration: 1, stagger: 1 }, 0);
    all.forEach((node, i) => {
      const line = node.querySelector(".mw__line");
      if (line)
        tl.fromTo(
          line,
          { clipPath: "inset(-40% 100% -40% 0)" },
          { clipPath: "inset(-40% 0% -40% 0)", duration: 4, ease: "power2.out" },
          i + 0.5,
        );
    });
    // Hold the finished thought for a beat before the page moves on.
    tl.to({}, { duration: 6 });
  });

  return (
    <section ref={root} className="manifesto gutter">
      <SectionHead index="01" label="Manifesto" />
      <p className="manifesto__text t-h2">
        {words.map(({ word, key }, i) => (
          <span key={i} className="mw">
            {word}
            {key && (
              <svg
                aria-hidden="true"
                className="mw__line"
                viewBox="0 0 100 12"
                preserveAspectRatio="none"
              >
                <path d="M0 7 C 14 1, 27 12, 44 6 S 76 1, 100 7" vectorEffect="non-scaling-stroke" />
              </svg>
            )}{" "}
          </span>
        ))}
      </p>
    </section>
  );
}
