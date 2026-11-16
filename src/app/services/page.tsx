import type { Metadata } from "next";
import { services } from "@/content/services";
import { TLink } from "@/components/Transition";
import { PageHeader } from "@/components/ui";

export const metadata: Metadata = { title: "Services" };

export default function Services() {
  return (
    <>
      <PageHeader
        label={`Services — ${String(services.length).padStart(2, "0")}`}
        title="Services"
      />
      <section className="gutter pb-[16vh]">
        <ul className="border-t border-graphite">
          {services.map((service) => (
            <li key={service.slug} data-reveal="fade" className="border-b border-graphite">
              <TLink
                href={`/services/${service.slug}`}
                data-cursor="Open"
                className="group grid gap-5 py-10 md:grid-cols-[4rem_1fr_1.2fr] md:gap-10 md:py-14"
              >
                <span className="t-label pt-3 text-fog">{service.index}</span>
                <h2 className="t-h1 transition-transform duration-[1200ms] ease-[var(--ease-expo)] group-hover:translate-x-4">
                  {service.name}
                </h2>
                <div className="md:pt-4">
                  <p className="t-body max-w-[46ch] text-fog">{service.description}</p>
                  <p className="t-label mt-6">{service.priceFrom}</p>
                </div>
              </TLink>
            </li>
          ))}
        </ul>
      </section>
    </>
  );
}
