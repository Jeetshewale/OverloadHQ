"use client";
// ---------------------------------------------------------------
// OverloadHQ – Onboarding Page
// Name → Goal → Experience → Unit → Sample data
// ---------------------------------------------------------------

import { useState } from "react";
import { useAuth } from "@/lib/auth-context";
import { api } from "@/lib/api";
import { useMutation } from "@tanstack/react-query";
import { GOAL_LABELS, GOAL_DESCRIPTIONS, EXPERIENCE_LABELS } from "@/lib/config";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/components/ui/use-toast";
import {
  ChevronRight,
  ChevronLeft,
  Dumbbell,
  Loader2,
  Sparkles,
  Download,
  Check,
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
      toast({ title: "Sample workout loaded! 🎉", variant: "success" as any });
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
    <div className="min-h-screen flex items-center justify-center p-4">
      <div className="w-full max-w-md space-y-6 animate-fade-in">
        <div className="flex items-center justify-between">
          <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Getting Started</span>
          <button
            onClick={handleFinish}
            className="text-xs text-primary hover:underline font-medium"
          >
            Skip to Dashboard →
          </button>
        </div>

        {/* Progress bar */}
        <div className="flex gap-1">
          {STEPS.map((_, i) => (
            <div
              key={i}
              className={`h-1 flex-1 rounded-full transition-all ${
                i <= step ? "bg-primary" : "bg-secondary"
              }`}
            />
          ))}
        </div>

        {/* Step: Goal */}
        {stepContent === "goal" && (
          <div className="space-y-4">
            <div className="text-center">
              <Dumbbell className="h-10 w-10 text-primary mx-auto mb-3" />
              <h2 className="text-xl font-bold">What&apos;s your goal?</h2>
              <p className="text-sm text-muted-foreground mt-1">
                This helps us tailor your AI coaching advice.
              </p>
            </div>
            <div className="space-y-2">
              {Object.entries(GOAL_LABELS).map(([key, label]) => (
                <button
                  key={key}
                  onClick={() => setGoal(key)}
                  className={`w-full text-left p-4 rounded-xl border transition-all ${
                    goal === key
                      ? "border-primary bg-primary/10 ring-1 ring-primary"
                      : "border-border hover:border-primary/50 bg-card"
                  }`}
                >
                  <p className="font-medium text-sm">{label}</p>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    {GOAL_DESCRIPTIONS[key]}
                  </p>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Step: Experience */}
        {stepContent === "experience" && (
          <div className="space-y-4">
            <div className="text-center">
              <h2 className="text-xl font-bold">Experience level?</h2>
              <p className="text-sm text-muted-foreground mt-1">
                We&apos;ll adjust recommendations accordingly.
              </p>
            </div>
            <div className="space-y-2">
              {Object.entries(EXPERIENCE_LABELS).map(([key, label]) => (
                <button
                  key={key}
                  onClick={() => setExperience(key)}
                  className={`w-full text-left p-4 rounded-xl border transition-all ${
                    experience === key
                      ? "border-primary bg-primary/10 ring-1 ring-primary"
                      : "border-border hover:border-primary/50 bg-card"
                  }`}
                >
                  <p className="font-medium text-sm">{label}</p>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Step: Unit */}
        {stepContent === "unit" && (
          <div className="space-y-4">
            <div className="text-center">
              <h2 className="text-xl font-bold">Weight unit?</h2>
              <p className="text-sm text-muted-foreground mt-1">
                You can always change this in settings.
              </p>
            </div>
            <div className="grid grid-cols-2 gap-3">
              {[
                { value: "KG", label: "Kilograms (kg)", desc: "Metric" },
                { value: "LB", label: "Pounds (lb)", desc: "Imperial" },
              ].map((u) => (
                <button
                  key={u.value}
                  onClick={() => setPreferredUnit(u.value as "KG" | "LB")}
                  className={`p-6 rounded-xl border text-center transition-all ${
                    preferredUnit === u.value
                      ? "border-primary bg-primary/10 ring-1 ring-primary"
                      : "border-border hover:border-primary/50 bg-card"
                  }`}
                >
                  <p className="text-2xl font-bold">{u.value}</p>
                  <p className="text-xs text-muted-foreground mt-1">{u.desc}</p>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Step: Sample */}
        {stepContent === "sample" && (
          <div className="space-y-4">
            <div className="text-center">
              <Sparkles className="h-10 w-10 text-primary mx-auto mb-3" />
              <h2 className="text-xl font-bold">Load sample workout?</h2>
              <p className="text-sm text-muted-foreground mt-1">
                Insert a demo Back Day workout so you can see how the app works. You can delete it anytime.
              </p>
            </div>
            <Card>
              <CardContent className="py-4">
                <p className="text-sm font-medium mb-2">Sample: Back Day</p>
                <div className="text-xs text-muted-foreground space-y-1">
                  <p>Lat Pulldown: 50 kg × 8-9, 55 kg × 8-9</p>
                  <p>Vertical Row: 65 kg × 7, 70 kg × 5</p>
                  <p>Upper Back Row: 50 kg × 8, 60 kg × 6</p>
                  <p>Rear Delt Fly: 5 kg × 8, 10 kg × 5</p>
                </div>
              </CardContent>
            </Card>

            <div className="flex gap-2">
              <Button
                variant="outline"
                className="flex-1"
                onClick={() => sampleMutation.mutate()}
                disabled={sampleMutation.isPending || sampleLoaded}
              >
                {sampleMutation.isPending ? (
                  <Loader2 className="h-4 w-4 animate-spin mr-1" />
                ) : sampleLoaded ? (
                  <Check className="h-4 w-4 mr-1" />
                ) : (
                  <Download className="h-4 w-4 mr-1" />
                )}
                {sampleLoaded ? "Loaded!" : "Load Sample"}
              </Button>
              <Button variant="ghost" className="flex-1" onClick={handleFinish}>
                Skip
              </Button>
            </div>
          </div>
        )}

        {/* Navigation */}
        <div className="flex items-center justify-between pt-2">
          <Button
            variant="ghost"
            onClick={() => setStep((s) => Math.max(0, s - 1))}
            disabled={step === 0}
          >
            <ChevronLeft className="h-4 w-4 mr-1" />
            Back
          </Button>

          {step < STEPS.length - 1 ? (
            <Button onClick={() => setStep((s) => s + 1)}>
              Next
              <ChevronRight className="h-4 w-4 ml-1" />
            </Button>
          ) : (
            <Button
              onClick={handleFinish}
              disabled={updateMutation.isPending}
            >
              {updateMutation.isPending && <Loader2 className="h-4 w-4 animate-spin mr-1" />}
              Start Training
              <ChevronRight className="h-4 w-4 ml-1" />
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}
