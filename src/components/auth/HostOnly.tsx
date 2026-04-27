import { Navigate } from "react-router-dom";
import { useEventRole } from "@/hooks/useEventRole";

export const HostOnly = ({ children }: { children: React.ReactNode }) => {
  const { isHost, isAdmin, loading } = useEventRole();
  // While roles load, render children optimistically — page-level guards (and
  // sidebar visibility) handle the unauthorized case. This avoids a full-screen
  // spinner that flashes on every navigation.
  if (loading) return <>{children}</>;
  if (!isHost && !isAdmin) return <Navigate to="/" replace />;
  return <>{children}</>;
};
