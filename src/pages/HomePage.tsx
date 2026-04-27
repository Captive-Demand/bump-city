import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Progress } from "@/components/ui/progress";
import { Calendar, Gift, Users, Sparkles, ClipboardList, Bell, Send, MapPin, Pencil, ChevronRight, Plus, ArrowLeftRight, CalendarDays, CheckCircle2, Circle } from "lucide-react";
import { Navigate, useNavigate } from "react-router-dom";
import { MobileLayout } from "@/components/layout/MobileLayout";
import { useAppMode } from "@/contexts/AppModeContext";
import { useActivityFeed, formatRelativeTime } from "@/contexts/ActivityFeedContext";
import { useAuth } from "@/contexts/AuthContext";
import { useEvent } from "@/hooks/useEvent";
import { useActiveEvent } from "@/contexts/ActiveEventContext";
import bumpCityIcon from "@/assets/bump-city-icon.png";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { HowItWorks } from "@/components/home/HowItWorks";
import { ShowerBlocksGrid } from "@/components/home/ShowerBlocksGrid";

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
  const eventImageUrl = (event as any)?.event_image_url;

  const daysToGo = eventDate
    ? Math.max(0, Math.ceil((eventDate.getTime() - Date.now()) / (1000 * 60 * 60 * 24)))
    : null;

  const dateLabel = eventDate
    ? eventDate.toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric", year: "numeric" })
    : null;

  return (
    <Card className="border-none overflow-hidden">
      <CardContent className="p-0">
        <div className="relative overflow-hidden">
          {eventImageUrl ? (
            <img src={eventImageUrl} alt="Event" className="w-full h-44 object-cover" />
          ) : (
            <div className="bg-gradient-to-br from-primary/30 via-primary/15 to-peach/20 h-44 flex items-center justify-center">
              <span className="text-5xl">🎉</span>
            </div>
          )}
          {daysToGo !== null && (
            <Badge className="bg-mint text-mint-foreground text-[10px] font-bold tracking-wide absolute top-3 left-3 z-10">
              ⏰ {daysToGo} DAYS TO GO
            </Badge>
          )}
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

const CommunityCard = () => {
  const navigate = useNavigate();
  const { event } = useEvent();
  const [count, setCount] = useState(0);

  const city = event?.city || null;

  useEffect(() => {
    if (!city) return;
    const load = async () => {
      const { count: c } = await supabase
        .from("community_events")
        .select("id", { count: "exact", head: true })
        .eq("city", city)
        .gte("event_date", new Date().toISOString());
      setCount(c || 0);
    };
    load();
  }, [city]);

  if (!city || count === 0) return null;

  return (
    <div>
      <div className="flex items-center justify-between mb-3">
        <h2 className="text-lg font-bold">Community</h2>
        <button className="text-sm font-semibold text-primary" onClick={() => navigate("/community")}>See all</button>
      </div>
      <Card className="border-none cursor-pointer" onClick={() => navigate("/community")}>
        <CardContent className="p-3.5 flex items-center gap-3">
          <div className="bg-peach p-2.5 rounded-xl shrink-0">
            <CalendarDays className="h-4 w-4 text-foreground/70" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="font-semibold text-sm">Local Events</p>
            <p className="text-xs text-muted-foreground">{count} upcoming event{count !== 1 ? "s" : ""} near {city}</p>
          </div>
          <ChevronRight className="h-4 w-4 text-muted-foreground" />
        </CardContent>
      </Card>
    </div>
  );
};

// ModeChooser removed — shower-first architecture redirects to /get-started instead.

const SetupProgress = () => {
  const navigate = useNavigate();
  const { event } = useEvent();
  const [counts, setCounts] = useState({ guests: 0, registry: 0, sent: 0 });

  useEffect(() => {
    if (!event) return;
    (async () => {
      const [g, r, s] = await Promise.all([
        supabase.from("guests").select("id", { count: "exact", head: true }).eq("event_id", event.id),
        supabase.from("registry_items").select("id", { count: "exact", head: true }).eq("event_id", event.id),
        supabase.from("guests").select("id", { count: "exact", head: true }).eq("event_id", event.id).eq("invite_sent", true),
      ]);
      setCounts({ guests: g.count || 0, registry: r.count || 0, sent: s.count || 0 });
    })();
  }, [event]);

  if (!event) return null;

  const milestones = [
    { label: "Event details added", done: true, path: "/profile" },
    { label: "Invite designed", done: !!(event as any).invite_image_url, path: "/invites" },
    { label: "First guests added", done: counts.guests > 0, path: "/guests" },
    { label: "Registry started", done: counts.registry > 0, path: "/registry" },
    { label: "First invites sent", done: counts.sent > 0, path: "/guests" },
  ];
  const completed = milestones.filter((m) => m.done).length;
  const pct = Math.round((completed / milestones.length) * 100);

  return (
    <Card className="border-none">
      <CardContent className="p-4">
        <div className="flex items-center justify-between mb-2">
          <h2 className="text-sm font-bold">Setup Progress</h2>
          <span className="text-xs font-semibold text-primary">{pct}%</span>
        </div>
        <Progress value={pct} className="h-2 mb-3" />
        <div className="space-y-1.5">
          {milestones.map((m) => (
            <button
              key={m.label}
              onClick={() => navigate(m.path)}
              className="flex items-center gap-2 w-full text-left hover:bg-muted/50 rounded-lg px-1.5 py-1 transition-colors"
            >
              {m.done ? (
                <CheckCircle2 className="h-4 w-4 text-primary shrink-0" />
              ) : (
                <Circle className="h-4 w-4 text-muted-foreground shrink-0" />
              )}
              <span className={`text-xs ${m.done ? "text-muted-foreground line-through" : "text-foreground font-medium"}`}>
                {m.label}
              </span>
            </button>
          ))}
        </div>
      </CardContent>
    </Card>
  );
};

const EventSwitcher = () => {
  const { allEvents, activeEvent, switchEvent } = useActiveEvent();
  if (allEvents.length <= 1) return null;

  return (
    <div className="mb-4">
      <Select value={activeEvent?.id || ""} onValueChange={switchEvent}>
        <SelectTrigger className="w-full h-10 rounded-xl bg-card border-none">
          <div className="flex items-center gap-2">
            <ArrowLeftRight className="h-4 w-4 text-primary" />
            <SelectValue placeholder="Select event" />
          </div>
        </SelectTrigger>
        <SelectContent>
          {allEvents.map((evt) => (
            <SelectItem key={evt.id} value={evt.id}>
              {evt.honoree_name ? `${evt.honoree_name}'s ${evt.event_type === "shower" ? "Shower" : "Registry"}` : `${evt.event_type === "shower" ? "Baby Shower" : "Registry"}`}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
};

const ShowerDashboard = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const displayName = user?.user_metadata?.display_name?.split(" ")[0] || "there";
  const avatarUrl = user?.user_metadata?.avatar_url;

  return (
    <MobileLayout>
      <div className="px-6 pt-10 pb-4">
        {/* Header with greeting and notification */}
        <div className="flex items-center justify-between mb-5">
          <div className="flex items-center gap-3">
            {avatarUrl ? (
              <img src={avatarUrl} alt={displayName} className="w-10 h-10 rounded-full object-cover" />
            ) : (
              <div className="w-10 h-10 rounded-full bg-gradient-to-br from-primary to-lavender flex items-center justify-center">
                <span className="text-sm font-bold text-primary-foreground">
                  {displayName.charAt(0).toUpperCase()}
                </span>
              </div>
            )}
            <div>
              <p className="text-sm text-muted-foreground">{getGreeting()},</p>
              <h1 className="text-xl font-bold leading-tight">{displayName}!</h1>
            </div>
          </div>
          <button className="p-2 rounded-full hover:bg-muted transition-colors relative">
            <Bell className="h-5 w-5 text-muted-foreground" />
          </button>
        </div>
        <div className="h-px w-full bg-border/60" />
      </div>

      <div className="px-6 pb-8 space-y-6">
        <HowItWorks
          storageKey="bump_city_how_it_works_home_dismissed"
          steps={[
            { number: 1, icon: Sparkles, title: "Set up your shower", description: "Add the date, location, and theme." },
            { number: 2, icon: Send, title: "Invite & build registry", description: "Send invitations and curate your gift list." },
            { number: 3, icon: Gift, title: "Track RSVPs & gifts", description: "Stay on top of replies and thank-yous." },
          ]}
        />
        <ShowerBlocksGrid />
        <SetupProgress />
        <QuickActions />
        <NextTasks />
        <CommunityCard />
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

  if (mode === "choose") return <EmptyHome />;
  return <ShowerDashboard />;
};

const EmptyHome = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const displayName = user?.user_metadata?.display_name?.split(" ")[0] || "there";
  return (
    <MobileLayout>
      <div className="px-6 pt-16 pb-8 flex flex-col items-center text-center">
        <img src={bumpCityIcon} alt="Bump City" className="h-16 w-16 rounded-2xl mb-4" />
        <h1 className="text-2xl font-bold mb-2">Welcome, {displayName}!</h1>
        <p className="text-sm text-muted-foreground mb-8 max-w-xs">
          You don't have an event yet. Set one up now, or skip ahead and explore the app.
        </p>
        <div className="w-full max-w-sm space-y-3">
          <Button className="w-full h-12 rounded-xl font-semibold" onClick={() => navigate("/get-started?new=true")}>
            Set up my shower
          </Button>
          <Button
            variant="outline"
            className="w-full h-12 rounded-xl font-semibold"
            onClick={() => navigate("/profile")}
          >
            Go to profile
          </Button>
        </div>
      </div>
    </MobileLayout>
  );
};

export default HomePage;
