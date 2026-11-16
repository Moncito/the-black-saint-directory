"use client";

import { useId, useState } from "react";
import { hero } from "@/content/site";

/**
 * Editorial Sites demo: a type playground. The headline is live HTML set in
 * the site's own variable font — the sliders move its real weight, size and
 * tracking, nothing is an image.
 */
export function TypePlayground() {
  const id = useId();
  const [weight, setWeight] = useState(500);
  const [size, setSize] = useState(72);
  const [tracking, setTracking] = useState(-5);
  const [italic, setItalic] = useState(false);

  const controls = [
    { key: "weight", label: "Weight", min: 100, max: 900, step: 1, value: weight, set: setWeight, out: String(weight) },
    { key: "size", label: "Size", min: 30, max: 100, step: 1, value: size, set: setSize, out: `${size}%` },
    {
      key: "tracking",
      label: "Tracking",
      min: -8,
      max: 4,
      step: 0.5,
      value: tracking,
      set: setTracking,
      out: `${tracking > 0 ? "+" : ""}${tracking}%`,
    },
  ];

  return (
    <div className="demo demo--type">
      <p
        className="demo-type__specimen"
        style={{
          fontWeight: weight,
          fontStyle: italic ? "italic" : "normal",
          fontSize: `calc(clamp(44px, 11vw, 190px) * ${size / 100})`,
          letterSpacing: `${tracking / 100}em`,
        }}
      >
        {hero.line1}
      </p>

      <div className="demo-controls">
        {controls.map((c) => (
          <div key={c.key} className="demo-control">
            <label htmlFor={`${id}-${c.key}`} className="t-label">
              {c.label}
            </label>
            <input
              id={`${id}-${c.key}`}
              type="range"
              className="demo-range"
              min={c.min}
              max={c.max}
              step={c.step}
              value={c.value}
              onChange={(e) => c.set(Number(e.target.value))}
            />
            <output htmlFor={`${id}-${c.key}`} className="t-label tabular-nums text-fog">
              {c.out}
            </output>
          </div>
        ))}
        <button
          type="button"
          aria-pressed={italic}
          onClick={() => setItalic((v) => !v)}
          className="work-chip t-label"
        >
          Italic
        </button>
      </div>
    </div>
  );
}
