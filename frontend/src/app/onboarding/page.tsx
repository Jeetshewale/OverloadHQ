"use client";
// ---------------------------------------------------------------
// OverloadHQ – Onboarding Page
// Stitch Prototype styling with warm surfaces, pill buttons,
// Plus Jakarta Sans display typography, and tactile selections
// ---------------------------------------------------------------

import { useState } from "react";
import { useAuth } from "@/lib/auth-context";
import { api } from "@/lib/api";
import { useMutation } from "@tanstack/react-query";
import { GOAL_LABELS, GOAL_DESCRIPTIONS, EXPERIENCE_LABELS } from "@/lib/config";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/use-toast";
import {
  ChevronRight,
  ChevronLeft,
  Dumbbell,
  Loader2,
  Sparkles,
  Download,
  Check,
  Zap,
} from "lucide-react";
import { useRouter } from "next/navigation";

const STEPS = ["goal", "experience", "unit", "sample"] as const;

export default function OnboardingPage() {
  const { user, refreshUser } = useAuth();
  const { toast } = useToast();
  const router = useRouter();

  const [step, setStep] = useState(0);
  const [goal, setGoal] = useState(user?.goal || "GENERAL_FITNESS");
  const [experience, setExperience] = useState(user?.experienceLevel || "BEGINNER");
  const [preferredUnit, setPreferredUnit] = useState(user?.preferredUnit || "KG");
  const [sampleLoaded, setSampleLoaded] = useState(false);

  const updateMutation = useMutation({
    mutationFn: (data: any) => api.user.updateProfile(data),
  });

  const sampleMutation = useMutation({
    mutationFn: () => api.workouts.loadSample(),
    onSuccess: () => {
      setSampleLoaded(true);
      toast({ title: "Sample workout loaded! 🎉", variant: "default" });
    },
    onError: (err: any) => {
      toast({ title: "Error", description: err.message, variant: "destructive" });
    },
  });

  const handleFinish = async () => {
    await updateMutation.mutateAsync({
      goal,
      experienceLevel: experience,
      preferredUnit,
      onboardingDone: true,
    });
    await refreshUser();
    router.push("/dashboard");
  };

  const stepContent = STEPS[step];

  return (
    <div className="min-h-screen flex items-center justify-center p-4 sm:p-6 bg-background text-on-surface">
      <div className="w-full max-w-md space-y-6 animate-fade-in">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded-full bg-primary flex items-center justify-center text-primary-foreground text-xs font-bold">
              <Zap className="h-3.5 w-3.5 fill-current" />
            </div>
            <span className="text-xs font-bold uppercase tracking-wider text-on-surface-variant">
              Athlete Setup
            </span>
          </div>
          <button
            onClick={handleFinish}
            className="text-xs text-primary hover:underline font-semibold"
          >
            Skip to Dashboard →
          </button>
        </div>

        {/* Progress pill indicator */}
        <div className="flex gap-1.5">
          {STEPS.map((_, i) => (
            <div
              key={i}
              className={`h-1.5 flex-1 rounded-full transition-all duration-300 ${
                i <= step ? "bg-primary" : "bg-surface-container-high"
              }`}
            />
          ))}
        </div>

        {/* Step: Goal */}
        {stepContent === "goal" && (
          <div className="p-6 sm:p-8 rounded-2xl md:rounded-3xl bg-card border border-border/80 shadow-sm space-y-5">
            <div className="text-center space-y-1">
              <div className="w-12 h-12 rounded-2xl bg-primary/10 text-primary flex items-center justify-center mx-auto mb-2">
                <Dumbbell className="h-6 w-6" />
              </div>
              <h2 className="font-display font-extrabold text-xl text-on-surface">What&apos;s your goal?</h2>
              <p className="text-xs text-on-surface-variant">
                This helps us tailor your progressive overload targets and AI coaching advice.
              </p>
            </div>
            <div className="space-y-2">
              {Object.entries(GOAL_LABELS).map(([key, label]) => (
                <button
                  key={key}
                  type="button"
                  onClick={() => setGoal(key)}
                  className={`w-full text-left p-4 rounded-2xl border transition-all ${
                    goal === key
                      ? "border-primary bg-primary/10 shadow-sm"
                      : "border-border/60 hover:border-border bg-surface-container-low"
                  }`}
                >
                  <p className="font-display font-bold text-sm text-on-surface">{label}</p>
                  <p className="text-xs text-on-surface-variant mt-0.5">
                    {GOAL_DESCRIPTIONS[key]}
                  </p>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Step: Experience */}
        {stepContent === "experience" && (
          <div className="p-6 sm:p-8 rounded-2xl md:rounded-3xl bg-card border border-border/80 shadow-sm space-y-5">
            <div className="text-center space-y-1">
              <h2 className="font-display font-extrabold text-xl text-on-surface">Experience Level</h2>
              <p className="text-xs text-on-surface-variant">
                We&apos;ll calibrate your overload rates accordingly.
              </p>
            </div>
            <div className="space-y-2">
              {Object.entries(EXPERIENCE_LABELS).map(([key, label]) => (
                <button
                  key={key}
                  type="button"
                  onClick={() => setExperience(key)}
                  className={`w-full text-left p-4 rounded-2xl border transition-all ${
                    experience === key
                      ? "border-primary bg-primary/10 shadow-sm"
                      : "border-border/60 hover:border-border bg-surface-container-low"
                  }`}
                >
                  <p className="font-display font-bold text-sm text-on-surface">{label}</p>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Step: Unit */}
        {stepContent === "unit" && (
          <div className="p-6 sm:p-8 rounded-2xl md:rounded-3xl bg-card border border-border/80 shadow-sm space-y-5">
            <div className="text-center space-y-1">
              <h2 className="font-display font-extrabold text-xl text-on-surface">Preferred Weight Unit</h2>
              <p className="text-xs text-on-surface-variant">
                You can change this anytime in account settings.
              </p>
            </div>
            <div className="grid grid-cols-2 gap-3">
              {[
                { value: "KG", label: "Kilograms (kg)", desc: "Metric system" },
                { value: "LB", label: "Pounds (lb)", desc: "Imperial system" },
              ].map((u) => (
                <button
                  key={u.value}
                  type="button"
                  onClick={() => setPreferredUnit(u.value as "KG" | "LB")}
                  className={`p-6 rounded-2xl border text-center transition-all ${
                    preferredUnit === u.value
                      ? "border-primary bg-primary/10 shadow-sm"
                      : "border-border/60 hover:border-border bg-surface-container-low"
                  }`}
                >
                  <p className="font-display text-3xl font-black text-on-surface">{u.value}</p>
                  <p className="text-xs font-semibold text-on-surface-variant mt-1">{u.desc}</p>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Step: Sample */}
        {stepContent === "sample" && (
          <div className="p-6 sm:p-8 rounded-2xl md:rounded-3xl bg-card border border-border/80 shadow-sm space-y-5">
            <div className="text-center space-y-1">
              <div className="w-12 h-12 rounded-2xl bg-primary/10 text-primary flex items-center justify-center mx-auto mb-2">
                <Sparkles className="h-6 w-6" />
              </div>
              <h2 className="font-display font-extrabold text-xl text-on-surface">Load Sample Workout?</h2>
              <p className="text-xs text-on-surface-variant">
                Populate a demo workout so you can preview progressive overload tracking immediately.
              </p>
            </div>
            <div className="p-4 rounded-2xl bg-surface-container-low border border-border/60 space-y-2">
              <p className="font-display font-bold text-xs uppercase tracking-wider text-primary">Demo Session: Back Day</p>
              <div className="text-xs text-on-surface-variant space-y-1">
                <p>• Lat Pulldown: 50 kg × 8-9, 55 kg × 8-9</p>
                <p>• Vertical Row: 65 kg × 7, 70 kg × 5</p>
                <p>• Rear Delt Fly: 5 kg × 8, 10 kg × 5</p>
              </div>
            </div>

            <div className="flex gap-2.5">
              <Button
                variant="outline"
                className="flex-1 rounded-full text-xs font-semibold h-11 border-border"
                onClick={() => sampleMutation.mutate()}
                disabled={sampleMutation.isPending || sampleLoaded}
              >
                {sampleMutation.isPending ? (
                  <Loader2 className="h-4 w-4 animate-spin mr-1.5" />
                ) : sampleLoaded ? (
                  <Check className="h-4 w-4 mr-1.5 text-emerald-500" />
                ) : (
                  <Download className="h-4 w-4 mr-1.5" />
                )}
                {sampleLoaded ? "Demo Loaded!" : "Load Demo Workout"}
              </Button>
              <Button
                variant="ghost"
                className="rounded-full text-xs font-semibold h-11 px-5"
                onClick={handleFinish}
              >
                Skip
              </Button>
            </div>
          </div>
        )}

        {/* Navigation Buttons */}
        <div className="flex items-center justify-between pt-1">
          <Button
            variant="ghost"
            onClick={() => setStep((s) => Math.max(0, s - 1))}
            disabled={step === 0}
            className="rounded-full text-xs font-semibold px-4"
          >
            <ChevronLeft className="h-4 w-4 mr-1" />
            Back
          </Button>

          {step < STEPS.length - 1 ? (
            <Button
              onClick={() => setStep((s) => s + 1)}
              className="rounded-full text-xs font-semibold px-6 bg-primary text-primary-foreground shadow-sm"
            >
              Next Step
              <ChevronRight className="h-4 w-4 ml-1" />
            </Button>
          ) : (
            <Button
              onClick={handleFinish}
              disabled={updateMutation.isPending}
              className="rounded-full text-xs font-semibold px-6 bg-primary text-primary-foreground shadow-sm"
            >
              {updateMutation.isPending && <Loader2 className="h-4 w-4 animate-spin mr-1.5" />}
              Start Training
              <ChevronRight className="h-4 w-4 ml-1" />
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}
