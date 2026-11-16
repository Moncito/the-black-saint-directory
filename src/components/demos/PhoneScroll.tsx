"use client";

import { useRef } from "react";
import { projects } from "@/content/projects";
import { gsap } from "@/lib/gsap";
import { useScrollScene } from "@/lib/useScrollScene";

const apps = projects.filter((p) => p.kind === "mobile");

/**
 * Mobile demo: a phone that turns as you scroll, its screen changing between
 * the studio's own apps. Built in CSS 3D — crisp on every device, no WebGL.
 */
export function PhoneScroll() {
  const root = useRef<HTMLDivElement>(null);

  useScrollScene(root, (el) => {
    const phone = el.querySelector<HTMLElement>(".phone")!;
    const screens = gsap.utils.toArray<HTMLElement>(".phone__screen", el);
    const names = gsap.utils.toArray<HTMLElement>(".phone-demo__name", el);
    const state = { p: 0 };
    let active = -1;

    const render = () => {
      // A slow half-turn across the whole scroll, leaning as it goes.
      gsap.set(phone, {
        rotateY: gsap.utils.interpolate(-34, 34, state.p),
        rotateX: Math.sin(state.p * Math.PI) * 7,
        rotateZ: gsap.utils.interpolate(-3, 3, state.p),
      });
      const next = Math.min(apps.length - 1, Math.floor(state.p * apps.length));
      if (next === active) return;
      active = next;
      screens.forEach((s, i) =>
        gsap.to(s, { autoAlpha: i === next ? 1 : 0, duration: 0.7, ease: "power2.out", overwrite: true }),
      );
      names.forEach((n, i) =>
        gsap.to(n, {
          autoAlpha: i === next ? 1 : 0,
          y: i === next ? 0 : 12,
          duration: 0.8,
          ease: "power4.out",
          overwrite: true,
        }),
      );
    };

    gsap.set(screens, { autoAlpha: 0 });
    gsap.set(names, { autoAlpha: 0, y: 12 });
    render();

    gsap.to(state, {
      p: 1,
      ease: "none",
      onUpdate: render,
      scrollTrigger: {
        trigger: el,
        start: "top top",
        end: () => `+=${window.innerHeight * 2}`,
        pin: true,
        scrub: 0.8,
        invalidateOnRefresh: true,
      },
    });
  });

  return (
    <div ref={root} className="demo phone-demo">
      <div className="phone-demo__stage">
        <div className="phone">
          {apps.map((app) => (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              key={app.slug}
              src={app.screen}
              alt={`${app.name} — app screen`}
              loading="lazy"
              decoding="async"
              className="phone__screen"
            />
          ))}
        </div>
      </div>
      <ul className="phone-demo__names">
        {apps.map((app) => (
          <li key={app.slug} className="phone-demo__name">
            <span className="t-label text-fog">{app.index}</span>
            <span className="t-h2">{app.name}</span>
            <span className="t-label text-fog">{app.meta}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}
