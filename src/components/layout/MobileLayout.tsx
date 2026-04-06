import { ReactNode } from "react";
import { BottomNav } from "./BottomNav";
import { DesktopSidebar } from "./DesktopSidebar";
import { useIsMobile } from "@/hooks/use-mobile";

export interface MobileLayoutProps {
  children: ReactNode;
  hideNav?: boolean;
}

export const MobileLayout = ({ children, hideNav }: MobileLayoutProps) => {
  const isMobile = useIsMobile();

  if (!isMobile && !hideNav) {
    return (
      <div className="flex min-h-screen bg-muted/50">
        <DesktopSidebar />
        <main className="flex-1 overflow-y-auto">
          <div className="max-w-4xl mx-auto">
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
          {children}
        </main>
        {!hideNav && <BottomNav />}
      </div>
    </div>
  );
};
