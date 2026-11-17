"use client";

import { useEffect } from "react";
import { usePathname } from "next/navigation";
import { gsap, ScrollTrigger, SplitText, EASE } from "@/lib/gsap";
import { useStore } from "@/lib/store";

/**
 * Site-wide reveal system. Mark elements in server components:
 *
 *   data-reveal="lines"  heading split into lines that rise from a mask
 *   data-reveal="fade"   block that eases up and in
 *   data-reveal="rule"   hairline that draws left to right
 *
 * Everything triggers once as it scrolls into view. With reduced motion (or
 * if JS never arrives) the content is simply visible.
 *
 * On the first page load, whatever is already on screen is left alone: it
 * paints with the HTML instead of waiting for JS, which keeps the largest
 * paint fast. After a route change the transition cover hides the new page,
 * so everything can animate in.
 */

let firstLoad = true;
export function Motion() {
  const pathname = usePathname();
  const reducedMotion = useStore((s) => s.reducedMotion);
  const introDone = useStore((s) => s.introDone);

  useEffect(() => {
    const root = document.documentElement;
    if (reducedMotion) {
      root.classList.remove("motion-ok");
      return;
    }

    // Nothing reveals behind the intro; it all starts as the page fades up.
    if (!introDone) return;

    let ctx: gsap.Context | undefined;
    let cancelled = false;

    const build = () => {
      if (cancelled) return;
      ctx = gsap.context(() => {
        // Main and the footer (the closing call to action lives there).
        const scope = document.body;
        const trigger = (el: Element) => ({ trigger: el, start: "top 88%", once: true });
        const skip = (el: HTMLElement) => {
          if (!firstLoad) return false;
          const r = el.getBoundingClientRect();
          if (r.top >= window.innerHeight || r.bottom <= 0) return false;
          gsap.set(el, { visibility: "visible" });
          return true;
        };

        scope.querySelectorAll<HTMLElement>('[data-reveal="lines"]').forEach((el) => {
          if (skip(el)) return;
          SplitText.create(el, {
            type: "lines",
            mask: "lines",
            autoSplit: true,
            // Keep the paragraph readable as-is; no aria-label on a <p>.
            aria: "none",
            onSplit: (self) => {
              gsap.set(el, { visibility: "visible" });
              // Tight leading would crop descenders (g, y, p) at the mask edge:
              // give each mask room below and pull the next line back up.
              gsap.set(self.masks, { paddingBottom: "0.22em", marginBottom: "-0.22em" });
              return gsap.from(self.lines, {
                yPercent: 112,
                duration: 1.3,
                stagger: 0.09,
                ease: EASE.out,
                scrollTrigger: trigger(el),
              });
            },
          });
        });

        scope.querySelectorAll<HTMLElement>('[data-reveal="fade"]').forEach((el) => {
          if (skip(el)) return;
          gsap.set(el, { visibility: "visible" });
          gsap.from(el, {
            y: 28,
            autoAlpha: 0,
            duration: 1.2,
            ease: EASE.outSoft,
            scrollTrigger: trigger(el),
          });
        });

        scope.querySelectorAll<HTMLElement>('[data-reveal="rule"]').forEach((el) => {
          if (skip(el)) return;
          gsap.set(el, { visibility: "visible", transformOrigin: "left center" });
          gsap.from(el, {
            scaleX: 0,
            duration: 1.4,
            ease: EASE.inOut,
            scrollTrigger: trigger(el),
          });
        });
      });
      ScrollTrigger.refresh();
      firstLoad = false;
      // From now on, new pages hide their reveals until they are built.
      root.classList.add("motion-ready", "motion-nav");
    };

    // Split after fonts settle so line breaks are the real ones.
    document.fonts.ready.then(() => requestAnimationFrame(build));

    return () => {
      cancelled = true;
      ctx?.revert();
    };
  }, [pathname, reducedMotion, introDone]);

  return null;
}
