"use client";
// ---------------------------------------------------------------
// OverloadHQ – Profile Page
// Edit profile, change password, export, delete account.
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
      toast({ title: "Profile updated!", variant: "success" as any });
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
      toast({ title: "Password changed!", variant: "success" as any });
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
    if (!confirm("Last chance — type your username to confirm.")) return;

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
    <div className="space-y-6 max-w-lg mx-auto">
      <h1 className="text-2xl font-bold flex items-center gap-2">
        <User className="h-6 w-6" />
        Profile
      </h1>

      {/* Profile Info */}
      <Card>
        <CardHeader>
          <CardTitle className="text-sm flex items-center justify-between">
            <span className="flex items-center gap-2">
              <Settings className="h-4 w-4 text-muted-foreground" />
              Settings
            </span>
            {!editMode && (
              <Button variant="ghost" size="sm" onClick={() => setEditMode(true)}>
                Edit
              </Button>
            )}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {editMode ? (
            <>
              <div className="space-y-2">
                <Label>Name</Label>
                <Input
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label>Goal</Label>
                <select
                  value={form.goal}
                  onChange={(e) => setForm({ ...form, goal: e.target.value })}
                  className="w-full h-10 rounded-md border border-input bg-background px-3 text-sm"
                >
                  {Object.entries(GOAL_LABELS).map(([k, v]) => (
                    <option key={k} value={k}>{v}</option>
                  ))}
                </select>
              </div>
              <div className="space-y-2">
                <Label>Experience Level</Label>
                <select
                  value={form.experienceLevel}
                  onChange={(e) => setForm({ ...form, experienceLevel: e.target.value })}
                  className="w-full h-10 rounded-md border border-input bg-background px-3 text-sm"
                >
                  {Object.entries(EXPERIENCE_LABELS).map(([k, v]) => (
                    <option key={k} value={k}>{v}</option>
                  ))}
                </select>
              </div>
              <div className="space-y-2">
                <Label>Preferred Unit</Label>
                <select
                  value={form.preferredUnit}
                  onChange={(e) => setForm({ ...form, preferredUnit: e.target.value })}
                  className="w-full h-10 rounded-md border border-input bg-background px-3 text-sm"
                >
                  <option value="KG">Kilograms (kg)</option>
                  <option value="LB">Pounds (lb)</option>
                </select>
              </div>
              <div className="space-y-2">
                <Label>Body Weight (kg, optional)</Label>
                <Input
                  type="number"
                  step="0.1"
                  value={form.bodyWeightKg}
                  onChange={(e) => setForm({ ...form, bodyWeightKg: e.target.value })}
                  placeholder="Optional"
                />
              </div>
              <div className="flex gap-2">
                <Button
                  onClick={() => {
                    const data: any = { ...form };
                    if (data.bodyWeightKg === "") data.bodyWeightKg = null;
                    else data.bodyWeightKg = Number(data.bodyWeightKg);
                    updateMutation.mutate(data);
                  }}
                  disabled={updateMutation.isPending}
                >
                  {updateMutation.isPending && <Loader2 className="h-4 w-4 animate-spin mr-1" />}
                  <Save className="h-4 w-4 mr-1" />
                  Save
                </Button>
                <Button variant="ghost" onClick={() => setEditMode(false)}>
                  Cancel
                </Button>
              </div>
            </>
          ) : (
            <div className="space-y-3">
              <InfoRow label="Name" value={user?.name || ""} />
              <InfoRow label="Email" value={user?.email || ""} />
              <InfoRow label="Username" value={`@${user?.username || ""}`} />
              <InfoRow label="Goal" value={GOAL_LABELS[user?.goal || ""] || user?.goal || ""} />
              <InfoRow
                label="Experience"
                value={EXPERIENCE_LABELS[user?.experienceLevel || ""] || user?.experienceLevel || ""}
              />
              <InfoRow label="Unit" value={user?.preferredUnit || "KG"} />
              {user?.bodyWeightKg && (
                <InfoRow label="Body Weight" value={`${user.bodyWeightKg} kg`} />
              )}
              <InfoRow
                label="Joined"
                value={user?.createdAt ? new Date(user.createdAt).toLocaleDateString() : ""}
              />
            </div>
          )}
        </CardContent>
      </Card>

      {/* Change Password */}
      <Card>
        <CardHeader>
          <CardTitle className="text-sm flex items-center gap-2">
            <Lock className="h-4 w-4 text-muted-foreground" />
            Password
          </CardTitle>
        </CardHeader>
        <CardContent>
          {showPasswordForm ? (
            <div className="space-y-3">
              <div className="space-y-2">
                <Label>Current Password</Label>
                <Input
                  type="password"
                  value={passwordForm.currentPassword}
                  onChange={(e) =>
                    setPasswordForm({ ...passwordForm, currentPassword: e.target.value })
                  }
                />
              </div>
              <div className="space-y-2">
                <Label>New Password</Label>
                <Input
                  type="password"
                  value={passwordForm.newPassword}
                  onChange={(e) =>
                    setPasswordForm({ ...passwordForm, newPassword: e.target.value })
                  }
                  minLength={8}
                  placeholder="Min 8 characters"
                />
              </div>
              <div className="flex gap-2">
                <Button
                  onClick={() => passwordMutation.mutate(passwordForm)}
                  disabled={passwordMutation.isPending}
                  size="sm"
                >
                  {passwordMutation.isPending && <Loader2 className="h-3 w-3 animate-spin mr-1" />}
                  Change
                </Button>
                <Button variant="ghost" size="sm" onClick={() => setShowPasswordForm(false)}>
                  Cancel
                </Button>
              </div>
            </div>
          ) : (
            <Button variant="outline" size="sm" onClick={() => setShowPasswordForm(true)}>
              Change Password
            </Button>
          )}
        </CardContent>
      </Card>

      {/* Appearance / Theme */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm flex items-center gap-2">
            <Sun className="h-4 w-4 text-primary" />
            Appearance
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium">Theme Mode</p>
              <p className="text-xs text-muted-foreground">Select light or dark background</p>
            </div>
            <div className="flex items-center gap-1.5 bg-secondary p-1 rounded-lg">
              <button
                type="button"
                onClick={() => setTheme("light")}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium transition-all ${
                  theme === "light"
                    ? "bg-background text-foreground shadow-sm"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                <Sun className="h-3.5 w-3.5 text-amber-500" />
                Light
              </button>
              <button
                type="button"
                onClick={() => setTheme("dark")}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium transition-all ${
                  theme === "dark"
                    ? "bg-background text-foreground shadow-sm"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                <Moon className="h-3.5 w-3.5 text-primary" />
                Dark
              </button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Actions */}
      <Card>
        <CardContent className="py-4 space-y-3">
          <Button variant="outline" className="w-full justify-start" onClick={handleExport}>
            <Download className="h-4 w-4 mr-2" />
            Export Data as CSV
          </Button>
          <Button variant="outline" className="w-full justify-start" onClick={handleLogout}>
            <LogOut className="h-4 w-4 mr-2" />
            Log Out
          </Button>
        </CardContent>
      </Card>

      {/* Danger Zone */}
      <Card className="border-destructive/30">
        <CardHeader>
          <CardTitle className="text-sm text-destructive flex items-center gap-2">
            <Shield className="h-4 w-4" />
            Danger Zone
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Button
            variant="destructive"
            size="sm"
            onClick={handleDeleteAccount}
          >
            <Trash2 className="h-4 w-4 mr-2" />
            Delete My Account & All Data
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}

function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between items-center py-1">
      <span className="text-sm text-muted-foreground">{label}</span>
      <span className="text-sm font-medium">{value}</span>
    </div>
  );
}
