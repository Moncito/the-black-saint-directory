import type { Metadata } from "next";
import { pageMeta } from "@/lib/seo";
import Image from "next/image";
import { notFound } from "next/navigation";
import { getNextProject, getProject, projects } from "@/content/projects";
import { TLink } from "@/components/Transition";
import { Badge, ExternalLink, Label } from "@/components/ui";
import { CaseStudyShell } from "@/components/work/CaseStudy";

type Props = { params: Promise<{ slug: string }> };

export const dynamicParams = false;

export const generateStaticParams = () => projects.map((p) => ({ slug: p.slug }));

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const project = getProject((await params).slug);
  if (!project) return {};
  const name = project.badge ? `${project.name} (${project.badge})` : project.name;
  return pageMeta({
    title: name,
    description: project.summary ?? project.sections[0]?.text,
    path: `/work/${project.slug}`,
    image: `/og/${project.slug}.jpg`,
    imageAlt: `${name} — ${project.meta}`,
  });
}

export default async function CaseStudy({ params }: Props) {
  const project = getProject((await params).slug);
  if (!project) notFound();
  const next = getNextProject(project.slug);
  const mobile = project.kind === "mobile";

  return (
    <CaseStudyShell>
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
        {/* The work index's thumbnail grows into this plate. It is also the LCP. */}
        <div data-shared-target className="case__media overflow-hidden bg-carbon">
          <Image
            src={project.plate}
            alt={`${project.name} — ${project.meta}`}
            width={2400}
            height={1500}
            sizes="100vw"
            preload
            fetchPriority="high"
            loading="eager"
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
            <div key={section.label} data-reveal="fade" className="case__block">
              <Label>{section.label}</Label>
              <p className="t-h3 mt-4">{section.text}</p>
            </div>
          ))}
          {/* Hidden until the owner fills the [RESULT] line. */}
          {project.result && (
            <div data-reveal="fade" className="case__block">
              <Label>Result</Label>
              <p className="t-h3 mt-4">{project.result}</p>
            </div>
          )}
          {/* Hidden until the stack is written into the project's content. */}
          {project.stack && (
            <div className="case__stack">
              <Label>Stack</Label>
              <ul className="t-label mt-4 flex flex-wrap gap-2">
                {project.stack.map((item) => (
                  <li key={item} className="rounded-full border border-graphite px-3 py-2">
                    {item}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      </section>

      <div className="gutter pb-[16vh]">
        <div className={`mx-auto ${mobile ? "device device--phone" : "device device--browser"}`}>
          {!mobile && (
            <div aria-hidden="true" className="device__bar">
              <span />
              <span />
              <span />
            </div>
          )}
          <div data-scrub className="case__media device__screen">
            {/* Raw screenshots vary in size; let the browser size them. */}
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
      </div>

      <TLink href={`/work/${next.slug}`} shared data-cursor="View" className="case-next gutter group">
        <div>
          <Label>Next project — {next.index}</Label>
          <p className="t-h1 mt-6 transition-transform duration-[1200ms] ease-[var(--ease-expo)] group-hover:translate-x-4">
            {next.name}
            {next.badge && <Badge>{next.badge}</Badge>}
          </p>
          <p className="t-label mt-6 text-fog">{next.meta}</p>
        </div>
        <div className="case-next__plate case__media overflow-hidden bg-carbon">
          <Image
            src={next.plate}
            alt=""
            width={2400}
            height={1500}
            sizes="(min-width: 768px) 40vw, 100vw"
            className="work-image h-auto w-full group-hover:scale-[1.03]"
          />
        </div>
      </TLink>
    </CaseStudyShell>
  );
}
