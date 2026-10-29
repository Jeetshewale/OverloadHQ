"use client";
// ---------------------------------------------------------------
// OverloadHQ – History Page
// Stitch Prototype styling with warm card surfaces, pill buttons,
// muscle group chips, and tactile workout session details
// ---------------------------------------------------------------

import { useState } from "react";
import { useAuth } from "@/lib/auth-context";
import { api } from "@/lib/api";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { MUSCLE_GROUPS, MUSCLE_GROUP_LABELS, MUSCLE_GROUP_EMOJIS } from "@/lib/config";
import { formatWeight, formatDate, formatReps } from "@/lib/utils";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/components/ui/use-toast";
import {
  Loader2,
  Trash2,
  ChevronDown,
  ChevronUp,
  Search,
  Filter,
  Calendar,
  Edit3,
  Dumbbell,
  ArrowRight,
} from "lucide-react";
import Link from "next/link";

export default function HistoryPage() {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const unit = user?.preferredUnit || "KG";

  const [filters, setFilters] = useState({
    muscleGroup: "",
    exercise: "",
    dateFrom: "",
    dateTo: "",
  });
  const [showFilters, setShowFilters] = useState(false);
  const [page, setPage] = useState(1);
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const queryParams: Record<string, string> = {
    page: String(page),
    limit: "20",
  };
  if (filters.muscleGroup) queryParams.muscleGroup = filters.muscleGroup;
  if (filters.exercise) queryParams.exercise = filters.exercise;
  if (filters.dateFrom) queryParams.dateFrom = filters.dateFrom;
  if (filters.dateTo) queryParams.dateTo = filters.dateTo;

  const { data, isLoading } = useQuery({
    queryKey: ["workouts", queryParams],
    queryFn: () => api.workouts.list(queryParams),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => api.workouts.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["workouts"] });
      queryClient.invalidateQueries({ queryKey: ["progress-summary"] });
      toast({ title: "Workout deleted", variant: "default" });
    },
  });

  const workouts = data?.workouts || [];
  const pagination = data?.pagination;

  return (
    <div className="space-y-6 max-w-2xl mx-auto pb-16">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-display text-2xl sm:text-3xl font-extrabold text-on-surface tracking-tight">
            Workout History
          </h1>
          <p className="text-xs sm:text-sm text-on-surface-variant mt-0.5">
            Browse and review your past training sessions.
          </p>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={() => setShowFilters(!showFilters)}
          className="rounded-full text-xs font-semibold px-4 h-9 gap-1.5 border-border"
        >
          <Filter className="h-3.5 w-3.5 text-primary" />
          <span>Filters</span>
          {showFilters ? (
            <ChevronUp className="h-3 w-3" />
          ) : (
            <ChevronDown className="h-3 w-3" />
          )}
        </Button>
      </div>

      {/* Collapsible Filters Card */}
      {showFilters && (
        <div className="p-5 rounded-2xl md:rounded-3xl bg-card border border-border/80 shadow-sm space-y-3.5 animate-fade-in">
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-on-surface-variant uppercase tracking-wider">
              Muscle Group
            </label>
            <select
              value={filters.muscleGroup}
              onChange={(e) => {
                setFilters({ ...filters, muscleGroup: e.target.value });
                setPage(1);
              }}
              className="w-full h-10 rounded-xl border border-border bg-surface-container-low px-3 text-xs font-medium text-on-surface focus:outline-none"
            >
              <option value="">All Muscle Groups</option>
              {MUSCLE_GROUPS.map((mg) => (
                <option key={mg} value={mg}>
                  {MUSCLE_GROUP_LABELS[mg]}
                </option>
              ))}
            </select>
          </div>
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-on-surface-variant uppercase tracking-wider">
              Search Exercise
            </label>
            <div className="relative">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-on-surface-variant" />
              <Input
                placeholder="e.g. Bench Press, Squat..."
                value={filters.exercise}
                onChange={(e) => {
                  setFilters({ ...filters, exercise: e.target.value });
                  setPage(1);
                }}
                className="pl-9 h-10 bg-surface-container-low rounded-xl border-border/60 text-xs"
              />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-2">
            <div className="space-y-1">
              <label className="text-xs font-semibold text-on-surface-variant">From Date</label>
              <Input
                type="date"
                value={filters.dateFrom}
                onChange={(e) => setFilters({ ...filters, dateFrom: e.target.value })}
                className="h-10 bg-surface-container-low rounded-xl text-xs"
              />
            </div>
            <div className="space-y-1">
              <label className="text-xs font-semibold text-on-surface-variant">To Date</label>
              <Input
                type="date"
                value={filters.dateTo}
                onChange={(e) => setFilters({ ...filters, dateTo: e.target.value })}
                className="h-10 bg-surface-container-low rounded-xl text-xs"
              />
            </div>
          </div>
          <button
            type="button"
            onClick={() => {
              setFilters({ muscleGroup: "", exercise: "", dateFrom: "", dateTo: "" });
              setPage(1);
            }}
            className="text-xs font-semibold text-primary hover:opacity-80 transition-opacity"
          >
            Clear all filters
          </button>
        </div>
      )}

      {/* Workout list */}
      {isLoading ? (
        <div className="py-16 text-center">
          <Loader2 className="h-7 w-7 animate-spin mx-auto text-primary" />
          <p className="text-xs font-medium text-on-surface-variant mt-2">Loading past workouts...</p>
        </div>
      ) : workouts.length === 0 ? (
        <div className="py-14 text-center rounded-3xl border border-dashed border-border/80 p-8 space-y-3 bg-surface-container-low">
          <Calendar className="h-10 w-10 text-on-surface-variant/40 mx-auto mb-2" />
          <h3 className="font-display font-bold text-base text-on-surface">No Workouts Found</h3>
          <p className="text-xs text-on-surface-variant max-w-xs mx-auto">
            Log your workouts to build your training history and track progressive overload!
          </p>
          <Link href="/log" className="inline-block pt-1">
            <Button className="rounded-full text-xs font-semibold px-5 h-9 bg-primary text-primary-foreground">
              Log Workout
            </Button>
          </Link>
        </div>
      ) : (
        <div className="space-y-3">
          {workouts.map((w: any) => {
            const isExpanded = expandedId === w.id;
            const exerciseGroups = new Map<string, any[]>();
            for (const s of w.sets) {
              if (!exerciseGroups.has(s.exerciseName))
                exerciseGroups.set(s.exerciseName, []);
              exerciseGroups.get(s.exerciseName)!.push(s);
            }

            return (
              <div
                key={w.id}
                className={`rounded-2xl md:rounded-3xl border bg-card transition-all overflow-hidden ${
                  isExpanded
                    ? "border-primary/40 shadow-md ring-1 ring-primary/20"
                    : "border-border/80 hover:border-border shadow-sm"
                }`}
              >
                <div
                  className="p-4 sm:p-5 flex items-center justify-between cursor-pointer hover:bg-surface-container-low transition-colors"
                  onClick={() => setExpandedId(isExpanded ? null : w.id)}
                >
                  <div className="flex items-center gap-3.5">
                    <div className="w-11 h-11 rounded-2xl bg-surface-container flex items-center justify-center text-xl flex-shrink-0">
                      <span>{MUSCLE_GROUP_EMOJIS[w.muscleGroup] || "💪"}</span>
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-display font-bold text-sm sm:text-base text-on-surface">
                          {MUSCLE_GROUP_LABELS[w.muscleGroup] || w.muscleGroup}
                        </span>
                        {w.isSample && (
                          <span className="text-[10px] px-2 py-0.5 rounded-full bg-surface-container-high text-on-surface-variant font-bold uppercase">
                            SAMPLE
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-on-surface-variant mt-0.5">
                        {w.dayName} • {formatDate(w.date)} • {w.sets.length} sets
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <ChevronDown
                      className={`h-4 w-4 text-on-surface-variant transition-transform ${
                        isExpanded ? "rotate-180" : ""
                      }`}
                    />
                  </div>
                </div>

                {isExpanded && (
                  <div className="px-5 pb-5 pt-1 border-t border-border/40 bg-surface-container-low animate-fade-in space-y-4">
                    <div className="space-y-3 pt-3">
                      {Array.from(exerciseGroups.entries()).map(([name, sets]) => (
                        <div key={name} className="p-3 rounded-2xl bg-card border border-border/60">
                          <p className="font-display font-bold text-sm text-primary mb-1.5">
                            {name}
                          </p>
                          <div className="space-y-1">
                            {sets.map((s: any) => (
                              <div
                                key={s.id}
                                className="flex items-center justify-between text-xs text-on-surface-variant"
                              >
                                <span>Set {s.setNumber}</span>
                                <span className="font-semibold text-on-surface tabular-nums">
                                  {formatWeight(s.weightKg, unit)} × {formatReps(s.reps, s.repsMax)}
                                  {s.isFormImproved && (
                                    <span className="ml-1 text-emerald-500 font-bold">✓ form</span>
                                  )}
                                </span>
                              </div>
                            ))}
                          </div>
                        </div>
                      ))}
                    </div>

                    {w.notes && (
                      <p className="text-xs text-on-surface-variant italic px-1">
                        "{w.notes}"
                      </p>
                    )}

                    <div className="flex items-center justify-end gap-2 pt-2 border-t border-border/40">
                      <Link href={`/log?edit=${w.id}`} onClick={(e) => e.stopPropagation()}>
                        <Button
                          variant="outline"
                          size="sm"
                          className="rounded-full text-xs font-semibold px-4 h-8 gap-1.5 border-border"
                        >
                          <Edit3 className="h-3.5 w-3.5 text-primary" />
                          Edit Session
                        </Button>
                      </Link>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="rounded-full text-xs font-semibold text-destructive hover:text-destructive h-8 px-3"
                        onClick={(e) => {
                          e.stopPropagation();
                          if (confirm("Delete this workout permanently?")) {
                            deleteMutation.mutate(w.id);
                          }
                        }}
                      >
                        <Trash2 className="h-3.5 w-3.5 mr-1" />
                        Delete
                      </Button>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Pagination */}
      {pagination && pagination.totalPages > 1 && (
        <div className="flex items-center justify-center gap-2 pt-2">
          <Button
            variant="outline"
            size="sm"
            disabled={page <= 1}
            onClick={() => setPage((p) => p - 1)}
            className="rounded-full px-4 text-xs font-semibold"
          >
            Previous
          </Button>
          <span className="text-xs font-semibold text-on-surface-variant px-2">
            {page} / {pagination.totalPages}
          </span>
          <Button
            variant="outline"
            size="sm"
            disabled={page >= pagination.totalPages}
            onClick={() => setPage((p) => p + 1)}
            className="rounded-full px-4 text-xs font-semibold"
          >
            Next
          </Button>
        </div>
      )}
    </div>
  );
}
