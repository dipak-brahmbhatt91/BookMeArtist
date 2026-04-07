import { useState, useEffect, useId, useMemo } from "react";
import { useListArtists, useListCategories } from "@workspace/api-client-react";
import { Search, X, SlidersHorizontal, MapPin, Sparkles } from "lucide-react";
import { CURRENCY, formatPrice } from "@/lib/currency";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ArtistCard } from "@/components/artist-card";
import { Skeleton } from "@/components/ui/skeleton";
import { PageSeo } from "@/components/page-seo";

type SortOption = "rating" | "price_asc" | "price_desc" | "newest";

const AVAILABILITY_OPTIONS = [
  { value: "", label: "All" },
  { value: "available", label: "Available" },
  { value: "busy", label: "Busy" },
];

const SORT_OPTIONS: { value: SortOption; label: string }[] = [
  { value: "rating", label: "Top Rated" },
  { value: "price_asc", label: "Price: Low → High" },
  { value: "price_desc", label: "Price: High → Low" },
  { value: "newest", label: "Newest" },
];

function useDebounce<T>(value: T, delay: number): T {
  const [debounced, setDebounced] = useState(value);
  useEffect(() => {
    const t = setTimeout(() => setDebounced(value), delay);
    return () => clearTimeout(t);
  }, [value, delay]);
  return debounced;
}

