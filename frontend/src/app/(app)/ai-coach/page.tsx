"use client";
// ---------------------------------------------------------------
// OverloadHQ – AI Coach Page
// Stitch Prototype styling with warm card surfaces, pill buttons,
// Plus Jakarta Sans display typography, and real-time AI cues
// ---------------------------------------------------------------

import { useState } from "react";
import { api } from "@/lib/api";
import { useAuth } from "@/lib/auth-context";
import { formatWeight } from "@/lib/utils";
import { useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/use-toast";
import {
  Brain,
  Loader2,
  Sparkles,
  TrendingUp,
  AlertTriangle,
  Target,
  Heart,
  MessageSquare,
  Zap,
  Info,
  CheckCircle2,
  Bot,
  RefreshCw,
  Lightbulb,
} from "lucide-react";

export default function AiCoachPage() {
  const { user } = useAuth();
  const { toast } = useToast();
  const unit = user?.preferredUnit || "KG";
  const kgToDisplay = (kg: number) =>
    unit === "LB" ? Math.round(kg * 2.20462 * 10) / 10 : kg;

  const [result, setResult] = useState<any>(null);

  const analyzeMutation = useMutation({
    mutationFn: () => api.ai.analyze(),
    onSuccess: (data) => {
      setResult(data);
    },
    onError: (err: any) => {
      toast({
        title: "Error",
        description: err.message || "Analysis failed",
        variant: "destructive",
      });
    },
  });

  const analysis = result?.analysis;
  const source = result?.source;

  return (
    <div className="space-y-6 max-w-xl mx-auto pb-16">
      {/* Page Title */}
      <div>
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-full bg-primary/10 text-primary flex items-center justify-center">
            <Bot className="h-5 w-5" />
          </div>
          <h1 className="font-display text-2xl sm:text-3xl font-extrabold text-on-surface tracking-tight">
            AI Training Coach
          </h1>
        </div>
        <p className="text-sm text-on-surface-variant mt-1 ml-11">
          Intelligent training analysis and progressive overload recommendations.
        </p>
      </div>

      {/* Initial Call to Action Card */}
      {!analysis && (
        <div className="p-8 sm:p-10 rounded-2xl md:rounded-3xl bg-card border border-border/80 shadow-sm text-center space-y-5">
          <div className="w-16 h-16 rounded-3xl bg-primary/10 flex items-center justify-center mx-auto text-primary">
            <Sparkles className="h-8 w-8" />
          </div>
          <div className="space-y-1.5 max-w-md mx-auto">
            <h2 className="font-display font-bold text-lg text-on-surface">
              Ready for your intelligent analysis?
            </h2>
            <p className="text-xs sm:text-sm text-on-surface-variant leading-relaxed">
              We analyze your recent workout volume, progressive overload history, and rep consistency to tailor recommendations for your{" "}
              <strong className="text-on-surface">
                {user?.goal ? user.goal.replace(/_/g, " ").toLowerCase() : "strength"}
              </strong>{" "}
              goal.
            </p>
          </div>
          <Button
            onClick={() => analyzeMutation.mutate()}
            disabled={analyzeMutation.isPending}
            className="rounded-full px-8 h-12 text-sm font-semibold bg-primary text-primary-foreground shadow-md hover:opacity-95 active:scale-95 transition-all gap-2"
          >
            {analyzeMutation.isPending ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Analyzing Your Sessions...
              </>
            ) : (
              <>
                <Sparkles className="h-4 w-4" />
                Analyze My Progress
              </>
            )}
          </Button>
        </div>
      )}

      {/* Analysis Results Display */}
      {analysis && (
        <div className="space-y-4 animate-fade-in">
          {/* Source badge pill */}
          <div className="flex items-center justify-between px-1">
            <div className="flex items-center gap-2">
              <span
                className={`text-xs px-3 py-1 rounded-full font-semibold border ${
                  source === "gemini" || source === "groq"
                    ? "bg-primary/10 text-primary border-primary/20"
                    : "bg-surface-container text-on-surface-variant border-border"
                }`}
              >
                {source === "gemini"
                  ? "✨ Gemini 1.5 Flash"
                  : source === "groq"
                  ? "⚡ Groq Llama 3.3"
                  : source === "rule_engine"
                  ? "📐 Algorithmic Engine"
                  : "📦 Cached Analysis"}
              </span>
              {result?.cached && (
                <span className="text-[11px] text-on-surface-variant font-medium">
                  (cached)
                </span>
              )}
            </div>
            <button
              onClick={() => {
                setResult(null);
                analyzeMutation.mutate();
              }}
              disabled={analyzeMutation.isPending}
              className="inline-flex items-center gap-1 text-xs font-semibold text-primary hover:opacity-80 transition-opacity"
            >
              <RefreshCw className="h-3 w-3" />
              Re-run
            </button>
          </div>

          {/* AI Executive Summary Card */}
          <div className="p-5 sm:p-6 rounded-2xl md:rounded-3xl bg-card border border-primary/20 shadow-sm relative overflow-hidden">
            <div className="absolute top-0 right-0 w-32 h-32 bg-primary/5 rounded-full blur-2xl pointer-events-none" />
            <h3 className="font-display font-bold text-xs uppercase tracking-wider text-primary mb-2 flex items-center gap-1.5">
              <Sparkles className="h-3.5 w-3.5" />
              Coach Summary
            </h3>
            <p className="text-sm leading-relaxed text-on-surface">
              {analysis.summary}
            </p>
          </div>

          {/* Strengths */}
          {analysis.strengths?.length > 0 && (
            <div className="p-5 rounded-2xl md:rounded-3xl bg-card border border-border/80 shadow-sm space-y-3">
              <div className="flex items-center gap-2">
                <TrendingUp className="h-4 w-4 text-emerald-500" />
                <h3 className="font-display font-bold text-sm text-on-surface">
                  Key Strengths
                </h3>
              </div>
              <ul className="space-y-2">
                {analysis.strengths.map((s: string, i: number) => (
                  <li
                    key={i}
                    className="text-xs sm:text-sm text-on-surface flex items-start gap-2.5"
                  >
                    <CheckCircle2 className="h-4 w-4 text-emerald-500 flex-shrink-0 mt-0.5" />
                    <span>{s}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Weaknesses / Areas to Improve */}
          {analysis.weaknesses?.length > 0 && (
            <div className="p-5 rounded-2xl md:rounded-3xl bg-card border border-border/80 shadow-sm space-y-3">
              <div className="flex items-center gap-2">
                <Target className="h-4 w-4 text-accent-amber" />
                <h3 className="font-display font-bold text-sm text-on-surface">
                  Areas to Improve
                </h3>
              </div>
              <ul className="space-y-2">
                {analysis.weaknesses.map((w: string, i: number) => (
                  <li
                    key={i}
                    className="text-xs sm:text-sm text-on-surface flex items-start gap-2.5"
                  >
                    <span className="w-1.5 h-1.5 rounded-full bg-accent-amber flex-shrink-0 mt-2" />
                    <span>{w}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Next Week's Targets */}
          {analysis.nextWeekPlan?.length > 0 && (
            <div className="p-5 rounded-2xl md:rounded-3xl bg-card border border-border/80 shadow-sm space-y-3">
              <div className="flex items-center gap-2">
                <Zap className="h-4 w-4 text-primary" />
                <h3 className="font-display font-bold text-sm text-on-surface">
                  Next Week&apos;s Overload Targets
                </h3>
              </div>
              <div className="divide-y divide-border/40">
                {analysis.nextWeekPlan.map((p: any, i: number) => (
                  <div
                    key={i}
                    className="flex items-center justify-between py-2.5 first:pt-1 last:pb-0"
                  >
                    <div>
                      <p className="text-sm font-semibold text-on-surface">
                        {p.exercise}
                      </p>
                      <p className="text-[11px] text-on-surface-variant">
                        {p.targetSets} sets × {p.targetReps} reps
                      </p>
                    </div>
                    <span className="font-display font-bold text-sm text-primary tabular-nums">
                      {kgToDisplay(p.targetWeight)} {unit.toLowerCase()}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Plateau Warnings */}
          {analysis.plateauWarnings?.length > 0 && (
            <div className="p-5 rounded-2xl md:rounded-3xl bg-card border border-accent-amber/30 shadow-sm space-y-2.5">
              <div className="flex items-center gap-2">
                <AlertTriangle className="h-4 w-4 text-accent-amber" />
                <h3 className="font-display font-bold text-sm text-on-surface">
                  Plateau Warnings
                </h3>
              </div>
              <ul className="space-y-2">
                {analysis.plateauWarnings.map((w: string, i: number) => (
                  <li
                    key={i}
                    className="text-xs sm:text-sm text-on-surface-variant flex items-start gap-2"
                  >
                    <span>⚠️</span>
                    <span>{w}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Form Tips */}
          {analysis.formTips?.length > 0 && (
            <div className="p-5 rounded-2xl md:rounded-3xl bg-card border border-border/80 shadow-sm space-y-2.5">
              <div className="flex items-center gap-2">
                <Lightbulb className="h-4 w-4 text-primary" />
                <h3 className="font-display font-bold text-sm text-on-surface">
                  Technique & Form Cues
                </h3>
              </div>
              <ul className="space-y-2">
                {analysis.formTips.map((t: string, i: number) => (
                  <li
                    key={i}
                    className="text-xs sm:text-sm text-on-surface-variant flex items-start gap-2.5"
                  >
                    <span>💡</span>
                    <span>{t}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Recovery Tips */}
          {analysis.recoveryTips?.length > 0 && (
            <div className="p-5 rounded-2xl md:rounded-3xl bg-card border border-border/80 shadow-sm space-y-2.5">
              <div className="flex items-center gap-2">
                <Heart className="h-4 w-4 text-primary" />
                <h3 className="font-display font-bold text-sm text-on-surface">
                  Recovery & CNS Readiness
                </h3>
              </div>
              <ul className="space-y-2">
                {analysis.recoveryTips.map((t: string, i: number) => (
                  <li
                    key={i}
                    className="text-xs sm:text-sm text-on-surface-variant flex items-start gap-2.5"
                  >
                    <span>🛌</span>
                    <span>{t}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          <p className="text-[11px] text-on-surface-variant text-center pt-2">
            <Info className="h-3 w-3 inline mr-1" />
            Limited to 3 analyses per day. Results are cached for 24 hours.
          </p>
        </div>
      )}
    </div>
  );
}
