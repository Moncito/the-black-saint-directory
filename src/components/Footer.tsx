import { hero, site, startHref, cta } from "@/content/site";
import { projects } from "@/content/projects";
import { saints } from "@/content/team";
import { TLink } from "./Transition";
import { ManilaClock } from "./ManilaClock";
import { FooterCta } from "./FooterCta";

const columns = [
  {
    title: "Studio",
    links: [
      { label: "Studio", href: "/studio" },
      { label: "Services", href: "/services" },
      { label: "Process", href: "/process" },
    ],
  },
  {
    title: "Work",
    links: [
      { label: "Work", href: "/work" },
      ...projects.slice(0, 3).map((p) => ({ label: p.name, href: `/work/${p.slug}` })),
    ],
  },
];

// Studio social accounts are still being set up; until then, the founders.
const connect = saints.flatMap((saint) =>
  saint.links
    .filter((link) => link.label === "LinkedIn")
    .map((link) => ({ label: `${saint.name.split(" ")[0]} — LinkedIn`, href: link.href })),
);

const linkClass = "t-small inline-flex min-h-9 items-center text-steel transition-colors duration-500 hover:text-ink";

export function Footer() {
  return (
    <footer className="surface-paper relative z-10 px-3 pb-6 pt-3 md:px-5 md:pt-5">
      <FooterCta />

      <div className="gutter grid gap-14 pb-16 pt-16 md:grid-cols-[1.3fr_2fr] md:pt-24">
        <div>
          <TLink href="/" aria-label={`${site.name} — home`} className="-ml-3 inline-block">
            {/* The logo is always the file, never live text. */}
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src="/brand/logos/svg/bsd-primary-ink.svg"
              alt=""
              width={778}
              height={300}
              loading="lazy"
              className="h-20 w-auto md:h-24"
            />
          </TLink>
          <p className="t-body mt-4 max-w-[26ch] text-steel">
            {hero.line1} <em className="t-accent font-display">{hero.line2}</em>
          </p>
        </div>

        <nav aria-label="Footer" className="grid grid-cols-2 gap-x-8 gap-y-12 sm:grid-cols-3">
          {columns.map((column) => (
            <div key={column.title}>
              <h2 className="t-h3 text-[20px]">{column.title}</h2>
              <ul className="mt-4">
                {column.links.map((link) => (
                  <li key={link.href}>
                    <TLink href={link.href} className={linkClass}>
                      <span className="link-line">{link.label}</span>
                    </TLink>
                  </li>
                ))}
              </ul>
            </div>
          ))}
          <div>
            <h2 className="t-h3 text-[20px]">Connect</h2>
            <ul className="mt-4">
              <li>
                <TLink href={startHref} className={linkClass}>
                  <span className="link-line">{cta.action}</span>
                </TLink>
              </li>
              {connect.map((link) => (
                <li key={link.href}>
                  <a
                    href={link.href}
                    target="_blank"
                    rel="noopener noreferrer"
                    data-cursor="Open"
                    className={linkClass}
                  >
                    <span className="link-line">{link.label}</span>
                    <span className="sr-only"> (opens in a new tab)</span>
                  </a>
                </li>
              ))}
            </ul>
          </div>
        </nav>
      </div>

      <div className="gutter">
        <div className="t-label flex flex-wrap items-center justify-between gap-x-10 gap-y-3 border-t border-bone pt-6 text-steel">
          <span>{site.location}</span>
          <ManilaClock />
          <span>© 2026 {site.name}</span>
        </div>
      </div>
    </footer>
  );
}
