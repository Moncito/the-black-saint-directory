"use client";

import { useRef } from "react";
import { stations } from "@/content/process";
import { gsap, ScrollTrigger } from "@/lib/gsap";
import { useScrollScene } from "@/lib/useScrollScene";
import { SectionHead } from "@/components/ui";

/**
 * Six stations. The line weaves through the numbered markers as you scroll,
 * and each station wakes as the line reaches it.
 */
export function ProcessLine() {
  const root = useRef<HTMLElement>(null);

  useScrollScene(root, (el) => {
    const list = el.querySelector<HTMLElement>(".process__list")!;
    const svg = el.querySelector<SVGSVGElement>(".process__svg")!;
    const path = svg.querySelector<SVGPathElement>(".process__path")!;
    const trail = svg.querySelector<SVGPathElement>(".process__trail")!;
    const items = gsap.utils.toArray<HTMLElement>(".process__station", el);
    const marks = items.map((item) => item.querySelector<HTMLElement>(".process__mark")!);
    let length = 0;
    let stops: number[] = [];

    // Thread a smooth curve through the centre of every marker.
    const layout = () => {
      const box = list.getBoundingClientRect();
      const pts = marks.map((mark) => {
        const r = mark.getBoundingClientRect();
        return { x: r.left + r.width / 2 - box.left, y: r.top + r.height / 2 - box.top };
      });
      svg.setAttribute("viewBox", `0 0 ${box.width} ${box.height}`);
      let d = `M ${pts[0].x} ${pts[0].y}`;
      for (let i = 1; i < pts.length; i++) {
        const a = pts[i - 1];
        const b = pts[i];
        const dy = b.y - a.y;
        if (Math.abs(b.x - a.x) < 2) {
          // Stacked markers (narrow screens): keep the serpent's sway.
          const sway = i % 2 ? 26 : -26;
          d += ` C ${a.x + sway} ${a.y + dy * 0.33}, ${a.x - sway} ${a.y + dy * 0.66}, ${b.x} ${b.y}`;
        } else {
          d += ` C ${a.x} ${a.y + dy * 0.55}, ${b.x} ${b.y - dy * 0.55}, ${b.x} ${b.y}`;
        }
      }
      path.setAttribute("d", d);
      trail.setAttribute("d", d);
      length = path.getTotalLength();
      path.style.strokeDasharray = `${length}`;

      // Where along the line each marker sits, 0 → 1.
      stops = pts.map((_, i) => {
        if (i === 0) return 0;
        if (i === pts.length - 1) return 1;
        let lo = 0;
        let hi = length;
        for (let k = 0; k < 18; k++) {
          const mid = (lo + hi) / 2;
          if (path.getPointAtLength(mid).y < pts[i].y) lo = mid;
          else hi = mid;
        }
        return lo / length;
      });
    };

    const draw = (progress: number) => {
      path.style.strokeDashoffset = `${length * (1 - progress)}`;
      items.forEach((item, i) => item.classList.toggle("is-reached", progress >= stops[i] - 0.004));
    };

    layout();
    draw(0);

    ScrollTrigger.create({
      trigger: list,
      start: "top 62%",
      end: "bottom 58%",
      scrub: 0.7,
      invalidateOnRefresh: true,
      onRefresh: (self) => {
        layout();
        draw(self.progress);
      },
      onUpdate: (self) => draw(self.progress),
    });
  });

  return (
    <section ref={root} className="process surface-paper gutter">
      <SectionHead index="04" label="Process" />
      <div className="process__list">
        <svg aria-hidden="true" className="process__svg" fill="none">
          <path className="process__trail" />
          <path className="process__path" />
        </svg>
        <ol>
          {stations.map((station) => (
            <li key={station.index} className="process__station">
              <span className="process__mark t-label">{station.index}</span>
              <div className="process__body">
                <h3 className="t-h2">{station.name}</h3>
                <p className="t-body text-muted mt-4 max-w-[36ch]">{station.description}</p>
              </div>
            </li>
          ))}
        </ol>
      </div>
    </section>
  );
}
