import { BrowserRouter, Route, Routes, Navigate } from "react-router-dom";

import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AppModeProvider } from "@/contexts/AppModeContext";
import { ActivityFeedProvider } from "@/contexts/ActivityFeedContext";
import { AuthProvider, useAuth } from "@/contexts/AuthContext";
import HomePage from "./pages/HomePage";
import RegistryPage from "./pages/RegistryPage";
import GuestListPage from "./pages/GuestListPage";
import PredictionsPage from "./pages/PredictionsPage";
import ProfilePage from "./pages/ProfilePage";
import ShowerSetupPage from "./pages/ShowerSetupPage";
import RegistrySetupPage from "./pages/RegistrySetupPage";
import AuthPage from "./pages/AuthPage";
import ResetPasswordPage from "./pages/ResetPasswordPage";
import NotFound from "./pages/NotFound";

const ProtectedRoute = ({ children }: { children: React.ReactNode }) => {
  const { user, loading } = useAuth();
  if (loading) return <div className="flex items-center justify-center min-h-screen"><div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full" /></div>;
  if (!user) return <Navigate to="/auth" replace />;
  return <>{children}</>;
};

const App = () => (
  <TooltipProvider>
    <Toaster />
    <Sonner />
    <BrowserRouter>
      <AuthProvider>
        <AppModeProvider>
          <ActivityFeedProvider>
            <Routes>
              <Route path="/auth" element={<AuthPage />} />
              <Route path="/reset-password" element={<ResetPasswordPage />} />
              <Route path="/" element={<ProtectedRoute><HomePage /></ProtectedRoute>} />
              <Route path="/setup/shower" element={<ProtectedRoute><ShowerSetupPage /></ProtectedRoute>} />
              <Route path="/setup/registry" element={<ProtectedRoute><RegistrySetupPage /></ProtectedRoute>} />
              <Route path="/registry" element={<ProtectedRoute><RegistryPage /></ProtectedRoute>} />
              <Route path="/guests" element={<ProtectedRoute><GuestListPage /></ProtectedRoute>} />
              <Route path="/predictions" element={<ProtectedRoute><PredictionsPage /></ProtectedRoute>} />
              <Route path="/profile" element={<ProtectedRoute><ProfilePage /></ProtectedRoute>} />
              <Route path="*" element={<NotFound />} />
            </Routes>
          </ActivityFeedProvider>
        </AppModeProvider>
      </AuthProvider>
    </BrowserRouter>
  </TooltipProvider>
);

export default App;
