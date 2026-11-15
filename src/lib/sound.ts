/**
 * Sound is opt-in and fully synthesized (Web Audio) — no files, nothing to
 * license. Phase 1 ships the engine and the UI tick; the ambient hum and the
 * intro slither arrive with the serpent in Phase 2.
 */

let ctx: AudioContext | null = null;
let master: GainNode | null = null;
let enabled = false;

function ensure(): AudioContext | null {
  if (typeof window === "undefined") return null;
  if (!ctx) {
    const Ctor =
      window.AudioContext ??
      (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
    if (!Ctor) return null;
    ctx = new Ctor();
    master = ctx.createGain();
    master.gain.value = 0;
    master.connect(ctx.destination);
  }
  return ctx;
}

/** Must be called from a user gesture. */
export async function setSoundEnabled(value: boolean) {
  enabled = value;
  const audio = ensure();
  if (!audio || !master) return;
  if (value && audio.state === "suspended") await audio.resume();
  master.gain.cancelScheduledValues(audio.currentTime);
  master.gain.setTargetAtTime(value ? 1 : 0, audio.currentTime, 0.08);
}

/** A quiet, dry tick for clicks; softer and higher for hovers. */
export function tick(kind: "click" | "hover" = "click") {
  if (!enabled || !ctx || !master) return;
  const now = ctx.currentTime;
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();
  const click = kind === "click";

  osc.type = "sine";
  osc.frequency.setValueAtTime(click ? 520 : 1400, now);
  osc.frequency.exponentialRampToValueAtTime(click ? 140 : 900, now + 0.06);
  gain.gain.setValueAtTime(0.0001, now);
  gain.gain.exponentialRampToValueAtTime(click ? 0.05 : 0.012, now + 0.004);
  gain.gain.exponentialRampToValueAtTime(0.0001, now + (click ? 0.09 : 0.05));

  osc.connect(gain).connect(master);
  osc.start(now);
  osc.stop(now + 0.12);
}
