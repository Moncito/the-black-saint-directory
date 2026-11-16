import type { Metadata } from "next";
import { projects } from "@/content/projects";
import { PageHeader, ProjectCard } from "@/components/ui";

export const metadata: Metadata = { title: "Work" };

/** Phase 1 skeleton. List/grid views, Flip and filters arrive in Phase 4. */
export default function Work() {
  return (
    <>
      <PageHeader label={`Work — ${String(projects.length).padStart(2, "0")}`} title="Work" />
      <section className="gutter pb-[16vh]">
        <div className="grid gap-x-6 gap-y-16 md:grid-cols-2 md:gap-y-24">
          {projects.map((project, i) => (
            <ProjectCard key={project.slug} project={project} priority={i < 2} />
          ))}
        </div>
      </section>
    </>
  );
}
