import { useState } from "react";
import { Link, useLocation } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { motion } from "framer-motion";
import { Search, Tag, Clock, User, ChevronLeft, ChevronRight, BookOpen, Calendar } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { PageSeo } from "@/components/page-seo";
import { apiUrl } from "@/lib/api-base";

const BASE_URL = "https://bookmeartist.replit.app";

// ─── Types ─────────────────────────────────────────────────────────────────

type BlogPostSummary = {
  id: number;
  title: string;
  slug: string;
  excerpt: string;
  featuredImage: string;
  author: string;
  category: string;
  tags: string[];
  readingTime: number;
  publishedAt: string | null;
  updatedAt: string;
};

type Pagination = {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
};

// ─── Hooks ─────────────────────────────────────────────────────────────────

function useBlogPosts(page: number, category: string, search: string) {
  const params = new URLSearchParams({ page: String(page), limit: "9" });
  if (category) params.set("category", category);
  if (search) params.set("search", search);

  return useQuery<{ posts: BlogPostSummary[]; pagination: Pagination }>({
    queryKey: ["blog", page, category, search],
    queryFn: () => fetch(apiUrl(`/api/blog?${params}`)).then((r) => r.json()),
    staleTime: 60_000,
  });
}

function useBlogCategories() {
  return useQuery<string[]>({
    queryKey: ["blog-categories"],
    queryFn: () => fetch(apiUrl("/api/blog/categories")).then((r) => r.json()),
    staleTime: 120_000,
  });
}

// ─── Components ────────────────────────────────────────────────────────────

function BlogCard({ post, index }: { post: BlogPostSummary; index: number }) {
  const date = post.publishedAt
    ? new Date(post.publishedAt).toLocaleDateString("en-US", {
        year: "numeric",
        month: "long",
        day: "numeric",
      })
    : null;

  return (
    <motion.article
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.05 }}
      className="group bg-card border border-white/10 rounded-2xl overflow-hidden hover:border-primary/40 transition-all duration-300 hover:shadow-[0_0_30px_rgba(99,102,241,0.1)] flex flex-col"
    >
      <Link href={`/blog/${post.slug}`} className="block overflow-hidden aspect-[16/9] bg-white/5">
        {post.featuredImage ? (
          <img
            src={post.featuredImage}
            alt={post.title}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
            loading="lazy"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <BookOpen className="w-12 h-12 text-white/20" />
          </div>
        )}
      </Link>

      <div className="p-6 flex flex-col flex-1 gap-3">
        <div className="flex items-center gap-2 flex-wrap">
          <Badge variant="secondary" className="capitalize text-xs">
            {post.category}
          </Badge>
          {post.tags.slice(0, 2).map((tag) => (
            <Badge key={tag} variant="outline" className="text-xs text-muted-foreground border-white/10">
              #{tag}
            </Badge>
          ))}
        </div>

        <Link href={`/blog/${post.slug}`}>
          <h2 className="font-display font-bold text-lg text-white leading-snug group-hover:text-primary transition-colors line-clamp-2">
            {post.title}
          </h2>
        </Link>

        {post.excerpt && (
          <p className="text-muted-foreground text-sm leading-relaxed line-clamp-3">{post.excerpt}</p>
        )}

        <div className="mt-auto pt-3 border-t border-white/5 flex items-center justify-between text-xs text-muted-foreground">
          <span className="flex items-center gap-1.5">
            <User className="w-3.5 h-3.5" />
            {post.author}
          </span>
          <div className="flex items-center gap-3">
            {date && (
              <span className="flex items-center gap-1">
                <Calendar className="w-3.5 h-3.5" />
                {date}
              </span>
            )}
            <span className="flex items-center gap-1">
              <Clock className="w-3.5 h-3.5" />
              {post.readingTime} min read
            </span>
          </div>
        </div>
      </div>
    </motion.article>
  );
}

function Skeleton() {
  return (
    <div className="bg-card border border-white/10 rounded-2xl overflow-hidden animate-pulse">
      <div className="aspect-[16/9] bg-white/5" />
      <div className="p-6 space-y-3">
        <div className="h-4 w-20 bg-white/10 rounded" />
        <div className="h-5 w-3/4 bg-white/10 rounded" />
        <div className="h-4 w-full bg-white/10 rounded" />
        <div className="h-4 w-2/3 bg-white/10 rounded" />
      </div>
    </div>
  );
}

// ─── Page ──────────────────────────────────────────────────────────────────

