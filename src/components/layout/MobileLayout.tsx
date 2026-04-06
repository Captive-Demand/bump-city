import { ReactNode } from "react";
import { BottomNav } from "./BottomNav";

export interface MobileLayoutProps {
  children: ReactNode;
  hideNav?: boolean;
}

export const MobileLayout = ({ children, hideNav }: MobileLayoutProps) => {
  return (
    <div className="flex justify-center min-h-screen bg-muted/50">
      <div className="w-full max-w-[430px] min-h-screen bg-background relative flex flex-col shadow-2xl">
        <main className="flex-1 overflow-y-auto pb-20">
          {children}
        </main>
        {!hideNav && <BottomNav />}
      </div>
    </div>
  );
};
