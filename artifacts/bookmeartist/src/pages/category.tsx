import { useParams } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { MapPin, Star, SlidersHorizontal } from "lucide-react";
import { PageSeo } from "@/components/page-seo";
import { ArtistCard } from "@/components/artist-card";
import { Skeleton } from "@/components/ui/skeleton";
import { APP_BASE_URL, apiUrl } from "@/lib/api-base";
import ArtistProfile from "@/pages/artist-profile";

type Category = { id: number; name: string; slug: string; icon: string };

export default function CategoryPage() {
  const params = useParams<{ slug: string }>();
  const slug = params.slug || "";

  // Fetch all categories to resolve slug → name
  const { data: categories, isLoading: catsLoading } = useQuery<Category[]>({
    queryKey: ["categories"],
    queryFn: () => fetch(apiUrl("/api/categories")).then(r => r.json()),
    staleTime: 5 * 60_000,
  });

  const category = categories?.find(c => c.slug === slug);
  const isKnownCategory = !catsLoading && categories !== undefined && !!category;
  const isNotCategory   = !catsLoading && categories !== undefined && !category;

  // Fetch artists for this category
  const { data: artists, isLoading: artistsLoading } = useQuery<any[]>({
    queryKey: ["artists", "category", slug],
    queryFn: () => fetch(apiUrl(`/api/artists?category=${encodeURIComponent(slug)}`)).then(r => r.json()),
    enabled: isKnownCategory,
  });

  // If slug doesn't match any category, delegate to ArtistProfile
  if (isNotCategory) return <ArtistProfile />;

  // Loading state
  if (catsLoading || !category) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 space-y-6">
        <Skeleton className="h-10 w-64 rounded-xl" />
        <Skeleton className="h-6 w-96 rounded-lg" />
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 mt-8">
          {[...Array(8)].map((_, i) => <Skeleton key={i} className="h-80 rounded-2xl" />)}
        </div>
      </div>
    );
  }

  const categoryName = category.name;
  const pageTitle    = `Hire ${categoryName} in India`;
  const description  = `Book verified ${categoryName.toLowerCase()} for weddings, corporate events, parties and more across India. Browse ${artists?.length ?? ""} artists, check availability and pricing.`.trim();
  const canonicalUrl = `/artists/${slug}`;
  const fullUrl      = `${APP_BASE_URL}/artists/${slug}`;

  const itemListSchema = artists && artists.length > 0 ? {
    "@context": "https://schema.org",
    "@type": "ItemList",
    "name": `${categoryName} for Hire in India`,
    "url": fullUrl,
    "numberOfItems": artists.length,
    "itemListElement": artists.map((a: any, i: number) => ({
      "@type": "ListItem",
      "position": i + 1,
      "name": a.name,
      "url": `${APP_BASE_URL}/artists/${a.slug || a.id}`,
    })),
  } : undefined;

  const breadcrumbSchema = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    "itemListElement": [
      { "@type": "ListItem", "position": 1, "name": "Home",    "item": APP_BASE_URL },
      { "@type": "ListItem", "position": 2, "name": "Artists", "item": `${APP_BASE_URL}/artists` },
      { "@type": "ListItem", "position": 3, "name": categoryName, "item": fullUrl },
    ],
  };

  return (
    <>
      <PageSeo
        title={pageTitle}
        description={description}
        canonical={canonicalUrl}
        type="website"
        schema={itemListSchema ? [itemListSchema, breadcrumbSchema] : breadcrumbSchema}
      />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">

        {/* Header */}
        <div className="mb-10">
          <div className="flex items-center gap-3 mb-3">
            <span className="text-4xl" aria-hidden="true">{category.icon}</span>
            <h1 className="font-display font-extrabold text-3xl sm:text-4xl text-white">
              {categoryName} for Hire
            </h1>
          </div>
          <p className="text-muted-foreground text-base max-w-2xl">{description}</p>

          {/* Stats strip */}
          <div className="flex flex-wrap gap-4 mt-5 text-sm text-muted-foreground">
            {artists && (
              <span className="flex items-center gap-1.5">
                <SlidersHorizontal className="w-4 h-4 text-primary" />
                {artists.length} verified {categoryName.toLowerCase()}
              </span>
            )}
            <span className="flex items-center gap-1.5">
              <MapPin className="w-4 h-4 text-primary" />
              Across India
            </span>
            <span className="flex items-center gap-1.5">
              <Star className="w-4 h-4 text-primary fill-primary" />
              All profiles verified
            </span>
          </div>
        </div>

        {/* Artist grid */}
        {artistsLoading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {[...Array(8)].map((_, i) => <Skeleton key={i} className="h-80 rounded-2xl" />)}
          </div>
        ) : artists && artists.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {artists.map((artist: any) => (
              <ArtistCard key={artist.id} artist={artist} />
            ))}
          </div>
        ) : (
          <div className="text-center py-20 text-muted-foreground">
            <span className="text-5xl mb-4 block">{category.icon}</span>
            <p className="text-lg font-semibold text-white mb-2">No {categoryName} listed yet</p>
            <p className="text-sm">Check back soon — we're growing our artist roster.</p>
          </div>
        )}

      </div>
    </>
  );
}
