import { createContext, useContext, useMemo, useState, useEffect, ReactNode } from "react";
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
  /**
   * Always exactly tracks the active event:
   *   - no event → "choose"
   *   - event_type === "registry" → "registry"
   *   - otherwise → "shower"
   *
   * Derived (not stored in state) so we never render a stale "choose" frame
   * after the active event finishes loading. Previously the mode was a
   * useState mirror updated via useEffect, which produced a 1-frame flash
   * of the "Welcome, you don't have an event yet" empty home on every load.
   */
  mode: AppMode;
  setupData: SetupData;
  updateSetupData: (data: Partial<SetupData>) => void;
  modeLoading: boolean;
}

const AppModeContext = createContext<AppModeContextType | undefined>(undefined);

export const AppModeProvider = ({ children }: { children: ReactNode }) => {
  const { activeEvent, loading: eventLoading } = useActiveEvent();
  const [setupData, setSetupData] = useState<SetupData>({});

  // Pure derivation — single source of truth is `activeEvent`.
  const mode: AppMode = useMemo(() => {
    if (!activeEvent) return "choose";
    return activeEvent.event_type === "registry" ? "registry" : "shower";
  }, [activeEvent]);

  // Setup data (form prefill values used by the setup wizard) still needs
  // to mirror the event since users can edit it pre-save. We sync from the
  // active event whenever it changes.
  useEffect(() => {
    if (eventLoading) return;
    if (activeEvent) {
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
      setSetupData({});
    }
  }, [activeEvent, eventLoading]);

  const updateSetupData = (data: Partial<SetupData>) => {
    setSetupData((prev) => ({ ...prev, ...data }));
  };

  return (
    <AppModeContext.Provider
      value={{ mode, setupData, updateSetupData, modeLoading: eventLoading }}
    >
      {children}
    </AppModeContext.Provider>
  );
};

export const useAppMode = () => {
  const ctx = useContext(AppModeContext);
  if (!ctx) throw new Error("useAppMode must be used within AppModeProvider");
  return ctx;
};
