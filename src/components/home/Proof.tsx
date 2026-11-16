"use client";

import { useEffect, useRef, useState } from "react";
import { proof } from "@/content/site";
import { useStore } from "@/lib/store";
import { SectionHead } from "@/components/ui";

type Numbers = { load: number | null; kb: number | null; frame: number | null };

const TIER_LABEL = { full: "Full", lite: "Lite", static: "Static" } as const;

/** Real numbers for this page, on this device, right now. Nothing is hard-coded. */
function measure(): Pick<Numbers, "load" | "kb"> {
  const nav = performance.getEntriesByType("navigation")[0] as
    | PerformanceNavigationTiming
    | undefined;
  const end = nav ? nav.loadEventEnd || nav.domContentLoadedEventEnd : 0;
  const resources = performance.getEntriesByType("resource") as PerformanceResourceTiming[];
  const bytes = resources.reduce((sum, r) => sum + (r.transferSize || 0), nav?.transferSize ?? 0);
  return { load: end > 0 ? end / 1000 : null, kb: bytes > 0 ? bytes / 1024 : null };
}

export function Proof() {
  const tier = useStore((s) => s.tier);
  const reducedMotion = useStore((s) => s.reducedMotion);
  const root = useRef<HTMLElement>(null);
  const [numbers, setNumbers] = useState<Numbers>({ load: null, kb: null, frame: null });
  const [seen, setSeen] = useState(false);

  // Only measure while the section is on screen.
  useEffect(() => {
    const el = root.current;
    if (!el) return;
    const io = new IntersectionObserver(([entry]) => setSeen(entry.isIntersecting), {
      threshold: 0.25,
    });
    io.observe(el);
    return () => io.disconnect();
  }, []);

  useEffect(() => {
    if (!seen) return;
    const update = () => setNumbers((n) => ({ ...n, ...measure() }));
    update();
    const id = window.setInterval(update, 2000);
    return () => window.clearInterval(id);
  }, [seen]);

  // Cost of a frame with the 3D scene running: the average over one second.
  useEffect(() => {
    if (!seen || tier === "static" || tier === null || reducedMotion) return;
    let frame = 0;
    let count = 0;
    let start = 0;
    const tick = (now: number) => {
      if (!start) start = now;
      count++;
      if (now - start >= 1000) {
        setNumbers((n) => ({ ...n, frame: (now - start) / (count - 1) }));
        start = now;
        count = 1;
      }
      frame = requestAnimationFrame(tick);
    };
    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, [seen, tier, reducedMotion]);

  const threeD =
    tier === "static" || reducedMotion
      ? { value: "0", unit: "ms" }
      : { value: numbers.frame ? numbers.frame.toFixed(1) : "—", unit: "ms / frame" };

  const rows = [
    {
      label: "Page load",
      value: numbers.load ? numbers.load.toFixed(2) : "—",
      unit: "s",
    },
    {
      label: "Transferred",
      value: numbers.kb ? Math.round(numbers.kb).toLocaleString("en") : "—",
      unit: "KB",
    },
    {
      label: tier ? `3D — ${TIER_LABEL[tier]} tier` : "3D",
      value: threeD.value,
      unit: threeD.unit,
    },
  ];

  return (
    <section ref={root} className="gutter py-[20vh]">
      <SectionHead index="05" label="Proof" />
      <p data-reveal="lines" className="t-h1 max-w-[14ch]">
        {proof.line}
      </p>
      <dl className="mt-[10vh] grid gap-10 border-t border-graphite pt-8 sm:grid-cols-3">
        {rows.map((row, i) => (
          // Index keys: the 3D label changes once the tier is known, and a
          // remount would drop the element out of the reveal system.
          <div key={i} data-reveal="fade">
            <dt className="t-label text-fog">{row.label}</dt>
            <dd className="mt-4 flex items-baseline gap-3">
              <span className="t-h1 tabular-nums">{row.value}</span>
              <span className="t-label text-fog">{row.unit}</span>
            </dd>
          </div>
        ))}
      </dl>
      <p data-reveal="fade" className="t-label mt-8 text-fog">
        This page · this device · measured live
      </p>
    </section>
  );
}
