import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Loader2, Send, Star, CheckCircle2, Calendar, MessageSquare, User, Sparkles } from "lucide-react";

import { useCreateBooking, type Artist } from "@workspace/api-client-react";
import { CURRENCY, formatPrice } from "@/lib/currency";
import { useQueryClient } from "@tanstack/react-query";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";

const EVENT_TYPES = [
  "Wedding",
  "Engagement Ceremony",
  "Birthday Party",
  "Anniversary",
  "Corporate Event",
  "Product Launch",
  "Concert / Live Show",
  "Festival",
  "Private Party",
  "School / College Event",
  "Religious Ceremony",
  "Other",
];

const bookingSchema = z.object({
  clientName: z.string().min(2, "Name is required"),
  clientEmail: z.string().email("Valid email is required"),
  eventDate: z.string().min(1, "Date is required"),
  eventType: z.string().min(2, "Event type is required"),
  packageName: z.string().optional(),
  budget: z.coerce.number().min(1, "Budget must be greater than 0"),
  location: z.string().min(2, "Location is required"),
  brief: z.string().min(10, "Please provide some details about the event"),
});

type BookingFormValues = z.infer<typeof bookingSchema>;

interface BookingModalProps {
  artist: Artist;
}

const TODAY = new Date().toISOString().split("T")[0];

function SectionLabel({ icon: Icon, label }: { icon: React.ComponentType<{ className?: string }>; label: string }) {
  return (
    <p className="text-xs font-bold text-muted-foreground uppercase tracking-widest mb-3 flex items-center gap-2">
      <Icon className="w-3.5 h-3.5" />
      {label}
    </p>
  );
}

function SuccessScreen({ artist, onClose }: { artist: Artist; onClose: () => void }) {
  return (
    <div className="p-8 sm:p-10 text-center flex flex-col items-center">
      <div className="w-20 h-20 rounded-full bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center mb-6">
        <CheckCircle2 className="w-10 h-10 text-emerald-400" />
      </div>
      <h2 className="text-2xl font-display font-bold text-white mb-2">Request Sent!</h2>
      <p className="text-muted-foreground mb-1">
        Your booking request has been sent to{" "}
        <span className="text-white font-semibold">{artist.name}</span>.
      </p>
      <p className="text-sm text-muted-foreground mb-8">
        Expect a response within 24–48 hours. Check your email for updates.
      </p>

      <div className="w-full max-w-xs space-y-2.5">
        {[
          { step: "1", text: `Request sent to ${artist.name}`, done: true },
          { step: "2", text: "Artist reviews your brief", done: false },
          { step: "3", text: "Confirm & finalise booking", done: false },
        ].map(({ step, text, done }) => (
          <div
            key={step}
            className={`flex items-center gap-3 rounded-xl border px-4 py-3 text-left transition-opacity ${
              done ? "bg-emerald-500/5 border-emerald-500/20" : "bg-white/5 border-white/10 opacity-50"
            }`}
          >
            <div className={`w-6 h-6 rounded-full text-xs font-bold flex items-center justify-center shrink-0 ${
              done ? "bg-emerald-500/20 text-emerald-400" : "bg-white/10 text-muted-foreground"
            }`}>
              {done ? "✓" : step}
            </div>
            <p className="text-sm text-muted-foreground">{text}</p>
          </div>
        ))}
      </div>

      <Button onClick={onClose} className="mt-8 bg-primary hover:bg-primary/90 text-white px-10 h-11 font-bold">
        Done
      </Button>
    </div>
  );
}

