import { lazy, Suspense, type ReactNode } from "react";
import { BrowserRouter, Route, Routes, Navigate } from "react-router-dom";

import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AppModeProvider } from "@/contexts/AppModeContext";
import { ActiveEventProvider } from "@/contexts/ActiveEventContext";
import { ActivityFeedProvider } from "@/contexts/ActivityFeedContext";
import { AuthProvider, useAuth } from "@/contexts/AuthContext";
import { HostOnly } from "./components/auth/HostOnly";

const HomePage = lazy(() => import("./pages/HomePage"));
const RegistryPage = lazy(() => import("./pages/RegistryPage"));
const GuestListPage = lazy(() => import("./pages/GuestListPage"));
const PredictionsPage = lazy(() => import("./pages/PredictionsPage"));
const ProfilePage = lazy(() => import("./pages/ProfilePage"));
const ShowerSetupPage = lazy(() => import("./pages/ShowerSetupPage"));
const ShowersListPage = lazy(() => import("./pages/ShowersListPage"));
const ShowerDetailPage = lazy(() => import("./pages/ShowerDetailPage"));
const AuthPage = lazy(() => import("./pages/AuthPage"));
const ResetPasswordPage = lazy(() => import("./pages/ResetPasswordPage"));
const InviteBuilderPage = lazy(() => import("./pages/InviteBuilderPage"));
const GiftTrackerPage = lazy(() => import("./pages/GiftTrackerPage"));
const PlanningPage = lazy(() => import("./pages/PlanningPage"));
const VendorDirectoryPage = lazy(() => import("./pages/VendorDirectoryPage"));
const CommunityEventsPage = lazy(() => import("./pages/CommunityEventsPage"));
const AdminPage = lazy(() => import("./pages/AdminPage"));
const JoinEventPage = lazy(() => import("./pages/JoinEventPage"));
const GuestEventPage = lazy(() => import("./pages/GuestEventPage"));
const GetStartedPage = lazy(() => import("./pages/GetStartedPage"));
const UnsubscribePage = lazy(() => import("./pages/UnsubscribePage"));
const NotFound = lazy(() => import("./pages/NotFound"));

const LoadingScreen = () => <main className="min-h-screen bg-background" aria-busy="true" aria-label="Loading" />;

const ProtectedRoute = ({ children }: { children: ReactNode }) => {
  const { user, loading } = useAuth();
  if (loading) return <LoadingScreen />;
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
              <Suspense fallback={<LoadingScreen />}>
                <Routes>
                  <Route path="/get-started" element={<GetStartedPage />} />
                  <Route path="/auth" element={<AuthPage />} />
                  <Route path="/reset-password" element={<ResetPasswordPage />} />
                  <Route path="/join" element={<ProtectedRoute><JoinEventPage /></ProtectedRoute>} />
                  <Route path="/event/:eventId" element={<ProtectedRoute><GuestEventPage /></ProtectedRoute>} />
                  <Route path="/" element={<ProtectedRoute><HomePage /></ProtectedRoute>} />
                  <Route path="/setup/shower" element={<ProtectedRoute><ShowerSetupPage /></ProtectedRoute>} />
                  <Route path="/showers" element={<ProtectedRoute><ShowersListPage /></ProtectedRoute>} />
                  <Route path="/showers/:eventId" element={<ProtectedRoute><ShowerDetailPage /></ProtectedRoute>} />
                  <Route path="/setup/registry" element={<Navigate to="/setup/shower" replace />} />
                  <Route path="/registry" element={<ProtectedRoute><RegistryPage /></ProtectedRoute>} />
                  <Route path="/guests" element={<ProtectedRoute><HostOnly><GuestListPage /></HostOnly></ProtectedRoute>} />
                  <Route path="/predictions" element={<ProtectedRoute><PredictionsPage /></ProtectedRoute>} />
                  <Route path="/invites" element={<ProtectedRoute><HostOnly><InviteBuilderPage /></HostOnly></ProtectedRoute>} />
                  <Route path="/gift-tracker" element={<ProtectedRoute><HostOnly><GiftTrackerPage /></HostOnly></ProtectedRoute>} />
                  <Route path="/planning" element={<ProtectedRoute><HostOnly><PlanningPage /></HostOnly></ProtectedRoute>} />
                  <Route path="/vendors" element={<ProtectedRoute><VendorDirectoryPage /></ProtectedRoute>} />
                  <Route path="/community" element={<ProtectedRoute><CommunityEventsPage /></ProtectedRoute>} />
                  <Route path="/admin" element={<ProtectedRoute><AdminPage /></ProtectedRoute>} />
                  <Route path="/profile" element={<ProtectedRoute><ProfilePage /></ProtectedRoute>} />
                  <Route path="/unsubscribe" element={<UnsubscribePage />} />
                  <Route path="*" element={<NotFound />} />
                </Routes>
              </Suspense>
            </ActivityFeedProvider>
          </AppModeProvider>
        </ActiveEventProvider>
      </AuthProvider>
    </BrowserRouter>
  </TooltipProvider>
);

export default App;
