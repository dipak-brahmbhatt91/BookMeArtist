import { useRoute, Link } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { motion } from "framer-motion";
import {
  Clock,
  User,
  Calendar,
  Tag,
  ChevronRight,
  Twitter,
  Linkedin,
  Facebook,
  BookOpen,
  ArrowLeft,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { PageSeo } from "@/components/page-seo";
import { apiUrl } from "@/lib/api-base";

import { APP_BASE_URL } from "@/lib/api-base";
const BASE_URL = APP_BASE_URL;

// ─── Types ─────────────────────────────────────────────────────────────────

type BlogPost = {
  id: number;
  title: string;
  slug: string;
  excerpt: string;
  content: string;
  featuredImage: string;
  author: string;
  authorBio: string;
  category: string;
  tags: string[];
  status: string;
  metaTitle: string;
  metaDescription: string;
  ogImage: string;
  canonicalUrl: string;
  noindex: boolean;
  readingTime: number;
  publishedAt: string | null;
  updatedAt: string;
  related: RelatedPost[];
};

type RelatedPost = {
  id: number;
  title: string;
  slug: string;
  excerpt: string;
  featuredImage: string;
  author: string;
  publishedAt: string | null;
  readingTime: number;
};

// ─── Hook ──────────────────────────────────────────────────────────────────

function useBlogPost(slug: string) {
  return useQuery<BlogPost>({
    queryKey: ["blog-post", slug],
    queryFn: () => fetch(apiUrl(`/api/blog/${slug}`)).then((r) => {
      if (!r.ok) throw new Error("Not found");
      return r.json();
    }),
    retry: false,
    staleTime: 60_000,
  });
}

// ─── Components ────────────────────────────────────────────────────────────

function ShareButtons({ url, title }: { url: string; title: string }) {
  const encoded = encodeURIComponent(url);
  const text = encodeURIComponent(title);

  return (
    <div className="flex items-center gap-3">
      <span className="text-sm text-muted-foreground font-semibold">Share:</span>
      <a
        href={`https://twitter.com/intent/tweet?url=${encoded}&text=${text}`}
        target="_blank"
        rel="noopener noreferrer"
        aria-label="Share on Twitter/X"
        className="w-9 h-9 flex items-center justify-center rounded-full bg-white/5 border border-white/10 hover:bg-primary/20 hover:border-primary/40 transition-colors text-muted-foreground hover:text-white"
      >
        <Twitter className="w-4 h-4" />
      </a>
      <a
        href={`https://www.linkedin.com/shareArticle?mini=true&url=${encoded}&title=${text}`}
        target="_blank"
        rel="noopener noreferrer"
        aria-label="Share on LinkedIn"
        className="w-9 h-9 flex items-center justify-center rounded-full bg-white/5 border border-white/10 hover:bg-primary/20 hover:border-primary/40 transition-colors text-muted-foreground hover:text-white"
      >
        <Linkedin className="w-4 h-4" />
      </a>
      <a
        href={`https://www.facebook.com/sharer/sharer.php?u=${encoded}`}
        target="_blank"
        rel="noopener noreferrer"
        aria-label="Share on Facebook"
        className="w-9 h-9 flex items-center justify-center rounded-full bg-white/5 border border-white/10 hover:bg-primary/20 hover:border-primary/40 transition-colors text-muted-foreground hover:text-white"
      >
        <Facebook className="w-4 h-4" />
      </a>
    </div>
  );
}

function RelatedCard({ post }: { post: RelatedPost }) {
  return (
    <Link href={`/blog/${post.slug}`}>
      <article className="group bg-card border border-white/10 rounded-xl overflow-hidden hover:border-primary/40 transition-all duration-300 flex gap-4 p-4">
        {post.featuredImage && (
          <div className="w-20 h-20 flex-shrink-0 rounded-lg overflow-hidden bg-white/5">
            <img
              src={post.featuredImage}
              alt={post.title}
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
              loading="lazy"
            />
          </div>
        )}
        <div className="flex-1 min-w-0">
          <h3 className="font-semibold text-white text-sm leading-snug group-hover:text-primary transition-colors line-clamp-2 mb-1">
            {post.title}
          </h3>
          <span className="text-xs text-muted-foreground flex items-center gap-1">
            <Clock className="w-3 h-3" />
            {post.readingTime} min read
          </span>
        </div>
      </article>
    </Link>
  );
}

// ─── Page ──────────────────────────────────────────────────────────────────

export default function BlogPost() {
  const [, params] = useRoute("/blog/:slug");
  const slug = params?.slug ?? "";
  const { data: post, isLoading, isError } = useBlogPost(slug);

  if (isLoading) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-16 animate-pulse space-y-6">
        <div className="h-8 w-2/3 bg-white/10 rounded" />
        <div className="h-64 bg-white/5 rounded-2xl" />
        <div className="space-y-3">
          {[...Array(8)].map((_, i) => <div key={i} className="h-4 bg-white/10 rounded" />)}
        </div>
      </div>
    );
  }

  if (isError || !post) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-24 text-center">
        <BookOpen className="w-16 h-16 mx-auto mb-4 text-muted-foreground opacity-30" />
        <h1 className="text-2xl font-bold text-white mb-2">Article Not Found</h1>
        <p className="text-muted-foreground mb-6">The article you're looking for doesn't exist or has been removed.</p>
        <Link href="/blog">
          <Button variant="secondary" className="gap-2">
            <ArrowLeft className="w-4 h-4" /> Back to Blog
          </Button>
        </Link>
      </div>
    );
  }

  const postUrl = `${BASE_URL}/blog/${post.slug}`;
  const seoTitle = post.metaTitle || post.title;
  const seoDescription = post.metaDescription || post.excerpt;
  const seoImage = post.ogImage || post.featuredImage || undefined;
  const canonicalPath = post.canonicalUrl || `/blog/${post.slug}`;

  const publishedDate = post.publishedAt ? new Date(post.publishedAt).toISOString() : undefined;
  const modifiedDate = new Date(post.updatedAt).toISOString();
  const displayDate = post.publishedAt
    ? new Date(post.publishedAt).toLocaleDateString("en-US", {
        year: "numeric",
        month: "long",
        day: "numeric",
      })
    : null;

  // JSON-LD Article schema
  const articleSchema = {
    "@context": "https://schema.org",
    "@type": "Article",
    headline: post.title,
    description: post.excerpt,
    url: postUrl,
    ...(publishedDate && { datePublished: publishedDate }),
    dateModified: modifiedDate,
    author: {
      "@type": "Person",
      name: post.author,
      ...(post.authorBio && { description: post.authorBio }),
    },
    publisher: {
      "@type": "Organization",
      name: "BookMeArtist",
      url: BASE_URL,
      logo: {
        "@type": "ImageObject",
        url: `${BASE_URL}/favicon.svg`,
      },
    },
    ...(seoImage && {
      image: {
        "@type": "ImageObject",
        url: seoImage,
        width: 1200,
        height: 630,
      },
    }),
    keywords: post.tags.join(", "),
    articleSection: post.category,
    inLanguage: "en-US",
    mainEntityOfPage: {
      "@type": "WebPage",
      "@id": postUrl,
    },
  };

  const breadcrumbSchema = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      { "@type": "ListItem", position: 1, name: "Home", item: BASE_URL },
      { "@type": "ListItem", position: 2, name: "Blog", item: `${BASE_URL}/blog` },
      { "@type": "ListItem", position: 3, name: post.title, item: postUrl },
    ],
  };

  return (
    <>
      <PageSeo
        title={seoTitle}
        description={seoDescription}
        canonical={canonicalPath}
        image={seoImage}
        type="article"
        noindex={post.noindex}
        schema={[articleSchema, breadcrumbSchema]}
      />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        {/* Breadcrumb */}
        <nav aria-label="Breadcrumb" className="flex items-center gap-1.5 text-sm text-muted-foreground mb-8">
          <Link href="/" className="hover:text-white transition-colors">Home</Link>
          <ChevronRight className="w-3.5 h-3.5" />
          <Link href="/blog" className="hover:text-white transition-colors">Blog</Link>
          <ChevronRight className="w-3.5 h-3.5" />
          <span className="text-white truncate max-w-xs">{post.title}</span>
        </nav>

        <div className="grid grid-cols-1 lg:grid-cols-[1fr_320px] gap-10">
          {/* Main content */}
          <main>
            <motion.article
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
            >
              {/* Meta */}
              <div className="flex items-center gap-2 flex-wrap mb-5">
                <Badge variant="secondary" className="capitalize">{post.category}</Badge>
                {post.tags.map((tag) => (
                  <Link key={tag} href={`/blog?tag=${encodeURIComponent(tag)}`}>
                    <Badge variant="outline" className="border-white/10 text-muted-foreground hover:text-white hover:border-primary/40 transition-colors cursor-pointer">
                      <Tag className="w-3 h-3 mr-1" />#{tag}
                    </Badge>
                  </Link>
                ))}
              </div>

              {/* Title */}
              <h1 className="font-display font-extrabold text-2xl sm:text-3xl md:text-4xl lg:text-5xl text-white leading-tight mb-6">
                {post.title}
              </h1>

              {/* By-line */}
              <div className="flex flex-wrap items-center gap-x-4 gap-y-2 text-sm text-muted-foreground mb-8 pb-8 border-b border-white/10">
                <span className="flex items-center gap-1.5">
                  <User className="w-4 h-4" />
                  <span className="text-white font-semibold">{post.author}</span>
                </span>
                {displayDate && (
                  <span className="flex items-center gap-1.5">
                    <Calendar className="w-4 h-4" />
                    <time dateTime={post.publishedAt!}>{displayDate}</time>
                  </span>
                )}
                <span className="flex items-center gap-1.5">
                  <Clock className="w-4 h-4" />
                  {post.readingTime} min read
                </span>
              </div>

              {/* Featured image */}
              {post.featuredImage && (
                <div className="rounded-2xl overflow-hidden mb-10 aspect-[16/9] bg-white/5">
                  <img
                    src={post.featuredImage}
                    alt={post.title}
                    className="w-full h-full object-cover"
                  />
                </div>
              )}

              {/* Content */}
              {post.content ? (
                <div
                  className="prose prose-invert prose-base sm:prose-lg max-w-none overflow-x-hidden break-words
                    prose-headings:font-display prose-headings:text-white
                    prose-h2:text-xl sm:prose-h2:text-2xl prose-h3:text-lg sm:prose-h3:text-xl
                    prose-p:text-muted-foreground prose-p:leading-relaxed
                    prose-a:text-primary prose-a:no-underline hover:prose-a:underline
                    prose-strong:text-white
                    prose-code:text-primary prose-code:bg-primary/10 prose-code:px-1.5 prose-code:py-0.5 prose-code:rounded prose-code:text-sm prose-code:break-all
                    prose-pre:bg-white/5 prose-pre:border prose-pre:border-white/10 prose-pre:overflow-x-auto
                    prose-blockquote:border-primary prose-blockquote:text-muted-foreground
                    prose-img:rounded-xl prose-img:border prose-img:border-white/10 prose-img:max-w-full
                    prose-table:block prose-table:overflow-x-auto
                    prose-li:text-muted-foreground
                    prose-hr:border-white/10"
                  dangerouslySetInnerHTML={{ __html: post.content }}
                />
              ) : (
                <p className="text-muted-foreground italic">No content available.</p>
              )}

              {/* Footer */}
              <div className="mt-12 pt-8 border-t border-white/10 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <ShareButtons url={postUrl} title={post.title} />
                <Link href="/blog">
                  <Button variant="outline" size="sm" className="gap-2 border-white/10">
                    <ArrowLeft className="w-4 h-4" /> All Articles
                  </Button>
                </Link>
              </div>

              {/* Author bio */}
              {post.authorBio && (
                <div className="mt-10 p-6 bg-white/5 border border-white/10 rounded-2xl flex gap-4">
                  <div className="w-12 h-12 rounded-full bg-primary/20 flex items-center justify-center flex-shrink-0">
                    <User className="w-6 h-6 text-primary" />
                  </div>
                  <div>
                    <p className="font-semibold text-white mb-1">{post.author}</p>
                    <p className="text-muted-foreground text-sm leading-relaxed">{post.authorBio}</p>
                  </div>
                </div>
              )}
            </motion.article>
          </main>

          {/* Sidebar */}
          <aside className="space-y-8">
            {/* Related posts */}
            {post.related.length > 0 && (
              <div className="sticky top-24">
                <h2 className="font-display font-bold text-white mb-4">Related Articles</h2>
                <div className="space-y-3">
                  {post.related.map((r) => (
                    <RelatedCard key={r.id} post={r} />
                  ))}
                </div>
                <div className="mt-6">
                  <Link href="/blog">
                    <Button variant="outline" size="sm" className="w-full border-white/10 gap-2">
                      <BookOpen className="w-4 h-4" /> View All Articles
                    </Button>
                  </Link>
                </div>
              </div>
            )}
          </aside>
        </div>
      </div>
    </>
  );
}