export function BookingModal({ artist }: BookingModalProps) {
  const [open, setOpen] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const createBooking = useCreateBooking();

  const form = useForm<BookingFormValues>({
    resolver: zodResolver(bookingSchema),
    defaultValues: {
      clientName: "",
      clientEmail: "",
      eventDate: "",
      eventType: "",
      packageName: "",
      budget: artist.basePrice,
      location: "",
      brief: "",
    },
  });

  const briefValue = form.watch("brief");

  const onSubmit = async (data: BookingFormValues) => {
    try {
      await createBooking.mutateAsync({ data: { artistId: artist.id, ...data } });
      queryClient.invalidateQueries({ queryKey: ["/api/bookings"] });
      setSubmitted(true);
    } catch {
      toast({
        variant: "destructive",
        title: "Failed to send request",
        description: "Something went wrong. Please try again.",
      });
    }
  };

  // Only set open state here — never call form.reset() during Radix's open/close
  // transition, as it triggers RHF state updates mid-render and crashes React 19.
  function handleOpenChange(next: boolean) {
    setOpen(next);
  }

  // After the dialog fully closes, reset submitted + form so the next open is fresh.
  // useEffect runs post-render, safely outside the close animation.
  useEffect(() => {
    if (!open && submitted) {
      const t = setTimeout(() => {
        setSubmitted(false);
        form.reset({ budget: artist.basePrice });
      }, 350);
      return () => clearTimeout(t);
    }
  }, [open]); // eslint-disable-line react-hooks/exhaustive-deps

  const ratingDisplay = typeof artist.rating === "number" ? artist.rating.toFixed(1) : "—";

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>
        <Button size="lg" className="w-full text-base font-bold shadow-lg shadow-primary/20 hover:shadow-xl hover:shadow-primary/30 hover:-translate-y-0.5 transition-all">
          <Send className="w-4 h-4 mr-2" />
          Send Booking Request
        </Button>
      </DialogTrigger>

      <DialogContent className="sm:max-w-[580px] max-h-[92vh] overflow-y-auto p-0 gap-0">
        {submitted ? (
          <SuccessScreen artist={artist} onClose={() => handleOpenChange(false)} />
        ) : (
          <>
            {/* Artist context header */}
            <div className="bg-gradient-to-br from-primary/10 via-primary/5 to-transparent border-b border-white/10 p-5 rounded-t-lg">
              <div className="flex items-center gap-4">
                {artist.profileImage ? (
                  <img
                    src={artist.profileImage}
                    alt={artist.name}
                    className="w-14 h-14 rounded-2xl object-cover border-2 border-white/10 shrink-0"
                  />
                ) : (
                  <div className="w-14 h-14 rounded-2xl bg-primary/20 flex items-center justify-center shrink-0">
                    <User className="w-7 h-7 text-primary" />
                  </div>
                )}
                <div className="flex-1 min-w-0">
                  <h2 className="font-display font-bold text-lg text-white truncate">Book {artist.name}</h2>
                  <p className="text-sm text-muted-foreground">{artist.categoryName}</p>
                  <div className="flex items-center gap-3 mt-1 flex-wrap">
                    <span className="flex items-center gap-1 text-amber-400 text-sm font-semibold">
                      <Star className="w-3.5 h-3.5 fill-amber-400" />
                      {ratingDisplay}
                      {artist.reviewCount ? (
                        <span className="text-muted-foreground font-normal text-xs">({artist.reviewCount})</span>
                      ) : null}
                    </span>
                    <span className="text-muted-foreground text-sm">
                      Starting at{" "}
                      <span className="text-white font-bold">{formatPrice(artist.basePrice)}</span>
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Form */}
            <div className="p-5 sm:p-6">
              <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">

                  {/* Your Details */}
                  <div>
                    <SectionLabel icon={User} label="Your Details" />
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <FormField
                        control={form.control}
                        name="clientName"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Full Name</FormLabel>
                            <FormControl>
                              <Input placeholder="Your name" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={form.control}
                        name="clientEmail"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Email Address</FormLabel>
                            <FormControl>
                              <Input type="email" placeholder="you@email.com" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>
                  </div>

                  {/* Event Details */}
                  <div>
                    <SectionLabel icon={Calendar} label="Event Details" />
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <FormField
                        control={form.control}
                        name="eventDate"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Event Date</FormLabel>
                            <FormControl>
                              <Input type="date" min={TODAY} {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={form.control}
                        name="location"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Venue / Location</FormLabel>
                            <FormControl>
                              <Input placeholder="City, venue name…" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={form.control}
                        name="eventType"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Event Type</FormLabel>
                            <Select onValueChange={field.onChange} value={field.value}>
                              <FormControl>
                                <SelectTrigger>
                                  <SelectValue placeholder="Select event type" />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                {EVENT_TYPES.map(type => (
                                  <SelectItem key={type} value={type}>{type}</SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={form.control}
                        name="budget"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Your Budget ({CURRENCY.symbol})</FormLabel>
                            <FormControl>
                              <Input type="number" min="0" {...field} />
                            </FormControl>
                            <p className="text-xs text-muted-foreground mt-1">
                              Artist's base rate: <span className="text-white">{formatPrice(artist.basePrice)}</span>
                            </p>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>
                  </div>

                  {/* Package selection */}
                  {artist.packages && artist.packages.length > 0 && (
                    <div>
                      <SectionLabel icon={Sparkles} label="Service Package" />
                      <FormField
                        control={form.control}
                        name="packageName"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>
                              Interested Package{" "}
                              <span className="text-muted-foreground font-normal">(optional)</span>
                            </FormLabel>
                            <Select onValueChange={field.onChange} value={field.value}>
                              <FormControl>
                                <SelectTrigger>
                                  <SelectValue placeholder="Choose a package or skip" />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                <SelectItem value="custom">Custom / Not sure yet</SelectItem>
                                {artist.packages.map((pkg) => (
                                  <SelectItem key={pkg.name} value={pkg.name}>
                                    {pkg.name} — {formatPrice(pkg.price)}
                                    {pkg.duration ? ` · ${pkg.duration}` : ""}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>
                  )}

                  {/* Project Brief */}
                  <div>
                    <SectionLabel icon={MessageSquare} label="Project Brief" />
                    <FormField
                      control={form.control}
                      name="brief"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Tell the artist about your event</FormLabel>
                          <FormControl>
                            <Textarea
                              placeholder="Describe your vision, timing, special requirements, and anything else the artist should know…"
                              className="min-h-[110px] resize-y"
                              {...field}
                            />
                          </FormControl>
                          <div className="flex justify-between items-center mt-1">
                            <FormMessage />
                            <span className={`text-xs ml-auto tabular-nums ${
                              briefValue.length < 10
                                ? "text-destructive"
                                : briefValue.length < 50
                                ? "text-muted-foreground"
                                : "text-emerald-500"
                            }`}>
                              {briefValue.length} chars
                            </span>
                          </div>
                        </FormItem>
                      )}
                    />
                  </div>

                  {/* What happens next */}
                  <div className="rounded-2xl bg-white/[0.03] border border-white/10 p-4 space-y-3">
                    <p className="text-xs font-bold text-muted-foreground uppercase tracking-widest">What happens next</p>
                    {[
                      `Your request is sent to ${artist.name}`,
                      "Artist reviews and responds within 24–48 hrs",
                      "Confirm details and finalise the booking",
                    ].map((text, i) => (
                      <div key={i} className="flex items-start gap-3">
                        <div className="w-5 h-5 rounded-full bg-primary/20 text-primary text-[10px] font-bold flex items-center justify-center shrink-0 mt-0.5">
                          {i + 1}
                        </div>
                        <p className="text-sm text-muted-foreground">{text}</p>
                      </div>
                    ))}
                  </div>

                  <div className="space-y-2">
                    <Button
                      type="submit"
                      className="w-full font-bold h-12 text-base shadow-lg shadow-primary/20"
                      disabled={createBooking.isPending}
                    >
                      {createBooking.isPending ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          Sending Request…
                        </>
                      ) : (
                        <>
                          <Send className="mr-2 h-4 w-4" />
                          Send Booking Request
                        </>
                      )}
                    </Button>
                    <p className="text-center text-xs text-muted-foreground">
                      No payment required to send a request
                    </p>
                  </div>
                </form>
              </Form>
            </div>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}
