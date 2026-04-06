import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Calendar, Gift, Users, Sparkles, Heart, PartyPopper, ClipboardList, Bell, Send, MapPin, Pencil, ChevronRight } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { MobileLayout } from "@/components/layout/MobileLayout";
import { useAppMode } from "@/contexts/AppModeContext";
import { useActivityFeed, formatRelativeTime } from "@/contexts/ActivityFeedContext";
import { useAuth } from "@/contexts/AuthContext";
import { useEvent } from "@/hooks/useEvent";
import bumpCityIcon from "@/assets/bump-city-icon.png";
import ShareInviteButton from "@/components/ShareInviteButton";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";

const getGreeting = () => {
  const h = new Date().getHours();
  if (h < 12) return "Good Morning";
  if (h < 17) return "Good Afternoon";
  return "Good Evening";
};

const EventCard = () => {
  const navigate = useNavigate();
  const { event } = useEvent();
  const { setupData } = useAppMode();

  const honoreeName = event?.honoree_name || setupData.honoreeName;
  const eventDate = event?.event_date ? new Date(event.event_date) : setupData.eventDate;
  const city = event?.city || setupData.city;

  const daysToGo = eventDate
    ? Math.max(0, Math.ceil((eventDate.getTime() - Date.now()) / (1000 * 60 * 60 * 24)))
    : null;

  const dateLabel = eventDate
    ? eventDate.toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric", year: "numeric" })
    : null;

  return (
    <Card className="border-none overflow-hidden">
      <CardContent className="p-0">
        <div className="bg-gradient-to-br from-primary/15 via-lavender/30 to-peach/20 p-5 pb-3 relative">
          {daysToGo !== null && (
            <Badge className="bg-mint text-mint-foreground text-[10px] font-bold tracking-wide mb-3">
              ⏰ {daysToGo} DAYS TO GO
            </Badge>
          )}
          <div className="flex justify-center my-2">
            <span className="text-5xl">🎉</span>
          </div>
        </div>
        <div className="p-5 pt-3">
          <h2 className="text-xl font-bold">{honoreeName ? `${honoreeName}'s Baby Shower` : "Your Baby Shower"}</h2>
          {dateLabel && (
            <div className="flex items-center gap-1.5 mt-1.5 text-muted-foreground">
              <Calendar className="h-3.5 w-3.5" />
              <span className="text-sm">{dateLabel}</span>
            </div>
          )}
          {city && (
            <div className="flex items-center gap-1.5 mt-1 text-muted-foreground">
              <MapPin className="h-3.5 w-3.5" />
              <span className="text-sm">{city}</span>
            </div>
          )}
          <div className="flex items-center gap-2 mt-4">
            <Button className="flex-1 rounded-xl h-11 font-semibold" onClick={() => navigate("/profile")}>
              View Details
            </Button>
            <Button variant="outline" size="icon" className="h-11 w-11 rounded-xl shrink-0" onClick={() => navigate("/profile")}>
              <Pencil className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

const quickActions = [
  { icon: Send, label: "Send Invites", path: "/guests", color: "bg-peach" },
  { icon: Gift, label: "Add Registry", path: "/registry", color: "bg-lavender" },
  { icon: Sparkles, label: "Predictions", path: "/predictions", color: "bg-mint" },
];

const QuickActions = () => {
  const navigate = useNavigate();
  return (
    <div>
      <h2 className="text-lg font-bold mb-3">Quick Actions</h2>
      <div className="flex items-center gap-4 justify-around">
        {quickActions.map((action) => (
          <button
            key={action.label}
            className="flex flex-col items-center gap-2 group"
            onClick={() => navigate(action.path)}
          >
            <div className={`${action.color} p-4 rounded-full transition-transform group-hover:scale-105`}>
              <action.icon className="h-5 w-5 text-foreground/70" />
            </div>
            <span className="text-xs font-medium text-muted-foreground">{action.label}</span>
          </button>
        ))}
      </div>
    </div>
  );
};

const NextTasks = () => {
  const navigate = useNavigate();
  const { event } = useEvent();
  const [pendingGuests, setPendingGuests] = useState(0);
  const [registryProgress, setRegistryProgress] = useState(0);
  const [tasksDue, setTasksDue] = useState(0);

  useEffect(() => {
    if (!event) return;
    const load = async () => {
      const [gRes, rTotalRes, rClaimedRes, tRes] = await Promise.all([
        supabase.from("guests").select("id", { count: "exact", head: true }).eq("event_id", event.id).eq("status", "pending"),
        supabase.from("registry_items").select("id", { count: "exact", head: true }).eq("event_id", event.id),
        supabase.from("registry_items").select("id", { count: "exact", head: true }).eq("event_id", event.id).eq("claimed", true),
        supabase.from("planning_tasks").select("id", { count: "exact", head: true }).eq("event_id", event.id).eq("completed", false),
      ]);
      setPendingGuests(gRes.count || 0);
      const total = rTotalRes.count || 0;
      const claimed = rClaimedRes.count || 0;
      setRegistryProgress(total > 0 ? Math.round((claimed / total) * 100) : 0);
      setTasksDue(tRes.count || 0);
    };
    load();
  }, [event]);

  return (
    <div>
      <div className="flex items-center justify-between mb-3">
        <h2 className="text-lg font-bold">Next Tasks</h2>
        <button className="text-sm font-semibold text-primary" onClick={() => navigate("/planning")}>See all</button>
      </div>
      <div className="space-y-2">
        {pendingGuests > 0 && (
          <Card className="border-none cursor-pointer" onClick={() => navigate("/guests")}>
            <CardContent className="p-3.5 flex items-center gap-3">
              <div className="bg-peach p-2.5 rounded-xl shrink-0">
                <Send className="h-4 w-4 text-foreground/70" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-semibold text-sm">RSVP Follow-ups</p>
                <p className="text-xs text-muted-foreground">{pendingGuests} guest{pendingGuests > 1 ? "s" : ""} pending response</p>
              </div>
              <Button variant="outline" size="sm" className="rounded-full text-xs h-7 border-primary/30 text-primary">
                Remind
              </Button>
            </CardContent>
          </Card>
        )}

        <Card className="border-none cursor-pointer" onClick={() => navigate("/registry")}>
          <CardContent className="p-3.5 flex items-center gap-3">
            <div className="bg-lavender p-2.5 rounded-xl shrink-0">
              <Gift className="h-4 w-4 text-foreground/70" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-semibold text-sm">Registry Status</p>
              <p className="text-xs text-muted-foreground">{registryProgress}% of items funded</p>
            </div>
            <span className="text-lg font-bold text-foreground">{registryProgress}%</span>
          </CardContent>
        </Card>

        {tasksDue > 0 && (
          <Card className="border-none cursor-pointer" onClick={() => navigate("/planning")}>
            <CardContent className="p-3.5 flex items-center gap-3">
              <div className="bg-mint p-2.5 rounded-xl shrink-0">
                <ClipboardList className="h-4 w-4 text-foreground/70" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-semibold text-sm">Open Tasks</p>
                <p className="text-xs text-muted-foreground">{tasksDue} task{tasksDue > 1 ? "s" : ""} remaining</p>
              </div>
              <ChevronRight className="h-4 w-4 text-muted-foreground" />
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
};

const ModeChooser = () => {
  const navigate = useNavigate();

  return (
    <MobileLayout>
      <div className="px-6 pt-16 pb-6 flex flex-col items-center text-center">
        <img src={bumpCityIcon} alt="Bump City" className="h-20 w-20 rounded-2xl mb-3" />
        <h1 className="text-3xl font-bold tracking-tight">
          Welcome to <span className="text-primary">Bump City</span>
        </h1>
        <p className="text-muted-foreground mt-2 text-sm max-w-xs">What would you like to do today?</p>
      </div>
      <div className="px-6 space-y-4 pb-10">
        <Card className="cursor-pointer border-2 border-transparent hover:border-primary/40 transition-all" onClick={() => navigate("/setup/shower")}>
          <CardContent className="p-5 flex items-start gap-4">
            <div className="bg-lavender p-3 rounded-2xl shrink-0"><PartyPopper className="h-7 w-7 text-foreground/70" /></div>
            <div>
              <h2 className="font-bold text-base">I'm planning a baby shower</h2>
              <p className="text-xs text-muted-foreground mt-1 leading-relaxed">Manage invites, registry, games, vendors & everything in one place.</p>
            </div>
          </CardContent>
        </Card>
        <Card className="cursor-pointer border-2 border-transparent hover:border-primary/40 transition-all" onClick={() => navigate("/setup/registry")}>
          <CardContent className="p-5 flex items-start gap-4">
            <div className="bg-peach p-3 rounded-2xl shrink-0"><ClipboardList className="h-7 w-7 text-foreground/70" /></div>
            <div>
              <h2 className="font-bold text-base">I'm building a registry</h2>
              <p className="text-xs text-muted-foreground mt-1 leading-relaxed">Create & share your gift registry — no shower planning needed.</p>
            </div>
          </CardContent>
        </Card>
      </div>
    </MobileLayout>
  );
};

const ShowerDashboard = () => {
  const { user } = useAuth();
  const displayName = user?.user_metadata?.display_name?.split(" ")[0] || "there";

  return (
    <MobileLayout>
      <div className="px-6 pt-10 pb-4">
        {/* Header with greeting and notification */}
        <div className="flex items-center justify-between mb-5">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-primary to-lavender flex items-center justify-center">
              <span className="text-sm font-bold text-primary-foreground">
                {displayName.charAt(0).toUpperCase()}
              </span>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">{getGreeting()},</p>
              <h1 className="text-xl font-bold leading-tight">{displayName}!</h1>
            </div>
          </div>
          <button className="p-2 rounded-full hover:bg-muted transition-colors relative">
            <Bell className="h-5 w-5 text-muted-foreground" />
          </button>
        </div>

        {/* Event Card */}
        <EventCard />
      </div>

      <div className="px-6 pb-8 space-y-6">
        <QuickActions />
        <NextTasks />
      </div>
    </MobileLayout>
  );
};

const HomePage = () => {
  const { mode, modeLoading } = useAppMode();

  if (modeLoading) {
    return (
      <MobileLayout>
        <div className="flex items-center justify-center min-h-[60vh]">
          <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full" />
        </div>
      </MobileLayout>
    );
  }

  if (mode === "choose") return <ModeChooser />;
  return <ShowerDashboard />;
};

export default HomePage;
