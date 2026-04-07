import { createContext, useContext, useState, useEffect, ReactNode } from "react";
import { useActiveEvent } from "@/contexts/ActiveEventContext";

type AppMode = "choose" | "shower" | "registry";
type UserRole = "planner" | "expectant-parent";
type GiftPolicy = "bring-gift" | "no-gifts" | "bring-book";

export interface SetupData {
  role?: UserRole;
  honoreeName?: string;
  dueDate?: Date;
  eventDate?: Date;
  city?: string;
  theme?: string;
  giftPolicy?: GiftPolicy;
  clearWrapping?: boolean;
  giftNote?: string;
  registryName?: string;
  registryPrivate?: boolean;
}

interface AppModeContextType {
  mode: AppMode;
  setMode: (mode: AppMode) => void;
  setupData: SetupData;
  updateSetupData: (data: Partial<SetupData>) => void;
  modeLoading: boolean;
}

const AppModeContext = createContext<AppModeContextType | undefined>(undefined);

export const AppModeProvider = ({ children }: { children: ReactNode }) => {
  const { activeEvent, loading: eventLoading } = useActiveEvent();
  const [mode, setMode] = useState<AppMode>("choose");
  const [setupData, setSetupData] = useState<SetupData>({});

  useEffect(() => {
    if (eventLoading) return;
    if (activeEvent) {
      setMode(activeEvent.event_type === "shower" ? "shower" : "registry");
      setSetupData({
        honoreeName: activeEvent.honoree_name || undefined,
        dueDate: activeEvent.due_date ? new Date(activeEvent.due_date) : undefined,
        eventDate: activeEvent.event_date ? new Date(activeEvent.event_date) : undefined,
        city: activeEvent.city || undefined,
        theme: activeEvent.theme || undefined,
        giftPolicy: (activeEvent.gift_policy as GiftPolicy) || undefined,
        clearWrapping: activeEvent.clear_wrapping || false,
        giftNote: activeEvent.gift_note || undefined,
        registryName: activeEvent.registry_name || undefined,
        registryPrivate: activeEvent.registry_private || false,
      });
    } else {
      setMode("choose");
      setSetupData({});
    }
  }, [activeEvent, eventLoading]);

  const updateSetupData = (data: Partial<SetupData>) => {
    setSetupData((prev) => ({ ...prev, ...data }));
  };

  return (
    <AppModeContext.Provider value={{ mode, setMode, setupData, updateSetupData, modeLoading: eventLoading }}>
      {children}
    </AppModeContext.Provider>
  );
};

export const useAppMode = () => {
  const ctx = useContext(AppModeContext);
  if (!ctx) throw new Error("useAppMode must be used within AppModeProvider");
  return ctx;
};
