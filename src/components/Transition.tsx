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

type Navigate = (href: string) => void;

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

  const reset = useCallback(() => {
    busy.current = false;
    pending.current = null;
    window.clearTimeout(failsafe.current);
    setTransitioning(false);
    if (cover.current) gsap.set(cover.current, { autoAlpha: 0, yPercent: 0 });
  }, [setTransitioning]);

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
    (href) => {
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
    [enter, reducedMotion, router, setTransitioning],
  );

  // The new route has rendered: lift the cover.
  useEffect(() => {
    if (busy.current && pending.current === pathname) {
      window.clearTimeout(failsafe.current);
      pending.current = null;
      const id = requestAnimationFrame(() => requestAnimationFrame(enter));
      return () => cancelAnimationFrame(id);
    }
  }, [pathname, enter]);

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

type TLinkProps = ComponentProps<typeof Link> & { href: string };

/** Internal link that routes through the serpent transition. */
export function TLink({ href, onClick, children, ...rest }: TLinkProps) {
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
    navigate(href);
  };

  return (
    <Link href={href} onClick={handle} {...rest}>
      {children}
    </Link>
  );
}
