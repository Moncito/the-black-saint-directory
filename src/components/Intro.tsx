"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { gsap, Flip } from "@/lib/gsap";
import { useStore } from "@/lib/store";
import { setSoundEnabled, shimmer, slither } from "@/lib/sound";
import { introHeight, isCapture, serpent } from "@/serpent/state";

/**
 * The intro: once per session, always skippable.
 *
 *   loading  counter 000 → 100 while real assets load; a candle point appears
 *   gate     "Enter with sound" / "Enter" (browsers need a gesture for audio)
 *   playing  the serpent slithers in, folds into the logo, flattens to white;
 *            the real logo file takes over, its wordmark types in, and the
 *            lockup flies into the nav as the page fades up
 *
 * Three ways to play it, chosen from the quality tier:
 *   3d     the live serpent in the shared canvas
 *   video  a pre-rendered clip of the same shots, for weak GPUs
 *   fade   a simple logo fade, for reduced motion or if anything fails
 *
 * The logo is always the file from /brand/logos — fetched and inlined so its
 * outlined glyphs can be revealed one by one. Nothing is retyped or redrawn.
 */

type Phase = "loading" | "gate" | "playing" | "done";
type Mode = "3d" | "video" | "fade";

const LOGO = "/brand/logos/svg/bsd-primary-white.svg";
const VIDEO = "/intro/serpent.mp4";
const SESSION_KEY = "bsd-intro";

/** Seconds from "Enter" to the moment the flat serpent is swapped for the logo file. */
export const SWAP_AT = 3.0;
/** Symbol height as a fraction of the square video frame (see scripts/capture-intro.mjs). */
const VIDEO_SYMBOL = 0.52;

// The symbol's box inside the 778 × 300 primary lockup.
const BOX = { w: 778, h: 300, symbolCx: 40 + 123.3 / 2, symbolCy: 150, symbolH: 220 };

const root = () => document.documentElement;

/** Serpent shots, shared by the live intro and the capture script. */
function serpentShots(tl: gsap.core.Timeline) {
  const w = window.innerWidth;
  const h = window.innerHeight;
  Object.assign(serpent, {
    mode: "intro",
    x: 0,
    y: 0,
    height: introHeight(w, h),
    zoom: 1.14,
    head: 0,
    wiggle: 1,
    flat: 0,
    white: 0,
    fade: 1,
    time: 0,
    rotX: -0.14,
    rotY: 0.42,
    lightX: 0,
    lightY: 0,
    light: 1.25,
  });

  const fold = serpent.approach;
  return (
    tl
      // 0 → 1.3s: a long lazy S out of the dark. 1.3 → 2.45s: up and into the logo.
      .to(serpent, { head: fold, duration: 1.3, ease: "none" }, 0)
      .to(serpent, { head: 1, duration: 1.15, ease: "power2.out" }, 1.3)
      .to(serpent, { time: SWAP_AT, duration: SWAP_AT, ease: "none" }, 0)
      // The undulation damps out as it settles.
      .to(serpent, { wiggle: 0, duration: 1.3, ease: "power2.inOut" }, 1.1)
      .to(serpent, { fog: 0.7, duration: 2.2, ease: "power1.out" }, 0)
      .to(serpent, { core: 0.4, duration: 1.2, ease: "power2.out" }, 0.2)
      // Camera pulls back; 3D flattens onto the 2D logo.
      .to(
        serpent,
        { rotX: 0, rotY: 0, zoom: 1, flat: 1, duration: 0.78, ease: "power3.inOut" },
        2.14,
      )
      // Obsidian → flat white: one soft flash, head to tail.
      .to(serpent, { white: 1, duration: 0.62, ease: "power1.inOut" }, 2.32)
      .to(serpent, { core: 0, duration: 0.5, ease: "power2.out" }, 2.4)
  );
}

