import { Home, Gift, Users, Sparkles, User, Mail, ClipboardList, MapPin, CalendarDays, Package, Shield } from "lucide-react";
import { useLocation, useNavigate } from "react-router-dom";
import { cn } from "@/lib/utils";
import { useAppMode } from "@/contexts/AppModeContext";
import appIcon from "@/assets/Bump-City-Icon.png";

const fullTabs = [
  { icon: Home, label: "Home", path: "/" },
  { icon: Gift, label: "Registry", path: "/registry" },
  { icon: Users, label: "Guests", path: "/guests" },
  { icon: Sparkles, label: "Predictions", path: "/predictions" },
  { icon: Mail, label: "Invites", path: "/invites" },
  { icon: Package, label: "Gifts", path: "/gift-tracker" },
  { icon: ClipboardList, label: "Planning", path: "/planning" },
  { icon: MapPin, label: "Vendors", path: "/vendors" },
  { icon: CalendarDays, label: "Community", path: "/community" },
  { icon: User, label: "Profile", path: "/profile" },
];

const registryTabs = [
  { icon: Home, label: "Home", path: "/" },
  { icon: Gift, label: "Registry", path: "/registry" },
  { icon: Package, label: "Gifts", path: "/gift-tracker" },
  { icon: User, label: "Profile", path: "/profile" },
];

export const DesktopSidebar = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { mode, modeLoading } = useAppMode();

  if (modeLoading || mode === "choose") return null;

  const tabs = mode === "registry" ? registryTabs : fullTabs;

  return (
    <aside className="w-20 min-h-screen bg-card border-r border-border flex flex-col items-center py-8 gap-2 shrink-0">
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
