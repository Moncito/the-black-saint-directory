"use client";

import { useStore } from "@/lib/store";
import { setSoundEnabled, tick } from "@/lib/sound";

/** Sound is off until the visitor asks for it. Always reachable from the nav. */
export function SoundToggle({ className }: { className?: string }) {
  const sound = useStore((s) => s.sound);
  const setSound = useStore((s) => s.setSound);

  const toggle = async () => {
    const next = !sound;
    setSound(next);
    await setSoundEnabled(next);
    if (next) tick("click");
  };

  return (
    <button
      type="button"
      onClick={toggle}
      aria-pressed={sound}
      aria-label="Sound"
      className={`t-label group h-11 items-center gap-2 ${className ?? "inline-flex"}`}
    >
      <span aria-hidden="true" className="flex h-3 items-end gap-[2px]">
        {[0.45, 1, 0.65, 0.85].map((h, i) => (
          <span
            key={i}
            className="sound-bar w-px origin-bottom bg-current"
            style={{
              height: "100%",
              transform: `scaleY(${sound ? h : 0.18})`,
              animationDelay: `${i * 0.13}s`,
            }}
            data-on={sound}
          />
        ))}
      </span>
      <span aria-hidden="true">Sound {sound ? "on" : "off"}</span>
    </button>
  );
}
