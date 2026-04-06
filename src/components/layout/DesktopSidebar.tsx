import { Home, Gift, Users, Sparkles, User } from "lucide-react";
import { useLocation, useNavigate } from "react-router-dom";
import { cn } from "@/lib/utils";
import { useAppMode } from "@/contexts/AppModeContext";

const fullTabs = [
  { icon: Home, label: "Home", path: "/" },
  { icon: Gift, label: "Registry", path: "/registry" },
  { icon: Users, label: "Guests", path: "/guests" },
  { icon: Sparkles, label: "Predictions", path: "/predictions" },
  { icon: User, label: "Profile", path: "/profile" },
];

const registryTabs = [
  { icon: Home, label: "Home", path: "/" },
  { icon: Gift, label: "Registry", path: "/registry" },
  { icon: User, label: "Profile", path: "/profile" },
];

export const DesktopSidebar = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { mode } = useAppMode();

  if (mode === "choose") return null;

  const tabs = mode === "registry" ? registryTabs : fullTabs;

  return (
    <aside className="w-20 min-h-screen bg-card border-r border-border flex flex-col items-center py-8 gap-2 shrink-0">
      <div className="mb-6 text-primary font-bold text-lg">🎀</div>
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
