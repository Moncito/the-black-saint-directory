import type { Metadata } from "next";
import { projects } from "@/content/projects";
import { PageHeader } from "@/components/ui";
import { WorkIndex } from "@/components/work/WorkIndex";

export const metadata: Metadata = { title: "Work" };

export default function Work() {
  return (
    <>
      <PageHeader label={`Work — ${String(projects.length).padStart(2, "0")}`} title="Work" />
      <WorkIndex />
    </>
  );
}
