"use client";
// ---------------------------------------------------------------
// OverloadHQ – Progress Page
// Line charts, weekly comparisons, auto-generated descriptions.
// ---------------------------------------------------------------

import { useState } from "react";
import { useAuth } from "@/lib/auth-context";
import { api } from "@/lib/api";
import { useQuery } from "@tanstack/react-query";
import { MUSCLE_GROUPS, MUSCLE_GROUP_LABELS } from "@/lib/config";
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

  // Get all workouts to extract exercise names
  const { data: workoutsData } = useQuery({
    queryKey: ["all-workouts-for-progress"],
    queryFn: () => api.workouts.list({ limit: "200" }),
  });

  // Extract unique exercise names
  const allExercises = [
    ...new Set(
      (workoutsData?.workouts || []).flatMap((w: any) =>
        w.sets.map((s: any) => s.exerciseName)
      )
    ),
  ].sort() as string[];

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

  const chartData = (progressData?.chartData || []).map((d: any) => ({
    ...d,
    date: formatDateShort(d.date),
    maxWeight: kgToDisplay(d.maxWeight),
    totalVolume: kgToDisplay(d.totalVolume),
    estimated1RM: kgToDisplay(d.estimated1RM),
  }));

  const comparison = progressData?.comparison;
  const description = progressData?.description;

  const chartColor = "hsl(151, 80%, 48%)";
  const chartColorFaded = "hsl(151, 80%, 48%, 0.1)";

  return (
    <div className="space-y-6 max-w-2xl mx-auto">
      <h1 className="text-2xl font-bold">Progress</h1>

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
                <div className="grid grid-cols-2 gap-3">
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
                      onClick={() => setSelectedExercise(pr.exerciseName)}
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
