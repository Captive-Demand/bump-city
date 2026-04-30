import {
  Home,
  Gift,
  Send,
  Sparkles,
  User,
  Users,
  ClipboardList,
  MapPin,
  CalendarDays,
  Package,
  Shield,
  PartyPopper,
} from "lucide-react";
import { useLocation, useNavigate } from "react-router-dom";
import { cn } from "@/lib/utils";
import { useEventRole } from "@/hooks/useEventRole";
import appIcon from "@/assets/Bump-City-Icon.png";

type Tab = { icon: any; label: string; path: string; hostOnly?: boolean };

/**
 * Main nav, in usage order:
 *   Home → Showers → Registry          (always visible — primary surfaces)
 *   Invites → Guests → Gifts → Planning (host workflow, in temporal order)
 *   Guess & Win → Vendors → Community  (engagement / resource pages)
 */
const mainTabs: Tab[] = [
  { icon: Home, label: "Home", path: "/" },
  { icon: PartyPopper, label: "Showers", path: "/showers" },
  { icon: Gift, label: "Registry", path: "/registry" },
  { icon: Send, label: "Invites", path: "/invites", hostOnly: true },
  { icon: Users, label: "Guests", path: "/guests", hostOnly: true },
  { icon: Package, label: "Gifts", path: "/gift-tracker", hostOnly: true },
  { icon: ClipboardList, label: "Planning", path: "/planning", hostOnly: true },
  { icon: Sparkles, label: "Guess & Win", path: "/predictions" },
  { icon: MapPin, label: "Vendors", path: "/vendors" },
  { icon: CalendarDays, label: "Community", path: "/community" },
];

/**
 * Footer nav — pinned to the bottom of the sidebar via mt-auto on the
 * spacer. Account-y things go here so they don't crowd the workflow nav.
 */
const footerTabs: Tab[] = [
  { icon: User, label: "Profile", path: "/profile" },
];

const NavButton = ({
  tab,
  isActive,
  onClick,
}: {
  tab: Tab;
  isActive: boolean;
  onClick: () => void;
}) => (
  <button
    onClick={onClick}
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

export const DesktopSidebar = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { isHost, isAdmin } = useEventRole();

  const canHost = isHost || isAdmin;
  const visibleMain = mainTabs.filter((t) => !t.hostOnly || canHost);
  const visibleFooter: Tab[] = [
    ...footerTabs,
    ...(isAdmin
      ? [{ icon: Shield, label: "Admin", path: "/admin" }]
      : []),
  ];

  return (
    <aside className="w-20 h-screen sticky top-0 bg-card border-r border-border flex flex-col items-center py-8 gap-2 shrink-0 overflow-y-auto">
      <div className="mb-6">
        <img src={appIcon} alt="Bump City" className="h-10 w-10" />
      </div>

      {visibleMain.map((tab) => (
        <NavButton
          key={tab.path}
          tab={tab}
          isActive={location.pathname === tab.path}
          onClick={() => navigate(tab.path)}
        />
      ))}

      {/* mt-auto pushes the footer group to the bottom of the column,
          giving Profile/Admin clear visual separation from the workflow
          nav above. */}
      <div className="mt-auto flex flex-col items-center gap-2 pt-4 w-full border-t border-border/40">
        {visibleFooter.map((tab) => (
          <NavButton
            key={tab.path}
            tab={tab}
            isActive={location.pathname === tab.path}
            onClick={() => navigate(tab.path)}
          />
        ))}
      </div>
    </aside>
  );
};
