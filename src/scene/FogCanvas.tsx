"use client";

import { useEffect, useRef } from "react";
import { usePathname } from "next/navigation";
import { useStore } from "@/lib/store";
import { tierSettings } from "@/lib/tier";
import { isCapture, pointer, listenPointer, serpent } from "@/serpent/state";

/**
 * The persistent atmosphere: drifting fog, a floor glow and the candle — the
 * cursor light that rakes across it. One fixed canvas, shared by every route.
 *
 * Plain WebGL, no three.js: a single fullscreen triangle and one shader, a
 * few KB in all. three.js is only ever loaded for the intro's serpent.
 */

const VERTEX = `
attribute vec2 aPos;
varying vec2 vUv;
void main() {
  vUv = aPos * 0.5 + 0.5;
  gl_Position = vec4(aPos, 0.0, 1.0);
}`;

const FRAGMENT = (octaves: number) => `
precision highp float;
#define OCTAVES ${octaves}
varying vec2 vUv;
uniform float uTime;
uniform float uAspect;
uniform float uIntensity;
uniform vec2 uLight;
uniform float uCore;
uniform float uLit;

const vec3 CANDLE = vec3(1.0, 0.86, 0.68);

float hash(vec2 p) {
  p = fract(p * vec2(123.34, 456.21));
  p += dot(p, p + 45.32);
  return fract(p.x * p.y);
}

float noise(vec2 p) {
  vec2 i = floor(p);
  vec2 f = fract(p);
  vec2 u = f * f * (3.0 - 2.0 * f);
  return mix(
    mix(hash(i), hash(i + vec2(1.0, 0.0)), u.x),
    mix(hash(i + vec2(0.0, 1.0)), hash(i + vec2(1.0, 1.0)), u.x),
    u.y
  );
}

float fbm(vec2 p) {
  float v = 0.0;
  float a = 0.5;
  for (int i = 0; i < OCTAVES; i++) {
    v += a * noise(p);
    p = p * 2.03 + vec2(17.1, 9.2);
    a *= 0.5;
  }
  return v;
}

void main() {
  vec2 p = vec2(vUv.x * uAspect, vUv.y) * 1.6;
  float t = uTime * 0.018;

  // Domain-warped fog, drifting slowly.
  vec2 q = vec2(fbm(p + vec2(t, -t * 0.6)), fbm(p + vec2(-t * 0.4, t) + 4.7));
  float f = fbm(p + q * 1.4 + vec2(t * 0.5, 0.0));

  // Denser toward the floor, clear at the top edge for the nav.
  float falloff = smoothstep(1.15, 0.1, vUv.y) * 0.75 + 0.25;
  float fog = smoothstep(0.38, 0.95, f) * falloff * 0.11 * uIntensity;

  // The candle rakes across the fog and shows as a small warm point.
  vec2 d = (vUv - uLight) * vec2(uAspect, 1.0);
  float r2 = dot(d, d);
  float lit = uLit * exp(-r2 * 6.0);
  float core = uCore * (exp(-r2 * 26000.0) * 0.9 + exp(-r2 * 1400.0) * 0.14 + exp(-r2 * 120.0) * 0.03 + exp(-r2 * 9.0) * 0.012);

  // A soft floor glow: the grade, not an effect.
  vec2 c = (vUv - vec2(0.62, -0.08)) * vec2(uAspect * 0.75, 1.35);
  float floorGlow = exp(-dot(c, c) * 2.4) * 0.05 * uIntensity;

  vec3 color = vec3(fog + floorGlow) + CANDLE * (fog * lit * 3.2 + lit * 0.014 * uIntensity + core);

  // Triangular dither: dark gradients in 8 bits band badly without it.
  float n = hash(gl_FragCoord.xy + fract(uTime) * 61.0) + hash(gl_FragCoord.yx * 1.37 + fract(uTime) * 17.0) - 1.0;
  color = max(color + n * (1.5 / 255.0), 0.0);

  float alpha = min(max(color.r, max(color.g, color.b)), 1.0);
  gl_FragColor = vec4(color, alpha);
}`;

const damp = (a: number, b: number, lambda: number, dt: number) =>
  a + (b - a) * (1 - Math.exp(-lambda * dt));

function compile(gl: WebGLRenderingContext, octaves: number) {
  const shader = (type: number, src: string) => {
    const s = gl.createShader(type)!;
    gl.shaderSource(s, src);
    gl.compileShader(s);
    return s;
  };
  const program = gl.createProgram()!;
  gl.attachShader(program, shader(gl.VERTEX_SHADER, VERTEX));
  gl.attachShader(program, shader(gl.FRAGMENT_SHADER, FRAGMENT(octaves)));
  gl.bindAttribLocation(program, 0, "aPos");
  gl.linkProgram(program);
  if (!gl.getProgramParameter(program, gl.LINK_STATUS)) return null;
  return program;
}

