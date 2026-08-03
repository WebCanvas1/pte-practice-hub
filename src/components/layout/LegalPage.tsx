import type { ReactNode } from "react";

import { PublicLayout } from "@/components/layout/PublicLayout";
import { siteConfig } from "@/config/site";

export function LegalPage({
  title,
  updated,
  children,
}: {
  title: string;
  updated: string;
  children: ReactNode;
}) {
  return (
    <PublicLayout>
      <section className="bg-soft-gradient">
        <div className="mx-auto w-full max-w-3xl px-4 py-14 sm:px-6">
          <h1 className="text-3xl font-semibold tracking-tight sm:text-4xl">{title}</h1>
          <p className="mt-3 text-sm text-muted-foreground">Last updated: {updated}</p>
        </div>
      </section>

      <section className="mx-auto w-full max-w-3xl px-4 py-12 sm:px-6">
        <div className="grid gap-8 text-sm leading-relaxed text-muted-foreground [&_h2]:text-base [&_h2]:font-semibold [&_h2]:text-foreground [&_li]:ml-5 [&_li]:list-disc">
          {children}
          <p>
            Questions about this document? Email{" "}
            <a className="text-primary hover:underline" href={`mailto:${siteConfig.supportEmail}`}>
              {siteConfig.supportEmail}
            </a>
            .
          </p>
        </div>
      </section>
    </PublicLayout>
  );
}
