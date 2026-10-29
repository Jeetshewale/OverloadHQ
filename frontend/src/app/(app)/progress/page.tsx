"use client";
// ---------------------------------------------------------------
// OverloadHQ – Progress Page
// Exercise charts, split-based progressive overload tracking,
// weekly comparisons, auto-generated descriptions, PRs
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

  // Blue-themed chart colors
  const chartColor = "hsl(217, 91%, 60%)";
  const chartColorFaded = "hsl(217, 91%, 60%, 0.1)";

  return (
    <div className="space-y-6 max-w-2xl mx-auto pb-12">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Progress</h1>
      </div>

      {/* Tab Switcher */}
      <div className="flex gap-1 p-1 rounded-xl bg-muted/50 border border-border/50">
        <button
          onClick={() => setActiveTab("overload")}
          className={`flex-1 flex items-center justify-center gap-2 py-2.5 px-4 rounded-lg text-sm font-medium transition-all ${
            activeTab === "overload"
              ? "bg-primary text-primary-foreground shadow-sm"
              : "text-muted-foreground hover:text-foreground hover:bg-muted"
          }`}
        >
          <Zap className="h-4 w-4" />
          Split Overload
        </button>
        <button
          onClick={() => setActiveTab("exercises")}
          className={`flex-1 flex items-center justify-center gap-2 py-2.5 px-4 rounded-lg text-sm font-medium transition-all ${
            activeTab === "exercises"
              ? "bg-primary text-primary-foreground shadow-sm"
              : "text-muted-foreground hover:text-foreground hover:bg-muted"
          }`}
        >
          <BarChart3 className="h-4 w-4" />
          Exercise Charts
        </button>
      </div>

      {/* === SPLIT OVERLOAD TAB === */}
      {activeTab === "overload" && (
        <div className="space-y-4">
          {/* Split Selector */}
          <Card>
            <CardContent className="p-4 space-y-3">
              <div className="flex items-center gap-2">
                <Layers className="h-4 w-4 text-primary" />
                <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  Your Split
                </span>
              </div>
              <div className="flex flex-wrap gap-1.5">
                {WORKOUT_SPLITS.map((s) => (
                  <button
                    key={s}
                    onClick={() => setSelectedSplit(s)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all border ${
                      selectedSplit === s
                        ? "bg-primary text-primary-foreground border-primary"
                        : "bg-secondary/60 text-muted-foreground border-border/40 hover:bg-muted hover:text-foreground"
                    }`}
                  >
                    {WORKOUT_SPLIT_LABELS[s]}
                  </button>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Overload Info Banner */}
          <div className="flex items-start gap-3 p-3 rounded-lg bg-primary/5 border border-primary/15">
            <Zap className="h-5 w-5 text-primary flex-shrink-0 mt-0.5" />
            <div>
              <p className="text-sm font-medium">Progressive Overload Tracking</p>
              <p className="text-xs text-muted-foreground mt-0.5">
                Progressive overload is tracked after every <strong>2 workout sessions</strong> per muscle group.
                Your most recent 2 sessions for each muscle are compared below.
              </p>
            </div>
          </div>

          {/* Overload Cards */}
          {overloadLoading ? (
            <div className="py-12 text-center">
              <Loader2 className="h-6 w-6 animate-spin mx-auto text-muted-foreground" />
              <p className="text-xs text-muted-foreground mt-2">Analyzing your overload...</p>
            </div>
          ) : (overloadData?.muscleAnalysis || []).length === 0 ? (
            <Card className="border-dashed">
              <CardContent className="py-8 text-center">
                <Dumbbell className="h-8 w-8 mx-auto text-muted-foreground/40 mb-2" />
                <p className="text-sm text-muted-foreground">
                  No workout data yet. Log your first workout to start tracking overload!
                </p>
              </CardContent>
            </Card>
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
        <div className="space-y-4">
          {/* Exercise selector */}
          <div className="space-y-3">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search exercises..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>

            <div className="flex flex-wrap gap-2">
              {filteredExercises.slice(0, 15).map((name) => (
                <button
                  key={name}
                  onClick={() => {
                    setSelectedExercise(name);
                    setSearchQuery("");
                  }}
                  className={`px-3 py-1.5 rounded-full text-sm font-medium transition-all ${
                    selectedExercise === name
                      ? "bg-primary text-primary-foreground"
                      : "bg-secondary text-secondary-foreground hover:bg-accent"
                  }`}
                >
                  {name}
                </button>
              ))}
              {filteredExercises.length === 0 && (
                <p className="text-sm text-muted-foreground py-2">
                  No exercises found. Log some workouts first!
                </p>
              )}
            </div>
          </div>

          {/* Exercise Progress */}
          {selectedExercise && (
            <>
              {progressLoading ? (
                <div className="py-12 text-center">
                  <Loader2 className="h-6 w-6 animate-spin mx-auto text-muted-foreground" />
                </div>
              ) : chartData.length === 0 ? (
                <Card className="border-dashed">
                  <CardContent className="py-8 text-center text-muted-foreground">
                    No data for {selectedExercise}
                  </CardContent>
                </Card>
              ) : (
                <div className="space-y-4 animate-fade-in">
                  {/* Description */}
                  {description && (
                    <Card className="glow-border">
                      <CardContent className="py-4">
                        <p className="text-sm leading-relaxed">{description}</p>
                      </CardContent>
                    </Card>
                  )}

                  {/* Week vs Week Comparison */}
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
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-sm">
                        Max Weight ({unit.toLowerCase()})
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="h-48">
                        <ResponsiveContainer width="100%" height="100%">
                          <AreaChart data={chartData}>
                            <defs>
                              <linearGradient id="weightGrad" x1="0" y1="0" x2="0" y2="1">
                                <stop offset="5%" stopColor={chartColor} stopOpacity={0.3} />
                                <stop offset="95%" stopColor={chartColor} stopOpacity={0} />
                              </linearGradient>
                            </defs>
                            <CartesianGrid strokeDasharray="3 3" stroke="hsl(220, 14%, 18%)" />
                            <XAxis
                              dataKey="date"
                              tick={{ fill: "hsl(215, 15%, 55%)", fontSize: 11 }}
                              axisLine={{ stroke: "hsl(220, 14%, 18%)" }}
                            />
                            <YAxis
                              tick={{ fill: "hsl(215, 15%, 55%)", fontSize: 11 }}
                              axisLine={{ stroke: "hsl(220, 14%, 18%)" }}
                            />
                            <Tooltip
                              contentStyle={{
                                backgroundColor: "hsl(220, 18%, 10%)",
                                border: "1px solid hsl(220, 14%, 18%)",
                                borderRadius: "8px",
                                fontSize: 12,
                              }}
                            />
                            <Area
                              type="monotone"
                              dataKey="maxWeight"
                              stroke={chartColor}
                              fill="url(#weightGrad)"
                              strokeWidth={2}
                              dot={{ fill: chartColor, r: 4 }}
                              activeDot={{ r: 6 }}
                            />
                          </AreaChart>
                        </ResponsiveContainer>
                      </div>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader>
                      <CardTitle className="text-sm">Best Reps at Max Weight</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="h-48">
                        <ResponsiveContainer width="100%" height="100%">
                          <LineChart data={chartData}>
                            <CartesianGrid strokeDasharray="3 3" stroke="hsl(220, 14%, 18%)" />
                            <XAxis
                              dataKey="date"
                              tick={{ fill: "hsl(215, 15%, 55%)", fontSize: 11 }}
                              axisLine={{ stroke: "hsl(220, 14%, 18%)" }}
                            />
                            <YAxis
                              tick={{ fill: "hsl(215, 15%, 55%)", fontSize: 11 }}
                              axisLine={{ stroke: "hsl(220, 14%, 18%)" }}
                            />
                            <Tooltip
                              contentStyle={{
                                backgroundColor: "hsl(220, 18%, 10%)",
                                border: "1px solid hsl(220, 14%, 18%)",
                                borderRadius: "8px",
                                fontSize: 12,
                              }}
                            />
                            <Line
                              type="monotone"
                              dataKey="bestReps"
                              stroke="#60a5fa"
                              strokeWidth={2}
                              dot={{ fill: "#60a5fa", r: 4 }}
                            />
                          </LineChart>
                        </ResponsiveContainer>
                      </div>
                    </CardContent>
                  </Card>


                  <Card>
                    <CardHeader>
                      <CardTitle className="text-sm">
                        Estimated 1RM ({unit.toLowerCase()})
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="h-48">
                        <ResponsiveContainer width="100%" height="100%">
                          <LineChart data={chartData}>
                            <CartesianGrid strokeDasharray="3 3" stroke="hsl(220, 14%, 18%)" />
                            <XAxis
                              dataKey="date"
                              tick={{ fill: "hsl(215, 15%, 55%)", fontSize: 11 }}
                              axisLine={{ stroke: "hsl(220, 14%, 18%)" }}
                            />
                            <YAxis
                              tick={{ fill: "hsl(215, 15%, 55%)", fontSize: 11 }}
                              axisLine={{ stroke: "hsl(220, 14%, 18%)" }}
                            />
                            <Tooltip
                              contentStyle={{
                                backgroundColor: "hsl(220, 18%, 10%)",
                                border: "1px solid hsl(220, 14%, 18%)",
                                borderRadius: "8px",
                                fontSize: 12,
                              }}
                            />
                            <Line
                              type="monotone"
                              dataKey="estimated1RM"
                              stroke="#a78bfa"
                              strokeWidth={2}
                              dot={{ fill: "#a78bfa", r: 4 }}
                            />
                          </LineChart>
                        </ResponsiveContainer>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              )}
            </>
          )}
        </div>
      )}

      {/* PRs Section */}
      {prsData?.recentPRs?.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-sm flex items-center gap-2">
              <Trophy className="h-4 w-4 text-yellow-400" />
              All-Time Personal Records
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {prsData.prs
                ?.filter((p: any) => p.type === "MAX_WEIGHT")
                .slice(0, 10)
                .map((pr: any, i: number) => (
                  <div
                    key={i}
                    className="flex items-center justify-between py-1.5 border-b border-border/50 last:border-0"
                  >
                    <button
                      onClick={() => {
                        setSelectedExercise(pr.exerciseName);
                        setActiveTab("exercises");
                      }}
                      className="text-sm font-medium hover:text-primary transition-colors text-left"
                    >
                      {pr.exerciseName}
                    </button>
                    <div className="flex items-center gap-2">
                      <span className="text-sm text-muted-foreground">
                        {formatWeight(pr.value, unit)}
                      </span>
                      {pr.isNew && (
                        <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-primary/20 text-primary font-bold">
                          NEW
                        </span>
                      )}
                    </div>
                  </div>
                ))}
            </div>
          </CardContent>
        </Card>
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
      color: "text-blue-400",
      bg: "bg-blue-400/10",
      border: "border-blue-400/20",
      label: "Steady",
    },
    RECOVERY: {
      icon: AlertTriangle,
      color: "text-amber-500",
      bg: "bg-amber-500/10",
      border: "border-amber-500/20",
      label: "Recovery Phase",
    },
    BASELINE_SET: {
      icon: Clock,
      color: "text-muted-foreground",
      bg: "bg-muted/50",
      border: "border-border/40",
      label: "Day 1 of 2",
    },
    NO_SESSIONS: {
      icon: Dumbbell,
      color: "text-muted-foreground",
      bg: "bg-muted/30",
      border: "border-border/30",
      label: "No Data",
    },
  };

  const config = statusConfig[analysis.status as keyof typeof statusConfig] || statusConfig.STEADY;
  const StatusIcon = config.icon;

  return (
    <Card className={`border ${config.border} overflow-hidden`}>
      <button
        onClick={onToggle}
        className="w-full text-left"
      >
        <CardContent className="p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className={`h-10 w-10 rounded-xl ${config.bg} flex items-center justify-center`}>
                <span className="text-lg">{MUSCLE_GROUP_EMOJIS[analysis.muscleGroup] || "💪"}</span>
              </div>
              <div>
                <p className="text-sm font-semibold">
                  {MUSCLE_GROUP_LABELS[analysis.muscleGroup] || analysis.muscleGroup}
                </p>
                <div className="flex items-center gap-2 mt-0.5">
                  <span className={`inline-flex items-center gap-1 text-[11px] font-medium ${config.color}`}>
                    <StatusIcon className="h-3 w-3" />
                    {config.label}
                  </span>
                  <span className="text-[10px] text-muted-foreground">
                    {analysis.sessionCount} session{analysis.sessionCount !== 1 ? "s" : ""}
                  </span>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-3">
              {/* Mini progress ring */}
              {analysis.isOverloadEvaluated && (
                <div className="text-right">
                  {analysis.volumeChange !== 0 && (
                    <span className={`inline-flex items-center gap-0.5 text-xs font-bold ${
                      analysis.volumeChange > 0 ? "text-emerald-500" : "text-red-400"
                    }`}>
                      {analysis.volumeChange > 0 ? (
                        <ArrowUpRight className="h-3.5 w-3.5" />
                      ) : (
                        <ArrowDownRight className="h-3.5 w-3.5" />
                      )}
                      {analysis.volumeChange > 0 ? "+" : ""}{analysis.volumeChange}%
                    </span>
                  )}
                  <p className="text-[10px] text-muted-foreground">volume</p>
                </div>
              )}
              <ChevronDown className={`h-4 w-4 text-muted-foreground transition-transform ${expanded ? "rotate-180" : ""}`} />
            </div>
          </div>
        </CardContent>
      </button>

      {/* Expanded Details */}
      {expanded && (
        <div className="border-t border-border/40 bg-muted/20 p-4 space-y-3">
          {/* Status message */}
          <p className="text-xs text-muted-foreground leading-relaxed">
            {analysis.message}
          </p>

          {/* Session dates */}
          {analysis.session1Date && (
            <div className="flex items-center gap-3 text-xs">
              <div className="flex-1 p-2 rounded-lg bg-background border border-border/50 text-center">
                <p className="text-[10px] text-muted-foreground mb-0.5">Session 1</p>
                <p className="font-medium">{analysis.session1Date}</p>
                {analysis.session1Volume != null && (
                  <p className="text-[10px] text-muted-foreground mt-0.5">Vol: {analysis.session1Volume}</p>
                )}
              </div>
              {analysis.session2Date && (
                <>
                  <TrendingUp className="h-4 w-4 text-primary flex-shrink-0" />
                  <div className="flex-1 p-2 rounded-lg bg-background border border-border/50 text-center">
                    <p className="text-[10px] text-muted-foreground mb-0.5">Session 2</p>
                    <p className="font-medium">{analysis.session2Date}</p>
                    {analysis.session2Volume != null && (
                      <p className="text-[10px] text-muted-foreground mt-0.5">Vol: {analysis.session2Volume}</p>
                    )}
                  </div>
                </>
              )}
            </div>
          )}

          {/* Per-exercise breakdown */}
          {analysis.exercises && analysis.exercises.length > 0 && (
            <div className="space-y-1.5">
              <p className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">
                Exercise Breakdown
              </p>
              {analysis.exercises.map((ex: any, i: number) => (
                <div
                  key={i}
                  className={`flex items-center justify-between p-2 rounded-lg text-xs border ${
                    ex.isOverload
                      ? "bg-emerald-500/5 border-emerald-500/15"
                      : "bg-background border-border/40"
                  }`}
                >
                  <div className="flex items-center gap-2">
                    {ex.isOverload ? (
                      <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500 flex-shrink-0" />
                    ) : (
                      <Minus className="h-3.5 w-3.5 text-muted-foreground flex-shrink-0" />
                    )}
                    <span className="font-medium">{ex.name}</span>
                  </div>
                  <div className="flex items-center gap-3 text-[11px] text-muted-foreground">
                    <span>
                      {ex.day1MaxWeight != null ? `${kgToDisplay(ex.day1MaxWeight)}→` : ""}
                      {kgToDisplay(ex.day2MaxWeight)} {unit.toLowerCase()}
                    </span>
                    <span>
                      {ex.day1Reps != null ? `${ex.day1Reps}→` : ""}
                      {ex.day2Reps} reps
                    </span>
                    {ex.volumeChange != null && (
                      <span className={`font-bold ${
                        ex.volumeChange > 0 ? "text-emerald-500" : ex.volumeChange < 0 ? "text-red-400" : "text-muted-foreground"
                      }`}>
                        {ex.volumeChange > 0 ? "+" : ""}{ex.volumeChange}%
                      </span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </Card>
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
    <Card>
      <CardContent className="p-3 text-center">
        <p className="text-[10px] text-muted-foreground font-medium mb-1">
          {label}
        </p>
        <p className="text-lg font-bold">
          {curr}
          {unit && <span className="text-xs font-normal text-muted-foreground ml-0.5">{unit}</span>}
        </p>
        <div
          className={`flex items-center justify-center gap-1 text-xs font-medium mt-0.5 ${
            direction === "up"
              ? "text-emerald-400"
              : direction === "down"
              ? "text-red-400"
              : "text-muted-foreground"
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
      </CardContent>
    </Card>
  );
}
