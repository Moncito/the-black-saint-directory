"use client";

import { useRef } from "react";
import { services } from "@/content/services";
import { gsap } from "@/lib/gsap";
import { useScrollScene } from "@/lib/useScrollScene";
import { TLink } from "@/components/Transition";
import { SectionHead } from "@/components/ui";

const COUNT = services.length;
const STEP = (Math.PI * 2) / COUNT;

/**
 * Four services on a halo. Scroll turns the ring; whichever service comes to
 * the front sharpens and shows its one-liner and price-from. Each name is a
 * real link, and without motion the section is a plain, complete list.
 */
export function ServicesHalo() {
  const root = useRef<HTMLElement>(null);

  useScrollScene(root, (el) => {
    const stage = el.querySelector<HTMLElement>(".halo__stage")!;
    const items = gsap.utils.toArray<HTMLElement>(".halo__item", el);
    const panels = gsap.utils.toArray<HTMLElement>(".halo__panel", el);
    const state = { turn: 0 };
    let active = -1;

    const place = () => {
      const w = stage.clientWidth;
      const rx = Math.min(w * 0.4, 520);
      const rz = rx * 0.55;
      items.forEach((item, i) => {
        const a = i * STEP - state.turn;
        const depth = Math.cos(a); // 1 = front, -1 = back
        const front = (depth + 1) / 2;
        const sharp = Math.pow(front, 3);
        gsap.set(item, {
          // GSAP owns the whole transform, so the centring lives here too.
          xPercent: -50,
          yPercent: -50,
          x: Math.sin(a) * rx,
          y: -depth * rz * 0.34,
          scale: 0.5 + front * 0.5,
          opacity: 0.16 + sharp * 0.84,
          filter: `blur(${((1 - sharp) * 5).toFixed(2)}px)`,
          zIndex: Math.round(front * 10),
        });
        item.style.pointerEvents = front > 0.6 ? "auto" : "none";
        item.tabIndex = front > 0.6 ? 0 : -1;
      });

      const next = ((Math.round(state.turn / STEP) % COUNT) + COUNT) % COUNT;
      if (next !== active) {
        active = next;
        panels.forEach((panel, i) => {
          panel.setAttribute("aria-hidden", String(i !== next));
          gsap.to(panel, {
            autoAlpha: i === next ? 1 : 0,
            y: i === next ? 0 : 14,
            duration: i === next ? 0.9 : 0.35,
            ease: "power4.out",
            overwrite: true,
          });
        });
      }
    };

    gsap.set(panels, { autoAlpha: 0, y: 14 });
    place();

    gsap.to(state, {
      turn: STEP * (COUNT - 1),
      ease: "none",
      onUpdate: place,
      scrollTrigger: {
        trigger: el,
        start: "top top",
        end: () => `+=${window.innerHeight * 2.4}`,
        pin: true,
        scrub: 0.9,
        snap: { snapTo: 1 / (COUNT - 1), duration: { min: 0.3, max: 0.9 }, ease: "power2.inOut" },
        invalidateOnRefresh: true,
        onRefresh: place,
      },
    });
  });

  return (
    <section ref={root} className="halo" aria-label="Services">
      <div className="gutter">
        <SectionHead index="03" label="Services" />
      </div>

      <div className="halo__stage">
        <span aria-hidden="true" className="halo__ring" />
        <span aria-hidden="true" className="halo__ring halo__ring--inner" />
        <ul className="halo__items">
          {services.map((service) => (
            <li key={service.slug} className="halo__item">
              <TLink href={`/services/${service.slug}`} data-cursor="Open" className="halo__name">
                <span className="t-label halo__index">{service.index}</span>
                {service.name}
              </TLink>
              {/* Shown only when the halo is not running (reduced motion, no JS). */}
              <div className="halo__static">
                <p className="t-body max-w-[46ch] text-fog">{service.description}</p>
                <p className="t-label mt-4">{service.priceFrom}</p>
              </div>
            </li>
          ))}
        </ul>
      </div>

      <div className="halo__panels gutter">
        {services.map((service) => (
          <div key={service.slug} className="halo__panel">
            <p className="t-body mx-auto max-w-[46ch] text-fog">{service.description}</p>
            <p className="t-label mt-5">{service.priceFrom}</p>
          </div>
        ))}
      </div>
    </section>
  );
}
