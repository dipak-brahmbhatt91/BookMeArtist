import { useParams } from "wouter";
import { useGetArtist } from "@workspace/api-client-react";
import { useState, useEffect, useCallback } from "react";
import { Star, MapPin, CheckCircle2, Instagram, Globe, Youtube, Package, X, ChevronLeft, ChevronRight, ZoomIn, Twitter, Music2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { BookingModal } from "@/components/booking-modal";
import { motion, AnimatePresence } from "framer-motion";
import { PageSeo } from "@/components/page-seo";

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
        {/* Close */}
        <button
          className="absolute top-4 right-4 z-10 p-2 rounded-full bg-white/10 hover:bg-white/20 text-white transition-colors"
          onClick={onClose}
        >
          <X className="w-5 h-5" />
        </button>

        {/* Counter */}
        <div className="absolute top-4 left-1/2 -translate-x-1/2 text-white/60 text-sm font-medium tabular-nums">
          {current + 1} / {images.length}
        </div>

        {/* Prev */}
        {images.length > 1 && (
          <button
            className="absolute left-4 p-3 rounded-full bg-white/10 hover:bg-white/20 text-white transition-colors z-10"
            onClick={e => { e.stopPropagation(); prev(); }}
          >
            <ChevronLeft className="w-6 h-6" />
          </button>
        )}

        {/* Image */}
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

        {/* Next */}
        {images.length > 1 && (
          <button
            className="absolute right-4 p-3 rounded-full bg-white/10 hover:bg-white/20 text-white transition-colors z-10"
            onClick={e => { e.stopPropagation(); next(); }}
          >
            <ChevronRight className="w-6 h-6" />
          </button>
        )}

        {/* Thumbnails */}
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

const FALLBACK_PORTFOLIO = [
  "https://images.unsplash.com/photo-1501281668745-f7f57925c3b4?auto=format&fit=crop&q=80&w=800",
  "https://images.unsplash.com/photo-1493225457124-a1a2a5f36e4f?auto=format&fit=crop&q=80&w=800",
  "https://images.unsplash.com/photo-1514525253161-7a46d19cd819?auto=format&fit=crop&q=80&w=800",
];

export default function ArtistProfile() {
  const params = useParams();
  const id = parseInt(params.id || "0", 10);
  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null);
  
  const { data: artist, isLoading, error } = useGetArtist(id, {
    query: { enabled: id > 0, retry: false }
  });

  if (isLoading) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-12 w-full animate-pulse space-y-8">
        <Skeleton className="h-64 md:h-96 w-full rounded-3xl" />
        <div className="flex gap-8">
          <div className="flex-1 space-y-4">
            <Skeleton className="h-10 w-1/3" />
            <Skeleton className="h-4 w-1/4" />
            <Skeleton className="h-32 w-full mt-8" />
          </div>
          <div className="w-80 space-y-4">
            <Skeleton className="h-64 w-full rounded-2xl" />
          </div>
        </div>
      </div>
    );
  }

  if (error || !artist) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center text-center">
        <h2 className="text-2xl font-bold text-foreground mb-2">Artist Not Found</h2>
        <p className="text-muted-foreground">The profile you are looking for does not exist.</p>
      </div>
    );
  }

  const isAvailable = artist.availability === "available";
  const portfolioImages = artist.portfolioImages?.length ? artist.portfolioImages : FALLBACK_PORTFOLIO;
  const socialLinks = artist.socialLinks || {};
  const artistName = artist.name?.trim() || "Artist";
  const artistCategory = artist.categoryName?.trim() || "artist";
  const artistLocation = artist.location?.trim() || "worldwide";
  const profileImage = artist.profileImage || artist.portfolioImages?.[0] || undefined;
  const seoDescription = `Book ${artistName}, a verified ${artistCategory.toLowerCase()} based in ${artistLocation}. ${artist.bio?.slice(0, 120) || "View portfolio, pricing, and availability."}`;
  const claimProfileHref = `/claim-profile?artistId=${artist.id}&artistName=${encodeURIComponent(artistName)}&location=${encodeURIComponent(artistLocation)}&category=${encodeURIComponent(artistCategory)}`;

  return (
    <div className="pb-24">
      <PageSeo
        title={`${artistName} - ${artistCategory} for Hire`}
        description={seoDescription}
        canonical={`/artists/${artist.id}`}
        image={profileImage}
        type="profile"
        schema={{
          "@context": "https://schema.org",
          "@type": "Person",
          "name": artistName,
          "jobTitle": artistCategory,
          "description": artist.bio || undefined,
          "url": `https://bookmeartist.replit.app/artists/${artist.id}`,
          "image": profileImage,
          "address": artist.location ? { "@type": "PostalAddress", "addressLocality": artistLocation } : undefined,
          "offers": {
            "@type": "Offer",
            "price": artist.basePrice,
            "priceCurrency": "USD",
            "availability": artist.availability === "available" ? "https://schema.org/InStock" : "https://schema.org/OutOfStock"
          }
        }}
      />
      {/* Lightbox */}
      {lightboxIndex !== null && (
        <Lightbox 
          images={portfolioImages} 
          startIndex={lightboxIndex} 
          onClose={() => setLightboxIndex(null)} 
        />
      )}

      {/* Hero Header */}
      <div className="relative h-[30vh] md:h-[45vh] bg-muted w-full">
        <img 
          src="https://images.unsplash.com/photo-1541701494587-cb58502866ab?auto=format&fit=crop&q=80&w=2000" 
          className="w-full h-full object-cover"
          alt=""
          role="presentation"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-background via-background/20 to-transparent" aria-hidden="true" />
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative -mt-32">
        <div className="flex flex-col md:flex-row gap-8">
          
          {/* ── Main Content ── */}
          <div className="flex-1 min-w-0">

            {/* Profile Info Card */}
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-card p-6 md:p-8 rounded-3xl shadow-xl shadow-black/5 border border-border flex flex-col sm:flex-row gap-6 items-start"
            >
              <img 
                src={artist.profileImage || "https://images.unsplash.com/photo-1516280440502-6c2e8b243e22?auto=format&fit=crop&q=80&w=400"}
                className="w-32 h-32 md:w-40 md:h-40 rounded-full object-cover border-4 border-background shadow-lg shrink-0"
                alt={artist.name}
              />
              
              <div className="flex-1 pt-2 min-w-0">
                <div className="flex flex-wrap gap-2 mb-3">
                  <Badge variant="default" className="bg-primary hover:bg-primary/90 text-primary-foreground">
                    {artist.categoryName}
                  </Badge>
                  {isAvailable ? (
                    <Badge variant="outline" className="border-emerald-500 text-emerald-500 bg-emerald-500/10">
                      <CheckCircle2 className="w-3 h-3 mr-1" aria-hidden="true" /> Available for booking
                    </Badge>
                  ) : (
                    <Badge variant="outline" className="border-amber-500 text-amber-500 bg-amber-500/10">
                      {artist.availability === "busy" ? "Currently Busy" : "Not Available"}
                    </Badge>
                  )}
                </div>
                
                <h1 className="text-3xl md:text-4xl font-display font-bold text-foreground mb-2">
                  {artist.name}
                </h1>
                
                <div className="flex flex-wrap items-center gap-4 text-sm text-muted-foreground font-medium">
                  <div className="flex items-center gap-1">
                    <MapPin className="w-4 h-4 text-primary" aria-hidden="true" />
                    {artist.location}
                  </div>
                  <div className="flex items-center gap-1" aria-label={`Rated ${artist.rating?.toFixed(1)} out of 5`}>
                    <Star className="w-4 h-4 text-amber-400 fill-amber-400" aria-hidden="true" />
                    <span className="text-foreground font-bold">{Number(artist.rating).toFixed(1)}</span>
                    <span>({artist.reviewCount} reviews)</span>
                  </div>
                </div>

                {/* Social Links */}
                {Object.values(socialLinks).some(v => v) && (
                  <div className="flex items-center gap-2 mt-6 pt-6 border-t border-border flex-wrap">
                    {socialLinks.instagram && (
                      <a href={socialLinks.instagram.startsWith("http") ? socialLinks.instagram : `https://instagram.com/${socialLinks.instagram.replace("@","")}`} 
                         target="_blank" rel="noreferrer" 
                         className="p-2 bg-muted hover:bg-primary/10 hover:text-primary rounded-full transition-colors text-muted-foreground"
                         title="Instagram">
                        <Instagram className="w-5 h-5" />
                      </a>
                    )}
                    {socialLinks.youtube && (
                      <a href={socialLinks.youtube.startsWith("http") ? socialLinks.youtube : `https://youtube.com/${socialLinks.youtube}`}
                         target="_blank" rel="noreferrer"
                         className="p-2 bg-muted hover:bg-primary/10 hover:text-primary rounded-full transition-colors text-muted-foreground"
                         title="YouTube">
                        <Youtube className="w-5 h-5" />
                      </a>
                    )}
                    {socialLinks.twitter && (
                      <a href={socialLinks.twitter.startsWith("http") ? socialLinks.twitter : `https://twitter.com/${socialLinks.twitter.replace("@","")}`}
                         target="_blank" rel="noreferrer"
                         className="p-2 bg-muted hover:bg-primary/10 hover:text-primary rounded-full transition-colors text-muted-foreground"
                         title="Twitter / X">
                        <Twitter className="w-5 h-5" />
                      </a>
                    )}
                    {socialLinks.tiktok && (
                      <a href={socialLinks.tiktok.startsWith("http") ? socialLinks.tiktok : `https://tiktok.com/@${socialLinks.tiktok.replace("@","")}`}
                         target="_blank" rel="noreferrer"
                         className="p-2 bg-muted hover:bg-primary/10 hover:text-primary rounded-full transition-colors text-muted-foreground"
                         title="TikTok">
                        <Music2 className="w-5 h-5" />
                      </a>
                    )}
                    {socialLinks.website && (
                      <a href={socialLinks.website} target="_blank" rel="noreferrer"
                         className="px-3 py-2 bg-muted hover:bg-primary/10 hover:text-primary rounded-full transition-colors text-muted-foreground flex items-center gap-1.5 text-sm"
                         title="Website">
                        <Globe className="w-4 h-4" />
                        <span className="font-medium">Website</span>
                      </a>
                    )}
                  </div>
                )}
              </div>
            </motion.div>

            {/* Biography */}
            <div className="mt-12">
              <h2 className="text-2xl font-display font-bold mb-4">About the Artist</h2>
              <p className="text-muted-foreground leading-relaxed text-base">{artist.bio}</p>
            </div>

            {/* Specialties */}
            {artist.tags && artist.tags.length > 0 && (
              <div className="mt-12">
                <h2 className="text-2xl font-display font-bold mb-4">Specialties</h2>
                <div className="flex flex-wrap gap-2">
                  {artist.tags.map(tag => (
                    <span key={tag} className="px-4 py-2 rounded-xl bg-secondary text-secondary-foreground font-medium text-sm capitalize">
                      {tag}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Portfolio Gallery */}
            <div className="mt-12">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl font-display font-bold">Portfolio</h2>
                <span className="text-sm text-muted-foreground flex items-center gap-1">
                  <ZoomIn className="w-4 h-4" /> Click to expand
                </span>
              </div>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                {portfolioImages.map((img, i) => (
                  <motion.div 
                    key={i} 
                    whileHover={{ scale: 1.02 }}
                    className="aspect-square rounded-2xl overflow-hidden bg-muted group cursor-zoom-in relative"
                    onClick={() => setLightboxIndex(i)}
                  >
                    <img 
                      src={img} 
                      className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110" 
                      alt={`Portfolio item ${i + 1}`} 
                    />
                    <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors duration-300 flex items-center justify-center">
                      <ZoomIn className="w-8 h-8 text-white opacity-0 group-hover:opacity-100 transition-opacity duration-300 drop-shadow-lg" />
                    </div>
                  </motion.div>
                ))}
              </div>
            </div>
          </div>

          {/* ── Sidebar ── */}
          <div className="md:w-80 lg:w-96 flex-shrink-0 mt-8 md:mt-0">
            <motion.div 
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.1 }}
              className="sticky top-28 space-y-6"
            >
              {/* Booking CTA */}
              <div className="bg-card border border-border shadow-xl shadow-black/5 rounded-3xl p-6 relative overflow-hidden">
                <div className="absolute top-0 right-0 w-32 h-32 bg-primary/5 rounded-full blur-2xl -mr-10 -mt-10" />
                <h3 className="font-bold text-muted-foreground text-sm uppercase tracking-wider mb-2">Base Rate</h3>
                <div className="text-4xl font-display font-extrabold text-foreground mb-6">
                  ${artist.basePrice}<span className="text-lg text-muted-foreground font-sans font-normal"> / event</span>
                </div>
                <BookingModal artist={artist} />
                <p className="text-center text-xs text-muted-foreground mt-4">
                  No commitment required. You will only be charged after the artist accepts your brief.
                </p>
                <p className="text-center text-xs text-muted-foreground mt-3">
                  Own this profile?{" "}
                  <a href={claimProfileHref} className="text-primary font-semibold hover:text-primary/80 transition-colors">
                    Request review
                  </a>
                </p>
              </div>

              {/* Service Packages */}
              {artist.packages && artist.packages.length > 0 && (
                <div className="bg-card border border-border shadow-sm rounded-3xl p-6">
                  <h3 className="font-display font-bold text-xl mb-4 flex items-center gap-2">
                    <Package className="w-5 h-5 text-primary" /> Service Packages
                  </h3>
                  <div className="space-y-4">
                    {artist.packages.map((pkg, i) => (
                      <div key={i} className="p-4 rounded-2xl border border-border/50 bg-background hover:border-primary/30 transition-colors">
                        <div className="flex justify-between items-start mb-2">
                          <h4 className="font-bold text-foreground">{pkg.name}</h4>
                          <span className="font-bold text-primary shrink-0 ml-2">${pkg.price}</span>
                        </div>
                        <p className="text-sm text-muted-foreground mb-3">{pkg.description}</p>
                        {pkg.duration && (
                          <div className="text-xs font-semibold text-foreground/70 bg-muted inline-flex px-2 py-1 rounded-md">
                            ⏱ {pkg.duration}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </motion.div>
          </div>
          
        </div>
      </div>
    </div>
  );
}
