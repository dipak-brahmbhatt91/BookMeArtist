import { AdminLayout } from "@/components/admin-layout";
import { CURRENCY, formatPrice } from "@/lib/currency";
import { useState } from "react";
import { 
  useListArtists, 
  useCreateArtist, 
  useUpdateArtist, 
  useDeleteArtist, 
  getListArtistsQueryKey,
  useListCategories
} from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { 
  Edit2, Trash2, Plus, Users, Image as ImageIcon, Link as LinkIcon, 
  Star, X, ImagePlus, Eye, EyeOff, Package, DollarSign, Globe,
  Instagram, Youtube, Music2, Twitter, ChevronDown, ChevronUp
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";

type SocialLinks = { instagram: string; website: string; youtube: string; twitter: string; tiktok: string };
type PackageItem = { name: string; description: string; price: number; duration: string };

const EMPTY_SOCIAL: SocialLinks = { instagram: "", website: "", youtube: "", twitter: "", tiktok: "" };

const initialFormState = {
  name: "",
  bio: "",
  categoryId: 0,
  location: "",
  profileImage: "",
  portfolioImages: [] as string[],
  basePrice: 100,
  rating: 5.0,
  reviewCount: 0,
  featured: false,
  availability: "available" as "available" | "busy" | "unavailable",
  tagsStr: "",
  socialLinks: EMPTY_SOCIAL,
  packages: [] as PackageItem[],
};

export default function AdminArtists() {
  const { data: artists, isLoading } = useListArtists();
  const { data: categories } = useListCategories();
  
  const createArtist = useCreateArtist();
  const updateArtist = useUpdateArtist();
  const deleteArtist = useDeleteArtist();
  
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const [isOpen, setIsOpen] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [formData, setFormData] = useState(initialFormState);
  const [newPortfolioUrl, setNewPortfolioUrl] = useState("");
  const [previewProfile, setPreviewProfile] = useState(false);

  const set = (field: string, value: any) => setFormData(f => ({ ...f, [field]: value }));
  const setSocial = (field: string, value: string) => 
    setFormData(f => ({ ...f, socialLinks: { ...f.socialLinks, [field]: value } }));

  const handleOpenForm = (artist?: any) => {
    if (artist) {
      setEditingId(artist.id);
      setFormData({
        ...initialFormState,
        ...artist,
        tagsStr: artist.tags ? artist.tags.join(", ") : "",
        socialLinks: { ...EMPTY_SOCIAL, ...(artist.socialLinks || {}) },
        portfolioImages: artist.portfolioImages || [],
        packages: artist.packages || [],
      });
    } else {
      setEditingId(null);
      setFormData(initialFormState);
    }
    setNewPortfolioUrl("");
    setPreviewProfile(false);
    setIsOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const payload = {
        name: formData.name,
        bio: formData.bio,
        categoryId: Number(formData.categoryId),
        location: formData.location,
        profileImage: formData.profileImage,
        portfolioImages: formData.portfolioImages,
        basePrice: String(formData.basePrice),
        rating: String(Number(formData.rating).toFixed(2)),
        reviewCount: Number(formData.reviewCount),
        featured: formData.featured,
        availability: formData.availability,
        tags: formData.tagsStr.split(",").map((t: string) => t.trim()).filter(Boolean),
        socialLinks: formData.socialLinks,
        packages: formData.packages,
      };

      if (editingId) {
        await updateArtist.mutateAsync({ id: editingId, data: payload as any });
        toast({ title: "Artist updated successfully" });
      } else {
        await createArtist.mutateAsync({ data: payload as any });
        toast({ title: "Artist created successfully" });
      }
      queryClient.invalidateQueries({ queryKey: getListArtistsQueryKey() });
      setIsOpen(false);
    } catch {
      toast({ variant: "destructive", title: "Error saving artist" });
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm("Are you sure you want to delete this artist?")) return;
    try {
      await deleteArtist.mutateAsync({ id });
      toast({ title: "Artist deleted" });
      queryClient.invalidateQueries({ queryKey: getListArtistsQueryKey() });
    } catch {
      toast({ variant: "destructive", title: "Error deleting artist" });
    }
  };

  const addPortfolioImage = () => {
    if (!newPortfolioUrl.trim()) return;
    set("portfolioImages", [...formData.portfolioImages, newPortfolioUrl.trim()]);
    setNewPortfolioUrl("");
  };

  const removePortfolioImage = (idx: number) => {
    const imgs = [...formData.portfolioImages];
    imgs.splice(idx, 1);
    set("portfolioImages", imgs);
  };

  const addPackage = () => set("packages", [...formData.packages, { name: "", description: "", price: 100, duration: "1 hour" }]);

  const removePackage = (idx: number) => {
    const pkgs = [...formData.packages];
    pkgs.splice(idx, 1);
    set("packages", pkgs);
  };

  const updatePackage = (idx: number, field: string, value: any) => {
    const pkgs = [...formData.packages];
    (pkgs[idx] as any)[field] = value;
    set("packages", pkgs);
  };

  const SectionHeader = ({ icon: Icon, label }: { icon: any; label: string }) => (
    <h3 className="font-bold text-primary flex items-center gap-2 border-b border-white/10 pb-2 text-sm">
      <Icon className="w-4 h-4" /> {label}
    </h3>
  );

  return (
    <AdminLayout>
      <div className="p-4 sm:p-8 max-w-7xl mx-auto w-full">
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-display font-bold text-white">Artists Directory</h1>
            <p className="text-muted-foreground mt-1">Manage talent profiles, media, and availability</p>
          </div>
          <Button onClick={() => handleOpenForm()} className="bg-primary hover:bg-primary/90 text-white">
            <Plus className="w-4 h-4 mr-2" /> Add Artist
          </Button>
        </div>

        {/* Edit / Create Sheet */}
        <Sheet open={isOpen} onOpenChange={setIsOpen}>
          <SheetContent className="bg-[#0f0f1a] border-l border-white/10 text-white sm:max-w-2xl overflow-y-auto">
            <SheetHeader className="mb-6">
              <SheetTitle className="text-2xl text-white">{editingId ? "Edit Artist" : "New Artist"}</SheetTitle>
            </SheetHeader>

            <form onSubmit={handleSubmit} className="space-y-8 pb-8">

              {/* ── Basic Info ── */}
              <section className="space-y-4">
                <SectionHeader icon={Users} label="Basic Info" />
                <div>
                  <label className="text-xs font-medium text-muted-foreground mb-1 block">Artist Name *</label>
                  <Input value={formData.name} onChange={e => set("name", e.target.value)} required className="bg-background border-white/10" />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-xs font-medium text-muted-foreground mb-1 block">Category *</label>
                    <Select value={formData.categoryId.toString()} onValueChange={v => set("categoryId", parseInt(v))}>
                      <SelectTrigger className="bg-background border-white/10">
                        <SelectValue placeholder="Select…" />
                      </SelectTrigger>
                      <SelectContent>
                        {categories?.map(c => (
                          <SelectItem key={c.id} value={c.id.toString()}>{c.name}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <label className="text-xs font-medium text-muted-foreground mb-1 block">Location *</label>
                    <Input value={formData.location} onChange={e => set("location", e.target.value)} required className="bg-background border-white/10" />
                  </div>
                </div>
                <div>
                  <label className="text-xs font-medium text-muted-foreground mb-1 block">Biography *</label>
                  <Textarea value={formData.bio} onChange={e => set("bio", e.target.value)} required rows={4} className="bg-background border-white/10 resize-none" />
                </div>
              </section>

              {/* ── Details & Pricing ── */}
              <section className="space-y-4">
                <SectionHeader icon={DollarSign} label="Details & Pricing" />
                <div className="grid grid-cols-3 gap-4">
                  <div>
                    <label className="text-xs font-medium text-muted-foreground mb-1 block">Base Price ({CURRENCY.symbol}) *</label>
                    <Input type="number" min={0} value={formData.basePrice} onChange={e => set("basePrice", parseInt(e.target.value))} required className="bg-background border-white/10" />
                  </div>
                  <div>
                    <label className="text-xs font-medium text-muted-foreground mb-1 block">Rating (0–5)</label>
                    <Input type="number" min={0} max={5} step={0.1} value={formData.rating} onChange={e => set("rating", parseFloat(e.target.value))} className="bg-background border-white/10" />
                  </div>
                  <div>
                    <label className="text-xs font-medium text-muted-foreground mb-1 block">Review Count</label>
                    <Input type="number" min={0} value={formData.reviewCount} onChange={e => set("reviewCount", parseInt(e.target.value))} className="bg-background border-white/10" />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-xs font-medium text-muted-foreground mb-1 block">Availability</label>
                    <Select value={formData.availability} onValueChange={v => set("availability", v)}>
                      <SelectTrigger className="bg-background border-white/10">
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
                    <label className="text-xs font-medium text-muted-foreground mb-1 block">Tags (comma separated)</label>
                    <Input value={formData.tagsStr} onChange={e => set("tagsStr", e.target.value)} placeholder="Jazz, Wedding, Soul" className="bg-background border-white/10" />
                  </div>
                </div>
                <div className="flex items-center justify-between p-3 bg-white/5 rounded-xl border border-white/10">
                  <div>
                    <div className="font-medium text-sm">Featured Artist</div>
                    <div className="text-xs text-muted-foreground">Highlighted on the homepage curated section</div>
                  </div>
                  <Switch checked={formData.featured} onCheckedChange={v => set("featured", v)} />
                </div>
              </section>

              {/* ── Profile Image ── */}
              <section className="space-y-4">
                <SectionHeader icon={ImageIcon} label="Profile Image" />
                <div className="flex gap-3 items-start">
                  <div className="flex-1">
                    <label className="text-xs font-medium text-muted-foreground mb-1 block">Image URL</label>
                    <Input 
                      value={formData.profileImage} 
                      onChange={e => set("profileImage", e.target.value)} 
                      placeholder="https://images.unsplash.com/..." 
                      className="bg-background border-white/10" 
                    />
                  </div>
                  <button
                    type="button"
                    onClick={() => setPreviewProfile(p => !p)}
                    className="mt-6 p-2 rounded-lg border border-white/10 hover:bg-white/5 text-muted-foreground hover:text-white transition-colors"
                    title={previewProfile ? "Hide preview" : "Preview image"}
                  >
                    {previewProfile ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
                {previewProfile && formData.profileImage && (
                  <div className="flex items-center gap-4 p-3 bg-white/5 rounded-xl border border-white/10">
                    <img 
                      src={formData.profileImage} 
                      alt="Profile preview" 
                      className="w-20 h-20 rounded-full object-cover border-2 border-primary/30"
                      onError={e => (e.currentTarget.style.display = "none")}
                    />
                    <div className="text-xs text-muted-foreground">Profile image preview</div>
                  </div>
                )}
              </section>

              {/* ── Portfolio Images ── */}
              <section className="space-y-4">
                <SectionHeader icon={ImagePlus} label="Portfolio Images" />
                <div className="flex gap-2">
                  <Input
                    value={newPortfolioUrl}
                    onChange={e => setNewPortfolioUrl(e.target.value)}
                    placeholder="Paste an image URL and click Add"
                    className="bg-background border-white/10 flex-1"
                    onKeyDown={e => { if (e.key === "Enter") { e.preventDefault(); addPortfolioImage(); } }}
                  />
                  <Button type="button" variant="outline" onClick={addPortfolioImage} className="border-white/20 shrink-0">
                    <Plus className="w-4 h-4 mr-1" /> Add
                  </Button>
                </div>

                {formData.portfolioImages.length > 0 ? (
                  <div className="grid grid-cols-3 gap-3">
                    {formData.portfolioImages.map((url, idx) => (
                      <div key={idx} className="relative group aspect-square rounded-xl overflow-hidden border border-white/10">
                        <img 
                          src={url} 
                          alt={`Portfolio ${idx + 1}`} 
                          className="w-full h-full object-cover"
                          onError={e => { e.currentTarget.style.display = "none"; }}
                        />
                        <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                          <button
                            type="button"
                            onClick={() => removePortfolioImage(idx)}
                            className="p-1.5 bg-rose-500/90 rounded-full text-white hover:bg-rose-600 transition-colors"
                          >
                            <X className="w-3 h-3" />
                          </button>
                        </div>
                        <div className="absolute bottom-1 left-1 text-[9px] bg-black/60 text-white/70 px-1.5 py-0.5 rounded">
                          {idx + 1}
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-6 border border-dashed border-white/10 rounded-xl text-sm text-muted-foreground">
                    No portfolio images added yet
                  </div>
                )}
              </section>

              {/* ── Social Links ── */}
              <section className="space-y-4">
                <SectionHeader icon={Globe} label="Social Links" />
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-xs font-medium text-muted-foreground mb-1 flex items-center gap-1 block">
                      <Instagram className="w-3 h-3" /> Instagram
                    </label>
                    <Input 
                      value={formData.socialLinks.instagram} 
                      onChange={e => setSocial("instagram", e.target.value)} 
                      placeholder="@handle or URL" 
                      className="bg-background border-white/10 text-sm" 
                    />
                  </div>
                  <div>
                    <label className="text-xs font-medium text-muted-foreground mb-1 flex items-center gap-1 block">
                      <Globe className="w-3 h-3" /> Website
                    </label>
                    <Input 
                      value={formData.socialLinks.website} 
                      onChange={e => setSocial("website", e.target.value)} 
                      placeholder="https://..." 
                      className="bg-background border-white/10 text-sm" 
                    />
                  </div>
                  <div>
                    <label className="text-xs font-medium text-muted-foreground mb-1 flex items-center gap-1 block">
                      <Youtube className="w-3 h-3" /> YouTube
                    </label>
                    <Input 
                      value={formData.socialLinks.youtube} 
                      onChange={e => setSocial("youtube", e.target.value)} 
                      placeholder="channel name or URL" 
                      className="bg-background border-white/10 text-sm" 
                    />
                  </div>
                  <div>
                    <label className="text-xs font-medium text-muted-foreground mb-1 flex items-center gap-1 block">
                      <Twitter className="w-3 h-3" /> Twitter / X
                    </label>
                    <Input 
                      value={formData.socialLinks.twitter} 
                      onChange={e => setSocial("twitter", e.target.value)} 
                      placeholder="@handle" 
                      className="bg-background border-white/10 text-sm" 
                    />
                  </div>
                  <div className="col-span-2">
                    <label className="text-xs font-medium text-muted-foreground mb-1 flex items-center gap-1 block">
                      <Music2 className="w-3 h-3" /> TikTok
                    </label>
                    <Input 
                      value={formData.socialLinks.tiktok} 
                      onChange={e => setSocial("tiktok", e.target.value)} 
                      placeholder="@handle or URL" 
                      className="bg-background border-white/10 text-sm" 
                    />
                  </div>
                </div>
              </section>

              {/* ── Service Packages ── */}
              <section className="space-y-4">
                <div className="flex justify-between items-center border-b border-white/10 pb-2">
                  <h3 className="font-bold text-primary flex items-center gap-2 text-sm">
                    <Package className="w-4 h-4" /> Service Packages
                  </h3>
                  <Button type="button" variant="outline" size="sm" onClick={addPackage} className="h-7 text-xs border-white/20">
                    <Plus className="w-3 h-3 mr-1" /> Add Package
                  </Button>
                </div>

                {formData.packages.length === 0 && (
                  <div className="text-center text-sm text-muted-foreground py-4 italic border border-dashed border-white/10 rounded-xl">
                    No packages added. Click "Add Package" to create service tiers.
                  </div>
                )}

                {formData.packages.map((pkg, idx) => (
                  <div key={idx} className="p-4 bg-white/5 border border-white/10 rounded-xl space-y-3 relative">
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Package {idx + 1}</span>
                      <button
                        type="button"
                        onClick={() => removePackage(idx)}
                        className="p-1 rounded hover:bg-rose-500/20 text-muted-foreground hover:text-rose-400 transition-colors"
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="text-xs text-muted-foreground mb-1 block">Package Name</label>
                        <Input 
                          value={pkg.name} 
                          onChange={e => updatePackage(idx, "name", e.target.value)} 
                          placeholder="e.g. Solo Performance" 
                          className="h-8 bg-background border-white/10 text-sm" 
                          required 
                        />
                      </div>
                      <div>
                        <label className="text-xs text-muted-foreground mb-1 block">Price ({CURRENCY.symbol})</label>
                        <Input 
                          type="number" 
                          min={0}
                          value={pkg.price} 
                          onChange={e => updatePackage(idx, "price", parseInt(e.target.value))} 
                          className="h-8 bg-background border-white/10 text-sm" 
                          required 
                        />
                      </div>
                      <div className="col-span-2">
                        <label className="text-xs text-muted-foreground mb-1 block">Description</label>
                        <Input 
                          value={pkg.description} 
                          onChange={e => updatePackage(idx, "description", e.target.value)} 
                          placeholder="What's included in this package" 
                          className="h-8 bg-background border-white/10 text-sm" 
                          required 
                        />
                      </div>
                      <div className="col-span-2">
                        <label className="text-xs text-muted-foreground mb-1 block">Duration</label>
                        <Input 
                          value={pkg.duration} 
                          onChange={e => updatePackage(idx, "duration", e.target.value)} 
                          placeholder="e.g. 2 hours, Half day, 1 week" 
                          className="h-8 bg-background border-white/10 text-sm" 
                        />
                      </div>
                    </div>
                  </div>
                ))}
              </section>

              <div className="pt-4 border-t border-white/10">
                <Button 
                  type="submit" 
                  className="w-full bg-primary hover:bg-primary/90 text-white h-12 text-base font-semibold" 
                  disabled={createArtist.isPending || updateArtist.isPending}
                >
                  {createArtist.isPending || updateArtist.isPending
                    ? "Saving…"
                    : editingId ? "Update Artist Profile" : "Publish Artist Profile"}
                </Button>
              </div>
            </form>
          </SheetContent>
        </Sheet>

        {/* ── Data Table ── */}
        <div className="bg-[#0f0f1a] border border-white/10 rounded-2xl overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left">
              <thead className="text-xs text-muted-foreground uppercase bg-white/[0.02] border-b border-white/10">
                <tr>
                  <th className="px-6 py-4 font-semibold w-14">Photo</th>
                  <th className="px-6 py-4 font-semibold">Artist</th>
                  <th className="px-6 py-4 font-semibold">Price</th>
                  <th className="px-6 py-4 font-semibold">Rating</th>
                  <th className="px-6 py-4 font-semibold">Media</th>
                  <th className="px-6 py-4 font-semibold">Status</th>
                  <th className="px-6 py-4 font-semibold text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {isLoading ? (
                  <tr>
                    <td colSpan={7} className="px-6 py-8 text-center text-muted-foreground">
                      Loading talent roster…
                    </td>
                  </tr>
                ) : artists && artists.length > 0 ? (
                  artists.map((artist) => (
                    <tr key={artist.id} className="border-b border-white/5 hover:bg-white/[0.02] transition-colors">
                      <td className="px-6 py-4">
                        <div className="w-11 h-11 rounded-full overflow-hidden bg-muted border border-white/10">
                          <img 
                            src={artist.profileImage || "https://images.unsplash.com/photo-1516280440502-6c2e8b243e22?w=100&h=100&fit=crop"} 
                            alt={artist.name} 
                            className="w-full h-full object-cover" 
                          />
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="font-bold text-white mb-0.5 flex items-center gap-2">
                          {artist.name}
                          {artist.featured && (
                            <Badge variant="outline" className="text-[9px] px-1.5 py-0 h-4 bg-amber-500/10 text-amber-500 border-amber-500/20">
                              Featured
                            </Badge>
                          )}
                        </div>
                        <div className="text-muted-foreground text-xs">{artist.categoryName} · {artist.location}</div>
                      </td>
                      <td className="px-6 py-4 font-medium text-white">{formatPrice(artist.basePrice)}</td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-1 text-amber-400">
                          <Star className="w-3.5 h-3.5 fill-amber-400" />
                          <span className="font-semibold text-white">{Number(artist.rating).toFixed(1)}</span>
                          <span className="text-muted-foreground text-xs">({artist.reviewCount})</span>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                          <ImageIcon className="w-3.5 h-3.5" />
                          {(artist as any).portfolioImages?.length || 0} imgs
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <Badge variant="outline" className={
                          artist.availability === "available" 
                            ? "bg-emerald-500/10 text-emerald-500 border-emerald-500/20" 
                            : artist.availability === "busy" 
                            ? "bg-amber-500/10 text-amber-500 border-amber-500/20" 
                            : "bg-rose-500/10 text-rose-500 border-rose-500/20"
                        }>
                          {artist.availability}
                        </Badge>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <Button 
                            variant="ghost" size="icon" 
                            className="hover:bg-white/10 text-muted-foreground hover:text-white" 
                            onClick={() => handleOpenForm(artist)}
                          >
                            <Edit2 className="w-4 h-4" />
                          </Button>
                          <Button 
                            variant="ghost" size="icon" 
                            className="hover:bg-rose-500/20 text-muted-foreground hover:text-rose-500" 
                            onClick={() => handleDelete(artist.id)}
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={7} className="px-6 py-12 text-center text-muted-foreground">
                      <Users className="w-12 h-12 mx-auto mb-3 opacity-20" />
                      No artists found in the directory.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </AdminLayout>
  );
}
