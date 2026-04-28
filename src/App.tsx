import { type ReactNode } from "react";
import { BrowserRouter, Route, Routes, Navigate } from "react-router-dom";

import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AppModeProvider } from "@/contexts/AppModeContext";
import { ActiveEventProvider } from "@/contexts/ActiveEventContext";
import { ActivityFeedProvider } from "@/contexts/ActivityFeedContext";
import { AuthProvider, useAuth } from "@/contexts/AuthContext";
import { RoleProvider } from "@/contexts/RoleContext";
import { HostOnly } from "./components/auth/HostOnly";
import { AppShell } from "@/components/layout/MobileLayout";
import HomePage from "./pages/HomePage";
import RegistryPage from "./pages/RegistryPage";
import GuestListPage from "./pages/GuestListPage";
import PredictionsPage from "./pages/PredictionsPage";
import ProfilePage from "./pages/ProfilePage";
import ShowerSetupPage from "./pages/ShowerSetupPage";
import ShowersListPage from "./pages/ShowersListPage";
import ShowerDetailPage from "./pages/ShowerDetailPage";
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

const FullScreenFallback = () => <main className="min-h-screen bg-background" aria-busy="true" aria-label="Loading" />;

const ProtectedRoute = ({ children }: { children: ReactNode }) => {
  const { user, loading } = useAuth();
  if (loading) return <FullScreenFallback />;
  if (!user) return <Navigate to="/auth" replace />;
  return <>{children}</>;
};

// Wraps a protected route's element in the persistent shell.
const Shell = ({ children }: { children: ReactNode }) => (
  <ProtectedRoute>
    <AppShell>{children}</AppShell>
  </ProtectedRoute>
);

const App = () => (
  <TooltipProvider>
    <Toaster />
    <Sonner />
    <BrowserRouter>
      <AuthProvider>
        <ActiveEventProvider>
          <RoleProvider>
            <AppModeProvider>
              <ActivityFeedProvider>
                <Routes>
                  {/* Standalone pages (no shell) */}
                  <Route path="/get-started" element={<GetStartedPage />} />
                  <Route path="/auth" element={<AuthPage />} />
                  <Route path="/reset-password" element={<ResetPasswordPage />} />
                  <Route path="/unsubscribe" element={<UnsubscribePage />} />
                  <Route path="/setup/shower" element={<ProtectedRoute><ShowerSetupPage /></ProtectedRoute>} />
                  <Route path="/setup/registry" element={<Navigate to="/setup/shower" replace />} />
                  <Route path="/join" element={<ProtectedRoute><JoinEventPage /></ProtectedRoute>} />
                  <Route path="/event/:eventId" element={<ProtectedRoute><GuestEventPage /></ProtectedRoute>} />

                  {/* Protected pages inside the persistent shell */}
                  <Route path="/" element={<Shell><HomePage /></Shell>} />
                  <Route path="/showers" element={<Shell><ShowersListPage /></Shell>} />
                  <Route path="/showers/:eventId" element={<Shell><ShowerDetailPage /></Shell>} />
                  <Route path="/registry" element={<Shell><RegistryPage /></Shell>} />
                  <Route path="/guests" element={<Shell><HostOnly><GuestListPage /></HostOnly></Shell>} />
                  <Route path="/predictions" element={<Shell><PredictionsPage /></Shell>} />
                  <Route path="/invites" element={<Shell><HostOnly><InviteBuilderPage /></HostOnly></Shell>} />
                  <Route path="/gift-tracker" element={<Shell><HostOnly><GiftTrackerPage /></HostOnly></Shell>} />
                  <Route path="/planning" element={<Shell><HostOnly><PlanningPage /></HostOnly></Shell>} />
                  <Route path="/vendors" element={<Shell><VendorDirectoryPage /></Shell>} />
                  <Route path="/community" element={<Shell><CommunityEventsPage /></Shell>} />
                  <Route path="/admin" element={<Shell><AdminPage /></Shell>} />
                  <Route path="/profile" element={<Shell><ProfilePage /></Shell>} />

                  <Route path="*" element={<NotFound />} />
                </Routes>
              </ActivityFeedProvider>
            </AppModeProvider>
          </RoleProvider>
        </ActiveEventProvider>
      </AuthProvider>
    </BrowserRouter>
  </TooltipProvider>
);

export default App;
