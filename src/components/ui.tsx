import Image from "next/image";
import type { ReactNode } from "react";
import type { Project } from "@/content/projects";
import { TLink } from "./Transition";

export function Label({ children, className }: { children: ReactNode; className?: string }) {
  return <p className={`t-label text-muted ${className ?? ""}`}>{children}</p>;
}

/** Top of every inner page: mono label, then the H1 rising line by line. */
export function PageHeader({
  label,
  title,
  children,
}: {
  label: string;
  title: ReactNode;
  children?: ReactNode;
}) {
  return (
    <header className="gutter pb-16 pt-[calc(var(--spacing-nav)+12vh)] md:pb-24">
      <Label>{label}</Label>
      {/* CSS-driven rise: the page title paints without waiting for JS. */}
      <h1 className="t-h1 mt-6 max-w-[16ch]">
        <span className="rise-mask">
          <span className="rise-line">{title}</span>
        </span>
      </h1>
      {children}
    </header>
  );
}

export function SectionHead({ index, label }: { index: string; label: string }) {
  return (
    <div className="mb-12 md:mb-20">
      <div data-reveal="rule" className="h-px w-full bg-current opacity-20" />
      <div className="t-label text-muted mt-4 flex justify-between">
        <span>{label}</span>
        <span>{index}</span>
      </div>
    </div>
  );
}

/** Concept labels are non-negotiable — rendered wherever the name is. */
export function Badge({ children }: { children: ReactNode }) {
  return (
    <span className="t-label border-rule ml-3 inline-block translate-y-[-0.35em] rounded-full border px-2.5 py-1 align-middle text-[10px]">
      {children}
    </span>
  );
}

export function ProjectCard({
  project,
  priority = false,
}: {
  project: Project;
  priority?: boolean;
}) {
  return (
    <TLink
      href={`/work/${project.slug}`}
      data-cursor="View"
      data-reveal="fade"
      className="group block"
    >
      <div className="overflow-hidden bg-carbon">
        <Image
          src={project.plate}
          alt={`${project.name} — ${project.meta}`}
          width={2400}
          height={1500}
          sizes="(min-width: 768px) 50vw, 100vw"
          priority={priority}
          className="work-image h-auto w-full group-hover:scale-[1.03] group-focus-visible:scale-[1.03]"
        />
      </div>
      <div className="mt-4 flex items-start justify-between gap-6">
        <div>
          <h3 className="t-h3">
            {project.name}
            {project.badge && <Badge>{project.badge}</Badge>}
          </h3>
          <p className="t-label text-muted mt-2">{project.meta}</p>
        </div>
        <span className="t-label text-muted pt-1.5">{project.index}</span>
      </div>
    </TLink>
  );
}

export function ExternalLink({ href, children }: { href: string; children: ReactNode }) {
  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      data-cursor="Open"
      className="t-label inline-flex h-11 items-center gap-2"
    >
      <span className="link-line">{children}</span>
      <span aria-hidden="true">↗</span>
      <span className="sr-only">(opens in a new tab)</span>
    </a>
  );
}
