"use client";

import { useEffect, useState } from "react";
import { site } from "@/content/site";

const format = new Intl.DateTimeFormat("en-GB", {
  timeZone: site.timeZone,
  hour: "2-digit",
  minute: "2-digit",
  second: "2-digit",
  hour12: false,
});

/** Live Manila time. Renders a placeholder on the server to keep hydration clean. */
export function ManilaClock({ className }: { className?: string }) {
  const [time, setTime] = useState<string | null>(null);

  useEffect(() => {
    const update = () => setTime(format.format(new Date()));
    update();
    const id = window.setInterval(update, 1000);
    return () => window.clearInterval(id);
  }, []);

  return (
    <span className={`t-label tabular-nums ${className ?? ""}`}>
      <span aria-hidden="true">MNL {time ?? "--:--:--"}</span>
      <span className="sr-only">Manila time{time ? ` ${time.slice(0, 5)}` : ""}</span>
    </span>
  );
}
