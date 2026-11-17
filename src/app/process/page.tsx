import type { Metadata } from "next";
import { pageMeta } from "@/lib/seo";
import { stations } from "@/content/process";
import { PageHeader } from "@/components/ui";

export const metadata: Metadata = pageMeta({ title: "Process", path: "/process" });

/** Phase 1 skeleton. Timelines, deliverables and the weaving line come later. */
export default function Process() {
  return (
    <>
      <PageHeader
        label={`Process — ${String(stations.length).padStart(2, "0")}`}
        title="Process"
      />
      <section className="gutter pb-[16vh]">
        <ol className="border-t border-graphite">
          {stations.map((station) => (
            <li
              key={station.index}
              data-reveal="fade"
              className="grid gap-4 border-b border-graphite py-10 md:grid-cols-[4rem_1fr_1.2fr] md:gap-10 md:py-14"
            >
              <span className="t-label pt-3 text-fog">{station.index}</span>
              <h2 className="t-h1">{station.name}</h2>
              <p className="t-h3 max-w-[30ch] text-fog md:pt-4">{station.description}</p>
            </li>
          ))}
        </ol>
      </section>
    </>
  );
}
