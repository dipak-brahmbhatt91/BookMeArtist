import { useState } from "react";
import { Link, useLocation, useSearch } from "wouter";
import { Palette, Lock, User, Eye, EyeOff, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useAuth } from "@/contexts/auth-context";
import { motion } from "framer-motion";
import { PageSeo } from "@/components/page-seo";

export default function Login() {
  const { login } = useAuth();
  const [, navigate] = useLocation();
  const search = useSearch();
  const params = new URLSearchParams(search);
  const redirectTo = params.get("redirect");
  const isAdminLogin = redirectTo?.startsWith("/admin");

  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setIsLoading(true);
    try {
      const user = await login(username, password);
      const canAccessAdmin = user.role === "admin" || user.role === "superadmin";
      if (redirectTo && !(redirectTo.startsWith("/admin") && !canAccessAdmin)) {
        navigate(redirectTo);
      } else if (canAccessAdmin) {
        navigate("/admin");
      } else {
        navigate("/dashboard");
      }
    } catch (err: any) {
      const msg = err?.message ?? "Invalid username or password";
      setError(msg.includes("401") || msg.includes("Invalid") ? "Invalid username or password" : "Login failed. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-background text-foreground">
      <PageSeo
        title={isAdminLogin ? "Admin Login" : "Artist Login — Sign In to Your Dashboard"}
        description="Sign in to your BookMeArtist account to manage bookings, update your portfolio, and connect with clients."
        canonical="/login"
        noindex={true}
      />
      <header className="py-6 px-8">
        <Link href="/" className="flex items-center gap-3 w-fit group" aria-label="BookMeArtist — Go to homepage">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-primary to-accent flex items-center justify-center shadow-[0_0_20px_rgba(99,102,241,0.4)] group-hover:scale-105 transition-transform" aria-hidden="true">
            <Palette className="w-4 h-4 text-white" aria-hidden="true" />
          </div>
          <span className="font-display font-extrabold text-xl tracking-tight text-white" aria-hidden="true">
            BookMe<span className="bg-clip-text text-transparent bg-gradient-to-r from-primary to-accent">Artist</span>
          </span>
        </Link>
      </header>

      <div className="flex-1 flex items-center justify-center px-4 pb-16">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
          className="w-full max-w-md"
        >
          <div className="text-center mb-8">
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-primary/20 to-accent/20 border border-primary/30 flex items-center justify-center mx-auto mb-4" aria-hidden="true">
              <Lock className="w-7 h-7 text-primary" aria-hidden="true" />
            </div>
            <h1 className="font-display font-bold text-3xl text-white mb-2">{isAdminLogin ? "Admin Login" : "Artist Login"}</h1>
            <p className="text-muted-foreground">{isAdminLogin ? "Sign in with your admin credentials" : "Sign in to manage your profile and bookings"}</p>
          </div>

          <div className="bg-card/50 border border-white/10 rounded-2xl p-8 backdrop-blur-xl">
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
              <div className="space-y-2">
                <label htmlFor="login-username" className="text-sm font-semibold text-white/80">
                  Username
                </label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" aria-hidden="true" />
                  <Input
                    id="login-username"
                    type="text"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    placeholder="your_username"
                    className="pl-9 bg-background/60 border-white/10 focus:border-primary/50 h-11"
                    required
                    autoComplete="username"
                    aria-required="true"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label htmlFor="login-password" className="text-sm font-semibold text-white/80">
                  Password
                </label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" aria-hidden="true" />
                  <Input
                    id="login-password"
                    type={showPassword ? "text" : "password"}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    className="pl-9 pr-10 bg-background/60 border-white/10 focus:border-primary/50 h-11"
                    required
                    autoComplete="current-password"
                    aria-required="true"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-white transition-colors rounded focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
                    aria-label={showPassword ? "Hide password" : "Show password"}
                    aria-pressed={showPassword}
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" aria-hidden="true" /> : <Eye className="w-4 h-4" aria-hidden="true" />}
                  </button>
                </div>
              </div>

              <Button
                type="submit"
                className="w-full h-11 font-bold bg-primary hover:bg-primary/90 shadow-[0_0_20px_rgba(99,102,241,0.4)] hover:shadow-[0_0_30px_rgba(99,102,241,0.6)] transition-all"
                disabled={isLoading}
                aria-busy={isLoading}
              >
                {isLoading ? "Signing in…" : "Sign In"}
              </Button>
            </form>

            <div className="mt-6 rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-muted-foreground">
              Need to claim a public artist profile?{" "}
              <Link href="/artists" className="font-semibold text-primary hover:text-primary/80 transition-colors">
                Open the artist listing first
              </Link>
            </div>
          </div>

          <p className="text-center text-sm text-muted-foreground mt-6">
            <Link href="/" className="hover:text-primary transition-colors underline underline-offset-4">← Back to homepage</Link>
          </p>
        </motion.div>
      </div>
    </div>
  );
}
