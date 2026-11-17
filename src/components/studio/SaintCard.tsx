"use client";

import { useState } from "react";
import Image from "next/image";
import type { Saint } from "@/content/team";
import { tick } from "@/lib/sound";
import { ExternalLink, Label } from "@/components/ui";

/**
 * A Saint. The portrait is the founder's cutout rendered as a monochrome
 * halftone (pure CSS, so it works on every quality tier); hover or focus
 * sharpens it to the photograph. The card flips to show the role and the
 * personal line.
 */
export function SaintCard({ saint, index }: { saint: Saint; index: number }) {
  const [flipped, setFlipped] = useState(false);
  const id = `saint-${saint.slug}`;

  return (
    // Not reveal-gated: the first portrait is the page's largest paint.
    <article className="saint">
      <div className="saint__scene">
        <div className="saint__card" data-flipped={flipped || undefined}>
          <div className="saint__face saint__front" aria-hidden={flipped}>
            <div className="halftone">
              <Image
                src={saint.cutout}
                alt={`${saint.name}, ${saint.role}`}
                fill
                sizes="(min-width: 768px) 46vw, 92vw"
                preload={index === 0}
                fetchPriority={index === 0 ? "high" : "auto"}
                loading={index === 0 ? "eager" : "lazy"}
              />
            </div>
          </div>
          <div id={id} className="saint__face saint__back" aria-hidden={!flipped} inert={!flipped}>
            <Label>{String(index + 1).padStart(2, "0")} — The Saints</Label>
            <div>
              <p className="t-label text-fog">{saint.role}</p>
              <p className="t-h2 t-accent mt-6 max-w-[16ch]">“{saint.line}”</p>
            </div>
            <div className="flex flex-wrap gap-x-8">
              {saint.links.map((link) => (
                <ExternalLink key={link.href} href={link.href}>
                  {link.label}
                </ExternalLink>
              ))}
            </div>
          </div>
        </div>
      </div>

      <div className="mt-6 flex items-start justify-between gap-6">
        <div>
          <h2 className="t-h2">{saint.name}</h2>
          <Label className="mt-3">{saint.role}</Label>
        </div>
        <button
          type="button"
          aria-expanded={flipped}
          aria-controls={id}
          onClick={() => {
            setFlipped((f) => !f);
            tick("click");
          }}
          className="work-chip t-label shrink-0"
        >
          {flipped ? "Portrait" : "Flip"}
        </button>
      </div>
      <p className="t-body mt-6 max-w-[52ch] text-fog">{saint.bio}</p>
    </article>
  );
}
