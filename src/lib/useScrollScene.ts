"use client";

import { useEffect, useLayoutEffect, type DependencyList, type RefObject } from "react";
import { gsap, ScrollTrigger } from "./gsap";
import { useStore } from "./store";

// Layout effects do not run on the server; fall back to keep React quiet there.
const useIsomorphicLayoutEffect = typeof window === "undefined" ? useEffect : useLayoutEffect;

let pending = 0;

/** Pinned sections change the page height; re-measure everything once, in order. */
export function refreshSoon() {
  window.clearTimeout(pending);
  pending = window.setTimeout(() => {
    ScrollTrigger.sort();
    ScrollTrigger.refresh();
  }, 120);
}

/**
 * Build a scroll-driven scene inside `scope`.
 *
 * Waits for the intro to finish and fonts to settle, scopes every tween and
 * trigger to a GSAP context, and tears it all down on unmount. With reduced
 * motion nothing is built: each section's markup is complete and readable on
 * its own, and CSS shows it in its finished state.
 *
 * This must be a layout effect. Pinning wraps a section in a spacer element,
 * so the DOM no longer matches what React rendered. A layout effect's cleanup
 * runs before React removes the old page's nodes, which gives GSAP the chance
 * to unwrap them first. With a plain effect the cleanup comes too late and
 * route changes crash with "removeChild: not a child of this node".
 */
export function useScrollScene(
  scope: RefObject<HTMLElement | null>,
  /** May return a cleanup; GSAP runs it when the context is reverted. */
  build: (root: HTMLElement) => void | (() => void),
  deps: DependencyList = [],
) {
  const introDone = useStore((s) => s.introDone);
  const reducedMotion = useStore((s) => s.reducedMotion);

  useIsomorphicLayoutEffect(() => {
    const root = scope.current;
    if (!root || !introDone || reducedMotion) return;

    let ctx: gsap.Context | undefined;
    let cancelled = false;
    document.fonts.ready.then(() => {
      if (cancelled) return;
      ctx = gsap.context(() => build(root), root);
      root.dataset.scene = "live";
      refreshSoon();
    });

    return () => {
      cancelled = true;
      ctx?.revert();
      delete root.dataset.scene;
      refreshSoon();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [introDone, reducedMotion, ...deps]);
}
