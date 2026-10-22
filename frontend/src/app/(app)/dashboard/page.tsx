"use client";
// ---------------------------------------------------------------
// OverloadHQ – Dashboard Page
// Weekly summary, streak, recent PRs, mini volume chart, targets.
// ---------------------------------------------------------------

import { useAuth } from "@/lib/auth-context";
import { api } from "@/lib/api";
import { APP_NAME, MUSCLE_GROUP_LABELS, MUSCLE_GROUP_EMOJIS } from "@/lib/config";
import { formatWeight } from "@/lib/utils";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
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

  return (
    <div className="space-y-6">
      {/* Greeting */}
      <div>
        <h1 className="text-2xl font-bold">
          Hey, {user?.name?.split(" ")[0]} 💪
        </h1>
        <p className="text-muted-foreground text-sm mt-1">
          Ready to track your lifts and make progress today?
        </p>
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-2 gap-3">
        <Link href="/log">
          <Button className="w-full h-14 text-base gap-2" size="lg">
            <Dumbbell className="h-5 w-5" />
            Log Workout
          </Button>
        </Link>
        <Link href="/history">
          <Button variant="outline" className="w-full h-14 text-base gap-2" size="lg">
            <ChevronRight className="h-5 w-5" />
            Workout History
          </Button>
        </Link>
      </div>

      {/* Weekly Summary */}
      {summaryLoading ? (
        <Card>
          <CardContent className="py-8 flex justify-center">
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
          </CardContent>
        </Card>
      ) : summary ? (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <StatCard
            label="Workouts"
            value={summary.thisWeek?.workoutCount || 0}
            subtitle="this week"
            icon={<Dumbbell className="h-4 w-4 text-primary" />}
          />
          <StatCard
            label="Sets"
            value={summary.thisWeek?.totalSets || 0}
            subtitle="completed"
            icon={<Sparkles className="h-4 w-4 text-cyan-400" />}
          />
          <StatCard
            label="Streak"
            value={summary.weeklyStreak || 0}
            subtitle={summary.weeklyStreak === 1 ? "week" : "weeks"}
            icon={<Flame className="h-4 w-4 text-orange-400" />}
          />
          <StatCard
            label="PRs"
            value={recentPRs.length}
            subtitle="personal bests"
            icon={<Trophy className="h-4 w-4 text-yellow-400" />}
          />
        </div>
      ) : null}

      {/* Muscle Groups Trained */}
      {summary?.thisWeek?.muscleGroupsTrained?.length > 0 && (
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-muted-foreground font-medium">
              Trained This Week
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-2">
              {summary.thisWeek.muscleGroupsTrained.map((mg: string) => (
                <span
                  key={mg}
                  className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-primary/10 text-primary text-sm font-medium"
                >
                  {MUSCLE_GROUP_EMOJIS[mg]} {MUSCLE_GROUP_LABELS[mg]}
                </span>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Recent PRs */}
      {recentPRs.length > 0 && (
        <Card className="glow-border">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm flex items-center gap-2">
              <Trophy className="h-4 w-4 text-yellow-400" />
              Recent PRs
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {recentPRs.slice(0, 5).map((pr: any, i: number) => (
                <div
                  key={i}
                  className="flex items-center justify-between py-1"
                >
                  <span className="text-sm font-medium pr-badge">
                    🏆 {pr.exerciseName}
                  </span>
                  <span className="text-sm text-muted-foreground">
                    {formatWeight(pr.value, unit)}
                  </span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Recent Workouts */}
      {recentWorkouts.length > 0 && (
        <Card>
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm text-muted-foreground font-medium">
                Recent Workouts
              </CardTitle>
              <Link href="/history" className="text-xs text-primary hover:underline flex items-center gap-1">
                View all <ChevronRight className="h-3 w-3" />
              </Link>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {recentWorkouts.map((w: any) => (
                <div
                  key={w.id}
                  className="flex items-center justify-between py-2 px-3 rounded-lg bg-card hover:bg-secondary/40 transition-colors border border-border/50"
                >
                  <Link href={`/history`} className="flex-1">
                    <span className="text-sm font-semibold">
                      {MUSCLE_GROUP_EMOJIS[w.muscleGroup]} {MUSCLE_GROUP_LABELS[w.muscleGroup]}
                    </span>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      {w.dayName} · {new Date(w.date).toLocaleDateString("en-US", { month: "short", day: "numeric" })} · {w.sets?.length || 0} sets
                    </p>
                  </Link>
                  <Link href={`/log?edit=${w.id}`}>
                    <Button variant="ghost" size="sm" className="h-8 text-xs gap-1 text-primary hover:text-primary hover:bg-primary/10">
                      <Edit3 className="h-3.5 w-3.5" />
                      Edit
                    </Button>
                  </Link>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Empty state */}
      {!summaryLoading && (!recentWorkouts || recentWorkouts.length === 0) && (
        <Card className="border-dashed">
          <CardContent className="py-10 text-center space-y-4">
            <Dumbbell className="h-12 w-12 text-muted-foreground mx-auto" />
            <div>
              <p className="font-medium">No workouts yet</p>
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
  );
}

function StatCard({
  label,
  value,
  subtitle,
  change,
  icon,
}: {
  label: string;
  value: string | number;
  subtitle: string;
  change?: number;
  icon?: React.ReactNode;
}) {
  return (
    <Card className="overflow-hidden">
      <CardContent className="p-4">
        <p className="text-xs text-muted-foreground font-medium">{label}</p>
        <div className="flex items-end gap-2 mt-1">
          <span className="text-2xl font-bold">{value}</span>
          {icon}
          {change !== undefined && (
            <span
              className={`text-xs font-medium flex items-center ${
                change > 0
                  ? "text-emerald-400"
                  : change < 0
                  ? "text-red-400"
                  : "text-muted-foreground"
              }`}
            >
              {change > 0 ? (
                <TrendingUp className="h-3 w-3 mr-0.5" />
              ) : change < 0 ? (
                <TrendingDown className="h-3 w-3 mr-0.5" />
              ) : (
                <Minus className="h-3 w-3 mr-0.5" />
              )}
              {Math.abs(change)}%
            </span>
          )}
        </div>
        <p className="text-[10px] text-muted-foreground mt-0.5">{subtitle}</p>
      </CardContent>
    </Card>
  );
}
