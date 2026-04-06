import { BrowserRouter, Route, Routes } from "react-router-dom";

import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AppModeProvider } from "@/contexts/AppModeContext";
import HomePage from "./pages/HomePage";
import RegistryPage from "./pages/RegistryPage";
import GuestListPage from "./pages/GuestListPage";
import PredictionsPage from "./pages/PredictionsPage";
import ProfilePage from "./pages/ProfilePage";
import ShowerSetupPage from "./pages/ShowerSetupPage";
import RegistrySetupPage from "./pages/RegistrySetupPage";
import NotFound from "./pages/NotFound";

const App = () => (
  <TooltipProvider>
    <Toaster />
    <Sonner />
    <BrowserRouter>
      <AppModeProvider>
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/setup/shower" element={<ShowerSetupPage />} />
          <Route path="/setup/registry" element={<RegistrySetupPage />} />
          <Route path="/registry" element={<RegistryPage />} />
          <Route path="/guests" element={<GuestListPage />} />
          <Route path="/predictions" element={<PredictionsPage />} />
          <Route path="/profile" element={<ProfilePage />} />
          <Route path="*" element={<NotFound />} />
        </Routes>
      </AppModeProvider>
    </BrowserRouter>
  </TooltipProvider>
);

export default App;
