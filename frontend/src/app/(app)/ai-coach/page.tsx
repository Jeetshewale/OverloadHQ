"use client";
// ---------------------------------------------------------------
// OverloadHQ – AI Coach Page
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
    <div className="space-y-6 max-w-lg mx-auto">
      <div>
        <h1 className="text-2xl font-bold flex items-center gap-2">
          <Brain className="h-6 w-6 text-primary" />
          AI Coach
        </h1>
        <p className="text-sm text-muted-foreground mt-1">
          Get personalized workout analysis and recommendations.
        </p>
      </div>

      {/* Analyze button */}
      {!analysis && (
        <Card className="border-dashed">
          <CardContent className="py-10 text-center space-y-4">
            <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center mx-auto">
              <Sparkles className="h-8 w-8 text-primary" />
            </div>
            <div>
              <p className="font-medium">Ready for your analysis?</p>
              <p className="text-sm text-muted-foreground mt-1">
                We&apos;ll look at your last 8 weeks of workouts and give tailored advice for your{" "}
                {user?.goal?.replace(/_/g, " ").toLowerCase()} goal.
              </p>
            </div>
            <Button
              onClick={() => analyzeMutation.mutate()}
              disabled={analyzeMutation.isPending}
              size="lg"
            >
              {analyzeMutation.isPending ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                  Analyzing...
                </>
              ) : (
                <>
                  <Brain className="h-4 w-4 mr-2" />
                  Analyze My Progress
                </>
              )}
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Results */}
      {analysis && (
        <div className="space-y-4 animate-fade-in">
          {/* Source badge */}
          <div className="flex items-center gap-2">
            <span
              className={`text-xs px-2 py-1 rounded-full font-medium ${
                source === "gemini" || source === "groq"
                  ? "bg-primary/10 text-primary"
                  : source === "rule_engine"
                  ? "bg-secondary text-muted-foreground"
                  : "bg-secondary text-muted-foreground"
              }`}
            >
              {source === "gemini"
                ? "✨ Gemini AI"
                : source === "groq"
                ? "⚡ Groq AI"
                : source === "rule_engine"
                ? "📐 Rule Engine"
                : "📦 Cached"}
            </span>
            {result?.cached && (
              <span className="text-xs text-muted-foreground">(cached)</span>
            )}
          </div>

          {/* Summary */}
          <Card className="glow-border">
            <CardContent className="py-4">
              <p className="text-sm leading-relaxed">{analysis.summary}</p>
            </CardContent>
          </Card>

          {/* Strengths */}
          {analysis.strengths?.length > 0 && (
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm flex items-center gap-2">
                  <TrendingUp className="h-4 w-4 text-emerald-400" />
                  Strengths
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2">
                  {analysis.strengths.map((s: string, i: number) => (
                    <li key={i} className="text-sm text-muted-foreground flex gap-2">
                      <span className="text-emerald-400 flex-shrink-0">✓</span>
                      {s}
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>
          )}

          {/* Weaknesses */}
          {analysis.weaknesses?.length > 0 && (
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm flex items-center gap-2">
                  <Target className="h-4 w-4 text-amber-400" />
                  Areas to Improve
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2">
                  {analysis.weaknesses.map((w: string, i: number) => (
                    <li key={i} className="text-sm text-muted-foreground flex gap-2">
                      <span className="text-amber-400 flex-shrink-0">→</span>
                      {w}
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>
          )}

          {/* Next Week Plan */}
          {analysis.nextWeekPlan?.length > 0 && (
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm flex items-center gap-2">
                  <Zap className="h-4 w-4 text-primary" />
                  Next Week&apos;s Targets
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {analysis.nextWeekPlan.map((p: any, i: number) => (
                    <div
                      key={i}
                      className="flex items-center justify-between py-2 border-b border-border/50 last:border-0"
                    >
                      <div>
                        <p className="text-sm font-medium">{p.exercise}</p>
                        <p className="text-xs text-muted-foreground">
                          {p.targetSets} sets × {p.targetReps} reps
                        </p>
                      </div>
                      <span className="text-sm font-mono text-primary">
                        {kgToDisplay(p.targetWeight)} {unit.toLowerCase()}
                      </span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Plateau Warnings */}
          {analysis.plateauWarnings?.length > 0 && (
            <Card className="border-amber-500/30">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm flex items-center gap-2">
                  <AlertTriangle className="h-4 w-4 text-amber-400" />
                  Plateau Warnings
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2">
                  {analysis.plateauWarnings.map((w: string, i: number) => (
                    <li key={i} className="text-sm text-amber-200/80">
                      {w}
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>
          )}

          {/* Form Tips */}
          {analysis.formTips?.length > 0 && (
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm flex items-center gap-2">
                  <MessageSquare className="h-4 w-4 text-blue-400" />
                  Form Tips
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2">
                  {analysis.formTips.map((t: string, i: number) => (
                    <li key={i} className="text-sm text-muted-foreground">
                      💡 {t}
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>
          )}

          {/* Recovery Tips */}
          {analysis.recoveryTips?.length > 0 && (
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm flex items-center gap-2">
                  <Heart className="h-4 w-4 text-rose-400" />
                  Recovery Tips
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2">
                  {analysis.recoveryTips.map((t: string, i: number) => (
                    <li key={i} className="text-sm text-muted-foreground">
                      🛌 {t}
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>
          )}

          {/* Re-analyze button */}
          <Button
            variant="outline"
            className="w-full"
            onClick={() => {
              setResult(null);
              analyzeMutation.mutate();
            }}
            disabled={analyzeMutation.isPending}
          >
            {analyzeMutation.isPending ? (
              <Loader2 className="h-4 w-4 animate-spin mr-2" />
            ) : (
              <Brain className="h-4 w-4 mr-2" />
            )}
            Re-analyze
          </Button>

          <p className="text-xs text-muted-foreground text-center">
            <Info className="h-3 w-3 inline mr-1" />
            Limited to 3 analyses per day. Results are cached for 24 hours.
          </p>
        </div>
      )}
    </div>
  );
}
