import { useParams, useLocation } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { useState, useEffect, useCallback } from "react";
import {
  Star, MapPin, CheckCircle2, Instagram, Globe, Youtube,
  Package, X, ChevronLeft, ChevronRight, ZoomIn, Twitter,
  Music2, Clock, ArrowLeft,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { BookingModal } from "@/components/booking-modal";
import { motion, AnimatePresence } from "framer-motion";
import { PageSeo } from "@/components/page-seo";
import { APP_BASE_URL, apiUrl } from "@/lib/api-base";
import { CURRENCY, formatPrice } from "@/lib/currency";

// ---------------------------------------------------------------------------
// Lightbox
// ---------------------------------------------------------------------------
function Lightbox({ images, startIndex, onClose }: { images: string[]; startIndex: number; onClose: () => void }) {
  const [current, setCurrent] = useState(startIndex);

  const prev = useCallback(() => setCurrent(i => (i - 1 + images.length) % images.length), [images.length]);
  const next = useCallback(() => setCurrent(i => (i + 1) % images.length), [images.length]);

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
      if (e.key === "ArrowLeft") prev();
      if (e.key === "ArrowRight") next();
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [onClose, prev, next]);

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-50 bg-black/95 flex items-center justify-center"
        onClick={onClose}
      >
        <button
          className="absolute top-4 right-4 z-10 p-2 rounded-full bg-white/10 hover:bg-white/20 text-white transition-colors"
          onClick={onClose}
        >
          <X className="w-5 h-5" />
        </button>
        <div className="absolute top-4 left-1/2 -translate-x-1/2 text-white/60 text-sm font-medium tabular-nums">
          {current + 1} / {images.length}
        </div>
        {images.length > 1 && (
          <button
            className="absolute left-4 p-3 rounded-full bg-white/10 hover:bg-white/20 text-white transition-colors z-10"
            onClick={e => { e.stopPropagation(); prev(); }}
          >
            <ChevronLeft className="w-6 h-6" />
          </button>
        )}
        <motion.img
          key={current}
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.2 }}
          src={images[current]}
          alt={`Portfolio ${current + 1}`}
          className="max-h-[85vh] max-w-[90vw] object-contain rounded-xl shadow-2xl"
          onClick={e => e.stopPropagation()}
        />
        {images.length > 1 && (
          <button
            className="absolute right-4 p-3 rounded-full bg-white/10 hover:bg-white/20 text-white transition-colors z-10"
            onClick={e => { e.stopPropagation(); next(); }}
          >
            <ChevronRight className="w-6 h-6" />
          </button>
        )}
        {images.length > 1 && (
          <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-2 px-4 py-2 rounded-full bg-black/60 backdrop-blur-sm">
            {images.map((img, i) => (
              <button
                key={i}
                onClick={e => { e.stopPropagation(); setCurrent(i); }}
                className={`w-10 h-10 rounded-lg overflow-hidden border-2 transition-all ${i === current ? "border-primary scale-110" : "border-white/20 opacity-60 hover:opacity-100"}`}
              >
                <img src={img} alt="" className="w-full h-full object-cover" />
              </button>
            ))}
          </div>
        )}
      </motion.div>
    </AnimatePresence>
  );
}

// ---------------------------------------------------------------------------
// Fallback images
// ---------------------------------------------------------------------------
const FALLBACK_PORTFOLIO = [
  "https://images.unsplash.com/photo-1501281668745-f7f57925c3b4?auto=format&fit=crop&q=80&w=800",
  "https://images.unsplash.com/photo-1493225457124-a1a2a5f36e4f?auto=format&fit=crop&q=80&w=800",
  "https://images.unsplash.com/photo-1514525253161-7a46d19cd819?auto=format&fit=crop&q=80&w=800",
];

