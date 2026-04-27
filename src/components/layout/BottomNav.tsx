import { Home, Gift, Send, Sparkles, User } from "lucide-react";
import { useLocation, useNavigate } from "react-router-dom";
import { cn } from "@/lib/utils";

const tabs = [
  { icon: Home, label: "Home", path: "/" },
  { icon: Gift, label: "Registry", path: "/registry" },
  { icon: Send, label: "Invites", path: "/invites" },
  { icon: Sparkles, label: "Predictions", path: "/predictions" },
  { icon: User, label: "Profile", path: "/profile" },
];

const HIDDEN_PATHS = ["/auth", "/get-started", "/setup/shower", "/setup/registry", "/reset-password"];

export const BottomNav = () => {
  const location = useLocation();
  const navigate = useNavigate();

  if (HIDDEN_PATHS.some((p) => location.pathname.startsWith(p))) return null;

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
