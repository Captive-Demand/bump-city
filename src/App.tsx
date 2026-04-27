import { lazy, Suspense, type ReactNode } from "react";
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

// Blank fallback used at the page-content level. The persistent AppShell stays
// mounted around it so sidebar/nav never disappears during a route change.
const RouteFallback = () => <div className="min-h-[40vh]" aria-busy="true" aria-label="Loading" />;
const FullScreenFallback = () => <main className="min-h-screen bg-background" aria-busy="true" aria-label="Loading" />;

const ProtectedRoute = ({ children }: { children: ReactNode }) => {
  const { user, loading } = useAuth();
  if (loading) return <FullScreenFallback />;
  if (!user) return <Navigate to="/auth" replace />;
  return <>{children}</>;
};

// Wraps a protected route's element in the persistent shell + page-level Suspense.
const Shell = ({ children }: { children: ReactNode }) => (
  <ProtectedRoute>
    <AppShell>
      <Suspense fallback={<RouteFallback />}>{children}</Suspense>
    </AppShell>
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
                <Suspense fallback={<FullScreenFallback />}>
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
                </Suspense>
              </ActivityFeedProvider>
            </AppModeProvider>
          </RoleProvider>
        </ActiveEventProvider>
      </AuthProvider>
    </BrowserRouter>
  </TooltipProvider>
);

export default App;
