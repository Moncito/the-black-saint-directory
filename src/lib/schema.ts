import { site, hero } from "@/content/site";
import { services, type Service } from "@/content/services";
import { projects, type Project } from "@/content/projects";
import { saints } from "@/content/team";
import { packages } from "@/content/pricing";
import { siteUrl } from "./seo";

/**
 * Structured data (schema.org JSON-LD). Everything here is built from the
 * content files — no copy is written for search engines alone. Entities link
 * to each other by @id, so Google and AI search read one connected graph:
 * the studio, its website, its services, its work and its founders.
 */

const url = (path = "/") => `${siteUrl}${path === "/" ? "/" : path}`;

export const ids = {
  org: `${siteUrl}/#studio`,
  website: `${siteUrl}/#website`,
  person: (slug: string) => `${siteUrl}/studio#${slug}`,
  service: (slug: string) => `${siteUrl}/services/${slug}#service`,
  work: (slug: string) => `${siteUrl}/work/${slug}#work`,
};

/** Packages that belong to each service line, from the price book. */
const servicePackages: Record<string, string[]> = {
  "editorial-sites": ["editorial-essential", "editorial-signature"],
  "immersive-3d": ["immersive-scene", "immersive-flagship"],
  systems: ["systems-discovery", "systems-build"],
  mobile: ["mobile-app"],
};

export const packagesFor = (slug: string) =>
  (servicePackages[slug] ?? []).map((id) => packages.find((p) => p.id === id)!).filter(Boolean);

/** The studio and the website — on every page. */
export function siteGraph() {
  const lowest = Math.min(...packages.map((p) => p.php.low));
  return [
    {
      "@type": "ProfessionalService",
      "@id": ids.org,
      name: site.name,
      url: url(),
      logo: { "@type": "ImageObject", url: `${siteUrl}/brand/logos/png/bsd-primary-ink.png` },
      image: `${siteUrl}/og/default.jpg`,
      description: site.description,
      slogan: `${hero.line1} ${hero.line2}`,
      foundingDate: "2026",
      email: "hello@blacksaintdirectory.studio",
      address: { "@type": "PostalAddress", addressLocality: "Manila", addressCountry: "PH" },
      areaServed: [
        { "@type": "City", name: "Manila" },
        { "@type": "Country", name: "Philippines" },
      ],
      priceRange: `From ₱${lowest.toLocaleString("en-PH")}`,
      currenciesAccepted: "PHP, USD",
      knowsAbout: ["Web design", "Web development", "WebGL", "3D websites", "Web applications", "Mobile apps"],
      founder: saints.map((s) => ({ "@id": ids.person(s.slug) })),
      hasOfferCatalog: {
        "@type": "OfferCatalog",
        name: "Services",
        itemListElement: services.map((s) => ({ "@id": ids.service(s.slug) })),
      },
    },
    {
      "@type": "WebSite",
      "@id": ids.website,
      url: url(),
      name: site.name,
      description: site.description,
      inLanguage: "en",
      publisher: { "@id": ids.org },
    },
  ];
}

export function breadcrumbs(trail: { name: string; path: string }[]) {
  return {
    "@type": "BreadcrumbList",
    itemListElement: [{ name: "Home", path: "/" }, ...trail].map((item, i) => ({
      "@type": "ListItem",
      position: i + 1,
      name: item.name,
      item: url(item.path),
    })),
  };
}

export function serviceNode(service: Service) {
  const pkgs = packagesFor(service.slug);
  return {
    "@type": "Service",
    "@id": ids.service(service.slug),
    name: service.name,
    serviceType: service.name,
    description: service.description,
    url: url(`/services/${service.slug}`),
    provider: { "@id": ids.org },
    areaServed: { "@type": "Country", name: "Philippines" },
    offers: pkgs.map((p) => ({
      "@type": "Offer",
      name: p.name,
      description: p.scope,
      priceSpecification: {
        "@type": "PriceSpecification",
        priceCurrency: "PHP",
        minPrice: p.php.low,
        ...(p.php.open ? {} : { maxPrice: p.php.high }),
      },
    })),
  };
}

export function servicesList() {
  return {
    "@type": "ItemList",
    name: "Services",
    itemListElement: services.map((s, i) => ({
      "@type": "ListItem",
      position: i + 1,
      item: serviceNode(s),
    })),
  };
}

export function workNode(project: Project) {
  const name = project.badge ? `${project.name} (${project.badge})` : project.name;
  return {
    "@type": "CreativeWork",
    "@id": ids.work(project.slug),
    name,
    headline: name,
    description: project.summary ?? project.sections.map((s) => s.text).join(" "),
    genre: project.meta,
    url: url(`/work/${project.slug}`),
    image: `${siteUrl}/og/${project.slug}.jpg`,
    creator: { "@id": ids.org },
    inLanguage: "en",
    ...(project.live ? { sameAs: project.live } : {}),
  };
}

export function workList() {
  return {
    "@type": "ItemList",
    name: "Work",
    itemListElement: projects.map((p, i) => ({
      "@type": "ListItem",
      position: i + 1,
      url: url(`/work/${p.slug}`),
      name: p.badge ? `${p.name} (${p.badge})` : p.name,
    })),
  };
}

export function people() {
  return saints.map((s) => ({
    "@type": "Person",
    "@id": ids.person(s.slug),
    name: s.name,
    jobTitle: s.role,
    description: s.bio,
    image: `${siteUrl}${s.portrait}`,
    worksFor: { "@id": ids.org },
    sameAs: s.links.map((l) => l.href),
  }));
}

/** Wrap nodes as one JSON-LD document. */
export const graph = (...nodes: object[]) => ({
  "@context": "https://schema.org",
  "@graph": nodes.flat(),
});
