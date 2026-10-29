"use client";
// ---------------------------------------------------------------
// OverloadHQ – Login Page
// Stitch Prototype styling with warm backgrounds, vermillion accents,
// Plus Jakarta Sans display typography, and rounded-full pill buttons
// ---------------------------------------------------------------

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth-context";
import { APP_NAME } from "@/lib/config";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Loader2, ArrowRight, Zap } from "lucide-react";

export default function LoginPage() {
  const { login, isBackendAwake } = useAuth();
  const router = useRouter();
  const [identifier, setIdentifier] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    const trimmedId = identifier.trim();
    if (!trimmedId) {
      setError("Please enter your email or username");
      return;
    }
    if (!password) {
      setError("Please enter your password");
      return;
    }

    setLoading(true);
    try {
      await login(trimmedId, password);
      router.push("/dashboard");
    } catch (err: any) {
      setError(err?.message || "Invalid credentials. Please verify your details.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 sm:p-6 bg-background text-on-surface">
      <div className="w-full max-w-md p-6 sm:p-8 rounded-2xl md:rounded-3xl bg-card border border-border/80 shadow-xl space-y-6 animate-fade-in">
        {/* Header */}
        <div className="text-center space-y-2">
          <Link href="/" className="inline-flex items-center gap-2 mb-2">
            <div className="w-10 h-10 rounded-full bg-primary flex items-center justify-center text-primary-foreground shadow-sm">
              <Zap className="h-5 w-5 fill-current" />
            </div>
            <span className="font-display text-2xl font-black tracking-tight text-on-surface">
              Overload<span className="text-primary">HQ</span>
            </span>
          </Link>
          <h1 className="font-display text-xl font-bold text-on-surface">Welcome Back</h1>
          <p className="text-xs sm:text-sm text-on-surface-variant">
            Log in to continue your progressive overload journey
          </p>
        </div>

        {!isBackendAwake && (
          <div className="p-3 rounded-2xl bg-primary/10 text-primary border border-primary/20 text-xs text-center font-medium">
            <Loader2 className="h-3.5 w-3.5 animate-spin inline mr-2" />
            Connecting to server — this takes a few seconds on the first load...
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          {error && (
            <div className="p-3 rounded-2xl bg-destructive/10 text-destructive border border-destructive/20 text-xs font-semibold">
              {error}
            </div>
          )}

          <div className="space-y-1.5">
            <Label htmlFor="identifier" className="text-xs font-semibold text-on-surface">
              Email or Username
            </Label>
            <Input
              id="identifier"
              type="text"
              placeholder="you@example.com or coollifter"
              value={identifier}
              onChange={(e) => setIdentifier(e.target.value)}
              required
              autoComplete="username"
              className="bg-surface-container-low rounded-xl h-11 text-sm border-border/60"
            />
          </div>

          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <Label htmlFor="password" className="text-xs font-semibold text-on-surface">
                Password
              </Label>
              <Link
                href="/forgot-password"
                className="text-xs text-primary hover:underline font-semibold"
              >
                Forgot password?
              </Link>
            </div>
            <Input
              id="password"
              type="password"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              autoComplete="current-password"
              className="bg-surface-container-low rounded-xl h-11 text-sm border-border/60"
            />
          </div>

          <Button
            type="submit"
            className="w-full h-12 rounded-full bg-primary hover:opacity-95 text-primary-foreground font-display font-bold text-sm shadow-md active:scale-[0.98] transition-all"
            disabled={loading}
          >
            {loading ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
                Logging in...
              </>
            ) : (
              <>
                Log In
                <ArrowRight className="h-4 w-4 ml-1.5" />
              </>
            )}
          </Button>
        </form>

        <div className="pt-2 text-center">
          <p className="text-xs text-on-surface-variant">
            Don&apos;t have an account?{" "}
            <Link href="/signup" className="text-primary hover:underline font-bold">
              Sign up free
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
