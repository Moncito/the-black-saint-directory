import type { Metadata } from "next";
import { carePlans, formatPhp, formatRange, packages, rules } from "@/content/pricing";
import { cta } from "@/content/site";
import { PageHeader, SectionHead } from "@/components/ui";

export const metadata: Metadata = { title: cta.action };

/**
 * Phase 1 skeleton: the price book, straight from the config. The interactive
 * quote builder and the inquiry form replace this in Phase 4.
 */
export default function Start() {
  return (
    <>
      <PageHeader label="Start" title={cta.action}>
        <p data-reveal="fade" className="t-body mt-8 max-w-[44ch] text-fog">
          {rules.note}
        </p>
      </PageHeader>

      <section className="gutter pb-[14vh]">
        <SectionHead index={String(packages.length).padStart(2, "0")} label="Packages" />
        <ul>
          {packages.map((pkg) => (
            <li
              key={pkg.id}
              data-reveal="fade"
              className="grid gap-3 border-b border-graphite py-8 md:grid-cols-[1.2fr_1.4fr_auto] md:items-baseline md:gap-10"
            >
              <h2 className="t-h3">{pkg.name}</h2>
              <p className="t-body max-w-[48ch] text-fog">{pkg.scope}</p>
              <p className="t-label md:text-right">
                <span className="block tabular-nums">{formatRange(pkg.php)}</span>
                <span className="mt-2 block text-fog">{pkg.timeline}</span>
              </p>
            </li>
          ))}
        </ul>
      </section>

      <section className="gutter pb-[18vh]">
        <SectionHead index={String(carePlans.length).padStart(2, "0")} label="Care plans" />
        <ul className="grid gap-10 md:grid-cols-3">
          {carePlans.map((plan) => (
            <li key={plan.id} data-reveal="fade" className="border-t border-graphite pt-6">
              <h2 className="t-h2">{plan.name}</h2>
              <p className="t-label mt-4 tabular-nums">{formatPhp(plan.phpMonthly)}/mo</p>
              <p className="t-body mt-5 max-w-[36ch] text-fog">{plan.includes}</p>
            </li>
          ))}
        </ul>
      </section>
    </>
  );
}
