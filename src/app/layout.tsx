import type { Metadata, Viewport } from "next";
import type { ReactNode } from "react";
import { Inter, Inter_Tight, Geist_Mono } from "next/font/google";
import { site } from "@/content/site";
import { Providers } from "@/components/Providers";
import { Nav } from "@/components/Nav";
import { Footer } from "@/components/Footer";
import { FooterLift } from "@/components/FooterLift";
import { Intro } from "@/components/Intro";
import { SceneRoot } from "@/scene/SceneRoot";
import { pageMeta, siteUrl } from "@/lib/seo";
import { saints } from "@/content/team";
import { Analytics } from "@vercel/analytics/next";
import "./globals.css";

const interTight = Inter_Tight({
  subsets: ["latin"],
  style: ["normal", "italic"],
  variable: "--font-inter-tight",
  display: "swap",
});

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
});

const geistMono = Geist_Mono({
  subsets: ["latin"],
  weight: ["500"],
  variable: "--font-geist-mono",
  display: "swap",
});

export const metadata: Metadata = {
  ...pageMeta({ path: "/" }),
  metadataBase: new URL(siteUrl),
  title: { default: site.name, template: `%s — ${site.name}` },
  applicationName: site.name,
  icons: {
    icon: [
      {
        url: "/brand/logos/svg/bsd-simplified-white.svg",
        type: "image/svg+xml",
        media: "(prefers-color-scheme: dark)",
      },
      {
        url: "/brand/logos/svg/bsd-simplified-ink.svg",
        type: "image/svg+xml",
        media: "(prefers-color-scheme: light)",
      },
    ],
    apple: { url: "/apple-touch-icon.png", sizes: "180x180" },
  },
};

/** Structured data for search: who the studio is, where, and who runs it. */
const organization = {
  "@context": "https://schema.org",
  "@type": "Organization",
  name: site.name,
  url: siteUrl,
  logo: `${siteUrl}/brand/logos/png/bsd-primary-ink.png`,
  description: site.description,
  slogan: "Every person is a saint of their own life.",
  foundingDate: "2026",
  address: { "@type": "PostalAddress", addressLocality: "Manila", addressCountry: "PH" },
  founder: saints.map((s) => ({
    "@type": "Person",
    name: s.name,
    jobTitle: s.role,
    sameAs: s.links.map((l) => l.href),
  })),
};

export const viewport: Viewport = {
  themeColor: "#0a0a0a",
  colorScheme: "dark",
};

/**
 * Runs before first paint. Decides whether this session still owes the visitor
 * the intro (once per session; ?intro=0 skips it), and enables motion styling
 * only when reduced motion is not requested. Both have failsafes: if the app
 * never boots, everything is un-hidden, so content is never held hostage by JS.
 */
const bootScript = `(function(){var d=document.documentElement,c=d.classList,q=location.search,seen=false;try{seen=!!sessionStorage.getItem('bsd-intro')}catch(e){}if(/[?&]intro=0/.test(q))seen=true;if(/[?&](intro=1|capture)/.test(q))seen=false;if(!seen){c.add('intro-pending');setTimeout(function(){if(!window.__bsdIntro)c.remove('intro-pending')},6000)}if(!matchMedia('(prefers-reduced-motion: reduce)').matches){c.add('motion-ok');setTimeout(function(){if(!c.contains('motion-ready')&&!c.contains('intro-pending'))c.remove('motion-ok')},5000)}})()`;

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html
      lang="en"
      className={`${interTight.variable} ${inter.variable} ${geistMono.variable}`}
      suppressHydrationWarning
    >
      <head>
        <script dangerouslySetInnerHTML={{ __html: bootScript }} />
      </head>
      <body className="surface-ink bg-ink text-white">
        <a
          href="#main"
          className="t-label fixed left-4 top-4 z-[100] -translate-y-24 bg-white px-4 py-3 text-ink focus:translate-y-0"
        >
          Skip to content
        </a>
        <Providers>
          <SceneRoot />
          <Intro />
          <Nav />
          <main id="main" tabIndex={-1} className="relative z-10 outline-none">
            {children}
          </main>
          <FooterLift>
            <Footer />
          </FooterLift>
        </Providers>
        <div aria-hidden="true" className="grain" />
        {/* Cookieless, privacy-friendly. Collects only once enabled in the Vercel project. */}
        <Analytics />
        <script
          type="application/ld+json"
          // Built only from our own content files, never from visitor input.
          dangerouslySetInnerHTML={{ __html: JSON.stringify(organization) }}
        />
      </body>
    </html>
  );
}
