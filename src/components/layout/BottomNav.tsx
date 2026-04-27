import { useState } from "react";
import { Home, Gift, PartyPopper, Sparkles, Menu, User, Send, Users, Package, ClipboardList, MapPin, CalendarDays, Shield, X, LogOut } from "lucide-react";
import { useLocation, useNavigate } from "react-router-dom";
import { cn } from "@/lib/utils";
import { useEventRole } from "@/hooks/useEventRole";
import { supabase } from "@/integrations/supabase/client";

type NavItem = { icon: any; label: string; path: string; hostOnly?: boolean };

const primaryTabs: NavItem[] = [
  { icon: Home, label: "Home", path: "/" },
  { icon: PartyPopper, label: "Showers", path: "/showers", hostOnly: true },
  { icon: Gift, label: "Registry", path: "/registry" },
  { icon: Sparkles, label: "Guess & Win", path: "/predictions" },
];

const moreItems: NavItem[] = [
  { icon: User, label: "Profile", path: "/profile" },
  { icon: Send, label: "Invites", path: "/invites", hostOnly: true },
  { icon: Users, label: "Guests", path: "/guests", hostOnly: true },
  { icon: Package, label: "Gifts", path: "/gift-tracker", hostOnly: true },
  { icon: ClipboardList, label: "Planning", path: "/planning", hostOnly: true },
  { icon: MapPin, label: "Vendors", path: "/vendors" },
  { icon: CalendarDays, label: "Community", path: "/community" },
];

const HIDDEN_PATHS = ["/auth", "/get-started", "/setup/shower", "/setup/registry", "/reset-password"];

export const BottomNav = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { isHost, isAdmin, loading } = useEventRole();
  const [moreOpen, setMoreOpen] = useState(false);

  if (HIDDEN_PATHS.some((p) => location.pathname.startsWith(p))) return null;
  if (loading) return null;

  const canHost = isHost || isAdmin;
  const filterByRole = (items: NavItem[]) => items.filter((t) => !t.hostOnly || canHost);
  const tabs = filterByRole(primaryTabs);
  const menuItems = filterByRole(moreItems);
  if (isAdmin) menuItems.push({ icon: Shield, label: "Admin", path: "/admin" });

  const go = (path: string) => {
    setMoreOpen(false);
    navigate(path);
  };

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    setMoreOpen(false);
    navigate("/auth");
  };

  return (
    <>
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
        <button
          onClick={() => setMoreOpen(true)}
          className={cn(
            "flex flex-col items-center gap-0.5 px-3 py-1.5 rounded-xl transition-all",
            moreOpen ? "text-primary" : "text-muted-foreground hover:text-foreground"
          )}
        >
          <Menu className="h-5 w-5" />
          <span className="text-[10px] font-semibold">More</span>
        </button>
      </nav>

      {moreOpen && (
        <div className="fixed inset-0 z-[60] bg-background animate-in fade-in duration-200 flex flex-col">
          <div className="flex items-center justify-between px-6 pt-8 pb-4">
            <h2 className="text-2xl font-bold">Menu</h2>
            <button
              onClick={() => setMoreOpen(false)}
              className="h-10 w-10 rounded-full bg-muted flex items-center justify-center hover:bg-muted/70 transition-all"
              aria-label="Close menu"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          <div className="flex-1 overflow-y-auto px-6 pb-8">
            <div className="grid grid-cols-3 gap-3">
              {menuItems.map((item) => {
                const isActive = location.pathname === item.path;
                return (
                  <button
                    key={item.path}
                    onClick={() => go(item.path)}
                    className={cn(
                      "flex flex-col items-center justify-center gap-2 aspect-square rounded-2xl border-2 transition-all p-3",
                      isActive
                        ? "border-primary bg-primary/10 text-primary"
                        : "border-border bg-card hover:border-primary/30 hover:bg-muted/50"
                    )}
                  >
                    <item.icon className={cn("h-6 w-6", isActive ? "text-primary" : "text-muted-foreground")} />
                    <span className="text-xs font-semibold text-center leading-tight">{item.label}</span>
                  </button>
                );
              })}
            </div>

            <button
              onClick={handleSignOut}
              className="mt-6 w-full flex items-center justify-center gap-2 py-3 rounded-2xl border-2 border-destructive/30 text-destructive hover:bg-destructive/5 transition-all font-semibold text-sm"
            >
              <LogOut className="h-4 w-4" />
              Sign Out
            </button>
          </div>
        </div>
      )}
    </>
  );
};
