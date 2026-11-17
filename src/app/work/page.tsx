import type { Metadata } from "next";
import { pageMeta } from "@/lib/seo";
import { projects } from "@/content/projects";
import { PageHeader } from "@/components/ui";
import { WorkIndex } from "@/components/work/WorkIndex";

export const metadata: Metadata = pageMeta({ title: "Work", path: "/work" });

export default function Work() {
  return (
    <>
      <PageHeader label={`Work — ${String(projects.length).padStart(2, "0")}`} title="Work" />
      <WorkIndex />
    </>
  );
}