export default function BrowseArtists() {
  const searchId = useId();
  const locationId = useId();

  const initialSearch = new URLSearchParams(window.location.search).get("search") ?? "";
  const [search, setSearch] = useState(initialSearch);
  const [selectedCategory, setSelectedCategory] = useState<string | undefined>();
  const [maxPrice, setMaxPrice] = useState<number[]>([CURRENCY.maxBudget]);
  const [location, setLocation] = useState("");
  const [availability, setAvailability] = useState("");
  const [featuredOnly, setFeaturedOnly] = useState(false);
  const [sortBy, setSortBy] = useState<SortOption>("rating");
  const [showFilters, setShowFilters] = useState(false);

  const debouncedSearch = useDebounce(search, 400);
  const debouncedLocation = useDebounce(location, 400);

  const { data: categoriesData } = useListCategories();

  const { data: artistsRaw, isLoading } = useListArtists({
    search: debouncedSearch || undefined,
    category: selectedCategory,
    maxPrice: maxPrice[0] < CURRENCY.maxBudget ? maxPrice[0] : undefined,
    location: debouncedLocation || undefined,
    featured: featuredOnly ? true : undefined,
    availability: availability || undefined,
  });

  const artists = useMemo(() => {
    const arr = Array.isArray(artistsRaw) ? [...artistsRaw] : [];
    return arr.sort((a, b) => {
      if (sortBy === "price_asc") return a.basePrice - b.basePrice;
      if (sortBy === "price_desc") return b.basePrice - a.basePrice;
      if (sortBy === "newest") return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
      return b.rating - a.rating;
    });
  }, [artistsRaw, sortBy]);

  const activeFilters = useMemo(() => {
    const chips: { key: string; label: string }[] = [];
    if (selectedCategory) {
      const cat = categoriesData?.find(c => c.slug === selectedCategory);
      chips.push({ key: "category", label: `${cat?.icon ?? ""} ${cat?.name ?? selectedCategory}`.trim() });
    }
    if (maxPrice[0] < CURRENCY.maxBudget) {
      chips.push({ key: "price", label: `Up to ${formatPrice(maxPrice[0])}` });
    }
    if (debouncedLocation) chips.push({ key: "location", label: `📍 ${debouncedLocation}` });
    if (availability) chips.push({ key: "availability", label: availability.charAt(0).toUpperCase() + availability.slice(1) });
    if (featuredOnly) chips.push({ key: "featured", label: "⭐ Featured Only" });
    return chips;
  }, [selectedCategory, maxPrice, debouncedLocation, availability, featuredOnly, categoriesData]);

  function clearFilter(key: string) {
    if (key === "category") setSelectedCategory(undefined);
    if (key === "price") setMaxPrice([CURRENCY.maxBudget]);
    if (key === "location") setLocation("");
    if (key === "availability") setAvailability("");
    if (key === "featured") setFeaturedOnly(false);
  }

  function clearAll() {
    setSearch("");
    setSelectedCategory(undefined);
    setMaxPrice([CURRENCY.maxBudget]);
    setLocation("");
    setAvailability("");
    setFeaturedOnly(false);
    setSortBy("rating");
  }

  // Shared filter content — inlined directly (not a nested component) to preserve input focus
  const filterContent = (
    <div className="space-y-7">
      {/* Categories */}
      <div>
        <h3 className="font-bold mb-3 text-white text-sm uppercase tracking-wider">Category</h3>
        <div className="flex flex-wrap gap-2">
          <button
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold border transition-colors ${
              !selectedCategory
                ? "bg-primary text-white border-primary"
                : "border-white/10 text-muted-foreground hover:border-primary/40 hover:text-white"
            }`}
            onClick={() => setSelectedCategory(undefined)}
          >
            All
          </button>
          {categoriesData?.map(cat => (
            <button
              key={cat.id}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold border transition-colors ${
                selectedCategory === cat.slug
                  ? "bg-primary text-white border-primary"
                  : "border-white/10 text-muted-foreground hover:border-primary/40 hover:text-white"
              }`}
              onClick={() => setSelectedCategory(selectedCategory === cat.slug ? undefined : cat.slug)}
            >
              <span>{cat.icon}</span>
              {cat.name}
            </button>
          ))}
        </div>
      </div>

      {/* Max Price */}
      <div>
        <h3 className="font-bold mb-1 text-white text-sm uppercase tracking-wider flex justify-between items-baseline">
          <span>Max Budget</span>
          <span className="text-primary font-bold text-xs normal-case">
            {maxPrice[0] >= CURRENCY.maxBudget ? "Any price" : `Up to ${formatPrice(maxPrice[0])}`}
          </span>
        </h3>
        <p className="text-xs text-muted-foreground mb-4">Filter by artist base price</p>
        <Slider
          min={0}
          max={CURRENCY.maxBudget}
          step={CURRENCY.budgetStep}
          value={maxPrice}
          onValueChange={setMaxPrice}
          aria-label="Maximum price filter"
        />
        <div className="flex justify-between text-xs text-muted-foreground mt-2">
          <span>{CURRENCY.symbol}0</span>
          <span>{formatPrice(CURRENCY.maxBudget)}+</span>
        </div>
      </div>

      {/* Location */}
      <div>
        <h3 className="font-bold mb-3 text-white text-sm uppercase tracking-wider">Location</h3>
        <div className="relative">
          <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none" />
          <Input
            id={locationId}
            value={location}
            onChange={e => setLocation(e.target.value)}
            placeholder="City, state, or country…"
            className="pl-9 bg-[#0f0f1a] border-white/10 text-white placeholder:text-muted-foreground text-sm"
          />
          {location && (
            <button
              type="button"
              className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-white"
              onClick={() => setLocation("")}
              tabIndex={-1}
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      </div>

      {/* Availability */}
      <div>
        <h3 className="font-bold mb-3 text-white text-sm uppercase tracking-wider">Availability</h3>
        <div className="flex gap-2">
          {AVAILABILITY_OPTIONS.map(opt => (
            <button
              key={opt.value}
              onClick={() => setAvailability(opt.value)}
              className={`flex-1 py-1.5 rounded-lg text-xs font-semibold border transition-colors ${
                availability === opt.value
                  ? opt.value === "available"
                    ? "bg-emerald-500/20 text-emerald-400 border-emerald-500/40"
                    : opt.value === "busy"
                    ? "bg-amber-500/20 text-amber-400 border-amber-500/40"
                    : "bg-primary/20 text-primary border-primary/40"
                  : "border-white/10 text-muted-foreground hover:border-white/20 hover:text-white"
              }`}
            >
              {opt.label}
            </button>
          ))}
        </div>
      </div>

      {/* Featured Only */}
      <div className="flex items-center justify-between py-2 px-3 rounded-xl bg-white/5 border border-white/10">
        <div className="flex items-center gap-2">
          <Sparkles className="w-4 h-4 text-accent" />
          <span className="text-sm font-semibold text-white">Featured Only</span>
        </div>
        <Switch
          checked={featuredOnly}
          onCheckedChange={setFeaturedOnly}
          aria-label="Show featured artists only"
        />
      </div>
    </div>
  );

  return (
    <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 min-h-screen">
      <PageSeo
        title="Browse Artists — Hire Musicians, Photographers & Performers"
        description="Search and filter hundreds of verified creative professionals. Musicians, photographers, painters, dancers, comedians and more. Compare portfolios, pricing, and reviews."
        canonical="/artists"
        schema={{
          "@context": "https://schema.org",
          "@type": "CollectionPage",
          "name": "Browse Artists | BookMeArtist",
          "description": "Browse and book verified creative professionals including musicians, photographers, dancers, and performers.",
          "url": "https://bookmeartist.onrender.com/artists"
        }}
      />

      {/* Page Header */}
      <div className="mb-8">
        <h1 className="text-3xl sm:text-4xl font-display font-extrabold text-white mb-2">Explore Artists</h1>
        <p className="text-muted-foreground text-base sm:text-lg">Find and book the perfect creative professional for your next project.</p>
      </div>

      {/* Top bar: Search + Mobile filter toggle + Sort */}
      <div className="flex gap-3 mb-6 items-center">
        <div className="relative flex-1">
          <label htmlFor={searchId} className="sr-only">Search artists</label>
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none" aria-hidden="true" />
          <Input
            id={searchId}
            placeholder="Search by name, specialty, or location…"
            className="pl-9 bg-card border-white/10 text-white placeholder:text-muted-foreground"
            value={search}
            onChange={e => setSearch(e.target.value)}
            type="search"
          />
          {search && (
            <button
              type="button"
              className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-white"
              onClick={() => setSearch("")}
              tabIndex={-1}
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>

        {/* Mobile filter button */}
        <Button
          variant="outline"
          className="md:hidden border-white/10 text-white hover:bg-white/10 relative shrink-0"
          onClick={() => setShowFilters(true)}
          aria-label="Open filters"
        >
          <SlidersHorizontal className="w-4 h-4 mr-2" />
          Filters
          {activeFilters.length > 0 && (
            <span className="absolute -top-1.5 -right-1.5 w-5 h-5 rounded-full bg-primary text-white text-[10px] font-bold flex items-center justify-center">
              {activeFilters.length}
            </span>
          )}
        </Button>

        {/* Sort */}
        <Select value={sortBy} onValueChange={(v) => setSortBy(v as SortOption)}>
          <SelectTrigger className="w-auto sm:w-48 bg-card border-white/10 text-white shrink-0">
            <SelectValue />
          </SelectTrigger>
          <SelectContent className="bg-[#0f0f1a] border-white/10">
            {SORT_OPTIONS.map(opt => (
              <SelectItem key={opt.value} value={opt.value} className="text-white">
                {opt.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="flex gap-8">
        {/* Desktop Sidebar */}
        <aside className="hidden md:block w-72 flex-shrink-0">
          <div className="sticky top-24 bg-card border border-white/10 rounded-2xl p-6">
            <div className="flex items-center gap-2 mb-6 pb-4 border-b border-white/10">
              <SlidersHorizontal className="w-4 h-4 text-primary" />
              <h2 className="font-bold text-white">Filters</h2>
              {activeFilters.length > 0 && (
                <button
                  className="ml-auto text-xs text-muted-foreground hover:text-primary transition-colors underline underline-offset-2"
                  onClick={clearAll}
                >
                  Reset all
                </button>
              )}
            </div>
            {filterContent}
          </div>
        </aside>

        {/* Mobile Filter Drawer */}
        {showFilters && (
          <>
            <div
              className="fixed inset-0 z-40 bg-black/60 backdrop-blur-sm md:hidden"
              onClick={() => setShowFilters(false)}
            />
            <div className="fixed inset-y-0 left-0 z-50 w-[85vw] max-w-sm bg-[#0a0a0f] border-r border-white/10 flex flex-col md:hidden">
              <div className="flex items-center justify-between p-5 border-b border-white/10">
                <div className="flex items-center gap-2">
                  <SlidersHorizontal className="w-4 h-4 text-primary" />
                  <h2 className="font-bold text-white">Filters</h2>
                </div>
                <button onClick={() => setShowFilters(false)} className="text-muted-foreground hover:text-white">
                  <X className="w-5 h-5" />
                </button>
              </div>
              <div className="flex-1 overflow-y-auto p-5">
                {filterContent}
              </div>
              <div className="p-5 border-t border-white/10 flex gap-3">
                <Button variant="outline" className="flex-1 border-white/10 text-white" onClick={clearAll}>
                  Reset
                </Button>
                <Button className="flex-1 bg-primary hover:bg-primary/90 text-white" onClick={() => setShowFilters(false)}>
                  Apply Filters
                </Button>
              </div>
            </div>
          </>
        )}

        {/* Main Content */}
        <main className="flex-1 min-w-0" aria-label="Artist search results">
          <div className="mb-4">
            <p className="text-muted-foreground text-sm" aria-live="polite" aria-atomic="true">
              {isLoading ? "Searching…" : (
                <span>
                  <span className="font-semibold text-white">{artists.length}</span>
                  {" "}artist{artists.length !== 1 ? "s" : ""} found
                </span>
              )}
            </p>
          </div>

          {/* Active filter chips */}
          {activeFilters.length > 0 && (
            <div className="flex flex-wrap gap-2 mb-5">
              {activeFilters.map(f => (
                <button
                  key={f.key}
                  onClick={() => clearFilter(f.key)}
                  className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-primary/10 border border-primary/30 text-primary text-xs font-semibold hover:bg-primary/20 transition-colors"
                >
                  {f.label}
                  <X className="w-3 h-3" />
                </button>
              ))}
              {activeFilters.length > 1 && (
                <button
                  onClick={clearAll}
                  className="inline-flex items-center gap-1 px-3 py-1 rounded-full border border-white/10 text-muted-foreground text-xs font-semibold hover:text-white hover:border-white/20 transition-colors"
                >
                  Clear all
                </button>
              )}
            </div>
          )}

          {isLoading ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6" aria-busy="true">
              {[1, 2, 3, 4, 5, 6].map(i => (
                <div key={i} className="flex flex-col space-y-3" aria-hidden="true">
                  <Skeleton className="h-[260px] w-full rounded-2xl bg-white/5" />
                  <Skeleton className="h-4 w-[200px] bg-white/5" />
                  <Skeleton className="h-4 w-[150px] bg-white/5" />
                </div>
              ))}
            </div>
          ) : artists.length > 0 ? (
            <ul className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 list-none p-0" aria-label="Artist listings">
              {artists.map(artist => (
                <li key={artist.id}>
                  <ArtistCard artist={artist} />
                </li>
              ))}
            </ul>
          ) : (
            <div className="text-center py-24 bg-card rounded-3xl border border-dashed border-white/10 mt-4" role="status">
              <Search className="w-12 h-12 text-muted-foreground mx-auto mb-4 opacity-30" />
              <h2 className="text-xl font-bold mb-2 text-white">No artists found</h2>
              <p className="text-muted-foreground mb-6 max-w-sm mx-auto">Try adjusting your filters or search query to find the right creative.</p>
              <Button variant="outline" className="border-white/10 text-white hover:bg-white/10" onClick={clearAll}>
                Clear all filters
              </Button>
            </div>
          )}
        </main>
      </div>
    </div>
  );
}
