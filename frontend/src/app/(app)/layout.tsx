"use client";
// ---------------------------------------------------------------
// OverloadHQ – Authenticated App Shell Layout
// Prototype-matched pill tab navigation, floating bottom bar.
// ---------------------------------------------------------------

import { useAuth } from "@/lib/auth-context";
import { useRouter, usePathname } from "next/navigation";
import { useEffect } from "react";
import { APP_NAME } from "@/lib/config";
import {
  LayoutDashboard,
  Dumbbell,
  TrendingUp,
  Brain,
  User,
  Calendar,
  Sun,
  Moon,
  Monitor,
  LogOut,
  Loader2,
  Plus,
  Settings,
} from "lucide-react";
import Link from "next/link";
import { useTheme } from "@/lib/theme-context";

const NAV_ITEMS = [
  { href: "/dashboard", label: "Overview", icon: LayoutDashboard },
  { href: "/log", label: "Workouts", icon: Dumbbell },
  { href: "/progress", label: "Progress", icon: TrendingUp },
  { href: "/ai-coach", label: "AI Coach", icon: Brain },
  { href: "/profile", label: "Settings", icon: Settings },
];

// Mobile bottom bar shows only 5 items
const MOBILE_NAV_ITEMS = NAV_ITEMS;

export default function AppLayout({ children }: { children: React.ReactNode }) {
  const { user, loading, isBackendAwake, logout } = useAuth();
  const router = useRouter();
  const pathname = usePathname();
  const { theme, resolvedTheme, toggleTheme } = useTheme();

  const handleLogout = async () => {
    try {
      await logout();
    } catch (e) {
      console.error(e);
    }
    window.location.href = "/";
  };

  useEffect(() => {
    if (!loading && !user) {
      router.push("/login");
    }
  }, [user, loading, router]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center space-y-4">
          <Loader2 className="h-10 w-10 animate-spin text-primary mx-auto" />
          {!isBackendAwake && (
            <p className="text-muted-foreground text-sm max-w-xs mx-auto">
              Waking up the server — this can take up to a minute on the free tier...
            </p>
          )}
        </div>
      </div>
    );
  }

  if (!user) return null;

  const themeIcon =
    theme === "dark" ? (
      <Moon className="h-[18px] w-[18px]" />
    ) : theme === "light" ? (
      <Sun className="h-[18px] w-[18px] text-amber-500" />
    ) : (
      <Monitor className="h-[18px] w-[18px]" />
    );

  const themeLabel =
    theme === "dark" ? "Dark" : theme === "light" ? "Light" : "System";

  return (
    <div className="min-h-screen pb-20 md:pb-0">
      {/* ─── Top Navigation Bar ─── */}
      <header className="fixed top-0 left-0 right-0 z-50 glass shadow-[0_1px_8px_rgba(0,0,0,0.04)]">
        <div className="max-w-7xl mx-auto px-5 md:px-8 h-[72px] flex items-center justify-between gap-6">
          {/* Left: Logo + Desktop Nav */}
          <div className="flex items-center gap-8">
            <Link href="/dashboard" className="flex items-center gap-2 group">
              <div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center text-primary-foreground shadow-sm transition-transform duration-200 group-hover:scale-105">
                <Dumbbell className="h-4 w-4" />
              </div>
              <span className="font-display font-bold text-headline-sm tracking-tight">
                Overload<span className="text-primary">HQ</span>
              </span>
            </Link>

            {/* Desktop pill tab navigation */}
            <nav className="hidden lg:flex items-center gap-1 p-1 bg-surface-container-low rounded-full">
              {NAV_ITEMS.map((item) => {
                const isActive =
                  pathname === item.href ||
                  (item.href !== "/dashboard" && pathname.startsWith(item.href));
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={`px-4 py-1.5 font-display text-label-md transition-all duration-150 rounded-full ${
                      isActive
                        ? "bg-surface-container-high text-foreground font-semibold"
                        : "text-muted-foreground hover:text-foreground"
                    }`}
                  >
                    {item.label}
                  </Link>
                );
              })}
              {/* History link */}
              <Link
                href="/history"
                className={`px-4 py-1.5 font-display text-label-md transition-all duration-150 rounded-full ${
                  pathname.startsWith("/history")
                    ? "bg-surface-container-high text-foreground font-semibold"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                History
              </Link>
            </nav>
          </div>

          {/* Right: Theme toggle + Log Workout CTA + User */}
          <div className="flex items-center gap-3">
            {/* Theme toggle */}
            <button
              type="button"
              onClick={toggleTheme}
              title={`Theme: ${themeLabel}`}
              className="w-10 h-10 rounded-full flex items-center justify-center bg-surface-container text-foreground hover:bg-surface-container-high transition-colors duration-150"
              aria-label={`Theme: ${themeLabel}`}
            >
              {themeIcon}
            </button>

            {/* Log Workout CTA */}
            <Link href="/log" className="hidden sm:block">
              <button className="inline-flex items-center gap-2 px-5 py-2.5 h-[44px] bg-primary text-primary-foreground font-display text-label-lg rounded-full shadow-sm hover:opacity-95 active:scale-[0.98] transition-all duration-150">
                <Plus className="h-[18px] w-[18px]" />
                <span>Log Workout</span>
              </button>
            </Link>

            {/* User avatar + name */}
            <Link
              href="/profile"
              className="flex items-center gap-2 pl-1"
            >
              <div className="w-8 h-8 rounded-full bg-primary/15 border border-primary/25 flex items-center justify-center">
                <User className="h-4 w-4 text-primary" />
              </div>
              <div className="hidden md:flex flex-col text-left">
                <span className="font-display text-label-md text-foreground leading-tight">
                  {user.name}
                </span>
              </div>
            </Link>
          </div>
        </div>
      </header>

      {/* ─── Main Content ─── */}
      <main className="pt-[72px] min-h-[calc(100vh-72px)]">
        <div className="max-w-7xl mx-auto px-5 md:px-8 py-6 animate-fade-in">
          {children}
        </div>
      </main>

      {/* ─── Mobile Bottom Tab Bar (Floating) ─── */}
      <nav className="fixed bottom-0 left-0 right-0 z-50 md:hidden safe-area-bottom px-4 pb-3">
        <div className="flex items-center justify-around h-16 bg-card/95 backdrop-blur-xl rounded-2xl shadow-[0_-2px_20px_rgba(0,0,0,0.08)] border border-border/40">
          {MOBILE_NAV_ITEMS.map((item) => {
            const isActive =
              pathname === item.href ||
              (item.href !== "/dashboard" && pathname.startsWith(item.href));
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex flex-col items-center gap-0.5 px-3 py-1.5 rounded-xl transition-all duration-200 ${
                  isActive
                    ? "text-primary"
                    : "text-muted-foreground"
                }`}
              >
                <item.icon
                  className={`h-5 w-5 ${
                    isActive ? "stroke-[2.5px]" : "stroke-[1.5px]"
                  }`}
                />
                <span className={`text-[10px] font-display ${isActive ? "font-bold" : "font-medium"}`}>
                  {item.label}
                </span>
              </Link>
            );
          })}
        </div>
      </nav>
    </div>
  );
}
