"use client";

import { useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";
import Image from "next/image";
import { projects } from "@/content/projects";
import { gsap, Flip } from "@/lib/gsap";
import { useStore } from "@/lib/store";
import { tick } from "@/lib/sound";
import { TLink } from "@/components/Transition";
import { Badge } from "@/components/ui";

type View = "list" | "grid";

/** Filters come straight from each project's own type line — nothing invented. */
const typeOf = (meta: string) => meta.split(" · ")[0];
const types = Array.from(new Set(projects.map((p) => typeOf(p.meta))));

const useIsomorphicLayoutEffect = typeof window === "undefined" ? useEffect : useLayoutEffect;

/**
 * Work index. Two views of the same items:
 *
 *   list  big names; on hover a preview floats after the cursor, with lag
 *   grid  the plates
 *
 * Switching view or filter animates with GSAP Flip — every item travels from
 * where it was to where it now belongs.
 */
export function WorkIndex() {
  const reducedMotion = useStore((s) => s.reducedMotion);
  const [view, setView] = useState<View>("list");
  const [filter, setFilter] = useState<string | null>(null);
  const [hovered, setHovered] = useState<string | null>(null);

  const list = useRef<HTMLUListElement>(null);
  const preview = useRef<HTMLDivElement>(null);
  const flip = useRef<Flip.FlipState | null>(null);

  const visible = useMemo(
    () => new Set(projects.filter((p) => !filter || typeOf(p.meta) === filter).map((p) => p.slug)),
    [filter],
  );

  /** Record where everything is, then let React move it. */
  const change = (apply: () => void) => {
    if (list.current && !reducedMotion)
      flip.current = Flip.getState(list.current.querySelectorAll("[data-flip-id]"));
    tick("click");
    apply();
  };

  useIsomorphicLayoutEffect(() => {
    const state = flip.current;
    flip.current = null;
    if (!state) return;
    const tween = Flip.from(state, {
      duration: 1.05,
      ease: "expo.inOut",
      absolute: true,
      nested: true,
      stagger: 0.025,
      onEnter: (els) =>
        gsap.fromTo(els, { autoAlpha: 0, y: 24 }, { autoAlpha: 1, y: 0, duration: 0.9, delay: 0.25 }),
      onLeave: (els) => gsap.to(els, { autoAlpha: 0, duration: 0.3 }),
    });
    return () => {
      tween.kill();
    };
  }, [view, filter]);

  // The floating preview trails the cursor.
  useEffect(() => {
    const el = preview.current;
    if (!el || view !== "list" || reducedMotion) return;
    if (!matchMedia("(hover: hover) and (pointer: fine)").matches) return;
    const x = gsap.quickTo(el, "x", { duration: 0.9, ease: "power4.out" });
    const y = gsap.quickTo(el, "y", { duration: 0.9, ease: "power4.out" });
    const move = (e: PointerEvent) => {
      x(e.clientX);
      y(e.clientY);
    };
    window.addEventListener("pointermove", move, { passive: true });
    return () => window.removeEventListener("pointermove", move);
  }, [view, reducedMotion]);

  return (
    <section className="gutter pb-[16vh]">
      <div className="work-tools">
        <div role="group" aria-label="Filter by type" className="work-tools__group">
          <button
            type="button"
            aria-pressed={filter === null}
            onClick={() => change(() => setFilter(null))}
            className="work-chip t-label"
          >
            All <span className="text-fog">{String(projects.length).padStart(2, "0")}</span>
          </button>
          {types.map((type) => (
            <button
              key={type}
              type="button"
              aria-pressed={filter === type}
              onClick={() => change(() => setFilter(filter === type ? null : type))}
              className="work-chip t-label"
            >
              {type}
            </button>
          ))}
        </div>
        <div role="group" aria-label="View" className="work-tools__group">
          {(["list", "grid"] as const).map((v) => (
            <button
              key={v}
              type="button"
              aria-pressed={view === v}
              onClick={() => view !== v && change(() => setView(v))}
              className="work-chip t-label"
            >
              {v}
            </button>
          ))}
        </div>
      </div>

      <ul ref={list} className="work-index" data-view={view}>
        {projects.map((project, i) => {
          const shown = visible.has(project.slug);
          return (
            <li
              key={project.slug}
              data-flip-id={project.slug}
              hidden={!shown}
              className="work-item"
            >
              <TLink
                href={`/work/${project.slug}`}
                shared={view === "grid"}
                data-cursor="View"
                className="work-item__link group"
                onPointerEnter={() => setHovered(project.slug)}
                onPointerLeave={() => setHovered((h) => (h === project.slug ? null : h))}
                onFocus={() => setHovered(project.slug)}
                onBlur={() => setHovered(null)}
              >
                <div className="work-item__plate">
                  <Image
                    src={project.plate}
                    alt={`${project.name} — ${project.meta}`}
                    width={2400}
                    height={1500}
                    sizes="(min-width: 768px) 50vw, 100vw"
                    priority={i < 2}
                    className="work-image h-auto w-full group-hover:scale-[1.03]"
                  />
                </div>
                <span className="work-item__index t-label">{project.index}</span>
                <span className="work-item__name">
                  {project.name}
                  {project.badge && <Badge>{project.badge}</Badge>}
                </span>
                <span className="work-item__meta t-label">{project.meta}</span>
              </TLink>
            </li>
          );
        })}
      </ul>

      {/* List view only: the hovered project's plate, following the cursor. */}
      <div ref={preview} aria-hidden="true" className="work-preview" data-on={view === "list" && !!hovered}>
        {projects.map((project) => (
          <Image
            key={project.slug}
            src={project.plate}
            alt=""
            width={2400}
            height={1500}
            sizes="420px"
            loading="lazy"
            className="work-preview__image"
            data-on={hovered === project.slug}
          />
        ))}
      </div>
    </section>
  );
}
