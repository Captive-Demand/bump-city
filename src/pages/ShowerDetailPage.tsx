import { useEffect, useState } from "react";
import { useNavigate, useParams, Navigate } from "react-router-dom";
import { ChevronLeft, Trash2, Send, Users, Gift, Calendar, MapPin, Sparkles, CalendarPlus, Navigation } from "lucide-react";
import { MobileLayout } from "@/components/layout/MobileLayout";
import { useActiveEvent } from "@/contexts/ActiveEventContext";
import { useAuth } from "@/contexts/AuthContext";
import { ShowerHero } from "@/components/shower/ShowerHero";
import { QuickSettingsCard } from "@/components/shower/QuickSettingsCard";
import { InvitationOptionsCard } from "@/components/shower/InvitationOptionsCard";
import { ManageTilesGrid } from "@/components/shower/ManageTilesGrid";
import { HowItWorks } from "@/components/home/HowItWorks";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

const PREF_LABELS: Record<string, { label: string; icon: string }> = {
  bring_gift: { label: "Bring a gift", icon: "🎁" },
  bring_book: { label: "Bring a book", icon: "📚" },
  no_gifts: { label: "No gifts please", icon: "💖" },
  clear_wrapping: { label: "Clear wrapping", icon: "🎀" },
  ship_to_home: { label: "Ship to home", icon: "📦" },
  bring_to_event: { label: "Bring to event", icon: "🎈" },
};

const buildCalendarUrl = (event: any) => {
  if (!event.event_date) return null;
  const start = new Date(event.event_date);
  // default to 2pm local if no time
  start.setHours(14, 0, 0, 0);
  const end = new Date(start.getTime() + 2 * 60 * 60 * 1000);
  const fmt = (d: Date) => d.toISOString().replace(/[-:]/g, "").split(".")[0] + "Z";
  const title = encodeURIComponent(`${event.honoree_name || "Baby"}'s Baby Shower`);
  const details = encodeURIComponent(event.invite_message || "");
  const location = encodeURIComponent(event.city || "");
  return `https://www.google.com/calendar/render?action=TEMPLATE&text=${title}&dates=${fmt(start)}/${fmt(end)}&details=${details}&location=${location}`;
};

