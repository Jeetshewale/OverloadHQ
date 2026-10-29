"use client";
// ---------------------------------------------------------------
// OverloadHQ – Sign Up Page (Blue & White Theme, Instant Signup)
// ---------------------------------------------------------------

import { useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useAuth } from "@/lib/auth-context";
import { APP_NAME } from "@/lib/config";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Dumbbell, Loader2, Shield, ArrowRight } from "lucide-react";
import { Suspense } from "react";

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
        <div className="p-3 rounded-lg bg-destructive/10 text-destructive border border-destructive/20 text-xs font-medium">
          {error}
        </div>
      )}

      <div className="space-y-1.5">
        <Label htmlFor="name" className="text-xs font-semibold text-foreground">
          Full Name
        </Label>
        <Input
          id="name"
          placeholder="Alex Johnson"
          value={form.name}
          onChange={(e) => setForm({ ...form, name: e.target.value })}
          required
          className="bg-card text-sm"
        />
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="username" className="text-xs font-semibold text-foreground">
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
          className="bg-card text-sm"
        />
        <p className="text-[11px] text-muted-foreground">Letters, numbers, underscores only</p>
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="signup-email" className="text-xs font-semibold text-foreground">
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
          className="bg-card text-sm"
        />
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="signup-password" className="text-xs font-semibold text-foreground">
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
          className="bg-card text-sm"
        />
      </div>

      {inviteFromUrl ? (
        <div className="space-y-1.5">
          <Label htmlFor="invite" className="text-xs font-semibold text-foreground">
            Invite Code (Optional)
          </Label>
          <Input
            id="invite"
            placeholder="Invite code"
            value={form.inviteCode}
            onChange={(e) => setForm({ ...form, inviteCode: e.target.value })}
            className="bg-card text-sm"
          />
        </div>
      ) : null}

      <Button
        type="submit"
        className="w-full bg-primary hover:bg-primary/90 text-primary-foreground font-semibold shadow-md active:scale-[0.98] transition-all"
        disabled={loading}
      >
        {loading ? (
          <>
            <Loader2 className="h-4 w-4 animate-spin mr-2" />
            Creating Account...
          </>
        ) : (
          <>
            Get Started
            <ArrowRight className="h-4 w-4 ml-1.5" />
          </>
        )}
      </Button>
    </form>
  );
}

export default function SignUpPage() {
  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-background">
      <Card className="w-full max-w-md animate-fade-in shadow-xl border-border/80">
        <CardHeader className="text-center pb-4">
          <div className="mx-auto mb-3 h-12 w-12 rounded-2xl bg-primary/10 flex items-center justify-center border border-primary/25 shadow-sm">
            <Dumbbell className="h-6 w-6 text-primary" />
          </div>
          <CardTitle className="text-2xl font-bold tracking-tight text-foreground">Join {APP_NAME}</CardTitle>
          <CardDescription className="text-muted-foreground text-sm">
            Track workouts and achieve true progressive overload
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <Suspense fallback={<div className="text-center py-6"><Loader2 className="h-6 w-6 animate-spin mx-auto text-primary" /></div>}>
            <SignUpForm />
          </Suspense>

          <div className="flex items-center gap-2 text-xs text-muted-foreground bg-secondary/50 p-2.5 rounded-lg border border-border/50">
            <Shield className="h-4 w-4 flex-shrink-0 text-primary" />
            <span>
              Your workout data is private and securely encrypted. No tracking or ads.
            </span>
          </div>

          <p className="text-center text-xs text-muted-foreground">
            Already have an account?{" "}
            <Link href="/login" className="text-primary hover:underline font-semibold">
              Log in
            </Link>
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
