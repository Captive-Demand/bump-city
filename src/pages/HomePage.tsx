import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Baby, Calendar, Gift, Users, Sparkles, Heart, PartyPopper, ClipboardList } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { MobileLayout } from "@/components/layout/MobileLayout";
import { useAppMode } from "@/contexts/AppModeContext";
import { useActivityFeed, formatRelativeTime } from "@/contexts/ActivityFeedContext";

const CountdownTimer = ({ dueDate, honoreeName }: { dueDate?: Date; honoreeName?: string }) => {
  const target = dueDate || new Date("2025-08-15");
  const now = new Date();
  const diff = target.getTime() - now.getTime();
  const days = Math.max(0, Math.ceil(diff / (1000 * 60 * 60 * 24)));
  const weeks = Math.floor(days / 7);
  const remainingDays = days % 7;
  const dateLabel = `Due: ${target.toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" })}`;

  return (
    <div className="bg-gradient-to-br from-primary/20 via-lavender/50 to-peach/50 rounded-2xl p-6 text-center">
      <p className="text-sm font-medium text-muted-foreground mb-1">Baby arriving in</p>
      <div className="flex items-center justify-center gap-4">
        <div className="text-center">
          <p className="text-4xl font-bold text-primary">{weeks}</p>
          <p className="text-xs text-muted-foreground font-medium">weeks</p>
        </div>
        <span className="text-2xl text-primary/40 font-light">&</span>
        <div className="text-center">
          <p className="text-4xl font-bold text-primary">{remainingDays}</p>
          <p className="text-xs text-muted-foreground font-medium">days</p>
        </div>
      </div>
      <p className="text-xs text-muted-foreground mt-3">{dateLabel}</p>
    </div>
  );
};

const quickActions = [
  { icon: Gift, label: "Registry", desc: "12 items", path: "/registry", color: "bg-peach" },
  { icon: Users, label: "Guests", desc: "24 invited", path: "/guests", color: "bg-lavender" },
  { icon: Sparkles, label: "Predictions", desc: "5 active", path: "/predictions", color: "bg-mint" },
  { icon: Calendar, label: "Schedule", desc: "Aug 3", path: "/", color: "bg-warm" },
];

/* ── Choose-mode landing ── */
const ModeChooser = () => {
  const navigate = useNavigate();

  return (
    <MobileLayout>
      <div className="px-6 pt-16 pb-6 flex flex-col items-center text-center">
        <Baby className="h-10 w-10 text-primary mb-3" />
        <h1 className="text-3xl font-bold tracking-tight">
          Welcome to <span className="text-primary">Bump City</span> 🎀
        </h1>
        <p className="text-muted-foreground mt-2 text-sm max-w-xs">
          What would you like to do today?
        </p>
      </div>

      <div className="px-6 space-y-4 pb-10">
        <Card
          className="cursor-pointer border-2 border-transparent hover:border-primary/40 transition-all"
          onClick={() => navigate("/setup/shower")}
        >
          <CardContent className="p-5 flex items-start gap-4">
            <div className="bg-lavender p-3 rounded-2xl shrink-0">
              <PartyPopper className="h-7 w-7 text-foreground/70" />
            </div>
            <div>
              <h2 className="font-bold text-base">I'm planning a baby shower</h2>
              <p className="text-xs text-muted-foreground mt-1 leading-relaxed">
                Manage invites, registry, games, vendors & everything in one place.
              </p>
            </div>
          </CardContent>
        </Card>

        <Card
          className="cursor-pointer border-2 border-transparent hover:border-primary/40 transition-all"
          onClick={() => navigate("/setup/registry")}
        >
          <CardContent className="p-5 flex items-start gap-4">
            <div className="bg-peach p-3 rounded-2xl shrink-0">
              <ClipboardList className="h-7 w-7 text-foreground/70" />
            </div>
            <div>
              <h2 className="font-bold text-base">I'm building a registry</h2>
              <p className="text-xs text-muted-foreground mt-1 leading-relaxed">
                Create & share your gift registry — no shower planning needed.
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </MobileLayout>
  );
};

const iconMap: Record<string, React.ComponentType<{ className?: string }>> = {
  "gift-claimed": Gift,
  "registry-added": Gift,
  rsvp: Users,
  prediction: Sparkles,
  "guest-invited": Users,
};

const RecentActivitySection = () => {
  const { activities } = useActivityFeed();
  const recent = activities.slice(0, 5);

  return (
    <div>
      <h2 className="text-lg font-bold mb-3">Recent Activity</h2>
      <Card className="border-none">
        <CardContent className="p-4 space-y-3">
          {recent.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-2">
              No activity yet — start by adding items to your registry!
            </p>
          ) : (
            recent.map((item) => {
              const Icon = iconMap[item.type] || Heart;
              return (
                <div key={item.id} className="flex items-center gap-3">
                  <div className="bg-primary/10 p-1.5 rounded-lg">
                    <Icon className="h-3.5 w-3.5 text-primary" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm truncate">{item.text}</p>
                    <p className="text-[10px] text-muted-foreground">{formatRelativeTime(item.timestamp)}</p>
                  </div>
                </div>
              );
            })
          )}
        </CardContent>
      </Card>
    </div>
  );
};


const ShowerDashboard = () => {
  const navigate = useNavigate();
  const { setupData } = useAppMode();
  const displayName = setupData.honoreeName || "Your";

  return (
    <MobileLayout>
      <div className="bg-gradient-to-b from-primary/15 to-background px-6 pt-12 pb-6">
        <div className="flex items-center gap-2 mb-1">
          <Baby className="h-6 w-6 text-primary" />
          <Badge variant="secondary" className="bg-lavender text-lavender-foreground text-[10px]">
            Baby Shower
          </Badge>
        </div>
        <h1 className="text-3xl font-bold tracking-tight">
          Welcome to
          <br />
          <span className="text-primary">Bump City</span> 🎀
        </h1>
        <p className="text-muted-foreground mt-1 text-sm">
          {displayName}'s baby shower hub
        </p>
      </div>

      <div className="px-6 space-y-6">
        <CountdownTimer dueDate={setupData.dueDate} honoreeName={setupData.honoreeName} />

        <div>
          <h2 className="text-lg font-bold mb-3">Quick Actions</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {quickActions.map((action) => (
              <Card
                key={action.label}
                className="cursor-pointer hover:shadow-md transition-all border-none"
                onClick={() => navigate(action.path)}
              >
                <CardContent className="p-4 flex items-start gap-3">
                  <div className={`${action.color} p-2 rounded-xl`}>
                    <action.icon className="h-5 w-5 text-foreground/70" />
                  </div>
                  <div>
                    <p className="font-semibold text-sm">{action.label}</p>
                    <p className="text-xs text-muted-foreground">{action.desc}</p>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>

        <RecentActivitySection />
      </div>
    </MobileLayout>
  );
};

const HomePage = () => {
  const { mode } = useAppMode();

  if (mode === "choose") return <ModeChooser />;
  return <ShowerDashboard />;
};

export default HomePage;
