"use client";
// ---------------------------------------------------------------
// OverloadHQ – Dashboard Page (Prototype-matched "Overview")
// Dark hero card, stat chips, recent PRs, recent workouts.
// ---------------------------------------------------------------

import { useAuth } from "@/lib/auth-context";
import { api } from "@/lib/api";
import { APP_NAME, MUSCLE_GROUP_LABELS, MUSCLE_GROUP_EMOJIS } from "@/lib/config";
import { formatWeight } from "@/lib/utils";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { HeroCard, HeroStat } from "@/components/ui/hero-card";
import { ListRow, Chip } from "@/components/ui/stat-row";
import Link from "next/link";
import {
  TrendingUp,
  TrendingDown,
  Minus,
  Flame,
  Trophy,
  Dumbbell,
  Brain,
  Loader2,
  Sparkles,
  ChevronRight,
  Edit3,
  ArrowRight,
  BarChart3,
  Award,
} from "lucide-react";

export default function DashboardPage() {
  const { user } = useAuth();
  const unit = user?.preferredUnit || "KG";

  const { data: summary, isLoading: summaryLoading } = useQuery({
    queryKey: ["progress-summary"],
    queryFn: () => api.progress.summary(),
  });

  const { data: prsData, isLoading: prsLoading } = useQuery({
    queryKey: ["prs"],
    queryFn: () => api.progress.prs(),
  });

  const { data: workoutsData } = useQuery({
    queryKey: ["recent-workouts"],
    queryFn: () => api.workouts.list({ limit: "5" }),
  });

  const recentPRs = prsData?.recentPRs?.filter((p: any) => p.type === "MAX_WEIGHT") || [];
  const recentWorkouts = workoutsData?.workouts || [];

  // Calculate total volume for the week
  const totalVolume = summary?.thisWeek?.totalVolume || 0;
  const volumeStr =
    totalVolume >= 1000
      ? `${(totalVolume / 1000).toFixed(1)}k ${unit.toLowerCase()}`
      : `${totalVolume} ${unit.toLowerCase()}`;

  return (
    <div className="space-y-8">
      {/* ─── Greeting ─── */}
      <div className="flex flex-col gap-2">
        <h1 className="font-display text-display-hero-mobile md:text-display-hero tracking-tight">
          Hey, {user?.name?.split(" ")[0]}!
        </h1>
        <p className="text-base text-muted-foreground max-w-xl">
          Ready to push your limits today?
          {summary?.weeklyStreak > 0 && (
            <>
              {" "}You are on a{" "}
              <span className="font-display font-semibold text-foreground underline decoration-primary decoration-2 underline-offset-4">
                {summary.weeklyStreak}-week consistency streak
              </span>
              .
            </>
          )}
        </p>
      </div>

      {/* ─── Layout: Main + Sidebar ─── */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* ─── Left Column (Main Stage) ─── */}
        <div className="lg:col-span-8 flex flex-col gap-6">
          {/* ─── Dark Hero Weekly Milestone Card ─── */}
          {summaryLoading ? (
            <Card>
              <CardContent className="py-12 flex justify-center">
                <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
              </CardContent>
            </Card>
          ) : summary ? (
            <HeroCard>
              <div className="flex flex-col gap-5">
                {/* Header */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="px-3 py-1 rounded-full bg-white/10 backdrop-blur-md text-white/90 font-display text-label-sm tracking-widest uppercase">
                      Weekly Milestone
                    </span>
                  </div>
                  <BarChart3 className="h-5 w-5 text-white/30" />
                </div>

                {/* Main stat */}
                <div className="flex flex-col gap-1">
                  <h2 className="font-display text-headline-lg-mobile md:text-headline-lg text-white font-bold leading-tight tracking-tight max-w-xl">
                    You lifted{" "}
                    <span className="text-primary underline decoration-primary/40 decoration-4 underline-offset-8">
                      {totalVolume.toLocaleString()} {unit.toLowerCase()}
                    </span>{" "}
                    across {summary.thisWeek?.workoutCount || 0} workouts this week.
                  </h2>
                </div>

                {/* Stat chips */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2">
                  <HeroStat
                    icon={<Dumbbell className="h-5 w-5 text-blue-300" />}
                    label="Sessions"
                    value={`${summary.thisWeek?.workoutCount || 0} Done`}
                  />
                  <HeroStat
                    icon={<BarChart3 className="h-5 w-5 text-emerald-400" />}
                    label="Volume"
                    value={`${totalVolume.toLocaleString()} ${unit.toLowerCase()}`}
                  />
                  <HeroStat
                    icon={<Trophy className="h-5 w-5 text-amber-400" />}
                    label="Records"
                    value={`${recentPRs.length} Broken`}
                  />
                </div>

                {/* Bottom action */}
                <div className="flex items-center justify-between pt-2">
                  {summary.thisWeek?.totalSets > 0 && (
                    <div className="flex items-center gap-2">
                      <span className="w-2 h-2 rounded-full bg-emerald-400" />
                      <span className="text-sm text-white/60">
                        {summary.thisWeek.totalSets} total sets completed
                      </span>
                    </div>
                  )}
                  <Link href="/progress">
                    <div className="w-12 h-12 rounded-full bg-primary flex items-center justify-center text-primary-foreground hover:opacity-90 transition-opacity shadow-lg">
                      <ArrowRight className="h-5 w-5" />
                    </div>
                  </Link>
                </div>
              </div>
            </HeroCard>
          ) : null}

          {/* ─── Muscle Groups Trained This Week ─── */}
          {summary?.thisWeek?.muscleGroupsTrained?.length > 0 && (
            <div className="flex flex-wrap gap-2">
              {summary.thisWeek.muscleGroupsTrained.map((mg: string) => (
                <Chip key={mg} variant="primary">
                  {MUSCLE_GROUP_EMOJIS[mg]} {MUSCLE_GROUP_LABELS[mg]}
                </Chip>
              ))}
            </div>
          )}

          {/* ─── Quick Actions ─── */}
          <div className="grid grid-cols-2 gap-3">
            <Link href="/log">
              <Button className="w-full h-14 text-base gap-2" size="lg">
                <Dumbbell className="h-5 w-5" />
                Start Workout
              </Button>
            </Link>
            <Link href="/history">
              <Button variant="outline" className="w-full h-14 text-base gap-2" size="lg">
                <ChevronRight className="h-5 w-5" />
                Workout History
              </Button>
            </Link>
          </div>

          {/* ─── Recent Workouts ─── */}
          {recentWorkouts.length > 0 && (
            <Card>
              <CardHeader className="pb-2">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-sm text-muted-foreground font-medium">
                    Recent Workouts
                  </CardTitle>
                  <Link
                    href="/history"
                    className="text-label-md text-primary hover:underline flex items-center gap-1 font-display"
                  >
                    View all <ChevronRight className="h-3 w-3" />
                  </Link>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-1">
                  {recentWorkouts.map((w: any) => (
                    <ListRow
                      key={w.id}
                      icon={
                        <span className="text-lg">
                          {MUSCLE_GROUP_EMOJIS[w.muscleGroup]}
                        </span>
                      }
                      title={MUSCLE_GROUP_LABELS[w.muscleGroup]}
                      subtitle={`${w.dayName} · ${new Date(w.date).toLocaleDateString("en-US", {
                        month: "short",
                        day: "numeric",
                      })} · ${w.sets?.length || 0} sets`}
                      action={
                        <Link href={`/log?edit=${w.id}`}>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-8 text-xs gap-1 text-primary hover:text-primary hover:bg-primary/10"
                          >
                            <Edit3 className="h-3.5 w-3.5" />
                            Edit
                          </Button>
                        </Link>
                      }
                    />
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* ─── Empty state ─── */}
          {!summaryLoading && (!recentWorkouts || recentWorkouts.length === 0) && (
            <Card className="border-dashed">
              <CardContent className="py-12 text-center space-y-4">
                <div className="w-16 h-16 rounded-2xl bg-surface-container flex items-center justify-center mx-auto">
                  <Dumbbell className="h-8 w-8 text-muted-foreground" />
                </div>
                <div>
                  <p className="font-display font-semibold">No workouts yet</p>
                  <p className="text-sm text-muted-foreground mt-1">
                    Log your first workout to start tracking progress!
                  </p>
                </div>
                <Link href="/log">
                  <Button>Log First Workout</Button>
                </Link>
              </CardContent>
            </Card>
          )}
        </div>

        {/* ─── Right Column (Sidebar) ─── */}
        <div className="lg:col-span-4 flex flex-col gap-6">
          {/* ─── Recent PRs ─── */}
          {recentPRs.length > 0 && (
            <Card>
              <CardHeader className="pb-2">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-label-sm uppercase tracking-wider text-muted-foreground font-display">
                    All-Time Bests
                  </CardTitle>
                  <Link
                    href="/progress"
                    className="text-label-md text-primary hover:underline flex items-center gap-1 font-display"
                  >
                    View All <ChevronRight className="h-3 w-3" />
                  </Link>
                </div>
                <h3 className="font-display text-headline-md font-bold mt-1">
                  Recent PRs
                </h3>
              </CardHeader>
              <CardContent>
                <div className="space-y-1">
                  {recentPRs.slice(0, 5).map((pr: any, i: number) => (
                    <ListRow
                      key={i}
                      icon={
                        <Award className="h-5 w-5 text-primary" />
                      }
                      title={pr.exerciseName}
                      subtitle={`${formatWeight(pr.value, unit)}`}
                      action={
                        pr.isNew ? (
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-primary/10 text-primary text-label-sm font-display font-bold">
                            <TrendingUp className="h-3 w-3" />
                            NEW
                          </span>
                        ) : undefined
                      }
                    />
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* ─── AI Coach Pulse Card ─── */}
          <Card className="bg-surface-container-low border-0">
            <CardContent className="p-5">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <Brain className="h-4 w-4 text-primary" />
                  <span className="font-display text-label-sm uppercase tracking-wider text-muted-foreground">
                    AI Coach
                  </span>
                </div>
              </div>
              <h4 className="font-display font-bold text-base mb-2">
                Ready for Analysis
              </h4>
              <p className="text-sm text-muted-foreground mb-4">
                Get personalized recommendations based on your recent workout data.
              </p>
              <Link href="/ai-coach">
                <Button variant="outline" size="sm" className="gap-1.5">
                  <Brain className="h-3.5 w-3.5" />
                  Ask Coach
                  <ArrowRight className="h-3.5 w-3.5" />
                </Button>
              </Link>
            </CardContent>
          </Card>

          {/* ─── Streak / Consistency Info ─── */}
          {summary?.weeklyStreak > 0 && (
            <div className="p-4 rounded-lg bg-surface-container-low">
              <div className="flex items-center gap-2 mb-2">
                <Flame className="h-5 w-5 text-primary" />
                <span className="font-display font-semibold text-sm">
                  Consistency streak: {summary.weeklyStreak}{" "}
                  {summary.weeklyStreak === 1 ? "week" : "weeks"}
                </span>
              </div>
              <p className="text-label-md text-muted-foreground">
                Keep training regularly to maintain your streak.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
