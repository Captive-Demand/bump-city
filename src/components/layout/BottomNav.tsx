import { Home, Gift, PartyPopper, Sparkles, User } from "lucide-react";
import { useLocation, useNavigate } from "react-router-dom";
import { cn } from "@/lib/utils";
import { useEventRole } from "@/hooks/useEventRole";

const allTabs = [
  { icon: Home, label: "Home", path: "/", roles: ["all"] },
  { icon: PartyPopper, label: "Showers", path: "/showers", roles: ["host"] },
  { icon: Gift, label: "Registry", path: "/registry", roles: ["all"] },
  { icon: Sparkles, label: "Guess & Win", path: "/predictions", roles: ["all"] },
  { icon: User, label: "Profile", path: "/profile", roles: ["all"] },
];

const HIDDEN_PATHS = ["/auth", "/get-started", "/setup/shower", "/setup/registry", "/reset-password"];

export const BottomNav = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { isHost, isAdmin, loading } = useEventRole();

  if (HIDDEN_PATHS.some((p) => location.pathname.startsWith(p))) return null;
  if (loading) return null;

  const canHost = isHost || isAdmin;
  const tabs = allTabs.filter((t) => t.roles.includes("all") || (t.roles.includes("host") && canHost));

  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-card border-t border-border flex items-center justify-around h-16 px-2 z-50 max-w-[430px] mx-auto">
      {tabs.map((tab) => {
        const isActive =
          tab.path === "/"
            ? location.pathname === "/"
            : location.pathname === tab.path || location.pathname.startsWith(tab.path + "/");
        return (
          <button
            key={tab.path}
            onClick={() => navigate(tab.path)}
            className={cn(
              "flex flex-col items-center gap-0.5 px-3 py-1.5 rounded-xl transition-all",
              isActive ? "text-primary" : "text-muted-foreground hover:text-foreground"
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
