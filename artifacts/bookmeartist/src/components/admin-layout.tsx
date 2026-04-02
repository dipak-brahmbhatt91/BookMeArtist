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
} from "lucide-react";

export function AdminLayout({ children }: { children: React.ReactNode }) {
  const [location] = useLocation();

  const navItems = [
    { href: "/admin", label: "Dashboard", icon: LayoutDashboard },
    { href: "/admin/artists", label: "Artists", icon: Users },
    { href: "/admin/bookings", label: "Bookings", icon: CalendarDays },
    { href: "/admin/categories", label: "Categories", icon: Tags },
    { href: "/admin/content", label: "Content (CMS)", icon: Layers },
    { href: "/admin/users", label: "User Accounts", icon: ShieldCheck },
    { href: "/admin/applications", label: "Applications", icon: FileText },
    { href: "/admin/security", label: "Security", icon: KeyRound },
  ];

  return (
    <div className="min-h-screen flex bg-background text-foreground dark">
      {/* Sidebar */}
      <aside className="w-64 bg-[#0a0a0f] border-r border-white/10 flex flex-col flex-shrink-0 sticky top-0 h-screen">
        <div className="p-6">
          <Link href="/" className="flex items-center gap-3 group">
            <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center shadow-[0_0_15px_rgba(99,102,241,0.5)]">
              <Palette className="w-4 h-4 text-white" />
            </div>
            <span className="font-display font-bold text-lg tracking-tight text-white">
              Admin<span className="text-primary">Panel</span>
            </span>
          </Link>
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

        <div className="p-4 border-t border-white/10">
          <Link 
            href="/"
            className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-muted-foreground hover:bg-white/5 hover:text-white transition-all"
          >
            <LogOut className="w-5 h-5" />
            Exit to Main Site
          </Link>
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="flex-1 flex flex-col min-w-0 bg-background overflow-y-auto">
        {children}
      </main>
    </div>
  );
}
