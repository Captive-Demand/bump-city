import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";

export interface ShowerStats {
  guests: number;
  guestsPending: number;
  registry: number;
  registryClaimed: number;
  invitesSent: number;
  invitesUnsent: number;
  predictions: number;
  tasks: number;
  gifts: number;
  vendors: number;
  loading: boolean;
}

const EMPTY: ShowerStats = {
  guests: 0,
  guestsPending: 0,
  registry: 0,
  registryClaimed: 0,
  invitesSent: 0,
  invitesUnsent: 0,
  predictions: 0,
  tasks: 0,
  gifts: 0,
  vendors: 0,
  loading: true,
};

/**
 * Single source of truth for the stats shown on the shower detail page.
 * Run the count queries once and share the result with hero/status-strip/tiles
 * so we don't multiply the same network round-trip across siblings.
 */
export const useShowerStats = (eventId: string | null | undefined, city?: string | null): ShowerStats => {
  const [stats, setStats] = useState<ShowerStats>(EMPTY);

  useEffect(() => {
    let cancelled = false;
    if (!eventId) {
      setStats(EMPTY);
      return;
    }
    setStats((s) => ({ ...s, loading: true }));
    (async () => {
      const opts = { count: "exact" as const, head: true };
      const [g, gp, r, rc, iSent, iUnsent, p, t, gi, v] = await Promise.all([
        supabase.from("guests").select("id", opts).eq("event_id", eventId),
        supabase.from("guests").select("id", opts).eq("event_id", eventId).eq("status", "pending"),
        supabase.from("registry_items").select("id", opts).eq("event_id", eventId),
        supabase.from("registry_items").select("id", opts).eq("event_id", eventId).eq("claimed", true),
        supabase.from("guests").select("id", opts).eq("event_id", eventId).eq("invite_sent", true),
        supabase.from("guests").select("id", opts).eq("event_id", eventId).eq("invite_sent", false),
        supabase.from("predictions").select("id", opts).eq("event_id", eventId),
        supabase.from("planning_tasks").select("id", opts).eq("event_id", eventId).eq("completed", false),
        supabase.from("gifts_received").select("id", opts).eq("event_id", eventId),
        city
          ? supabase.from("vendors").select("id", opts).eq("city", city)
          : Promise.resolve({ count: 0 } as { count: number }),
      ]);
      if (cancelled) return;
      setStats({
        guests: g.count || 0,
        guestsPending: gp.count || 0,
        registry: r.count || 0,
        registryClaimed: rc.count || 0,
        invitesSent: iSent.count || 0,
        invitesUnsent: iUnsent.count || 0,
        predictions: p.count || 0,
        tasks: t.count || 0,
        gifts: gi.count || 0,
        vendors: v.count || 0,
        loading: false,
      });
    })();
    return () => {
      cancelled = true;
    };
  }, [eventId, city]);

  return stats;
};
