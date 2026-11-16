"use client";

import { usePathname } from "next/navigation";
import { cta, site, startHref } from "@/content/site";
import { TLink } from "./Transition";
import { Magnetic } from "./Magnetic";

/**
 * The closing call to action: a dark, living box set into the Paper footer.
 * Inside it, slow light drifts and the One Line keeps travelling — monochrome,
 * CSS only, and still when reduced motion is requested.
 */
export function FooterCta() {
  const pathname = usePathname();
  // Already on the page it points to.
  if (pathname === startHref) return null;

  return (
    <section aria-labelledby="footer-cta" className="cta-box">
      <div aria-hidden="true" className="cta-box__stage">
        <span className="cta-box__light cta-box__light--a" />
        <span className="cta-box__light cta-box__light--b" />
        <span className="cta-box__light cta-box__light--c" />
        <svg
          className="cta-box__line"
          viewBox="0 0 1200 460"
          preserveAspectRatio="xMidYMid slice"
          fill="none"
        >
          <path
            className="cta-box__trail"
            d="M-80 330 C 120 120, 300 420, 520 250 S 860 60, 1040 230 S 1220 400, 1300 180"
            pathLength={1}
          />
          <path
            className="cta-box__serpent"
            d="M-80 330 C 120 120, 300 420, 520 250 S 860 60, 1040 230 S 1220 400, 1300 180"
            pathLength={1}
          />
        </svg>
        <span className="cta-box__grain" />
      </div>

      <div className="cta-box__content">
        <h2 id="footer-cta" data-reveal="lines" className="cta-box__heading">
          {cta.heading}
        </h2>
        <p data-reveal="fade" className="t-body mx-auto mt-6 max-w-[44ch] text-fog">
          {site.description}
        </p>
        <div
          data-reveal="fade"
          className="mt-10 flex flex-wrap items-center justify-center gap-x-8 gap-y-4"
        >
          <Magnetic strength={0.3}>
            <TLink
              href={startHref}
              className="t-label inline-flex h-14 items-center gap-3 rounded-full bg-white px-8 text-ink transition-colors duration-700 ease-[var(--ease-expo)] hover:bg-bone"
            >
              {cta.action} <span aria-hidden="true">→</span>
            </TLink>
          </Magnetic>
          <TLink href="/work" className="t-label inline-flex h-14 items-center gap-2 text-white">
            <span className="link-line">Work</span> <span aria-hidden="true">↗</span>
          </TLink>
        </div>
      </div>
    </section>
  );
}
