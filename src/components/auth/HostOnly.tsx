import { Navigate } from "react-router-dom";
import { useEventRole } from "@/hooks/useEventRole";

export const HostOnly = ({ children }: { children: React.ReactNode }) => {
  const { isHost, isAdmin, loading } = useEventRole();
  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full" />
      </div>
    );
  }
  if (!isHost && !isAdmin) return <Navigate to="/" replace />;
  return <>{children}</>;
};
