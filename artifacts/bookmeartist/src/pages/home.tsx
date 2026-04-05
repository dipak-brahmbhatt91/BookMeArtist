import { motion } from "framer-motion";
import { useState } from "react";
import { Link, useLocation } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { Search, Music, Camera, Palette, Mic2, Compass, ArrowRight, Star, Sparkles, Zap, Flame, X, CheckCircle } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { ArtistCard } from "@/components/artist-card";
import { useListArtists, useListCategories } from "@workspace/api-client-react";
import { useToast } from "@/hooks/use-toast";
import { PageSeo } from "@/components/page-seo";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { apiUrl } from "@/lib/api-base";

function useCms() {
  return useQuery<Record<string, unknown>>({
    queryKey: ["cms"],
    queryFn: () => fetch(apiUrl("/api/cms")).then((r) => r.json()),
    staleTime: 30_000,
  });
}

type HowStep = { num: string; title: string; desc: string };

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

export default function Home() {
  const { data: featuredArtistsRaw, isLoading } = useListArtists({ featured: true });
  const featuredArtists = Array.isArray(featuredArtistsRaw) ? featuredArtistsRaw : [];
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
    return typeof v === "string" ? v : fallback;
  };

  const brands: string[] = Array.isArray(cms["trusted_by.brands"])
    ? (cms["trusted_by.brands"] as string[])
    : ["Spotify", "Netflix", "Vogue", "SXSW", "RedBull"];

  const steps: HowStep[] = [
    (cms["how_it_works.step_1"] as HowStep) || { num: "01", title: "Find the Vibe", desc: "Search portfolios, compare transparent pricing, and read verified reviews." },
    (cms["how_it_works.step_2"] as HowStep) || { num: "02", title: "Send the Brief", desc: "Outline your vision, budget, and dates directly to the artist's dashboard." },
    (cms["how_it_works.step_3"] as HowStep) || { num: "03", title: "Make Magic", desc: "Once accepted, collaborate closely and watch your creative project come to life." },
  ];

  const categories = [
    { name: "Music & Bands", icon: Music, gradient: "from-blue-500 to-cyan-400", bg: "bg-blue-500/10" },
    { name: "Photography", icon: Camera, gradient: "from-amber-500 to-orange-400", bg: "bg-amber-500/10" },
    { name: "Painters", icon: Palette, gradient: "from-rose-500 to-pink-400", bg: "bg-rose-500/10" },
    { name: "Performers", icon: Mic2, gradient: "from-purple-500 to-indigo-400", bg: "bg-purple-500/10" },
  ];

  return (
    <>
      <PageSeo
        title="Book Verified Musicians, Photographers & Performers"
        description="Discover and book world-class creative talent for your next event or project. Verified musicians, photographers, dancers, and performers. No agency fees — book directly."
        canonical="/"
        schema={[
          {
            "@type": "WebSite",
            "@id": "https://bookmeartist.replit.app/#website",
            "url": "https://bookmeartist.replit.app/",
            "name": "BookMeArtist",
            "potentialAction": {
              "@type": "SearchAction",
              "target": {
                "@type": "EntryPoint",
                "urlTemplate": "https://bookmeartist.replit.app/artists?search={search_term_string}"
              },
              "query-input": "required name=search_term_string"
            }
          },
          {
            "@type": "Organization",
            "name": "BookMeArtist",
            "url": "https://bookmeartist.replit.app/",
            "description": "Artist booking marketplace connecting clients with verified musicians, photographers, dancers, and creative professionals."
          }
        ]}
      />
    {showApply && <ApplyModal onClose={() => setShowApply(false)} />}
    <div className="w-full flex flex-col">
      {/* Hero Section */}
      <section className="relative overflow-hidden pt-14 pb-16 sm:pt-24 sm:pb-32 lg:pt-32 lg:pb-40">
        <div className="absolute inset-0 -z-10 bg-background">
          <img 
            src={`${import.meta.env.BASE_URL}images/hero-abstract.png`}
            alt="Abstract vibrant background"
            className="w-full h-full object-cover opacity-30 mix-blend-screen"
          />
          <div className="absolute inset-0 bg-gradient-to-b from-background/40 via-background/80 to-background"></div>
          {/* Animated glow orbs */}
          <div className="absolute top-1/4 left-1/4 w-[500px] h-[500px] bg-primary/20 rounded-full blur-[120px] mix-blend-screen animate-pulse"></div>
          <div className="absolute bottom-1/4 right-1/4 w-[400px] h-[400px] bg-accent/10 rounded-full blur-[100px] mix-blend-screen animate-pulse" style={{ animationDelay: '2s' }}></div>
        </div>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10 text-center">
          {/* Floating elements */}
          <motion.div 
            animate={{ y: [0, -15, 0], rotate: [0, 5, 0] }}
            transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
            className="hidden md:flex absolute top-10 left-10 w-16 h-16 bg-card border border-white/10 rounded-2xl items-center justify-center shadow-xl backdrop-blur-md"
          >
            <Sparkles className="w-8 h-8 text-accent" />
          </motion.div>
          <motion.div 
            animate={{ y: [0, 15, 0], rotate: [0, -5, 0] }}
            transition={{ duration: 5, repeat: Infinity, ease: "easeInOut" }}
            className="hidden md:flex absolute bottom-20 right-10 w-20 h-20 bg-card border border-white/10 rounded-full items-center justify-center shadow-xl backdrop-blur-md"
          >
            <Flame className="w-10 h-10 text-rose-500" />
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, ease: "easeOut" }}
            className="max-w-4xl mx-auto"
          >
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/5 border border-white/10 text-white font-medium text-sm mb-8 backdrop-blur-md shadow-lg" aria-label={s("hero.badge_text", "The new standard for creative bookings")}>
              <Zap className="w-4 h-4 text-accent" aria-hidden="true" />
              <span className="text-white/80" aria-hidden="true">{s("hero.badge_text", "The new standard for creative bookings")}</span>
            </div>
            
            <h1 className="text-3xl sm:text-5xl md:text-7xl lg:text-8xl font-display font-extrabold tracking-tight leading-[1.05] mb-6 sm:mb-8 bg-clip-text text-transparent bg-gradient-to-r from-white via-white to-white/80">
              <span className="bg-clip-text text-transparent bg-gradient-to-r from-primary via-indigo-400 to-accent drop-shadow-sm">
                {s("hero.headline", "Book the World's Best Creators")}
              </span>
            </h1>
            
            <p className="text-sm sm:text-lg md:text-2xl text-muted-foreground mb-8 sm:mb-12 leading-relaxed max-w-2xl mx-auto">
              {s("hero.subtitle", "Skip the agency fees. Connect directly with verified musicians, photographers, and performers for your next masterpiece.")}
            </p>

            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.2, duration: 0.5 }}
              className="p-[2px] rounded-2xl bg-gradient-to-r from-primary to-accent max-w-2xl mx-auto shadow-[0_0_40px_rgba(99,102,241,0.3)]"
            >
              <div className="flex flex-col sm:flex-row gap-2 bg-card p-2 rounded-[14px]" role="search">
                <div className="relative flex-1">
                  <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground w-5 h-5" aria-hidden="true" />
                  <label htmlFor="hero-search" className="sr-only">Search for artists, musicians, photographers</label>
                  <Input 
                    id="hero-search"
                    type="search"
                    placeholder={s("hero.search_placeholder", "E.g. 'Wedding Photographer in NYC'")}
                    className="pl-12 border-0 bg-transparent h-14 text-lg focus-visible:ring-0 focus-visible:ring-offset-0 shadow-none text-white placeholder:text-muted-foreground/70"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && handleSearch()}
                    autoComplete="off"
                  />
                </div>
                <Button size="lg" onClick={handleSearch} className="h-14 px-5 sm:px-8 rounded-xl font-bold text-base sm:text-lg bg-primary hover:bg-primary/90 text-white transition-all shadow-[0_0_15px_rgba(99,102,241,0.4)] hover:shadow-[0_0_25px_rgba(99,102,241,0.6)] whitespace-nowrap">
                  {s("hero.cta_text", "Explore Now")}
                </Button>
              </div>
            </motion.div>
          </motion.div>
        </div>
      </section>

      {/* Trusted By Strip */}
      <section className="border-y border-white/5 bg-black/40 py-8 overflow-hidden backdrop-blur-sm">
        <div className="max-w-7xl mx-auto px-4 text-center">
          <p className="text-sm text-muted-foreground font-semibold uppercase tracking-widest mb-6">
            {s("trusted_by.label", "Trusted by innovative creators at")}
          </p>
          <div className="flex flex-wrap justify-center gap-8 md:gap-16 opacity-50 grayscale hover:grayscale-0 hover:opacity-100 transition-all duration-500">
            {brands.map((brand, i) => (
              <div key={i} className="font-display font-black text-2xl">{brand}</div>
            ))}
          </div>
        </div>
      </section>

      {/* Categories Grid */}
      <section className="py-14 sm:py-20 md:py-24 bg-background">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-end mb-8 sm:mb-12">
            <div>
              <h2 className="text-2xl sm:text-3xl md:text-5xl font-display font-bold text-white mb-2 sm:mb-4">Discover by Craft</h2>
              <p className="text-muted-foreground text-sm sm:text-lg">Find the exact flavor of creativity you need.</p>
            </div>
            <Link href="/artists" className="hidden sm:flex items-center text-primary font-bold hover:text-accent transition-colors">
              View All Categories <ArrowRight className="w-5 h-5 ml-2" />
            </Link>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {categories.map((cat, i) => (
              <Link key={i} href={`/artists?category=${cat.name.split(' ')[0]}`}>
                <div className="group relative bg-card rounded-3xl p-8 border border-white/5 hover:border-white/20 overflow-hidden transition-all duration-300 hover:-translate-y-2 hover:shadow-[0_20px_40px_rgba(0,0,0,0.4)]">
                  <div className={`absolute inset-0 bg-gradient-to-br ${cat.gradient} opacity-0 group-hover:opacity-10 transition-opacity duration-500`}></div>
                  
                  <div className={`w-16 h-16 rounded-2xl flex items-center justify-center mb-6 ${cat.bg} border border-white/10 group-hover:scale-110 transition-transform duration-500`}>
                    <cat.icon className={`w-8 h-8 text-transparent bg-clip-text bg-gradient-to-br ${cat.gradient}`} />
                    <cat.icon className="w-8 h-8 absolute opacity-80" style={{ color: "white" }} />
                  </div>
                  
                  <h3 className="font-display font-bold text-2xl text-white mb-2">{cat.name}</h3>
                  <div className="flex items-center text-sm text-muted-foreground group-hover:text-white transition-colors">
                    Explore <ArrowRight className="w-4 h-4 ml-1 opacity-0 -translate-x-2 group-hover:opacity-100 group-hover:translate-x-0 transition-all" />
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* Featured Artists */}
      <section className="py-14 sm:py-20 md:py-24 bg-card border-y border-white/5 relative overflow-hidden">
        <div className="absolute right-0 top-0 w-1/3 h-full bg-primary/5 blur-[150px] pointer-events-none"></div>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="flex justify-between items-end mb-8 sm:mb-12 md:mb-16">
            <div>
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 border border-primary/20 text-primary text-sm font-bold mb-4">
                <Star className="w-4 h-4 fill-primary" /> Curated Selection
              </div>
              <h2 className="text-2xl sm:text-3xl md:text-5xl font-display font-bold text-white">Trending Talent</h2>
            </div>
            <Button variant="outline" asChild className="hidden sm:flex border-white/10 hover:bg-white/5 text-white">
              <Link href="/artists">See All Talent</Link>
            </Button>
          </div>

          {isLoading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
              {[1,2,3,4].map(i => (
                <div key={i} className="h-[420px] rounded-3xl bg-white/5 animate-pulse border border-white/10"></div>
              ))}
            </div>
          ) : featuredArtists && featuredArtists.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
              {featuredArtists.slice(0, 4).map((artist) => (
                <ArtistCard key={artist.id} artist={artist} />
              ))}
            </div>
          ) : (
             <div className="text-center py-24 bg-background/50 rounded-3xl border border-dashed border-white/10 backdrop-blur-sm">
               <Compass className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
               <h3 className="text-2xl font-bold text-white mb-2">No featured artists yet</h3>
               <p className="text-muted-foreground mb-8">We are currently onboarding our exclusive talent.</p>
               <Button asChild className="bg-primary text-white"><Link href="/artists">Browse All</Link></Button>
             </div>
          )}
        </div>
      </section>

      {/* How it works */}
      <section className="py-14 sm:py-24 md:py-32 bg-background relative">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-10 sm:mb-16 md:mb-20">
            <h2 className="text-3xl sm:text-4xl md:text-6xl font-display font-bold mb-4 sm:mb-6 text-white">
              {s("how_it_works.heading", "How It Works")}
            </h2>
            <p className="text-muted-foreground max-w-2xl mx-auto text-base sm:text-xl">
              {s("how_it_works.subheading", "From initial spark to final applause in three simple steps.")}
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-4 sm:gap-6 md:gap-8 relative">
            {/* Gradient Line connector */}
            <div className="hidden md:block absolute top-12 left-[15%] right-[15%] h-[2px] bg-gradient-to-r from-transparent via-primary to-transparent opacity-30"></div>
            
            {steps.map((step, i) => (
              <div key={i} className="relative z-10 bg-card border border-white/5 p-6 sm:p-8 md:p-10 rounded-3xl hover:border-primary/30 transition-colors">
                <div className="text-4xl sm:text-5xl font-display font-black text-transparent bg-clip-text bg-gradient-to-br from-white/20 to-white/5 mb-4 sm:mb-6">
                  {step.num}
                </div>
                <h3 className="text-xl sm:text-2xl font-bold mb-3 sm:mb-4 text-white">{step.title}</h3>
                <p className="text-muted-foreground text-base sm:text-lg leading-relaxed">{step.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Artist CTA Split Layout */}
      <section className="border-t border-white/10">
        <div className="grid md:grid-cols-2">
          <div className="bg-card p-8 sm:p-12 md:p-16 lg:p-24 flex flex-col justify-center border-r border-white/10 relative overflow-hidden">
            <div className="absolute top-0 right-0 w-64 h-64 bg-primary/10 rounded-full blur-[80px]"></div>
            <h2 className="text-3xl sm:text-4xl md:text-5xl font-display font-bold text-white mb-4 sm:mb-6 relative z-10">
              {s("artist_cta.heading", "Are you a creator?")}
            </h2>
            <p className="text-base sm:text-xl text-muted-foreground mb-6 sm:mb-10 relative z-10">
              {s("artist_cta.description", "Join thousands of artists managing their bookings, payments, and client relationships all in one place.")}
            </p>
            <div className="relative z-10">
              <Button size="lg" onClick={() => setShowApply(true)} className="bg-white text-black hover:bg-white/90 font-bold text-base sm:text-lg px-6 sm:px-8 h-12 sm:h-14 rounded-xl">
                {s("artist_cta.button_text", "Apply as Artist")}
              </Button>
            </div>
          </div>
          <div className="relative min-h-[220px] sm:min-h-[300px] md:min-h-0 bg-muted">
            <img 
              src="https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?auto=format&fit=crop&q=80&w=1200" 
              className="absolute inset-0 w-full h-full object-cover grayscale mix-blend-luminosity opacity-40"
              alt="Artist performing"
            />
            <div className="absolute inset-0 bg-gradient-to-tr from-primary/80 to-accent/40 mix-blend-multiply"></div>
          </div>
        </div>
      </section>
    </div>
    </>
  );
}
