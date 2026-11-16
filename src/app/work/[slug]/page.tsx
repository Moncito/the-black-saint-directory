import type { Metadata } from "next";
import Image from "next/image";
import { notFound } from "next/navigation";
import { getNextProject, getProject, projects } from "@/content/projects";
import { TLink } from "@/components/Transition";
import { Badge, ExternalLink, Label } from "@/components/ui";

type Props = { params: Promise<{ slug: string }> };

export const dynamicParams = false;

export const generateStaticParams = () => projects.map((p) => ({ slug: p.slug }));

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const project = getProject((await params).slug);
  if (!project) return {};
  return {
    title: project.badge ? `${project.name} (${project.badge})` : project.name,
    description: project.summary ?? project.sections[0]?.text,
  };
}

/** Phase 1 skeleton. Shared-element transition and "How we built it" arrive in Phase 4. */
export default async function CaseStudy({ params }: Props) {
  const project = getProject((await params).slug);
  if (!project) notFound();
  const next = getNextProject(project.slug);
  const mobile = project.kind === "mobile";

  return (
    <article>
      <header className="gutter pb-12 pt-[calc(var(--spacing-nav)+12vh)] md:pb-16">
        <Label>
          {project.index} — {project.meta}
        </Label>
        <h1 className="t-h1 mt-6">
          <span className="rise-mask !inline-block max-w-[14ch] align-top">
            <span className="rise-line">{project.name}</span>
          </span>
          {project.badge && <Badge>{project.badge}</Badge>}
        </h1>
      </header>

      <div className="gutter">
        {/* No JS-gated reveal here: this plate is the page's LCP. */}
        <div className="overflow-hidden bg-carbon">
          <Image
            src={project.plate}
            alt={`${project.name} — ${project.meta}`}
            width={2400}
            height={1500}
            sizes="100vw"
            priority
            className="h-auto w-full"
          />
        </div>
      </div>

      <section className="gutter grid gap-12 py-[14vh] md:grid-cols-[1fr_2fr] md:gap-10">
        <div>{project.live && <ExternalLink href={project.live}>Live</ExternalLink>}</div>
        <div className="max-w-[60ch] space-y-14">
          {project.summary && (
            <p data-reveal="lines" className="t-h3">
              {project.summary}
            </p>
          )}
          {project.sections.map((section) => (
            <div key={section.label} data-reveal="fade">
              <Label>{section.label}</Label>
              <p className="t-h3 mt-4">{section.text}</p>
            </div>
          ))}
          {/* Hidden until the owner fills the [RESULT] line. */}
          {project.result && (
            <div data-reveal="fade">
              <Label>Result</Label>
              <p className="t-h3 mt-4">{project.result}</p>
            </div>
          )}
        </div>
      </section>

      <div className="gutter pb-[14vh]">
        <div
          data-reveal="fade"
          className={`mx-auto overflow-hidden bg-carbon ${mobile ? "max-w-[420px]" : "max-w-[1400px]"}`}
        >
          {/* Raw screenshots vary in height; let the browser size them. */}
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={project.screen}
            alt={`${project.name} — ${mobile ? "app screen" : "website screenshot"}`}
            loading="lazy"
            decoding="async"
            className="h-auto w-full"
          />
        </div>
      </div>

      <TLink
        href={`/work/${next.slug}`}
        data-cursor="View"
        className="gutter group block border-t border-graphite py-[14vh]"
      >
        <Label>Next project — {next.index}</Label>
        <p className="t-h1 mt-6 transition-transform duration-[1200ms] ease-[var(--ease-expo)] group-hover:translate-x-4">
          {next.name}
          {next.badge && <Badge>{next.badge}</Badge>}
        </p>
      </TLink>
    </article>
  );
}
