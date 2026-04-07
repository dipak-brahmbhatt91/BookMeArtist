import { Link } from "wouter";
import { Star, MapPin, CheckCircle2, Clock, XCircle } from "lucide-react";
import type { Artist } from "@workspace/api-client-react";
import { formatPrice } from "@/lib/currency";

interface ArtistCardProps {
  artist: Artist;
}

export function ArtistCard({ artist }: ArtistCardProps) {
  const isAvailable = artist.availability === "available";
  const isBusy = artist.availability === "busy";
  const ratingDisplay = artist.rating.toFixed(1);

  return (
    <Link
      href={`/artists/${artist.id}`}
      className="group block h-full rounded-2xl focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:ring-offset-background"
      aria-label={`View profile of ${artist.name}, ${artist.categoryName}${isAvailable ? ", currently available" : ""}, rated ${ratingDisplay} out of 5, starting at ${formatPrice(artist.basePrice)}`}
    >
      <div className="bg-card rounded-2xl overflow-hidden border border-white/10 shadow-lg shadow-black/20 hover:shadow-[0_8px_30px_rgba(99,102,241,0.15)] hover:-translate-y-2 transition-all duration-500 h-full flex flex-col relative group">
        
        {/* Shine effect overlay */}
        <div className="absolute inset-0 opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity duration-700 bg-gradient-to-tr from-white/0 via-white/5 to-white/0 z-20" aria-hidden="true"></div>

        {artist.featured && (
          <div className="absolute top-0 right-0 z-20" aria-label="Featured artist">
            <div className="bg-gradient-to-r from-accent to-yellow-400 text-accent-foreground text-xs font-bold px-4 py-1.5 rounded-bl-xl shadow-md">
              Featured
            </div>
          </div>
        )}

        <div className="relative h-56 sm:h-64 overflow-hidden bg-muted">
          <img 
            src={artist.profileImage || `https://images.unsplash.com/photo-1516280440502-6c2e8b243e22?auto=format&fit=crop&q=80&w=800`} 
            alt={`${artist.name} — ${artist.categoryName}`}
            className="w-full h-full object-cover group-hover:scale-110 group-hover:rotate-1 transition-transform duration-700 ease-out"
          />
          
          <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent opacity-80" aria-hidden="true"></div>
          
          <div className="absolute bottom-4 left-4 right-4 flex justify-between items-end z-10">
            <div className="flex flex-col gap-2 items-start">
              <div className="bg-white/10 backdrop-blur-md border border-white/20 px-3 py-1.5 rounded-full text-xs font-bold text-white shadow-sm flex items-center gap-1.5">
                {artist.categoryName}
              </div>
            </div>
            {isAvailable && (
              <div className="bg-success/90 backdrop-blur-sm px-2.5 py-1 rounded-full text-[10px] font-bold text-white shadow-[0_0_10px_rgba(34,197,94,0.5)] flex items-center gap-1">
                <CheckCircle2 className="w-3 h-3" aria-hidden="true" /> Available
              </div>
            )}
            {isBusy && (
              <div className="bg-amber-500/90 backdrop-blur-sm px-2.5 py-1 rounded-full text-[10px] font-bold text-white flex items-center gap-1">
                <Clock className="w-3 h-3" aria-hidden="true" /> Busy
              </div>
            )}
            {!isAvailable && !isBusy && (
              <div className="bg-rose-500/90 backdrop-blur-sm px-2.5 py-1 rounded-full text-[10px] font-bold text-white flex items-center gap-1">
                <XCircle className="w-3 h-3" aria-hidden="true" /> Unavailable
              </div>
            )}
          </div>
        </div>

        <div className="p-5 flex-1 flex flex-col relative z-10 bg-card">
          <div className="flex justify-between items-start mb-2">
            <h3 className="text-xl font-display font-bold text-white line-clamp-1 group-hover:text-primary transition-colors">
              {artist.name}
            </h3>
            <div className="flex items-center gap-1 bg-white/5 border border-white/10 px-2 py-1 rounded-md" aria-label={`Rated ${ratingDisplay} out of 5, ${artist.reviewCount} reviews`}>
              <Star className="w-3.5 h-3.5 fill-accent text-accent" aria-hidden="true" />
              <span className="text-sm font-bold text-white" aria-hidden="true">{ratingDisplay}</span>
              {artist.reviewCount > 0 && (
                <span className="text-xs text-muted-foreground" aria-hidden="true">({artist.reviewCount})</span>
              )}
            </div>
          </div>
          
          <p className="text-muted-foreground text-sm flex items-center gap-1.5 mb-4">
            <MapPin className="w-4 h-4 text-primary" aria-hidden="true" />
            {artist.location}
          </p>

          {/* Tags */}
          {artist.tags && artist.tags.length > 0 && (
            <div className="flex flex-wrap gap-1.5 mb-4" aria-label="Skills">
              {artist.tags.slice(0, 3).map(tag => (
                <span key={tag} className="text-[10px] uppercase tracking-wider font-semibold bg-white/5 text-muted-foreground px-2 py-0.5 rounded-full border border-white/5">
                  {tag}
                </span>
              ))}
              {artist.tags.length > 3 && (
                <span className="text-[10px] uppercase tracking-wider font-semibold bg-white/5 text-muted-foreground px-2 py-0.5 rounded-full border border-white/5" aria-label={`and ${artist.tags.length - 3} more`}>
                  +{artist.tags.length - 3}
                </span>
              )}
            </div>
          )}
          
          <div className="mt-auto pt-4 border-t border-white/10 flex items-center justify-between">
            <div>
              <span className="text-xs text-muted-foreground block mb-0.5">Starting at</span>
              <span className="font-bold text-lg text-white">{formatPrice(artist.basePrice)}</span>
            </div>
            <div className="text-sm font-semibold text-primary flex items-center gap-1 opacity-0 group-hover:opacity-100 -translate-x-2 group-hover:translate-x-0 transition-all duration-300" aria-hidden="true">
              View Profile &rarr;
            </div>
          </div>
        </div>
      </div>
    </Link>
  );
}
