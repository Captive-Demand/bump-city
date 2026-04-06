import { createContext, useContext, useState, ReactNode } from "react";

type AppMode = "choose" | "shower" | "registry";

interface AppModeContextType {
  mode: AppMode;
  setMode: (mode: AppMode) => void;
}

const AppModeContext = createContext<AppModeContextType | undefined>(undefined);

export const AppModeProvider = ({ children }: { children: ReactNode }) => {
  const [mode, setMode] = useState<AppMode>("choose");
  return (
    <AppModeContext.Provider value={{ mode, setMode }}>
      {children}
    </AppModeContext.Provider>
  );
};

export const useAppMode = () => {
  const ctx = useContext(AppModeContext);
  if (!ctx) throw new Error("useAppMode must be used within AppModeProvider");
  return ctx;
};
