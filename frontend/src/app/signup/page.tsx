"use client";
// ---------------------------------------------------------------
// OverloadHQ – Sign Up Page
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
import { Dumbbell, Loader2, Shield } from "lucide-react";
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
    setLoading(true);
    try {
      await register(form);
      router.push("/onboarding");
    } catch (err: any) {
      setError(err.message || "Registration failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {error && (
        <div className="p-3 rounded-lg bg-destructive/10 text-destructive text-sm">
          {error}
        </div>
      )}

      <div className="space-y-2">
        <Label htmlFor="name">Name</Label>
        <Input
          id="name"
          placeholder="Your name"
          value={form.name}
          onChange={(e) => setForm({ ...form, name: e.target.value })}
          required
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="username">Username</Label>
        <Input
          id="username"
          placeholder="coollifter42"
          value={form.username}
          onChange={(e) => setForm({ ...form, username: e.target.value })}
          required
          pattern="^[a-zA-Z0-9_]+$"
          minLength={3}
        />
        <p className="text-xs text-muted-foreground">Letters, numbers, underscores only</p>
      </div>

      <div className="space-y-2">
        <Label htmlFor="signup-email">Email</Label>
        <Input
          id="signup-email"
          type="email"
          placeholder="you@example.com"
          value={form.email}
          onChange={(e) => setForm({ ...form, email: e.target.value })}
          required
          autoComplete="email"
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="signup-password">Password</Label>
        <Input
          id="signup-password"
          type="password"
          placeholder="Min 8 characters"
          value={form.password}
          onChange={(e) => setForm({ ...form, password: e.target.value })}
          required
          minLength={8}
          autoComplete="new-password"
        />
      </div>

      {inviteFromUrl || form.inviteCode ? (
        <div className="space-y-2">
          <Label htmlFor="invite">Invite Code</Label>
          <Input
            id="invite"
            placeholder="Enter invite code"
            value={form.inviteCode}
            onChange={(e) => setForm({ ...form, inviteCode: e.target.value })}
          />
        </div>
      ) : null}

      <Button type="submit" className="w-full" disabled={loading}>
        {loading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
        Create Account
      </Button>
    </form>
  );
}

export default function SignUpPage() {
  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <Card className="w-full max-w-md animate-fade-in">
        <CardHeader className="text-center">
          <div className="mx-auto mb-3">
            <Dumbbell className="h-10 w-10 text-primary" />
          </div>
          <CardTitle className="text-2xl">Join {APP_NAME}</CardTitle>
          <CardDescription>
            Start tracking your progressive overload
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Suspense fallback={<div className="text-center"><Loader2 className="h-4 w-4 animate-spin mx-auto" /></div>}>
            <SignUpForm />
          </Suspense>

          <div className="mt-4 flex items-center gap-2 text-xs text-muted-foreground">
            <Shield className="h-3 w-3 flex-shrink-0" />
            <span>
              We store your email, workout data, and encrypted password. No ads, no tracking, no data sharing.
            </span>
          </div>

          <p className="mt-4 text-center text-sm text-muted-foreground">
            Already have an account?{" "}
            <Link href="/login" className="text-primary hover:underline font-medium">
              Log in
            </Link>
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
