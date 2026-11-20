import type { Metadata } from "next";
import { JsonLd } from "@/components/JsonLd";
import { graph, breadcrumbs, people } from "@/lib/schema";
import { pageMeta } from "@/lib/seo";
import { seo } from "@/content/seo";
import { saints } from "@/content/team";
import { values } from "@/content/site";
import { PageHeader } from "@/components/ui";
import { SaintCard } from "@/components/studio/SaintCard";

export const metadata: Metadata = pageMeta({ ...seo.studio, path: "/studio" });

export default function Studio() {
  return (
    <>
      <JsonLd data={graph(breadcrumbs([{ name: "Studio", path: "/studio" }]), people())} />
      <PageHeader label="Studio" title="The Saints" />

      <section className="gutter pb-[16vh]">
        <div className="grid gap-x-10 gap-y-24 md:grid-cols-2">
          {saints.map((saint, i) => (
            <SaintCard key={saint.slug} saint={saint} index={i} />
          ))}
        </div>
      </section>

      {/* Values: one statement per screen. */}
      <section className="surface-paper" aria-label="Values">
        {values.map((value, i) => (
          <div key={value} className="value gutter">
            <p className="t-label text-muted">
              {String(i + 1).padStart(2, "0")} / {String(values.length).padStart(2, "0")} — Values
            </p>
            <p data-reveal="lines" className="t-hero value__text">
              {value}
            </p>
          </div>
        ))}
      </section>
    </>
  );
}
