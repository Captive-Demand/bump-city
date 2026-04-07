import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useEvent } from "@/hooks/useEvent";

export type EventRole = "host" | "co-host" | "honoree" | "guest" | null;
export type PlatformRole = "super_admin" | "admin" | null;

export const useEventRole = () => {
  const { user } = useAuth();
  const { event, loading: eventLoading } = useEvent();
  const [eventRole, setEventRole] = useState<EventRole>(null);
  const [platformRole, setPlatformRole] = useState<PlatformRole>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchRoles = async () => {
      if (!user) { setLoading(false); return; }

      // Fetch platform role
      const { data: roleData } = await supabase
        .from("user_roles")
        .select("role")
        .eq("user_id", user.id)
        .maybeSingle();

      if (roleData) {
        const r = roleData.role as string;
        if (r === "super_admin" || r === "admin") {
          setPlatformRole(r as PlatformRole);
        }
      }

      // Fetch event role from event_members
      if (event) {
        const { data: memberData } = await supabase
          .from("event_members")
          .select("role")
          .eq("event_id", event.id)
          .eq("user_id", user.id)
          .maybeSingle();

        if (memberData) {
          setEventRole(memberData.role as EventRole);
        } else {
          // Fallback: event owner without event_members row is host
          const { data: eventData } = await supabase
            .from("events")
            .select("user_id")
            .eq("id", event.id)
            .single();
          if (eventData && eventData.user_id === user.id) {
            setEventRole("host");
          }
        }
      }

      setLoading(false);
    };

    if (!eventLoading) fetchRoles();
  }, [user, event, eventLoading]);

  const isHost = eventRole === "host" || eventRole === "co-host";
  const isHonoree = eventRole === "honoree";
  const isGuest = eventRole === "guest";
  const isAdmin = platformRole === "admin" || platformRole === "super_admin";
  const isSuperAdmin = platformRole === "super_admin";

  return {
    eventRole,
    platformRole,
    loading: loading || eventLoading,
    isHost,
    isHonoree,
    isGuest,
    isAdmin,
    isSuperAdmin,
  };
};
