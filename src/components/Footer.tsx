import { nav, site, startHref, cta } from "@/content/site";
import { TLink } from "./Transition";
import { ManilaClock } from "./ManilaClock";

/** Phase 1 footer. The reveal and the coiling line arrive in Phase 3. */
export function Footer() {
  return (
    <footer className="gutter relative z-10 border-t border-graphite bg-ink pb-8 pt-20">
      <div className="grid gap-14 md:grid-cols-[1fr_auto] md:items-end">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src="/brand/logos/svg/bsd-secondary-white.svg"
          alt={site.name}
          width={448}
          height={434}
          loading="lazy"
          className="-ml-4 h-48 w-auto md:h-64"
        />
        <nav aria-label="Footer">
          <ul className="grid grid-cols-2 gap-x-14 gap-y-1">
            {[...nav, { label: cta.action, href: startHref }].map((item) => (
              <li key={item.href}>
                <TLink href={item.href} className="t-label inline-flex h-11 items-center">
                  <span className="link-line">{item.label}</span>
                </TLink>
              </li>
            ))}
          </ul>
        </nav>
      </div>
      <div className="t-label mt-16 flex flex-wrap items-center justify-between gap-x-10 gap-y-3 border-t border-graphite pt-6 text-fog">
        <span>{site.location}</span>
        <ManilaClock />
        <span>© 2026 {site.name}</span>
      </div>
    </footer>
  );
}
