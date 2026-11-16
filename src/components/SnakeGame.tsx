"use client";

import { useEffect, useRef, useState } from "react";
import { tick } from "@/lib/sound";

const COLS = 24;
const ROWS = 16;
const STEP_MS = 115;

type Point = { x: number; y: number };
type State = "ready" | "playing" | "over";

/**
 * 404: a playable round of Snake with our serpent. Arrow keys or WASD on a
 * keyboard, swipe on a phone. Monochrome, drawn on a 2D canvas — no WebGL.
 */
export function SnakeGame() {
  const canvas = useRef<HTMLCanvasElement>(null);
  const [state, setState] = useState<State>("ready");
  const [score, setScore] = useState(0);
  const [best, setBest] = useState(0);

  const game = useRef({
    body: [] as Point[],
    dir: { x: 1, y: 0 },
    queue: [] as Point[],
    food: { x: 16, y: 8 },
    state: "ready" as State,
    last: 0,
  });

  const start = () => {
    const g = game.current;
    g.body = [6, 5, 4, 3].map((x) => ({ x, y: 8 }));
    g.dir = { x: 1, y: 0 };
    g.queue = [];
    g.food = { x: 16, y: 8 };
    g.state = "playing";
    g.last = 0;
    setScore(0);
    setState("playing");
    tick("click");
  };

  const turn = (x: number, y: number) => {
    const g = game.current;
    if (g.state !== "playing") return;
    const prev = g.queue[g.queue.length - 1] ?? g.dir;
    // No reversing into yourself, no double-queuing the same turn.
    if ((prev.x === -x && prev.y === -y) || (prev.x === x && prev.y === y)) return;
    if (g.queue.length < 2) g.queue.push({ x, y });
  };

  useEffect(() => {
    const el = canvas.current;
    const ctx = el?.getContext("2d");
    if (!el || !ctx) return;
    const g = game.current;
    let frame = 0;
    let cell = 20;

    const resize = () => {
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      const width = el.clientWidth;
      cell = width / COLS;
      el.width = Math.round(width * dpr);
      el.height = Math.round(cell * ROWS * dpr);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    };

    const step = () => {
      g.dir = g.queue.shift() ?? g.dir;
      const head = { x: g.body[0].x + g.dir.x, y: g.body[0].y + g.dir.y };
      const hitWall = head.x < 0 || head.y < 0 || head.x >= COLS || head.y >= ROWS;
      const hitSelf = g.body.slice(0, -1).some((p) => p.x === head.x && p.y === head.y);
      if (hitWall || hitSelf) {
        g.state = "over";
        setState("over");
        setBest((b) => Math.max(b, g.body.length - 4));
        return;
      }
      g.body.unshift(head);
      if (head.x === g.food.x && head.y === g.food.y) {
        setScore(g.body.length - 4);
        tick("hover");
        do {
          g.food = { x: Math.floor(Math.random() * COLS), y: Math.floor(Math.random() * ROWS) };
        } while (g.body.some((p) => p.x === g.food.x && p.y === g.food.y));
      } else {
        g.body.pop();
      }
    };

    const draw = () => {
      const w = cell * COLS;
      const h = cell * ROWS;
      ctx.clearRect(0, 0, w, h);

      // A faint dot grid.
      ctx.fillStyle = "rgba(255,255,255,0.09)";
      for (let x = 0; x < COLS; x++)
        for (let y = 0; y < ROWS; y++) ctx.fillRect((x + 0.5) * cell - 0.5, (y + 0.5) * cell - 0.5, 1, 1);

      // Food: a small point of light.
      ctx.fillStyle = "#fff";
      ctx.beginPath();
      ctx.arc((g.food.x + 0.5) * cell, (g.food.y + 0.5) * cell, cell * 0.18, 0, Math.PI * 2);
      ctx.fill();

      // The serpent: one continuous rounded stroke, as in the logo.
      if (g.body.length) {
        ctx.strokeStyle = g.state === "over" ? "#5c5c5c" : "#fff";
        ctx.lineWidth = cell * 0.62;
        ctx.lineCap = "round";
        ctx.lineJoin = "round";
        ctx.beginPath();
        g.body.forEach((p, i) => {
          const x = (p.x + 0.5) * cell;
          const y = (p.y + 0.5) * cell;
          if (i === 0) ctx.moveTo(x, y);
          else ctx.lineTo(x, y);
        });
        ctx.stroke();
      }
    };

    const loop = (now: number) => {
      if (g.state === "playing") {
        if (!g.last) g.last = now;
        while (now - g.last >= STEP_MS && g.state === "playing") {
          g.last += STEP_MS;
          step();
        }
      }
      draw();
      frame = requestAnimationFrame(loop);
    };

    const keys: Record<string, [number, number]> = {
      ArrowUp: [0, -1],
      ArrowDown: [0, 1],
      ArrowLeft: [-1, 0],
      ArrowRight: [1, 0],
      w: [0, -1],
      s: [0, 1],
      a: [-1, 0],
      d: [1, 0],
    };
    const onKey = (e: KeyboardEvent) => {
      const dir = keys[e.key.length === 1 ? e.key.toLowerCase() : e.key];
      if (dir && g.state === "playing") {
        // Keep the arrow keys for the game while a round is on.
        e.preventDefault();
        turn(dir[0], dir[1]);
      } else if ((e.key === " " || e.key === "Enter") && g.state !== "playing") {
        if ((e.target as HTMLElement | null)?.closest("a, button")) return;
        e.preventDefault();
        start();
      }
    };

    let sx = 0;
    let sy = 0;
    const touchStart = (e: TouchEvent) => {
      sx = e.touches[0].clientX;
      sy = e.touches[0].clientY;
    };
    const touchMove = (e: TouchEvent) => {
      if (g.state !== "playing") return;
      e.preventDefault();
      const dx = e.touches[0].clientX - sx;
      const dy = e.touches[0].clientY - sy;
      if (Math.max(Math.abs(dx), Math.abs(dy)) < 22) return;
      if (Math.abs(dx) > Math.abs(dy)) turn(Math.sign(dx), 0);
      else turn(0, Math.sign(dy));
      sx = e.touches[0].clientX;
      sy = e.touches[0].clientY;
    };

    resize();
    const ro = new ResizeObserver(resize);
    ro.observe(el);
    window.addEventListener("keydown", onKey);
    el.addEventListener("touchstart", touchStart, { passive: true });
    el.addEventListener("touchmove", touchMove, { passive: false });
    frame = requestAnimationFrame(loop);
    return () => {
      cancelAnimationFrame(frame);
      ro.disconnect();
      window.removeEventListener("keydown", onKey);
      el.removeEventListener("touchstart", touchStart);
      el.removeEventListener("touchmove", touchMove);
    };
    // The game lives in a ref; this effect only wires it up once.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className="snake">
      <div className="snake__bar t-label">
        <span>
          Score <span className="tabular-nums text-white">{String(score).padStart(2, "0")}</span>
        </span>
        <span>
          Best <span className="tabular-nums text-white">{String(best).padStart(2, "0")}</span>
        </span>
      </div>
      <div className="snake__board" data-lenis-prevent>
        <canvas
          ref={canvas}
          className="snake__canvas"
          role="img"
          aria-label="Snake game board"
          style={{ aspectRatio: `${COLS} / ${ROWS}` }}
        />
        {state !== "playing" && (
          <div className="snake__overlay">
            <button type="button" onClick={start} className="intro__button t-label">
              {state === "over" ? "Play again" : "Play a round"}
            </button>
            <p className="t-label mt-4 text-fog">Arrow keys · WASD · swipe</p>
          </div>
        )}
      </div>
    </div>
  );
}
