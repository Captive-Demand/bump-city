import { createContext, useContext, useState, useEffect, ReactNode } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

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
  const { user } = useAuth();
  const [mode, setMode] = useState<AppMode>("choose");
  const [setupData, setSetupData] = useState<SetupData>({});
  const [modeLoading, setModeLoading] = useState(true);

  useEffect(() => {
    const loadEvent = async () => {
      if (!user) { setModeLoading(false); return; }
      const { data } = await supabase
        .from("events")
        .select("*")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle();

      if (data) {
        setMode(data.event_type === "shower" ? "shower" : "registry");
        setSetupData({
          honoreeName: data.honoree_name || undefined,
          dueDate: data.due_date ? new Date(data.due_date) : undefined,
          eventDate: data.event_date ? new Date(data.event_date) : undefined,
          city: data.city || undefined,
          theme: data.theme || undefined,
          giftPolicy: (data.gift_policy as GiftPolicy) || undefined,
          clearWrapping: data.clear_wrapping || false,
          giftNote: data.gift_note || undefined,
          registryName: data.registry_name || undefined,
          registryPrivate: data.registry_private || false,
        });
      }
      setModeLoading(false);
    };
    loadEvent();
  }, [user]);

  const updateSetupData = (data: Partial<SetupData>) => {
    setSetupData((prev) => ({ ...prev, ...data }));
  };

  return (
    <AppModeContext.Provider value={{ mode, setMode, setupData, updateSetupData, modeLoading }}>
      {children}
    </AppModeContext.Provider>
  );
};

export const useAppMode = () => {
  const ctx = useContext(AppModeContext);
  if (!ctx) throw new Error("useAppMode must be used within AppModeProvider");
  return ctx;
};
