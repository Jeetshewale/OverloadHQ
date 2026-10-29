"use client";
// ---------------------------------------------------------------
// OverloadHQ – Log & Edit Workout Page
// Stitch Prototype-matched tactile hardware logger layout
// ---------------------------------------------------------------

import { useState, useEffect, useCallback, useRef, Suspense, useMemo } from "react";
import Link from "next/link";
import { useAuth } from "@/lib/auth-context";
import { api } from "@/lib/api";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  MUSCLE_GROUPS,
  MUSCLE_GROUP_LABELS,
  MUSCLE_GROUP_EMOJIS,
  MUSCLE_PRESETS,
  WORKOUT_SPLITS,
  WORKOUT_SPLIT_LABELS,
  WORKOUT_SPLIT_DESCRIPTIONS,
} from "@/lib/config";
import { formatWeight, getDayName } from "@/lib/utils";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/components/ui/use-toast";
import {
  Plus,
  Copy,
  Trash2,
  Check,
  Loader2,
  Calendar as CalendarIcon,
  ChevronDown,
  X,
  Timer,
  Edit3,
  Save,
  CheckCircle2,
  AlertCircle,
  Zap,
  Layers,
  ArrowLeft,
  Minus,
  Dumbbell,
  BarChart3,
  Flame,
  Hourglass,
  FastForward,
  Play,
  Pause,
} from "lucide-react";
import { useRouter, useSearchParams } from "next/navigation";

interface SetEntry {
  id: string;
  exerciseName: string;
  setNumber: number;
  weightKg: number | string;
  reps: number | string;
  repsMax: number | string;
  isFormImproved: boolean;
  formNote: string;
  isCompleted?: boolean;
}

interface ExerciseGroup {
  name: string;
  sets: SetEntry[];
  saved?: boolean;
}

function generateId() {
  return Math.random().toString(36).substring(2, 9);
}

const DAYS_SHORT = [
  { key: "Mon", dayIndex: 1, label: "Monday" },
  { key: "Tue", dayIndex: 2, label: "Tuesday" },
  { key: "Wed", dayIndex: 3, label: "Wednesday" },
  { key: "Thu", dayIndex: 4, label: "Thursday" },
  { key: "Fri", dayIndex: 5, label: "Friday" },
  { key: "Sat", dayIndex: 6, label: "Saturday" },
  { key: "Sun", dayIndex: 0, label: "Sunday" },
];

function getDateForDayInCurrentWeek(targetDayIndex: number): string {
  const now = new Date();
  const currentDay = now.getDay();
  const diff =
    targetDayIndex === 0
      ? currentDay === 0
        ? 0
        : 7 - currentDay
      : targetDayIndex - currentDay;
  const targetDate = new Date(now);
  targetDate.setDate(now.getDate() + diff);
  return targetDate.toISOString().split("T")[0];
}

