import type { MetadataRoute } from "next";
import { projects } from "@/content/projects";
import { services } from "@/content/services";
import { siteUrl } from "@/lib/seo";

export default function sitemap(): MetadataRoute.Sitemap {
  const paths = [
    { path: "/", priority: 1 },
    { path: "/work", priority: 0.9 },
    { path: "/services", priority: 0.8 },
    { path: "/studio", priority: 0.7 },
    { path: "/process", priority: 0.6 },
    { path: "/start", priority: 0.9 },
    ...projects.map((p) => ({ path: `/work/${p.slug}`, priority: 0.7 })),
    ...services.map((s) => ({ path: `/services/${s.slug}`, priority: 0.7 })),
  ];
  return paths.map(({ path, priority }) => ({
    url: `${siteUrl}${path === "/" ? "" : path}`,
    changeFrequency: "monthly",
    priority,
  }));
}
