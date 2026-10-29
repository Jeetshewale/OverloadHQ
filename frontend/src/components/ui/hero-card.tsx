import * as React from "react";
import { cn } from "@/lib/utils";

/**
 * HeroCard — Full-width dark card for weekly milestone / summary data.
 * Matches the dark hero card from the Stitch prototype.
 */
export function HeroCard({
  children,
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn("hero-card p-6 md:p-8 shadow-xl", className)}
      {...props}
    >
      {/* Atmospheric glow effects */}
      <div className="absolute -right-20 -top-20 w-80 h-80 rounded-full bg-primary/15 blur-[80px] pointer-events-none" />
      <div className="absolute -left-20 -bottom-20 w-60 h-60 rounded-full bg-accent-amber/10 blur-[60px] pointer-events-none" />
      <div className="relative z-10">{children}</div>
    </div>
  );
}

/**
 * HeroStat — Stat chip inside the hero card (pill-shaped, glass background).
 */
export function HeroStat({
  icon,
  label,
  value,
  className,
}: {
  icon: React.ReactNode;
  label: string;
  value: string | number;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "flex items-center gap-3 px-4 py-3 bg-white/5 backdrop-blur-sm rounded-full transition-transform duration-200 hover:bg-white/10 hover:scale-[1.02]",
        className
      )}
    >
      <div className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center shrink-0">
        {icon}
      </div>
      <div className="flex flex-col min-w-0">
        <span className="text-label-sm text-white/50 uppercase tracking-wider truncate font-display">
          {label}
        </span>
        <span className="text-headline-sm text-white font-bold truncate font-display">
          {value}
        </span>
      </div>
    </div>
  );
}
