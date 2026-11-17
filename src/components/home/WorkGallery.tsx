"use client";

import { useRef } from "react";
import Image from "next/image";
import { projects } from "@/content/projects";
import { gsap } from "@/lib/gsap";
import { useScrollScene } from "@/lib/useScrollScene";
import { TLink } from "@/components/Transition";
import { Badge, SectionHead } from "@/components/ui";

/**
 * Pinned horizontal gallery. Vertical scroll drives the track sideways; the
 * plates lean with scroll velocity, and each one is grayscale until it reaches
 * the centre (or is hovered), then turns to full colour. Colour = the work.
 *
 * Without motion it is a native, swipeable, snap-scrolling row.
 */
export function WorkGallery() {
  const root = useRef<HTMLElement>(null);

  useScrollScene(root, (el) => {
    const track = el.querySelector<HTMLElement>(".gallery__track")!;
    const cards = gsap.utils.toArray<HTMLElement>(".gallery__card", el);
    const images = cards.map((c) => c.querySelector<HTMLElement>(".work-image")!);
    const bar = el.querySelector<HTMLElement>(".gallery__bar span");
    const distance = () => Math.max(track.scrollWidth - window.innerWidth, 0);

    const lean = gsap.quickTo(cards, "skewX", { duration: 0.9, ease: "power4.out" });
    const squash = gsap.quickTo(images, "scaleX", { duration: 0.9, ease: "power4.out" });

    const light = () => {
      const mid = window.innerWidth / 2;
      cards.forEach((card, i) => {
        const r = card.getBoundingClientRect();
        const live = Math.abs(r.left + r.width / 2 - mid) < r.width * 0.42;
        images[i].classList.toggle("is-live", live);
      });
    };

    const tween = gsap.to(track, {
      x: () => -distance(),
      ease: "none",
      scrollTrigger: {
        trigger: el,
        start: "top top",
        end: () => `+=${distance()}`,
        pin: true,
        scrub: 0.8,
        invalidateOnRefresh: true,
        onUpdate: (self) => {
          const v = gsap.utils.clamp(-1, 1, self.getVelocity() / 2600);
          lean(v * -7);
          squash(1 + Math.abs(v) * 0.05);
          if (bar) bar.style.transform = `scaleX(${self.progress})`;
          light();
        },
        onRefresh: light,
      },
    });

    // Keyboard: a focused card off to the side is scrolled to the centre.
    // The track moves 1px for every 1px of page scroll, so the maths is direct.
    const onFocus = (e: FocusEvent) => {
      const card = (e.target as Element).closest<HTMLElement>(".gallery__card");
      const st = tween.scrollTrigger;
      if (!card || !st) return;
      const offset = card.offsetLeft - (window.innerWidth - card.offsetWidth) / 2;
      const top = st.start + gsap.utils.clamp(0, distance(), offset);
      window.scrollTo({ top, behavior: "instant" });
    };
    el.addEventListener("focusin", onFocus);
    return () => el.removeEventListener("focusin", onFocus);
  });

  return (
    <section ref={root} className="gallery" aria-label="Selected work">
      <div className="gutter">
        <SectionHead index="02" label="Selected work" />
      </div>
      <div className="gallery__viewport">
        <ul className="gallery__track">
          {projects.map((project) => (
            <li key={project.slug} className="gallery__card">
              <TLink
                href={`/work/${project.slug}`}
                shared
                data-cursor="View"
                className="group block"
              >
                <div className="overflow-hidden bg-carbon">
                  <Image
                    src={project.plate}
                    alt={`${project.name} — ${project.meta}`}
                    width={2400}
                    height={1500}
                    sizes="(min-width: 768px) 52vw, 82vw"
                    className="work-image h-auto w-full"
                  />
                </div>
                <div className="mt-4 flex items-start justify-between gap-6">
                  <div>
                    <h3 className="t-h3">
                      {project.name}
                      {project.badge && <Badge>{project.badge}</Badge>}
                    </h3>
                    <p className="t-label mt-2 text-fog">{project.meta}</p>
                  </div>
                  <span className="t-label pt-1.5 text-fog">{project.index}</span>
                </div>
              </TLink>
            </li>
          ))}
        </ul>
      </div>
      <div className="gutter">
        <div aria-hidden="true" className="gallery__bar">
          <span />
        </div>
      </div>
    </section>
  );
}
