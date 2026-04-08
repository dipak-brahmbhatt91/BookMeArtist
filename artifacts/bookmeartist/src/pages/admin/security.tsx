import { useState } from "react";
import { AdminLayout } from "@/components/admin-layout";
import { useAuth } from "@/contexts/auth-context";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { KeyRound, User, ShieldCheck, Eye, EyeOff } from "lucide-react";
import { apiUrl } from "@/lib/api-base";

async function apiFetch(path: string, body: Record<string, string>) {
  const res = await fetch(path, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    credentials: "include",
    body: JSON.stringify(body),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || "Request failed");
  return data;
}

function PasswordInput({ id, value, onChange, placeholder }: { id: string; value: string; onChange: (v: string) => void; placeholder?: string }) {
  const [show, setShow] = useState(false);
  return (
    <div className="relative">
      <Input
        id={id}
        type={show ? "text" : "password"}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="bg-[#0f0f1a] border-white/10 text-white pr-10"
      />
      <button
        type="button"
        onClick={() => setShow((s) => !s)}
        className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-white transition-colors"
      >
        {show ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
      </button>
    </div>
  );
}

export default function AdminSecurity() {
  const { user, refresh } = useAuth();
  const { toast } = useToast();

  const [usernameForm, setUsernameForm] = useState({ newUsername: user?.username ?? "", currentPassword: "" });
  const [usernameLoading, setUsernameLoading] = useState(false);

  const [passwordForm, setPasswordForm] = useState({ currentPassword: "", newPassword: "", confirmPassword: "" });
  const [passwordLoading, setPasswordLoading] = useState(false);

  async function handleUsernameSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!usernameForm.newUsername.trim()) return;
    setUsernameLoading(true);
    try {
      await apiFetch(apiUrl("/api/admin/credentials/username"), {
        newUsername: usernameForm.newUsername.trim(),
        currentPassword: usernameForm.currentPassword,
      });
      toast({ title: "Username updated", description: "Your login username has been changed." });
      setUsernameForm((f) => ({ ...f, currentPassword: "" }));
      await refresh();
    } catch (err: any) {
      toast({ title: "Failed", description: err.message, variant: "destructive" });
    } finally {
      setUsernameLoading(false);
    }
  }

  async function handlePasswordSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      toast({ title: "Passwords don't match", description: "New password and confirmation must match.", variant: "destructive" });
      return;
    }
    if (passwordForm.newPassword.length < 12) {
      toast({ title: "Too short", description: "Password must be at least 12 characters.", variant: "destructive" });
      return;
    }
    setPasswordLoading(true);
    try {
      await apiFetch(apiUrl("/api/admin/credentials/password"), {
        currentPassword: passwordForm.currentPassword,
        newPassword: passwordForm.newPassword,
      });
      toast({ title: "Password updated", description: "Your password has been changed successfully." });
      setPasswordForm({ currentPassword: "", newPassword: "", confirmPassword: "" });
    } catch (err: any) {
      toast({ title: "Failed", description: err.message, variant: "destructive" });
    } finally {
      setPasswordLoading(false);
    }
  }

  return (
    <AdminLayout>
      <div className="p-4 sm:p-8 max-w-2xl mx-auto w-full">
        <div className="mb-8 flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
            <ShieldCheck className="w-5 h-5 text-primary" />
          </div>
          <div>
            <h1 className="text-2xl font-display font-bold text-white">Security Settings</h1>
            <p className="text-muted-foreground text-sm mt-0.5">Manage your admin login credentials</p>
          </div>
        </div>

        <div className="space-y-6">
          {/* Current account info */}
          <div className="bg-[#0f0f1a] border border-white/10 rounded-2xl p-5 flex items-center gap-4">
            <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center text-primary font-bold text-lg">
              {user?.username?.[0]?.toUpperCase()}
            </div>
            <div>
              <p className="text-white font-medium">{user?.username}</p>
              <p className="text-muted-foreground text-sm capitalize">{user?.role} account</p>
            </div>
          </div>

          {/* Change Username */}
          <div className="bg-[#0f0f1a] border border-white/10 rounded-2xl p-6">
            <div className="flex items-center gap-2 mb-5">
              <User className="w-4 h-4 text-primary" />
              <h2 className="text-white font-semibold">Change Username</h2>
            </div>
            <form onSubmit={handleUsernameSubmit} className="space-y-4">
              <div className="space-y-1.5">
                <Label htmlFor="newUsername" className="text-muted-foreground text-sm">New Username</Label>
                <Input
                  id="newUsername"
                  value={usernameForm.newUsername}
                  onChange={(e) => setUsernameForm((f) => ({ ...f, newUsername: e.target.value }))}
                  className="bg-[#0a0a0f] border-white/10 text-white"
                  placeholder="Enter new username"
                  minLength={2}
                  maxLength={50}
                  required
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="usernameCurrentPw" className="text-muted-foreground text-sm">Confirm with Current Password</Label>
                <PasswordInput
                  id="usernameCurrentPw"
                  value={usernameForm.currentPassword}
                  onChange={(v) => setUsernameForm((f) => ({ ...f, currentPassword: v }))}
                  placeholder="Your current password"
                />
              </div>
              <Button
                type="submit"
                disabled={usernameLoading || !usernameForm.currentPassword}
                className="bg-primary hover:bg-primary/90 text-white"
              >
                {usernameLoading ? "Saving…" : "Update Username"}
              </Button>
            </form>
          </div>

          {/* Change Password */}
          <div className="bg-[#0f0f1a] border border-white/10 rounded-2xl p-6">
            <div className="flex items-center gap-2 mb-5">
              <KeyRound className="w-4 h-4 text-primary" />
              <h2 className="text-white font-semibold">Change Password</h2>
            </div>
            <form onSubmit={handlePasswordSubmit} className="space-y-4">
              <div className="space-y-1.5">
                <Label htmlFor="currentPw" className="text-muted-foreground text-sm">Current Password</Label>
                <PasswordInput
                  id="currentPw"
                  value={passwordForm.currentPassword}
                  onChange={(v) => setPasswordForm((f) => ({ ...f, currentPassword: v }))}
                  placeholder="Enter current password"
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="newPw" className="text-muted-foreground text-sm">New Password</Label>
                <PasswordInput
                  id="newPw"
                  value={passwordForm.newPassword}
                  onChange={(v) => setPasswordForm((f) => ({ ...f, newPassword: v }))}
                  placeholder="At least 12 characters"
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="confirmPw" className="text-muted-foreground text-sm">Confirm New Password</Label>
                <PasswordInput
                  id="confirmPw"
                  value={passwordForm.confirmPassword}
                  onChange={(v) => setPasswordForm((f) => ({ ...f, confirmPassword: v }))}
                  placeholder="Repeat new password"
                />
              </div>
              {passwordForm.newPassword && passwordForm.confirmPassword && passwordForm.newPassword !== passwordForm.confirmPassword && (
                <p className="text-red-400 text-sm">Passwords don't match</p>
              )}
              <Button
                type="submit"
                disabled={passwordLoading || !passwordForm.currentPassword || !passwordForm.newPassword}
                className="bg-primary hover:bg-primary/90 text-white"
              >
                {passwordLoading ? "Saving…" : "Update Password"}
              </Button>
            </form>
          </div>
        </div>
      </div>
    </AdminLayout>
  );
}