export function FogCanvas({ tier }: { tier: "full" | "lite" }) {
  const canvas = useRef<HTMLCanvasElement>(null);
  const pathname = usePathname();
  const reducedMotion = useStore((s) => s.reducedMotion);
  const downgrade = useStore((s) => s.downgrade);
  const home = useRef(pathname === "/");
  home.current = pathname === "/";
  const redraw = useRef<() => void>(() => {});

  useEffect(() => {
    const el = canvas.current;
    if (!el) return;
    const gl = el.getContext("webgl", {
      alpha: true,
      antialias: false,
      depth: false,
      stencil: false,
      premultipliedAlpha: true,
      powerPreference: "low-power",
    });
    if (!gl) return;
    const settings = tierSettings[tier];
    const program = compile(gl, settings.fogOctaves);
    if (!program) return;
    listenPointer();

    const buffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 3, -1, -1, 3]), gl.STATIC_DRAW);
    gl.enableVertexAttribArray(0);
    gl.vertexAttribPointer(0, 2, gl.FLOAT, false, 0, 0);
    gl.useProgram(program);
    const u = (name: string) => gl.getUniformLocation(program, name);
    const uTime = u("uTime");
    const uAspect = u("uAspect");
    const uIntensity = u("uIntensity");
    const uLight = u("uLight");
    const uCore = u("uCore");
    const uLit = u("uLit");

    // Fog is soft: it never needs more than 1.5× resolution.
    const cap = tier === "full" ? 1.5 : 1;
    let w = 0;
    let h = 0;
    const resize = () => {
      const scale = Math.min(window.devicePixelRatio || 1, cap);
      w = window.innerWidth;
      h = window.innerHeight;
      el.width = Math.round(w * scale);
      el.height = Math.round(h * scale);
      gl.viewport(0, 0, el.width, el.height);
    };
    resize();

    const state = { time: 0, intensity: 0 };
    const capture = isCapture();

    const draw = () => {
      gl.uniform1f(uTime, state.time);
      gl.uniform1f(uAspect, w / Math.max(h, 1));
      gl.uniform1f(uIntensity, state.intensity);
      gl.uniform2f(uLight, serpent.lightX / w + 0.5, serpent.lightY / h + 0.5);
      gl.uniform1f(uCore, serpent.core);
      gl.uniform1f(uLit, serpent.mode === "idle" ? 0 : Math.min(serpent.light, 1.5) * 0.6);
      gl.drawArrays(gl.TRIANGLES, 0, 3);
    };

    /** Advance the atmosphere by dt seconds. */
    const update = (dt: number, still: boolean) => {
      const target = (home.current ? 1 : 0.55) * serpent.fog;
      state.intensity = still ? target : damp(state.intensity, target, 1.2, dt);

      // After the intro the candle belongs to the visitor: the cursor, a tilt,
      // or a slow drift where there is neither.
      if (serpent.mode === "hero") {
        if (still) {
          serpent.lightX = w * 0.24;
          serpent.lightY = h * 0.18;
        } else {
          serpent.time += dt;
          const t = serpent.time;
          const lx = pointer.active ? pointer.x : w * 0.2 + Math.sin(t * 0.37) * w * 0.22;
          const ly = pointer.active ? pointer.y : h * 0.1 + Math.cos(t * 0.29) * h * 0.2;
          serpent.lightX = damp(serpent.lightX, lx, 5, dt);
          serpent.lightY = damp(serpent.lightY, ly, 5, dt);
        }
        serpent.core = damp(serpent.core, pointer.fine ? 0.2 : 0.5, 2, still ? 10 : dt);
        serpent.light = damp(serpent.light, 1.7, 2, still ? 10 : dt);
        serpent.fog = damp(serpent.fog, 1, 1.2, still ? 10 : dt);
      }
    };

    let frame = 0;
    let last = 0;
    // A sustained low frame rate steps the device down a tier.
    let sampleStart = 0;
    let sampleFrames = 0;
    let slow = 0;

    const loop = (now: number) => {
      const dt = last ? Math.min((now - last) / 1000, 0.1) : 0;
      last = now;
      state.time += dt;
      update(dt, false);
      draw();

      if (tier === "full" && document.visibilityState === "visible") {
        if (!sampleStart) sampleStart = now;
        sampleFrames++;
        if (now - sampleStart > 2000) {
          const fps = (sampleFrames * 1000) / (now - sampleStart);
          slow = fps < 40 ? slow + 1 : 0;
          if (slow >= 2) downgrade();
          sampleStart = now;
          sampleFrames = 0;
        }
      }
      frame = requestAnimationFrame(loop);
    };

    const still = () => {
      update(0, true);
      draw();
    };
    redraw.current = still;

    const onResize = () => {
      resize();
      if (reducedMotion || capture) still();
    };
    window.addEventListener("resize", onResize);

    // Capture mode: frames are stepped by scripts/capture-intro.mjs.
    const onCapture = (e: Event) => {
      state.time = (e as CustomEvent<number>).detail / 1000;
      update(0, true);
      draw();
    };

    if (capture) {
      window.addEventListener("bsd:capture-frame", onCapture);
      still();
    } else if (reducedMotion) {
      still();
    } else {
      frame = requestAnimationFrame(loop);
    }

    return () => {
      cancelAnimationFrame(frame);
      window.removeEventListener("resize", onResize);
      window.removeEventListener("bsd:capture-frame", onCapture);
      gl.deleteBuffer(buffer);
      gl.deleteProgram(program);
      redraw.current = () => {};
    };
  }, [tier, reducedMotion, downgrade]);

  // With reduced motion, redraw once when the route changes.
  useEffect(() => {
    if (reducedMotion) redraw.current();
  }, [pathname, reducedMotion]);

  return <canvas ref={canvas} className="absolute inset-0 h-full w-full" />;
}
