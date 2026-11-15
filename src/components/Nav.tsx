"use client";

import { useEffect, useRef } from "react";
import { usePathname } from "next/navigation";
import { nav, startHref, cta, site } from "@/content/site";
import { gsap, EASE } from "@/lib/gsap";
import { useStore } from "@/lib/store";
import { tick } from "@/lib/sound";
import { TLink } from "./Transition";
import { Scramble } from "./Scramble";
import { Magnetic } from "./Magnetic";
import { ManilaClock } from "./ManilaClock";
import { SoundToggle } from "./SoundToggle";

const isActive = (pathname: string, href: string) =>
  pathname === href || pathname.startsWith(`${href}/`);

export function Nav() {
  const pathname = usePathname();
  const menuOpen = useStore((s) => s.menuOpen);
  const setMenuOpen = useStore((s) => s.setMenuOpen);
  const reducedMotion = useStore((s) => s.reducedMotion);
  const panel = useRef<HTMLDivElement>(null);
  const toggle = useRef<HTMLButtonElement>(null);

  // Close on route change and on Esc.
  useEffect(() => setMenuOpen(false), [pathname, setMenuOpen]);
  useEffect(() => {
    if (!menuOpen) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setMenuOpen(false);
        toggle.current?.focus();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [menuOpen, setMenuOpen]);

  useEffect(() => {
    const el = panel.current;
    if (!el) return;
    const items = el.querySelectorAll("[data-menu-item]");
    if (menuOpen) {
      el.inert = false;
      if (reducedMotion) {
        gsap.set(el, { autoAlpha: 1, clipPath: "none" });
        gsap.set(items, { yPercent: 0 });
      } else {
        gsap.set(el, { autoAlpha: 1 });
        gsap.fromTo(
          el,
          { clipPath: "inset(0 0 100% 0)" },
          { clipPath: "inset(0 0 0% 0)", duration: 1.0, ease: EASE.inOut },
        );
        gsap.fromTo(
          items,
          { yPercent: 110 },
          { yPercent: 0, duration: 1.1, stagger: 0.07, delay: 0.35, ease: EASE.out },
        );
      }
      el.querySelector<HTMLElement>("a")?.focus({ preventScroll: true });
    } else {
      el.inert = true;
      if (reducedMotion) gsap.set(el, { autoAlpha: 0 });
      else
        gsap.to(el, {
          clipPath: "inset(0 0 100% 0)",
          duration: 0.8,
          ease: EASE.inOut,
          onComplete: () => void gsap.set(el, { autoAlpha: 0 }),
        });
    }
  }, [menuOpen, reducedMotion]);

  return (
    <>
      <header className="gutter pointer-events-none fixed inset-x-0 top-0 z-50 flex h-[var(--spacing-nav)] items-center justify-between text-white mix-blend-difference">
        <TLink
          href="/"
          aria-label={`${site.name} — home`}
          className="pointer-events-auto -ml-3 block shrink-0"
          data-nav-logo
        >
          {/* The logo is always the file, never live text. */}
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="/brand/logos/svg/bsd-primary-white.svg"
            alt=""
            width={778}
            height={300}
            className="h-14 w-auto md:h-16"
            fetchPriority="high"
          />
        </TLink>

        <nav aria-label="Primary" className="pointer-events-auto hidden items-center gap-9 lg:flex">
          {nav.map((item) => (
            <TLink
              key={item.href}
              href={item.href}
              aria-current={isActive(pathname, item.href) ? "page" : undefined}
              onPointerEnter={() => tick("hover")}
              className="t-label group relative inline-flex h-11 items-center"
            >
              <Scramble text={item.label} />
              <span
                aria-hidden="true"
                className="absolute inset-x-0 bottom-2 h-px origin-left scale-x-0 bg-current transition-transform duration-[900ms] ease-[var(--ease-expo)] group-hover:scale-x-100 group-aria-[current=page]:scale-x-100"
              />
            </TLink>
          ))}
        </nav>

        <div className="pointer-events-auto flex items-center gap-6">
          <ManilaClock className="hidden xl:inline" />
          <SoundToggle className="hidden md:inline-flex" />
          <Magnetic className="hidden sm:inline-block">
            <TLink
              href={startHref}
              onPointerEnter={() => tick("hover")}
              className="t-label inline-flex h-11 items-center rounded-full border border-white px-5 transition-colors duration-700 ease-[var(--ease-expo)] hover:bg-white hover:text-black"
            >
              {cta.action}
            </TLink>
          </Magnetic>
          <button
            ref={toggle}
            type="button"
            aria-expanded={menuOpen}
            aria-controls="menu"
            onClick={() => setMenuOpen(!menuOpen)}
            className="t-label -mr-2 inline-flex h-11 items-center px-2 lg:hidden"
          >
            {menuOpen ? "Close" : "Menu"}
          </button>
        </div>
      </header>

      <div
        id="menu"
        ref={panel}
        role="dialog"
        aria-modal="true"
        aria-label="Menu"
        data-lenis-prevent
        className="gutter invisible fixed inset-0 z-40 flex flex-col justify-between overflow-y-auto bg-ink pb-8 pt-[calc(var(--spacing-nav)+32px)] opacity-0 lg:hidden"
      >
        <nav aria-label="Menu">
          <ul>
            {[...nav, { label: cta.action, href: startHref }].map((item, i) => (
              <li key={item.href} className="overflow-hidden border-b border-graphite">
                <TLink
                  href={item.href}
                  data-menu-item
                  aria-current={isActive(pathname, item.href) ? "page" : undefined}
                  className="t-h1 flex items-baseline justify-between py-4"
                >
                  <span>{item.label}</span>
                  <span className="t-label text-fog">{String(i + 1).padStart(2, "0")}</span>
                </TLink>
              </li>
            ))}
          </ul>
        </nav>
        <div className="mt-10 flex items-center justify-between text-fog">
          <ManilaClock />
          <SoundToggle />
        </div>
      </div>
    </>
  );
}
