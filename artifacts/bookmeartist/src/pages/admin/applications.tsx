import { useState } from "react";
import { useListArtists } from "@workspace/api-client-react";
import { AdminLayout } from "@/components/admin-layout";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { BadgeCheck, CheckCircle, ChevronDown, ChevronUp, Clock, Link2, Mail, MapPin, PlusCircle, Trash2, UserRoundCheck, XCircle, Instagram } from "lucide-react";
import { format } from "date-fns";
import { apiUrl } from "@/lib/api-base";

type Application = {
  id: number;
  name: string;
  email: string;
  specialty: string;
  categoryId?: number | null;
  location: string;
  bio: string;
  instagram: string;
  message: string;
  applicationType: "new_artist" | "claim_profile";
  claimedArtistId?: number | null;
  linkedArtistId?: number | null;
  status: "pending" | "approved" | "rejected";
  createdAt: string;
};

const statusColors: Record<string, string> = {
  pending: "bg-amber-400/10 text-amber-400 border-amber-400/20",
  approved: "bg-emerald-400/10 text-emerald-400 border-emerald-400/20",
  rejected: "bg-red-400/10 text-red-400 border-red-400/20",
};

const typeColors: Record<Application["applicationType"], string> = {
  new_artist: "bg-blue-500/10 text-blue-400 border-blue-500/20",
  claim_profile: "bg-violet-500/10 text-violet-400 border-violet-500/20",
};

async function apiPatch(id: number, status: string) {
  const res = await fetch(apiUrl(`/api/admin/applications/${id}`), {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    credentials: "include",
    body: JSON.stringify({ status }),
  });
  if (!res.ok) throw new Error("Failed to update");
  return res.json();
}

async function apiDelete(id: number) {
  const res = await fetch(apiUrl(`/api/admin/applications/${id}`), {
    method: "DELETE",
    credentials: "include",
  });
  if (!res.ok) throw new Error("Failed to delete");
}

