import type { Metadata } from "next";
import { JsonLd } from "@/components/JsonLd";
import { graph, breadcrumbs, serviceNode, packagesFor } from "@/lib/schema";
import { formatRange, rules } from "@/content/pricing";
import { cta, startHref } from "@/content/site";
import { pageMeta } from "@/lib/seo";
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
  return service
    ? pageMeta({
        title: service.name,
        description: service.description,
        path: `/services/${service.slug}`,
      })
    : {};
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
      <JsonLd
        data={graph(
          breadcrumbs([
            { name: "Services", path: "/services" },
            { name: service.name, path: `/services/${service.slug}` },
          ]),
          serviceNode(service),
        )}
      />
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

      {/* Straight from the price book: what each package includes, costs and takes. */}
      <section className="gutter pb-[14vh]" aria-label="Packages">
        <SectionHead index={String(packagesFor(service.slug).length).padStart(2, "0")} label="Packages" />
        <ul>
          {packagesFor(service.slug).map((pkg) => (
            <li
              key={pkg.id}
              data-reveal="fade"
              className="grid gap-3 border-b border-graphite py-8 md:grid-cols-[1.2fr_1.4fr_auto] md:items-baseline md:gap-10"
            >
              <h3 className="t-h3">{pkg.name}</h3>
              <p className="t-body max-w-[48ch] text-fog">{pkg.scope}</p>
              <p className="t-label md:text-right">
                <span className="block tabular-nums">{formatRange(pkg.php)}</span>
                <span className="mt-2 block text-fog">{pkg.timeline}</span>
              </p>
            </li>
          ))}
        </ul>
        <div className="mt-10 flex flex-wrap items-center gap-x-8 gap-y-4">
          <TLink
            href={startHref}
            className="t-label inline-flex h-14 items-center gap-3 rounded-full bg-white px-8 text-ink transition-colors duration-700 ease-[var(--ease-expo)] hover:bg-bone"
          >
            {cta.action} <span aria-hidden="true">→</span>
          </TLink>
          <p className="t-label text-fog">{rules.note}</p>
        </div>
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
