import { Link } from "@tanstack/react-router";
import { siteConfig } from "@/config/site";
import { cn } from "@/lib/utils";

export function Logo({ className, to = "/" }: { className?: string | undefined; to?: string | undefined }) {
  return (
    <Link
      to={to}
      className={cn("flex items-center gap-2.5 focus-visible:outline-none", className)}
      aria-label={`${siteConfig.name} home`}
    >
      {siteConfig.logo.imageUrl ? (
        <img src={siteConfig.logo.imageUrl} alt="" className="h-9 w-9 rounded-xl" />
      ) : (
        <span className="bg-brand-gradient grid h-9 w-9 place-items-center rounded-xl text-sm font-bold text-primary-foreground">
          {siteConfig.logo.initials}
        </span>
      )}
      <span className="text-base font-semibold tracking-tight">{siteConfig.name}</span>
    </Link>
  );
}
