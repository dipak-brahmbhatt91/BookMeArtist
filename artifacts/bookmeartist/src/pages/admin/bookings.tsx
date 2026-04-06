import { AdminLayout } from "@/components/admin-layout";
import { useState } from "react";
import { useListBookings, useUpdateBookingStatus, useDeleteBooking, getListBookingsQueryKey } from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { Trash2, Check, X, Eye, CalendarDays } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from "@/components/ui/sheet";
import { useToast } from "@/hooks/use-toast";
import { format } from "date-fns";

export default function AdminBookings() {
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [selectedBooking, setSelectedBooking] = useState<any>(null);
  
  const { data: allBookings, isLoading } = useListBookings();
  const updateStatus = useUpdateBookingStatus();
  const deleteBooking = useDeleteBooking();
  
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const bookings = statusFilter === "all" 
    ? allBookings 
    : allBookings?.filter(b => b.status === statusFilter);

  const handleStatusChange = async (id: number, status: "accepted" | "declined" | "completed") => {
    try {
      await updateStatus.mutateAsync({ id, data: { status } });
      toast({ title: `Booking ${status}` });
      queryClient.invalidateQueries({ queryKey: getListBookingsQueryKey() });
      if (selectedBooking && selectedBooking.id === id) {
        setSelectedBooking({...selectedBooking, status});
      }
    } catch (e) {
      toast({ variant: "destructive", title: "Failed to update status" });
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm("Are you sure you want to delete this booking request?")) return;
    try {
      await deleteBooking.mutateAsync({ id });
      toast({ title: "Booking deleted" });
      queryClient.invalidateQueries({ queryKey: getListBookingsQueryKey() });
      setSelectedBooking(null);
    } catch (e) {
      toast({ variant: "destructive", title: "Failed to delete" });
    }
  };

  return (
    <AdminLayout>
      <div className="p-4 sm:p-8 max-w-7xl mx-auto w-full">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
          <div>
            <h1 className="text-3xl font-display font-bold text-white">Bookings</h1>
            <p className="text-muted-foreground mt-1">Manage all platform gig requests</p>
          </div>
          
          <Tabs defaultValue="all" onValueChange={setStatusFilter} className="w-full sm:w-auto">
            <TabsList className="bg-[#0f0f1a] border border-white/10 p-1 w-full sm:w-auto">
              <TabsTrigger value="all" className="data-[state=active]:bg-primary flex-1 sm:flex-none">All</TabsTrigger>
              <TabsTrigger value="pending" className="data-[state=active]:bg-amber-500 flex-1 sm:flex-none">Pending</TabsTrigger>
              <TabsTrigger value="accepted" className="data-[state=active]:bg-emerald-500 flex-1 sm:flex-none">Accepted</TabsTrigger>
              <TabsTrigger value="completed" className="data-[state=active]:bg-blue-500 flex-1 sm:flex-none">Completed</TabsTrigger>
            </TabsList>
          </Tabs>
        </div>

        <div className="bg-[#0f0f1a] border border-white/10 rounded-2xl overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left">
              <thead className="text-xs text-muted-foreground uppercase bg-white/[0.02] border-b border-white/10">
                <tr>
                  <th className="px-6 py-4 font-semibold">Artist / Client</th>
                  <th className="px-6 py-4 font-semibold">Event Info</th>
                  <th className="px-6 py-4 font-semibold">Budget</th>
                  <th className="px-6 py-4 font-semibold">Status</th>
                  <th className="px-6 py-4 font-semibold text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {isLoading ? (
                  <tr><td colSpan={5} className="px-6 py-8 text-center text-muted-foreground">Loading...</td></tr>
                ) : bookings && bookings.length > 0 ? (
                  bookings.map((booking) => (
                    <tr key={booking.id} className="border-b border-white/5 hover:bg-white/[0.02] transition-colors">
                      <td className="px-6 py-4">
                        <div className="font-bold text-white mb-0.5">{booking.artistName}</div>
                        <div className="text-muted-foreground text-xs flex items-center gap-1">
                          req by {booking.clientName}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="font-medium text-white mb-0.5">{booking.eventType}</div>
                        <div className="text-muted-foreground text-xs">{format(new Date(booking.eventDate), "MMM d, yyyy")} • {booking.location}</div>
                      </td>
                      <td className="px-6 py-4 font-bold text-primary">
                        ${booking.budget}
                      </td>
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
                      <td className="px-6 py-4 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <Button variant="ghost" size="icon" className="hover:bg-white/10" onClick={() => setSelectedBooking(booking)}>
                            <Eye className="w-4 h-4 text-muted-foreground" />
                          </Button>
                          {booking.status === 'pending' && (
                            <>
                              <Button variant="ghost" size="icon" className="hover:bg-emerald-500/20" onClick={() => handleStatusChange(booking.id, "accepted")}>
                                <Check className="w-4 h-4 text-emerald-500" />
                              </Button>
                              <Button variant="ghost" size="icon" className="hover:bg-rose-500/20" onClick={() => handleStatusChange(booking.id, "declined")}>
                                <X className="w-4 h-4 text-rose-500" />
                              </Button>
                            </>
                          )}
                          <Button variant="ghost" size="icon" className="hover:bg-rose-500/20" onClick={() => handleDelete(booking.id)}>
                            <Trash2 className="w-4 h-4 text-rose-500" />
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr><td colSpan={5} className="px-6 py-12 text-center text-muted-foreground">
                    <CalendarDays className="w-12 h-12 mx-auto mb-3 opacity-20" />
                    No bookings match this filter.
                  </td></tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Booking Details Sheet */}
        <Sheet open={!!selectedBooking} onOpenChange={(open) => !open && setSelectedBooking(null)}>
          <SheetContent className="bg-[#0f0f1a] border-l border-white/10 text-white w-full sm:max-w-md overflow-y-auto">
            <SheetHeader className="mb-6">
              <SheetTitle className="text-2xl text-white">Booking Request</SheetTitle>
              <SheetDescription>ID: {selectedBooking?.id}</SheetDescription>
            </SheetHeader>

            {selectedBooking && (
              <div className="space-y-6">
                <div className="p-4 rounded-xl bg-white/5 border border-white/10">
                  <div className="text-xs uppercase text-muted-foreground tracking-wider mb-1">Status</div>
                  <Badge variant="outline" className={
                          selectedBooking.status === 'pending' ? 'bg-amber-400/10 text-amber-400 border-amber-400/20' :
                          selectedBooking.status === 'accepted' ? 'bg-emerald-400/10 text-emerald-400 border-emerald-400/20' :
                          selectedBooking.status === 'declined' ? 'bg-rose-400/10 text-rose-400 border-rose-400/20' :
                          'bg-blue-400/10 text-blue-400 border-blue-400/20'
                        }>
                    {selectedBooking.status}
                  </Badge>
                </div>

                <div className="space-y-3">
                  <h3 className="font-bold border-b border-white/10 pb-2">Artist Details</h3>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <div className="text-xs text-muted-foreground">Name</div>
                      <div className="font-medium">{selectedBooking.artistName}</div>
                    </div>
                  </div>
                </div>

                <div className="space-y-3">
                  <h3 className="font-bold border-b border-white/10 pb-2">Client Details</h3>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <div className="text-xs text-muted-foreground">Name</div>
                      <div className="font-medium">{selectedBooking.clientName}</div>
                    </div>
                    <div>
                      <div className="text-xs text-muted-foreground">Email</div>
                      <div className="font-medium">{selectedBooking.clientEmail}</div>
                    </div>
                  </div>
                </div>

                <div className="space-y-3">
                  <h3 className="font-bold border-b border-white/10 pb-2">Event Details</h3>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <div className="text-xs text-muted-foreground">Type</div>
                      <div className="font-medium">{selectedBooking.eventType}</div>
                    </div>
                    <div>
                      <div className="text-xs text-muted-foreground">Date</div>
                      <div className="font-medium">{format(new Date(selectedBooking.eventDate), "PP")}</div>
                    </div>
                    <div>
                      <div className="text-xs text-muted-foreground">Location</div>
                      <div className="font-medium">{selectedBooking.location}</div>
                    </div>
                    <div>
                      <div className="text-xs text-muted-foreground">Budget</div>
                      <div className="font-bold text-primary">${selectedBooking.budget}</div>
                    </div>
                    {selectedBooking.packageName && (
                      <div className="col-span-2">
                        <div className="text-xs text-muted-foreground">Selected Package</div>
                        <div className="font-medium p-2 bg-white/5 rounded-md mt-1 border border-white/10">{selectedBooking.packageName}</div>
                      </div>
                    )}
                  </div>
                </div>

                <div className="space-y-3">
                  <h3 className="font-bold border-b border-white/10 pb-2">Project Brief</h3>
                  <div className="bg-background p-4 rounded-xl text-sm leading-relaxed border border-white/5 text-muted-foreground">
                    {selectedBooking.brief}
                  </div>
                </div>

                {selectedBooking.status === 'pending' && (
                  <div className="flex gap-3 pt-4 border-t border-white/10">
                    <Button className="flex-1 bg-emerald-500 hover:bg-emerald-600 text-white" onClick={() => handleStatusChange(selectedBooking.id, "accepted")}>
                      Accept Request
                    </Button>
                    <Button variant="outline" className="flex-1 border-rose-500/50 text-rose-500 hover:bg-rose-500/10" onClick={() => handleStatusChange(selectedBooking.id, "declined")}>
                      Decline
                    </Button>
                  </div>
                )}
                
                {selectedBooking.status === 'accepted' && (
                  <div className="pt-4 border-t border-white/10">
                    <Button className="w-full bg-blue-500 hover:bg-blue-600 text-white" onClick={() => handleStatusChange(selectedBooking.id, "completed")}>
                      Mark as Completed
                    </Button>
                  </div>
                )}
              </div>
            )}
          </SheetContent>
        </Sheet>

      </div>
    </AdminLayout>
  );
}
