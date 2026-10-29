"use client";
// ---------------------------------------------------------------
// OverloadHQ – Progress Page
// Stitch Prototype-inspired styling with vermillion charts,
// warm card surfaces, pill tabs, and tactile overload cards
// ---------------------------------------------------------------

import { useState } from "react";
import { useAuth } from "@/lib/auth-context";
import { api } from "@/lib/api";
import { useQuery } from "@tanstack/react-query";
import {
  MUSCLE_GROUPS,
  MUSCLE_GROUP_LABELS,
  MUSCLE_GROUP_EMOJIS,
  WORKOUT_SPLITS,
  WORKOUT_SPLIT_LABELS,
} from "@/lib/config";
import { formatWeight, formatDateShort } from "@/lib/utils";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Loader2,
  TrendingUp,
  TrendingDown,
  Minus,
  Trophy,
  Search,
  Zap,
  CheckCircle2,
  AlertTriangle,
  Clock,
  Layers,
  ArrowUpRight,
  ArrowDownRight,
  ChevronDown,
  Dumbbell,
  BarChart3,
  Flame,
} from "lucide-react";
import { Input } from "@/components/ui/input";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Area,
  AreaChart,
} from "recharts";

export default function ProgressPage() {
  const { user } = useAuth();
  const unit = user?.preferredUnit || "KG";
  const kgToDisplay = (kg: number) =>
    unit === "LB" ? Math.round(kg * 2.20462 * 10) / 10 : kg;

  const [selectedExercise, setSelectedExercise] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [activeTab, setActiveTab] = useState<"exercises" | "overload">("overload");
  const [selectedSplit, setSelectedSplit] = useState<string>(user?.workoutSplit || "4_DAY_SPLIT");
  const [expandedMuscle, setExpandedMuscle] = useState<string | null>(null);

  // Get all workouts to extract exercise names
  const { data: workoutsData } = useQuery({
    queryKey: ["all-workouts-for-progress"],
    queryFn: () => api.workouts.list({ limit: "200" }),
  });

  // Extract unique exercise names
  const allExercises = Array.from(
    new Set(
      (workoutsData?.workouts || []).flatMap((w: any) =>
        w.sets.map((s: any) => s.exerciseName)
      )
    )
  ).sort() as string[];

  const filteredExercises = searchQuery
    ? allExercises.filter((e) =>
        e.toLowerCase().includes(searchQuery.toLowerCase())
      )
    : allExercises;

  // Fetch exercise progress
  const { data: progressData, isLoading: progressLoading } = useQuery({
    queryKey: ["exercise-progress", selectedExercise],
    queryFn: () => api.progress.exercise(selectedExercise),
    enabled: !!selectedExercise,
  });

  // Fetch PRs
  const { data: prsData } = useQuery({
    queryKey: ["prs"],
    queryFn: () => api.progress.prs(),
  });

  // Fetch split overload data
  const { data: overloadData, isLoading: overloadLoading } = useQuery({
    queryKey: ["split-overload", selectedSplit],
    queryFn: () => api.progress.splitOverload(undefined, selectedSplit),
  });

  const chartData = (progressData?.chartData || []).map((d: any) => ({
    ...d,
    date: formatDateShort(d.date),
    maxWeight: kgToDisplay(d.maxWeight),
    totalVolume: kgToDisplay(d.totalVolume),
    estimated1RM: kgToDisplay(d.estimated1RM),
  }));

  const comparison = progressData?.comparison;
  const description = progressData?.description;

  // Vermillion-themed chart colors
  const chartVermillion = "hsl(12, 100%, 54%)";
  const chartVermillionLight = "hsl(12, 100%, 54%, 0.15)";
  const chartPurple = "hsl(255, 60%, 65%)";
  const chartAmber = "hsl(38, 100%, 50%)";

  return (
    <div className="space-y-6 max-w-4xl mx-auto pb-16">
      {/* Page Title & Context */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="font-display text-2xl sm:text-3xl font-extrabold text-on-surface tracking-tight">
            Progress Analytics
          </h1>
          <p className="text-sm text-on-surface-variant mt-0.5">
            Track progressive overload, strength gains, and all-time records.
          </p>
        </div>
      </div>

      {/* Pill Tab Switcher */}
      <div className="flex p-1.5 rounded-full bg-surface-container border border-border/60 max-w-md mx-auto">
        <button
          onClick={() => setActiveTab("overload")}
          className={`flex-1 flex items-center justify-center gap-2 py-2.5 px-5 rounded-full text-xs sm:text-sm font-semibold transition-all ${
            activeTab === "overload"
              ? "bg-primary text-primary-foreground shadow-sm"
              : "text-on-surface-variant hover:text-on-surface"
          }`}
        >
          <Zap className="h-4 w-4" />
          <span>Split Overload</span>
        </button>
        <button
          onClick={() => setActiveTab("exercises")}
          className={`flex-1 flex items-center justify-center gap-2 py-2.5 px-5 rounded-full text-xs sm:text-sm font-semibold transition-all ${
            activeTab === "exercises"
              ? "bg-primary text-primary-foreground shadow-sm"
              : "text-on-surface-variant hover:text-on-surface"
          }`}
        >
          <BarChart3 className="h-4 w-4" />
          <span>Exercise Charts</span>
        </button>
      </div>

      {/* === SPLIT OVERLOAD TAB === */}
      {activeTab === "overload" && (
        <div className="space-y-5">
          {/* Split Selector Card */}
          <div className="p-5 rounded-2xl md:rounded-3xl bg-card border border-border/80 shadow-sm space-y-3">
            <div className="flex items-center gap-2">
              <Layers className="h-4 w-4 text-primary" />
              <span className="text-xs font-bold uppercase tracking-wider text-on-surface-variant">
                Select Your Split
              </span>
            </div>
            <div className="flex flex-wrap gap-2">
              {WORKOUT_SPLITS.map((s) => (
                <button
                  key={s}
                  onClick={() => setSelectedSplit(s)}
                  className={`px-4 py-2 rounded-full text-xs font-semibold transition-all border ${
                    selectedSplit === s
                      ? "bg-primary text-primary-foreground border-primary shadow-sm"
                      : "bg-surface-container hover:bg-surface-container-high text-on-surface-variant hover:text-on-surface border-border/60"
                  }`}
                >
                  {WORKOUT_SPLIT_LABELS[s]}
                </button>
              ))}
            </div>
          </div>

          {/* Overload Info Banner */}
          <div className="flex items-start gap-3.5 p-4 rounded-2xl bg-primary/5 border border-primary/20">
            <div className="w-8 h-8 rounded-full bg-primary/10 text-primary flex items-center justify-center flex-shrink-0 mt-0.5">
              <Flame className="h-4 w-4" />
            </div>
            <div>
              <p className="text-sm font-display font-bold text-on-surface">
                Progressive Overload Rule
              </p>
              <p className="text-xs text-on-surface-variant leading-relaxed mt-0.5">
                Overload is evaluated after every <strong>2 workout sessions</strong> per muscle group.
                We calculate volume load differences and rep improvements across your most recent sessions.
              </p>
            </div>
          </div>

          {/* Overload Cards */}
          {overloadLoading ? (
            <div className="py-16 text-center">
              <Loader2 className="h-7 w-7 animate-spin mx-auto text-primary" />
              <p className="text-xs font-medium text-on-surface-variant mt-2">
                Analyzing progressive overload...
              </p>
            </div>
          ) : (overloadData?.muscleAnalysis || []).length === 0 ? (
            <div className="py-12 text-center rounded-3xl border border-dashed border-border/80 p-8 space-y-3 bg-surface-container-low">
              <Dumbbell className="h-8 w-8 mx-auto text-on-surface-variant/40" />
              <p className="text-sm font-semibold text-on-surface">
                No workout data yet for this split.
              </p>
              <p className="text-xs text-on-surface-variant">
                Log your first workout to start tracking overload!
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {(overloadData?.muscleAnalysis || []).map((analysis: any) => (
                <MuscleOverloadCard
                  key={analysis.muscleGroup}
                  analysis={analysis}
                  unit={unit}
                  kgToDisplay={kgToDisplay}
                  expanded={expandedMuscle === analysis.muscleGroup}
                  onToggle={() =>
                    setExpandedMuscle(
                      expandedMuscle === analysis.muscleGroup
                        ? null
                        : analysis.muscleGroup
                    )
                  }
                />
              ))}
            </div>
          )}
        </div>
      )}

      {/* === EXERCISE CHARTS TAB === */}
      {activeTab === "exercises" && (
        <div className="space-y-5">
          {/* Exercise selector */}
          <div className="p-5 rounded-2xl md:rounded-3xl bg-card border border-border/80 shadow-sm space-y-3">
            <div className="relative">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-on-surface-variant" />
              <Input
                placeholder="Search exercises (e.g. Bench Press, Squat)..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 h-11 bg-surface-container-low rounded-xl border-border/60"
              />
            </div>

            <div className="flex flex-wrap gap-2 pt-1">
              {filteredExercises.slice(0, 16).map((name) => (
                <button
                  key={name}
                  onClick={() => {
                    setSelectedExercise(name);
                    setSearchQuery("");
                  }}
                  className={`px-3.5 py-1.5 rounded-full text-xs font-semibold transition-all border ${
                    selectedExercise === name
                      ? "bg-primary text-primary-foreground border-primary shadow-sm"
                      : "bg-surface-container hover:bg-surface-container-high text-on-surface-variant hover:text-on-surface border-border/60"
                  }`}
                >
                  {name}
                </button>
              ))}
              {filteredExercises.length === 0 && (
                <p className="text-xs text-on-surface-variant py-2">
                  No exercises found. Complete workouts to see your exercise list!
                </p>
              )}
            </div>
          </div>

          {/* Exercise Progress Details */}
          {selectedExercise && (
            <>
              {progressLoading ? (
                <div className="py-16 text-center">
                  <Loader2 className="h-7 w-7 animate-spin mx-auto text-primary" />
                </div>
              ) : chartData.length === 0 ? (
                <div className="py-10 text-center rounded-3xl border border-dashed border-border/80 p-8 text-on-surface-variant">
                  No data points recorded for {selectedExercise} yet.
                </div>
              ) : (
                <div className="space-y-4 animate-fade-in">
                  {/* Description Card */}
                  {description && (
                    <div className="p-4 rounded-2xl bg-card border border-primary/20 shadow-sm">
                      <p className="text-sm text-on-surface leading-relaxed">
                        {description}
                      </p>
                    </div>
                  )}

                  {/* Week vs Week Comparison Cards */}
                  {comparison && (
                    <div className="grid grid-cols-3 gap-3">
                      <ComparisonCard
                        label="Weight"
                        prev={kgToDisplay(comparison.weight.prev)}
                        curr={kgToDisplay(comparison.weight.curr)}
                        unit={unit.toLowerCase()}
                        direction={comparison.weight.direction}
                        change={comparison.weight.change}
                      />
                      <ComparisonCard
                        label="Reps"
                        prev={comparison.reps.prev}
                        curr={comparison.reps.curr}
                        unit=""
                        direction={comparison.reps.direction}
                        change={comparison.reps.change}
                      />
                      {comparison.volume && (
                        <ComparisonCard
                          label="Volume"
                          prev={kgToDisplay(comparison.volume.prev)}
                          curr={kgToDisplay(comparison.volume.curr)}
                          unit={unit.toLowerCase()}
                          direction={comparison.volume.direction}
                          change={comparison.volume.change}
                        />
                      )}
                    </div>
                  )}

                  {/* Charts */}
                  <div className="p-5 rounded-2xl md:rounded-3xl bg-card border border-border/80 shadow-sm">
                    <h3 className="font-display font-bold text-sm text-on-surface mb-4">
                      Max Weight Progression ({unit.toLowerCase()})
                    </h3>
                    <div className="h-56">
                      <ResponsiveContainer width="100%" height="100%">
                        <AreaChart data={chartData}>
                          <defs>
                            <linearGradient id="weightGradVermillion" x1="0" y1="0" x2="0" y2="1">
                              <stop offset="5%" stopColor={chartVermillion} stopOpacity={0.35} />
                              <stop offset="95%" stopColor={chartVermillion} stopOpacity={0.0} />
                            </linearGradient>
                          </defs>
                          <CartesianGrid strokeDasharray="3 3" stroke="rgba(150, 150, 150, 0.15)" />
                          <XAxis
                            dataKey="date"
                            tick={{ fill: "rgba(150, 150, 150, 0.8)", fontSize: 11 }}
                            axisLine={{ stroke: "rgba(150, 150, 150, 0.2)" }}
                          />
                          <YAxis
                            tick={{ fill: "rgba(150, 150, 150, 0.8)", fontSize: 11 }}
                            axisLine={{ stroke: "rgba(150, 150, 150, 0.2)" }}
                          />
                          <Tooltip
                            contentStyle={{
                              backgroundColor: "hsl(var(--card))",
                              borderColor: "hsl(var(--border))",
                              borderRadius: "16px",
                              fontSize: 12,
                              color: "hsl(var(--foreground))",
                              boxShadow: "0 10px 25px rgba(0,0,0,0.1)",
                            }}
                          />
                          <Area
                            type="monotone"
                            dataKey="maxWeight"
                            stroke={chartVermillion}
                            fill="url(#weightGradVermillion)"
                            strokeWidth={2.5}
                            dot={{ fill: chartVermillion, r: 4 }}
                            activeDot={{ r: 6 }}
                          />
                        </AreaChart>
                      </ResponsiveContainer>
                    </div>
                  </div>

                  <div className="p-5 rounded-2xl md:rounded-3xl bg-card border border-border/80 shadow-sm">
                    <h3 className="font-display font-bold text-sm text-on-surface mb-4">
                      Best Reps at Max Weight
                    </h3>
                    <div className="h-52">
                      <ResponsiveContainer width="100%" height="100%">
                        <LineChart data={chartData}>
                          <CartesianGrid strokeDasharray="3 3" stroke="rgba(150, 150, 150, 0.15)" />
                          <XAxis
                            dataKey="date"
                            tick={{ fill: "rgba(150, 150, 150, 0.8)", fontSize: 11 }}
                            axisLine={{ stroke: "rgba(150, 150, 150, 0.2)" }}
                          />
                          <YAxis
                            tick={{ fill: "rgba(150, 150, 150, 0.8)", fontSize: 11 }}
                            axisLine={{ stroke: "rgba(150, 150, 150, 0.2)" }}
                          />
                          <Tooltip
                            contentStyle={{
                              backgroundColor: "hsl(var(--card))",
                              borderColor: "hsl(var(--border))",
                              borderRadius: "16px",
                              fontSize: 12,
                              color: "hsl(var(--foreground))",
                            }}
                          />
                          <Line
                            type="monotone"
                            dataKey="bestReps"
                            stroke={chartAmber}
                            strokeWidth={2.5}
                            dot={{ fill: chartAmber, r: 4 }}
                          />
                        </LineChart>
                      </ResponsiveContainer>
                    </div>
                  </div>

                  <div className="p-5 rounded-2xl md:rounded-3xl bg-card border border-border/80 shadow-sm">
                    <h3 className="font-display font-bold text-sm text-on-surface mb-4">
                      Estimated 1RM ({unit.toLowerCase()})
                    </h3>
                    <div className="h-52">
                      <ResponsiveContainer width="100%" height="100%">
                        <LineChart data={chartData}>
                          <CartesianGrid strokeDasharray="3 3" stroke="rgba(150, 150, 150, 0.15)" />
                          <XAxis
                            dataKey="date"
                            tick={{ fill: "rgba(150, 150, 150, 0.8)", fontSize: 11 }}
                            axisLine={{ stroke: "rgba(150, 150, 150, 0.2)" }}
                          />
                          <YAxis
                            tick={{ fill: "rgba(150, 150, 150, 0.8)", fontSize: 11 }}
                            axisLine={{ stroke: "rgba(150, 150, 150, 0.2)" }}
                          />
                          <Tooltip
                            contentStyle={{
                              backgroundColor: "hsl(var(--card))",
                              borderColor: "hsl(var(--border))",
                              borderRadius: "16px",
                              fontSize: 12,
                              color: "hsl(var(--foreground))",
                            }}
                          />
                          <Line
                            type="monotone"
                            dataKey="estimated1RM"
                            stroke={chartPurple}
                            strokeWidth={2.5}
                            dot={{ fill: chartPurple, r: 4 }}
                          />
                        </LineChart>
                      </ResponsiveContainer>
                    </div>
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      )}

      {/* PRs Section */}
      {prsData?.recentPRs?.length > 0 && (
        <div className="p-5 rounded-2xl md:rounded-3xl bg-card border border-border/80 shadow-sm">
          <div className="flex items-center gap-2 mb-4">
            <Trophy className="h-4 w-4 text-accent-amber" />
            <h3 className="font-display font-bold text-base text-on-surface">
              All-Time Personal Records
            </h3>
          </div>
          <div className="divide-y divide-border/40">
            {prsData.prs
              ?.filter((p: any) => p.type === "MAX_WEIGHT")
              .slice(0, 10)
              .map((pr: any, i: number) => (
                <div
                  key={i}
                  className="flex items-center justify-between py-2.5 first:pt-0 last:pb-0"
                >
                  <button
                    onClick={() => {
                      setSelectedExercise(pr.exerciseName);
                      setActiveTab("exercises");
                    }}
                    className="text-sm font-semibold text-on-surface hover:text-primary transition-colors text-left"
                  >
                    {pr.exerciseName}
                  </button>
                  <div className="flex items-center gap-2">
                    <span className="font-display font-bold text-sm text-on-surface tabular-nums">
                      {formatWeight(pr.value, unit)}
                    </span>
                    {pr.isNew && (
                      <span className="text-[10px] px-2 py-0.5 rounded-full bg-primary/15 text-primary font-bold">
                        NEW
                      </span>
                    )}
                  </div>
                </div>
              ))}
          </div>
        </div>
      )}
    </div>
  );
}

// ------- Muscle Overload Card -------
function MuscleOverloadCard({
  analysis,
  unit,
  kgToDisplay,
  expanded,
  onToggle,
}: {
  analysis: any;
  unit: string;
  kgToDisplay: (kg: number) => number;
  expanded: boolean;
  onToggle: () => void;
}) {
  const statusConfig = {
    ACHIEVED: {
      icon: CheckCircle2,
      color: "text-emerald-500",
      bg: "bg-emerald-500/10",
      border: "border-emerald-500/20",
      label: "Overload Achieved",
    },
    STEADY: {
      icon: Minus,
      color: "text-accent-amber",
      bg: "bg-accent-amber/10",
      border: "border-accent-amber/20",
      label: "Steady",
    },
    RECOVERY: {
      icon: AlertTriangle,
      color: "text-primary",
      bg: "bg-primary/10",
      border: "border-primary/20",
      label: "Recovery Phase",
    },
    BASELINE_SET: {
      icon: Clock,
      color: "text-on-surface-variant",
      bg: "bg-surface-container",
      border: "border-border/60",
      label: "Day 1 of 2",
    },
    NO_SESSIONS: {
      icon: Dumbbell,
      color: "text-on-surface-variant",
      bg: "bg-surface-container",
      border: "border-border/40",
      label: "No Data",
    },
  };

  const config =
    statusConfig[analysis.status as keyof typeof statusConfig] ||
    statusConfig.STEADY;
  const StatusIcon = config.icon;

  return (
    <div className={`rounded-2xl md:rounded-3xl border ${config.border} bg-card overflow-hidden shadow-sm transition-all`}>
      <button
        onClick={onToggle}
        className="w-full text-left p-4 sm:p-5 hover:bg-surface-container-low transition-colors"
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3.5">
            <div
              className={`h-11 w-11 rounded-2xl ${config.bg} flex items-center justify-center flex-shrink-0 text-xl`}
            >
              <span>{MUSCLE_GROUP_EMOJIS[analysis.muscleGroup] || "💪"}</span>
            </div>
            <div>
              <p className="font-display font-bold text-sm sm:text-base text-on-surface">
                {MUSCLE_GROUP_LABELS[analysis.muscleGroup] || analysis.muscleGroup}
              </p>
              <div className="flex items-center gap-2 mt-0.5">
                <span
                  className={`inline-flex items-center gap-1 text-xs font-semibold ${config.color}`}
                >
                  <StatusIcon className="h-3.5 w-3.5" />
                  {config.label}
                </span>
                <span className="text-[11px] text-on-surface-variant">
                  • {analysis.sessionCount} session{analysis.sessionCount !== 1 ? "s" : ""}
                </span>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-3">
            {analysis.isOverloadEvaluated && (
              <div className="text-right">
                {analysis.volumeChange !== 0 && (
                  <span
                    className={`inline-flex items-center gap-0.5 font-display font-bold text-xs sm:text-sm ${
                      analysis.volumeChange > 0
                        ? "text-emerald-500"
                        : "text-red-500"
                    }`}
                  >
                    {analysis.volumeChange > 0 ? (
                      <ArrowUpRight className="h-4 w-4" />
                    ) : (
                      <ArrowDownRight className="h-4 w-4" />
                    )}
                    {analysis.volumeChange > 0 ? "+" : ""}
                    {analysis.volumeChange}%
                  </span>
                )}
                <p className="text-[10px] uppercase font-semibold text-on-surface-variant">
                  volume
                </p>
              </div>
            )}
            <ChevronDown
              className={`h-4 w-4 text-on-surface-variant transition-transform ${
                expanded ? "rotate-180" : ""
              }`}
            />
          </div>
        </div>
      </button>

      {/* Expanded Details */}
      {expanded && (
        <div className="border-t border-border/40 bg-surface-container-low p-4 sm:p-5 space-y-4">
          <p className="text-xs text-on-surface-variant leading-relaxed">
            {analysis.message}
          </p>

          {/* Session dates */}
          {analysis.session1Date && (
            <div className="flex items-center gap-3 text-xs">
              <div className="flex-1 p-3 rounded-2xl bg-card border border-border/60 text-center">
                <p className="text-[10px] font-semibold text-on-surface-variant uppercase mb-0.5">
                  Session 1
                </p>
                <p className="font-display font-bold text-sm text-on-surface">
                  {analysis.session1Date}
                </p>
                {analysis.session1Volume != null && (
                  <p className="text-[11px] text-on-surface-variant mt-0.5">
                    Vol: {analysis.session1Volume.toLocaleString()}
                  </p>
                )}
              </div>
              {analysis.session2Date && (
                <>
                  <TrendingUp className="h-4 w-4 text-primary flex-shrink-0" />
                  <div className="flex-1 p-3 rounded-2xl bg-card border border-border/60 text-center">
                    <p className="text-[10px] font-semibold text-on-surface-variant uppercase mb-0.5">
                      Session 2
                    </p>
                    <p className="font-display font-bold text-sm text-on-surface">
                      {analysis.session2Date}
                    </p>
                    {analysis.session2Volume != null && (
                      <p className="text-[11px] text-on-surface-variant mt-0.5">
                        Vol: {analysis.session2Volume.toLocaleString()}
                      </p>
                    )}
                  </div>
                </>
              )}
            </div>
          )}

          {/* Per-exercise breakdown */}
          {analysis.exercises && analysis.exercises.length > 0 && (
            <div className="space-y-2 pt-1">
              <p className="text-[11px] font-bold text-on-surface-variant uppercase tracking-wider">
                Exercise Breakdown
              </p>
              {analysis.exercises.map((ex: any, i: number) => (
                <div
                  key={i}
                  className={`flex items-center justify-between p-3 rounded-xl text-xs border ${
                    ex.isOverload
                      ? "bg-emerald-500/5 border-emerald-500/20"
                      : "bg-card border-border/60"
                  }`}
                >
                  <div className="flex items-center gap-2">
                    {ex.isOverload ? (
                      <CheckCircle2 className="h-4 w-4 text-emerald-500 flex-shrink-0" />
                    ) : (
                      <Minus className="h-4 w-4 text-on-surface-variant flex-shrink-0" />
                    )}
                    <span className="font-semibold text-on-surface">{ex.name}</span>
                  </div>
                  <div className="flex items-center gap-3 text-xs text-on-surface-variant font-medium">
                    <span>
                      {ex.day1MaxWeight != null
                        ? `${kgToDisplay(ex.day1MaxWeight)}→`
                        : ""}
                      {kgToDisplay(ex.day2MaxWeight)} {unit.toLowerCase()}
                    </span>
                    <span>
                      {ex.day1Reps != null ? `${ex.day1Reps}→` : ""}
                      {ex.day2Reps} reps
                    </span>
                    {ex.volumeChange != null && (
                      <span
                        className={`font-bold ${
                          ex.volumeChange > 0
                            ? "text-emerald-500"
                            : ex.volumeChange < 0
                            ? "text-red-500"
                            : "text-on-surface-variant"
                        }`}
                      >
                        {ex.volumeChange > 0 ? "+" : ""}
                        {ex.volumeChange}%
                      </span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// ------- Comparison Card -------
function ComparisonCard({
  label,
  prev,
  curr,
  unit,
  direction,
  change,
}: {
  label: string;
  prev: number;
  curr: number;
  unit: string;
  direction: string;
  change: number;
}) {
  return (
    <div className="p-3.5 rounded-2xl bg-card border border-border/80 shadow-sm text-center">
      <p className="text-[10px] font-bold text-on-surface-variant uppercase tracking-wider mb-1">
        {label}
      </p>
      <p className="font-display font-extrabold text-lg text-on-surface tabular-nums">
        {curr}
        {unit && (
          <span className="text-xs font-normal text-on-surface-variant ml-0.5">
            {unit}
          </span>
        )}
      </p>
      <div
        className={`flex items-center justify-center gap-1 text-xs font-bold mt-0.5 ${
          direction === "up"
            ? "text-emerald-500"
            : direction === "down"
            ? "text-red-500"
            : "text-on-surface-variant"
        }`}
      >
        {direction === "up" ? (
          <TrendingUp className="h-3 w-3" />
        ) : direction === "down" ? (
          <TrendingDown className="h-3 w-3" />
        ) : (
          <Minus className="h-3 w-3" />
        )}
        {change !== 0 ? `${change > 0 ? "+" : ""}${change}%` : "="}
      </div>
    </div>
  );
}
