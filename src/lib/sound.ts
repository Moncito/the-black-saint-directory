/**
 * Sound is opt-in and fully synthesized with Web Audio — no files to load and
 * nothing to license. A low ambient hum, a soft scale-slither for the intro,
 * and quiet ticks for clicks and hovers.
 */

let ctx: AudioContext | null = null;
let master: GainNode | null = null;
let hum: { gain: GainNode; stop: () => void } | null = null;
let noise: AudioBuffer | null = null;
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

    document.addEventListener("visibilitychange", () => {
      if (!ctx || !enabled) return;
      if (document.hidden) void ctx.suspend();
      else void ctx.resume();
    });
  }
  return ctx;
}

function noiseBuffer(audio: AudioContext) {
  if (noise) return noise;
  noise = audio.createBuffer(1, audio.sampleRate * 2, audio.sampleRate);
  const data = noise.getChannelData(0);
  for (let i = 0; i < data.length; i++) data[i] = Math.random() * 2 - 1;
  return noise;
}

/** Low ambient hum: detuned sines with soft upper partials so phones can voice it. */
function startHum(audio: AudioContext, out: GainNode) {
  if (hum) return;
  const gain = audio.createGain();
  gain.gain.value = 0;
  gain.connect(out);

  const voices: OscillatorNode[] = [];
  const voice = (freq: number, level: number, type: OscillatorType = "sine") => {
    const osc = audio.createOscillator();
    const g = audio.createGain();
    osc.type = type;
    osc.frequency.value = freq;
    g.gain.value = level;
    osc.connect(g).connect(gain);
    osc.start();
    voices.push(osc);
  };
  voice(55, 0.5);
  voice(55.45, 0.42);
  voice(110.3, 0.14);
  voice(164.9, 0.05);
  voice(220.6, 0.018, "triangle");

  // Slow breathing so it never sits still.
  const lfo = audio.createOscillator();
  const depth = audio.createGain();
  lfo.frequency.value = 0.07;
  depth.gain.value = 0.012;
  lfo.connect(depth).connect(gain.gain);
  lfo.start();
  voices.push(lfo);

  gain.gain.setTargetAtTime(0.05, audio.currentTime, 1.6);
  hum = {
    gain,
    stop: () => {
      gain.gain.setTargetAtTime(0, audio.currentTime, 0.3);
      window.setTimeout(() => {
        voices.forEach((v) => v.stop());
        gain.disconnect();
      }, 1500);
    },
  };
}

/** Must be called from a user gesture. */
export async function setSoundEnabled(value: boolean) {
  enabled = value;
  const audio = ensure();
  if (!audio || !master) return;
  if (value && audio.state === "suspended") await audio.resume();
  master.gain.cancelScheduledValues(audio.currentTime);
  master.gain.setTargetAtTime(value ? 1 : 0, audio.currentTime, 0.08);
  if (value) startHum(audio, master);
  else {
    hum?.stop();
    hum = null;
  }
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

/**
 * Scale-slither: band-passed noise, rasped by a fast tremolo, swelling as the
 * body arrives and thinning out as it settles onto the logo.
 */
export function slither(duration: number) {
  if (!enabled || !ctx || !master) return;
  const now = ctx.currentTime;
  const src = ctx.createBufferSource();
  src.buffer = noiseBuffer(ctx);
  src.loop = true;

  const band = ctx.createBiquadFilter();
  band.type = "bandpass";
  band.Q.value = 0.9;
  band.frequency.setValueAtTime(1800, now);
  band.frequency.linearRampToValueAtTime(4200, now + duration * 0.6);
  band.frequency.linearRampToValueAtTime(2600, now + duration);

  const rasp = ctx.createGain();
  rasp.gain.value = 0.6;
  const lfo = ctx.createOscillator();
  const depth = ctx.createGain();
  lfo.type = "triangle";
  lfo.frequency.setValueAtTime(34, now);
  lfo.frequency.linearRampToValueAtTime(11, now + duration);
  depth.gain.value = 0.4;
  lfo.connect(depth).connect(rasp.gain);

  const env = ctx.createGain();
  env.gain.setValueAtTime(0.0001, now);
  env.gain.exponentialRampToValueAtTime(0.035, now + duration * 0.45);
  env.gain.exponentialRampToValueAtTime(0.012, now + duration * 0.8);
  env.gain.exponentialRampToValueAtTime(0.0001, now + duration);

  src.connect(band).connect(rasp).connect(env).connect(master);
  src.start(now);
  lfo.start(now);
  src.stop(now + duration + 0.1);
  lfo.stop(now + duration + 0.1);
}

/** The soft flash that runs head to tail: a short, airy shimmer over a low bloom. */
export function shimmer() {
  if (!enabled || !ctx || !master) return;
  const now = ctx.currentTime;

  const src = ctx.createBufferSource();
  src.buffer = noiseBuffer(ctx);
  const high = ctx.createBiquadFilter();
  high.type = "highpass";
  high.frequency.setValueAtTime(3000, now);
  high.frequency.exponentialRampToValueAtTime(9000, now + 0.5);
  const air = ctx.createGain();
  air.gain.setValueAtTime(0.0001, now);
  air.gain.exponentialRampToValueAtTime(0.02, now + 0.12);
  air.gain.exponentialRampToValueAtTime(0.0001, now + 0.7);
  src.connect(high).connect(air).connect(master);
  src.start(now);
  src.stop(now + 0.8);

  const low = ctx.createOscillator();
  const bloom = ctx.createGain();
  low.frequency.setValueAtTime(110, now);
  low.frequency.exponentialRampToValueAtTime(82.4, now + 0.9);
  bloom.gain.setValueAtTime(0.0001, now);
  bloom.gain.exponentialRampToValueAtTime(0.06, now + 0.15);
  bloom.gain.exponentialRampToValueAtTime(0.0001, now + 1.1);
  low.connect(bloom).connect(master);
  low.start(now);
  low.stop(now + 1.2);
}
