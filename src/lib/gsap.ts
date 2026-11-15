import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { SplitText } from "gsap/SplitText";
import { Flip } from "gsap/Flip";

if (typeof window !== "undefined") {
  gsap.registerPlugin(ScrollTrigger, SplitText, Flip);
  // Brand motion: slow and heavy, never bouncy.
  gsap.defaults({ ease: "expo.out", duration: 1.1 });
}

export const EASE = {
  out: "expo.out",
  outSoft: "power4.out",
  inOut: "expo.inOut",
  in: "power4.in",
} as const;

export { gsap, ScrollTrigger, SplitText, Flip };
