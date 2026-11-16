import type { CSSProperties } from "react";
import { hero, manifesto, proof, site } from "@/content/site";
import { services } from "@/content/services";
import { stations } from "@/content/process";
import { projects } from "@/content/projects";
import { TLink } from "@/components/Transition";
import { ManilaClock } from "@/components/ManilaClock";
import { ProjectCard, SectionHead } from "@/components/ui";

const i = (n: number) => ({ "--i": n }) as CSSProperties;

export default function Home() {
  return (
    <>
      {/* 1 — Hero. Type, fog and the candle cursor. */}
      <section className="gutter relative flex min-h-[100svh] flex-col justify-end pb-6 pt-[var(--spacing-nav)]">
        <h1 className="t-hero pointer-events-none relative max-w-[9.5em] pb-[6vh]">
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

      {/* 2 — Manifesto */}
      <section className="gutter py-[20vh]">
        <SectionHead index="01" label="Manifesto" />
        <p data-reveal="lines" className="t-h2 max-w-[26ch] md:ml-[25%] md:max-w-[30ch]">
          {manifesto.text}
        </p>
      </section>

      {/* 3 — Selected work */}
      <section className="gutter pb-[18vh]">
        <SectionHead index="02" label="Selected work" />
        <div className="grid gap-x-6 gap-y-16 md:grid-cols-2 md:gap-y-24">
          {projects.map((project) => (
            <ProjectCard key={project.slug} project={project} />
          ))}
        </div>
      </section>

      {/* 4 — Services */}
      <section className="gutter pb-[18vh]">
        <SectionHead index="03" label="Services" />
        <ul>
          {services.map((service) => (
            <li key={service.slug} data-reveal="fade" className="border-b border-graphite">
              <TLink
                href={`/services/${service.slug}`}
                data-cursor="Open"
                className="group grid gap-4 py-8 md:grid-cols-[4rem_1fr_1.2fr_auto] md:items-baseline md:gap-10 md:py-10"
              >
                <span className="t-label text-fog">{service.index}</span>
                <h3 className="t-h2 transition-transform duration-[1100ms] ease-[var(--ease-expo)] group-hover:translate-x-3">
                  {service.name}
                </h3>
                <p className="t-body max-w-[46ch] text-fog">{service.description}</p>
                <span className="t-label">{service.priceFrom}</span>
              </TLink>
            </li>
          ))}
        </ul>
      </section>

      {/* 5 — Process: six stations */}
      <section className="surface-paper gutter py-[18vh]">
        <SectionHead index="04" label="Process" />
        <ol className="grid gap-x-10 gap-y-14 md:grid-cols-2 lg:grid-cols-3">
          {stations.map((station) => (
            <li key={station.index} data-reveal="fade">
              <span className="t-label text-muted">{station.index}</span>
              <h3 className="t-h2 mt-3">{station.name}</h3>
              <p className="t-body text-muted mt-4 max-w-[38ch]">{station.description}</p>
            </li>
          ))}
        </ol>
      </section>

      {/* 6 — Proof. Live device numbers arrive in Phase 3. */}
      <section className="gutter py-[22vh]">
        <SectionHead index="05" label="Proof" />
        <p data-reveal="lines" className="t-h1 max-w-[14ch]">
          {proof.line}
        </p>
      </section>

      {/* 7 — Testimonials: hidden until we have real ones. */}
    </>
  );
}
