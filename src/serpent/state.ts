/**
 * Shared, mutable serpent state. GSAP timelines and pointer handlers write to
 * it; the render loop reads it every frame. Deliberately not React state —
 * nothing here should ever trigger a re-render.
 */

export type SerpentMode = "idle" | "intro" | "hero";

export const serpent = {
  mode: "idle" as SerpentMode,
  /** Head progress along the combined path, 0 (far off-screen) → 1 (on the logo). */
  head: 1,
  /** Fraction of the path that is the off-screen approach (set once the path loads). */
  approach: 0.76,
  /** Undulation amplitude, 1 → 0 as the body settles. */
  wiggle: 0,
  /** 0 = perspective 3D, 1 = orthographic and squashed onto the 2D logo. */
  flat: 0,
  /** White wave running head → tail, 0 → 1. */
  white: 0,
  /** Overall visibility. */
  fade: 0,
  /** Shader clock for the undulation (seconds). */
  time: 0,
  /** Symbol centre in px from the viewport centre (y up) and its height in px. */
  x: 0,
  y: 0,
  height: 0,
  /** Extra scale on top of `height` — the camera pull-back. */
  zoom: 1,
  rotX: 0,
  rotY: 0,
  /** Candle: brightness of the visible flame point and of the light itself. */
  core: 0,
  light: 1,
  /** Light position in px from the viewport centre (y up). */
  lightX: 0,
  lightY: 0,
  /** Fog multiplier (pure black at the very start of the intro). */
  fog: 1,
};

/** Pointer in px from the viewport centre (y up). */
export const pointer = { x: 0, y: 0, active: false, fine: false };

/** Drag-to-orbit on the hero. Angles in radians, velocities in rad/s. */
export const orbit = { dragging: false, yaw: 0, pitch: 0, vYaw: 0, vPitch: 0 };

let listening = false;

export function listenPointer() {
  if (listening || typeof window === "undefined") return;
  listening = true;
  pointer.fine = matchMedia("(hover: hover) and (pointer: fine)").matches;

  window.addEventListener(
    "pointermove",
    (e) => {
      if (e.pointerType === "touch") return;
      pointer.active = true;
      pointer.x = e.clientX - window.innerWidth / 2;
      pointer.y = -(e.clientY - window.innerHeight / 2);
    },
    { passive: true },
  );

  // Android exposes tilt without a prompt; iOS needs one, so it gets the drift.
  window.addEventListener(
    "deviceorientation",
    (e) => {
      if (pointer.fine || e.gamma == null || e.beta == null) return;
      pointer.active = true;
      const gx = Math.max(-30, Math.min(30, e.gamma)) / 30;
      const gy = Math.max(-30, Math.min(30, e.beta - 45)) / 30;
      pointer.x = gx * window.innerWidth * 0.45;
      pointer.y = -gy * window.innerHeight * 0.35;
    },
    { passive: true },
  );
}

/** Symbol aspect ratio in the master logo (viewBox 102 × 182). */
export const SYMBOL = { width: 102, height: 182, cx: 54, cy: 103 } as const;

/** Where the serpent forms in the intro: large, dead centre. */
export function introHeight(w: number, h: number) {
  return Math.min(h * 0.52, w * 0.9 * (SYMBOL.height / SYMBOL.width));
}

/** Where the cross rests in the hero. Returns px from the viewport centre. */
export function heroLayout(w: number, h: number) {
  if (w >= 900) return { x: w * 0.29, y: h * 0.04, height: h * 0.66 };
  return { x: w * 0.17, y: h * 0.17, height: h * 0.4 };
}

export const CAMERA_FOV = 35;

export const isCapture = () =>
  typeof window !== "undefined" && new URLSearchParams(window.location.search).has("capture");
