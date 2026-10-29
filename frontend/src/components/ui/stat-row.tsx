import * as React from "react";
import { cn } from "@/lib/utils";

/**
 * StatRow — A compact stat display for dashboard metrics.
 * Shows label, value, and optional icon/trend badge.
 */
export function StatRow({
  label,
  value,
  subtitle,
  icon,
  trend,
  className,
}: {
  label: string;
  value: string | number;
  subtitle?: string;
  icon?: React.ReactNode;
  trend?: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={cn("p-4 rounded-lg bg-card border border-border/60", className)}>
      <p className="text-label-sm text-muted-foreground font-display uppercase tracking-wider">
        {label}
      </p>
      <div className="flex items-end gap-2 mt-1.5">
        <span className="text-2xl font-bold font-display tracking-tight">{value}</span>
        {icon}
        {trend}
      </div>
      {subtitle && (
        <p className="text-label-sm text-muted-foreground mt-0.5">{subtitle}</p>
      )}
    </div>
  );
}

/**
 * ListRow — A row item for lists (PRs, recent workouts, etc.).
 * Icon circle on the left, content in the middle, action/badge on right.
 */
export function ListRow({
  icon,
  title,
  subtitle,
  action,
  className,
  onClick,
}: {
  icon: React.ReactNode;
  title: React.ReactNode;
  subtitle?: React.ReactNode;
  action?: React.ReactNode;
  className?: string;
  onClick?: () => void;
}) {
  return (
    <div
      className={cn(
        "flex items-center gap-3 p-3 rounded-lg transition-colors hover:bg-surface-container-low",
        onClick && "cursor-pointer",
        className
      )}
      onClick={onClick}
    >
      <div className="w-10 h-10 rounded-xl bg-surface-container flex items-center justify-center shrink-0">
        {icon}
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-semibold truncate">{title}</p>
        {subtitle && (
          <p className="text-label-sm text-muted-foreground truncate mt-0.5">
            {subtitle}
          </p>
        )}
      </div>
      {action && <div className="shrink-0">{action}</div>}
    </div>
  );
}

/**
 * Chip — Small pill-shaped tag for muscle groups, statuses, etc.
 */
export function Chip({
  children,
  active,
  onClick,
  variant = "default",
  className,
}: {
  children: React.ReactNode;
  active?: boolean;
  onClick?: () => void;
  variant?: "default" | "primary" | "outline";
  className?: string;
}) {
  const base = "inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-label-md font-display transition-all duration-150";

  const variants = {
    default: active
      ? "bg-primary text-primary-foreground shadow-sm"
      : "bg-surface-container text-muted-foreground hover:bg-surface-container-high hover:text-foreground",
    primary: "bg-primary/10 text-primary border border-primary/20",
    outline: active
      ? "bg-primary text-primary-foreground border border-primary"
      : "bg-card text-muted-foreground border border-border/60 hover:bg-surface-container hover:text-foreground",
  };

  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(base, variants[variant], className)}
    >
      {children}
    </button>
  );
}
