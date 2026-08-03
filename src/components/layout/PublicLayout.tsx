import { useState } from "react";
import type { ReactNode } from "react";
import { Link, useRouterState } from "@tanstack/react-router";
import { Menu, X } from "lucide-react";

import { Logo } from "@/components/layout/Logo";
import { Button } from "@/components/ui/button";
import { legalNav, publicNav } from "@/config/navigation";
import { formatPrice, pricingConfig, siteConfig } from "@/config/site";

export function PublicLayout({ children }: { children: ReactNode }) {
  const [open, setOpen] = useState(false);
  const pathname = useRouterState({ select: (s) => s.location.pathname });

  return (
    <div className="flex min-h-screen flex-col bg-background">
      <a
        href="#main"
        className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-4 focus:z-50 focus:rounded-md focus:bg-primary focus:px-4 focus:py-2 focus:text-sm focus:text-primary-foreground"
      >
        Skip to content
      </a>

      <header className="sticky top-0 z-40 border-b border-border/80 bg-background/90 backdrop-blur">
        <div className="mx-auto flex h-16 w-full max-w-6xl items-center justify-between gap-4 px-4 sm:px-6">
          <Logo />

          <nav aria-label="Main navigation" className="hidden items-center gap-1 lg:flex">
            {publicNav.map((item) => (
              <Link
                key={item.to}
                to={item.to}
                className="rounded-lg px-3 py-2 text-sm font-medium text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground data-[status=active]:bg-secondary data-[status=active]:text-foreground"
                activeOptions={{ exact: item.to === "/" }}
              >
                {item.label}
              </Link>
            ))}
          </nav>

          <div className="hidden items-center gap-2 lg:flex">
            <Button asChild variant="ghost">
              <Link to="/login">Log in</Link>
            </Button>
            <Button asChild variant="hero">
              <Link to="/register">Start for {formatPrice(pricingConfig.modulePrice)}</Link>
            </Button>
          </div>

          <Button
            variant="outline"
            size="icon"
            className="lg:hidden"
            aria-expanded={open}
            aria-controls="mobile-nav"
            aria-label={open ? "Close menu" : "Open menu"}
            onClick={() => setOpen((v) => !v)}
          >
            {open ? <X /> : <Menu />}
          </Button>
        </div>

        {open ? (
          <div id="mobile-nav" className="border-t border-border bg-background lg:hidden">
            <nav aria-label="Mobile navigation" className="mx-auto grid max-w-6xl gap-1 px-4 py-3">
              {publicNav.map((item) => (
                <Link
                  key={item.to}
                  to={item.to}
                  onClick={() => setOpen(false)}
                  className="rounded-lg px-3 py-2.5 text-sm font-medium text-muted-foreground hover:bg-secondary hover:text-foreground data-[status=active]:bg-secondary data-[status=active]:text-foreground"
                  activeOptions={{ exact: item.to === "/" }}
                >
                  {item.label}
                </Link>
              ))}
              <div className="mt-2 grid gap-2">
                <Button asChild variant="outline">
                  <Link to="/login" onClick={() => setOpen(false)}>
                    Log in
                  </Link>
                </Button>
                <Button asChild variant="hero">
                  <Link to="/register" onClick={() => setOpen(false)}>
                    Create free account
                  </Link>
                </Button>
              </div>
            </nav>
          </div>
        ) : null}
      </header>

      <main id="main" key={pathname} className="flex-1">
        {children}
      </main>

      <footer className="border-t border-border bg-soft-gradient">
        <div className="mx-auto grid w-full max-w-6xl gap-10 px-4 py-12 sm:px-6 md:grid-cols-4">
          <div className="md:col-span-2">
            <Logo />
            <p className="mt-3 max-w-sm text-sm text-muted-foreground">{siteConfig.description}</p>
            <p className="mt-4 text-sm text-muted-foreground">
              Support:{" "}
              <a className="text-primary hover:underline" href={`mailto:${siteConfig.supportEmail}`}>
                {siteConfig.supportEmail}
              </a>
            </p>
          </div>

          <nav aria-label="Footer navigation">
            <h2 className="text-sm font-semibold">Platform</h2>
            <ul className="mt-3 space-y-2">
              {publicNav.map((item) => (
                <li key={item.to}>
                  <Link
                    to={item.to}
                    className="text-sm text-muted-foreground hover:text-foreground hover:underline"
                  >
                    {item.label}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>

          <nav aria-label="Legal navigation">
            <h2 className="text-sm font-semibold">Legal</h2>
            <ul className="mt-3 space-y-2">
              {legalNav.map((item) => (
                <li key={item.to}>
                  <Link
                    to={item.to}
                    className="text-sm text-muted-foreground hover:text-foreground hover:underline"
                  >
                    {item.label}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>
        </div>

        <div className="border-t border-border/70">
          <div className="mx-auto flex w-full max-w-6xl flex-col gap-2 px-4 py-6 text-xs text-muted-foreground sm:flex-row sm:items-center sm:justify-between sm:px-6">
            <p>
              © {new Date().getFullYear()} {siteConfig.company.legalName}. All rights reserved.
            </p>
            <p>{pricingConfig.labels.taxNote}</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
