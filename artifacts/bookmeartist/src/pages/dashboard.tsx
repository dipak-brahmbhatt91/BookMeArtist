import { useEffect, useState, type ComponentType } from "react";
import {
  getGetArtistQueryKey,
  getListArtistsQueryKey,
  getListBookingsQueryKey,
  useGetArtist,
  useListBookings,
  useListCategories,
  useUpdateArtist,
  useUpdateBookingStatus,
  type Booking,
  type ServicePackage,
} from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { formatPrice } from "@/lib/currency";
import { format } from "date-fns";
import {
  Activity,
  CalendarDays,
  CheckCircle2,
  CircleDashed,
  Clock,
  DollarSign,
  ExternalLink,
  Image as ImageIcon,
  Link2,
  MapPin,
  Package,
  PencilLine,
  Plus,
  Save,
  Sparkles,
  ToggleLeft,
  ToggleRight,
  Trash2,
  User,
  X,
  XCircle,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/auth-context";
import { PageSeo } from "@/components/page-seo";

type ProfileFormState = {
  name: string;
  bio: string;
  categoryId: string;
  location: string;
  basePrice: string;
  availability: "available" | "busy" | "unavailable";
  profileImage: string;
  portfolioImages: string[];
  tagsText: string;
  socialLinks: {
    instagram: string;
    website: string;
    youtube: string;
    twitter: string;
    tiktok: string;
  };
  packages: ServicePackage[];
};

const EMPTY_SOCIAL_LINKS: ProfileFormState["socialLinks"] = {
  instagram: "",
  website: "",
  youtube: "",
  twitter: "",
  tiktok: "",
};

function buildProfileForm(artist: NonNullable<ReturnType<typeof useGetArtist>["data"]>): ProfileFormState {
  return {
    name: artist.name || "",
    bio: artist.bio || "",
    categoryId: String(artist.categoryId || ""),
    location: artist.location || "",
    basePrice: String(artist.basePrice || ""),
    availability: artist.availability,
    profileImage: artist.profileImage || "",
    portfolioImages: artist.portfolioImages || [],
    tagsText: (artist.tags || []).join(", "),
    socialLinks: {
      ...EMPTY_SOCIAL_LINKS,
      ...(artist.socialLinks || {}),
    },
    packages: (artist.packages || []).map((pkg) => ({
      ...pkg,
      price: Number(pkg.price) || 0,
    })),
  };
}

function DashboardCard({
  icon: Icon,
  title,
  value,
  tone,
}: {
  icon: ComponentType<{ className?: string }>;
  title: string;
  value: string | number;
  tone: string;
}) {
  return (
    <div className="bg-card rounded-3xl p-6 border border-border shadow-sm relative overflow-hidden">
      <div className={`absolute right-0 top-0 w-24 h-24 rounded-full blur-xl -mr-8 -mt-8 ${tone}`} />
      <div className="w-12 h-12 rounded-2xl bg-white/5 flex items-center justify-center mb-4">
        <Icon className="w-6 h-6 text-primary" />
      </div>
      <h3 className="text-muted-foreground font-medium mb-1">{title}</h3>
      <p className="text-4xl font-display font-bold text-foreground">{value}</p>
    </div>
  );
}

export default function Dashboard() {
  const { user } = useAuth();
  const artistId = user?.artistId;
  const publicProfileHref = artistId ? `/artists/${artistId}` : "/artists";

  const { data: bookings, isLoading: bookingsLoading } = useListBookings(
    artistId ? { artistId } : undefined
  );
  const { data: artist, isLoading: artistLoading } = useGetArtist(artistId ?? 0, {
    enabled: !!artistId,
  });
  const { data: categories } = useListCategories();
  const updateStatus = useUpdateBookingStatus();
  const updateArtist = useUpdateArtist();
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const [activeTab, setActiveTab] = useState("overview");
  const [bookingFilter, setBookingFilter] = useState<"all" | Booking["status"]>("all");
  const [newPortfolioUrl, setNewPortfolioUrl] = useState("");
  const [profileForm, setProfileForm] = useState<ProfileFormState | null>(null);

  useEffect(() => {
    if (artist) {
      setProfileForm(buildProfileForm(artist));
    }
  }, [artist]);

  const handleUpdateStatus = async (id: number, status: "accepted" | "declined" | "completed") => {
    try {
      await updateStatus.mutateAsync({ id, data: { status } });
      toast({ title: "Status Updated", description: `Booking has been marked as ${status}.` });
      queryClient.invalidateQueries({ queryKey: getListBookingsQueryKey() });
    } catch {
      toast({ variant: "destructive", title: "Update Failed", description: "Could not update the booking status." });
    }
  };

  const handleToggleAvailability = async () => {
    if (!artist || !artistId) return;
    const newAvailability = artist.availability === "available" ? "unavailable" : "available";
    try {
      await updateArtist.mutateAsync({
        id: artistId,
        data: { availability: newAvailability },
      });
      queryClient.invalidateQueries({ queryKey: getGetArtistQueryKey(artistId) });
      queryClient.invalidateQueries({ queryKey: getListArtistsQueryKey() });
      toast({ title: "Availability Updated", description: `You are now marked as ${newAvailability}.` });
    } catch {
      toast({ variant: "destructive", title: "Failed", description: "Could not update availability." });
    }
  };

  const handleSaveProfile = async () => {
    if (!artistId || !profileForm) return;
    if (!profileForm.categoryId) {
      toast({ variant: "destructive", title: "Category Required", description: "Choose your artist category before saving." });
      return;
    }

    try {
      const socialLinks = Object.fromEntries(
        Object.entries(profileForm.socialLinks).filter(([, value]) => value.trim())
      );

      const updatedArtist = await updateArtist.mutateAsync({
        id: artistId,
        data: {
          name: profileForm.name.trim(),
          bio: profileForm.bio.trim(),
          categoryId: Number(profileForm.categoryId),
          location: profileForm.location.trim(),
          basePrice: profileForm.basePrice,
          availability: profileForm.availability,
          profileImage: profileForm.profileImage.trim(),
          portfolioImages: profileForm.portfolioImages.filter((value): value is string => Boolean(value.trim())),
          tags: profileForm.tagsText.split(",").map((tag) => tag.trim()).filter(Boolean),
          socialLinks,
          packages: profileForm.packages.map((pkg) => ({
            ...pkg,
            name: pkg.name.trim(),
            description: pkg.description.trim(),
            duration: pkg.duration.trim(),
            price: Number(pkg.price) || 0,
          })),
        } as any,
      });

      setProfileForm(buildProfileForm(updatedArtist));
      queryClient.invalidateQueries({ queryKey: getGetArtistQueryKey(artistId) });
      queryClient.invalidateQueries({ queryKey: getListArtistsQueryKey() });
      toast({ title: "Profile Updated", description: "Your artist profile is now live with the latest changes." });
    } catch {
      toast({ variant: "destructive", title: "Save Failed", description: "Could not save your profile changes." });
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "pending":
        return <Badge variant="outline" className="bg-warning/10 text-warning border-warning/30"><Clock className="w-3 h-3 mr-1" /> Pending</Badge>;
      case "accepted":
        return <Badge variant="outline" className="bg-success/10 text-success border-success/30"><CheckCircle2 className="w-3 h-3 mr-1" /> Accepted</Badge>;
      case "declined":
        return <Badge variant="outline" className="bg-destructive/10 text-destructive border-destructive/30"><XCircle className="w-3 h-3 mr-1" /> Declined</Badge>;
      case "completed":
        return <Badge variant="outline" className="bg-blue-500/10 text-blue-500 border-blue-500/30"><CheckCircle2 className="w-3 h-3 mr-1" /> Completed</Badge>;
      default:
        return <Badge>{status}</Badge>;
    }
  };

  const setProfileField = (field: keyof ProfileFormState, value: ProfileFormState[keyof ProfileFormState]) => {
    setProfileForm((current) => (current ? { ...current, [field]: value } : current));
  };

  const setSocialField = (field: keyof ProfileFormState["socialLinks"], value: string) => {
    setProfileForm((current) =>
      current
        ? {
            ...current,
            socialLinks: {
              ...current.socialLinks,
              [field]: value,
            },
          }
        : current
    );
  };

  const addPortfolioImage = () => {
    const trimmedUrl = newPortfolioUrl.trim();
    if (!trimmedUrl) return;

    setProfileForm((current) =>
      current
        ? {
            ...current,
            portfolioImages: [...current.portfolioImages, trimmedUrl],
          }
        : current
    );
    setNewPortfolioUrl("");
  };

  const removePortfolioImage = (index: number) => {
    setProfileForm((current) =>
      current
        ? {
            ...current,
            portfolioImages: current.portfolioImages.filter((_, currentIndex) => currentIndex !== index),
          }
        : current
    );
  };

  const addPackage = () => {
    setProfileForm((current) =>
      current
        ? {
            ...current,
            packages: [...current.packages, { name: "", description: "", price: 0, duration: "" }],
          }
        : current
    );
  };

  const updatePackage = (index: number, field: keyof ServicePackage, value: string | number) => {
    setProfileForm((current) => {
      if (!current) return current;

      const nextPackages = [...current.packages];
      nextPackages[index] = {
        ...nextPackages[index],
        [field]: field === "price" ? Number(value) || 0 : String(value),
      };

      return {
        ...current,
        packages: nextPackages,
      };
    });
  };

  const removePackage = (index: number) => {
    setProfileForm((current) =>
      current
        ? {
            ...current,
            packages: current.packages.filter((_, currentIndex) => currentIndex !== index),
          }
        : current
    );
  };

  if (!artistId) {
    return (
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12 w-full">
        <div className="bg-card border border-border rounded-3xl p-10 text-center">
          <User className="w-12 h-12 mx-auto mb-4 text-primary" />
          <h1 className="text-2xl font-display font-bold mb-2">No Artist Profile Linked</h1>
          <p className="text-muted-foreground">
            Your account does not have an artist profile attached yet. Ask an admin to link your login to your artist record.
          </p>
        </div>
      </div>
    );
  }

  const pendingCount = bookings?.filter((b) => b.status === "pending").length || 0;
  const acceptedCount = bookings?.filter((b) => b.status === "accepted").length || 0;
  const completedCount = bookings?.filter((b) => b.status === "completed").length || 0;
  const totalEarnings = bookings
    ?.filter((b) => b.status === "completed" || b.status === "accepted")
    .reduce((sum, b) => sum + b.budget, 0) || 0;

  const filteredBookings = (bookings || []).filter((booking) => bookingFilter === "all" || booking.status === bookingFilter);
  const upcomingBookings = [...(bookings || [])]
    .filter((booking) => booking.status === "accepted" || booking.status === "pending")
    .sort((a, b) => new Date(a.eventDate).getTime() - new Date(b.eventDate).getTime())
    .slice(0, 4);

  const completionChecks = artist ? [
    { label: "Profile photo uploaded", complete: Boolean(artist.profileImage) },
    { label: "Bio is detailed", complete: artist.bio.trim().length >= 80 },
    { label: "Portfolio has at least 3 images", complete: (artist.portfolioImages?.length || 0) >= 3 },
    { label: "At least 3 specialties added", complete: (artist.tags?.length || 0) >= 3 },
    { label: "At least 1 service package listed", complete: (artist.packages?.length || 0) >= 1 },
    { label: "At least 1 social/contact link added", complete: Object.values(artist.socialLinks || {}).some(Boolean) },
  ] : [];
  const completionPercent = completionChecks.length > 0
    ? Math.round((completionChecks.filter((item) => item.complete).length / completionChecks.length) * 100)
    : 0;
  const activeAvailability = profileForm?.availability ?? artist?.availability ?? "available";
  const profileCategoryName = profileForm?.categoryId
    ? categories?.find((category) => category.id === Number(profileForm.categoryId))?.name ?? artist?.categoryName ?? "Select category"
    : artist?.categoryName ?? "Select category";
  const profileLinkCount = profileForm
    ? Object.values(profileForm.socialLinks).filter(Boolean).length
    : 0;

  return (
    <>
      <PageSeo
        title="Artist Workspace"
        description="Manage your artist profile, pricing, availability, and booking requests from one workspace."
        canonical="/dashboard"
        noindex={true}
      />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12 w-full">
      <div className="mb-8 sm:mb-10 flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-display font-bold text-foreground">Artist Workspace</h1>
          <p className="text-muted-foreground mt-1">
            Welcome back, <span className="text-white font-semibold">{user?.artistName || user?.username}</span>
          </p>
        </div>

        <div className="flex flex-wrap gap-3">
          <a href={publicProfileHref} target="_blank" rel="noreferrer">
            <Button variant="outline" className="gap-2 border-white/15">
              <ExternalLink className="w-4 h-4" />
              View Public Profile
            </Button>
          </a>
          {artist && (
            <button
              onClick={handleToggleAvailability}
              disabled={updateArtist.isPending}
              className={`flex items-center gap-3 px-4 py-2.5 rounded-xl border font-semibold text-sm transition-all ${
                artist.availability === "available"
                  ? "bg-emerald-500/10 border-emerald-500/30 text-emerald-400 hover:bg-emerald-500/20"
                  : "bg-red-500/10 border-red-500/30 text-red-400 hover:bg-red-500/20"
              }`}
            >
              {artist.availability === "available" ? (
                <><ToggleRight className="w-5 h-5" /> Available for Bookings</>
              ) : (
                <><ToggleLeft className="w-5 h-5" /> Unavailable</>
              )}
            </button>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6 mb-10">
        <DashboardCard icon={Activity} title="Pending Requests" value={pendingCount} tone="bg-warning/5" />
        <DashboardCard icon={CalendarDays} title="Confirmed Events" value={acceptedCount} tone="bg-success/5" />
        <DashboardCard icon={CheckCircle2} title="Completed Events" value={completedCount} tone="bg-blue-500/5" />
        <DashboardCard icon={DollarSign} title="Projected Earnings" value={formatPrice(totalEarnings)} tone="bg-primary/5" />
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <div className="overflow-x-auto mb-8 -mx-4 px-4 sm:mx-0 sm:px-0">
          <TabsList className="h-auto p-1.5 rounded-2xl bg-card border border-border inline-flex min-w-full sm:w-auto">
            <TabsTrigger value="overview" className="rounded-xl px-4 sm:px-5 py-2.5 gap-2 flex-1 sm:flex-initial">
              <Sparkles className="w-4 h-4" />
              <span className="hidden xs:inline">Overview</span>
              <span className="xs:hidden">Home</span>
            </TabsTrigger>
            <TabsTrigger value="bookings" className="rounded-xl px-4 sm:px-5 py-2.5 gap-2 flex-1 sm:flex-initial">
              <CalendarDays className="w-4 h-4" />
              Bookings
            </TabsTrigger>
            <TabsTrigger value="profile" className="rounded-xl px-4 sm:px-5 py-2.5 gap-2 flex-1 sm:flex-initial">
              <PencilLine className="w-4 h-4" />
              Profile
            </TabsTrigger>
          </TabsList>
        </div>

        <TabsContent value="overview" className="mt-0">
          <div className="grid grid-cols-1 xl:grid-cols-[1.2fr_0.8fr] gap-6">
            <div className="bg-card rounded-3xl border border-border p-6 shadow-sm">
              <div className="flex items-start justify-between gap-4 mb-6">
                <div>
                  <h2 className="text-xl font-bold font-display">Profile Strength</h2>
                  <p className="text-sm text-muted-foreground mt-1">Artists with complete profiles typically convert interest into bookings faster.</p>
                </div>
                <Badge variant="outline" className="border-primary/30 text-primary bg-primary/10">
                  {completionPercent}% complete
                </Badge>
              </div>

              {artistLoading ? (
                <Skeleton className="h-32 w-full" />
              ) : (
                <>
                  <div className="h-3 rounded-full bg-muted overflow-hidden mb-6">
                    <div className="h-full bg-primary rounded-full transition-all" style={{ width: `${completionPercent}%` }} />
                  </div>
                  <div className="grid sm:grid-cols-2 gap-3">
                    {completionChecks.map((item) => (
                      <div key={item.label} className="flex items-center gap-3 rounded-2xl border border-border bg-muted/30 px-4 py-3">
                        {item.complete ? (
                          <CheckCircle2 className="w-4 h-4 text-success shrink-0" />
                        ) : (
                          <CircleDashed className="w-4 h-4 text-muted-foreground shrink-0" />
                        )}
                        <span className={item.complete ? "text-foreground" : "text-muted-foreground"}>{item.label}</span>
                      </div>
                    ))}
                  </div>
                  <div className="mt-6">
                    <Button onClick={() => setActiveTab("profile")} className="gap-2">
                      <PencilLine className="w-4 h-4" />
                      Improve My Profile
                    </Button>
                  </div>
                </>
              )}
            </div>

            <div className="space-y-6">
              <div className="bg-card rounded-3xl border border-border p-6 shadow-sm">
                <h2 className="text-xl font-bold font-display mb-4">Upcoming Activity</h2>
                <div className="space-y-3">
                  {bookingsLoading ? (
                    <>
                      <Skeleton className="h-16 w-full" />
                      <Skeleton className="h-16 w-full" />
                    </>
                  ) : upcomingBookings.length > 0 ? (
                    upcomingBookings.map((booking) => (
                      <div key={booking.id} className="rounded-2xl border border-border bg-muted/30 p-4">
                        <div className="flex items-center justify-between gap-3">
                          <div>
                            <p className="font-semibold text-foreground">{booking.clientName}</p>
                            <p className="text-sm text-muted-foreground">{booking.eventType} in {booking.location}</p>
                          </div>
                          {getStatusBadge(booking.status)}
                        </div>
                        <p className="text-sm text-muted-foreground mt-3">{format(new Date(booking.eventDate), "MMM d, yyyy")}</p>
                      </div>
                    ))
                  ) : (
                    <div className="rounded-2xl border border-dashed border-border p-6 text-center text-muted-foreground">
                      No upcoming requests yet.
                    </div>
                  )}
                </div>
              </div>

              <div className="bg-card rounded-3xl border border-border p-6 shadow-sm">
                <h2 className="text-xl font-bold font-display mb-4">Quick Actions</h2>
                <div className="grid gap-3">
                  <Button variant="outline" className="justify-between border-white/10" onClick={() => setActiveTab("bookings")}>
                    Review booking requests
                    <Link2 className="w-4 h-4" />
                  </Button>
                  <Button variant="outline" className="justify-between border-white/10" onClick={() => setActiveTab("profile")}>
                    Update pricing and portfolio
                    <Package className="w-4 h-4" />
                  </Button>
                  <a href={publicProfileHref} target="_blank" rel="noreferrer">
                    <Button variant="outline" className="justify-between border-white/10 w-full">
                      Open public artist page
                      <ExternalLink className="w-4 h-4" />
                    </Button>
                  </a>
                </div>
              </div>
            </div>
          </div>
        </TabsContent>

        <TabsContent value="bookings" className="mt-0">
          <div className="bg-card rounded-3xl border border-border p-6 shadow-sm">
            <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 mb-6">
              <div>
                <h2 className="text-xl font-bold font-display">Booking Pipeline</h2>
                <p className="text-sm text-muted-foreground mt-1">
                  Review new leads quickly, accept strong-fit work, and move completed jobs through the pipeline.
                </p>
              </div>

              <div className="flex flex-wrap gap-2">
                {(["all", "pending", "accepted", "completed", "declined"] as const).map((status) => (
                  <Button
                    key={status}
                    variant={bookingFilter === status ? "default" : "outline"}
                    size="sm"
                    className="capitalize"
                    onClick={() => setBookingFilter(status)}
                  >
                    {status}
                  </Button>
                ))}
              </div>
            </div>

            {bookingsLoading ? (
              <div className="grid gap-4">
                <Skeleton className="h-44 w-full" />
                <Skeleton className="h-44 w-full" />
              </div>
            ) : filteredBookings.length > 0 ? (
              <div className="grid gap-4">
                {filteredBookings.map((booking) => (
                  <div key={booking.id} className="rounded-3xl border border-border bg-muted/20 p-5">
                    <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-5">
                      <div className="space-y-4 flex-1">
                        <div className="flex flex-wrap items-center gap-3">
                          <h3 className="text-lg font-semibold text-foreground">{booking.eventType}</h3>
                          {getStatusBadge(booking.status)}
                        </div>

                        <div className="grid sm:grid-cols-2 xl:grid-cols-4 gap-4 text-sm">
                          <div className="rounded-2xl border border-border bg-background/40 px-4 py-3">
                            <p className="text-muted-foreground mb-1">Client</p>
                            <p className="font-medium text-foreground">{booking.clientName}</p>
                            <p className="text-muted-foreground">{booking.clientEmail}</p>
                          </div>
                          <div className="rounded-2xl border border-border bg-background/40 px-4 py-3">
                            <p className="text-muted-foreground mb-1">Event Date</p>
                            <p className="font-medium text-foreground">{format(new Date(booking.eventDate), "MMM d, yyyy")}</p>
                          </div>
                          <div className="rounded-2xl border border-border bg-background/40 px-4 py-3">
                            <p className="text-muted-foreground mb-1">Location</p>
                            <p className="font-medium text-foreground">{booking.location}</p>
                          </div>
                          <div className="rounded-2xl border border-border bg-background/40 px-4 py-3">
                            <p className="text-muted-foreground mb-1">Budget</p>
                            <p className="font-medium text-foreground">{formatPrice(booking.budget)}</p>
                          </div>
                        </div>

                        {booking.packageName && (
                          <div className="rounded-2xl border border-border bg-background/40 px-4 py-3 text-sm">
                            <p className="text-muted-foreground mb-1">Requested Package</p>
                            <p className="font-medium text-foreground">{booking.packageName}</p>
                          </div>
                        )}

                        <div className="rounded-2xl border border-border bg-background/40 px-4 py-3 text-sm">
                          <p className="text-muted-foreground mb-1">Project Brief</p>
                          <p className="text-foreground leading-relaxed whitespace-pre-line">{booking.brief}</p>
                        </div>
                      </div>

                      <div className="lg:w-56 space-y-3">
                        {booking.status === "pending" && (
                          <>
                            <Button className="w-full" onClick={() => handleUpdateStatus(booking.id, "accepted")} disabled={updateStatus.isPending}>
                              Accept Request
                            </Button>
                            <Button variant="outline" className="w-full" onClick={() => handleUpdateStatus(booking.id, "declined")} disabled={updateStatus.isPending}>
                              Decline
                            </Button>
                          </>
                        )}

                        {booking.status === "accepted" && (
                          <Button className="w-full" onClick={() => handleUpdateStatus(booking.id, "completed")} disabled={updateStatus.isPending}>
                            Mark Completed
                          </Button>
                        )}

                        <div className="rounded-2xl border border-dashed border-border px-4 py-3 text-sm text-muted-foreground">
                          Keep statuses current so admins and clients can trust your availability and response quality.
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="rounded-3xl border border-dashed border-border p-10 text-center">
                <CalendarDays className="w-12 h-12 mx-auto mb-4 text-muted-foreground/40" />
                <h3 className="text-lg font-semibold text-foreground mb-2">No bookings in this view</h3>
                <p className="text-muted-foreground">New requests will appear here as clients submit them.</p>
              </div>
            )}
          </div>
        </TabsContent>

        <TabsContent value="profile" className="mt-0">
          {artistLoading || !profileForm ? (
            <div className="grid gap-6 lg:grid-cols-[0.9fr_1.1fr]">
              <Skeleton className="h-80 w-full rounded-3xl" />
              <Skeleton className="h-[48rem] w-full rounded-3xl" />
            </div>
          ) : (
            <div className="grid gap-6 lg:grid-cols-[0.9fr_1.1fr]">
              <div className="space-y-6">
                <div className="bg-card rounded-3xl border border-border p-6 shadow-sm">
                  <div className="flex items-center gap-4 mb-6">
                    <div className="w-20 h-20 rounded-3xl overflow-hidden bg-muted border border-border shrink-0">
                      {profileForm.profileImage ? (
                        <img src={profileForm.profileImage} alt={profileForm.name || "Artist profile"} className="w-full h-full object-cover" />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center">
                          <ImageIcon className="w-8 h-8 text-muted-foreground" />
                        </div>
                      )}
                    </div>
                    <div>
                      <h2 className="text-xl font-bold font-display text-foreground">{profileForm.name || "Your artist profile"}</h2>
                      <p className="text-muted-foreground">{profileCategoryName}</p>
                      <div className="flex items-center gap-2 text-sm text-muted-foreground mt-2">
                        <MapPin className="w-4 h-4" />
                        {profileForm.location || "Add your service location"}
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3 text-sm">
                    <div className="rounded-2xl border border-border bg-muted/20 px-4 py-3">
                      <p className="text-muted-foreground mb-1">Base Price</p>
                      <p className="font-semibold text-foreground">{formatPrice(Number(profileForm.basePrice) || 0)}</p>
                    </div>
                    <div className="rounded-2xl border border-border bg-muted/20 px-4 py-3">
                      <p className="text-muted-foreground mb-1">Availability</p>
                      <p className="font-semibold text-foreground capitalize">{activeAvailability}</p>
                    </div>
                    <div className="rounded-2xl border border-border bg-muted/20 px-4 py-3">
                      <p className="text-muted-foreground mb-1">Portfolio Items</p>
                      <p className="font-semibold text-foreground">{profileForm.portfolioImages.length}</p>
                    </div>
                    <div className="rounded-2xl border border-border bg-muted/20 px-4 py-3">
                      <p className="text-muted-foreground mb-1">Contact Links</p>
                      <p className="font-semibold text-foreground">{profileLinkCount}</p>
                    </div>
                  </div>
                </div>

                <div className="bg-card rounded-3xl border border-border p-6 shadow-sm">
                  <div className="flex items-start justify-between gap-4 mb-5">
                    <div>
                      <h3 className="text-lg font-semibold text-foreground">Public Profile Checklist</h3>
                      <p className="text-sm text-muted-foreground mt-1">Complete these to make the page feel trustworthy and bookable.</p>
                    </div>
                    <Badge variant="outline" className="border-primary/30 text-primary bg-primary/10">
                      {completionPercent}%
                    </Badge>
                  </div>

                  <div className="space-y-3">
                    {completionChecks.map((item) => (
                      <div key={item.label} className="flex items-center gap-3 rounded-2xl border border-border bg-muted/20 px-4 py-3 text-sm">
                        {item.complete ? (
                          <CheckCircle2 className="w-4 h-4 text-success shrink-0" />
                        ) : (
                          <CircleDashed className="w-4 h-4 text-muted-foreground shrink-0" />
                        )}
                        <span className={item.complete ? "text-foreground" : "text-muted-foreground"}>{item.label}</span>
                      </div>
                    ))}
                  </div>

                  <div className="mt-5">
                    <a href={publicProfileHref} target="_blank" rel="noreferrer">
                      <Button variant="outline" className="w-full gap-2">
                        <ExternalLink className="w-4 h-4" />
                        Preview Public Profile
                      </Button>
                    </a>
                  </div>
                </div>
              </div>

              <div className="bg-card rounded-3xl border border-border p-6 shadow-sm">
                <div className="flex items-start justify-between gap-4 mb-6">
                  <div>
                    <h2 className="text-xl font-bold font-display">Edit Public Profile</h2>
                    <p className="text-sm text-muted-foreground mt-1">
                      Keep your positioning, media, and packages current so prospects can book with confidence.
                    </p>
                  </div>
                  <Button onClick={handleSaveProfile} disabled={updateArtist.isPending} className="gap-2 shrink-0">
                    <Save className="w-4 h-4" />
                    {updateArtist.isPending ? "Saving..." : "Save Changes"}
                  </Button>
                </div>

                <div className="space-y-8">
                  <section className="space-y-4">
                    <div className="grid md:grid-cols-2 gap-4">
                      <div>
                        <label className="text-sm font-medium text-foreground mb-2 block">Artist Name</label>
                        <Input value={profileForm.name} onChange={(event) => setProfileField("name", event.target.value)} />
                      </div>
                      <div>
                        <label className="text-sm font-medium text-foreground mb-2 block">Category</label>
                        <Select value={profileForm.categoryId} onValueChange={(value) => setProfileField("categoryId", value)}>
                          <SelectTrigger>
                            <SelectValue placeholder="Select a category" />
                          </SelectTrigger>
                          <SelectContent>
                            {categories?.map((category) => (
                              <SelectItem key={category.id} value={String(category.id)}>
                                {category.name}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    </div>

                    <div className="grid md:grid-cols-2 gap-4">
                      <div>
                        <label className="text-sm font-medium text-foreground mb-2 block">Location</label>
                        <Input value={profileForm.location} onChange={(event) => setProfileField("location", event.target.value)} />
                      </div>
                      <div>
                        <label className="text-sm font-medium text-foreground mb-2 block">Starting Price</label>
                        <Input type="number" min="0" value={profileForm.basePrice} onChange={(event) => setProfileField("basePrice", event.target.value)} />
                      </div>
                    </div>

                    <div>
                      <label className="text-sm font-medium text-foreground mb-2 block">Availability</label>
                      <Select value={profileForm.availability} onValueChange={(value) => setProfileField("availability", value as ProfileFormState["availability"])}>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="available">Available</SelectItem>
                          <SelectItem value="busy">Busy</SelectItem>
                          <SelectItem value="unavailable">Unavailable</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div>
                      <label className="text-sm font-medium text-foreground mb-2 block">Bio</label>
                      <Textarea
                        rows={5}
                        value={profileForm.bio}
                        onChange={(event) => setProfileField("bio", event.target.value)}
                        placeholder="Describe your style, experience, ideal events, and why clients book you."
                      />
                    </div>

                    <div>
                      <label className="text-sm font-medium text-foreground mb-2 block">Specialties</label>
                      <Input
                        value={profileForm.tagsText}
                        onChange={(event) => setProfileField("tagsText", event.target.value)}
                        placeholder="Wedding singer, Bollywood, Corporate events, Live band"
                      />
                      <p className="text-xs text-muted-foreground mt-2">
                        Separate specialties with commas so clients can discover you more easily.
                      </p>
                    </div>
                  </section>

                  <section className="space-y-4">
                    <div>
                      <label className="text-sm font-medium text-foreground mb-2 block">Profile Image URL</label>
                      <Input
                        value={profileForm.profileImage}
                        onChange={(event) => setProfileField("profileImage", event.target.value)}
                        placeholder="https://..."
                      />
                    </div>

                    <div>
                      <label className="text-sm font-medium text-foreground mb-2 block">Portfolio Images</label>
                      <div className="flex flex-col sm:flex-row gap-3">
                        <Input
                          value={newPortfolioUrl}
                          onChange={(event) => setNewPortfolioUrl(event.target.value)}
                          placeholder="Paste an image URL and add it to your portfolio"
                          onKeyDown={(event) => {
                            if (event.key === "Enter") {
                              event.preventDefault();
                              addPortfolioImage();
                            }
                          }}
                        />
                        <Button type="button" variant="outline" onClick={addPortfolioImage} className="gap-2">
                          <Plus className="w-4 h-4" />
                          Add Image
                        </Button>
                      </div>

                      {profileForm.portfolioImages.length > 0 ? (
                        <div className="grid sm:grid-cols-2 xl:grid-cols-3 gap-3 mt-4">
                          {profileForm.portfolioImages.map((imageUrl, index) => (
                            <div key={`${imageUrl}-${index}`} className="relative rounded-2xl overflow-hidden border border-border bg-muted/20 aspect-square">
                              <img src={imageUrl} alt={`Portfolio ${index + 1}`} className="w-full h-full object-cover" />
                              <button
                                type="button"
                                onClick={() => removePortfolioImage(index)}
                                className="absolute top-3 right-3 rounded-full bg-black/70 p-2 text-white transition hover:bg-black"
                                aria-label={`Remove portfolio image ${index + 1}`}
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <div className="mt-4 rounded-2xl border border-dashed border-border p-6 text-sm text-muted-foreground text-center">
                          Add at least three visuals to help clients trust your quality.
                        </div>
                      )}
                    </div>
                  </section>

                  <section className="space-y-4">
                    <h3 className="text-lg font-semibold text-foreground">Social and Contact Links</h3>
                    <div className="grid md:grid-cols-2 gap-4">
                      <div>
                        <label className="text-sm font-medium text-foreground mb-2 block">Instagram</label>
                        <Input value={profileForm.socialLinks.instagram} onChange={(event) => setSocialField("instagram", event.target.value)} placeholder="@yourhandle or URL" />
                      </div>
                      <div>
                        <label className="text-sm font-medium text-foreground mb-2 block">Website</label>
                        <Input value={profileForm.socialLinks.website} onChange={(event) => setSocialField("website", event.target.value)} placeholder="https://..." />
                      </div>
                      <div>
                        <label className="text-sm font-medium text-foreground mb-2 block">YouTube</label>
                        <Input value={profileForm.socialLinks.youtube} onChange={(event) => setSocialField("youtube", event.target.value)} placeholder="Channel URL" />
                      </div>
                      <div>
                        <label className="text-sm font-medium text-foreground mb-2 block">Twitter / X</label>
                        <Input value={profileForm.socialLinks.twitter} onChange={(event) => setSocialField("twitter", event.target.value)} placeholder="@yourhandle" />
                      </div>
                      <div className="md:col-span-2">
                        <label className="text-sm font-medium text-foreground mb-2 block">TikTok</label>
                        <Input value={profileForm.socialLinks.tiktok} onChange={(event) => setSocialField("tiktok", event.target.value)} placeholder="@yourhandle or URL" />
                      </div>
                    </div>
                  </section>

                  <section className="space-y-4">
                    <div className="flex items-center justify-between gap-4">
                      <div>
                        <h3 className="text-lg font-semibold text-foreground">Service Packages</h3>
                        <p className="text-sm text-muted-foreground">Clear tiers help clients self-qualify before they enquire.</p>
                      </div>
                      <Button type="button" variant="outline" onClick={addPackage} className="gap-2">
                        <Plus className="w-4 h-4" />
                        Add Package
                      </Button>
                    </div>

                    {profileForm.packages.length > 0 ? (
                      <div className="space-y-4">
                        {profileForm.packages.map((pkg, index) => (
                          <div key={`${pkg.name}-${index}`} className="rounded-3xl border border-border bg-muted/20 p-5">
                            <div className="flex items-center justify-between gap-3 mb-4">
                              <h4 className="font-semibold text-foreground">Package {index + 1}</h4>
                              <Button type="button" variant="ghost" size="sm" onClick={() => removePackage(index)}>
                                <X className="w-4 h-4 mr-1" />
                                Remove
                              </Button>
                            </div>

                            <div className="grid md:grid-cols-2 gap-4">
                              <div>
                                <label className="text-sm font-medium text-foreground mb-2 block">Name</label>
                                <Input value={pkg.name} onChange={(event) => updatePackage(index, "name", event.target.value)} />
                              </div>
                              <div>
                                <label className="text-sm font-medium text-foreground mb-2 block">Price</label>
                                <Input type="number" min="0" value={pkg.price} onChange={(event) => updatePackage(index, "price", event.target.value)} />
                              </div>
                              <div className="md:col-span-2">
                                <label className="text-sm font-medium text-foreground mb-2 block">Description</label>
                                <Input value={pkg.description} onChange={(event) => updatePackage(index, "description", event.target.value)} />
                              </div>
                              <div className="md:col-span-2">
                                <label className="text-sm font-medium text-foreground mb-2 block">Duration</label>
                                <Input value={pkg.duration} onChange={(event) => updatePackage(index, "duration", event.target.value)} placeholder="2 hours, Half day, Full event" />
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="rounded-2xl border border-dashed border-border p-6 text-center text-sm text-muted-foreground">
                        Add at least one package so clients can compare options and budgets.
                      </div>
                    )}
                  </section>
                </div>
              </div>
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
    </>
  );
}
