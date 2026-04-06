import { Link, useLocation } from "wouter";
import {
  LayoutDashboard,
  Users,
  CalendarDays,
  Tags,
  LogOut,
  Palette,
  ShieldCheck,
  KeyRound,
  FileText,
  Layers,
  BookOpen,
  Menu,
  X,
  ExternalLink,
} from "lucide-react";
import { useState } from "react";
import { useAuth } from "@/contexts/auth-context";
import { useToast } from "@/hooks/use-toast";

export function AdminLayout({ children }: { children: React.ReactNode }) {
  const [location, navigate] = useLocation();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const { logout } = useAuth();
  const { toast } = useToast();

  const navItems = [
    { href: "/admin", label: "Dashboard", icon: LayoutDashboard },
    { href: "/admin/artists", label: "Artists", icon: Users },
    { href: "/admin/bookings", label: "Bookings", icon: CalendarDays },
    { href: "/admin/categories", label: "Categories", icon: Tags },
    { href: "/admin/content", label: "Content (CMS)", icon: Layers },
    { href: "/admin/blog", label: "Blog Posts", icon: BookOpen },
    { href: "/admin/users", label: "User Accounts", icon: ShieldCheck },
    { href: "/admin/applications", label: "Applications", icon: FileText },
    { href: "/admin/security", label: "Security", icon: KeyRound },
  ];

  const SidebarContent = () => (
    <>
      <div className="p-6 flex items-center justify-between">
        <Link href="/" className="flex items-center gap-3 group" onClick={() => setSidebarOpen(false)}>
          <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center shadow-[0_0_15px_rgba(99,102,241,0.5)]">
            <Palette className="w-4 h-4 text-white" />
          </div>
          <span className="font-display font-bold text-lg tracking-tight text-white">
            Admin<span className="text-primary">Panel</span>
          </span>
        </Link>
        <button
          className="md:hidden p-1 text-muted-foreground hover:text-white transition-colors"
          onClick={() => setSidebarOpen(false)}
          aria-label="Close navigation"
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      <div className="px-4 py-2 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
        Management
      </div>

      <nav className="flex-1 px-3 space-y-1 overflow-y-auto">
        {navItems.map((item) => {
          const isActive = location === item.href;
          return (
            <Link
              key={item.href}
              href={item.href}
              onClick={() => setSidebarOpen(false)}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all ${
                isActive
                  ? "bg-primary/10 text-primary"
                  : "text-muted-foreground hover:bg-white/5 hover:text-white"
              }`}
            >
              <item.icon className={`w-5 h-5 ${isActive ? "text-primary" : "text-muted-foreground"}`} />
              {item.label}
            </Link>
          );
        })}
      </nav>

      <div className="p-4 border-t border-white/10 space-y-1">
        <Link
          href="/"
          className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-muted-foreground hover:bg-white/5 hover:text-white transition-all"
          onClick={() => setSidebarOpen(false)}
        >
          <ExternalLink className="w-5 h-5" />
          Exit to Main Site
        </Link>
        <button
          onClick={async () => {
            await logout();
            toast({ title: "Signed out", description: "You have been logged out." });
            navigate("/");
          }}
          className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-red-400 hover:bg-red-500/10 transition-all text-left"
        >
          <LogOut className="w-5 h-5" />
          Logout
        </button>
      </div>
    </>
  );

  return (
    <div className="min-h-screen flex bg-background text-foreground dark">
      {/* Desktop Sidebar */}
      <aside className="hidden md:flex w-64 bg-[#0a0a0f] border-r border-white/10 flex-col flex-shrink-0 sticky top-0 h-screen">
        <SidebarContent />
      </aside>

      {/* Mobile overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/60 backdrop-blur-sm md:hidden"
          onClick={() => setSidebarOpen(false)}
          aria-hidden="true"
        />
      )}

      {/* Mobile Sidebar Drawer */}
      <aside
        className={`fixed inset-y-0 left-0 z-50 w-72 bg-[#0a0a0f] border-r border-white/10 flex flex-col md:hidden transition-transform duration-300 ${
          sidebarOpen ? "translate-x-0" : "-translate-x-full"
        }`}
        aria-label="Mobile navigation"
      >
        <SidebarContent />
      </aside>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0 bg-background overflow-y-auto">
        {/* Mobile topbar */}
        <header className="md:hidden sticky top-0 z-30 flex items-center gap-4 px-4 h-14 bg-[#0a0a0f] border-b border-white/10">
          <button
            onClick={() => setSidebarOpen(true)}
            className="p-2 rounded-lg text-muted-foreground hover:text-white hover:bg-white/5 transition-colors"
            aria-label="Open navigation"
            aria-expanded={sidebarOpen}
          >
            <Menu className="w-5 h-5" />
          </button>
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded-md bg-primary flex items-center justify-center">
              <Palette className="w-3.5 h-3.5 text-white" />
            </div>
            <span className="font-display font-bold text-sm text-white">
              Admin<span className="text-primary">Panel</span>
            </span>
          </div>
        </header>

        <main className="flex-1 flex flex-col">
          {children}
        </main>
      </div>
    </div>
  );
}