// ---------------------------------------------------------------------------
// Main page
// ---------------------------------------------------------------------------
export default function ArtistProfile() {
  const params = useParams<{ slug: string }>();
  const [, navigate] = useLocation();
  const slug = params.slug || "";
  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null);

  const { data: artist, isLoading, error } = useQuery({
    queryKey: ["artist", slug],
    queryFn: async () => {
      const res = await fetch(apiUrl(`/api/artists/${encodeURIComponent(slug)}`));
      if (!res.ok) throw new Error("Not found");
      return res.json();
    },
    enabled: !!slug,
    retry: false,
  });

  // ── Loading skeleton ──────────────────────────────────────────────────────
  if (isLoading) {
    return (
      <div className="pb-24 md:pb-0">
        <Skeleton className="h-[40vh] md:h-[50vh] w-full rounded-none" />
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 -mt-20 space-y-4">
          <Skeleton className="h-48 md:h-40 w-full rounded-3xl" />
          <Skeleton className="h-16 w-full rounded-2xl" />
          <Skeleton className="h-32 w-full rounded-2xl" />
          <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
            {[...Array(6)].map((_, i) => <Skeleton key={i} className="aspect-square rounded-2xl" />)}
          </div>
        </div>
      </div>
    );
  }

  // ── Error state ───────────────────────────────────────────────────────────
  if (error || !artist) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center text-center px-4">
        <h2 className="text-2xl font-bold text-foreground mb-2">Artist Not Found</h2>
        <p className="text-muted-foreground mb-6">The profile you are looking for does not exist.</p>
        <Button variant="outline" onClick={() => navigate("/artists")}>
          <ArrowLeft className="w-4 h-4 mr-2" /> Browse Artists
        </Button>
      </div>
    );
  }

  // ── Derived values ────────────────────────────────────────────────────────
  const isAvailable      = artist.availability === "available";
  const portfolioImages  = artist.portfolioImages?.length ? artist.portfolioImages : FALLBACK_PORTFOLIO;
  const socialLinks      = artist.socialLinks || {};
  const artistName       = artist.name?.trim() || "Artist";
  const artistCategory   = artist.categoryName?.trim() || "artist";
  const artistLocation   = artist.location?.trim() || "worldwide";
  const profileImage     = artist.profileImage || artist.portfolioImages?.[0] || undefined;
  const seoDescription   = `Book ${artistName}, a verified ${artistCategory.toLowerCase()} based in ${artistLocation}. ${artist.bio?.slice(0, 120) || "View portfolio, pricing, and availability."}`;
  const claimProfileHref = `/claim-profile?artistId=${artist.id}&artistName=${encodeURIComponent(artistName)}&location=${encodeURIComponent(artistLocation)}&category=${encodeURIComponent(artistCategory)}`;

  // ── Reusable sub-components ───────────────────────────────────────────────
  const SocialLinks = () => Object.values(socialLinks).some(v => v) ? (
    <div className="flex items-center gap-2 flex-wrap justify-center md:justify-start">
      {socialLinks.instagram && (
        <a href={socialLinks.instagram.startsWith("http") ? socialLinks.instagram : `https://instagram.com/${socialLinks.instagram.replace("@", "")}`}
           target="_blank" rel="noreferrer"
           className="p-2.5 bg-muted hover:bg-primary/10 hover:text-primary rounded-xl transition-colors text-muted-foreground"
           title="Instagram">
          <Instagram className="w-4 h-4" />
        </a>
      )}
      {socialLinks.youtube && (
        <a href={socialLinks.youtube.startsWith("http") ? socialLinks.youtube : `https://youtube.com/${socialLinks.youtube}`}
           target="_blank" rel="noreferrer"
           className="p-2.5 bg-muted hover:bg-primary/10 hover:text-primary rounded-xl transition-colors text-muted-foreground"
           title="YouTube">
          <Youtube className="w-4 h-4" />
        </a>
      )}
      {socialLinks.twitter && (
        <a href={socialLinks.twitter.startsWith("http") ? socialLinks.twitter : `https://twitter.com/${socialLinks.twitter.replace("@", "")}`}
           target="_blank" rel="noreferrer"
           className="p-2.5 bg-muted hover:bg-primary/10 hover:text-primary rounded-xl transition-colors text-muted-foreground"
           title="Twitter / X">
          <Twitter className="w-4 h-4" />
        </a>
      )}
      {socialLinks.tiktok && (
        <a href={socialLinks.tiktok.startsWith("http") ? socialLinks.tiktok : `https://tiktok.com/@${socialLinks.tiktok.replace("@", "")}`}
           target="_blank" rel="noreferrer"
           className="p-2.5 bg-muted hover:bg-primary/10 hover:text-primary rounded-xl transition-colors text-muted-foreground"
           title="TikTok">
          <Music2 className="w-4 h-4" />
        </a>
      )}
      {socialLinks.website && (
        <a href={socialLinks.website} target="_blank" rel="noreferrer"
           className="px-3 py-2 bg-muted hover:bg-primary/10 hover:text-primary rounded-xl transition-colors text-muted-foreground flex items-center gap-1.5 text-sm font-medium"
           title="Website">
          <Globe className="w-4 h-4" />
          Website
        </a>
      )}
    </div>
  ) : null;

  const PackageCards = () => (
    <div className="space-y-3">
      {artist.packages!.map((pkg, i) => (
        <div key={i} className="p-4 rounded-2xl border border-border bg-background hover:border-primary/40 hover:shadow-sm transition-all">
          <div className="flex justify-between items-start gap-2 mb-1.5">
            <h4 className="font-bold text-foreground text-sm">{pkg.name}</h4>
            <span className="font-bold text-primary shrink-0 text-sm">{formatPrice(pkg.price)}</span>
          </div>
          <p className="text-sm text-muted-foreground leading-relaxed mb-2">{pkg.description}</p>
          {pkg.duration && (
            <div className="inline-flex items-center gap-1 text-xs font-semibold text-foreground/60 bg-muted px-2.5 py-1 rounded-lg">
              <Clock className="w-3 h-3" /> {pkg.duration}
            </div>
          )}
        </div>
      ))}
    </div>
  );

  // ── Render ────────────────────────────────────────────────────────────────
  return (
    <div className="pb-24 md:pb-0">
      <PageSeo
        title={`${artistName} - ${artistCategory} for Hire`}
        description={seoDescription}
        canonical={`/artists/${artist.slug || artist.id}`}
        image={profileImage}
        type="profile"
        schema={{
          "@context": "https://schema.org",
          "@type": "Person",
          "name": artistName,
          "jobTitle": artistCategory,
          "description": artist.bio || undefined,
          "url": `${APP_BASE_URL}/artists/${artist.slug || artist.id}`,
          "image": profileImage,
          "address": artist.location ? { "@type": "PostalAddress", "addressLocality": artistLocation } : undefined,
          "offers": {
            "@type": "Offer",
            "price": artist.basePrice,
            "priceCurrency": CURRENCY.code,
            "availability": isAvailable ? "https://schema.org/InStock" : "https://schema.org/OutOfStock",
          },
        }}
      />

      {lightboxIndex !== null && (
        <Lightbox images={portfolioImages} startIndex={lightboxIndex} onClose={() => setLightboxIndex(null)} />
      )}

      {/* ── Hero ── */}
      <div className="relative h-44 sm:h-52 md:h-56 w-full overflow-hidden">
        <img
          src="https://images.unsplash.com/photo-1541701494587-cb58502866ab?auto=format&fit=crop&q=80&w=2000"
          className="w-full h-full object-cover"
          alt=""
          role="presentation"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-background via-background/30 to-transparent" aria-hidden="true" />

        {/* Back button */}
        <button
          onClick={() => window.history.back()}
          className="absolute top-4 left-4 flex items-center gap-1.5 px-3 py-2 rounded-xl bg-black/40 hover:bg-black/60 backdrop-blur-sm text-white text-sm font-medium transition-colors"
        >
          <ArrowLeft className="w-4 h-4" /> Back
        </button>
      </div>

      {/* ── Page body ── */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative -mt-10 sm:-mt-14 md:-mt-16">
        <div className="flex flex-col md:flex-row gap-6 lg:gap-8">

          {/* ── Main column ── */}
          <div className="flex-1 min-w-0 space-y-5">

            {/* Profile card */}
            <motion.div
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-card border border-border rounded-3xl shadow-xl shadow-black/10 p-5 sm:p-6 md:p-8 flex flex-col items-center md:flex-row md:items-start gap-5"
            >
              {/* Avatar */}
              <div className="relative shrink-0">
                <img
                  src={profileImage || "https://images.unsplash.com/photo-1516280440502-6c2e8b243e22?auto=format&fit=crop&q=80&w=400"}
                  className="w-28 h-28 sm:w-32 sm:h-32 md:w-44 md:h-44 rounded-2xl object-cover shadow-lg border-2 border-border"
                  alt={artist.name}
                />
                {isAvailable && (
                  <span className="absolute -bottom-1.5 -right-1.5 w-5 h-5 rounded-full bg-emerald-500 border-2 border-card shadow" title="Available" />
                )}
              </div>

              {/* Info */}
              <div className="flex-1 min-w-0 text-center md:text-left">
                <div className="flex flex-wrap gap-2 mb-2.5 justify-center md:justify-start">
                  <Badge variant="default" className="bg-primary/90 hover:bg-primary text-primary-foreground text-xs">
                    {artist.categoryName}
                  </Badge>
                  {isAvailable ? (
                    <Badge variant="outline" className="border-emerald-500/50 text-emerald-500 bg-emerald-500/10 text-xs">
                      <CheckCircle2 className="w-3 h-3 mr-1" /> Available for booking
                    </Badge>
                  ) : (
                    <Badge variant="outline" className="border-amber-500/50 text-amber-500 bg-amber-500/10 text-xs">
                      {artist.availability === "busy" ? "Currently Busy" : "Not Available"}
                    </Badge>
                  )}
                </div>

                <h1 className="text-2xl sm:text-3xl md:text-4xl font-display font-bold text-foreground mb-2 leading-tight">
                  {artist.name}
                </h1>

                <div className="flex flex-wrap items-center gap-x-4 gap-y-1.5 text-sm text-muted-foreground font-medium justify-center md:justify-start mb-4">
                  <span className="flex items-center gap-1">
                    <MapPin className="w-3.5 h-3.5 text-primary shrink-0" />
                    {artist.location}
                  </span>
                  <span className="flex items-center gap-1" aria-label={`Rated ${Number(artist.rating).toFixed(1)} out of 5`}>
                    <Star className="w-3.5 h-3.5 text-amber-400 fill-amber-400 shrink-0" />
                    <span className="text-foreground font-bold">{Number(artist.rating).toFixed(1)}</span>
                    <span>({artist.reviewCount} reviews)</span>
                  </span>
                </div>

                <SocialLinks />
              </div>
            </motion.div>

            {/* Stats strip */}
            <motion.div
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.05 }}
              className="grid grid-cols-3 bg-card border border-border rounded-2xl overflow-hidden divide-x divide-border"
            >
              <div className="py-4 px-3 text-center">
                <p className="text-xl sm:text-2xl font-display font-extrabold text-foreground">{Number(artist.rating).toFixed(1)}</p>
                <p className="text-xs text-muted-foreground mt-0.5">Rating</p>
              </div>
              <div className="py-4 px-3 text-center">
                <p className="text-xl sm:text-2xl font-display font-extrabold text-foreground">{artist.reviewCount}</p>
                <p className="text-xs text-muted-foreground mt-0.5">Reviews</p>
              </div>
              <div className="py-4 px-3 text-center">
                <p className="text-xl sm:text-2xl font-display font-extrabold text-primary">{formatPrice(artist.basePrice)}</p>
                <p className="text-xs text-muted-foreground mt-0.5">Starts at</p>
              </div>
            </motion.div>

            {/* About */}
            <motion.section
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="bg-card border border-border rounded-3xl p-5 sm:p-6"
            >
              <h2 className="text-lg font-display font-bold mb-3">About the Artist</h2>
              <p className="text-muted-foreground leading-relaxed text-sm sm:text-base">{artist.bio}</p>
            </motion.section>

            {/* Specialties */}
            {artist.tags && artist.tags.length > 0 && (
              <motion.section
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.12 }}
                className="bg-card border border-border rounded-3xl p-5 sm:p-6"
              >
                <h2 className="text-lg font-display font-bold mb-3">Specialties</h2>
                <div className="flex flex-wrap gap-2">
                  {artist.tags.map(tag => (
                    <span key={tag} className="px-3 py-1.5 rounded-xl bg-secondary text-secondary-foreground font-medium text-xs capitalize">
                      {tag}
                    </span>
                  ))}
                </div>
              </motion.section>
            )}

            {/* Booking CTA + Packages — mobile only, shown in scroll flow before portfolio */}
            <motion.div
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.14 }}
              className="md:hidden space-y-4"
            >
              {/* Booking card */}
              <div className="bg-card border border-border rounded-3xl p-5 relative overflow-hidden">
                <div className="absolute top-0 right-0 w-36 h-36 bg-primary/5 rounded-full blur-3xl -mr-8 -mt-8 pointer-events-none" />
                <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1">Price starts at</p>
                <div className="text-3xl font-display font-extrabold text-foreground mb-0.5">
                  {formatPrice(artist.basePrice)}
                </div>
                <p className="text-xs text-muted-foreground mb-4">Final price depends on your event & requirements</p>
                <BookingModal artist={artist} />
                <p className="text-center text-xs text-muted-foreground mt-3 leading-relaxed">
                  No commitment required. Only charged after the artist accepts your brief.
                </p>
              </div>

              {/* Packages */}
              {artist.packages && artist.packages.length > 0 && (
                <div className="bg-card border border-border rounded-3xl p-5">
                  <h2 className="text-lg font-display font-bold mb-3 flex items-center gap-2">
                    <Package className="w-4 h-4 text-primary" /> Service Packages
                  </h2>
                  <PackageCards />
                </div>
              )}
            </motion.div>

            {/* Portfolio */}
            <motion.section
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.16 }}
              className="bg-card border border-border rounded-3xl p-5 sm:p-6"
            >
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-display font-bold">Portfolio</h2>
                <span className="text-xs text-muted-foreground flex items-center gap-1">
                  <ZoomIn className="w-3.5 h-3.5" /> Tap to expand
                </span>
              </div>

              {/* Mobile: horizontal scroll for quick swipe-through */}
              <div className="flex gap-3 overflow-x-auto pb-2 -mx-1 px-1 snap-x snap-mandatory sm:hidden scrollbar-hide">
                {portfolioImages.map((img, i) => (
                  <button
                    key={i}
                    className="shrink-0 w-52 aspect-[3/4] rounded-2xl overflow-hidden bg-muted snap-start relative group"
                    onClick={() => setLightboxIndex(i)}
                  >
                    <img src={img} className="w-full h-full object-cover transition-transform duration-500 group-active:scale-105" alt={`Portfolio ${i + 1}`} />
                    <div className="absolute inset-0 bg-black/0 group-active:bg-black/15 transition-colors flex items-center justify-center">
                      <ZoomIn className="w-7 h-7 text-white opacity-0 group-hover:opacity-100 transition-opacity drop-shadow-lg" />
                    </div>
                  </button>
                ))}
              </div>

              {/* Tablet / Desktop: CSS grid */}
              <div className="hidden sm:grid grid-cols-2 md:grid-cols-3 gap-3">
                {portfolioImages.map((img, i) => (
                  <motion.div
                    key={i}
                    whileHover={{ scale: 1.02 }}
                    className="aspect-square rounded-2xl overflow-hidden bg-muted group cursor-zoom-in relative"
                    onClick={() => setLightboxIndex(i)}
                  >
                    <img src={img} className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110" alt={`Portfolio ${i + 1}`} />
                    <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors flex items-center justify-center">
                      <ZoomIn className="w-8 h-8 text-white opacity-0 group-hover:opacity-100 transition-opacity drop-shadow-lg" />
                    </div>
                  </motion.div>
                ))}
              </div>
            </motion.section>

            {/* Claim profile */}
            <p className="text-center text-xs text-muted-foreground pb-2">
              Own this profile?{" "}
              <a href={claimProfileHref} className="text-primary font-semibold hover:text-primary/80 transition-colors">
                Request a review
              </a>
            </p>

          </div>

          {/* ── Sidebar (desktop only) ── */}
          <div className="hidden md:block md:w-80 lg:w-96 shrink-0">
            <motion.div
              initial={{ opacity: 0, x: 16 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.1 }}
              className="sticky top-28 space-y-5"
            >
              {/* Booking CTA */}
              <div className="bg-card border border-border shadow-xl shadow-black/5 rounded-3xl p-6 relative overflow-hidden">
                <div className="absolute top-0 right-0 w-40 h-40 bg-primary/5 rounded-full blur-3xl -mr-10 -mt-10 pointer-events-none" />
                <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1">Price starts at</p>
                <div className="text-4xl font-display font-extrabold text-foreground mb-1">
                  {formatPrice(artist.basePrice)}
                </div>
                <p className="text-sm text-muted-foreground mb-5">Final price depends on your event & requirements</p>
                <BookingModal artist={artist} />
                <p className="text-center text-xs text-muted-foreground mt-4 leading-relaxed">
                  No commitment required. You will only be charged after the artist accepts your brief.
                </p>
              </div>

              {/* Packages */}
              {artist.packages && artist.packages.length > 0 && (
                <div className="bg-card border border-border rounded-3xl p-6">
                  <h3 className="font-display font-bold text-base mb-4 flex items-center gap-2">
                    <Package className="w-4 h-4 text-primary" /> Service Packages
                  </h3>
                  <PackageCards />
                </div>
              )}
            </motion.div>
          </div>

        </div>
      </div>

      {/* ── Mobile sticky booking bar ── */}
      <div className="fixed bottom-0 left-0 right-0 z-30 md:hidden px-4 py-3 bg-background/95 backdrop-blur-xl border-t border-border flex items-center gap-3">
        <div className="shrink-0 min-w-0">
          <p className="text-[10px] text-muted-foreground leading-none mb-0.5">Price starts at</p>
          <p className="font-display font-extrabold text-lg text-foreground leading-none">{formatPrice(artist.basePrice)}</p>
        </div>
        <div className="flex-1">
          <BookingModal artist={artist} />
        </div>
      </div>

    </div>
  );
}
