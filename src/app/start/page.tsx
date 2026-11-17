import type { Metadata } from "next";
import { pageMeta } from "@/lib/seo";
import { carePlans, formatPhp, rules } from "@/content/pricing";
import { cta, site } from "@/content/site";
import { PageHeader, SectionHead } from "@/components/ui";
import { QuoteBuilder } from "@/components/start/QuoteBuilder";

export const metadata: Metadata = pageMeta({
  title: cta.action,
  description: `${site.description} ${rules.note}`,
  path: "/start",
});

export default function Start() {
  return (
    <>
      <PageHeader label="Start" title={cta.action}>
        <p className="t-body mt-8 max-w-[44ch] text-fog">{rules.note}</p>
      </PageHeader>

      <section className="gutter pb-[14vh]">
        <QuoteBuilder />
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
