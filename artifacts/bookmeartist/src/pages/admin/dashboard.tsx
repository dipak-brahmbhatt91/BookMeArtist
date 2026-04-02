import { AdminLayout } from "@/components/admin-layout";
import { useGetAdminStats, useListBookings } from "@workspace/api-client-react";
import { Users, CalendarDays, DollarSign, Tags, Star, Clock, Activity, ShieldCheck } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { format } from "date-fns";
import { Button } from "@/components/ui/button";
import { Link } from "wouter";

export default function AdminDashboard() {
  const { data: stats, isLoading: statsLoading } = useGetAdminStats();
  const { data: bookings, isLoading: bookingsLoading } = useListBookings();

  const statCards = [
    { label: "Total Artists", value: stats?.totalArtists || 0, icon: Users, color: "text-blue-400", bg: "bg-blue-400/10" },
    { label: "Total Bookings", value: stats?.totalBookings || 0, icon: CalendarDays, color: "text-emerald-400", bg: "bg-emerald-400/10" },
    { label: "Pending Bookings", value: stats?.pendingBookings || 0, icon: Clock, color: "text-amber-400", bg: "bg-amber-400/10" },
    { label: "Total Revenue", value: `$${stats?.totalRevenue?.toLocaleString() || 0}`, icon: DollarSign, color: "text-primary", bg: "bg-primary/10" },
    { label: "Featured Artists", value: stats?.featuredArtists || 0, icon: Star, color: "text-purple-400", bg: "bg-purple-400/10" },
    { label: "Categories", value: stats?.totalCategories || 0, icon: Tags, color: "text-rose-400", bg: "bg-rose-400/10" },
    { label: "User Accounts", value: stats?.totalUsers || 0, icon: ShieldCheck, color: "text-indigo-400", bg: "bg-indigo-400/10" },
  ];

  return (
    <AdminLayout>
      <div className="p-8 max-w-7xl mx-auto w-full">
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-display font-bold text-white">Dashboard Overview</h1>
            <p className="text-muted-foreground mt-1">Platform metrics and recent activity</p>
          </div>
          <div className="flex gap-3">
            <Button asChild variant="outline" className="border-white/10 hover:bg-white/5">
              <Link href="/admin/categories">Add Category</Link>
            </Button>
            <Button asChild className="bg-primary text-white hover:bg-primary/90">
              <Link href="/admin/artists">Add Artist</Link>
            </Button>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-10">
          {statsLoading ? (
            Array(6).fill(0).map((_, i) => (
              <div key={i} className="bg-[#0f0f1a] border border-white/10 rounded-2xl p-6">
                <Skeleton className="h-10 w-10 rounded-xl mb-4 bg-white/5" />
                <Skeleton className="h-4 w-24 mb-2 bg-white/5" />
                <Skeleton className="h-8 w-16 bg-white/5" />
              </div>
            ))
          ) : (
            statCards.map((stat, i) => (
              <div key={i} className="bg-[#0f0f1a] border border-white/5 hover:border-white/10 transition-colors rounded-2xl p-6 relative overflow-hidden group">
                <div className={`absolute -right-4 -top-4 w-24 h-24 ${stat.bg} rounded-full blur-2xl group-hover:scale-150 transition-transform duration-500`}></div>
                <div className={`w-12 h-12 rounded-xl flex items-center justify-center mb-4 ${stat.bg}`}>
                  <stat.icon className={`w-6 h-6 ${stat.color}`} />
                </div>
                <h3 className="text-muted-foreground text-sm font-medium mb-1">{stat.label}</h3>
                <div className="text-3xl font-display font-bold text-white">
                  {stat.value}
                </div>
              </div>
            ))
          )}
        </div>

        {/* Recent Bookings Table */}
        <div className="bg-[#0f0f1a] border border-white/10 rounded-2xl overflow-hidden">
          <div className="px-6 py-5 border-b border-white/10 flex justify-between items-center">
            <div className="flex items-center gap-2">
              <Activity className="w-5 h-5 text-primary" />
              <h2 className="text-lg font-bold text-white">Recent Bookings</h2>
            </div>
            <Button variant="link" asChild className="text-primary p-0">
              <Link href="/admin/bookings">View All</Link>
            </Button>
          </div>
          
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left">
              <thead className="text-xs text-muted-foreground uppercase bg-white/[0.02] border-b border-white/10">
                <tr>
                  <th className="px-6 py-4 font-semibold">Artist</th>
                  <th className="px-6 py-4 font-semibold">Client</th>
                  <th className="px-6 py-4 font-semibold">Event Date</th>
                  <th className="px-6 py-4 font-semibold">Amount</th>
                  <th className="px-6 py-4 font-semibold">Status</th>
                </tr>
              </thead>
              <tbody>
                {bookingsLoading ? (
                  <tr><td colSpan={5} className="px-6 py-8 text-center text-muted-foreground">Loading...</td></tr>
                ) : bookings && bookings.length > 0 ? (
                  bookings.slice(0, 5).map((booking) => (
                    <tr key={booking.id} className="border-b border-white/5 hover:bg-white/[0.02] transition-colors">
                      <td className="px-6 py-4 font-medium text-white">{booking.artistName}</td>
                      <td className="px-6 py-4 text-muted-foreground">{booking.clientName}</td>
                      <td className="px-6 py-4 text-muted-foreground">{format(new Date(booking.eventDate), "MMM d, yyyy")}</td>
                      <td className="px-6 py-4 font-medium text-white">${booking.budget}</td>
                      <td className="px-6 py-4">
                        <Badge variant="outline" className={
                          booking.status === 'pending' ? 'bg-amber-400/10 text-amber-400 border-amber-400/20' :
                          booking.status === 'accepted' ? 'bg-emerald-400/10 text-emerald-400 border-emerald-400/20' :
                          booking.status === 'declined' ? 'bg-rose-400/10 text-rose-400 border-rose-400/20' :
                          'bg-blue-400/10 text-blue-400 border-blue-400/20'
                        }>
                          {booking.status}
                        </Badge>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr><td colSpan={5} className="px-6 py-8 text-center text-muted-foreground">No bookings found</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </AdminLayout>
  );
}
