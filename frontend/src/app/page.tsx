"use client";
// ---------------------------------------------------------------
// OverloadHQ – Landing Page with Jeet's Personal Intro
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

  if (user) return null;

  return (
    <div className="min-h-screen flex flex-col">
      {/* Top Navigation */}
      <header className="sticky top-0 z-40 glass border-b border-border/50">
        <div className="container mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="h-9 w-9 rounded-xl bg-primary/10 flex items-center justify-center border border-primary/20 text-primary">
              <Dumbbell className="h-5 w-5" />
            </div>
            <span className="text-lg font-bold tracking-tight">{APP_NAME}</span>
          </div>
          <div className="flex items-center gap-2 sm:gap-3">
            <button
              type="button"
              onClick={toggleTheme}
              title={theme === "dark" ? "Switch to light theme" : "Switch to dark theme"}
              className="p-2 rounded-lg border border-border/60 hover:bg-muted text-muted-foreground hover:text-foreground transition-all"
              aria-label="Toggle theme"
            >
              {theme === "dark" ? (
                <Sun className="h-4 w-4 text-amber-400" />
              ) : (
                <Moon className="h-4 w-4 text-slate-700" />
              )}
            </button>
            <Link href="/login">
              <Button variant="ghost" size="sm" className="text-xs sm:text-sm">
                Log in
              </Button>
            </Link>
            <Link href="/signup">
              <Button size="sm" className="gap-1 text-xs sm:text-sm font-semibold">
                Get Started <ChevronRight className="h-4 w-4" />
              </Button>
            </Link>
          </div>
        </div>
      </header>

      {/* Main Hero Section */}
      <main className="flex-1 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-b from-primary/5 via-transparent to-transparent pointer-events-none" />
        
        <div className="relative container mx-auto px-4 py-12 sm:py-20 max-w-3xl text-center space-y-8">
          
          {/* Creator Intro Note */}
          <div className="max-w-xl mx-auto p-4 sm:p-5 rounded-2xl bg-card border border-border/80 shadow-sm flex items-start sm:items-center gap-4 text-left transition-all hover:border-primary/40 animate-slide-up">
            {/* Initials Circle Placeholder */}
            <div className="h-12 w-12 rounded-full bg-primary/15 border-2 border-primary/30 text-primary font-bold text-base flex items-center justify-center flex-shrink-0 shadow-sm">
              JS
            </div>
            <div className="flex-1 space-y-1">
              <div className="flex items-center gap-2">
                <span className="font-bold text-sm tracking-tight text-foreground">Jeet</span>
                <span className="text-[11px] px-2 py-0.5 rounded-full bg-primary/10 text-primary font-medium border border-primary/20">
                  Creator
                </span>
              </div>
              <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed">
                &ldquo;Hi, I&apos;m Jeet. I built OverloadHQ to track my own gym progress and make progressive overload simple, and now I&apos;m sharing it with friends so they can track their lifts too.&rdquo;
              </p>
            </div>
          </div>

          {/* Heading */}
          <div className="space-y-4">
            <h1 className="text-4xl sm:text-5xl font-black tracking-tight leading-tight">
              Track Your Workouts. <br className="hidden sm:block" />
              <span className="text-primary">Hit Your Goals.</span>
            </h1>
            <p className="text-base sm:text-lg text-muted-foreground max-w-xl mx-auto leading-relaxed">
              Log each set as you lift, see your progress automatically, and get AI-powered coaching advice tailored to your personal goals.
            </p>
          </div>

          {/* Primary Call to Action */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
            <Link href="/signup" className="w-full sm:w-auto">
              <Button size="lg" className="w-full sm:w-auto h-13 px-8 text-base font-semibold gap-2 shadow-md">
                Get Started Free <ChevronRight className="h-5 w-5" />
              </Button>
            </Link>
            <Link href="/login" className="w-full sm:w-auto">
              <Button variant="outline" size="lg" className="w-full sm:w-auto h-13 px-6 text-base font-medium">
                I already have an account
              </Button>
            </Link>
          </div>

          {/* Feature Highlights Grid */}
          <div className="grid sm:grid-cols-3 gap-4 pt-12 text-left">
            <div className="p-4 rounded-xl border border-border/70 bg-card/60 space-y-2">
              <div className="h-8 w-8 rounded-lg bg-primary/10 text-primary flex items-center justify-center">
                <Dumbbell className="h-4 w-4" />
              </div>
              <h3 className="font-semibold text-sm">Log One by One</h3>
              <p className="text-xs text-muted-foreground leading-relaxed">
                Log exercises and sets right as you finish them at the gym, with integrated rest timer.
              </p>
            </div>

            <div className="p-4 rounded-xl border border-border/70 bg-card/60 space-y-2">
              <div className="h-8 w-8 rounded-lg bg-primary/10 text-primary flex items-center justify-center">
                <TrendingUp className="h-4 w-4" />
              </div>
              <h3 className="font-semibold text-sm">Track Progress</h3>
              <p className="text-xs text-muted-foreground leading-relaxed">
                Clear weight curves, PR records, and history without complicated formulas.
              </p>
            </div>

            <div className="p-4 rounded-xl border border-border/70 bg-card/60 space-y-2">
              <div className="h-8 w-8 rounded-lg bg-primary/10 text-primary flex items-center justify-center">
                <Brain className="h-4 w-4" />
              </div>
              <h3 className="font-semibold text-sm">AI Workout Coach</h3>
              <p className="text-xs text-muted-foreground leading-relaxed">
                Powered by Groq AI to give you instant advice on weights, reps, and form.
              </p>
            </div>
          </div>

        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-border/40 py-6 text-center text-xs text-muted-foreground">
        <p>© {new Date().getFullYear()} {APP_NAME}. Built by Jeet for lifters.</p>
      </footer>
    </div>
  );
}
