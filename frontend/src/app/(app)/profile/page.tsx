"use client";
// ---------------------------------------------------------------
// OverloadHQ – Profile & Settings Page
// Stitch Prototype styling with warm card surfaces, pill buttons,
// 3-state theme mode selector (Light/Dark/System), and export
// ---------------------------------------------------------------

import { useState } from "react";
import { useAuth } from "@/lib/auth-context";
import { api, ApiError } from "@/lib/api";
import { useMutation } from "@tanstack/react-query";
import {
  GOAL_LABELS,
  EXPERIENCE_LABELS,
} from "@/lib/config";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/components/ui/use-toast";
import {
  User,
  Settings,
  Shield,
  Download,
  Trash2,
  Loader2,
  LogOut,
  Lock,
  Save,
  Sun,
  Moon,
  Laptop,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { useTheme } from "@/lib/theme-context";

export default function ProfilePage() {
  const { user, refreshUser, logout } = useAuth();
  const { toast } = useToast();
  const router = useRouter();
  const { theme, setTheme } = useTheme();

  const [editMode, setEditMode] = useState(false);
  const [form, setForm] = useState({
    name: user?.name || "",
    goal: user?.goal || "GENERAL_FITNESS",
    experienceLevel: user?.experienceLevel || "BEGINNER",
    preferredUnit: user?.preferredUnit || "KG",
    bodyWeightKg: user?.bodyWeightKg || "",
    visibility: user?.visibility || "PRIVATE",
  });
  const [passwordForm, setPasswordForm] = useState({
    currentPassword: "",
    newPassword: "",
  });
  const [showPasswordForm, setShowPasswordForm] = useState(false);

  const updateMutation = useMutation({
    mutationFn: (data: any) => api.user.updateProfile(data),
    onSuccess: () => {
      refreshUser();
      setEditMode(false);
      toast({ title: "Profile updated!", variant: "default" });
    },
    onError: (err: any) => {
      toast({ title: "Error", description: err.message, variant: "destructive" });
    },
  });

  const passwordMutation = useMutation({
    mutationFn: (data: { currentPassword: string; newPassword: string }) =>
      api.user.changePassword(data),
    onSuccess: () => {
      setShowPasswordForm(false);
      setPasswordForm({ currentPassword: "", newPassword: "" });
      toast({ title: "Password changed!", variant: "default" });
    },
    onError: (err: any) => {
      toast({ title: "Error", description: err.message, variant: "destructive" });
    },
  });

  const handleExport = async () => {
    try {
      const csv = await api.export.csv();
      const blob = new Blob([csv], { type: "text/csv" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `overloadhq_export_${new Date().toISOString().split("T")[0]}.csv`;
      a.click();
      URL.revokeObjectURL(url);
      toast({ title: "Export downloaded!" });
    } catch (err: any) {
      toast({ title: "Export failed", description: err.message, variant: "destructive" });
    }
  };

  const handleDeleteAccount = async () => {
    if (
      !confirm(
        "Are you sure? This will PERMANENTLY delete your account and ALL workout data. This cannot be undone."
      )
    )
      return;
    if (!confirm("Last chance — confirm account deletion.")) return;

    try {
      await api.user.deleteAccount();
      router.push("/");
    } catch (err: any) {
      toast({ title: "Error", description: err.message, variant: "destructive" });
    }
  };

  const handleLogout = async () => {
    try {
      await logout();
    } catch (e) {
      console.error(e);
    }
    window.location.href = "/";
  };

  return (
    <div className="space-y-6 max-w-xl mx-auto pb-16">
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-full bg-primary/10 text-primary flex items-center justify-center font-display font-bold">
          <User className="h-5 w-5" />
        </div>
        <div>
          <h1 className="font-display text-2xl sm:text-3xl font-extrabold text-on-surface tracking-tight">
            Account & Settings
          </h1>
          <p className="text-xs sm:text-sm text-on-surface-variant">
            Manage your athlete profile, theme, and data preferences.
          </p>
        </div>
      </div>

      {/* Profile Info */}
      <div className="p-5 sm:p-6 rounded-2xl md:rounded-3xl bg-card border border-border/80 shadow-sm space-y-4">
        <div className="flex items-center justify-between pb-3 border-b border-border/40">
          <div className="flex items-center gap-2">
            <Settings className="h-4 w-4 text-primary" />
            <h3 className="font-display font-bold text-base text-on-surface">
              Athlete Profile
            </h3>
          </div>
          {!editMode && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => setEditMode(true)}
              className="rounded-full text-xs font-semibold px-4 h-8"
            >
              Edit
            </Button>
          )}
        </div>

        {editMode ? (
          <div className="space-y-3.5 pt-1">
            <div className="space-y-1.5">
              <Label className="text-xs font-semibold text-on-surface-variant">Name</Label>
              <Input
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                className="bg-surface-container-low rounded-xl"
              />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs font-semibold text-on-surface-variant">Goal</Label>
              <select
                value={form.goal}
                onChange={(e) => setForm({ ...form, goal: e.target.value as any })}
                className="w-full h-11 rounded-xl border border-border bg-surface-container-low px-3.5 text-sm font-medium text-on-surface focus:outline-none"
              >
                {Object.entries(GOAL_LABELS).map(([k, v]) => (
                  <option key={k} value={k}>{v}</option>
                ))}
              </select>
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs font-semibold text-on-surface-variant">Experience Level</Label>
              <select
                value={form.experienceLevel}
                onChange={(e) => setForm({ ...form, experienceLevel: e.target.value as any })}
                className="w-full h-11 rounded-xl border border-border bg-surface-container-low px-3.5 text-sm font-medium text-on-surface focus:outline-none"
              >
                {Object.entries(EXPERIENCE_LABELS).map(([k, v]) => (
                  <option key={k} value={k}>{v}</option>
                ))}
              </select>
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs font-semibold text-on-surface-variant">Preferred Weight Unit</Label>
              <select
                value={form.preferredUnit}
                onChange={(e) => setForm({ ...form, preferredUnit: e.target.value as "KG" | "LB" })}
                className="w-full h-11 rounded-xl border border-border bg-surface-container-low px-3.5 text-sm font-medium text-on-surface focus:outline-none"
              >
                <option value="KG">Kilograms (kg)</option>
                <option value="LB">Pounds (lb)</option>
              </select>
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs font-semibold text-on-surface-variant">Body Weight (kg, optional)</Label>
              <Input
                type="number"
                step="0.1"
                value={form.bodyWeightKg}
                onChange={(e) => setForm({ ...form, bodyWeightKg: e.target.value })}
                placeholder="e.g. 78.5"
                className="bg-surface-container-low rounded-xl"
              />
            </div>
            <div className="flex gap-2 pt-2">
              <Button
                onClick={() => {
                  const data: any = { ...form };
                  if (data.bodyWeightKg === "") data.bodyWeightKg = null;
                  else data.bodyWeightKg = Number(data.bodyWeightKg);
                  updateMutation.mutate(data);
                }}
                disabled={updateMutation.isPending}
                className="rounded-full bg-primary text-primary-foreground font-semibold px-5"
              >
                {updateMutation.isPending && <Loader2 className="h-4 w-4 animate-spin mr-1.5" />}
                <Save className="h-4 w-4 mr-1.5" />
                Save Changes
              </Button>
              <Button
                variant="ghost"
                onClick={() => setEditMode(false)}
                className="rounded-full font-semibold"
              >
                Cancel
              </Button>
            </div>
          </div>
        ) : (
          <div className="divide-y divide-border/40">
            <InfoRow label="Name" value={user?.name || "Athlete"} />
            <InfoRow label="Email" value={user?.email || ""} />
            <InfoRow label="Username" value={`@${user?.username || ""}`} />
            <InfoRow label="Goal" value={GOAL_LABELS[user?.goal || ""] || user?.goal || "General Fitness"} />
            <InfoRow
              label="Experience"
              value={EXPERIENCE_LABELS[user?.experienceLevel || ""] || user?.experienceLevel || "Beginner"}
            />
            <InfoRow label="Preferred Unit" value={user?.preferredUnit === "LB" ? "Pounds (lb)" : "Kilograms (kg)"} />
            {user?.bodyWeightKg && (
              <InfoRow label="Body Weight" value={`${user.bodyWeightKg} kg`} />
            )}
            <InfoRow
              label="Member Since"
              value={user?.createdAt ? new Date(user.createdAt).toLocaleDateString() : ""}
            />
          </div>
        )}
      </div>

      {/* Change Password */}
      <div className="p-5 sm:p-6 rounded-2xl md:rounded-3xl bg-card border border-border/80 shadow-sm space-y-4">
        <div className="flex items-center gap-2 pb-2">
          <Lock className="h-4 w-4 text-primary" />
          <h3 className="font-display font-bold text-base text-on-surface">
            Security & Password
          </h3>
        </div>
        {showPasswordForm ? (
          <div className="space-y-3">
            <div className="space-y-1.5">
              <Label className="text-xs font-semibold text-on-surface-variant">Current Password</Label>
              <Input
                type="password"
                value={passwordForm.currentPassword}
                onChange={(e) =>
                  setPasswordForm({ ...passwordForm, currentPassword: e.target.value })
                }
                className="bg-surface-container-low rounded-xl"
              />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs font-semibold text-on-surface-variant">New Password</Label>
              <Input
                type="password"
                value={passwordForm.newPassword}
                onChange={(e) =>
                  setPasswordForm({ ...passwordForm, newPassword: e.target.value })
                }
                minLength={8}
                placeholder="Minimum 8 characters"
                className="bg-surface-container-low rounded-xl"
              />
            </div>
            <div className="flex gap-2 pt-1">
              <Button
                onClick={() => passwordMutation.mutate(passwordForm)}
                disabled={passwordMutation.isPending}
                className="rounded-full bg-primary text-primary-foreground font-semibold px-5"
              >
                {passwordMutation.isPending && <Loader2 className="h-4 w-4 animate-spin mr-1.5" />}
                Update Password
              </Button>
              <Button
                variant="ghost"
                onClick={() => setShowPasswordForm(false)}
                className="rounded-full font-semibold"
              >
                Cancel
              </Button>
            </div>
          </div>
        ) : (
          <Button
            variant="outline"
            onClick={() => setShowPasswordForm(true)}
            className="rounded-full text-xs font-semibold"
          >
            Change Account Password
          </Button>
        )}
      </div>

      {/* Appearance / Theme Mode */}
      <div className="p-5 sm:p-6 rounded-2xl md:rounded-3xl bg-card border border-border/80 shadow-sm">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h3 className="font-display font-bold text-base text-on-surface flex items-center gap-2">
              <Sun className="h-4 w-4 text-primary" />
              Theme Appearance
            </h3>
            <p className="text-xs text-on-surface-variant mt-0.5">
              Choose your interface color scheme.
            </p>
          </div>
          <div className="flex items-center gap-1 bg-surface-container p-1 rounded-full border border-border/60">
            <button
              type="button"
              onClick={() => setTheme("light")}
              className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-xs font-semibold transition-all ${
                theme === "light"
                  ? "bg-card text-on-surface shadow-sm font-bold"
                  : "text-on-surface-variant hover:text-on-surface"
              }`}
            >
              <Sun className="h-3.5 w-3.5 text-accent-amber" />
              Light
            </button>
            <button
              type="button"
              onClick={() => setTheme("dark")}
              className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-xs font-semibold transition-all ${
                theme === "dark"
                  ? "bg-card text-on-surface shadow-sm font-bold"
                  : "text-on-surface-variant hover:text-on-surface"
              }`}
            >
              <Moon className="h-3.5 w-3.5 text-primary" />
              Dark
            </button>
            <button
              type="button"
              onClick={() => setTheme("system")}
              className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-xs font-semibold transition-all ${
                theme === "system"
                  ? "bg-card text-on-surface shadow-sm font-bold"
                  : "text-on-surface-variant hover:text-on-surface"
              }`}
            >
              <Laptop className="h-3.5 w-3.5 text-on-surface-variant" />
              System
            </button>
          </div>
        </div>
      </div>

      {/* Data Export & Logout */}
      <div className="p-5 sm:p-6 rounded-2xl md:rounded-3xl bg-card border border-border/80 shadow-sm space-y-3">
        <Button
          variant="outline"
          className="w-full justify-start rounded-full h-11 text-xs font-semibold border-border/80"
          onClick={handleExport}
        >
          <Download className="h-4 w-4 mr-2.5 text-primary" />
          Export All Workout Data (CSV)
        </Button>
        <Button
          variant="outline"
          className="w-full justify-start rounded-full h-11 text-xs font-semibold border-border/80 text-on-surface hover:text-destructive"
          onClick={handleLogout}
        >
          <LogOut className="h-4 w-4 mr-2.5" />
          Log Out of OverloadHQ
        </Button>
      </div>

      {/* Danger Zone */}
      <div className="p-5 sm:p-6 rounded-2xl md:rounded-3xl bg-card border border-destructive/30 shadow-sm space-y-3">
        <div className="flex items-center gap-2 text-destructive">
          <Shield className="h-4 w-4" />
          <h3 className="font-display font-bold text-sm">Danger Zone</h3>
        </div>
        <p className="text-xs text-on-surface-variant leading-relaxed">
          Permanently delete your account along with all recorded workout logs, sets, and personal records.
        </p>
        <Button
          variant="destructive"
          size="sm"
          onClick={handleDeleteAccount}
          className="rounded-full text-xs font-semibold px-4"
        >
          <Trash2 className="h-4 w-4 mr-2" />
          Delete Account
        </Button>
      </div>
    </div>
  );
}

function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between items-center py-2.5 first:pt-1 last:pb-0">
      <span className="text-xs font-semibold text-on-surface-variant">{label}</span>
      <span className="text-sm font-semibold text-on-surface">{value}</span>
    </div>
  );
}
