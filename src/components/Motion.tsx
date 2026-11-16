"use client";

import { useEffect } from "react";
import { usePathname } from "next/navigation";
import { gsap, ScrollTrigger, SplitText, EASE } from "@/lib/gsap";
import { useStore } from "@/lib/store";
import { refreshSoon } from "@/lib/useScrollScene";

/**
 * Site-wide reveal system. Mark elements in server components:
 *
 *   data-reveal="lines"  heading split into lines that rise from a mask
 *   data-reveal="fade"   block that eases up and in
 *   data-reveal="rule"   hairline that draws left to right
 *
 * Everything triggers once as it scrolls into view. With reduced motion (or
 * if JS never arrives) the content is simply visible.
 */
export function Motion() {
  const pathname = usePathname();
  const reducedMotion = useStore((s) => s.reducedMotion);
  const introDone = useStore((s) => s.introDone);

  // Anything that changes the page's height after load — a filter, a view
  // switch, an image arriving — moves every section below it. Re-measure, so
  // scroll-linked work never runs against stale positions.
  useEffect(() => {
    if (reducedMotion || !introDone) return;
    let last = document.documentElement.scrollHeight;
    const onRefresh = () => {
      last = document.documentElement.scrollHeight;
    };
    const observer = new ResizeObserver(() => {
      const next = document.documentElement.scrollHeight;
      if (Math.abs(next - last) < 8) return;
      last = next;
      refreshSoon();
    });
    observer.observe(document.body);
    ScrollTrigger.addEventListener("refresh", onRefresh);
    return () => {
      observer.disconnect();
      ScrollTrigger.removeEventListener("refresh", onRefresh);
    };
  }, [reducedMotion, introDone]);

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

        scope.querySelectorAll<HTMLElement>('[data-reveal="lines"]').forEach((el) => {
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
      root.classList.add("motion-ready");
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
