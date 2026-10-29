"use client";
// ---------------------------------------------------------------
// OverloadHQ – Forgot Password Page
// Stitch Prototype styling with warm backgrounds, pill buttons,
// Plus Jakarta Sans display typography, and vermillion accents
// ---------------------------------------------------------------

import { useState } from "react";
import Link from "next/link";
import { api } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Loader2, Mail, ArrowLeft, Zap } from "lucide-react";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [sent, setSent] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      await api.auth.forgotPassword(email);
      setSent(true);
    } catch (err: any) {
      setError(err.message || "Something went wrong");
    } finally {
      setLoading(false);
    }
  };

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
          <h1 className="font-display text-xl font-bold text-on-surface">Reset Password</h1>
          <p className="text-xs sm:text-sm text-on-surface-variant">
            {sent
              ? "Check your email for password recovery instructions"
              : "Enter your registered email and we'll send a reset link"}
          </p>
        </div>

        {sent ? (
          <div className="text-center space-y-4 pt-2">
            <div className="w-12 h-12 rounded-2xl bg-primary/10 text-primary flex items-center justify-center mx-auto">
              <Mail className="h-6 w-6" />
            </div>
            <p className="text-xs sm:text-sm text-on-surface-variant leading-relaxed">
              If an account exists for <strong className="text-on-surface font-semibold">{email}</strong>, you will receive a reset link shortly.
            </p>
            <Link href="/login" className="block pt-2">
              <Button variant="outline" className="w-full rounded-full h-11 text-xs font-semibold border-border">
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back to Login
              </Button>
            </Link>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            {error && (
              <div className="p-3 rounded-2xl bg-destructive/10 text-destructive text-xs font-semibold">
                {error}
              </div>
            )}
            <div className="space-y-1.5">
              <Label htmlFor="forgot-email" className="text-xs font-semibold text-on-surface">
                Email Address
              </Label>
              <Input
                id="forgot-email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                placeholder="you@example.com"
                className="bg-surface-container-low rounded-xl h-11 text-sm border-border/60"
              />
            </div>
            <Button
              type="submit"
              className="w-full h-12 rounded-full bg-primary hover:opacity-95 text-primary-foreground font-display font-bold text-sm shadow-md active:scale-[0.98] transition-all"
              disabled={loading}
            >
              {loading && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
              Send Reset Link
            </Button>
            <Link
              href="/login"
              className="block text-xs font-semibold text-center text-on-surface-variant hover:text-primary transition-colors pt-1"
            >
              ← Back to login
            </Link>
          </form>
        )}
      </div>
    </div>
  );
}