export default function BlogIndex() {
  const [, navigate] = useLocation();
  const [page, setPage] = useState(1);
  const [category, setCategory] = useState("");
  const [search, setSearch] = useState("");
  const [searchInput, setSearchInput] = useState("");

  const { data, isLoading } = useBlogPosts(page, category, search);
  const { data: categories } = useBlogCategories();

  function handleSearch(e: React.FormEvent) {
    e.preventDefault();
    setSearch(searchInput);
    setPage(1);
  }

  function handleCategory(cat: string) {
    setCategory(cat === category ? "" : cat);
    setPage(1);
  }

  const breadcrumbSchema = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      { "@type": "ListItem", position: 1, name: "Home", item: BASE_URL },
      { "@type": "ListItem", position: 2, name: "Blog", item: `${BASE_URL}/blog` },
    ],
  };

  const blogSchema = {
    "@context": "https://schema.org",
    "@type": "Blog",
    name: "BookMeArtist Blog",
    description: "Tips, guides, and insights for booking and hiring creative talent.",
    url: `${BASE_URL}/blog`,
    publisher: {
      "@type": "Organization",
      name: "BookMeArtist",
      url: BASE_URL,
    },
  };

  return (
    <>
      <PageSeo
        title="Blog — Tips & Insights for Booking Creative Talent"
        description="Explore guides, tips, and insights on hiring musicians, photographers, dancers, and performers. Your resource for booking world-class creative talent."
        canonical="/blog"
        type="website"
        schema={[breadcrumbSchema, blogSchema]}
      />

      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 sm:py-16">
        {/* Header */}
        <div className="text-center mb-8 sm:mb-14">
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 border border-primary/20 text-primary text-sm font-semibold mb-4"
          >
            <BookOpen className="w-4 h-4" />
            BookMeArtist Blog
          </motion.div>
          <motion.h1
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.05 }}
            className="font-display font-extrabold text-2xl sm:text-4xl md:text-5xl text-white mb-4"
          >
            Tips, Guides & Insights
          </motion.h1>
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.1 }}
            className="text-muted-foreground text-lg max-w-2xl mx-auto"
          >
            Everything you need to know about booking world-class creative talent for your next event or project.
          </motion.p>
        </div>

        {/* Search + Filters */}
        <div className="flex flex-col md:flex-row gap-4 mb-10">
          <form onSubmit={handleSearch} className="flex gap-2 flex-1">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                value={searchInput}
                onChange={(e) => setSearchInput(e.target.value)}
                placeholder="Search articles…"
                className="pl-9 bg-white/5 border-white/10"
              />
            </div>
            <Button type="submit" variant="secondary">Search</Button>
            {search && (
              <Button
                type="button"
                variant="ghost"
                onClick={() => { setSearch(""); setSearchInput(""); setPage(1); }}
              >
                Clear
              </Button>
            )}
          </form>

          {categories && categories.length > 0 && (
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-muted-foreground text-sm flex items-center gap-1">
                <Tag className="w-3.5 h-3.5" /> Category:
              </span>
              {categories.map((cat) => (
                <button
                  key={cat}
                  onClick={() => handleCategory(cat)}
                  className={`px-3 py-1 rounded-full text-xs font-semibold border transition-colors capitalize ${
                    category === cat
                      ? "bg-primary border-primary text-white"
                      : "border-white/10 text-muted-foreground hover:border-primary/40 hover:text-white"
                  }`}
                >
                  {cat}
                </button>
              ))}
              {category && (
                <button
                  onClick={() => { setCategory(""); setPage(1); }}
                  className="text-xs text-muted-foreground underline hover:text-white"
                >
                  Clear
                </button>
              )}
            </div>
          )}
        </div>

        {/* Grid */}
        {isLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {Array.from({ length: 6 }).map((_, i) => <Skeleton key={i} />)}
          </div>
        ) : !data?.posts.length ? (
          <div className="text-center py-24 text-muted-foreground">
            <BookOpen className="w-12 h-12 mx-auto mb-4 opacity-30" />
            <p className="text-lg font-semibold text-white mb-1">No articles found</p>
            <p>Try a different search or category.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {data.posts.map((post, i) => (
              <BlogCard key={post.id} post={post} index={i} />
            ))}
          </div>
        )}

        {/* Pagination */}
        {data && data.pagination.totalPages > 1 && (
          <div className="flex items-center justify-center gap-3 mt-12">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page === 1}
              className="gap-1 border-white/10"
            >
              <ChevronLeft className="w-4 h-4" /> Previous
            </Button>
            <span className="text-muted-foreground text-sm">
              Page {page} of {data.pagination.totalPages}
            </span>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setPage((p) => Math.min(data.pagination.totalPages, p + 1))}
              disabled={page === data.pagination.totalPages}
              className="gap-1 border-white/10"
            >
              Next <ChevronRight className="w-4 h-4" />
            </Button>
          </div>
        )}
      </section>
    </>
  );
}
