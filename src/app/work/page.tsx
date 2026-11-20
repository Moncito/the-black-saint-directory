import type { Metadata } from "next";
import { JsonLd } from "@/components/JsonLd";
import { graph, breadcrumbs, workList } from "@/lib/schema";
import { pageMeta } from "@/lib/seo";
import { projects } from "@/content/projects";
import { PageHeader } from "@/components/ui";
import { WorkIndex } from "@/components/work/WorkIndex";

export const metadata: Metadata = pageMeta({ title: "Work", path: "/work" });

export default function Work() {
  return (
    <>
      <JsonLd data={graph(breadcrumbs([{ name: "Work", path: "/work" }]), workList())} />
      <PageHeader label={`Work — ${String(projects.length).padStart(2, "0")}`} title="Work" />
      <WorkIndex />
    </>
  );
}