function LogWorkoutContent() {
  const { user } = useAuth();
  const { toast } = useToast();
  const router = useRouter();
  const searchParams = useSearchParams();
  const queryClient = useQueryClient();
  const dateInputRef = useRef<HTMLInputElement>(null);

  const editId = searchParams.get("edit");
  const unit = user?.preferredUnit || "KG";
  const kgToDisplay = (kg: number) =>
    unit === "LB" ? Math.round(kg * 2.20462 * 10) / 10 : kg;
  const displayToKg = (val: number) =>
    unit === "LB" ? Math.round((val / 2.20462) * 10) / 10 : val;

  const todayStr = new Date().toISOString().split("T")[0];
  const [date, setDate] = useState(todayStr);
  const [selectedMuscles, setSelectedMuscles] = useState<string[]>([]);
  const [split, setSplit] = useState<string>(user?.workoutSplit || "4_DAY_SPLIT");
  const [notes, setNotes] = useState("");
  const [exercises, setExercises] = useState<ExerciseGroup[]>([]);
  const [activeWorkoutId, setActiveWorkoutId] = useState<string | null>(editId);
  const [isSavingProgress, setIsSavingProgress] = useState(false);
  const [restTimer, setRestTimer] = useState<number | null>(null);
  const [restTimerActive, setRestTimerActive] = useState(false);
  const [initialRestDuration, setInitialRestDuration] = useState<number>(90);
  const [showPresets, setShowPresets] = useState(false);
  const [showConfigDrawer, setShowConfigDrawer] = useState(false);

  // Derive day name from selected date
  const dayName = date ? getDayName(new Date(date + "T12:00:00")) : "";

  // Toggle a muscle group on/off
  const toggleMuscle = (mg: string) => {
    setSelectedMuscles((prev) =>
      prev.includes(mg) ? prev.filter((m) => m !== mg) : [...prev, mg]
    );
  };

  // Apply a preset combo
  const applyPreset = (groups: string[]) => {
    setSelectedMuscles(groups);
    setShowPresets(false);
  };

  // Load existing workout if in edit mode
  const { data: existingWorkoutData, isLoading: loadingExisting } = useQuery({
    queryKey: ["edit-workout", editId],
    queryFn: () => api.workouts.get(editId!),
    enabled: !!editId,
  });

  useEffect(() => {
    if (existingWorkoutData?.workout) {
      const w = existingWorkoutData.workout;
      setDate(new Date(w.date).toISOString().split("T")[0]);
      if (w.muscleGroups && w.muscleGroups.length > 0) {
        setSelectedMuscles(w.muscleGroups);
      } else {
        setSelectedMuscles(w.muscleGroup ? [w.muscleGroup] : []);
      }
      if (w.split) setSplit(w.split);
      setNotes(w.notes || "");
      setActiveWorkoutId(w.id);

      const groupsMap = new Map<string, SetEntry[]>();
      for (const s of w.sets || []) {
        if (!groupsMap.has(s.exerciseName)) {
          groupsMap.set(s.exerciseName, []);
        }
        groupsMap.get(s.exerciseName)!.push({
          id: s.id || generateId(),
          exerciseName: s.exerciseName,
          setNumber: s.setNumber,
          weightKg: kgToDisplay(s.weightKg),
          reps: s.reps,
          repsMax: s.repsMax || "",
          isFormImproved: s.isFormImproved || false,
          formNote: s.formNote || "",
          isCompleted: true,
        });
      }

      const loadedGroups: ExerciseGroup[] = Array.from(groupsMap.entries()).map(
        ([name, sets]) => ({
          name,
          sets,
          saved: true,
        })
      );

      setExercises(loadedGroups);
    }
  }, [existingWorkoutData]);

  // Fetch exercise library for autocomplete
  const primaryMuscle = selectedMuscles[0] || "";
  const { data: exerciseLib } = useQuery({
    queryKey: ["exercises", primaryMuscle],
    queryFn: () => api.exercises.list(primaryMuscle || undefined),
    enabled: !!primaryMuscle,
  });

  const exerciseNames = (exerciseLib?.exercises || []).map((e: any) => e.name);

  const handleQuickDate = (targetDate: string) => {
    setDate(targetDate);
  };

  // Add exercise
  const addExercise = useCallback((name = "") => {
    const newExercise: ExerciseGroup = {
      name,
      sets: [
        {
          id: generateId(),
          exerciseName: name,
          setNumber: 1,
          weightKg: "",
          reps: "",
          repsMax: "",
          isFormImproved: false,
          formNote: "",
          isCompleted: false,
        },
      ],
      saved: false,
    };
    setExercises((prev) => [...prev, newExercise]);
  }, []);

  // Add set to exercise
  const addSet = (exIdx: number) => {
    setExercises((prev) =>
      prev.map((ex, i) => {
        if (i !== exIdx) return ex;
        const lastSet = ex.sets[ex.sets.length - 1];
        const newSet: SetEntry = {
          id: generateId(),
          exerciseName: ex.name,
          setNumber: ex.sets.length + 1,
          weightKg:
            lastSet?.weightKg !== undefined && lastSet?.weightKg !== ""
              ? lastSet.weightKg
              : "",
          reps: "",
          repsMax: "",
          isFormImproved: false,
          formNote: "",
          isCompleted: false,
        };
        return {
          ...ex,
          sets: [...ex.sets, newSet],
          saved: false,
        };
      })
    );
  };

  // Copy last set
  const copyLastSet = (exIdx: number) => {
    setExercises((prev) =>
      prev.map((ex, i) => {
        if (i !== exIdx) return ex;
        const lastSet = ex.sets[ex.sets.length - 1];
        if (!lastSet) return ex;
        const newSet: SetEntry = {
          ...lastSet,
          id: generateId(),
          setNumber: ex.sets.length + 1,
          isCompleted: false,
        };
        return {
          ...ex,
          sets: [...ex.sets, newSet],
          saved: false,
        };
      })
    );
  };

  // Remove set
  const removeSet = (exIdx: number, setIdx: number) => {
    setExercises((prev) =>
      prev
        .map((ex, i) => {
          if (i !== exIdx) return ex;
          const filtered = ex.sets.filter((_, sI) => sI !== setIdx);
          return {
            ...ex,
            sets: filtered.map((s, idx) => ({ ...s, setNumber: idx + 1 })),
            saved: false,
          };
        })
        .filter((ex) => ex.sets.length > 0)
    );
  };

  // Update set field
  const updateSet = (
    exIdx: number,
    setIdx: number,
    field: string,
    value: any
  ) => {
    setExercises((prev) =>
      prev.map((ex, i) => {
        if (i !== exIdx) return ex;
        return {
          ...ex,
          sets: ex.sets.map((s, sI) =>
            sI === setIdx ? { ...s, [field]: value } : s
          ),
          saved: false,
        };
      })
    );
  };

  // Step numeric value helper
  const adjustSetValue = (
    exIdx: number,
    setIdx: number,
    field: "weightKg" | "reps",
    delta: number
  ) => {
    const curVal = Number(exercises[exIdx]?.sets[setIdx]?.[field]) || 0;
    const step = field === "weightKg" ? 2.5 : 1;
    const newVal = Math.max(0, Math.round((curVal + delta * step) * 10) / 10);
    updateSet(exIdx, setIdx, field, newVal === 0 ? "" : newVal);
  };

  // Toggle set completion
  const toggleSetComplete = (exIdx: number, setIdx: number) => {
    const current = exercises[exIdx]?.sets[setIdx]?.isCompleted;
    updateSet(exIdx, setIdx, "isCompleted", !current);
    if (!current) {
      // Auto-trigger rest timer if not already active
      startTimer(initialRestDuration || 90);
    }
  };

  // Update exercise name
  const updateExerciseName = (exIdx: number, name: string) => {
    setExercises((prev) =>
      prev.map((ex, i) => {
        if (i !== exIdx) return ex;
        return {
          ...ex,
          name,
          sets: ex.sets.map((s) => ({ ...s, exerciseName: name })),
          saved: false,
        };
      })
    );
  };

  // Rest timer
  useEffect(() => {
    if (!restTimerActive || restTimer === null || restTimer <= 0) return;
    const interval = setInterval(() => {
      setRestTimer((t) => {
        if (t !== null && t <= 1) {
          setRestTimerActive(false);
          toast({
            title: "⏰ Rest complete!",
            description: "Ready for your next set.",
          });
          return null;
        }
        return t !== null ? t - 1 : null;
      });
    }, 1000);
    return () => clearInterval(interval);
  }, [restTimerActive, restTimer, toast]);

  const startTimer = (seconds: number) => {
    setInitialRestDuration(seconds);
    setRestTimer(seconds);
    setRestTimerActive(true);
  };

  // Live Summary Calculations
  const liveStats = useMemo(() => {
    let totalVol = 0;
    let completedSetsCount = 0;
    let totalSetsCount = 0;

    for (const ex of exercises) {
      for (const s of ex.sets) {
        totalSetsCount++;
        if (s.isCompleted) completedSetsCount++;
        const w = Number(s.weightKg) || 0;
        const r = Number(s.reps) || 0;
        totalVol += w * r;
      }
    }
    const percent =
      totalSetsCount > 0
        ? Math.round((completedSetsCount / totalSetsCount) * 100)
        : 0;
    return {
      totalVolume: Math.round(totalVol),
      completedSets: completedSetsCount,
      totalSets: totalSetsCount,
      progressPercent: percent,
    };
  }, [exercises]);

  // Format sets payload for backend
  const buildPayload = () => {
    const allSets = exercises.flatMap((ex) =>
      ex.sets.map((s) => ({
        exerciseName: ex.name.trim(),
        setNumber: s.setNumber,
        weightKg: displayToKg(Number(s.weightKg) || 0),
        reps: Number(s.reps) || 0,
        repsMax: s.repsMax ? Number(s.repsMax) : null,
        isFormImproved: s.isFormImproved,
        formNote: s.formNote || null,
      }))
    );
    return {
      date,
      muscleGroup: selectedMuscles[0] || "OTHER",
      muscleGroups: selectedMuscles.length > 0 ? selectedMuscles : ["OTHER"],
      split,
      notes: notes || null,
      sets: allSets,
    };
  };

  // Save current progress
  const saveProgress = async () => {
    if (selectedMuscles.length === 0) {
      toast({
        title: "Select at least one muscle group",
        variant: "destructive",
      });
      return;
    }
    const payload = buildPayload();
    if (
      payload.sets.length === 0 ||
      payload.sets.some((s) => !s.exerciseName)
    ) {
      toast({
        title: "Please fill in the exercise name and sets",
        variant: "destructive",
      });
      return;
    }

    setIsSavingProgress(true);
    try {
      if (activeWorkoutId) {
        await api.workouts.update(activeWorkoutId, payload);
      } else {
        const res = await api.workouts.create(payload);
        if (res.workout?.id) {
          setActiveWorkoutId(res.workout.id);
        }
      }
      setExercises((prev) => prev.map((ex) => ({ ...ex, saved: true })));
      queryClient.invalidateQueries({ queryKey: ["recent-workouts"] });
      queryClient.invalidateQueries({ queryKey: ["workouts"] });
      queryClient.invalidateQueries({ queryKey: ["progress-summary"] });
      toast({ title: "Workout progress saved!", variant: "default" });
    } catch (err: any) {
      toast({
        title: "Save failed",
        description: err.message,
        variant: "destructive",
      });
    } finally {
      setIsSavingProgress(false);
    }
  };

  // Final Submit
  const submitMutation = useMutation({
    mutationFn: async () => {
      if (selectedMuscles.length === 0)
        throw new Error("Select at least one muscle group");
      const payload = buildPayload();
      if (payload.sets.length === 0) throw new Error("Add at least one set");
      if (payload.sets.some((s) => !s.exerciseName))
        throw new Error("Fill in all exercise names");

      if (activeWorkoutId) {
        return api.workouts.update(activeWorkoutId, payload);
      } else {
        return api.workouts.create(payload);
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["recent-workouts"] });
      queryClient.invalidateQueries({ queryKey: ["workouts"] });
      queryClient.invalidateQueries({ queryKey: ["progress-summary"] });
      queryClient.invalidateQueries({ queryKey: ["prs"] });
      toast({
        title: activeWorkoutId ? "Workout updated! 🎉" : "Workout logged! 🎉",
        description: "Your session has been saved to your history.",
      });
      router.push("/history");
    },
    onError: (err: any) => {
      toast({
        title: "Failed to save workout",
        description: err.message,
        variant: "destructive",
      });
    },
  });

  if (loadingExisting) {
    return (
      <div className="py-24 text-center">
        <Loader2 className="h-8 w-8 animate-spin mx-auto text-primary" />
        <p className="text-sm text-on-surface-variant mt-2 font-medium">
          Loading workout session...
        </p>
      </div>
    );
  }

  return (
    <div className="relative w-full pb-28">
      {/* Subtle ambient glow decoration matching prototype */}
      <div className="absolute top-10 left-1/4 w-96 h-96 bg-primary/10 rounded-full blur-3xl pointer-events-none -z-10" />
      <div className="absolute top-48 right-10 w-80 h-80 bg-accent-amber/10 rounded-full blur-3xl pointer-events-none -z-10" />

      {/* Top Action Breadcrumb & Session Context */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-2 pb-4">
        <Link
          href="/dashboard"
          className="inline-flex items-center gap-1.5 text-on-surface-variant hover:text-on-surface text-sm font-semibold transition-colors group"
        >
          <ArrowLeft className="h-4 w-4 transition-transform group-hover:-translate-x-1" />
          <span>Back to Overview</span>
        </Link>
        <div className="flex flex-wrap items-center gap-2">
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-surface-container-high text-on-surface text-xs font-semibold uppercase tracking-wider">
            <span className="w-2 h-2 rounded-full bg-accent-mint animate-pulse" />
            {split ? WORKOUT_SPLIT_LABELS[split] : "Workout Session"}
          </span>
          {activeWorkoutId && (
            <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-semibold bg-primary/15 text-primary border border-primary/20">
              <Edit3 className="h-3 w-3" /> Editing #{activeWorkoutId.slice(-4)}
            </span>
          )}
          <button
            type="button"
            onClick={() => setShowConfigDrawer(!showConfigDrawer)}
            className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-surface-container hover:bg-surface-container-high text-on-surface text-xs font-semibold transition-colors"
          >
            <Layers className="h-3 w-3 text-primary" />
            <span>Split & Date</span>
            <ChevronDown
              className={`h-3 w-3 transition-transform ${
                showConfigDrawer ? "rotate-180" : ""
              }`}
            />
          </button>
        </div>
      </div>

      {/* Collapsible Session Config (Date, Split, Muscle Groups) */}
      {showConfigDrawer && (
        <div className="mb-6 space-y-4 p-5 rounded-2xl md:rounded-3xl bg-card border border-border/80 shadow-sm animate-fade-in">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Date picker */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label className="text-xs font-semibold uppercase tracking-wider text-on-surface-variant">
                  Workout Date
                </Label>
                <div className="flex items-center gap-1.5 text-xs">
                  <button
                    type="button"
                    onClick={() => handleQuickDate(todayStr)}
                    className={`px-2.5 py-0.5 rounded-full transition-all text-xs font-semibold ${
                      date === todayStr
                        ? "bg-primary text-primary-foreground"
                        : "text-on-surface-variant hover:bg-surface-container"
                    }`}
                  >
                    Today
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      const y = new Date();
                      y.setDate(y.getDate() - 1);
                      handleQuickDate(y.toISOString().split("T")[0]);
                    }}
                    className="px-2.5 py-0.5 rounded-full text-xs font-semibold text-on-surface-variant hover:bg-surface-container transition-all"
                  >
                    Yesterday
                  </button>
                </div>
              </div>
              <div
                onClick={() => dateInputRef.current?.showPicker?.()}
                className="relative flex items-center cursor-pointer rounded-full border border-border bg-surface-container-low hover:border-primary/50 transition-colors px-4 py-2"
              >
                <CalendarIcon className="h-4 w-4 text-primary mr-2.5 pointer-events-none" />
                <input
                  ref={dateInputRef}
                  type="date"
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                  className="w-full bg-transparent text-sm font-semibold focus:outline-none cursor-pointer text-on-surface"
                />
                <span className="text-xs font-bold px-2.5 py-1 rounded-full bg-surface-container-high text-on-surface ml-2">
                  {dayName}
                </span>
              </div>
            </div>

            {/* Workout Split */}
            <div className="space-y-2">
              <Label className="text-xs font-semibold uppercase tracking-wider text-on-surface-variant">
                Workout Split
              </Label>
              <div className="grid grid-cols-2 gap-1.5">
                {WORKOUT_SPLITS.map((s) => {
                  const isActive = split === s;
                  return (
                    <button
                      key={s}
                      type="button"
                      onClick={() => setSplit(s)}
                      className={`p-2 rounded-xl text-xs font-semibold text-left transition-all border ${
                        isActive
                          ? "bg-primary text-primary-foreground border-primary shadow-sm"
                          : "bg-surface-container-low hover:bg-surface-container border-border/60 text-on-surface-variant hover:text-on-surface"
                      }`}
                    >
                      <span className="truncate block">
                        {WORKOUT_SPLIT_LABELS[s]}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Muscle Groups Selection */}
          <div className="pt-2 border-t border-border/40 space-y-2">
            <div className="flex items-center justify-between">
              <Label className="text-xs font-semibold uppercase tracking-wider text-on-surface-variant">
                Target Muscle Groups (Multi-Select)
              </Label>
              <button
                type="button"
                onClick={() => setShowPresets(!showPresets)}
                className="inline-flex items-center gap-1 text-xs font-semibold text-primary hover:opacity-80 transition-opacity"
              >
                <Zap className="h-3 w-3" />
                Presets
                <ChevronDown
                  className={`h-3 w-3 transition-transform ${
                    showPresets ? "rotate-180" : ""
                  }`}
                />
              </button>
            </div>

            {showPresets && (
              <div className="flex flex-wrap gap-1.5 pb-2">
                {MUSCLE_PRESETS.map((preset) => {
                  const isActive =
                    preset.groups.length === selectedMuscles.length &&
                    preset.groups.every((g) => selectedMuscles.includes(g));
                  return (
                    <button
                      key={preset.label}
                      type="button"
                      onClick={() => applyPreset(preset.groups)}
                      className={`px-3 py-1 rounded-full text-xs font-semibold transition-all border ${
                        isActive
                          ? "bg-primary text-primary-foreground border-primary"
                          : "bg-surface-container text-on-surface-variant border-border hover:text-on-surface"
                      }`}
                    >
                      {preset.label}
                    </button>
                  );
                })}
              </div>
            )}

            <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 gap-1.5">
              {MUSCLE_GROUPS.map((mg) => {
                const isSelected = selectedMuscles.includes(mg);
                return (
                  <button
                    key={mg}
                    type="button"
                    onClick={() => toggleMuscle(mg)}
                    className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold transition-all border ${
                      isSelected
                        ? "bg-primary text-primary-foreground border-primary shadow-sm"
                        : "bg-surface-container-low hover:bg-surface-container border-border/60 text-on-surface-variant hover:text-on-surface"
                    }`}
                  >
                    <span>{MUSCLE_GROUP_EMOJIS[mg]}</span>
                    <span className="truncate">{MUSCLE_GROUP_LABELS[mg]}</span>
                    {isSelected && (
                      <Check className="h-3 w-3 ml-auto flex-shrink-0" />
                    )}
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* Active Session Console Header */}
      <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-4 mb-6">
        <div>
          <div className="flex flex-wrap items-center gap-2 mb-1">
            <h1 className="font-display text-2xl sm:text-3xl lg:text-4xl font-extrabold text-on-surface tracking-tight">
              {activeWorkoutId ? "Edit Workout Session" : "Log Active Session"}
            </h1>
            {selectedMuscles.length > 0 && (
              <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-primary/10 text-primary font-semibold text-xs">
                {selectedMuscles.map((m) => MUSCLE_GROUP_LABELS[m]).join(" • ")}
              </span>
            )}
          </div>
          <p className="text-sm text-on-surface-variant">
            Track weights, reps, and progressive overload sets in real-time.
          </p>
        </div>

        {/* Quick action pill button */}
        <div className="flex items-center gap-2">
          <Button
            type="button"
            variant="outline"
            onClick={saveProgress}
            disabled={isSavingProgress}
            className="rounded-full gap-1.5 text-xs font-semibold"
          >
            {isSavingProgress ? (
              <Loader2 className="h-3.5 w-3.5 animate-spin" />
            ) : (
              <Save className="h-3.5 w-3.5 text-primary" />
            )}
            <span>Save Draft</span>
          </Button>
          <Button
            type="button"
            onClick={() => addExercise("")}
            className="rounded-full gap-1.5 text-xs font-semibold bg-primary text-primary-foreground"
          >
            <Plus className="h-3.5 w-3.5" />
            <span>Add Exercise</span>
          </Button>
        </div>
      </div>

      {/* Dark Recovery Hero Bar (subscrr.app-inspired Tactile Hardware Capsule) */}
      <div className="w-full bg-[#0B0B0B] dark:bg-[#1C1C1E] text-white rounded-2xl md:rounded-3xl p-4 sm:p-5 mb-8 shadow-xl border border-white/10 flex flex-col md:flex-row items-center justify-between gap-4 transition-all">
        <div className="flex items-center gap-4 w-full md:w-auto">
          {/* Circular countdown visual ring */}
          <div className="relative w-12 h-12 flex-shrink-0 flex items-center justify-center">
            <svg className="w-full h-full -rotate-90" viewBox="0 0 36 36">
              <path
                className="text-white/10"
                d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                fill="none"
                stroke="currentColor"
                strokeWidth="3"
              />
              <path
                className="text-primary transition-all duration-1000 ease-linear"
                d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                fill="none"
                stroke="currentColor"
                strokeDasharray="100, 100"
                strokeDashoffset={
                  restTimer !== null
                    ? 100 -
                      Math.round(
                        (restTimer / (initialRestDuration || 90)) * 100
                      )
                    : 0
                }
                strokeLinecap="round"
                strokeWidth="3.5"
              />
            </svg>
            <Hourglass className="h-4 w-4 absolute text-accent-amber" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-[11px] font-bold tracking-wider uppercase text-white/60">
                Inter-set Recovery
              </span>
              {restTimerActive && (
                <span className="inline-flex w-1.5 h-1.5 rounded-full bg-accent-amber animate-ping" />
              )}
            </div>
            <div className="flex items-baseline gap-2">
              <span className="font-display text-2xl font-bold tracking-tight tabular-nums text-white">
                {restTimer !== null
                  ? `${Math.floor(restTimer / 60)}:${(restTimer % 60)
                      .toString()
                      .padStart(2, "0")}`
                  : "00:00"}
              </span>
              <span className="text-xs text-white/50">
                {restTimerActive ? "countdown" : "ready for set"}
              </span>
            </div>
          </div>
        </div>

        {/* Rest action pills */}
        <div className="flex items-center gap-2 w-full md:w-auto justify-end flex-wrap">
          <button
            type="button"
            onClick={() => {
              if (restTimer === null) startTimer(90);
              else setRestTimer((t) => (t !== null ? t + 30 : 30));
            }}
            className="px-3.5 py-1.5 rounded-full bg-white/10 hover:bg-white/20 active:scale-95 text-white font-semibold text-xs transition-all flex items-center gap-1"
          >
            <Plus className="h-3.5 w-3.5" />
            <span>30s</span>
          </button>
          <button
            type="button"
            onClick={() => startTimer(60)}
            className="px-3.5 py-1.5 rounded-full bg-white/10 hover:bg-white/20 active:scale-95 text-white font-semibold text-xs transition-all"
          >
            1m
          </button>
          <button
            type="button"
            onClick={() => startTimer(120)}
            className="px-3.5 py-1.5 rounded-full bg-white/10 hover:bg-white/20 active:scale-95 text-white font-semibold text-xs transition-all"
          >
            2m
          </button>
          <button
            type="button"
            onClick={() => {
              setRestTimer(null);
              setRestTimerActive(false);
            }}
            className="px-3.5 py-1.5 rounded-full bg-white/10 hover:bg-white/20 active:scale-95 text-white/80 hover:text-white font-semibold text-xs transition-all flex items-center gap-1"
          >
            <FastForward className="h-3.5 w-3.5" />
            <span>Skip</span>
          </button>
          <button
            type="button"
            onClick={() => setRestTimerActive(!restTimerActive)}
            className="w-9 h-9 rounded-full bg-primary text-white hover:opacity-90 active:scale-95 flex items-center justify-center transition-all shadow-md ml-1"
          >
            {restTimerActive ? (
              <Pause className="h-4 w-4" />
            ) : (
              <Play className="h-4 w-4 ml-0.5" />
            )}
          </button>
        </div>
      </div>

      {/* Main Two-Column Layout (70% Left Exercises, 30% Right Session Summary) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* LEFT SECTION: Exercise Cards (8 cols) */}
        <div className="lg:col-span-8 flex flex-col gap-6">
          {exercises.map((ex, exIdx) => (
            <div
              key={exIdx}
              className="bg-card rounded-2xl md:rounded-3xl p-5 md:p-6 shadow-sm border border-border/80 transition-all hover:border-border"
            >
              {/* Exercise Header */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-5">
                <div className="flex-1 flex items-center gap-2.5">
                  <span className="w-8 h-8 rounded-full bg-primary/10 text-primary font-display font-bold text-xs flex items-center justify-center flex-shrink-0">
                    #{exIdx + 1}
                  </span>
                  <div className="flex-1">
                    <Input
                      placeholder="Exercise name (e.g. Barbell Bench Press)"
                      value={ex.name}
                      onChange={(e) =>
                        updateExerciseName(exIdx, e.target.value)
                      }
                      className="font-display font-bold text-base md:text-lg bg-surface-container-low border-transparent focus:border-primary/40 rounded-xl h-10 px-3"
                      list={`exercise-list-${exIdx}`}
                    />
                    <datalist id={`exercise-list-${exIdx}`}>
                      {exerciseNames.map((n: string) => (
                        <option key={n} value={n} />
                      ))}
                    </datalist>
                  </div>
                </div>

                <div className="flex items-center gap-1.5 self-end sm:self-center">
                  <button
                    type="button"
                    title="Remove Exercise"
                    onClick={() =>
                      setExercises((prev) =>
                        prev.filter((_, i) => i !== exIdx)
                      )
                    }
                    className="p-2 rounded-full text-on-surface-variant hover:text-destructive hover:bg-destructive/10 transition-colors"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </div>

              {/* Set Table / Grid Header */}
              <div className="grid grid-cols-12 gap-2 text-on-surface-variant text-[11px] font-bold uppercase tracking-wider px-2 pb-2">
                <div className="col-span-2 text-center">Set</div>
                <div className="col-span-4 text-center">
                  Weight ({unit.toLowerCase()})
                </div>
                <div className="col-span-4 text-center">Reps</div>
                <div className="col-span-2 text-center">Done</div>
              </div>

              {/* Set Rows Container */}
              <div className="flex flex-col gap-2.5">
                {ex.sets.map((set, setIdx) => (
                  <div
                    key={set.id}
                    className={`grid grid-cols-12 gap-2 items-center p-2 rounded-2xl transition-colors ${
                      set.isCompleted
                        ? "bg-primary/5 border border-primary/20"
                        : "bg-surface-container-low hover:bg-surface-container border border-transparent"
                    }`}
                  >
                    {/* Set Number */}
                    <div className="col-span-2 flex items-center justify-center font-display font-bold text-xs text-on-surface">
                      {set.setNumber}
                    </div>

                    {/* Weight Stepper */}
                    <div className="col-span-4 flex items-center justify-center">
                      <div className="inline-flex items-center bg-card rounded-full p-1 border border-border/60 shadow-sm w-full max-w-[130px] justify-between">
                        <button
                          type="button"
                          onClick={() =>
                            adjustSetValue(exIdx, setIdx, "weightKg", -1)
                          }
                          className="w-6 h-6 rounded-full flex items-center justify-center bg-surface-container hover:bg-surface-container-high text-on-surface active:scale-90 transition-transform"
                        >
                          <Minus className="h-3 w-3" />
                        </button>
                        <input
                          type="number"
                          step="0.5"
                          placeholder="0"
                          value={set.weightKg}
                          onChange={(e) =>
                            updateSet(exIdx, setIdx, "weightKg", e.target.value)
                          }
                          className="w-12 text-center font-display font-bold text-sm bg-transparent border-0 focus:outline-none tabular-nums text-on-surface p-0"
                        />
                        <button
                          type="button"
                          onClick={() =>
                            adjustSetValue(exIdx, setIdx, "weightKg", 1)
                          }
                          className="w-6 h-6 rounded-full flex items-center justify-center bg-surface-container hover:bg-surface-container-high text-on-surface active:scale-90 transition-transform"
                        >
                          <Plus className="h-3 w-3" />
                        </button>
                      </div>
                    </div>

                    {/* Reps Stepper */}
                    <div className="col-span-4 flex items-center justify-center">
                      <div className="inline-flex items-center bg-card rounded-full p-1 border border-border/60 shadow-sm w-full max-w-[110px] justify-between">
                        <button
                          type="button"
                          onClick={() =>
                            adjustSetValue(exIdx, setIdx, "reps", -1)
                          }
                          className="w-6 h-6 rounded-full flex items-center justify-center bg-surface-container hover:bg-surface-container-high text-on-surface active:scale-90 transition-transform"
                        >
                          <Minus className="h-3 w-3" />
                        </button>
                        <input
                          type="number"
                          placeholder="0"
                          value={set.reps}
                          onChange={(e) =>
                            updateSet(exIdx, setIdx, "reps", e.target.value)
                          }
                          className="w-10 text-center font-display font-bold text-sm bg-transparent border-0 focus:outline-none tabular-nums text-on-surface p-0"
                        />
                        <button
                          type="button"
                          onClick={() =>
                            adjustSetValue(exIdx, setIdx, "reps", 1)
                          }
                          className="w-6 h-6 rounded-full flex items-center justify-center bg-surface-container hover:bg-surface-container-high text-on-surface active:scale-90 transition-transform"
                        >
                          <Plus className="h-3 w-3" />
                        </button>
                      </div>
                    </div>

                    {/* Checkmark Completion Button */}
                    <div className="col-span-2 flex items-center justify-center gap-1">
                      <button
                        type="button"
                        onClick={() => toggleSetComplete(exIdx, setIdx)}
                        className={`w-8 h-8 rounded-full flex items-center justify-center shadow-sm transition-all active:scale-90 ${
                          set.isCompleted
                            ? "bg-primary text-primary-foreground scale-105"
                            : "bg-surface-container hover:bg-surface-container-high text-on-surface-variant hover:text-on-surface"
                        }`}
                      >
                        <Check className="h-4 w-4" />
                      </button>
                      {ex.sets.length > 1 && (
                        <button
                          type="button"
                          onClick={() => removeSet(exIdx, setIdx)}
                          className="p-1 rounded-full text-on-surface-variant/40 hover:text-destructive transition-colors hidden sm:inline-flex"
                        >
                          <X className="h-3 w-3" />
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>

              {/* Set Actions & Rest Presets */}
              <div className="flex flex-wrap items-center justify-between gap-2 mt-4 pt-3 border-t border-border/40">
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => addSet(exIdx)}
                    className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-surface-container hover:bg-surface-container-high text-on-surface text-xs font-semibold transition-all active:scale-95"
                  >
                    <Plus className="h-3.5 w-3.5" />
                    <span>Add Set</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => copyLastSet(exIdx)}
                    className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-surface-container-low hover:bg-surface-container text-on-surface-variant hover:text-on-surface text-xs font-semibold transition-all active:scale-95"
                  >
                    <Copy className="h-3 w-3" />
                    <span>Duplicate</span>
                  </button>
                </div>

                <div className="flex items-center gap-1.5 text-xs text-on-surface-variant">
                  <span className="font-semibold text-[11px]">Rest:</span>
                  <button
                    type="button"
                    onClick={() => startTimer(60)}
                    className="px-2.5 py-0.5 rounded-full bg-surface-container hover:bg-surface-container-high font-semibold text-[11px] transition-colors"
                  >
                    1m
                  </button>
                  <button
                    type="button"
                    onClick={() => startTimer(90)}
                    className="px-2.5 py-0.5 rounded-full bg-surface-container hover:bg-surface-container-high font-semibold text-[11px] transition-colors"
                  >
                    1.5m
                  </button>
                  <button
                    type="button"
                    onClick={() => startTimer(120)}
                    className="px-2.5 py-0.5 rounded-full bg-surface-container hover:bg-surface-container-high font-semibold text-[11px] transition-colors"
                  >
                    2m
                  </button>
                </div>
              </div>
            </div>
          ))}

          {/* Empty state when no exercises */}
          {exercises.length === 0 && (
            <div className="py-16 text-center rounded-3xl border border-dashed border-border/80 p-8 space-y-4 bg-surface-container-low">
              <div className="h-14 w-14 rounded-full bg-primary/10 text-primary mx-auto flex items-center justify-center">
                <Dumbbell className="h-7 w-7" />
              </div>
              <div>
                <h3 className="font-display font-bold text-lg text-on-surface">
                  No Exercises Added Yet
                </h3>
                <p className="text-sm text-on-surface-variant max-w-sm mx-auto mt-1">
                  Add your first exercise to begin your training session. Log sets
                  and track progressive overload.
                </p>
              </div>
              <Button
                type="button"
                onClick={() => addExercise("")}
                className="rounded-full gap-2 px-6 h-11 bg-primary text-primary-foreground font-semibold"
              >
                <Plus className="h-4 w-4" />
                Add First Exercise
              </Button>
            </div>
          )}

          {/* Workout Notes */}
          {exercises.length > 0 && (
            <div className="space-y-2 p-5 rounded-2xl md:rounded-3xl bg-card border border-border/80 shadow-sm">
              <Label className="text-xs font-semibold uppercase tracking-wider text-on-surface-variant">
                Session Notes (Optional)
              </Label>
              <Input
                placeholder="e.g. Felt strong today on bench, clean bar path, good recovery..."
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                className="text-sm bg-surface-container-low border-border/60 rounded-xl"
              />
            </div>
          )}
        </div>

        {/* RIGHT SECTION: Live Session Summary Rail (4 cols) */}
        <div className="lg:col-span-4 flex flex-col gap-4 lg:sticky lg:top-24">
          {/* Live Session Summary Card */}
          <div className="bg-card rounded-2xl md:rounded-3xl p-5 shadow-sm border border-border/80">
            <div className="flex items-center justify-between pb-3 border-b border-border/40">
              <div className="flex items-center gap-2">
                <BarChart3 className="h-4 w-4 text-primary" />
                <h3 className="font-display font-bold text-base text-on-surface">
                  Session Summary
                </h3>
              </div>
              <span className="text-[11px] font-bold text-primary px-2.5 py-0.5 rounded-full bg-primary/10">
                Live
              </span>
            </div>

            {/* Real-Time Volume & Sets */}
            <div className="grid grid-cols-2 gap-3 my-3">
              <div className="p-3.5 rounded-2xl bg-surface-container-low flex flex-col">
                <span className="text-[10px] font-bold text-on-surface-variant uppercase tracking-wider">
                  Volume Load
                </span>
                <span className="font-display text-xl font-extrabold text-on-surface tabular-nums mt-1 leading-tight">
                  {liveStats.totalVolume.toLocaleString()}{" "}
                  <span className="text-xs font-normal text-on-surface-variant">
                    {unit.toLowerCase()}
                  </span>
                </span>
              </div>

              <div className="p-3.5 rounded-2xl bg-surface-container-low flex flex-col">
                <span className="text-[10px] font-bold text-on-surface-variant uppercase tracking-wider">
                  Sets Done
                </span>
                <span className="font-display text-xl font-extrabold text-on-surface tabular-nums mt-1 leading-tight">
                  {liveStats.completedSets}{" "}
                  <span className="text-xs font-normal text-on-surface-variant">
                    / {liveStats.totalSets}
                  </span>
                </span>
                <div className="w-full bg-surface-container h-1.5 rounded-full mt-2 overflow-hidden">
                  <div
                    className="bg-primary h-full rounded-full transition-all duration-300"
                    style={{ width: `${liveStats.progressPercent}%` }}
                  />
                </div>
              </div>
            </div>

            {/* Target Muscle Distribution */}
            {selectedMuscles.length > 0 && (
              <div className="pt-2 space-y-2">
                <span className="text-[10px] font-bold text-on-surface-variant uppercase tracking-wider block">
                  Target Muscle Groups
                </span>
                <div className="flex flex-wrap gap-1.5">
                  {selectedMuscles.map((mg) => (
                    <span
                      key={mg}
                      className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-surface-container text-on-surface text-xs font-semibold"
                    >
                      <span>{MUSCLE_GROUP_EMOJIS[mg]}</span>
                      <span>{MUSCLE_GROUP_LABELS[mg]}</span>
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* High Impact Finish Workout CTA */}
          <div className="space-y-2">
            <Button
              type="button"
              onClick={() => submitMutation.mutate()}
              disabled={submitMutation.isPending || exercises.length === 0}
              className="w-full h-14 rounded-full bg-primary hover:opacity-95 active:scale-95 text-primary-foreground font-display font-bold text-base flex items-center justify-center gap-2 shadow-lg transition-all"
            >
              {submitMutation.isPending ? (
                <Loader2 className="h-5 w-5 animate-spin" />
              ) : (
                <CheckCircle2 className="h-5 w-5" />
              )}
              <span>
                {activeWorkoutId
                  ? "Update Workout Session"
                  : "Finish Workout"}
              </span>
            </Button>

            <Button
              type="button"
              variant="outline"
              onClick={saveProgress}
              disabled={isSavingProgress || exercises.length === 0}
              className="w-full h-11 rounded-full border border-border font-semibold text-xs gap-1.5"
            >
              {isSavingProgress ? (
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
              ) : (
                <Save className="h-3.5 w-3.5 text-primary" />
              )}
              <span>Save Progress as Draft</span>
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function LogWorkoutPage() {
  return (
    <Suspense
      fallback={
        <div className="py-24 text-center">
          <Loader2 className="h-8 w-8 animate-spin mx-auto text-primary" />
          <p className="text-sm text-on-surface-variant mt-2 font-medium">
            Loading workout logger...
          </p>
        </div>
      }
    >
      <LogWorkoutContent />
    </Suspense>
  );
}
