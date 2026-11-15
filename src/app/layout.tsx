import type { Metadata, Viewport } from "next";
import type { ReactNode } from "react";
import { Inter, Inter_Tight, Geist_Mono } from "next/font/google";
import { site } from "@/content/site";
import { Providers } from "@/components/Providers";
import { Nav } from "@/components/Nav";
import { Footer } from "@/components/Footer";
import { SceneRoot } from "@/scene/SceneRoot";
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
  title: { default: site.name, template: `%s — ${site.name}` },
  description: site.description,
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
  },
};

export const viewport: Viewport = {
  themeColor: "#0a0a0a",
  colorScheme: "dark",
};

/**
 * Runs before first paint: enables motion styling only when the visitor has
 * not asked for reduced motion, and un-hides everything if the reveal system
 * never reports ready (so content is never held hostage by JS).
 */
const bootScript = `(function(){var d=document.documentElement;if(!matchMedia('(prefers-reduced-motion: reduce)').matches){d.classList.add('motion-ok');setTimeout(function(){if(!d.classList.contains('motion-ready'))d.classList.remove('motion-ok')},5000)}})()`;

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
          <Nav />
          <main id="main" tabIndex={-1} className="relative z-10 outline-none">
            {children}
          </main>
          <Footer />
        </Providers>
        <div aria-hidden="true" className="grain" />
      </body>
    </html>
  );
}
