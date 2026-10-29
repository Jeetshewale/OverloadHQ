"use client";
// ---------------------------------------------------------------
// OverloadHQ – Sign Up Page
// Stitch Prototype styling with warm backgrounds, vermillion accents,
// Plus Jakarta Sans display typography, and rounded-full pill buttons
// ---------------------------------------------------------------

import { useState, Suspense } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useAuth } from "@/lib/auth-context";
import { APP_NAME } from "@/lib/config";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Loader2, Shield, ArrowRight, Zap } from "lucide-react";

function SignUpForm() {
  const { register } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();
  const inviteFromUrl = searchParams.get("code") || "";

  const [form, setForm] = useState({
    name: "",
    username: "",
    email: "",
    password: "",
    inviteCode: inviteFromUrl,
  });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (!form.name.trim()) {
      setError("Please enter your name");
      return;
    }
    if (!form.username.trim() || form.username.trim().length < 3) {
      setError("Username must be at least 3 characters");
      return;
    }
    if (!form.email.trim() || !form.email.includes("@")) {
      setError("Please enter a valid email address");
      return;
    }
    if (form.password.length < 8) {
      setError("Password must be at least 8 characters");
      return;
    }

    setLoading(true);
    try {
      await register({
        name: form.name.trim(),
        username: form.username.trim().toLowerCase(),
        email: form.email.trim().toLowerCase(),
        password: form.password,
        inviteCode: form.inviteCode ? form.inviteCode.trim() : undefined,
      });
      router.push("/onboarding");
    } catch (err: any) {
      setError(err?.message || "Registration failed. Please check your information.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {error && (
        <div className="p-3 rounded-2xl bg-destructive/10 text-destructive border border-destructive/20 text-xs font-semibold">
          {error}
        </div>
      )}

      <div className="space-y-1.5">
        <Label htmlFor="name" className="text-xs font-semibold text-on-surface">
          Full Name
        </Label>
        <Input
          id="name"
          placeholder="Alex Johnson"
          value={form.name}
          onChange={(e) => setForm({ ...form, name: e.target.value })}
          required
          className="bg-surface-container-low rounded-xl h-11 text-sm border-border/60"
        />
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="username" className="text-xs font-semibold text-on-surface">
          Username
        </Label>
        <Input
          id="username"
          placeholder="alex_lifts"
          value={form.username}
          onChange={(e) => setForm({ ...form, username: e.target.value })}
          required
          pattern="^[a-zA-Z0-9_]+$"
          minLength={3}
          className="bg-surface-container-low rounded-xl h-11 text-sm border-border/60"
        />
        <p className="text-[11px] text-on-surface-variant">Letters, numbers, underscores only</p>
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="signup-email" className="text-xs font-semibold text-on-surface">
          Email Address
        </Label>
        <Input
          id="signup-email"
          type="email"
          placeholder="alex@example.com"
          value={form.email}
          onChange={(e) => setForm({ ...form, email: e.target.value })}
          required
          autoComplete="email"
          className="bg-surface-container-low rounded-xl h-11 text-sm border-border/60"
        />
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="signup-password" className="text-xs font-semibold text-on-surface">
          Password
        </Label>
        <Input
          id="signup-password"
          type="password"
          placeholder="At least 8 characters"
          value={form.password}
          onChange={(e) => setForm({ ...form, password: e.target.value })}
          required
          minLength={8}
          autoComplete="new-password"
          className="bg-surface-container-low rounded-xl h-11 text-sm border-border/60"
        />
      </div>

      {inviteFromUrl ? (
        <div className="space-y-1.5">
          <Label htmlFor="invite" className="text-xs font-semibold text-on-surface">
            Invite Code (Optional)
          </Label>
          <Input
            id="invite"
            placeholder="Invite code"
            value={form.inviteCode}
            onChange={(e) => setForm({ ...form, inviteCode: e.target.value })}
            className="bg-surface-container-low rounded-xl h-11 text-sm border-border/60"
          />
        </div>
      ) : null}

      <Button
        type="submit"
        className="w-full h-12 rounded-full bg-primary hover:opacity-95 text-primary-foreground font-display font-bold text-sm shadow-md active:scale-[0.98] transition-all"
        disabled={loading}
      >
        {loading ? (
          <>
            <Loader2 className="h-4 w-4 animate-spin mr-2" />
            Creating Account...
          </>
        ) : (
          <>
            Create Account
            <ArrowRight className="h-4 w-4 ml-1.5" />
          </>
        )}
      </Button>
    </form>
  );
}

export default function SignUpPage() {
  return (
    <div className="min-h-screen flex items-center justify-center p-4 sm:p-6 bg-background text-on-surface">
      <div className="w-full max-w-md p-6 sm:p-8 rounded-2xl md:rounded-3xl bg-card border border-border/80 shadow-xl space-y-6 animate-fade-in">
        <div className="text-center space-y-2">
          <Link href="/" className="inline-flex items-center gap-2 mb-2">
            <div className="w-10 h-10 rounded-full bg-primary flex items-center justify-center text-primary-foreground shadow-sm">
              <Zap className="h-5 w-5 fill-current" />
            </div>
            <span className="font-display text-2xl font-black tracking-tight text-on-surface">
              Overload<span className="text-primary">HQ</span>
            </span>
          </Link>
          <h1 className="font-display text-xl font-bold text-on-surface">Start Progressive Overload</h1>
          <p className="text-xs sm:text-sm text-on-surface-variant">
            Create your account to log workouts and track strength
          </p>
        </div>

        <Suspense fallback={<div className="text-center py-6"><Loader2 className="h-6 w-6 animate-spin mx-auto text-primary" /></div>}>
          <SignUpForm />
        </Suspense>

        <div className="flex items-center gap-2.5 text-xs text-on-surface-variant bg-surface-container-low p-3 rounded-2xl border border-border/60">
          <Shield className="h-4 w-4 flex-shrink-0 text-primary" />
          <span>
            Your workout data is private and securely encrypted. No tracking or ads.
          </span>
        </div>

        <p className="text-center text-xs text-on-surface-variant">
          Already have an account?{" "}
          <Link href="/login" className="text-primary hover:underline font-bold">
            Log in
          </Link>
        </p>
      </div>
    </div>
  );
}
