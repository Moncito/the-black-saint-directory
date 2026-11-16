import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getService, services } from "@/content/services";
import { TLink } from "@/components/Transition";
import { Label, PageHeader } from "@/components/ui";

type Props = { params: Promise<{ slug: string }> };

export const dynamicParams = false;

export const generateStaticParams = () => services.map((s) => ({ slug: s.slug }));

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const service = getService((await params).slug);
  return service ? { title: service.name, description: service.description } : {};
}

/** Phase 1 skeleton. The live demo for each service arrives in Phase 4. */
export default async function ServicePage({ params }: Props) {
  const service = getService((await params).slug);
  if (!service) notFound();
  const others = services.filter((s) => s.slug !== service.slug);

  return (
    <>
      <PageHeader label={`Services — ${service.index}`} title={service.name} />
      <section className="gutter grid gap-10 pb-[16vh] md:grid-cols-[1fr_2fr]">
        <p data-reveal="fade" className="t-label">
          {service.priceFrom}
        </p>
        <p data-reveal="lines" className="t-h2 max-w-[24ch]">
          {service.description}
        </p>
      </section>

      <section className="gutter pb-[10vh]">
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
