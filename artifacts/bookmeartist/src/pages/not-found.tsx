import { Link } from "wouter";
import { PageSeo } from "@/components/page-seo";
import { Button } from "@/components/ui/button";
import { Search, Home } from "lucide-react";

export default function NotFound() {
  return (
    <>
      <PageSeo
        title="Page Not Found"
        description="The page you are looking for does not exist. Browse our artists or return to the homepage."
        noindex
      />
      <div className="min-h-[70vh] flex flex-col items-center justify-center text-center px-4">
        <p className="text-8xl font-display font-extrabold text-primary/20 leading-none mb-4">404</p>
        <h1 className="text-2xl sm:text-3xl font-display font-bold text-foreground mb-3">
          Page Not Found
        </h1>
        <p className="text-muted-foreground max-w-sm mb-8">
          The page you are looking for doesn't exist or may have been moved.
        </p>
        <div className="flex flex-col sm:flex-row gap-3">
          <Link href="/">
            <Button variant="default" className="gap-2 w-full sm:w-auto">
              <Home className="w-4 h-4" /> Go Home
            </Button>
          </Link>
          <Link href="/artists">
            <Button variant="outline" className="gap-2 w-full sm:w-auto">
              <Search className="w-4 h-4" /> Browse Artists
            </Button>
          </Link>
        </div>
      </div>
    </>
  );
}
