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
  // True until the very first resolve of platform + event role. Pages that
  // gate their initial render on roles should use this. After first resolve
  // it stays false, so subsequent refetches don't blank the UI.
  loading: boolean;
  // True only while a per-event role fetch is in flight. Use for inline
  // skeletons; do not blank the page on this.
  eventRoleFetching: boolean;
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
  // *Loaded once. These flip to true on first resolve and never go back to
  // false — they drive the initial-render gate. Use *Fetching for refetch UX.
  const [platformLoadedOnce, setPlatformLoadedOnce] = useState(false);
  const [eventRoleLoadedOnce, setEventRoleLoadedOnce] = useState(false);
  const [eventRoleFetching, setEventRoleFetching] = useState(false);
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

  // Platform role: fetch once per user id. Keyed by id (not user object)
  // so token refresh doesn't trigger a refetch.
  const userId = user?.id ?? null;
  useEffect(() => {
    let cancelled = false;
    if (!userId) {
      setPlatformRole(null);
      setPlatformLoadedOnce(true);
      return;
    }
    (async () => {
      const { data } = await supabase
        .from("user_roles")
        .select("role")
        .eq("user_id", userId)
        .maybeSingle();
      if (cancelled) return;
      const r = (data?.role as string) || null;
      setPlatformRole(r === "super_admin" || r === "admin" ? (r as PlatformRole) : null);
      setPlatformLoadedOnce(true);
    })();
    return () => {
      cancelled = true;
    };
  }, [userId]);

  // Event role: refetch when active event id changes (not the event object).
  const activeEventId = activeEvent?.id ?? null;
  const activeEventOwnerId = activeEvent?.user_id ?? null;
  useEffect(() => {
    let cancelled = false;
    if (!userId || !activeEventId) {
      setEventRole(null);
      setEventRoleFetching(false);
      setEventRoleLoadedOnce(true);
      return;
    }
    // If we own the event, set role optimistically so the UI doesn't flash
    // through "no role" while the membership query is in flight.
    if (activeEventOwnerId === userId) {
      setEventRole((prev) => prev ?? "host");
    }
    setEventRoleFetching(true);
    (async () => {
      const { data: memberData } = await supabase
        .from("event_members")
        .select("role")
        .eq("event_id", activeEventId)
        .eq("user_id", userId)
        .maybeSingle();
      if (cancelled) return;
      if (activeEventOwnerId === userId) {
        setEventRole("host");
      } else if (memberData) {
        setEventRole(memberData.role as EventRole);
      } else {
        setEventRole(null);
      }
      setEventRoleFetching(false);
      setEventRoleLoadedOnce(true);
    })();
    return () => {
      cancelled = true;
    };
  }, [userId, activeEventId, activeEventOwnerId]);

  const value = useMemo<RoleContextType>(() => {
    // Real values
    const realIsAdmin = platformRole === "admin" || platformRole === "super_admin";

    // Only admins can impersonate
    const activeImpersonation = realIsAdmin ? impersonatedRole : null;

    let effectiveEventRole: EventRole = eventRole;
    let effectivePlatformRole: PlatformRole = platformRole;

    // Impersonation takes effect on every event, including ones the admin
    // owns — so previewing "as Guest" actually hides edit controls etc. The
    // orange ImpersonationBanner with "Stop preview" is the escape hatch.
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
      // Initial-render gate: stays true only until the first resolve of both
      // platform role and (if there's an active event) event role. After that
      // it stays false through refetches, switches, and token refresh.
      loading: authLoading || eventLoading || !platformLoadedOnce || !eventRoleLoadedOnce,
      eventRoleFetching,
      isHost,
      isHonoree: effectiveEventRole === "honoree",
      isGuest: effectiveEventRole === "guest",
      isAdmin,
      isSuperAdmin: effectivePlatformRole === "super_admin",
      impersonatedRole: activeImpersonation,
      setImpersonatedRole,
      isImpersonating: !!activeImpersonation,
    };
  }, [eventRole, platformRole, authLoading, eventLoading, platformLoadedOnce, eventRoleLoadedOnce, eventRoleFetching, impersonatedRole, setImpersonatedRole]);

  return <RoleContext.Provider value={value}>{children}</RoleContext.Provider>;
};

export const useRoleContext = () => {
  const ctx = useContext(RoleContext);
  if (!ctx) throw new Error("useRoleContext must be used within RoleProvider");
  return ctx;
};
