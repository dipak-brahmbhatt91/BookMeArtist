import { Link, useLocation } from "wouter";
import { Palette, Search, LayoutDashboard, Menu, X, LogIn, LogOut, User, BookOpen } from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { motion, AnimatePresence } from "framer-motion";
import { useAuth } from "@/contexts/auth-context";
import { useToast } from "@/hooks/use-toast";

export function Layout({ children }: { children: React.ReactNode }) {
  const [location, navigate] = useLocation();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const { user, logout, isArtist } = useAuth();
  const { toast } = useToast();

  const navLinks = [
    { href: "/artists", label: "Browse Artists", icon: Search },
    { href: "/blog", label: "Blog", icon: BookOpen },
    ...(isArtist ? [{ href: "/dashboard", label: "Workspace", icon: LayoutDashboard }] : []),
  ];

  const handleLogout = async () => {
    await logout();
    toast({ title: "Signed out", description: "You have been logged out." });
    navigate("/");
  };

  return (
    <div className="min-h-screen flex flex-col bg-background text-foreground selection:bg-primary/30">
      {/* Skip to main content — WCAG 2.4.1 */}
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:fixed focus:top-4 focus:left-4 focus:z-[9999] focus:px-4 focus:py-2 focus:bg-primary focus:text-white focus:rounded-lg focus:font-bold focus:outline-none focus:ring-2 focus:ring-white"
      >
        Skip to main content
      </a>

      <header className="sticky top-0 z-50 w-full border-b border-white/5 bg-background/60 backdrop-blur-xl supports-[backdrop-filter]:bg-background/40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-20">
            <Link href="/" className="flex items-center gap-3 group" aria-label="BookMeArtist — Go to homepage">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary via-primary to-accent flex items-center justify-center shadow-[0_0_20px_rgba(99,102,241,0.4)] group-hover:scale-105 transition-transform duration-300" aria-hidden="true">
                <Palette className="w-5 h-5 text-white" aria-hidden="true" />
              </div>
              <span className="font-display font-extrabold text-2xl tracking-tight text-white" aria-hidden="true">
                BookMe<span className="bg-clip-text text-transparent bg-gradient-to-r from-primary to-accent">Artist</span>
              </span>
            </Link>

            <nav className="hidden md:flex items-center gap-8" aria-label="Primary navigation">
              {navLinks.map((link) => {
                const isActive = location === link.href || location.startsWith(link.href + "/");
                return (
                  <Link
                    key={link.href}
                    href={link.href}
                    aria-current={isActive ? "page" : undefined}
                    className={`relative text-sm font-semibold flex items-center gap-2 transition-colors py-2 ${
                      isActive ? "text-white" : "text-muted-foreground hover:text-white"
                    }`}
                  >
                    <link.icon className="w-4 h-4" aria-hidden="true" />
                    {link.label}
                    {isActive && (
                      <motion.div
                        layoutId="nav-glow"
                        className="absolute -bottom-[26px] left-0 right-0 h-[2px] bg-primary shadow-[0_0_10px_rgba(99,102,241,0.8)]"
                        aria-hidden="true"
                      />
                    )}
                  </Link>
                );
              })}
              <div className="h-6 w-px bg-white/10 mx-2" aria-hidden="true"></div>

              {user ? (
                <div className="flex items-center gap-3">
                  <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-white/5 border border-white/10" aria-label={`Signed in as ${user.artistName || user.username}`}>
                    <User className="w-3.5 h-3.5 text-primary" aria-hidden="true" />
                    <span className="text-sm font-semibold text-white">{user.artistName || user.username}</span>
                  </div>
                  <Button
                    onClick={handleLogout}
                    variant="outline"
                    size="sm"
                    className="rounded-full border-white/20 text-muted-foreground hover:text-white hover:border-white/40 gap-2"
                  >
                    <LogOut className="w-3.5 h-3.5" aria-hidden="true" />
                    Sign Out
                  </Button>
                </div>
              ) : (
                <Link href="/login">
                  <Button className="rounded-full px-6 font-bold bg-primary text-white hover:bg-primary/90 shadow-[0_0_15px_rgba(99,102,241,0.5)] hover:shadow-[0_0_25px_rgba(99,102,241,0.7)] transition-all duration-300 gap-2">
                    <LogIn className="w-4 h-4" aria-hidden="true" />
                    Artist Login
                  </Button>
                </Link>
              )}
            </nav>

            <button
              className="md:hidden p-2 text-white rounded-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              aria-label={mobileMenuOpen ? "Close navigation menu" : "Open navigation menu"}
              aria-expanded={mobileMenuOpen}
              aria-controls="mobile-nav"
            >
              {mobileMenuOpen ? <X aria-hidden="true" /> : <Menu aria-hidden="true" />}
            </button>
          </div>
        </div>
      </header>

      <AnimatePresence>
        {mobileMenuOpen && (
          <motion.div
            id="mobile-nav"
            initial={{ opacity: 0, height: 0, y: -10 }}
            animate={{ opacity: 1, height: "auto", y: 0 }}
            exit={{ opacity: 0, height: 0, y: -10 }}
            transition={{ duration: 0.2 }}
            className="md:hidden border-b border-white/10 bg-card overflow-hidden"
          >
            <nav className="flex flex-col p-4 gap-4" aria-label="Mobile navigation">
              {navLinks.map((link) => {
                const isActive = location === link.href || location.startsWith(link.href + "/");
                return (
                  <Link
                    key={link.href}
                    href={link.href}
                    onClick={() => setMobileMenuOpen(false)}
                    aria-current={isActive ? "page" : undefined}
                    className={`flex items-center gap-3 p-3 rounded-xl font-semibold ${
                      isActive ? "bg-primary/20 text-primary border border-primary/20" : "text-muted-foreground hover:bg-white/5 hover:text-white"
                    }`}
                  >
                    <link.icon className="w-5 h-5" aria-hidden="true" />
                    {link.label}
                  </Link>
                );
              })}
              {user ? (
                <button
                  onClick={() => { handleLogout(); setMobileMenuOpen(false); }}
                  className="flex items-center gap-3 p-3 rounded-xl font-semibold text-muted-foreground hover:bg-white/5 hover:text-white"
                >
                  <LogOut className="w-5 h-5" aria-hidden="true" />
                  Sign Out ({user.artistName || user.username})
                </button>
              ) : (
                <Link href="/login" onClick={() => setMobileMenuOpen(false)}>
                  <Button className="w-full mt-2 bg-primary shadow-[0_0_15px_rgba(99,102,241,0.4)] gap-2" size="lg">
                    <LogIn className="w-4 h-4" aria-hidden="true" />
                    Artist Login
                  </Button>
                </Link>
              )}
            </nav>
          </motion.div>
        )}
      </AnimatePresence>

      <main id="main-content" className="flex-1 flex flex-col" tabIndex={-1}>
        {children}
      </main>

      <footer className="mt-auto border-t border-white/5" aria-label="Site footer">
        {/* Main footer body */}
        <div className="bg-card/40">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-14">
            <div className="grid grid-cols-2 md:grid-cols-12 gap-10">

              {/* Brand — wide column */}
              <div className="col-span-2 md:col-span-5 space-y-5">
                <Link href="/" className="inline-flex items-center gap-3 group" aria-label="BookMeArtist homepage">
                  <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-primary via-primary to-accent flex items-center justify-center shadow-[0_0_16px_rgba(99,102,241,0.35)] group-hover:scale-105 transition-transform duration-300">
                    <Palette className="w-4 h-4 text-white" aria-hidden="true" />
                  </div>
                  <span className="font-display font-extrabold text-xl text-white">
                    BookMe<span className="bg-clip-text text-transparent bg-gradient-to-r from-primary to-accent">Artist</span>
                  </span>
                </Link>
                <p className="text-muted-foreground text-sm leading-relaxed max-w-xs">
                  India's platform to discover and directly book verified creative talent — musicians, photographers, dancers, and more — for any event.
                </p>
                <div className="flex items-center gap-1 pt-1">
                  <span className="text-xs text-muted-foreground/60">Made with</span>
                  <span className="text-red-400 text-sm">♥</span>
                  <span className="text-xs text-muted-foreground/60">in India</span>
                </div>
              </div>

              {/* Spacer on desktop */}
              <div className="hidden md:block md:col-span-1" />

              {/* For Clients */}
              <div className="col-span-1 md:col-span-2">
                <h4 className="font-semibold text-white text-sm mb-4">Explore</h4>
                <ul className="space-y-3 text-sm text-muted-foreground">
                  <li><Link href="/artists" className="hover:text-white transition-colors">Browse Artists</Link></li>
                  <li><Link href="/blog" className="hover:text-white transition-colors">Blog</Link></li>
                  <li><Link href="/#how-it-works" className="hover:text-white transition-colors">How It Works</Link></li>
                </ul>
              </div>

              {/* For Artists */}
              <div className="col-span-1 md:col-span-2">
                <h4 className="font-semibold text-white text-sm mb-4">For Artists</h4>
                <ul className="space-y-3 text-sm text-muted-foreground">
                  <li><Link href="/login" className="hover:text-white transition-colors">Artist Login</Link></li>
                  <li><Link href="/#apply" className="hover:text-white transition-colors">Apply as Artist</Link></li>
                  <li><Link href="/dashboard" className="hover:text-white transition-colors">Dashboard</Link></li>
                </ul>
              </div>

              {/* Legal */}
              <div className="col-span-1 md:col-span-2">
                <h4 className="font-semibold text-white text-sm mb-4">Legal</h4>
                <ul className="space-y-3 text-sm text-muted-foreground">
                  <li><Link href="/terms" className="hover:text-white transition-colors">Terms of Service</Link></li>
                  <li><Link href="/privacy" className="hover:text-white transition-colors">Privacy Policy</Link></li>
                  <li><Link href="/privacy#cookies" className="hover:text-white transition-colors">Cookie Policy</Link></li>
                </ul>
              </div>

            </div>
          </div>
        </div>

        {/* Bottom bar */}
        <div className="border-t border-white/5 bg-background">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-5 flex flex-col sm:flex-row justify-between items-center gap-3">
            <p className="text-muted-foreground/60 text-xs">
              © {new Date().getFullYear()} BookMeArtist. All rights reserved.
            </p>
            <p className="text-muted-foreground/40 text-xs">
              Connecting India's best artists with the people who need them.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}