async function apiCreateArtistDraft(id: number) {
  const res = await fetch(apiUrl(`/api/admin/applications/${id}/create-artist-draft`), {
    method: "POST",
    credentials: "include",
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data?.error || "Failed to create draft artist");
  return data as { artistId: number };
}

function makeSuggestedUsername(email: string) {
  return email.split("@")[0]?.replace(/[^a-zA-Z0-9._-]/g, "") || "";
}

export default function AdminApplications() {
  const { toast } = useToast();
  const { data: artists } = useListArtists();

  const [apps, setApps] = useState<Application[] | null>(null);
  const [loading, setLoading] = useState(false);
  const [expanded, setExpanded] = useState<number | null>(null);
  const [filter, setFilter] = useState<"all" | "pending" | "approved" | "rejected">("all");
  const [workingId, setWorkingId] = useState<number | null>(null);

  const artistNames = new Map((artists || []).map((artist) => [artist.id, artist.name]));

  async function load() {
    setLoading(true);
    try {
      const res = await fetch(apiUrl("/api/admin/applications"), { credentials: "include" });
      const data = await res.json();
      setApps(data);
    } catch {
      toast({ title: "Failed to load applications", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  }

  if (apps === null && !loading) load();

  async function handleStatus(id: number, status: "approved" | "rejected") {
    setWorkingId(id);
    try {
      const updated = await apiPatch(id, status);
      setApps((prev) => prev?.map((a) => (a.id === id ? { ...a, status: updated.status } : a)) ?? null);
      toast({ title: status === "approved" ? "Application approved" : "Application rejected" });
    } catch {
      toast({ title: "Failed to update", variant: "destructive" });
    } finally {
      setWorkingId(null);
    }
  }

  async function handleDelete(id: number) {
    setWorkingId(id);
    try {
      await apiDelete(id);
      setApps((prev) => prev?.filter((a) => a.id !== id) ?? null);
      toast({ title: "Application deleted" });
    } catch {
      toast({ title: "Failed to delete", variant: "destructive" });
    } finally {
      setWorkingId(null);
    }
  }

  async function handleCreateDraft(id: number) {
    setWorkingId(id);
    try {
      const created = await apiCreateArtistDraft(id);
      setApps((prev) => prev?.map((a) => (
        a.id === id ? { ...a, status: "approved", linkedArtistId: created.artistId } : a
      )) ?? null);
      toast({ title: "Artist draft created", description: "The application is now linked to a real artist profile." });
    } catch (err: any) {
      toast({ title: "Could not create draft", description: err?.message || "Please create the artist manually.", variant: "destructive" });
    } finally {
      setWorkingId(null);
    }
  }

  const filtered = apps?.filter((a) => filter === "all" || a.status === filter) ?? [];
  const counts = {
    all: apps?.length ?? 0,
    pending: apps?.filter((a) => a.status === "pending").length ?? 0,
    approved: apps?.filter((a) => a.status === "approved").length ?? 0,
    rejected: apps?.filter((a) => a.status === "rejected").length ?? 0,
  };

  return (
    <AdminLayout>
      <div className="p-4 sm:p-8 max-w-5xl mx-auto w-full">
        <div className="mb-8">
          <h1 className="text-3xl font-display font-bold text-white">Artist Applications</h1>
          <p className="text-muted-foreground mt-1">Review applications, create draft profiles, and finish login linking.</p>
        </div>

        <div className="flex gap-2 mb-6">
          {(["all", "pending", "approved", "rejected"] as const).map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`px-4 py-1.5 rounded-lg text-sm font-medium transition-all capitalize border ${
                filter === f
                  ? "bg-primary/10 text-primary border-primary/30"
                  : "border-white/10 text-muted-foreground hover:text-white hover:bg-white/5"
              }`}
            >
              {f} <span className="ml-1 opacity-60">{counts[f]}</span>
            </button>
          ))}
        </div>

        {loading && (
          <div className="flex items-center justify-center py-20">
            <div className="w-7 h-7 border-2 border-primary border-t-transparent rounded-full animate-spin" />
          </div>
        )}

        {!loading && filtered.length === 0 && (
          <div className="text-center py-20 text-muted-foreground">
            No {filter === "all" ? "" : filter} applications yet.
          </div>
        )}

        <div className="space-y-3">
          {filtered.map((app) => {
            const claimedArtistName = app.claimedArtistId ? artistNames.get(app.claimedArtistId) : null;
            const linkedArtistName = app.linkedArtistId ? artistNames.get(app.linkedArtistId) : null;
            const loginArtistId = app.applicationType === "claim_profile" ? app.claimedArtistId : app.linkedArtistId;
            const loginHref = loginArtistId
              ? `/admin/users?artistId=${loginArtistId}&username=${encodeURIComponent(makeSuggestedUsername(app.email))}`
              : null;

            return (
              <div key={app.id} className="bg-[#0f0f1a] border border-white/10 rounded-2xl overflow-hidden">
                <div className="flex items-center gap-4 p-5">
                  <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center text-primary font-bold text-lg flex-shrink-0">
                    {app.name[0].toUpperCase()}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-white font-semibold">{app.name}</span>
                      <span className={`text-xs px-2 py-0.5 rounded-full border font-medium capitalize ${statusColors[app.status]}`}>
                        {app.status}
                      </span>
                      <span className={`text-xs px-2 py-0.5 rounded-full border font-medium ${typeColors[app.applicationType]}`}>
                        {app.applicationType === "claim_profile" ? "Claim Request" : "New Artist"}
                      </span>
                    </div>
                    <div className="flex items-center gap-3 mt-0.5 flex-wrap">
                      <span className="text-muted-foreground text-sm">{app.specialty}</span>
                      {app.location && (
                        <span className="text-muted-foreground text-sm flex items-center gap-1">
                          <MapPin className="w-3 h-3" />{app.location}
                        </span>
                      )}
                      <span className="text-muted-foreground text-xs flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        {format(new Date(app.createdAt), "MMM d, yyyy")}
                      </span>
                    </div>
                    {(claimedArtistName || linkedArtistName) && (
                      <div className="mt-2 flex flex-wrap gap-4 text-xs text-muted-foreground">
                        {claimedArtistName && (
                          <span className="inline-flex items-center gap-1 text-violet-300">
                            <Link2 className="w-3 h-3" />
                            Claiming: {claimedArtistName}
                          </span>
                        )}
                        {linkedArtistName && (
                          <span className="inline-flex items-center gap-1 text-emerald-300">
                            <BadgeCheck className="w-3 h-3" />
                            Draft linked: {linkedArtistName}
                          </span>
                        )}
                      </div>
                    )}
                  </div>
                  <div className="flex items-center gap-2 flex-shrink-0">
                    {app.applicationType === "new_artist" && !app.linkedArtistId && app.status !== "rejected" && (
                      <Button
                        size="sm"
                        onClick={() => handleCreateDraft(app.id)}
                        className="bg-primary/10 hover:bg-primary/20 text-primary border border-primary/20 h-8"
                        variant="ghost"
                        disabled={workingId === app.id}
                      >
                        <PlusCircle className="w-4 h-4 mr-1" /> Approve & Create Profile
                      </Button>
                    )}

                    {app.applicationType === "claim_profile" && app.status === "pending" && (
                      <>
                        <Button
                          size="sm"
                          onClick={() => handleStatus(app.id, "approved")}
                          className="bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 border border-emerald-500/20 h-8"
                          variant="ghost"
                          disabled={workingId === app.id}
                        >
                          <CheckCircle className="w-4 h-4 mr-1" /> Approve
                        </Button>
                        <Button
                          size="sm"
                          onClick={() => handleStatus(app.id, "rejected")}
                          className="bg-red-500/10 hover:bg-red-500/20 text-red-400 border border-red-500/20 h-8"
                          variant="ghost"
                          disabled={workingId === app.id}
                        >
                          <XCircle className="w-4 h-4 mr-1" /> Reject
                        </Button>
                      </>
                    )}

                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => handleDelete(app.id)}
                      className="text-muted-foreground hover:text-red-400 h-8 w-8 p-0"
                      disabled={workingId === app.id}
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => setExpanded(expanded === app.id ? null : app.id)}
                      className="text-muted-foreground hover:text-white h-8 w-8 p-0"
                    >
                      {expanded === app.id ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                    </Button>
                  </div>
                </div>

                {expanded === app.id && (
                  <div className="border-t border-white/10 p-5 space-y-4">
                    <div className="flex gap-4 flex-wrap">
                      <a href={`mailto:${app.email}`} className="flex items-center gap-1.5 text-sm text-primary hover:underline">
                        <Mail className="w-4 h-4" />{app.email}
                      </a>
                      {app.instagram && (
                        <a
                          href={`https://instagram.com/${app.instagram.replace("@", "")}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center gap-1.5 text-sm text-pink-400 hover:underline"
                        >
                          <Instagram className="w-4 h-4" />{app.instagram}
                        </a>
                      )}
                    </div>

                    <div>
                      <p className="text-xs text-muted-foreground uppercase tracking-wider mb-1.5">
                        {app.applicationType === "claim_profile" ? "Claim Review Context" : "Bio"}
                      </p>
                      <p className="text-sm text-white/80 leading-relaxed">{app.bio}</p>
                    </div>

                    {app.message && (
                      <div>
                        <p className="text-xs text-muted-foreground uppercase tracking-wider mb-1.5">Message</p>
                        <p className="text-sm text-white/80 leading-relaxed">{app.message}</p>
                      </div>
                    )}

                    {loginHref && app.status === "approved" && (
                      <div className="rounded-xl border border-primary/20 bg-primary/5 p-4">
                        <p className="text-sm text-white font-semibold mb-1">Next admin step</p>
                        <p className="text-sm text-muted-foreground mb-3">
                          Create the login account and link it to the {app.applicationType === "claim_profile" ? "claimed" : "draft"} artist profile.
                        </p>
                        <Button asChild size="sm" className="bg-primary hover:bg-primary/90 text-white">
                          <a href={loginHref}>
                            <UserRoundCheck className="w-4 h-4 mr-1" />
                            Open User Account Setup
                          </a>
                        </Button>
                      </div>
                    )}

                    {app.applicationType === "claim_profile" && app.status !== "pending" && (
                      <Button
                        size="sm"
                        variant="outline"
                        className="border-white/10 text-muted-foreground hover:text-white h-8"
                        onClick={() => handleStatus(app.id, app.status === "approved" ? "rejected" : "approved")}
                        disabled={workingId === app.id}
                      >
                        Change to {app.status === "approved" ? "Rejected" : "Approved"}
                      </Button>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </AdminLayout>
  );
}
