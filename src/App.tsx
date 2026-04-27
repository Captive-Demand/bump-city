import { BrowserRouter, Route, Routes, Navigate } from "react-router-dom";

import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AppModeProvider } from "@/contexts/AppModeContext";
import { ActiveEventProvider } from "@/contexts/ActiveEventContext";
import { ActivityFeedProvider } from "@/contexts/ActivityFeedContext";
import { AuthProvider, useAuth } from "@/contexts/AuthContext";
import HomePage from "./pages/HomePage";
import RegistryPage from "./pages/RegistryPage";
import GuestListPage from "./pages/GuestListPage";
import PredictionsPage from "./pages/PredictionsPage";
import ProfilePage from "./pages/ProfilePage";
import ShowerSetupPage from "./pages/ShowerSetupPage";

import AuthPage from "./pages/AuthPage";
import ResetPasswordPage from "./pages/ResetPasswordPage";
import InviteBuilderPage from "./pages/InviteBuilderPage";
import GiftTrackerPage from "./pages/GiftTrackerPage";
import PlanningPage from "./pages/PlanningPage";
import VendorDirectoryPage from "./pages/VendorDirectoryPage";
import CommunityEventsPage from "./pages/CommunityEventsPage";
import AdminPage from "./pages/AdminPage";
import JoinEventPage from "./pages/JoinEventPage";
import GuestEventPage from "./pages/GuestEventPage";
import GetStartedPage from "./pages/GetStartedPage";
import UnsubscribePage from "./pages/UnsubscribePage";
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
        <ActiveEventProvider>
          <AppModeProvider>
            <ActivityFeedProvider>
              <Routes>
                <Route path="/get-started" element={<GetStartedPage />} />
                <Route path="/auth" element={<AuthPage />} />
                <Route path="/reset-password" element={<ResetPasswordPage />} />
                <Route path="/join" element={<ProtectedRoute><JoinEventPage /></ProtectedRoute>} />
                <Route path="/event/:eventId" element={<ProtectedRoute><GuestEventPage /></ProtectedRoute>} />
                <Route path="/" element={<ProtectedRoute><HomePage /></ProtectedRoute>} />
                <Route path="/setup/shower" element={<ProtectedRoute><ShowerSetupPage /></ProtectedRoute>} />
                <Route path="/setup/registry" element={<Navigate to="/setup/shower" replace />} />
                <Route path="/registry" element={<ProtectedRoute><RegistryPage /></ProtectedRoute>} />
                <Route path="/guests" element={<ProtectedRoute><GuestListPage /></ProtectedRoute>} />
                <Route path="/predictions" element={<ProtectedRoute><PredictionsPage /></ProtectedRoute>} />
                <Route path="/invites" element={<ProtectedRoute><InviteBuilderPage /></ProtectedRoute>} />
                <Route path="/gift-tracker" element={<ProtectedRoute><GiftTrackerPage /></ProtectedRoute>} />
                <Route path="/planning" element={<ProtectedRoute><PlanningPage /></ProtectedRoute>} />
                <Route path="/vendors" element={<ProtectedRoute><VendorDirectoryPage /></ProtectedRoute>} />
                <Route path="/community" element={<ProtectedRoute><CommunityEventsPage /></ProtectedRoute>} />
                <Route path="/admin" element={<ProtectedRoute><AdminPage /></ProtectedRoute>} />
                <Route path="/profile" element={<ProtectedRoute><ProfilePage /></ProtectedRoute>} />
                <Route path="/unsubscribe" element={<UnsubscribePage />} />
                <Route path="*" element={<NotFound />} />
              </Routes>
            </ActivityFeedProvider>
          </AppModeProvider>
        </ActiveEventProvider>
      </AuthProvider>
    </BrowserRouter>
  </TooltipProvider>
);

export default App;
