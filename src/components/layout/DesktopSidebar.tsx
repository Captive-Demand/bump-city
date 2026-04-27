import { Home, Gift, Send, Sparkles, User, Users, ClipboardList, MapPin, CalendarDays, Package, Shield, PartyPopper } from "lucide-react";
import { useLocation, useNavigate } from "react-router-dom";
import { cn } from "@/lib/utils";
import { useEventRole } from "@/hooks/useEventRole";
import appIcon from "@/assets/Bump-City-Icon.png";

type Tab = { icon: any; label: string; path: string; hostOnly?: boolean };

const tabsConfig: Tab[] = [
  { icon: Home, label: "Home", path: "/" },
  { icon: PartyPopper, label: "Showers", path: "/showers", hostOnly: true },
  { icon: Gift, label: "Registry", path: "/registry" },
  { icon: Send, label: "Invites", path: "/invites", hostOnly: true },
  { icon: Sparkles, label: "Guess & Win", path: "/predictions" },
  { icon: User, label: "Profile", path: "/profile" },
  // Secondary
  { icon: Users, label: "Guests", path: "/guests", hostOnly: true },
  { icon: Package, label: "Gifts", path: "/gift-tracker", hostOnly: true },
  { icon: ClipboardList, label: "Planning", path: "/planning", hostOnly: true },
  { icon: MapPin, label: "Vendors", path: "/vendors" },
  { icon: CalendarDays, label: "Community", path: "/community" },
];

export const DesktopSidebar = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { isHost, isAdmin, loading: roleLoading } = useEventRole();

  if (roleLoading) return null;

  const canHost = isHost || isAdmin;
  let tabs = tabsConfig.filter((t) => !t.hostOnly || canHost);
  if (isAdmin) tabs = [...tabs, { icon: Shield, label: "Admin", path: "/admin" }];

  return (
    <aside className="w-20 h-screen sticky top-0 bg-card border-r border-border flex flex-col items-center py-8 gap-2 shrink-0 overflow-y-auto">
      <div className="mb-6">
        <img src={appIcon} alt="Bump City" className="h-10 w-10" />
      </div>
      {tabs.map((tab) => {
        const isActive = location.pathname === tab.path;
        return (
          <button
            key={tab.path}
            onClick={() => navigate(tab.path)}
            className={cn(
              "flex flex-col items-center gap-1 w-16 py-2.5 rounded-xl transition-all",
              isActive
                ? "text-primary bg-primary/10"
                : "text-muted-foreground hover:text-foreground hover:bg-muted/50"
            )}
          >
            <tab.icon className={cn("h-5 w-5", isActive && "fill-primary/20")} />
            <span className="text-[10px] font-semibold">{tab.label}</span>
          </button>
        );
      })}
    </aside>
  );
};