const ShowerDetailPage = () => {
  const { eventId } = useParams<{ eventId: string }>();
  const navigate = useNavigate();
  const { allEvents, activeEvent, switchEvent, loading, refetch } = useActiveEvent();
  const { user } = useAuth();
  const [memberRole, setMemberRole] = useState<string | null>(null);

  useEffect(() => {
    if (eventId && eventId !== activeEvent?.id) {
      switchEvent(eventId);
    }
  }, [eventId, activeEvent?.id, switchEvent]);

  // Per-event role lookup so host UI doesn't depend on global activeEvent
  // matching the URL or on stale impersonation state.
  useEffect(() => {
    let cancelled = false;
    if (!user || !eventId) {
      setMemberRole(null);
      return;
    }
    (async () => {
      const { data } = await supabase
        .from("event_members")
        .select("role")
        .eq("event_id", eventId)
        .eq("user_id", user.id)
        .maybeSingle();
      if (!cancelled) setMemberRole((data?.role as string) || null);
    })();
    return () => { cancelled = true; };
  }, [user, eventId]);

  if (loading) {
    return (
      <MobileLayout>
        <div className="flex items-center justify-center min-h-[60vh]">
          <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full" />
        </div>
      </MobileLayout>
    );
  }

  const event = allEvents.find((e) => e.id === eventId);
  if (!event) return <Navigate to="/showers" replace />;

  const handleDelete = async () => {
    const { error } = await supabase.from("events").delete().eq("id", event.id);
    if (error) {
      toast.error("Failed to delete shower");
      return;
    }
    toast.success("Shower deleted");
    await refetch();
    navigate("/showers");
  };

  return (
    <MobileLayout>
      <div className="px-6 pt-10 pb-4">
        <button
          onClick={() => navigate("/showers")}
          className="flex items-center gap-1 text-sm text-muted-foreground mb-4 hover:text-foreground"
        >
          <ChevronLeft className="h-4 w-4" /> Showers
        </button>
        <ShowerHero event={event} />
      </div>

      <div className="px-6 pb-8 space-y-6">
        {isHost ? (
          <>
            <HowItWorks
              title="Get this shower ready"
              storageKey={`bump_city_how_it_works_shower_${event.id}_dismissed`}
              steps={[
                { number: 1, icon: Send, title: "Customize your invite", description: "Pick a template and add your details." },
                { number: 2, icon: Users, title: "Add your guests", description: "Import contacts and send invitations." },
                { number: 3, icon: Gift, title: "Build your registry", description: "Add gifts you'd love to receive." },
              ]}
            />

            <InvitationOptionsCard event={event} />
            <QuickSettingsCard event={event} />
            <ManageTilesGrid eventId={event.id} city={event.city} />

            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button variant="outline" className="w-full h-11 rounded-xl text-destructive border-destructive/30 hover:bg-destructive/5">
                  <Trash2 className="h-4 w-4 mr-2" />
                  Delete this shower
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Delete this shower?</AlertDialogTitle>
                  <AlertDialogDescription>
                    This will permanently remove the shower and all its associated guests, registry items, and invites. This cannot be undone.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                  <AlertDialogAction onClick={handleDelete} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
                    Delete
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </>
        ) : (
          <>
            {/* Guest view: read-only, polished */}
            <Card className="border-none">
              <CardContent className="p-5 space-y-3.5">
                <h2 className="text-sm font-bold uppercase tracking-wide text-muted-foreground">Event Details</h2>
                {event.event_date && (
                  <div className="flex items-start gap-3">
                    <div className="bg-peach p-2 rounded-lg shrink-0">
                      <Calendar className="h-4 w-4 text-foreground/70" />
                    </div>
                    <div className="min-w-0">
                      <p className="text-sm font-semibold">
                        {new Date(event.event_date).toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric", year: "numeric" })}
                      </p>
                      {event.invite_time_range && (
                        <p className="text-xs text-muted-foreground">{event.invite_time_range}</p>
                      )}
                    </div>
                  </div>
                )}
                {event.city && (
                  <div className="flex items-start gap-3">
                    <div className="bg-mint p-2 rounded-lg shrink-0">
                      <MapPin className="h-4 w-4 text-foreground/70" />
                    </div>
                    <div className="min-w-0">
                      <p className="text-sm font-semibold">{event.city}</p>
                    </div>
                  </div>
                )}
                {event.theme && (
                  <div className="flex items-start gap-3">
                    <div className="bg-lavender p-2 rounded-lg shrink-0">
                      <Sparkles className="h-4 w-4 text-foreground/70" />
                    </div>
                    <div className="min-w-0">
                      <p className="text-sm font-semibold">{event.theme}</p>
                      <p className="text-xs text-muted-foreground">Theme</p>
                    </div>
                  </div>
                )}
                {event.invite_message && (
                  <p className="text-sm text-muted-foreground italic pt-3 border-t border-border/50">
                    "{event.invite_message}"
                  </p>
                )}
              </CardContent>
            </Card>

            {/* Add to Calendar / Get Directions */}
            {(event.event_date || event.city) && (
              <div className="grid grid-cols-2 gap-3">
                {event.event_date && (
                  <Button
                    variant="outline"
                    className="h-14 rounded-xl flex-col gap-1"
                    onClick={() => {
                      const url = buildCalendarUrl(event);
                      if (url) window.open(url, "_blank");
                    }}
                  >
                    <CalendarPlus className="h-4 w-4 text-primary" />
                    <span className="text-xs font-semibold">Add to Calendar</span>
                  </Button>
                )}
                {event.city && (
                  <Button
                    variant="outline"
                    className="h-14 rounded-xl flex-col gap-1"
                    onClick={() => window.open(`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(event.city!)}`, "_blank")}
                  >
                    <Navigation className="h-4 w-4 text-primary" />
                    <span className="text-xs font-semibold">Get Directions</span>
                  </Button>
                )}
              </div>
            )}

            {/* Gift Preferences */}
            {(() => {
              const prefs = ((event as any).gift_preferences || {}) as Record<string, boolean>;
              const active = Object.entries(prefs).filter(([, v]) => v).map(([k]) => k);
              if (active.length === 0) return null;
              return (
                <Card className="border-none">
                  <CardContent className="p-5 space-y-3">
                    <div className="flex items-center gap-2">
                      <Gift className="h-4 w-4 text-primary" />
                      <h2 className="text-sm font-bold">Gift Preferences</h2>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {active.map((key) => {
                        const meta = PREF_LABELS[key];
                        if (!meta) return null;
                        return (
                          <span key={key} className="inline-flex items-center gap-1.5 bg-muted/60 rounded-full px-3 py-1.5 text-xs font-medium">
                            <span>{meta.icon}</span>
                            <span>{meta.label}</span>
                          </span>
                        );
                      })}
                    </div>
                  </CardContent>
                </Card>
              );
            })()}

            <div className="grid grid-cols-2 gap-3">
              <Button variant="outline" className="h-14 rounded-xl flex-col gap-1" onClick={() => navigate("/registry")}>
                <Gift className="h-4 w-4 text-primary" />
                <span className="text-xs font-semibold">View Registry</span>
              </Button>
              <Button variant="outline" className="h-14 rounded-xl flex-col gap-1" onClick={() => navigate("/predictions")}>
                <Sparkles className="h-4 w-4 text-primary" />
                <span className="text-xs font-semibold">Guess & Win</span>
              </Button>
            </div>
          </>
        )}
      </div>
    </MobileLayout>
  );
};

export default ShowerDetailPage;
