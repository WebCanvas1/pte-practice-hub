import { useState } from "react";
import type { ReactNode } from "react";
import { Link, useRouterState } from "@tanstack/react-router";
import { LogOut, Menu } from "lucide-react";

import { Logo } from "@/components/layout/Logo";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import type { NavItem } from "@/config/navigation";
import { useAuth } from "@/lib/auth";
import { cn } from "@/lib/utils";

interface DashboardLayoutProps {
  items: NavItem[];
  areaLabel: string;
  children: ReactNode;
}

function NavLinks({ items, onNavigate }: { items: NavItem[]; onNavigate?: (() => void) | undefined }) {
  const pathname = useRouterState({ select: (s) => s.location.pathname });

  return (
    <ul className="grid gap-1">
      {items.map((item) => {
        const active = item.exact ? pathname === item.to : pathname.startsWith(item.to);
        return (
          <li key={item.to}>
            <Link
              to={item.to}
              onClick={onNavigate}
              aria-current={active ? "page" : undefined}
              className={cn(
                "flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
                active
                  ? "bg-primary/10 text-primary"
                  : "text-muted-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground",
              )}
            >
              <item.icon className="h-4 w-4 shrink-0" aria-hidden="true" />
              <span className="truncate">{item.label}</span>
            </Link>
          </li>
        );
      })}
    </ul>
  );
}

export function DashboardLayout({ items, areaLabel, children }: DashboardLayoutProps) {
  const [open, setOpen] = useState(false);
  const { user, signOut } = useAuth();

  const sidebarBody = (onNavigate?: () => void) => (
    <div className="flex h-full flex-col gap-6 p-4">
      <Logo />
      <div className="flex-1 overflow-y-auto">
        <p className="px-3 pb-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
          {areaLabel}
        </p>
        <nav aria-label={`${areaLabel} navigation`}>
          <NavLinks items={items} onNavigate={onNavigate} />
        </nav>
      </div>
      <div className="border-t border-sidebar-border pt-4">
        <div className="px-3 pb-3">
          <p className="truncate text-sm font-medium">{user?.name ?? "Guest"}</p>
          <p className="truncate text-xs text-muted-foreground">{user?.email ?? "not signed in"}</p>
        </div>
        <Button variant="outline" className="w-full justify-start gap-3" onClick={signOut} asChild>
          <Link to="/" onClick={signOut}>
            <LogOut className="h-4 w-4" aria-hidden="true" />
            Logout
          </Link>
        </Button>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-secondary/40">
      <aside className="fixed inset-y-0 left-0 hidden w-64 border-r border-sidebar-border bg-sidebar lg:block">
        {sidebarBody()}
      </aside>

      <div className="lg:pl-64">
        <header className="sticky top-0 z-30 flex h-16 items-center gap-3 border-b border-border bg-background/90 px-4 backdrop-blur sm:px-6">
          <Sheet open={open} onOpenChange={setOpen}>
            <SheetTrigger asChild>
              <Button variant="outline" size="icon" className="lg:hidden" aria-label="Open menu">
                <Menu />
              </Button>
            </SheetTrigger>
            <SheetContent side="left" className="w-72 bg-sidebar p-0">
              <SheetTitle className="sr-only">{areaLabel} navigation</SheetTitle>
              {sidebarBody(() => setOpen(false))}
            </SheetContent>
          </Sheet>

          <p className="text-sm font-semibold">{areaLabel}</p>

          <div className="ml-auto flex items-center gap-2">
            <Button asChild variant="ghost" size="sm">
              <Link to="/">Back to site</Link>
            </Button>
          </div>
        </header>

        <div className="mx-auto w-full max-w-6xl px-4 py-8 sm:px-6">{children}</div>
      </div>
    </div>
  );
}
