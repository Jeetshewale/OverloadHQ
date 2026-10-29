"use client";
// ---------------------------------------------------------------
// OverloadHQ – Landing Page with Jeet's Personal Intro
// Stitch Prototype styling with warm cream / near-black backgrounds,
// vermillion accent, Plus Jakarta Sans display typography, and pill buttons
// ---------------------------------------------------------------

import Link from "next/link";
import { useAuth } from "@/lib/auth-context";
import { APP_NAME } from "@/lib/config";
import { Button } from "@/components/ui/button";
import {
  Dumbbell,
  TrendingUp,
  Brain,
  Shield,
  ChevronRight,
  Loader2,
  Sun,
  Moon,
  Sparkles,
  CheckCircle2,
  Zap,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { useTheme } from "@/lib/theme-context";

export default function LandingPage() {
  const { user, loading, isBackendAwake } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const router = useRouter();

  useEffect(() => {
    if (!loading && user) {
      router.push(user.onboardingDone ? "/dashboard" : "/onboarding");
    }
  }, [user, loading, router]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center space-y-4">
          <Loader2 className="h-10 w-10 animate-spin text-primary mx-auto" />
          {!isBackendAwake && (
            <p className="text-on-surface-variant text-sm max-w-xs mx-auto">
              Waking up the server — this can take up to a minute on the free tier...
            </p>
          )}
        </div>
      </div>
    );
  }

  if (user) return null;

  return (
    <div className="min-h-screen flex flex-col bg-background text-on-surface">
      {/* Top Navigation */}
      <header className="sticky top-0 z-40 bg-surface/80 backdrop-blur-xl border-b border-border/60">
        <div className="container mx-auto px-4 sm:px-6 h-20 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-full bg-primary flex items-center justify-center text-primary-foreground shadow-sm">
              <Zap className="h-5 w-5 fill-current" />
            </div>
            <span className="font-display text-xl font-black tracking-tight text-on-surface">
              Overload<span className="text-primary">HQ</span>
            </span>
          </div>
          <div className="flex items-center gap-2 sm:gap-3">
            <button
              type="button"
              onClick={toggleTheme}
              title={theme === "dark" ? "Switch to light theme" : "Switch to dark theme"}
              className="w-10 h-10 rounded-full flex items-center justify-center bg-surface-container text-on-surface hover:bg-surface-container-high transition-colors"
              aria-label="Toggle theme"
            >
              {theme === "dark" ? (
                <Sun className="h-4 w-4 text-accent-amber" />
              ) : (
                <Moon className="h-4 w-4 text-on-surface" />
              )}
            </button>
            <Link href="/login">
              <Button variant="ghost" size="sm" className="rounded-full text-xs sm:text-sm font-semibold px-4">
                Log in
              </Button>
            </Link>
            <Link href="/signup">
              <Button size="sm" className="rounded-full gap-1 text-xs sm:text-sm font-semibold px-5 bg-primary text-primary-foreground shadow-sm">
                Get Started <ChevronRight className="h-4 w-4" />
              </Button>
            </Link>
          </div>
        </div>
      </header>

      {/* Main Hero Section */}
      <main className="flex-1 relative overflow-hidden">
        {/* Subtle ambient glow decoration */}
        <div className="absolute top-10 left-1/4 w-96 h-96 bg-primary/10 rounded-full blur-3xl pointer-events-none -z-10" />
        <div className="absolute top-48 right-10 w-80 h-80 bg-accent-amber/10 rounded-full blur-3xl pointer-events-none -z-10" />

        <div className="relative container mx-auto px-4 sm:px-6 py-12 sm:py-20 max-w-3xl text-center space-y-8">
          {/* Creator Intro Note */}
          <div className="max-w-xl mx-auto p-4 sm:p-5 rounded-2xl md:rounded-3xl bg-card border border-border/80 shadow-sm flex items-start sm:items-center gap-4 text-left transition-all hover:border-primary/40 animate-slide-up">
            <div className="h-12 w-12 rounded-full bg-primary/15 border border-primary/30 text-primary font-display font-bold text-base flex items-center justify-center flex-shrink-0 shadow-sm">
              JS
            </div>
            <div className="flex-1 space-y-1">
              <div className="flex items-center gap-2">
                <span className="font-display font-bold text-sm tracking-tight text-on-surface">
                  Jeet
                </span>
                <span className="text-[11px] px-2.5 py-0.5 rounded-full bg-primary/10 text-primary font-bold border border-primary/20">
                  Creator
                </span>
              </div>
              <p className="text-xs sm:text-sm text-on-surface-variant leading-relaxed">
                &ldquo;Hi, I&apos;m Jeet. I built OverloadHQ to track my own gym progress and make progressive overload simple, and now I&apos;m sharing it with friends so they can track their lifts too.&rdquo;
              </p>
            </div>
          </div>

          {/* Heading */}
          <div className="space-y-4">
            <h1 className="font-display text-4xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight leading-tight text-on-surface">
              Track Your Workouts. <br className="hidden sm:block" />
              <span className="text-primary">Hit Your Goals.</span>
            </h1>
            <p className="text-base sm:text-lg text-on-surface-variant max-w-xl mx-auto leading-relaxed">
              Log each set as you lift, see your progressive overload automatically, and get AI-powered coaching advice tailored to your personal goals.
            </p>
          </div>

          {/* Primary Call to Action */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
            <Link href="/signup" className="w-full sm:w-auto">
              <Button size="lg" className="w-full sm:w-auto h-13 px-8 text-base font-bold rounded-full gap-2 bg-primary text-primary-foreground shadow-lg hover:opacity-95 active:scale-95 transition-all">
                Get Started Free <ChevronRight className="h-5 w-5" />
              </Button>
            </Link>
            <Link href="/login" className="w-full sm:w-auto">
              <Button variant="outline" size="lg" className="w-full sm:w-auto h-13 px-7 text-base font-semibold rounded-full border-border">
                I already have an account
              </Button>
            </Link>
          </div>

          {/* Feature Highlights Grid */}
          <div className="grid sm:grid-cols-3 gap-4 pt-12 text-left">
            <div className="p-5 rounded-2xl md:rounded-3xl border border-border/80 bg-card shadow-sm space-y-2.5">
              <div className="h-10 w-10 rounded-2xl bg-primary/10 text-primary flex items-center justify-center">
                <Dumbbell className="h-5 w-5" />
              </div>
              <h3 className="font-display font-bold text-sm text-on-surface">Log One by One</h3>
              <p className="text-xs text-on-surface-variant leading-relaxed">
                Log exercises and sets right as you finish them at the gym, with integrated rest recovery timer.
              </p>
            </div>

            <div className="p-5 rounded-2xl md:rounded-3xl border border-border/80 bg-card shadow-sm space-y-2.5">
              <div className="h-10 w-10 rounded-2xl bg-accent-amber/15 text-accent-amber flex items-center justify-center">
                <TrendingUp className="h-5 w-5" />
              </div>
              <h3 className="font-display font-bold text-sm text-on-surface">Track Overload</h3>
              <p className="text-xs text-on-surface-variant leading-relaxed">
                Clear weight curves, split overload evaluations, and PR records without complicated math.
              </p>
            </div>

            <div className="p-5 rounded-2xl md:rounded-3xl border border-border/80 bg-card shadow-sm space-y-2.5">
              <div className="h-10 w-10 rounded-2xl bg-tertiary/15 text-tertiary flex items-center justify-center">
                <Brain className="h-5 w-5" />
              </div>
              <h3 className="font-display font-bold text-sm text-on-surface">AI Workout Coach</h3>
              <p className="text-xs text-on-surface-variant leading-relaxed">
                Powered by Gemini & Groq AI to give you instant advice on targets, volume, and form cues.
              </p>
            </div>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-border/40 py-8 text-center text-xs text-on-surface-variant">
        <p>© {new Date().getFullYear()} {APP_NAME}. Built by Jeet for lifters.</p>
      </footer>
    </div>
  );
}
