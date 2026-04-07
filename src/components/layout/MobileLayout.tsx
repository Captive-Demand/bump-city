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
  <div className="flex justify-center pt-4 pb-1">
    <img src={bumpCityLogo} alt="Bump City" className="h-8" />
  </div>
);

export const MobileLayout = ({ children, hideNav }: MobileLayoutProps) => {
  const isMobile = useIsMobile();

  if (!isMobile && !hideNav) {
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
        {!hideNav && <BottomNav />}
      </div>
    </div>
  );
};
