import { useState, useEffect, useId } from "react";
import { useListArtists } from "@workspace/api-client-react";
import { Filter, Search, X } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { Badge } from "@/components/ui/badge";
import { ArtistCard } from "@/components/artist-card";
import { Skeleton } from "@/components/ui/skeleton";
import { PageSeo } from "@/components/page-seo";

export default function BrowseArtists() {
  const searchId = useId();
  const initialSearch = new URLSearchParams(window.location.search).get("search") ?? "";
  const [search, setSearch] = useState(initialSearch);
  const [debouncedSearch, setDebouncedSearch] = useState(initialSearch);
  const [maxPrice, setMaxPrice] = useState<number[]>([5000]);
  const [selectedCategory, setSelectedCategory] = useState<string | undefined>();
  const [showFilters, setShowFilters] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => setDebouncedSearch(search), 400);
    return () => clearTimeout(timer);
  }, [search]);

  const { data: artistsRaw, isLoading } = useListArtists({
    search: debouncedSearch || undefined,
    maxPrice: maxPrice[0],
    category: selectedCategory,
  });

  const categories = ["Music", "Photography", "Painting", "Dance", "Comedy", "Design"];
  const artists = Array.isArray(artistsRaw) ? artistsRaw : [];
  const resultCount = artists.length;

  return (
    <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 flex flex-col md:flex-row gap-8 min-h-screen">
      <PageSeo
        title="Browse Artists — Hire Musicians, Photographers & Performers"
        description="Search and filter hundreds of verified creative professionals. Musicians, photographers, painters, dancers, comedians and more. Compare portfolios, pricing, and reviews."
        canonical="/artists"
        schema={{
          "@context": "https://schema.org",
          "@type": "CollectionPage",
          "name": "Browse Artists | BookMeArtist",
          "description": "Browse and book verified creative professionals including musicians, photographers, dancers, and performers.",
          "url": "https://bookmeartist.replit.app/artists"
        }}
      />
      
      {/* Mobile filter toggle */}
      <div className="md:hidden flex gap-4">
        <Button 
          variant="outline" 
          className="flex-1"
          onClick={() => setShowFilters(!showFilters)}
          aria-expanded={showFilters}
          aria-controls="filter-sidebar"
        >
          <Filter className="w-4 h-4 mr-2" aria-hidden="true" />
          Filters
        </Button>
      </div>

      {/* Sidebar Filters */}
      <aside
        id="filter-sidebar"
        aria-label="Artist filters"
        className={`md:w-72 flex-shrink-0 ${showFilters ? 'block' : 'hidden md:block'}`}
      >
        <div className="sticky top-28 space-y-8 bg-card p-6 rounded-2xl border border-border shadow-sm">
          <div className="flex items-center justify-between md:hidden mb-4">
            <h2 className="font-bold text-lg">Filters</h2>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setShowFilters(false)}
              aria-label="Close filters"
            >
              <X className="w-4 h-4" aria-hidden="true" />
            </Button>
          </div>

          <div>
            <h3 className="font-bold mb-4 text-foreground" id="category-filter-label">Categories</h3>
            <div className="flex flex-wrap gap-2" role="group" aria-labelledby="category-filter-label">
              <button
                className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold transition-colors cursor-pointer ${!selectedCategory ? 'bg-primary text-primary-foreground border-primary' : 'border-border text-foreground hover:bg-accent hover:text-accent-foreground'}`}
                onClick={() => setSelectedCategory(undefined)}
                aria-pressed={!selectedCategory}
              >
                All
              </button>
              {categories.map(c => (
                <button
                  key={c}
                  className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold transition-colors cursor-pointer ${selectedCategory === c ? 'bg-primary text-primary-foreground border-primary' : 'border-border text-foreground hover:bg-accent hover:text-accent-foreground'}`}
                  onClick={() => setSelectedCategory(selectedCategory === c ? undefined : c)}
                  aria-pressed={selectedCategory === c}
                >
                  {c}
                </button>
              ))}
            </div>
          </div>

          <div>
            <h3 className="font-bold mb-1 text-foreground flex justify-between items-baseline" id="price-filter-label">
              <span>Max Price</span>
              <span className="text-primary tabular-nums text-right min-w-[4.5rem]" aria-live="polite" aria-atomic="true">${maxPrice[0].toLocaleString()}</span>
            </h3>
            <p className="text-xs text-muted-foreground mb-4">Drag to filter by budget</p>
            <Slider
              max={10000}
              step={100}
              value={maxPrice}
              onValueChange={setMaxPrice}
              aria-label="Maximum price filter"
              aria-valuemin={0}
              aria-valuemax={10000}
              aria-valuenow={maxPrice[0]}
              aria-valuetext={`$${maxPrice[0].toLocaleString()}`}
            />
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 min-w-0" aria-label="Artist search results">
        <div className="mb-8 flex flex-col sm:flex-row gap-4 justify-between items-start sm:items-center">
          <div>
            <h1 className="text-3xl font-display font-bold text-foreground">Explore Artists</h1>
            <p
              className="text-muted-foreground mt-1"
              aria-live="polite"
              aria-atomic="true"
            >
              {isLoading ? "Searching…" : `Found ${resultCount} talented professional${resultCount !== 1 ? "s" : ""}`}
            </p>
          </div>
          
          <div className="relative w-full sm:w-72">
            <label htmlFor={searchId} className="sr-only">Search artists by name</label>
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" aria-hidden="true" />
            <Input 
              id={searchId}
              placeholder="Search by name..." 
              className="pl-9 bg-card border-border"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              type="search"
            />
          </div>
        </div>

        {isLoading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6" aria-busy="true" aria-label="Loading artists">
            {[1, 2, 3, 4, 5, 6].map(i => (
              <div key={i} className="flex flex-col space-y-3" aria-hidden="true">
                <Skeleton className="h-[250px] w-full rounded-2xl" />
                <Skeleton className="h-4 w-[200px]" />
                <Skeleton className="h-4 w-[150px]" />
              </div>
            ))}
          </div>
        ) : artists && artists.length > 0 ? (
          <ul className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 list-none p-0" aria-label="Artist listings">
            {artists.map((artist) => (
              <li key={artist.id}>
                <ArtistCard artist={artist} />
              </li>
            ))}
          </ul>
        ) : (
          <div className="text-center py-24 bg-card rounded-3xl border border-dashed border-border mt-8" role="status">
            <Filter className="w-12 h-12 text-muted-foreground mx-auto mb-4 opacity-50" aria-hidden="true" />
            <h2 className="text-xl font-bold mb-2 text-foreground">No artists found</h2>
            <p className="text-muted-foreground mb-6">Try adjusting your filters or search query.</p>
            <Button 
              variant="outline" 
              onClick={() => {
                setSearch("");
                setDebouncedSearch("");
                setSelectedCategory(undefined);
                setMaxPrice([5000]);
              }}
            >
              Clear all filters
            </Button>
          </div>
        )}
      </main>
    </div>
  );
}
