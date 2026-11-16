"use client";

import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import Lenis from "lenis";
import { gsap, ScrollTrigger } from "@/lib/gsap";
import { useStore } from "@/lib/store";

const LenisContext = createContext<Lenis | null>(null);

export const useLenis = () => useContext(LenisContext);

/**
 * Lenis drives the scroll, GSAP's ticker drives Lenis, ScrollTrigger reads
 * from both — one clock for everything. With reduced motion, native scroll.
 */
export function SmoothScroll({ children }: { children: ReactNode }) {
  const [lenis, setLenis] = useState<Lenis | null>(null);
  const reducedMotion = useStore((s) => s.reducedMotion);
  const locked = useStore((s) => s.transitioning || s.menuOpen || !s.introDone);

  useEffect(() => {
    if (reducedMotion) return;

    const instance = new Lenis({
      duration: 1.15,
      easing: (t) => 1 - Math.pow(1 - t, 4),
      smoothWheel: true,
      syncTouch: false,
    });
    instance.on("scroll", ScrollTrigger.update);

    const raf = (time: number) => instance.raf(time * 1000);
    gsap.ticker.add(raf);
    gsap.ticker.lagSmoothing(0);
    setLenis(instance);

    return () => {
      gsap.ticker.remove(raf);
      instance.destroy();
      // Never leave a scroll lock behind (e.g. when reduced motion switches Lenis off).
      document.documentElement.classList.remove("lenis", "lenis-stopped", "lenis-smooth");
      setLenis(null);
    };
  }, [reducedMotion]);

  useEffect(() => {
    if (!lenis) {
      document.documentElement.classList.remove("lenis", "lenis-stopped", "lenis-smooth");
      return;
    }
    if (locked) lenis.stop();
    else lenis.start();
  }, [lenis, locked]);

  return <LenisContext.Provider value={lenis}>{children}</LenisContext.Provider>;
}
