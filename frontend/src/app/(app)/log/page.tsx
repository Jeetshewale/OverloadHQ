"use client";
// ---------------------------------------------------------------
// OverloadHQ – Log & Edit Workout Page
// Multi-muscle-group badges, workout split selector, interactive calendar
// ---------------------------------------------------------------

import { useState, useEffect, useCallback, useRef, Suspense } from "react";
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
  // Calculate difference to target day
  const diff = targetDayIndex === 0 
    ? (currentDay === 0 ? 0 : 7 - currentDay) 
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
  const kgToDisplay = (kg: number) => (unit === "LB" ? Math.round(kg * 2.20462 * 10) / 10 : kg);
  const displayToKg = (val: number) => (unit === "LB" ? Math.round((val / 2.20462) * 10) / 10 : val);

  const todayStr = new Date().toISOString().split("T")[0];
  const [date, setDate] = useState(todayStr);
  // Multi-select muscle groups
  const [selectedMuscles, setSelectedMuscles] = useState<string[]>([]);
  // Workout split
  const [split, setSplit] = useState<string>(user?.workoutSplit || "4_DAY_SPLIT");
  const [notes, setNotes] = useState("");
  const [exercises, setExercises] = useState<ExerciseGroup[]>([]);
  const [activeWorkoutId, setActiveWorkoutId] = useState<string | null>(editId);
  const [isSavingProgress, setIsSavingProgress] = useState(false);
  const [restTimer, setRestTimer] = useState<number | null>(null);
  const [restTimerActive, setRestTimerActive] = useState(false);
  const [showPresets, setShowPresets] = useState(false);

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
      // Restore multi-select muscle groups
      if (w.muscleGroups && w.muscleGroups.length > 0) {
        setSelectedMuscles(w.muscleGroups);
      } else {
        setSelectedMuscles(w.muscleGroup ? [w.muscleGroup] : []);
      }
      if (w.split) setSplit(w.split);
      setNotes(w.notes || "");
      setActiveWorkoutId(w.id);

      // Group sets into exercises
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

  // Fetch exercise library for autocomplete — uses primary muscle
  const primaryMuscle = selectedMuscles[0] || "";
  const { data: exerciseLib } = useQuery({
    queryKey: ["exercises", primaryMuscle],
    queryFn: () => api.exercises.list(primaryMuscle || undefined),
    enabled: !!primaryMuscle,
  });

  const exerciseNames = (exerciseLib?.exercises || []).map((e: any) => e.name);

  // Quick date setter
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
        },
      ],
      saved: false,
    };
    setExercises((prev) => [...prev, newExercise]);
  }, []);

  // Add set to exercise — IMMUTABLE (guarantees exactly 1 set added)
  const addSet = (exIdx: number) => {
    setExercises((prev) =>
      prev.map((ex, i) => {
        if (i !== exIdx) return ex;
        const lastSet = ex.sets[ex.sets.length - 1];
        const newSet: SetEntry = {
          id: generateId(),
          exerciseName: ex.name,
          setNumber: ex.sets.length + 1,
          weightKg: lastSet?.weightKg !== undefined && lastSet?.weightKg !== "" ? lastSet.weightKg : "",
          reps: "",
          repsMax: "",
          isFormImproved: false,
          formNote: "",
        };
        return {
          ...ex,
          sets: [...ex.sets, newSet],
          saved: false,
        };
      })
    );
  };

  // Copy last set — IMMUTABLE
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
        };
        return {
          ...ex,
          sets: [...ex.sets, newSet],
          saved: false,
        };
      })
    );
  };

  // Remove set — IMMUTABLE
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

  // Update set field — IMMUTABLE
  const updateSet = (exIdx: number, setIdx: number, field: string, value: any) => {
    setExercises((prev) =>
      prev.map((ex, i) => {
        if (i !== exIdx) return ex;
        return {
          ...ex,
          sets: ex.sets.map((s, sI) => (sI === setIdx ? { ...s, [field]: value } : s)),
          saved: false,
        };
      })
    );
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
          toast({ title: "⏰ Rest complete!", description: "Ready for your next set." });
          return null;
        }
        return t !== null ? t - 1 : null;
      });
    }, 1000);
    return () => clearInterval(interval);
  }, [restTimerActive, restTimer, toast]);

  const startTimer = (seconds: number) => {
    setRestTimer(seconds);
    setRestTimerActive(true);
  };

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

  // Save current progress (Save exercise one-by-one)
  const saveProgress = async () => {
    if (selectedMuscles.length === 0) {
      toast({ title: "Select at least one muscle group", variant: "destructive" });
      return;
    }
    const payload = buildPayload();
    if (payload.sets.length === 0 || payload.sets.some((s) => !s.exerciseName)) {
      toast({ title: "Please fill in the exercise name and sets", variant: "destructive" });
      return;
    }

    setIsSavingProgress(true);
    try {
      if (activeWorkoutId) {
        // Update existing workout
        await api.workouts.update(activeWorkoutId, payload);
      } else {
        // Create new workout draft
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
      toast({ title: "Save failed", description: err.message, variant: "destructive" });
    } finally {
      setIsSavingProgress(false);
    }
  };

  // Final Submit
  const submitMutation = useMutation({
    mutationFn: async () => {
      if (selectedMuscles.length === 0) throw new Error("Select at least one muscle group");
      const payload = buildPayload();
      if (payload.sets.length === 0) throw new Error("Add at least one set");
      if (payload.sets.some((s) => !s.exerciseName)) throw new Error("Fill in all exercise names");

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
      toast({ title: "Failed to save workout", description: err.message, variant: "destructive" });
    },
  });

  if (loadingExisting) {
    return (
      <div className="py-20 text-center">
        <Loader2 className="h-8 w-8 animate-spin mx-auto text-primary" />
        <p className="text-sm text-muted-foreground mt-2">Loading workout...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-2xl mx-auto pb-12">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">
            {activeWorkoutId ? "Edit Workout" : "Log Workout"}
          </h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            {activeWorkoutId ? "Update your session or add more completed exercises" : "Log exercises one by one as you complete them"}
          </p>
        </div>
        {activeWorkoutId && (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-primary/10 text-primary border border-primary/20">
            <Edit3 className="h-3 w-3" /> Editing #{activeWorkoutId.slice(-4)}
          </span>
        )}
      </div>

      {/* Date & Day Picker Card */}
      <Card>
        <CardContent className="p-4 space-y-4">
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                Workout Date & Day
              </Label>
              <div className="flex items-center gap-1.5 text-xs">
                <button
                  type="button"
                  onClick={() => handleQuickDate(todayStr)}
                  className={`px-2 py-0.5 rounded transition-all ${
                    date === todayStr ? "bg-primary text-primary-foreground font-medium" : "text-muted-foreground hover:bg-muted"
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
                  className="px-2 py-0.5 rounded text-muted-foreground hover:bg-muted transition-all"
                >
                  Yesterday
                </button>
              </div>
            </div>

            {/* Clickable Date Input */}
            <div
              onClick={() => dateInputRef.current?.showPicker?.()}
              className="relative flex items-center cursor-pointer rounded-lg border border-input bg-background hover:border-primary/50 transition-colors px-3 py-2"
            >
              <CalendarIcon className="h-4 w-4 text-primary mr-2.5 pointer-events-none" />
              <input
                ref={dateInputRef}
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="w-full bg-transparent text-sm font-medium focus:outline-none cursor-pointer"
              />
              <span className="text-xs font-semibold px-2 py-1 rounded bg-secondary text-foreground ml-2">
                {dayName}
              </span>
            </div>
          </div>

          {/* Quick Day of Week Selector */}
          <div className="space-y-1.5">
            <span className="text-xs text-muted-foreground">Or pick a day:</span>
            <div className="grid grid-cols-7 gap-1">
              {DAYS_SHORT.map((item) => {
                const isSelected = dayName === item.label;
                return (
                  <button
                    key={item.key}
                    type="button"
                    onClick={() => {
                      const d = getDateForDayInCurrentWeek(item.dayIndex);
                      setDate(d);
                    }}
                    className={`py-1.5 text-xs font-medium rounded-lg text-center transition-all ${
                      isSelected
                        ? "bg-primary text-primary-foreground font-bold shadow-sm"
                        : "bg-secondary/60 hover:bg-secondary text-muted-foreground hover:text-foreground"
                    }`}
                  >
                    {item.key}
                  </button>
                );
              })}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Workout Split Selector */}
      <Card>
        <CardContent className="p-4 space-y-3">
          <div className="flex items-center gap-2">
            <Layers className="h-4 w-4 text-primary" />
            <Label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Workout Split
            </Label>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-1.5">
            {WORKOUT_SPLITS.map((s) => {
              const isActive = split === s;
              return (
                <button
                  key={s}
                  type="button"
                  onClick={() => setSplit(s)}
                  className={`relative p-2.5 rounded-lg text-xs font-medium transition-all border text-left ${
                    isActive
                      ? "bg-primary text-primary-foreground border-primary shadow-sm"
                      : "bg-card hover:bg-muted border-border/60 text-muted-foreground hover:text-foreground"
                  }`}
                >
                  <span className="block font-semibold">{WORKOUT_SPLIT_LABELS[s]}</span>
                  {isActive && (
                    <Check className="absolute top-2 right-2 h-3.5 w-3.5" />
                  )}
                </button>
              );
            })}
          </div>
          {split && (
            <p className="text-[11px] text-muted-foreground leading-relaxed bg-secondary/40 rounded-lg px-3 py-2">
              <Zap className="inline h-3 w-3 text-primary mr-1" />
              {WORKOUT_SPLIT_DESCRIPTIONS[split]}
            </p>
          )}
        </CardContent>
      </Card>

      {/* Multi-Select Muscle Group Picker */}
      <Card>
        <CardContent className="p-4 space-y-3">
          <div className="flex items-center justify-between">
            <Label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Target Muscle Groups
            </Label>
            <button
              type="button"
              onClick={() => setShowPresets(!showPresets)}
              className="flex items-center gap-1 text-[11px] font-medium text-primary hover:text-primary/80 transition-colors"
            >
              <Zap className="h-3 w-3" />
              Quick Presets
              <ChevronDown className={`h-3 w-3 transition-transform ${showPresets ? "rotate-180" : ""}`} />
            </button>
          </div>

          {/* Quick Presets */}
          {showPresets && (
            <div className="flex flex-wrap gap-1.5 pb-2 border-b border-border/40">
              {MUSCLE_PRESETS.map((preset) => {
                const isActive = preset.groups.length === selectedMuscles.length &&
                  preset.groups.every((g) => selectedMuscles.includes(g));
                return (
                  <button
                    key={preset.label}
                    type="button"
                    onClick={() => applyPreset(preset.groups)}
                    className={`px-2.5 py-1 rounded-full text-[11px] font-medium transition-all border ${
                      isActive
                        ? "bg-primary text-primary-foreground border-primary"
                        : "bg-secondary/60 text-muted-foreground border-border/40 hover:bg-muted hover:text-foreground"
                    }`}
                  >
                    {preset.label}
                  </button>
                );
              })}
            </div>
          )}

          {/* Muscle group badges (multi-select) */}
          <div className="grid grid-cols-3 sm:grid-cols-4 gap-1.5">
            {MUSCLE_GROUPS.map((mg) => {
              const isSelected = selectedMuscles.includes(mg);
              return (
                <button
                  key={mg}
                  type="button"
                  onClick={() => toggleMuscle(mg)}
                  className={`flex items-center gap-1.5 p-2 rounded-lg text-xs font-medium transition-all border ${
                    isSelected
                      ? "bg-primary text-primary-foreground border-primary shadow-sm"
                      : "bg-card hover:bg-muted border-border/60 text-muted-foreground hover:text-foreground"
                  }`}
                >
                  <span>{MUSCLE_GROUP_EMOJIS[mg]}</span>
                  <span className="truncate">{MUSCLE_GROUP_LABELS[mg]}</span>
                  {isSelected && <Check className="h-3 w-3 ml-auto flex-shrink-0" />}
                </button>
              );
            })}
          </div>

          {/* Selected summary */}
          {selectedMuscles.length > 0 && (
            <div className="flex flex-wrap items-center gap-1.5 pt-1">
              <span className="text-[11px] text-muted-foreground">Selected:</span>
              {selectedMuscles.map((mg) => (
                <span
                  key={mg}
                  className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-primary/10 text-primary text-[11px] font-medium border border-primary/20"
                >
                  {MUSCLE_GROUP_EMOJIS[mg]} {MUSCLE_GROUP_LABELS[mg]}
                  <button
                    type="button"
                    onClick={() => toggleMuscle(mg)}
                    className="hover:text-destructive transition-colors ml-0.5"
                  >
                    <X className="h-2.5 w-2.5" />
                  </button>
                </span>
              ))}
              <button
                type="button"
                onClick={() => setSelectedMuscles([])}
                className="text-[10px] text-muted-foreground hover:text-destructive transition-colors ml-1"
              >
                Clear all
              </button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Floating Rest Timer Bar */}
      {restTimerActive && restTimer !== null && (
        <div className="sticky top-18 z-30 p-3 rounded-xl bg-card border border-primary/30 shadow-lg flex items-center justify-between animate-slide-up">
          <div className="flex items-center gap-2.5">
            <div className="h-8 w-8 rounded-full bg-primary/10 text-primary flex items-center justify-center">
              <Timer className="h-4 w-4 animate-pulse" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Rest Timer</p>
              <p className="text-lg font-bold font-mono tracking-tight text-primary">
                {Math.floor(restTimer / 60)}:{(restTimer % 60).toString().padStart(2, "0")}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Button
              type="button"
              size="sm"
              variant="outline"
              onClick={() => setRestTimer((t) => (t !== null ? t + 30 : 30))}
            >
              +30s
            </Button>
            <Button
              type="button"
              size="sm"
              variant="ghost"
              onClick={() => {
                setRestTimer(null);
                setRestTimerActive(false);
              }}
            >
              Stop
            </Button>
          </div>
        </div>
      )}

      {/* Exercises Section */}
      <div className="space-y-4">
        {exercises.map((ex, exIdx) => (
          <Card key={exIdx} className="overflow-hidden border border-border/70 shadow-sm">
            <CardHeader className="bg-muted/30 p-3.5 pb-3 border-b border-border/40">
              <div className="flex items-center justify-between gap-2">
                <div className="flex-1 flex items-center gap-2">
                  <span className="text-xs font-bold px-2 py-0.5 rounded bg-primary/15 text-primary">
                    #{exIdx + 1}
                  </span>
                  <Input
                    placeholder="Exercise name (e.g. Bench Press)"
                    value={ex.name}
                    onChange={(e) => updateExerciseName(exIdx, e.target.value)}
                    className="font-semibold text-sm bg-background h-9"
                    list={`exercise-list-${exIdx}`}
                  />
                  <datalist id={`exercise-list-${exIdx}`}>
                    {exerciseNames.map((n: string) => (
                      <option key={n} value={n} />
                    ))}
                  </datalist>
                </div>
                <button
                  type="button"
                  title="Remove Exercise"
                  onClick={() => setExercises((prev) => prev.filter((_, i) => i !== exIdx))}
                  className="p-1.5 rounded text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            </CardHeader>

            <CardContent className="p-3.5 space-y-3">
              {/* Sets Table */}
              <div className="space-y-2">
                <div className="grid grid-cols-12 gap-2 text-xs font-semibold text-muted-foreground px-1">
                  <span className="col-span-2 text-center">Set</span>
                  <span className="col-span-4">Weight ({unit.toLowerCase()})</span>
                  <span className="col-span-4">Reps</span>
                  <span className="col-span-2 text-right">Action</span>
                </div>

                {ex.sets.map((set, setIdx) => (
                  <div
                    key={set.id}
                    className="grid grid-cols-12 gap-2 items-center bg-secondary/30 hover:bg-secondary/50 p-1.5 rounded-lg transition-colors"
                  >
                    <span className="col-span-2 text-center font-bold text-xs text-muted-foreground">
                      {set.setNumber}
                    </span>
                    <div className="col-span-4">
                      <Input
                        type="number"
                        step="0.5"
                        placeholder="0"
                        value={set.weightKg}
                        onChange={(e) => updateSet(exIdx, setIdx, "weightKg", e.target.value)}
                        className="h-8 text-sm text-center bg-background"
                      />
                    </div>
                    <div className="col-span-4">
                      <Input
                        type="number"
                        placeholder="0"
                        value={set.reps}
                        onChange={(e) => updateSet(exIdx, setIdx, "reps", e.target.value)}
                        className="h-8 text-sm text-center bg-background"
                      />
                    </div>
                    <div className="col-span-2 flex items-center justify-end gap-1">
                      <button
                        type="button"
                        onClick={() => removeSet(exIdx, setIdx)}
                        disabled={ex.sets.length === 1}
                        title="Delete Set"
                        className="p-1 text-muted-foreground hover:text-destructive disabled:opacity-30"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>

              {/* Set Actions & Rest Timer Presets */}
              <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-border/40">
                <div className="flex items-center gap-1.5">
                  <Button
                    type="button"
                    size="sm"
                    variant="outline"
                    onClick={() => addSet(exIdx)}
                    className="h-8 text-xs gap-1"
                  >
                    <Plus className="h-3.5 w-3.5" />
                    Add Set
                  </Button>
                  <Button
                    type="button"
                    size="sm"
                    variant="ghost"
                    onClick={() => copyLastSet(exIdx)}
                    className="h-8 text-xs gap-1 text-muted-foreground hover:text-foreground"
                  >
                    <Copy className="h-3 w-3" />
                    Duplicate
                  </Button>
                </div>

                <div className="flex items-center gap-1 text-xs text-muted-foreground">
                  <span>Rest:</span>
                  <button
                    type="button"
                    onClick={() => startTimer(60)}
                    className="px-2 py-0.5 rounded bg-secondary hover:bg-muted text-[11px]"
                  >
                    1m
                  </button>
                  <button
                    type="button"
                    onClick={() => startTimer(90)}
                    className="px-2 py-0.5 rounded bg-secondary hover:bg-muted text-[11px]"
                  >
                    1.5m
                  </button>
                  <button
                    type="button"
                    onClick={() => startTimer(120)}
                    className="px-2 py-0.5 rounded bg-secondary hover:bg-muted text-[11px]"
                  >
                    2m
                  </button>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}

        {exercises.length === 0 && (
          <div className="py-12 text-center rounded-xl border border-dashed border-border/80 p-8 space-y-3 bg-muted/20">
            <div className="h-12 w-12 rounded-full bg-primary/10 text-primary mx-auto flex items-center justify-center">
              <Plus className="h-6 w-6" />
            </div>
            <div>
              <p className="font-semibold text-sm">No exercises added yet</p>
              <p className="text-xs text-muted-foreground mt-0.5">
                Add your first exercise, log the sets as you perform them, and save progress!
              </p>
            </div>
            <Button
              type="button"
              onClick={() => addExercise("")}
              className="gap-1.5"
            >
              <Plus className="h-4 w-4" />
              Add First Exercise
            </Button>
          </div>
        )}
      </div>

      {/* Workout Notes */}
      {exercises.length > 0 && (
        <div className="space-y-1.5">
          <Label className="text-xs text-muted-foreground">Session Notes (optional)</Label>
          <Input
            placeholder="e.g. Felt strong today, good energy levels"
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            className="text-sm bg-card"
          />
        </div>
      )}

      {/* Action Footer: Add Next Exercise & Save Progress */}
      {exercises.length > 0 && (
        <div className="space-y-3 pt-2">
          <div className="flex flex-col sm:flex-row items-center gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => addExercise("")}
              className="w-full sm:flex-1 h-11 gap-1.5 font-medium"
            >
              <Plus className="h-4 w-4" />
              + Add Another Exercise
            </Button>

            <Button
              type="button"
              variant="secondary"
              onClick={saveProgress}
              disabled={isSavingProgress}
              className="w-full sm:w-auto h-11 gap-2 px-5 font-medium border border-border"
            >
              {isSavingProgress ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Save className="h-4 w-4 text-primary" />
              )}
              Save Progress
            </Button>
          </div>

          <Button
            type="button"
            onClick={() => submitMutation.mutate()}
            disabled={submitMutation.isPending}
            className="w-full h-12 text-base font-semibold gap-2 shadow-sm"
          >
            {submitMutation.isPending ? (
              <Loader2 className="h-5 w-5 animate-spin" />
            ) : (
              <CheckCircle2 className="h-5 w-5" />
            )}
            {activeWorkoutId ? "Complete & Update Workout" : "Finish & Save Workout"}
          </Button>
        </div>
      )}
    </div>
  );
}

export default function LogWorkoutPage() {
  return (
    <Suspense
      fallback={
        <div className="py-20 text-center">
          <Loader2 className="h-8 w-8 animate-spin mx-auto text-primary" />
        </div>
      }
    >
      <LogWorkoutContent />
    </Suspense>
  );
}
