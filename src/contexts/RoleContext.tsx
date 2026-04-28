import { createContext, useContext, useEffect, useState, ReactNode, useMemo, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useActiveEvent } from "@/contexts/ActiveEventContext";

export type EventRole = "host" | "co-host" | "honoree" | "guest" | null;
export type PlatformRole = "super_admin" | "admin" | null;
export type ImpersonatedRole = "host" | "co-host" | "honoree" | "guest" | "admin" | null;

interface RoleContextType {
  eventRole: EventRole;
  platformRole: PlatformRole;
  loading: boolean;
  isHost: boolean;
  isHonoree: boolean;
  isGuest: boolean;
  isAdmin: boolean;
  isSuperAdmin: boolean;
  // Impersonation (admins only). When set, overrides effective role checks app-wide.
  impersonatedRole: ImpersonatedRole;
  setImpersonatedRole: (role: ImpersonatedRole) => void;
  isImpersonating: boolean;
}

const RoleContext = createContext<RoleContextType | undefined>(undefined);
const IMPERSONATE_KEY = "bumpcity:impersonate-role";

export const RoleProvider = ({ children }: { children: ReactNode }) => {
  const { user, loading: authLoading } = useAuth();
  const { activeEvent, loading: eventLoading } = useActiveEvent();
  const [eventRole, setEventRole] = useState<EventRole>(null);
  const [platformRole, setPlatformRole] = useState<PlatformRole>(null);
  const [platformLoaded, setPlatformLoaded] = useState(false);
  const [eventRoleLoaded, setEventRoleLoaded] = useState(false);
  const [impersonatedRole, setImpersonatedRoleState] = useState<ImpersonatedRole>(() => {
    if (typeof window === "undefined") return null;
    const v = sessionStorage.getItem(IMPERSONATE_KEY);
    return (v as ImpersonatedRole) || null;
  });

  const setImpersonatedRole = useCallback((role: ImpersonatedRole) => {
    setImpersonatedRoleState(role);
    if (typeof window !== "undefined") {
      if (role) sessionStorage.setItem(IMPERSONATE_KEY, role);
      else sessionStorage.removeItem(IMPERSONATE_KEY);
    }
  }, []);

  // Platform role: fetch once per user
  useEffect(() => {
    let cancelled = false;
    if (!user) {
      setPlatformRole(null);
      setPlatformLoaded(true);
      return;
    }
    setPlatformLoaded(false);
    (async () => {
      const { data } = await supabase
        .from("user_roles")
        .select("role")
        .eq("user_id", user.id)
        .maybeSingle();
      if (cancelled) return;
      const r = (data?.role as string) || null;
      setPlatformRole(r === "super_admin" || r === "admin" ? (r as PlatformRole) : null);
      setPlatformLoaded(true);
    })();
    return () => {
      cancelled = true;
    };
  }, [user]);

  // Event role: refetch when active event changes
  useEffect(() => {
    let cancelled = false;
    if (!user || !activeEvent) {
      setEventRole(null);
      setEventRoleLoaded(true);
      return;
    }
    if (activeEvent.user_id === user.id) {
      setEventRole((prev) => prev ?? "host");
    }
    setEventRoleLoaded(false);
    (async () => {
      const { data: memberData } = await supabase
        .from("event_members")
        .select("role")
        .eq("event_id", activeEvent.id)
        .eq("user_id", user.id)
        .maybeSingle();
      if (cancelled) return;
      if (memberData) {
        setEventRole(memberData.role as EventRole);
      } else if (activeEvent.user_id === user.id) {
        setEventRole("host");
      } else {
        setEventRole(null);
      }
      setEventRoleLoaded(true);
    })();
    return () => {
      cancelled = true;
    };
  }, [user, activeEvent]);

  const value = useMemo<RoleContextType>(() => {
    // Real values
    const realIsAdmin = platformRole === "admin" || platformRole === "super_admin";

    // Only admins can impersonate
    const activeImpersonation = realIsAdmin ? impersonatedRole : null;

    let effectiveEventRole: EventRole = eventRole;
    let effectivePlatformRole: PlatformRole = platformRole;

    if (activeImpersonation) {
      if (activeImpersonation === "admin") {
        effectivePlatformRole = "admin";
        effectiveEventRole = "host";
      } else {
        effectivePlatformRole = null;
        effectiveEventRole = activeImpersonation as EventRole;
      }
    }

    const isHost = effectiveEventRole === "host" || effectiveEventRole === "co-host";
    const isAdmin = effectivePlatformRole === "admin" || effectivePlatformRole === "super_admin";

    return {
      eventRole: effectiveEventRole,
      platformRole: effectivePlatformRole,
      loading: authLoading || eventLoading || !platformLoaded || !eventRoleLoaded,
      isHost,
      isHonoree: effectiveEventRole === "honoree",
      isGuest: effectiveEventRole === "guest",
      isAdmin,
      isSuperAdmin: effectivePlatformRole === "super_admin",
      impersonatedRole: activeImpersonation,
      setImpersonatedRole,
      isImpersonating: !!activeImpersonation,
    };
  }, [eventRole, platformRole, authLoading, eventLoading, platformLoaded, eventRoleLoaded, impersonatedRole, setImpersonatedRole]);

  return <RoleContext.Provider value={value}>{children}</RoleContext.Provider>;
};

export const useRoleContext = () => {
  const ctx = useContext(RoleContext);
  if (!ctx) throw new Error("useRoleContext must be used within RoleProvider");
  return ctx;
};