export function Intro() {
  const tier = useStore((s) => s.tier);
  const sceneReady = useStore((s) => s.sceneReady);
  const reducedMotion = useStore((s) => s.reducedMotion);
  const setIntroDone = useStore((s) => s.setIntroDone);
  const setSound = useStore((s) => s.setSound);

  const [phase, setPhase] = useState<Phase>("loading");
  const [active, setActive] = useState(false);
  const [fontsOk, setFontsOk] = useState(false);
  const [logoOk, setLogoOk] = useState(false);
  const [video, setVideo] = useState<"pending" | "ok" | "failed">("pending");
  const [timedOut, setTimedOut] = useState(false);

  const overlay = useRef<HTMLDivElement>(null);
  const lockup = useRef<HTMLDivElement>(null);
  const clip = useRef<HTMLVideoElement>(null);
  const counter = useRef<HTMLSpanElement>(null);
  const firstButton = useRef<HTMLButtonElement>(null);
  const timeline = useRef<gsap.core.Timeline | null>(null);
  const finished = useRef(false);

  const engineOk =
    reducedMotion || timedOut || (tier === "static" ? video !== "pending" : tier !== null && sceneReady);
  const mode: Mode =
    reducedMotion || timedOut || tier === null
      ? "fade"
      : tier === "static"
        ? video === "ok"
          ? "video"
          : "fade"
        : sceneReady
          ? "3d"
          : "fade";

  /* ---------- lifecycle ---------- */

  const reveal = useCallback(() => {
    root().classList.add("intro-reveal");
    serpent.mode = "hero";
    serpent.fade = 0;
  }, []);

  const finish = useCallback(() => {
    if (finished.current) return;
    finished.current = true;
    try {
      sessionStorage.setItem(SESSION_KEY, "1");
    } catch {}
    serpent.mode = "hero";
    root().classList.remove("intro-pending", "intro-reveal");
    setIntroDone(true);
    setPhase("done");
    window.dispatchEvent(new Event("bsd:invalidate"));
  }, [setIntroDone]);

  /** Skip button and Esc: always available, from any phase. */
  const skip = useCallback(() => {
    if (finished.current) return;
    timeline.current?.kill();
    if (lockup.current) gsap.killTweensOf(lockup.current);
    clip.current?.pause();
    gsap.killTweensOf(serpent);
    serpent.fade = 0;
    serpent.core = 0;
    reveal();
    gsap.to(overlay.current, { autoAlpha: 0, duration: 0.35, ease: "none", onComplete: finish });
  }, [finish, reveal]);

  // Decide whether there is an intro to play at all.
  useEffect(() => {
    (window as unknown as { __bsdIntro?: boolean }).__bsdIntro = true;
    if (!root().classList.contains("intro-pending")) {
      finished.current = true;
      serpent.mode = "hero";
      setIntroDone(true);
      setPhase("done");
      return;
    }
    setActive(true);
    serpent.mode = "intro";
    serpent.fade = 0;
    serpent.fog = 0;
    serpent.core = 0;
    serpent.lightX = 0;
    serpent.lightY = 0;
    // A single point of warm light, like a candle.
    gsap.to(serpent, { core: 1, duration: 1.2, delay: 0.25, ease: "power2.out" });

    document.fonts.ready.then(() => setFontsOk(true));
    const giveUp = window.setTimeout(() => setTimedOut(true), 9000);
    return () => window.clearTimeout(giveUp);
  }, [setIntroDone]);

  // Inline the logo file so its glyphs can be animated.
  useEffect(() => {
    if (!active) return;
    let cancelled = false;
    fetch(LOGO)
      .then((r) => r.text())
      .then((svg) => {
        if (cancelled || !lockup.current) return;
        lockup.current.innerHTML = svg;
        const el = lockup.current.querySelector("svg");
        el?.setAttribute("width", "100%");
        el?.setAttribute("height", "100%");
        el?.setAttribute("aria-hidden", "true");
        setLogoOk(true);
      })
      .catch(() => setTimedOut(true));
    return () => {
      cancelled = true;
    };
  }, [active]);

  // Esc always works.
  useEffect(() => {
    if (!active || phase === "done") return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && skip();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [active, phase, skip]);

  /* ---------- loading: the counter follows real progress ---------- */

  useEffect(() => {
    if (!active || phase !== "loading") return;
    const start = performance.now();
    let shown = 0;
    let timer = 0;

    // A timer, not rAF: the count must finish even if the tab starts in the background.
    const step = () => {
      const now = performance.now();
      const done = Number(fontsOk) + Number(logoOk) + Number(engineOk);
      const ready = done === 3;
      // Never faster than 0.8s, never ahead of what has actually loaded.
      const ceiling = Math.min(((now - start) / 800) * 100, ready ? 100 : 28 + done * 22);
      shown += (ceiling - shown) * 0.14;
      if (ready && ceiling === 100 && shown > 99.2) shown = 100;
      if (counter.current) counter.current.textContent = String(Math.round(shown)).padStart(3, "0");
      if (shown === 100) {
        setPhase(isCapture() ? "playing" : "gate");
        return;
      }
      timer = window.setTimeout(step, 16);
    };
    timer = window.setTimeout(step, 16);
    return () => window.clearTimeout(timer);
  }, [active, phase, fontsOk, logoOk, engineOk]);

  useEffect(() => {
    if (phase === "gate") firstButton.current?.focus({ preventScroll: true });
  }, [phase]);

  /* ---------- playing ---------- */

  /** The logo file takes over from the flat serpent, settles, types in and flies to the nav. */
  const lockupSequence = useCallback(
    (tl: gsap.core.Timeline, at: number) => {
      const el = lockup.current;
      if (!el) return tl;
      const groups = el.querySelectorAll<SVGGElement>("svg > g");
      const blackSaint = groups[0]?.querySelectorAll("path") ?? [];
      const directory = Array.from(groups[1]?.querySelectorAll("path") ?? []);

      // Place the lockup so its symbol sits exactly where the serpent formed.
      const rect = el.getBoundingClientRect();
      const k = rect.width / BOX.w;
      const ox = BOX.symbolCx * k;
      const oy = BOX.symbolCy * k;
      const scale = introHeight(window.innerWidth, window.innerHeight) / (BOX.symbolH * k);
      gsap.set(el, {
        transformOrigin: `${ox}px ${oy}px`,
        x: window.innerWidth / 2 - (rect.left + ox),
        y: window.innerHeight / 2 - (rect.top + oy),
        scale,
      });
      gsap.set(blackSaint, { opacity: 0 });

      // "DIRECTORY" tracks out from tight to the full width of "BLACK SAINT".
      const glyphs = directory.map((path) => {
        const m = /translate\(([-\d.]+)[ ,]+([-\d.]+)\)\s*(.*)/.exec(path.getAttribute("transform") ?? "");
        return { path, x: m ? +m[1] : 0, y: m ? +m[2] : 0, rest: m ? m[3] : "" };
      });
      const x0 = glyphs[0]?.x ?? 0;
      const track = { t: 0 };
      const applyTrack = () =>
        glyphs.forEach((g) => {
          const x = x0 + (g.x - x0) * (0.52 + 0.48 * track.t);
          g.path.setAttribute("transform", `translate(${x.toFixed(2)} ${g.y}) ${g.rest}`);
          g.path.style.opacity = String(Math.min(track.t * 2.2, 1));
        });
      applyTrack();

      return tl
        .set(el, { autoAlpha: 1 }, at)
        .add(() => {
          serpent.fade = 0;
        }, at + 0.02)
        .to(el, { x: 0, y: 0, scale: 1, duration: 0.95, ease: "expo.inOut" }, at)
        .to(blackSaint, { opacity: 1, duration: 0.01, stagger: 0.05 }, at + 0.5)
        .to(track, { t: 1, duration: 0.9, ease: "expo.out", onUpdate: applyTrack }, at + 0.7)
        // The page fades up once the lockup is well on its way to the nav.
        .add(reveal, at + 1.9)
        .add(() => {
          const target = document.querySelector("[data-nav-logo] img");
          if (!target) return finish();
          gsap.set(el, { transformOrigin: "50% 50%" });
          (Flip.fit(el, target, {
            duration: 1.05,
            ease: "expo.inOut",
            scale: true,
            onComplete: finish,
          }) as gsap.core.Tween | null) ?? finish();
        }, at + 1.4);
    },
    [finish, reveal],
  );

  const play = useCallback(() => {
    const el = lockup.current;
    const tl = gsap.timeline();
    timeline.current = tl;
    if (process.env.NODE_ENV !== "production")
      (window as unknown as { __bsdTl?: gsap.core.Timeline }).__bsdTl = tl;

    if (mode === "3d") {
      slither(2.5);
      serpentShots(tl).add(shimmer, 2.32);
      lockupSequence(tl, SWAP_AT);
      return;
    }

    if (mode === "video" && clip.current) {
      const v = clip.current;
      const side = introHeight(window.innerWidth, window.innerHeight) / VIDEO_SYMBOL;
      gsap.set(v, { width: side, height: side, autoAlpha: 1 });
      slither(2.5);
      tl.add(() => void v.play().catch(skip), 0)
        .add(shimmer, 2.32)
        .set(v, { autoAlpha: 0 }, SWAP_AT + 0.05);
      lockupSequence(tl, SWAP_AT);
      return;
    }

    // Reduced motion, or a fallback if something failed: a simple logo fade.
    tl.fromTo(el, { autoAlpha: 0 }, { autoAlpha: 1, duration: 0.6, ease: "none" })
      .add(reveal, 1.3)
      .to(overlay.current, { autoAlpha: 0, duration: 0.5, ease: "none", onComplete: finish }, 1.3);
  }, [lockupSequence, mode, finish, reveal, skip]);

  useEffect(() => {
    if (phase !== "playing") return;
    if (isCapture()) {
      // Frame-stepped by scripts/capture-intro.mjs, which stops before the swap.
      const tl = lockupSequence(serpentShots(gsap.timeline({ paused: true })), SWAP_AT);
      (window as unknown as { __bsd?: object }).__bsd = {
        duration: SWAP_AT,
        seek: (t: number) => tl.time(t),
      };
      return;
    }
    play();
    // `play` is intentionally read once, when the phase flips.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [phase]);

  const enter = async (withSound: boolean) => {
    if (phase !== "gate") return;
    if (withSound) {
      setSound(true);
      await setSoundEnabled(true);
    }
    setPhase("playing");
  };

  if (phase === "done") return null;

  return (
    <div
      id="intro"
      ref={overlay}
      role="dialog"
      aria-modal="true"
      aria-label="Intro"
      data-phase={phase}
      data-capture={active && isCapture() ? "" : undefined}
    >
      {tier === "static" && !reducedMotion && (
        <video
          ref={clip}
          className="intro__video"
          src={VIDEO}
          muted
          playsInline
          preload="auto"
          aria-hidden="true"
          onCanPlayThrough={() => setVideo("ok")}
          onError={() => setVideo("failed")}
        />
      )}

      <div ref={lockup} className="intro__lockup" />

      <p className="intro__counter t-label" aria-hidden="true">
        <span ref={counter}>000</span>
      </p>
      <p className="sr-only" role="status">
        {phase === "loading" ? "Loading" : ""}
      </p>

      <div className="intro__gate">
        <button
          ref={firstButton}
          type="button"
          className="intro__button t-label"
          onClick={() => enter(true)}
          disabled={phase !== "gate"}
        >
          Enter with sound
        </button>
        <button
          type="button"
          className="intro__button intro__button--quiet t-label"
          onClick={() => enter(false)}
          disabled={phase !== "gate"}
        >
          Enter
        </button>
      </div>

      <button type="button" className="intro__skip t-label" onClick={skip}>
        Skip <span aria-hidden="true">[Esc]</span>
      </button>
    </div>
  );
}
