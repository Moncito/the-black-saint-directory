"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  type ComponentProps,
  type MouseEvent,
  type ReactNode,
} from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { gsap, ScrollTrigger, EASE } from "@/lib/gsap";
import { useStore } from "@/lib/store";
import { useLenis } from "./SmoothScroll";

/**
 * The serpent page transition.
 *
 * Leave: one line sweeps across the viewport in a lazy S-curve, then thickens
 * until it fills the screen. Enter: the cover slides away, its trailing edge
 * still drawn as the line. One system, used for every route change.
 */

/** `shared` is an image that should grow into the next page (work → case study). */
type Navigate = (href: string, shared?: HTMLImageElement | null) => void;

const TransitionContext = createContext<Navigate>(() => {});

export const useNavigate = () => useContext(TransitionContext);

const serpentPath = (w: number, h: number) => {
  const y = (v: number) => (v * h).toFixed(1);
  const x = (v: number) => (v * w).toFixed(1);
  return `M ${x(-0.08)} ${y(0.64)} C ${x(0.14)} ${y(0.28)}, ${x(0.3)} ${y(0.86)}, ${x(0.5)} ${y(0.5)} S ${x(0.86)} ${y(0.16)}, ${x(1.08)} ${y(0.4)}`;
};

export function TransitionProvider({ children }: { children: ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const lenis = useLenis();
  const reducedMotion = useStore((s) => s.reducedMotion);
  const setTransitioning = useStore((s) => s.setTransitioning);

  const cover = useRef<HTMLDivElement>(null);
  const svg = useRef<SVGSVGElement>(null);
  const line = useRef<SVGPathElement>(null);
  const edge = useRef<HTMLDivElement>(null);
  const busy = useRef(false);
  const pending = useRef<string | null>(null);
  const failsafe = useRef<number | undefined>(undefined);
  const clone = useRef<HTMLImageElement | null>(null);

  const reset = useCallback(() => {
    busy.current = false;
    pending.current = null;
    window.clearTimeout(failsafe.current);
    setTransitioning(false);
    if (cover.current) gsap.set(cover.current, { autoAlpha: 0, yPercent: 0 });
    clone.current?.remove();
    clone.current = null;
    gsap.set("main, [data-footer]", { clearProps: "opacity,visibility" });
  }, [setTransitioning]);

  /** Shared element: the thumbnail travels to the case study's hero and becomes it. */
  const enterShared = useCallback(() => {
    const img = clone.current;
    const target = document.querySelector<HTMLElement>("[data-shared-target]");
    window.scrollTo(0, 0);
    lenis?.scrollTo(0, { immediate: true, force: true });
    ScrollTrigger.refresh();
    window.dispatchEvent(new CustomEvent("bsd:page-enter"));
    if (!img || !target) return reset();

    const to = target.getBoundingClientRect();
    gsap.set(target, { visibility: "hidden" });
    gsap
      .timeline({
        onComplete: () => {
          gsap.set(target, { clearProps: "visibility" });
          reset();
        },
      })
      .to(img, {
        left: to.left,
        top: to.top,
        width: to.width,
        height: to.height,
        duration: 1.05,
        ease: EASE.inOut,
      })
      .to("main, [data-footer]", { autoAlpha: 1, duration: 0.9, ease: "power2.out" }, 0.45);
  }, [lenis, reset]);

  const enter = useCallback(() => {
    const el = cover.current;
    if (!el) return reset();

    window.scrollTo(0, 0);
    lenis?.scrollTo(0, { immediate: true, force: true });
    ScrollTrigger.refresh();
    window.dispatchEvent(new CustomEvent("bsd:page-enter"));

    if (reducedMotion) {
      gsap.to(el, { autoAlpha: 0, duration: 0.25, ease: "none", onComplete: reset });
      return;
    }
    gsap
      .timeline({ onComplete: reset })
      .set(edge.current, { autoAlpha: 1 })
      .to(el, { yPercent: -100, duration: 0.9, ease: "power3.inOut" }, 0);
  }, [lenis, reducedMotion, reset]);

  const navigate = useCallback<Navigate>(
    (href, shared) => {
      if (busy.current) return;
      const target = new URL(href, window.location.href);
      if (target.pathname === window.location.pathname && !target.hash) return;

      const el = cover.current;
      const path = line.current;
      const root = svg.current;
      if (!el || !path || !root) return router.push(href);

      busy.current = true;
      pending.current = target.pathname;
      setTransitioning(true);

      const from = shared?.getBoundingClientRect();
      if (shared && from && from.width > 40 && !reducedMotion) {
        const img = shared.cloneNode() as HTMLImageElement;
        img.removeAttribute("class");
        img.removeAttribute("sizes");
        img.removeAttribute("srcset");
        img.src = shared.currentSrc || shared.src;
        img.alt = "";
        Object.assign(img.style, {
          position: "fixed",
          left: from.left + "px",
          top: from.top + "px",
          width: from.width + "px",
          height: from.height + "px",
          objectFit: "cover",
          zIndex: "75",
          pointerEvents: "none",
          maxWidth: "none",
        });
        document.body.appendChild(img);
        clone.current = img;
        gsap.to("main, [data-footer]", {
          autoAlpha: 0,
          duration: 0.5,
          ease: "power2.out",
          onComplete: () => {
            router.push(href);
            failsafe.current = window.setTimeout(reset, 4000);
          },
        });
        return;
      }

      const go = () => {
        router.push(href);
        // Never trap the visitor behind the cover.
        failsafe.current = window.setTimeout(enter, 4000);
      };

      if (reducedMotion) {
        gsap.set(el, { yPercent: 0, backgroundColor: "#0a0a0a" });
        gsap.set(root, { autoAlpha: 0 });
        gsap.to(el, { autoAlpha: 1, duration: 0.25, ease: "none", onComplete: go });
        return;
      }

      const w = window.innerWidth;
      const h = window.innerHeight;
      root.setAttribute("viewBox", `0 0 ${w} ${h}`);
      path.setAttribute("d", serpentPath(w, h));
      const length = path.getTotalLength();

      gsap.set(el, { autoAlpha: 1, yPercent: 0, backgroundColor: "rgba(10,10,10,0)" });
      gsap.set(edge.current, { autoAlpha: 0 });
      gsap.set(root, { autoAlpha: 1 });
      gsap.set(path, {
        strokeDasharray: length,
        strokeDashoffset: length,
        strokeWidth: 2,
        stroke: "#ffffff",
      });

      gsap
        .timeline({ onComplete: go })
        .to(path, { strokeDashoffset: 0, duration: 0.65, ease: "power3.inOut" })
        .to(
          path,
          { strokeWidth: Math.hypot(w, h) * 1.25, stroke: "#0a0a0a", duration: 0.7, ease: EASE.in },
          0.45,
        )
        .set(el, { backgroundColor: "#0a0a0a" })
        .set(root, { autoAlpha: 0 });
    },
    [enter, reducedMotion, reset, router, setTransitioning],
  );

  // The new route has rendered: lift the cover.
  useEffect(() => {
    if (busy.current && pending.current === pathname) {
      window.clearTimeout(failsafe.current);
      pending.current = null;
      const next = clone.current ? enterShared : enter;
      const id = requestAnimationFrame(() => requestAnimationFrame(next));
      return () => cancelAnimationFrame(id);
    }
  }, [pathname, enter, enterShared]);

  // Back/forward: no cover, but still reset scroll-linked work.
  useEffect(() => {
    if (!busy.current) {
      ScrollTrigger.refresh();
      window.dispatchEvent(new CustomEvent("bsd:page-enter"));
    }
  }, [pathname]);

  return (
    <TransitionContext.Provider value={navigate}>
      {children}
      <div
        ref={cover}
        aria-hidden="true"
        className="pointer-events-auto invisible fixed inset-0 z-[80] opacity-0"
      >
        <svg ref={svg} className="absolute inset-0 h-full w-full" fill="none">
          <path ref={line} strokeLinecap="round" strokeLinejoin="round" />
        </svg>
        <div ref={edge} className="invisible absolute inset-x-0 bottom-0 h-px bg-white opacity-0" />
      </div>
    </TransitionContext.Provider>
  );
}

type TLinkProps = ComponentProps<typeof Link> & {
  href: string;
  /** Grow this link's image into the next page instead of using the serpent cover. */
  shared?: boolean;
};

/** Internal link that routes through the serpent transition. */
export function TLink({ href, onClick, shared, children, ...rest }: TLinkProps) {
  const navigate = useNavigate();

  const handle = (event: MouseEvent<HTMLAnchorElement>) => {
    onClick?.(event);
    if (
      event.defaultPrevented ||
      event.button !== 0 ||
      event.metaKey ||
      event.ctrlKey ||
      event.shiftKey ||
      event.altKey
    )
      return;
    event.preventDefault();
    navigate(href, shared ? event.currentTarget.querySelector("img") : null);
  };

  return (
    <Link href={href} onClick={handle} {...rest}>
      {children}
    </Link>
  );
}
