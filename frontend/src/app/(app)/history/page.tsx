"use client";
// ---------------------------------------------------------------
// OverloadHQ – History Page
// List, filter, and manage past workouts.
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
    <div className="space-y-6 max-w-lg mx-auto">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">History</h1>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setShowFilters(!showFilters)}
        >
          <Filter className="h-4 w-4 mr-1" />
          Filter
          {showFilters ? (
            <ChevronUp className="h-3 w-3 ml-1" />
          ) : (
            <ChevronDown className="h-3 w-3 ml-1" />
          )}
        </Button>
      </div>

      {/* Filters */}
      {showFilters && (
        <Card className="animate-fade-in">
          <CardContent className="p-4 space-y-3">
            <div className="space-y-2">
              <label className="text-xs text-muted-foreground">Muscle Group</label>
              <select
                value={filters.muscleGroup}
                onChange={(e) => {
                  setFilters({ ...filters, muscleGroup: e.target.value });
                  setPage(1);
                }}
                className="w-full h-9 rounded-md border border-input bg-background px-3 text-sm"
              >
                <option value="">All</option>
                {MUSCLE_GROUPS.map((mg) => (
                  <option key={mg} value={mg}>
                    {MUSCLE_GROUP_LABELS[mg]}
                  </option>
                ))}
              </select>
            </div>
            <div className="space-y-2">
              <label className="text-xs text-muted-foreground">Exercise</label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3 w-3 text-muted-foreground" />
                <Input
                  placeholder="Search exercise..."
                  value={filters.exercise}
                  onChange={(e) => {
                    setFilters({ ...filters, exercise: e.target.value });
                    setPage(1);
                  }}
                  className="pl-8 h-9"
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div className="space-y-1">
                <label className="text-xs text-muted-foreground">From</label>
                <Input
                  type="date"
                  value={filters.dateFrom}
                  onChange={(e) => setFilters({ ...filters, dateFrom: e.target.value })}
                  className="h-9"
                />
              </div>
              <div className="space-y-1">
                <label className="text-xs text-muted-foreground">To</label>
                <Input
                  type="date"
                  value={filters.dateTo}
                  onChange={(e) => setFilters({ ...filters, dateTo: e.target.value })}
                  className="h-9"
                />
              </div>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => {
                setFilters({ muscleGroup: "", exercise: "", dateFrom: "", dateTo: "" });
                setPage(1);
              }}
            >
              Clear filters
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Workout list */}
      {isLoading ? (
        <div className="py-12 text-center">
          <Loader2 className="h-6 w-6 animate-spin mx-auto text-muted-foreground" />
        </div>
      ) : workouts.length === 0 ? (
        <Card className="border-dashed">
          <CardContent className="py-10 text-center">
            <Calendar className="h-10 w-10 text-muted-foreground mx-auto mb-3" />
            <p className="text-muted-foreground">No workouts found</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {workouts.map((w: any) => {
            const isExpanded = expandedId === w.id;
            // Group sets by exercise
            const exerciseGroups = new Map<string, any[]>();
            for (const s of w.sets) {
              if (!exerciseGroups.has(s.exerciseName))
                exerciseGroups.set(s.exerciseName, []);
              exerciseGroups.get(s.exerciseName)!.push(s);
            }

            return (
              <Card
                key={w.id}
                className={`cursor-pointer transition-all ${isExpanded ? "ring-1 ring-primary/30" : ""}`}
              >
                <div
                  className="p-4 flex items-center justify-between"
                  onClick={() => setExpandedId(isExpanded ? null : w.id)}
                >
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-lg">
                        {MUSCLE_GROUP_EMOJIS[w.muscleGroup]}
                      </span>
                      <span className="font-medium">
                        {MUSCLE_GROUP_LABELS[w.muscleGroup]}
                      </span>
                      {w.isSample && (
                        <span className="text-[10px] px-1.5 py-0.5 rounded bg-secondary text-muted-foreground">
                          SAMPLE
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      {w.dayName} · {formatDate(w.date)} · {w.sets.length} sets
                    </p>
                  </div>
                  {isExpanded ? (
                    <ChevronUp className="h-4 w-4 text-muted-foreground" />
                  ) : (
                    <ChevronDown className="h-4 w-4 text-muted-foreground" />
                  )}
                </div>

                {isExpanded && (
                  <CardContent className="pt-0 animate-fade-in">
                    {Array.from(exerciseGroups.entries()).map(([name, sets]) => (
                      <div key={name} className="mb-3">
                        <p className="text-sm font-medium text-primary mb-1">{name}</p>
                        <div className="space-y-0.5">
                          {sets.map((s: any) => (
                            <p key={s.id} className="text-sm text-muted-foreground pl-3">
                              Set {s.setNumber}: {formatWeight(s.weightKg, unit)} ×{" "}
                              {formatReps(s.reps, s.repsMax)}
                              {s.isFormImproved && " ✓ form"}
                            </p>
                          ))}
                        </div>
                      </div>
                    ))}
                    {w.notes && (
                      <p className="text-xs text-muted-foreground mt-2 italic">
                        {w.notes}
                      </p>
                    )}
                    <div className="flex items-center justify-end gap-2 mt-3 pt-2 border-t border-border/40">
                      <Link href={`/log?edit=${w.id}`} onClick={(e) => e.stopPropagation()}>
                        <Button
                          variant="outline"
                          size="sm"
                          className="gap-1.5 text-xs h-8"
                        >
                          <Edit3 className="h-3.5 w-3.5 text-primary" />
                          Edit Workout
                        </Button>
                      </Link>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="text-destructive hover:text-destructive h-8 text-xs"
                        onClick={(e) => {
                          e.stopPropagation();
                          if (confirm("Delete this workout permanently?")) {
                            deleteMutation.mutate(w.id);
                          }
                        }}
                      >
                        <Trash2 className="h-3 w-3 mr-1" />
                        Delete
                      </Button>
                    </div>
                  </CardContent>
                )}
              </Card>
            );
          })}
        </div>
      )}

      {/* Pagination */}
      {pagination && pagination.totalPages > 1 && (
        <div className="flex items-center justify-center gap-2">
          <Button
            variant="outline"
            size="sm"
            disabled={page <= 1}
            onClick={() => setPage((p) => p - 1)}
          >
            Previous
          </Button>
          <span className="text-sm text-muted-foreground">
            {page} / {pagination.totalPages}
          </span>
          <Button
            variant="outline"
            size="sm"
            disabled={page >= pagination.totalPages}
            onClick={() => setPage((p) => p + 1)}
          >
            Next
          </Button>
        </div>
      )}
    </div>
  );
}
