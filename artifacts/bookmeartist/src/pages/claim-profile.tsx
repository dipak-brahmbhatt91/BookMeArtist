import { useState } from "react";
import { useSearch } from "wouter";
import { AlertCircle, BadgeCheck, Mail, MapPin, MessageSquare, Palette, UserCheck, Instagram } from "lucide-react";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { PageSeo } from "@/components/page-seo";
import { apiUrl } from "@/lib/api-base";

export default function ClaimProfile() {
  const search = useSearch();
  const params = new URLSearchParams(search);
  const artistId = Number(params.get("artistId") || "0");
  const artistName = params.get("artistName") || "this artist";
  const location = params.get("location") || "";
  const category = params.get("category") || "";

  const [form, setForm] = useState({
    name: "",
    email: "",
    instagram: "",
    message: "",
  });
  const [error, setError] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const set = (field: keyof typeof form, value: string) => {
    setForm((current) => ({ ...current, [field]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (!artistId) {
      setError("This claim request is missing the artist profile reference. Please start from the public artist page.");
      return;
    }

    setIsLoading(true);
    try {
      const res = await fetch(apiUrl("/api/applications/claim"), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: form.name.trim(),
          email: form.email.trim(),
          instagram: form.instagram.trim(),
          message: form.message.trim(),
          claimedArtistId: artistId,
        }),
      });

      const contentType = res.headers.get("content-type") || "";
      const data = contentType.includes("application/json")
        ? await res.json().catch(() => ({}))
        : { error: await res.text().catch(() => "") };
      if (!res.ok) {
        throw new Error(data?.error || "We couldn't submit your claim request.");
      }

      setSubmitted(true);
    } catch (err: any) {
      setError(err?.message || "We couldn't submit your claim request.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-background text-foreground">
      <PageSeo
        title="Request Artist Profile Claim"
        description="Request manual review to claim an existing BookMeArtist profile."
        canonical="/claim-profile"
        noindex={true}
      />

      <header className="py-6 px-8">
        <a href="/" className="flex items-center gap-3 w-fit group" aria-label="BookMeArtist homepage">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-primary to-accent flex items-center justify-center shadow-[0_0_20px_rgba(99,102,241,0.4)] group-hover:scale-105 transition-transform" aria-hidden="true">
            <Palette className="w-4 h-4 text-white" aria-hidden="true" />
          </div>
          <span className="font-display font-extrabold text-xl tracking-tight text-white" aria-hidden="true">
            BookMe<span className="bg-clip-text text-transparent bg-gradient-to-r from-primary to-accent">Artist</span>
          </span>
        </a>
      </header>

      <div className="flex-1 flex items-center justify-center px-4 pb-16">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
          className="w-full max-w-2xl"
        >
          <div className="text-center mb-8">
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-primary/20 to-accent/20 border border-primary/30 flex items-center justify-center mx-auto mb-4" aria-hidden="true">
              <UserCheck className="w-7 h-7 text-primary" aria-hidden="true" />
            </div>
            <h1 className="font-display font-bold text-3xl text-white mb-2">Request Profile Claim</h1>
            <p className="text-muted-foreground max-w-xl mx-auto">
              Our team reviews each claim manually before any profile or login access is linked.
            </p>
          </div>

          <div className="bg-card/50 border border-white/10 rounded-2xl p-8 backdrop-blur-xl">
            <div className="mb-6 rounded-2xl border border-primary/20 bg-primary/5 p-4 text-sm text-muted-foreground">
              <div className="flex items-center gap-2 text-white font-semibold mb-2">
                <BadgeCheck className="w-4 h-4 text-primary" aria-hidden="true" />
                Profile under review
              </div>
              <p className="text-white/90 font-medium">{artistName}</p>
              <div className="mt-2 flex flex-wrap gap-3 text-xs">
                {category && <span>{category}</span>}
                {location && (
                  <span className="inline-flex items-center gap-1">
                    <MapPin className="w-3 h-3" aria-hidden="true" />
                    {location}
                  </span>
                )}
              </div>
            </div>

            {!artistId ? (
              <div className="text-center py-6">
                <div className="w-14 h-14 rounded-full bg-amber-400/10 flex items-center justify-center mx-auto mb-4">
                  <AlertCircle className="w-7 h-7 text-amber-400" />
                </div>
                <h2 className="text-white text-xl font-bold mb-2">Choose a Profile First</h2>
                <p className="text-muted-foreground">
                  Start from the public artist page you want to claim, then use its request-review link.
                </p>
                <Button className="mt-6 bg-primary hover:bg-primary/90 text-white" asChild>
                  <a href="/artists">Browse artist profiles</a>
                </Button>
              </div>
            ) : submitted ? (
              <div className="text-center py-6">
                <div className="w-14 h-14 rounded-full bg-emerald-400/10 flex items-center justify-center mx-auto mb-4">
                  <BadgeCheck className="w-7 h-7 text-emerald-400" />
                </div>
                <h2 className="text-white text-xl font-bold mb-2">Claim Request Submitted</h2>
                <p className="text-muted-foreground">
                  An admin will review your request and contact you before any account access is created.
                </p>
                <Button className="mt-6 bg-primary hover:bg-primary/90 text-white" asChild>
                  <a href="/">Back to homepage</a>
                </Button>
              </div>
            ) : (
              <>
                {error && (
                  <div
                    role="alert"
                    aria-live="assertive"
                    className="flex items-center gap-2 p-3 bg-red-500/10 border border-red-500/20 rounded-xl text-red-400 text-sm mb-6"
                  >
                    <AlertCircle className="w-4 h-4 shrink-0" aria-hidden="true" />
                    {error}
                  </div>
                )}

                <form onSubmit={handleSubmit} className="space-y-5" noValidate>
                  <div className="grid gap-5 md:grid-cols-2">
                    <div className="space-y-2">
                      <label htmlFor="claim-name" className="text-sm font-semibold text-white/80">
                        Your Name
                      </label>
                      <div className="relative">
                        <UserCheck className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" aria-hidden="true" />
                        <Input
                          id="claim-name"
                          type="text"
                          value={form.name}
                          onChange={(e) => set("name", e.target.value)}
                          placeholder="Your full name"
                          className="pl-9 bg-background/60 border-white/10 focus:border-primary/50 h-11"
                          required
                        />
                      </div>
                    </div>

                    <div className="space-y-2">
                      <label htmlFor="claim-email" className="text-sm font-semibold text-white/80">
                        Contact Email
                      </label>
                      <div className="relative">
                        <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" aria-hidden="true" />
                        <Input
                          id="claim-email"
                          type="email"
                          value={form.email}
                          onChange={(e) => set("email", e.target.value)}
                          placeholder="you@example.com"
                          className="pl-9 bg-background/60 border-white/10 focus:border-primary/50 h-11"
                          required
                        />
                      </div>
                    </div>

                    <div className="space-y-2 md:col-span-2">
                      <label htmlFor="claim-instagram" className="text-sm font-semibold text-white/80">
                        Instagram
                      </label>
                      <div className="relative">
                        <Instagram className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" aria-hidden="true" />
                        <Input
                          id="claim-instagram"
                          type="text"
                          value={form.instagram}
                          onChange={(e) => set("instagram", e.target.value)}
                          placeholder="@yourhandle or portfolio link"
                          className="pl-9 bg-background/60 border-white/10 focus:border-primary/50 h-11"
                        />
                      </div>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <label htmlFor="claim-message" className="text-sm font-semibold text-white/80">
                      Notes for Admin Review
                    </label>
                    <div className="relative">
                      <MessageSquare className="absolute left-3 top-4 w-4 h-4 text-muted-foreground" aria-hidden="true" />
                      <textarea
                        id="claim-message"
                        value={form.message}
                        onChange={(e) => set("message", e.target.value)}
                        placeholder="Share any details that help us verify this profile belongs to you."
                        rows={4}
                        className="w-full rounded-md border border-white/10 bg-background/60 text-white pl-9 pr-3 py-3 text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 resize-none"
                      />
                    </div>
                  </div>

                  <Button
                    type="submit"
                    className="w-full h-11 font-bold bg-primary hover:bg-primary/90 shadow-[0_0_20px_rgba(99,102,241,0.4)] hover:shadow-[0_0_30px_rgba(99,102,241,0.6)] transition-all"
                    disabled={isLoading}
                    aria-busy={isLoading}
                  >
                    {isLoading ? "Submitting Request..." : "Submit Claim Request"}
                  </Button>
                </form>
              </>
            )}
          </div>
        </motion.div>
      </div>
    </div>
  );
}
