import type { Metadata } from "next";
import { site } from "@/content/site";

/**
 * Canonical origin. Set NEXT_PUBLIC_SITE_URL once the domain is live; until
 * then Vercel's production URL is used, and localhost in development.
 */
export const siteUrl = (
  process.env.NEXT_PUBLIC_SITE_URL ??
  (process.env.VERCEL_PROJECT_PRODUCTION_URL
    ? `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}`
    : "http://localhost:3000")
).replace(/\/$/, "");

type PageMeta = {
  /** Short title; the layout template appends the studio name. */
  title?: string;
  description?: string;
  /** Route path, e.g. "/work". */
  path: string;
  /** Open Graph image under /public, 1200 × 630. */
  image?: string;
  imageAlt?: string;
};

/** Every page's metadata, built the same way: canonical, Open Graph, Twitter. */
export function pageMeta({ title, description, path, image, imageAlt }: PageMeta): Metadata {
  const fullTitle = title ? `${title} — ${site.name}` : site.name;
  const desc = description ?? site.description;
  const images = [
    {
      url: image ?? "/og/default.jpg",
      width: 1200,
      height: 630,
      alt: imageAlt ?? site.name,
    },
  ];
  return {
    ...(title ? { title } : {}),
    description: desc,
    alternates: { canonical: path },
    openGraph: {
      type: "website",
      siteName: site.name,
      locale: "en",
      url: path,
      title: fullTitle,
      description: desc,
      images,
    },
    twitter: {
      card: "summary_large_image",
      title: fullTitle,
      description: desc,
      images: images.map((i) => i.url),
    },
  };
}
