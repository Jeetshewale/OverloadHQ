"use client";
// ---------------------------------------------------------------
// OverloadHQ – Reset Password Page
// Stitch Prototype styling with warm backgrounds, pill buttons,
// Plus Jakarta Sans display typography, and vermillion accents
// ---------------------------------------------------------------

import { useState, Suspense } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { api } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Loader2, Check, Zap } from "lucide-react";

function ResetForm() {
  const searchParams = useSearchParams();
  const token = searchParams.get("token") || "";
  const [password, setPassword] = useState("");
  const [done, setDone] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      await api.auth.resetPassword(token, password);
      setDone(true);
    } catch (err: any) {
      setError(err.message || "Reset failed");
    } finally {
      setLoading(false);
    }
  };

  if (!token) {
    return (
      <div className="text-center py-4 space-y-3">
        <p className="text-xs font-semibold text-destructive">
          Invalid or expired password reset link.
        </p>
        <Link href="/forgot-password">
          <Button variant="outline" className="rounded-full text-xs font-semibold h-10 px-5">
            Request New Link
          </Button>
        </Link>
      </div>
    );
  }

  if (done) {
    return (
      <div className="text-center space-y-4 pt-2">
        <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 text-emerald-500 flex items-center justify-center mx-auto">
          <Check className="h-6 w-6" />
        </div>
        <p className="text-xs sm:text-sm text-on-surface-variant">
          Your password has been successfully reset! You can now log in with your new credentials.
        </p>
        <Link href="/login" className="block pt-2">
          <Button className="w-full rounded-full h-11 text-xs font-semibold bg-primary text-primary-foreground shadow-sm">
            Go to Login
          </Button>
        </Link>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {error && (
        <div className="p-3 rounded-2xl bg-destructive/10 text-destructive text-xs font-semibold">
          {error}
        </div>
      )}
      <div className="space-y-1.5">
        <Label className="text-xs font-semibold text-on-surface">New Password</Label>
        <Input
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
          minLength={8}
          placeholder="Min 8 characters"
          className="bg-surface-container-low rounded-xl h-11 text-sm border-border/60"
        />
      </div>
      <Button
        type="submit"
        className="w-full h-12 rounded-full bg-primary hover:opacity-95 text-primary-foreground font-display font-bold text-sm shadow-md active:scale-[0.98] transition-all"
        disabled={loading}
      >
        {loading && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
        Reset Password
      </Button>
    </form>
  );
}

export default function ResetPasswordPage() {
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
          <h1 className="font-display text-xl font-bold text-on-surface">Set New Password</h1>
          <p className="text-xs sm:text-sm text-on-surface-variant">
            Enter your new secure password below
          </p>
        </div>

        <Suspense fallback={<div className="text-center py-6"><Loader2 className="h-6 w-6 animate-spin mx-auto text-primary" /></div>}>
          <ResetForm />
        </Suspense>
      </div>
    </div>
  );
}
