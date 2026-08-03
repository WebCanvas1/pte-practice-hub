import type { ReactNode } from "react";
import { Link } from "@tanstack/react-router";

import { Logo } from "@/components/layout/Logo";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { legalNav } from "@/config/navigation";
import { siteConfig } from "@/config/site";

/** Shared shell for login / register / forgot-password screens. */
export function AuthLayout({
  title,
  description,
  children,
  footer,
}: {
  title: string;
  description: string;
  children: ReactNode;
  footer?: ReactNode;
}) {
  return (
    <div className="grid min-h-screen bg-soft-gradient lg:grid-cols-2">
      <div className="hidden flex-col justify-between border-r border-border bg-brand-gradient p-10 lg:flex">
        <Link to="/" className="text-lg font-semibold text-primary-foreground">
          {siteConfig.name}
        </Link>
        <div>
          <h2 className="max-w-sm text-3xl font-semibold leading-tight text-primary-foreground">
            {siteConfig.tagline}
          </h2>
          <p className="mt-4 max-w-sm text-primary-foreground/85">{siteConfig.description}</p>
        </div>
        <ul className="flex flex-wrap gap-4 text-xs text-primary-foreground/75">
          {legalNav.map((item) => (
            <li key={item.to}>
              <Link to={item.to} className="hover:underline">
                {item.label}
              </Link>
            </li>
          ))}
        </ul>
      </div>

      <div className="flex items-center justify-center px-4 py-12 sm:px-6">
        <div className="w-full max-w-md">
          <div className="mb-6 lg:hidden">
            <Logo />
          </div>
          <Card className="shadow-card">
            <CardHeader>
              <CardTitle className="text-2xl">{title}</CardTitle>
              <CardDescription>{description}</CardDescription>
            </CardHeader>
            <CardContent>{children}</CardContent>
          </Card>
          {footer ? <div className="mt-5 text-center text-sm">{footer}</div> : null}
        </div>
      </div>
    </div>
  );
}
