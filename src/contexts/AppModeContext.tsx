import { createContext, useContext, useState, ReactNode } from "react";

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
}

const AppModeContext = createContext<AppModeContextType | undefined>(undefined);

export const AppModeProvider = ({ children }: { children: ReactNode }) => {
  const [mode, setMode] = useState<AppMode>("choose");
  const [setupData, setSetupData] = useState<SetupData>({});

  const updateSetupData = (data: Partial<SetupData>) => {
    setSetupData((prev) => ({ ...prev, ...data }));
  };

  return (
    <AppModeContext.Provider value={{ mode, setMode, setupData, updateSetupData }}>
      {children}
    </AppModeContext.Provider>
  );
};

export const useAppMode = () => {
  const ctx = useContext(AppModeContext);
  if (!ctx) throw new Error("useAppMode must be used within AppModeProvider");
  return ctx;
};
