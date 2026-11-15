import type { Metadata } from "next";
import Image from "next/image";
import { saints } from "@/content/team";
import { values } from "@/content/site";
import { Cta, ExternalLink, Label, PageHeader, SectionHead } from "@/components/ui";

export const metadata: Metadata = { title: "Studio" };

/** Phase 1 skeleton. Halftone portraits and flip cards arrive in Phase 4. */
export default function Studio() {
  return (
    <>
      <PageHeader label="Studio" title="The Saints" />

      <section className="gutter pb-[16vh]">
        <div className="grid gap-x-10 gap-y-24 md:grid-cols-2">
          {saints.map((saint, i) => (
            <article key={saint.slug} data-reveal="fade">
              <div className="relative aspect-[4/5] overflow-hidden bg-carbon">
                <Image
                  src={saint.portrait}
                  alt={saint.name}
                  fill
                  sizes="(min-width: 768px) 50vw, 100vw"
                  priority={i === 0}
                  className="work-image is-static object-cover"
                />
              </div>
              <Label className="mt-6">{saint.role}</Label>
              <h2 className="t-h2 mt-3">{saint.name}</h2>
              <p className="t-body mt-6 max-w-[52ch] text-fog">{saint.bio}</p>
              <p className="t-h3 t-accent mt-8 max-w-[26ch]">“{saint.line}”</p>
              <div className="mt-6 flex gap-8">
                {saint.links.map((link) => (
                  <ExternalLink key={link.href} href={link.href}>
                    {link.label}
                  </ExternalLink>
                ))}
              </div>
            </article>
          ))}
        </div>
      </section>

      <section className="surface-paper gutter py-[18vh]">
        <SectionHead index={String(values.length).padStart(2, "0")} label="Values" />
        <ul className="space-y-[10vh]">
          {values.map((value) => (
            <li key={value}>
              <p data-reveal="lines" className="t-h1 max-w-[14ch]">
                {value}
              </p>
            </li>
          ))}
        </ul>
      </section>
      <Cta />
    </>
  );
}
