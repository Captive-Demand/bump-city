import { Home, Gift, Users, Sparkles, User, Shield } from "lucide-react";
import { useLocation, useNavigate } from "react-router-dom";
import { cn } from "@/lib/utils";
import { useAppMode } from "@/contexts/AppModeContext";
import { useEventRole } from "@/hooks/useEventRole";

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

const honoreeTabs = [
  { icon: Home, label: "Home", path: "/" },
  { icon: Gift, label: "Registry", path: "/registry" },
  { icon: Sparkles, label: "Predictions", path: "/predictions" },
  { icon: User, label: "Profile", path: "/profile" },
];

export const BottomNav = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { mode, modeLoading } = useAppMode();
  const { eventRole, isAdmin, loading: roleLoading } = useEventRole();

  if (modeLoading || roleLoading || mode === "choose") return null;

  let tabs = mode === "registry" ? registryTabs : fullTabs;

  // Honorees in surprise mode don't see guests/invites
  if (eventRole === "honoree") {
    tabs = honoreeTabs;
  }

  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-card border-t border-border flex items-center justify-around h-16 px-2 z-50 max-w-[430px] mx-auto">
      {tabs.map((tab) => {
        const isActive = location.pathname === tab.path;
        return (
          <button
            key={tab.path}
            onClick={() => navigate(tab.path)}
            className={cn(
              "flex flex-col items-center gap-0.5 px-3 py-1.5 rounded-xl transition-all",
              isActive ? "text-primary bg-primary/10" : "text-muted-foreground hover:text-foreground"
            )}
          >
            <tab.icon className={cn("h-5 w-5", isActive && "fill-primary/20")} />
            <span className="text-[10px] font-semibold">{tab.label}</span>
          </button>
        );
      })}
    </nav>
  );
};
