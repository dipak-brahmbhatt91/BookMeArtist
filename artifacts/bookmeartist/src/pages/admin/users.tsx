import { AdminLayout } from "@/components/admin-layout";
import { useEffect, useState } from "react";
import { useSearch } from "wouter";
import {
  useListAdminUsers,
  useCreateAdminUser,
  useUpdateAdminUser,
  useDeleteAdminUser,
  getListAdminUsersQueryKey,
  useListArtists,
} from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { Users, Plus, Trash2, Edit2, Shield, Palette, Key, User, Lock, ShieldCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/auth-context";
import { format } from "date-fns";

export default function AdminUsers() {
  const search = useSearch();
  const params = new URLSearchParams(search);
  const { user: currentUser } = useAuth();
  const { data: users, isLoading } = useListAdminUsers();
  const { data: artists } = useListArtists();
  const createUser = useCreateAdminUser();
  const updateUser = useUpdateAdminUser();
  const deleteUser = useDeleteAdminUser();
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const [isOpen, setIsOpen] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editingRole, setEditingRole] = useState<string | null>(null);
  const [prefillApplied, setPrefillApplied] = useState(false);

  const isSuperAdmin = currentUser?.role === "superadmin";

  // True when editing another elevated account (admin/superadmin) and you're not superadmin
  const isEditingOtherAdmin =
    editingId !== null &&
    (editingRole === "admin" || editingRole === "superadmin") &&
    editingId !== currentUser?.id &&
    !isSuperAdmin;

  const initialFormState = {
    username: "",
    password: "",
    role: "artist" as "superadmin" | "admin" | "artist",
    artistId: undefined as number | undefined,
  };

  const [form, setForm] = useState(initialFormState);

  useEffect(() => {
    if (prefillApplied || isOpen) return;

    const username = params.get("username");
    const artistIdParam = params.get("artistId");
    const artistId = artistIdParam ? parseInt(artistIdParam, 10) : undefined;

    if (!username && !artistId) return;

    setEditingId(null);
    setForm({
      ...initialFormState,
      username: username ?? "",
      artistId: Number.isFinite(artistId) ? artistId : undefined,
    });
    setIsOpen(true);
    setPrefillApplied(true);
  }, [isOpen, params, prefillApplied]);

  const handleOpen = (user?: NonNullable<typeof users>[0]) => {
    if (user) {
      setEditingId(user.id);
      setEditingRole(user.role);
      setForm({
        username: user.username,
        password: "",
        role: user.role as "superadmin" | "admin" | "artist",
        artistId: user.artistId ?? undefined,
      });
    } else {
      setEditingId(null);
      setEditingRole(null);
      setForm(initialFormState);
    }
    setIsOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const payload = {
        username: form.username,
        role: form.role,
        artistId: form.artistId,
        ...(form.password ? { password: form.password } : {}),
      };

      if (editingId) {
        await updateUser.mutateAsync({ id: editingId, data: payload });
        toast({ title: "User Updated", description: `${form.username} has been updated.` });
      } else {
        if (!form.password) {
          toast({ variant: "destructive", title: "Password Required", description: "Please enter a password for the new user." });
          return;
        }
        await createUser.mutateAsync({ data: { ...payload, password: form.password } });
        toast({ title: "User Created", description: `${form.username} can now log in.` });
      }

      queryClient.invalidateQueries({ queryKey: getListAdminUsersQueryKey() });
      setIsOpen(false);
      setForm(initialFormState);
    } catch (err: any) {
      const message = err?.message?.includes("409") || err?.message?.includes("exists")
        ? "Username already exists"
        : "Something went wrong. Please try again.";
      toast({ variant: "destructive", title: "Error", description: message });
    }
  };

  const handleDelete = async (id: number, username: string) => {
    if (!confirm(`Delete user "${username}"? This cannot be undone.`)) return;
    try {
      await deleteUser.mutateAsync({ id });
      toast({ title: "User Deleted", description: `${username} has been removed.` });
      queryClient.invalidateQueries({ queryKey: getListAdminUsersQueryKey() });
    } catch {
      toast({ variant: "destructive", title: "Delete Failed", description: "Could not delete the user." });
    }
  };

  return (
    <AdminLayout>
      <div className="p-4 sm:p-8">
        <div className="flex items-center justify-between mb-6 sm:mb-8">
          <div>
            <h1 className="text-3xl font-bold font-display text-white flex items-center gap-3">
              <Users className="w-8 h-8 text-primary" />
              User Accounts
            </h1>
            <p className="text-slate-400 mt-1">Manage artist login accounts and admin access</p>
          </div>

          <Sheet open={isOpen} onOpenChange={setIsOpen}>
            <SheetTrigger asChild>
              <Button onClick={() => handleOpen()} className="bg-primary hover:bg-primary/90 gap-2">
                <Plus className="w-4 h-4" /> New User
              </Button>
            </SheetTrigger>
            <SheetContent className="bg-slate-900 border-slate-700 text-white w-full sm:max-w-md overflow-y-auto">
              <SheetHeader>
                <SheetTitle className="text-white text-xl font-display">
                  {editingId ? "Edit User" : "Create User Account"}
                </SheetTitle>
              </SheetHeader>

              <form onSubmit={handleSubmit} className="space-y-5 mt-6">
                {isEditingOtherAdmin && (
                  <div className="flex items-start gap-2 p-3 rounded-lg bg-amber-500/10 border border-amber-500/30 text-amber-400 text-sm">
                    <Lock className="w-4 h-4 mt-0.5 shrink-0" />
                    <span>You cannot change the username, password, or role of another admin account.</span>
                  </div>
                )}

                <div className="space-y-2">
                  <label className="text-sm font-semibold text-slate-300">Username *</label>
                  <div className="relative">
                    <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                    <Input
                      value={form.username}
                      onChange={e => setForm(f => ({ ...f, username: e.target.value }))}
                      placeholder="artist_handle"
                      className="pl-9 bg-slate-800 border-slate-600 text-white disabled:opacity-40 disabled:cursor-not-allowed"
                      required={!isEditingOtherAdmin}
                      disabled={isEditingOtherAdmin}
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-semibold text-slate-300">
                    Password {editingId ? "(leave blank to keep current)" : "*"}
                  </label>
                  <div className="relative">
                    <Key className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                    <Input
                      type="password"
                      value={form.password}
                      onChange={e => setForm(f => ({ ...f, password: e.target.value }))}
                      placeholder={isEditingOtherAdmin ? "Cannot change another admin's password" : "••••••••"}
                      className="pl-9 bg-slate-800 border-slate-600 text-white disabled:opacity-40 disabled:cursor-not-allowed"
                      required={!editingId && !isEditingOtherAdmin}
                      disabled={isEditingOtherAdmin}
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-semibold text-slate-300">Role *</label>
                  <Select
                    value={form.role}
                    onValueChange={(v: "superadmin" | "admin" | "artist") => setForm(f => ({ ...f, role: v }))}
                    disabled={isEditingOtherAdmin}
                  >
                    <SelectTrigger className="bg-slate-800 border-slate-600 text-white disabled:opacity-40 disabled:cursor-not-allowed">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="bg-slate-800 border-slate-700">
                      <SelectItem value="artist" className="text-white">Artist</SelectItem>
                      <SelectItem value="admin" className="text-white">Admin</SelectItem>
                      {isSuperAdmin && (
                        <SelectItem value="superadmin" className="text-white">Super Admin</SelectItem>
                      )}
                    </SelectContent>
                  </Select>
                </div>

                {form.role === "artist" && (
                  <div className="space-y-2">
                    <label className="text-sm font-semibold text-slate-300">Linked Artist Profile</label>
                    <Select
                      value={form.artistId?.toString() ?? "none"}
                      onValueChange={(v) => setForm(f => ({ ...f, artistId: v === "none" ? undefined : parseInt(v) }))}
                    >
                      <SelectTrigger className="bg-slate-800 border-slate-600 text-white">
                        <SelectValue placeholder="Select artist profile..." />
                      </SelectTrigger>
                      <SelectContent className="bg-slate-800 border-slate-700 max-h-60">
                        <SelectItem value="none" className="text-white">No linked profile</SelectItem>
                        {artists?.map(a => (
                          <SelectItem key={a.id} value={a.id.toString()} className="text-white">
                            {a.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <p className="text-xs text-slate-500">Link this login to an artist profile so they see their own bookings.</p>
                  </div>
                )}

                <div className="flex gap-3 pt-4">
                  <Button type="submit" className="flex-1 bg-primary hover:bg-primary/90" disabled={createUser.isPending || updateUser.isPending}>
                    {editingId ? "Save Changes" : "Create User"}
                  </Button>
                  <Button type="button" variant="outline" onClick={() => setIsOpen(false)} className="border-slate-600 text-slate-300">
                    Cancel
                  </Button>
                </div>
              </form>
            </SheetContent>
          </Sheet>
        </div>

        <div className="bg-slate-800/50 border border-slate-700/50 rounded-2xl overflow-hidden">
          <div className="px-6 py-4 border-b border-slate-700/50 bg-slate-800/30">
            <div className="grid grid-cols-12 gap-4 text-xs font-semibold uppercase tracking-wider text-slate-500">
              <div className="col-span-3">Username</div>
              <div className="col-span-2">Role</div>
              <div className="col-span-4">Linked Artist</div>
              <div className="col-span-2">Created</div>
              <div className="col-span-1"></div>
            </div>
          </div>

          <div className="divide-y divide-slate-700/30">
            {isLoading ? (
              [...Array(4)].map((_, i) => (
                <div key={i} className="px-6 py-4 animate-pulse">
                  <div className="h-4 bg-slate-700 rounded w-1/3" />
                </div>
              ))
            ) : users && users.length > 0 ? (
              users.map((user) => (
                <div key={user.id} className="px-6 py-4 grid grid-cols-12 gap-4 items-center hover:bg-slate-700/20 transition-colors">
                  <div className="col-span-3 flex items-center gap-2">
                    <div className="w-7 h-7 rounded-lg bg-primary/20 flex items-center justify-center">
                      {user.role === "admin" ? <Shield className="w-3.5 h-3.5 text-primary" /> : <User className="w-3.5 h-3.5 text-primary" />}
                    </div>
                    <span className="font-semibold text-white">{user.username}</span>
                  </div>

                  <div className="col-span-2">
                    <Badge
                      variant="outline"
                      className={
                        user.role === "superadmin"
                          ? "bg-amber-500/10 text-amber-400 border-amber-500/30"
                          : user.role === "admin"
                          ? "bg-violet-500/10 text-violet-400 border-violet-500/30"
                          : "bg-blue-500/10 text-blue-400 border-blue-500/30"
                      }
                    >
                      {user.role === "superadmin"
                        ? <ShieldCheck className="w-3 h-3 mr-1" />
                        : user.role === "admin"
                        ? <Shield className="w-3 h-3 mr-1" />
                        : <Palette className="w-3 h-3 mr-1" />
                      }
                      {user.role === "superadmin" ? "Super Admin" : user.role}
                    </Badge>
                  </div>

                  <div className="col-span-4 text-slate-400 text-sm">
                    {user.artistName ? (
                      <span className="text-white">{user.artistName}</span>
                    ) : (
                      <span className="text-slate-600 italic">No profile linked</span>
                    )}
                  </div>

                  <div className="col-span-2 text-slate-500 text-sm">
                    {format(new Date(user.createdAt), "MMM d, yyyy")}
                  </div>

                  <div className="col-span-1 flex justify-end gap-1">
                    <Button
                      variant="ghost"
                      size="icon"
                      className="w-7 h-7 text-slate-400 hover:text-white"
                      onClick={() => handleOpen(user)}
                    >
                      <Edit2 className="w-3.5 h-3.5" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="w-7 h-7 text-slate-400 hover:text-destructive disabled:opacity-30 disabled:cursor-not-allowed"
                      onClick={() => handleDelete(user.id, user.username)}
                      disabled={
                        user.id === currentUser?.id ||
                        user.role === "superadmin" ||
                        ((user.role === "admin") && !isSuperAdmin)
                      }
                      title={
                        user.id === currentUser?.id ? "Cannot delete your own account"
                        : user.role === "superadmin" ? "Super admin accounts cannot be deleted"
                        : !isSuperAdmin && user.role === "admin" ? "Only a super admin can delete admin accounts"
                        : undefined
                      }
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </Button>
                  </div>
                </div>
              ))
            ) : (
              <div className="px-6 py-16 text-center text-slate-500">
                <Users className="w-12 h-12 mx-auto mb-3 opacity-30" />
                <p className="font-semibold mb-1">No user accounts yet</p>
                <p className="text-sm">Create accounts so artists can log in and manage their bookings.</p>
              </div>
            )}
          </div>
        </div>

        <div className="mt-6 p-4 bg-primary/5 border border-primary/20 rounded-xl text-sm text-slate-400">
          <p className="font-semibold text-white mb-1">How to give an artist login access:</p>
          <ol className="list-decimal list-inside space-y-1">
            <li>Create a user with role <span className="text-primary">Artist</span></li>
            <li>Link them to their artist profile</li>
            <li>Share their username + password — they can log in at <span className="text-primary">/login</span></li>
          </ol>
        </div>
      </div>
    </AdminLayout>
  );
}
