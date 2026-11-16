import type { CSSProperties } from "react";
import { hero, site } from "@/content/site";
import { ManilaClock } from "@/components/ManilaClock";
import { Manifesto } from "@/components/home/Manifesto";
import { WorkGallery } from "@/components/home/WorkGallery";
import { ServicesHalo } from "@/components/home/ServicesHalo";
import { ProcessLine } from "@/components/home/ProcessLine";
import { Proof } from "@/components/home/Proof";

const i = (n: number) => ({ "--i": n }) as CSSProperties;

export default function Home() {
  return (
    <>
      {/* 1 — Hero. Type, fog and the candle cursor. */}
      <section className="gutter relative flex min-h-[100svh] flex-col justify-end pb-6 pt-[var(--spacing-nav)]">
        <h1 className="t-hero relative max-w-[9.5em] pb-[6vh]">
          <span className="rise-mask">
            <span className="rise-line" style={i(0)}>
              {hero.line1}
            </span>
          </span>
          <span className="rise-mask">
            <span className="rise-line t-accent" style={i(1)}>
              {hero.line2}
            </span>
          </span>
        </h1>
        <div
          className="fade-in t-label relative flex flex-wrap items-center justify-between gap-x-10 gap-y-2 border-t border-graphite pt-5 text-fog"
          style={i(2)}
        >
          <span>{site.location}</span>
          <ManilaClock />
          <span>{site.disciplines}</span>
          <span aria-hidden="true" className="hidden items-center gap-3 md:inline-flex">
            Scroll <span className="inline-block h-px w-10 bg-current" />
          </span>
        </div>
      </section>

      {/* 2 — Manifesto: pinned, word by word, the line under the key words. */}
      <Manifesto />

      {/* 3 — Selected work: pinned horizontal gallery, colour at the centre. */}
      <WorkGallery />

      {/* 4 — Services halo. */}
      <ServicesHalo />

      {/* 5 — Process: six stations, one line through them. */}
      <ProcessLine />

      {/* 6 — Proof: live numbers for this page on this device. */}
      <Proof />

      {/* 7 — Testimonials: hidden until we have real ones. */}
      {/* 8 — CTA and 9 — Footer live in the shared footer. */}
    </>
  );
}
