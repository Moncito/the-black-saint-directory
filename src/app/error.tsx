"use client";

import { useEffect } from "react";

/**
 * Route-level error boundary. If a page ever fails to render, the visitor
 * gets the site's own screen and a way forward instead of the framework's.
 * The nav and footer stay in place around it.
 */
export default function RouteError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <section className="gutter flex min-h-[100svh] flex-col justify-center pt-[var(--spacing-nav)]">
      <p className="t-label text-fog">Error</p>
      <h1 className="t-h1 mt-6 max-w-[14ch]">This page did not load.</h1>
      <div className="mt-10 flex flex-wrap gap-3">
        <button type="button" onClick={reset} className="intro__button t-label">
          Try again
        </button>
        {/* A full page load, on purpose: it clears whatever state went wrong. */}
        {/* eslint-disable-next-line @next/next/no-html-link-for-pages */}
        <a
          href="/"
          className="intro__button intro__button--quiet t-label inline-flex items-center"
        >
          Home
        </a>
      </div>
    </section>
  );
}
