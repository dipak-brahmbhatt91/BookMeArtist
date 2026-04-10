import { motion } from "framer-motion";
import { useState, useRef } from "react";
import { Link, useLocation } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { Search, Compass, ArrowRight, Zap, X, CheckCircle, ChevronRight, ChevronLeft } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { ArtistCard } from "@/components/artist-card";
import { useListArtists, useListCategories, type Artist } from "@workspace/api-client-react";
import { useToast } from "@/hooks/use-toast";
import { PageSeo } from "@/components/page-seo";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { apiUrl, APP_BASE_URL } from "@/lib/api-base";

const CMS_LS_KEY = "bma:cms";

function useCms() {
  return useQuery<Record<string, unknown>>({
    queryKey: ["cms"],
    queryFn: async () => {
      const data = await fetch(apiUrl("/api/cms")).then((r) => r.json());
      try { localStorage.setItem(CMS_LS_KEY, JSON.stringify(data)); } catch {}
      return data;
    },
    initialData: () => {
      try {
        const raw = localStorage.getItem(CMS_LS_KEY);
        return raw ? JSON.parse(raw) : undefined;
      } catch {
        return undefined;
      }
    },
    staleTime: 30_000,
  });
}

function ApplyModal({ onClose }: { onClose: () => void }) {
  const { toast } = useToast();
  const { data: categories } = useListCategories();
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [form, setForm] = useState({
    name: "", email: "", specialty: "", categoryId: "", location: "", bio: "", instagram: "", message: "",
  });

  function set(field: string, value: string) {
    setForm((f) => ({ ...f, [field]: value }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await fetch(apiUrl("/api/applications"), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...form,
          categoryId: Number(form.categoryId),
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to submit");
      setSubmitted(true);
    } catch (err: any) {
      toast({ title: "Submission failed", description: err.message, variant: "destructive" });
    } finally {
      setLoading(false);
    }
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm"
      onClick={onClose}
      role="presentation"
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="apply-modal-title"
        className="bg-[#0f0f1a] border border-white/10 rounded-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between p-6 border-b border-white/10 sticky top-0 bg-[#0f0f1a] z-10">
          <div>
            <h2 id="apply-modal-title" className="text-xl font-display font-bold text-white">Apply as Artist</h2>
            <p className="text-muted-foreground text-sm mt-0.5">Tell us about yourself and your craft</p>
          </div>
          <button
            onClick={onClose}
            className="text-muted-foreground hover:text-white transition-colors rounded focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary p-1"
            aria-label="Close dialog"
          >
            <X className="w-5 h-5" aria-hidden="true" />
          </button>
        </div>

        {submitted ? (
          <div className="p-10 text-center">
            <div className="w-14 h-14 rounded-full bg-emerald-400/10 flex items-center justify-center mx-auto mb-4">
              <CheckCircle className="w-7 h-7 text-emerald-400" />
            </div>
            <h3 className="text-white font-bold text-xl mb-2">Application Submitted!</h3>
            <p className="text-muted-foreground">We'll review your application and get back to you soon.</p>
            <Button onClick={onClose} className="mt-6 bg-primary hover:bg-primary/90 text-white">Close</Button>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="p-6 space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label htmlFor="apply-name" className="text-muted-foreground text-sm">Full Name *</Label>
                <Input id="apply-name" value={form.name} onChange={(e) => set("name", e.target.value)}
                  placeholder="Your name" required minLength={2} aria-required="true"
                  className="bg-[#0a0a0f] border-white/10 text-white" />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="apply-email" className="text-muted-foreground text-sm">Email *</Label>
                <Input id="apply-email" type="email" value={form.email} onChange={(e) => set("email", e.target.value)}
                  placeholder="you@example.com" required aria-required="true"
                  className="bg-[#0a0a0f] border-white/10 text-white" />
              </div>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label htmlFor="apply-specialty" className="text-muted-foreground text-sm">Specialty *</Label>
                <Input id="apply-specialty" value={form.specialty} onChange={(e) => set("specialty", e.target.value)}
                  placeholder="e.g. Live Musician, DJ" required minLength={2} aria-required="true"
                  className="bg-[#0a0a0f] border-white/10 text-white" />
              </div>
              <div className="space-y-1.5">
                <Label className="text-muted-foreground text-sm">Category *</Label>
                <Select value={form.categoryId} onValueChange={(value) => set("categoryId", value)}>
                  <SelectTrigger className="bg-[#0a0a0f] border-white/10 text-white">
                    <SelectValue placeholder="Choose category" />
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
            <div className="grid grid-cols-1 gap-4">
              <div className="space-y-1.5">
                <Label htmlFor="apply-location" className="text-muted-foreground text-sm">Location *</Label>
                <Input id="apply-location" value={form.location} onChange={(e) => set("location", e.target.value)}
                  placeholder="City, Country" required minLength={2} aria-required="true"
                  className="bg-[#0a0a0f] border-white/10 text-white" />
              </div>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="apply-bio" className="text-muted-foreground text-sm">
                Bio * <span className="text-xs opacity-50">(min 20 characters)</span>
              </Label>
              <textarea
                id="apply-bio"
                value={form.bio} onChange={(e) => set("bio", e.target.value)}
                placeholder="Tell us about your work and experience..."
                required minLength={20} rows={3} aria-required="true"
                className="w-full rounded-md border border-white/10 bg-[#0a0a0f] text-white px-3 py-2 text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 resize-none"
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="apply-instagram" className="text-muted-foreground text-sm">
                Instagram <span className="text-xs opacity-50">(optional)</span>
              </Label>
              <Input id="apply-instagram" value={form.instagram} onChange={(e) => set("instagram", e.target.value)}
                placeholder="@yourhandle"
                className="bg-[#0a0a0f] border-white/10 text-white" />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="apply-message" className="text-muted-foreground text-sm">
                Anything else? <span className="text-xs opacity-50">(optional)</span>
              </Label>
              <textarea
                id="apply-message"
                value={form.message} onChange={(e) => set("message", e.target.value)}
                placeholder="Links to your work, special notes..."
                rows={2}
                className="w-full rounded-md border border-white/10 bg-[#0a0a0f] text-white px-3 py-2 text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 resize-none"
              />
            </div>
            <Button type="submit" disabled={loading} className="w-full bg-primary hover:bg-primary/90 text-white h-11">
              {loading ? "Submitting…" : "Submit Application"}
            </Button>
          </form>
        )}
      </div>
    </div>
  );
}

/* ─────────────────────────────────────────────────────────
   Reusable horizontal artist row with prev / next buttons
───────────────────────────────────────────────────────── */
function ArtistScrollRow({
  artists,
  isLoading,
  title,
  accentColor = "bg-primary",
  viewAllHref = "/artists",
}: {
  artists: Artist[];
  isLoading: boolean;
  title: string;
  accentColor?: string;
  viewAllHref?: string;
}) {
  const scrollRef = useRef<HTMLDivElement>(null);

  function slide(dir: "left" | "right") {
    const el = scrollRef.current;
    if (!el) return;
    el.scrollBy({ left: dir === "right" ? 260 : -260, behavior: "smooth" });
  }

  return (
    <div>
      {/* Header */}
      <div className="flex items-center justify-between mb-4 sm:mb-6 px-4 sm:px-6 lg:px-8">
        <div className="flex items-center gap-2.5">
          <div className={`w-1 h-5 rounded-full ${accentColor}`} />
          <h2 className="text-base sm:text-xl font-display font-bold text-white">{title}</h2>
        </div>
        <div className="flex items-center gap-2">
          {/* Prev / Next — visible on all viewports */}
          <button
            onClick={() => slide("left")}
            aria-label="Scroll left"
            className="flex w-8 h-8 rounded-full bg-white/5 border border-white/10 items-center justify-center hover:bg-white/10 active:scale-95 transition-all"
          >
            <ChevronLeft className="w-4 h-4 text-white" />
          </button>
          <button
            onClick={() => slide("right")}
            aria-label="Scroll right"
            className="flex w-8 h-8 rounded-full bg-white/5 border border-white/10 items-center justify-center hover:bg-white/10 active:scale-95 transition-all"
          >
            <ChevronRight className="w-4 h-4 text-white" />
          </button>
          <Link href={viewAllHref} className="flex items-center gap-1 text-primary text-sm font-semibold hover:text-accent transition-colors ml-1">
            See all <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>
      </div>

      {/* Scroll track */}
      {isLoading ? (
        <div className="flex gap-4 px-4 sm:px-6 lg:px-8">
          {[1,2,3,4].map(i => (
            <div key={i} className="shrink-0 w-[220px] sm:w-[240px] h-[320px] rounded-2xl bg-white/5 animate-pulse border border-white/5" />
          ))}
        </div>
      ) : artists.length > 0 ? (
        <div
          ref={scrollRef}
          className="flex gap-4 overflow-x-auto pb-1 snap-x snap-mandatory px-4 sm:px-6 lg:px-8 scrollbar-hide"
        >
          {artists.map((artist) => (
            <div key={artist.id} className="snap-start shrink-0 w-[220px] sm:w-[240px]">
              <ArtistCard artist={artist} />
            </div>
          ))}
        </div>
      ) : (
        <div className="mx-4 sm:mx-6 lg:mx-8 text-center py-12 bg-card rounded-2xl border border-dashed border-white/10">
          <Compass className="w-8 h-8 text-muted-foreground mx-auto mb-2" />
          <p className="text-muted-foreground text-sm">No artists yet.</p>
        </div>
      )}
    </div>
  );
}

export default function Home() {
  const { data: featuredArtistsRaw, isLoading: featuredLoading } = useListArtists({ featured: true });
  const featuredArtists = Array.isArray(featuredArtistsRaw) ? featuredArtistsRaw : [];
  const { data: allArtistsRaw, isLoading: allLoading } = useListArtists({});
  const allArtists = Array.isArray(allArtistsRaw) ? allArtistsRaw : [];
  const { data: cms = {} } = useCms();
  const [showApply, setShowApply] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [, navigate] = useLocation();

  function handleSearch() {
    const q = searchQuery.trim();
    navigate(q ? `/artists?search=${encodeURIComponent(q)}` : "/artists");
  }

  const s = (key: string, fallback: string): string => {
    const v = cms[key];
    return typeof v === "string" && v.trim() !== "" ? v : fallback;
  };

  const { data: dbCategories = [] } = useListCategories();

  return (
    <>
      <PageSeo
        title="Book Verified Musicians, Photographers & Performers"
        description="Discover and book verified artists for weddings, corporate events, and parties across India. Direct booking, no agency fees."
        canonical="/"
        schema={[{
          "@type": "WebSite",
          "@id": `${APP_BASE_URL}/#website`,
          "url": `${APP_BASE_URL}/`,
          "name": "BookMeArtist",
          "potentialAction": {
            "@type": "SearchAction",
            "target": { "@type": "EntryPoint", "urlTemplate": `${APP_BASE_URL}/artists?search={search_term_string}` },
            "query-input": "required name=search_term_string"
          }
        }]}
      />
      {showApply && <ApplyModal onClose={() => setShowApply(false)} />}
      <div className="w-full flex flex-col">

        {/* ── HERO ── */}
        <section className="relative overflow-hidden pt-14 pb-10 sm:pt-20 sm:pb-14 md:pt-28 md:pb-20">
          <div className="absolute inset-0 -z-10 bg-background">
            <div className="absolute inset-0 bg-[radial-gradient(ellipse_80%_55%_at_50%_-10%,rgba(99,102,241,0.18),transparent)]" />
            <div className="absolute bottom-0 left-0 right-0 h-40 bg-gradient-to-t from-background to-transparent" />
          </div>

          <div className="max-w-3xl mx-auto px-4 sm:px-6 text-center">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, ease: "easeOut" }}
            >
              {/* Badge */}
              <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-primary/10 border border-primary/25 text-primary text-xs font-semibold mb-5">
                <Zap className="w-3 h-3" />
                {s("hero.badge_text", "India's Artist Marketplace")}
              </div>

              {/* Headline */}
              <h1 className="text-[2.1rem] leading-[1.1] sm:text-5xl md:text-6xl lg:text-7xl font-display font-extrabold tracking-tight mb-3 sm:mb-4 bg-clip-text text-transparent bg-gradient-to-r from-primary via-cyan-400 to-accent">
                {s("hero.headline", "Book the Right Artist for Every Occasion")}
              </h1>

              {/* Subtitle */}
              <p className="text-muted-foreground text-sm sm:text-lg mb-7 leading-relaxed max-w-xl mx-auto">
                {s("hero.subtitle", "Verified musicians, photographers & performers. Direct booking, no agency fees.")}
              </p>

              {/* Search bar */}
              <div
                className="flex gap-1.5 bg-white/[0.07] backdrop-blur-xl border border-white/10 rounded-2xl p-1.5 max-w-xl mx-auto mb-5 shadow-[0_0_0_1px_rgba(99,102,241,0.15),0_8px_32px_rgba(0,0,0,0.3)]"
                role="search"
              >
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground w-4 h-4 pointer-events-none" />
                  <label htmlFor="hero-search" className="sr-only">Search artists</label>
                  <Input
                    id="hero-search"
                    type="search"
                    placeholder={s("hero.search_placeholder", "Singer for wedding in Mumbai…")}
                    className="pl-9 border-0 bg-transparent h-11 text-sm focus-visible:ring-0 focus-visible:ring-offset-0 shadow-none text-white placeholder:text-muted-foreground/55"
                    value={searchQuery}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) => setSearchQuery(e.target.value)}
                    onKeyDown={(e: React.KeyboardEvent<HTMLInputElement>) => e.key === "Enter" && handleSearch()}
                    autoComplete="off"
                  />
                </div>
                <Button
                  onClick={handleSearch}
                  className="h-11 px-6 rounded-xl font-bold text-sm bg-primary hover:bg-primary/90 text-white shrink-0"
                >
                  {s("hero.cta_text", "Search")}
                </Button>
              </div>

              {/* Category chips */}
              {dbCategories.length > 0 && (
                <div className="flex flex-wrap gap-2 justify-center">
                  {dbCategories.slice(0, 7).map((cat) => (
                    <Link key={cat.id} href={`/artists/${cat.slug}`}>
                      <span className="shrink-0 inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white/5 border border-white/10 text-white/65 text-xs hover:bg-white/10 hover:text-white transition-colors cursor-pointer whitespace-nowrap">
                        <span>{cat.icon}</span>{cat.name}
                      </span>
                    </Link>
                  ))}
                  <Link href="/artists">
                    <span className="shrink-0 inline-flex items-center gap-1 px-3 py-1.5 rounded-full bg-primary/10 border border-primary/20 text-primary text-xs hover:bg-primary/20 transition-colors cursor-pointer whitespace-nowrap font-medium">
                      More <ChevronRight className="w-3 h-3" />
                    </span>
                  </Link>
                </div>
              )}
            </motion.div>
          </div>
        </section>

        {/* ── FEATURED ARTISTS — scrollable, one row, with arrow buttons ── */}
        <section className="pt-8 pb-10 sm:pt-10 sm:pb-12 bg-background">
          <div className="max-w-7xl mx-auto">
            <ArtistScrollRow
              artists={featuredArtists}
              isLoading={featuredLoading}
              title="Featured Artists"
              accentColor="bg-primary"
              viewAllHref="/artists?featured=true"
            />
          </div>
        </section>

        {/* ── BOOK BY OCCASION ── */}
        <section className="py-8 sm:py-12 bg-card border-y border-white/5">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex items-center gap-2.5 mb-5 sm:mb-7">
              <div className="w-1 h-5 rounded-full bg-rose-400" />
              <h2 className="text-base sm:text-xl font-display font-bold text-white">Book by Occasion</h2>
            </div>

            {/* 2 cols on mobile → 3 on sm → 6 on lg */}
            <div className="grid grid-cols-3 sm:grid-cols-6 gap-3">
              {[
                { emoji: "💍", label: "Wedding",       q: "Wedding",   bg: "from-rose-500/20 to-pink-600/10",     border: "border-rose-500/20"    },
                { emoji: "🏢", label: "Corporate",     q: "Corporate", bg: "from-blue-500/20 to-cyan-600/10",     border: "border-blue-500/20"    },
                { emoji: "🎂", label: "Birthday",      q: "Birthday",  bg: "from-amber-500/20 to-orange-600/10",  border: "border-amber-500/20"   },
                { emoji: "🎤", label: "Live Concert",  q: "Concert",   bg: "from-purple-500/20 to-indigo-600/10", border: "border-purple-500/20"  },
                { emoji: "🎪", label: "Festival",      q: "Festival",  bg: "from-emerald-500/20 to-teal-600/10",  border: "border-emerald-500/20" },
                { emoji: "🥂", label: "Private Party", q: "Party",     bg: "from-fuchsia-500/20 to-violet-600/10",border: "border-fuchsia-500/20" },
              ].map((occ) => (
                <Link key={occ.label} href={`/artists?search=${encodeURIComponent(occ.q)}`}>
                  <div className={`group bg-gradient-to-br ${occ.bg} border ${occ.border} hover:border-white/25 rounded-2xl p-3 sm:p-5 text-center transition-all duration-200 hover:-translate-y-0.5 cursor-pointer h-full flex flex-col items-center justify-center gap-1.5 sm:gap-2`}>
                    <div className="text-2xl sm:text-4xl">{occ.emoji}</div>
                    <p className="text-white font-semibold text-[11px] sm:text-sm leading-tight">{occ.label}</p>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        </section>

        {/* ── ALL ARTISTS — second scroll row ── */}
        <section className="pt-8 pb-10 sm:pt-10 sm:pb-12 bg-background">
          <div className="max-w-7xl mx-auto">
            <ArtistScrollRow
              artists={allArtists.slice(0, 16)}
              isLoading={allLoading}
              title="Browse Artists"
              accentColor="bg-emerald-400"
              viewAllHref="/artists"
            />
          </div>
        </section>

        {/* ── BROWSE BY CATEGORY ── */}
        <section className="py-8 sm:py-12 bg-card border-t border-white/5">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex items-center justify-between mb-5 sm:mb-7">
              <div className="flex items-center gap-2.5">
                <div className="w-1 h-5 rounded-full bg-indigo-400" />
                <h2 className="text-base sm:text-xl font-display font-bold text-white">Browse by Category</h2>
              </div>
              <Link href="/artists" className="flex items-center gap-1 text-primary text-xs sm:text-sm font-semibold hover:text-accent transition-colors">
                All <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>

            {dbCategories.length > 0 ? (
              /* 4 cols on mobile → up to 8 on desktop — fixed equal cells, no scroll */
              <div className="grid grid-cols-4 sm:grid-cols-6 lg:grid-cols-8 gap-3">
                {dbCategories.map((cat) => (
                  <Link key={cat.id} href={`/artists/${cat.slug}`}>
                    <div className="group bg-white/[0.03] border border-white/5 hover:border-primary/30 hover:bg-white/[0.06] rounded-2xl p-3 sm:p-4 text-center transition-all duration-200 cursor-pointer">
                      <div className="text-xl sm:text-3xl mb-1.5 sm:mb-2">{cat.icon}</div>
                      <p className="text-white/70 group-hover:text-white font-medium text-[10px] sm:text-xs leading-tight transition-colors">{cat.name}</p>
                    </div>
                  </Link>
                ))}
              </div>
            ) : (
              <div className="grid grid-cols-4 sm:grid-cols-8 gap-3">
                {[1,2,3,4,5,6,7,8].map(i => (
                  <div key={i} className="h-20 rounded-2xl bg-white/5 animate-pulse border border-white/5" />
                ))}
              </div>
            )}
          </div>
        </section>

        {/* ── ARTIST CTA — compact banner ── */}
        <section className="py-10 sm:py-12 border-t border-white/8 bg-gradient-to-r from-primary/10 via-background to-accent/10">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <p className="text-xs font-semibold uppercase tracking-widest text-primary mb-1">For Artists</p>
              <h2 className="text-xl sm:text-2xl font-display font-bold text-white">
                {s("artist_cta.heading", "Get discovered. Start earning.")}
              </h2>
              <p className="text-muted-foreground text-sm mt-1 max-w-sm">
                {s("artist_cta.description", "Join thousands of artists receiving bookings directly from event organisers.")}
              </p>
            </div>
            <Button
              size="lg"
              onClick={() => setShowApply(true)}
              className="shrink-0 bg-white text-black hover:bg-white/90 font-bold px-8 h-11 rounded-xl"
            >
              {s("artist_cta.button_text", "Apply as Artist")}
            </Button>
          </div>
        </section>

      </div>
    </>
  );
}
