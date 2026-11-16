import type { Metadata } from "next";
import type { ReactNode } from "react";
import { notFound } from "next/navigation";
import { getService, services } from "@/content/services";
import { TLink } from "@/components/Transition";
import { Label, PageHeader, SectionHead } from "@/components/ui";
import { TypePlayground } from "@/components/demos/TypePlayground";
import { ProductViewer } from "@/components/demos/ProductViewer";
import { SystemsDashboard } from "@/components/demos/SystemsDashboard";
import { PhoneScroll } from "@/components/demos/PhoneScroll";

type Props = { params: Promise<{ slug: string }> };

export const dynamicParams = false;

export const generateStaticParams = () => services.map((s) => ({ slug: s.slug }));

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const service = getService((await params).slug);
  return service ? { title: service.name, description: service.description } : {};
}

/** Every service page proves itself with something you can touch. */
const demos: Record<string, ReactNode> = {
  "editorial-sites": <TypePlayground />,
  "immersive-3d": <ProductViewer />,
  systems: <SystemsDashboard />,
  mobile: <PhoneScroll />,
};

export default async function ServicePage({ params }: Props) {
  const service = getService((await params).slug);
  if (!service) notFound();
  const others = services.filter((s) => s.slug !== service.slug);

  return (
    <>
      <PageHeader label={`Services — ${service.index}`} title={service.name} />
      <section className="gutter grid gap-10 pb-[12vh] md:grid-cols-[1fr_2fr]">
        <p data-reveal="fade" className="t-label">
          {service.priceFrom}
        </p>
        <p data-reveal="lines" className="t-h2 max-w-[24ch]">
          {service.description}
        </p>
      </section>

      <section className="pb-[16vh]" aria-label="Live demo">
        <div className="gutter">
          <SectionHead index={service.index} label="Live demo" />
        </div>
        <div className={service.slug === "mobile" ? "" : "gutter"}>{demos[service.slug]}</div>
      </section>

      <section className="gutter pb-[14vh]">
        <Label>Services</Label>
        <ul className="mt-6 border-t border-graphite">
          {others.map((other) => (
            <li key={other.slug} className="border-b border-graphite">
              <TLink
                href={`/services/${other.slug}`}
                data-cursor="Open"
                className="group flex items-baseline justify-between gap-6 py-6"
              >
                <span className="t-h3 transition-transform duration-[1100ms] ease-[var(--ease-expo)] group-hover:translate-x-3">
                  {other.name}
                </span>
                <span className="t-label text-fog">{other.index}</span>
              </TLink>
            </li>
          ))}
        </ul>
      </section>
    </>
  );
}
