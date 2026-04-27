import { ReactNode } from "react";
import { BottomNav } from "./BottomNav";
import { DesktopSidebar } from "./DesktopSidebar";
import { useIsMobile } from "@/hooks/use-mobile";
import bumpCityLogo from "@/assets/bump-city-logo-hz.png";

export interface MobileLayoutProps {
  children: ReactNode;
  hideNav?: boolean;
}

const BrandHeader = () => (
  <div className="flex justify-center pt-8 pb-0">
    <img src={bumpCityLogo} alt="Bump City" className="h-8" />
  </div>
);

/**
 * Page-level wrapper. When used inside the persistent AppShell (default
 * protected routes), this collapses to a passthrough so the shell's sidebar
 * and bottom nav remain mounted across navigations (no flash on click).
 *
 * For standalone pages that pass `hideNav` (auth, onboarding, setup), this
 * still renders the original full-bleed centered layout without nav.
 */
export const MobileLayout = ({ children, hideNav }: MobileLayoutProps) => {
  const isMobile = useIsMobile();

  if (hideNav) {
    return (
      <div className="flex justify-center min-h-screen bg-muted/50">
        <div className="w-full max-w-[430px] md:max-w-none min-h-screen bg-background relative flex flex-col shadow-2xl md:shadow-none">
          <main className="flex-1 overflow-y-auto">{children}</main>
        </div>
      </div>
    );
  }

  // Inside AppShell — just render children. Shell provides chrome.
  return <>{children}</>;
};

/**
 * Persistent app shell mounted once for all protected routes. Sidebar and
 * bottom nav stay mounted across navigations; only the inner content area
 * swaps when a route changes (and lazy chunks suspend in-place rather than
 * blanking the whole screen).
 */
export const AppShell = ({ children }: { children: ReactNode }) => {
  const isMobile = useIsMobile();

  if (!isMobile) {
    return (
      <div className="flex min-h-screen bg-muted/50">
        <DesktopSidebar />
        <main className="flex-1 overflow-y-auto">
          <div className="max-w-4xl mx-auto">
            <BrandHeader />
            {children}
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="flex justify-center min-h-screen bg-muted/50">
      <div className="w-full max-w-[430px] md:max-w-none min-h-screen bg-background relative flex flex-col shadow-2xl md:shadow-none">
        <main className="flex-1 overflow-y-auto pb-20">
          <BrandHeader />
          {children}
        </main>
        <BottomNav />
      </div>
    </div>
  );
};
