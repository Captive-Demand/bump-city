import { forwardRef, useEffect, useRef, type ReactNode } from "react";
import { useLocation } from "react-router-dom";
import { BottomNav } from "./BottomNav";
import { DesktopSidebar } from "./DesktopSidebar";
import { ImpersonationBanner } from "./ImpersonationBanner";
import { useIsMobile } from "@/hooks/use-mobile";
import bumpCityLogo from "@/assets/bump-city-logo-hz.png";

export interface MobileLayoutProps {
  children: ReactNode;
  hideNav?: boolean;
}

const BrandHeader = forwardRef<HTMLDivElement>((_, ref) => (
  <div
    ref={ref}
    className="sticky top-0 z-40 flex justify-center pt-4 pb-3 bg-background/85 backdrop-blur-md border-b border-border/40"
  >
    <img src={bumpCityLogo} alt="Bump City" className="h-7" />
  </div>
));

BrandHeader.displayName = "BrandHeader";

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
 * swaps when a route changes without blanking the whole screen.
 */
export const AppShell = ({ children }: { children: ReactNode }) => {
  const isMobile = useIsMobile();
  const location = useLocation();
  const mainRef = useRef<HTMLElement | null>(null);

  useEffect(() => {
    requestAnimationFrame(() => {
      mainRef.current?.scrollTo({ top: 0, left: 0, behavior: "auto" });
      window.scrollTo({ top: 0, left: 0, behavior: "auto" });
    });
  }, [location.pathname]);

  if (!isMobile) {
    return (
      <div className="flex h-screen bg-muted/50">
        <DesktopSidebar />
        <main ref={mainRef} className="flex-1 overflow-y-auto">
          <div className="max-w-4xl mx-auto">
            <BrandHeader />
            {children}
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="flex justify-center h-screen bg-muted/50">
      <div className="w-full max-w-[430px] md:max-w-none h-screen bg-background relative flex flex-col shadow-2xl md:shadow-none">
        <main ref={mainRef} className="flex-1 overflow-y-auto pb-20">
          <BrandHeader />
          {children}
        </main>
        <BottomNav />
      </div>
    </div>
  );
};
