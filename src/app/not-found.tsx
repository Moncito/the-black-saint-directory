import type { Metadata } from "next";
import { notFound as copy } from "@/content/site";
import { TLink } from "@/components/Transition";
import { Label } from "@/components/ui";

export const metadata: Metadata = { title: "404" };

/** Phase 1 skeleton. The playable serpent game arrives in Phase 4. */
export default function NotFound() {
  return (
    <section className="gutter flex min-h-[100svh] flex-col justify-center pt-[var(--spacing-nav)]">
      <Label>404</Label>
      <h1 data-reveal="lines" className="t-h1 mt-6 max-w-[12ch]">
        {copy.heading}
      </h1>
      <p data-reveal="fade" className="t-body mt-10">
        <TLink href="/" className="inline-flex h-11 items-center gap-2">
          <span className="link-line">{copy.body}</span> <span aria-hidden="true">→</span>
        </TLink>
      </p>
    </section>
  );
}
