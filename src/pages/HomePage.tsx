import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Progress } from "@/components/ui/progress";
import { Calendar, Gift, Users, Sparkles, ClipboardList, Send, MapPin, Pencil, ChevronRight, ArrowLeftRight, CalendarDays, CheckCircle2, Circle } from "lucide-react";
import { Navigate, useNavigate } from "react-router-dom";
import { MobileLayout } from "@/components/layout/MobileLayout";
import { PageLoader } from "@/components/PageLoader";
import { useAppMode } from "@/contexts/AppModeContext";
import { useAuth } from "@/contexts/AuthContext";
import { useEvent } from "@/hooks/useEvent";
import { useEventRole } from "@/hooks/useEventRole";
import { useActiveEvent, type EventData } from "@/contexts/ActiveEventContext";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { HowItWorks } from "@/components/home/HowItWorks";
import { TodaysFocusCard } from "@/components/home/TodaysFocusCard";
import { RecentActivityCard } from "@/components/home/RecentActivityCard";
import { NotificationsBell } from "@/components/home/NotificationsBell";
import { ShowerStatusStrip } from "@/components/shower/ShowerStatusStrip";
import { useShowerStats, type ShowerStats } from "@/components/shower/useShowerStats";
import bumpCityIcon from "@/assets/bump-city-icon.png";

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
  const { isHost } = useEventRole();

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
            <Button
              className="flex-1 rounded-xl h-11 font-semibold"
              onClick={() => navigate(isHost ? "/profile" : event ? `/showers/${event.id}` : "/showers")}
            >
              View Details
            </Button>
            {isHost && (
              <Button variant="outline" size="icon" className="h-11 w-11 rounded-xl shrink-0" onClick={() => navigate("/profile")}>
                <Pencil className="h-4 w-4" />
              </Button>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

interface QuickAction {
  icon: typeof Send;
  label: string;
  hint?: string;
  path: string;
  color: string;
}

const QuickActions = ({ stats, hasInvite }: { stats: ShowerStats; hasInvite: boolean }) => {
  const navigate = useNavigate();

  // Build a context-aware action list. Drop actions that are no longer
  // useful, surface counts where they help — keeps the row from being
  // pure decoration.
  const actions: QuickAction[] = [];

  if (!hasInvite) {
    actions.push({ icon: Pencil, label: "Design invite", path: "/invites", color: "bg-primary/15" });
  }
  if (stats.invitesUnsent > 0) {
    actions.push({
      icon: Send,
      label: stats.invitesUnsent === 1 ? "Send 1 invite" : `Send ${stats.invitesUnsent} invites`,
      hint: "to your guests",
      path: "/guests",
      color: "bg-peach",
    });
  } else if (stats.guests === 0) {
    actions.push({ icon: Users, label: "Add guests", path: "/guests", color: "bg-peach" });
  }
  if (stats.registry === 0) {
    actions.push({ icon: Gift, label: "Build registry", path: "/registry", color: "bg-lavender" });
  } else {
    actions.push({
      icon: Gift,
      label: "Registry",
      hint: `${stats.registryClaimed}/${stats.registry} claimed`,
      path: "/registry",
      color: "bg-lavender",
    });
  }
  if (stats.guestsPending > 0) {
    actions.push({
      icon: Users,
      label: "Follow up",
      hint: `${stats.guestsPending} pending RSVP`,
      path: "/guests",
      color: "bg-peach",
    });
  }
  if (actions.length < 3) {
    actions.push({ icon: Sparkles, label: "Guess & Win", path: "/predictions", color: "bg-mint" });
  }
  if (actions.length < 3) {
    actions.push({ icon: ClipboardList, label: "Plan", path: "/planning", color: "bg-mint" });
  }

  // Cap at 3 so the row stays scannable.
  const visible = actions.slice(0, 3);
  if (visible.length === 0) return null;

  return (
    <div>
      <h2 className="text-lg font-bold mb-3">Quick actions</h2>
      <div className="grid grid-cols-3 gap-2">
        {visible.map((action) => (
          <button
            key={action.label}
            className="flex flex-col items-center gap-2 p-3 rounded-2xl bg-background hover:bg-muted/40 transition-colors group"
            onClick={() => navigate(action.path)}
          >
            <div className={`${action.color} p-3 rounded-full transition-transform group-hover:scale-105`}>
              <action.icon className="h-4 w-4 text-foreground/70" />
            </div>
            <div className="text-center">
              <p className="text-xs font-semibold leading-tight">{action.label}</p>
              {action.hint && <p className="text-[10px] text-muted-foreground leading-tight mt-0.5">{action.hint}</p>}
            </div>
          </button>
        ))}
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

const SetupProgress = ({ event, stats }: { event: EventData; stats: ShowerStats }) => {
  const navigate = useNavigate();
  const [expanded, setExpanded] = useState(false);

  const milestones = [
    { label: "Event details added", done: true, path: "/profile" },
    { label: "Invite designed", done: !!(event as { invite_image_url?: string | null }).invite_image_url, path: "/invites" },
    { label: "First guests added", done: stats.guests > 0, path: "/guests" },
    { label: "Registry started", done: stats.registry > 0, path: "/registry" },
    { label: "First invites sent", done: stats.invitesSent > 0, path: "/guests" },
  ];
  const completed = milestones.filter((m) => m.done).length;
  const pct = Math.round((completed / milestones.length) * 100);
  const allDone = pct === 100;

  // Once everything's checked off we collapse to a single celebratory line so
  // the page can spotlight more useful widgets. Tap to expand the breakdown.
  if (allDone && !expanded) {
    return (
      <button
        onClick={() => setExpanded(true)}
        className="w-full text-left"
        aria-expanded={false}
      >
        <Card className="border-none bg-mint/30 hover:bg-mint/40 transition-colors">
          <CardContent className="p-3 flex items-center gap-3">
            <CheckCircle2 className="h-4 w-4 text-mint-foreground shrink-0" />
            <div className="flex-1 min-w-0">
              <p className="text-sm font-bold leading-tight">Shower setup complete</p>
              <p className="text-[11px] text-muted-foreground leading-tight">All 5 milestones done · tap to review</p>
            </div>
            <ChevronRight className="h-4 w-4 text-muted-foreground" />
          </CardContent>
        </Card>
      </button>
    );
  }

  return (
    <Card className="border-none">
      <CardContent className="p-4">
        <div className="flex items-center justify-between mb-2">
          <h2 className="text-sm font-bold">Setup progress</h2>
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
          {allDone && (
            <button
              onClick={() => setExpanded(false)}
              className="text-[11px] text-muted-foreground hover:text-foreground pt-1.5"
            >
              Hide
            </button>
          )}
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

const GuestRegistryStatus = () => {
  const navigate = useNavigate();
  const { event } = useEvent();
  const [total, setTotal] = useState(0);
  const [claimed, setClaimed] = useState(0);

  useEffect(() => {
    if (!event) return;
    (async () => {
      const [t, c] = await Promise.all([
        supabase.from("registry_items").select("id", { count: "exact", head: true }).eq("event_id", event.id),
        supabase.from("registry_items").select("id", { count: "exact", head: true }).eq("event_id", event.id).eq("claimed", true),
      ]);
      setTotal(t.count || 0);
      setClaimed(c.count || 0);
    })();
  }, [event]);

  const remaining = Math.max(0, total - claimed);

  return (
    <Card className="border-none cursor-pointer" onClick={() => navigate("/registry")}>
      <CardContent className="p-3.5 flex items-center gap-3">
        <div className="bg-lavender p-2.5 rounded-xl shrink-0">
          <Gift className="h-4 w-4 text-foreground/70" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="font-semibold text-sm">Gift Registry</p>
          <p className="text-xs text-muted-foreground">
            {remaining > 0 ? `${remaining} gift${remaining === 1 ? "" : "s"} still need a home` : "All gifts claimed 🎉"}
          </p>
        </div>
        <ChevronRight className="h-4 w-4 text-muted-foreground" />
      </CardContent>
    </Card>
  );
};

const GuestDashboard = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { event } = useEvent();
  const displayName = user?.user_metadata?.display_name?.split(" ")[0] || "there";
  const avatarUrl = user?.user_metadata?.avatar_url;

  const honoreeName = event?.honoree_name;
  const eventDate = event?.event_date ? new Date(event.event_date) : null;
  const daysToGo = eventDate
    ? Math.max(0, Math.ceil((eventDate.getTime() - Date.now()) / (1000 * 60 * 60 * 24)))
    : null;

  return (
    <MobileLayout>
      <div className="px-6 pt-10 pb-4">
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
          <NotificationsBell />
        </div>
        <div className="h-px w-full bg-border/60" />
      </div>

      <div className="px-6 pb-8 space-y-6">
        <EventSwitcher />
        <EventCard />

        <div>
          <h2 className="text-lg font-bold mb-3">What you can do</h2>
          <div className="space-y-2">
            <GuestRegistryStatus />
            <Card className="border-none cursor-pointer" onClick={() => navigate("/predictions")}>
              <CardContent className="p-3.5 flex items-center gap-3">
                <div className="bg-mint p-2.5 rounded-xl shrink-0">
                  <Sparkles className="h-4 w-4 text-foreground/70" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-sm">Guess & Win</p>
                  <p className="text-xs text-muted-foreground">Cast your predictions for the baby</p>
                </div>
                <ChevronRight className="h-4 w-4 text-muted-foreground" />
              </CardContent>
            </Card>
            {event && (
              <Card className="border-none cursor-pointer" onClick={() => navigate(`/showers/${event.id}`)}>
                <CardContent className="p-3.5 flex items-center gap-3">
                  <div className="bg-peach p-2.5 rounded-xl shrink-0">
                    <Calendar className="h-4 w-4 text-foreground/70" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-sm">Event Details</p>
                    <p className="text-xs text-muted-foreground">
                      {daysToGo !== null ? `${daysToGo} days to go${honoreeName ? ` · ${honoreeName}'s shower` : ""}` : "View date, location & theme"}
                    </p>
                  </div>
                  <ChevronRight className="h-4 w-4 text-muted-foreground" />
                </CardContent>
              </Card>
            )}
          </div>
        </div>

        <CommunityCard />
      </div>
    </MobileLayout>
  );
};

const ShowerDashboard = () => {
  const { user } = useAuth();
  const { event } = useEvent();
  const displayName = user?.user_metadata?.display_name?.split(" ")[0] || "there";
  const avatarUrl = user?.user_metadata?.avatar_url;
  const stats = useShowerStats(event?.id ?? null, event?.city);

  return (
    <MobileLayout>
      {/* Compact header — just the essentials so the smart hero gets the
          attention. */}
      <div className="px-6 pt-8 pb-4 flex items-center justify-between">
        <div className="flex items-center gap-3 min-w-0">
          {avatarUrl ? (
            <img src={avatarUrl} alt={displayName} className="w-9 h-9 rounded-full object-cover" />
          ) : (
            <div className="w-9 h-9 rounded-full bg-gradient-to-br from-primary to-lavender flex items-center justify-center">
              <span className="text-sm font-bold text-primary-foreground">
                {displayName.charAt(0).toUpperCase()}
              </span>
            </div>
          )}
          <p className="text-sm font-semibold truncate">
            <span className="text-muted-foreground font-normal">{getGreeting()}, </span>
            {displayName}
          </p>
        </div>
        <NotificationsBell />
      </div>

      <div className="px-6 pb-8 space-y-5">
        <EventSwitcher />

        {/* Smart hero — picks the user's next best action. */}
        {event && <TodaysFocusCard event={event} stats={stats} />}

        {/* At-a-glance stats — replaces the duplicate hero + Setup Progress
            doing the same job from different angles. */}
        {event && <ShowerStatusStrip event={event} stats={stats} />}

        {/* Signs of life — claims, RSVPs, registry adds. */}
        <RecentActivityCard />

        <QuickActions stats={stats} hasInvite={!!event?.invite_image_url} />

        {event && <SetupProgress event={event} stats={stats} />}

        <HowItWorks
          storageKey="bump_city_how_it_works_home_dismissed"
          showCompletion
          steps={[
            {
              number: 1,
              icon: Sparkles,
              title: "Set up your shower",
              description: "Add the date, location, and theme.",
              done: !!event,
            },
            {
              number: 2,
              icon: Send,
              title: "Invite & build registry",
              description: "Send invitations and curate your gift list.",
              done: stats.invitesSent > 0 && stats.registry > 0,
            },
            {
              number: 3,
              icon: Gift,
              title: "Track RSVPs & gifts",
              description: "Stay on top of replies and thank-yous.",
              done: stats.guests > 0 && stats.guestsPending === 0 && stats.registry > 0,
            },
          ]}
        />

        <CommunityCard />
      </div>
    </MobileLayout>
  );
};

const HomePage = () => {
  const { mode, modeLoading } = useAppMode();
  const { isHost, loading: roleLoading } = useEventRole();

  if (modeLoading || roleLoading) {
    return (
      <MobileLayout>
        <PageLoader />
      </MobileLayout>
    );
  }

  if (mode === "choose") return <EmptyHome />;
  if (!isHost) return <GuestDashboard />;
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
