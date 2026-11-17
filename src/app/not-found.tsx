import type { Metadata } from "next";
import { notFound as copy } from "@/content/site";
import { TLink } from "@/components/Transition";
import { Label } from "@/components/ui";
import { SnakeGame } from "@/components/SnakeGame";

export const metadata: Metadata = { title: "404", robots: { index: false } };

export default function NotFound() {
  return (
    <section className="gutter grid min-h-[100svh] items-center gap-12 pb-16 pt-[calc(var(--spacing-nav)+6vh)] lg:grid-cols-[1fr_1.15fr]">
      <div>
        <Label>404</Label>
        <h1 className="t-h1 mt-6 max-w-[12ch]">
          <span className="rise-mask">
            <span className="rise-line">{copy.heading}</span>
          </span>
        </h1>
        <p className="t-body mt-10">
          <TLink href="/" className="inline-flex h-11 items-center gap-2">
            <span className="link-line">{copy.body}</span> <span aria-hidden="true">→</span>
          </TLink>
        </p>
      </div>
      <SnakeGame />
    </section>
  );
}
