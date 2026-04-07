import { createContext, useContext, useState, useEffect, useCallback, ReactNode } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

export interface EventData {
  id: string;
  event_type: string;
  honoree_name: string | null;
  due_date: string | null;
  event_date: string | null;
  city: string | null;
  theme: string | null;
  gift_policy: string;
  clear_wrapping: boolean;
  gift_note: string | null;
  surprise_mode: boolean;
  registry_name: string | null;
  registry_private: boolean;
  event_image_url: string | null;
  invite_template: string | null;
  invite_title: string | null;
  invite_message: string | null;
  invite_image_url: string | null;
  invite_time_range: string | null;
  user_id: string;
}

interface ActiveEventContextType {
  activeEvent: EventData | null;
  allEvents: EventData[];
  switchEvent: (eventId: string) => void;
  loading: boolean;
  refetch: () => Promise<void>;
}

const ActiveEventContext = createContext<ActiveEventContextType | undefined>(undefined);

const STORAGE_KEY = "bump_city_active_event_id";

export const ActiveEventProvider = ({ children }: { children: ReactNode }) => {
  const { user } = useAuth();
  const [allEvents, setAllEvents] = useState<EventData[]>([]);
  const [activeEventId, setActiveEventId] = useState<string | null>(() => {
    try { return localStorage.getItem(STORAGE_KEY); } catch { return null; }
  });
  const [loading, setLoading] = useState(true);

  const fetchEvents = useCallback(async () => {
    if (!user) {
      setAllEvents([]);
      setLoading(false);
      return;
    }

    // Fetch events user owns
    const { data: ownedEvents } = await supabase
      .from("events")
      .select("*")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false });

    // Fetch events user is a member of
    const { data: memberships } = await supabase
      .from("event_members")
      .select("event_id")
      .eq("user_id", user.id);

    let memberEvents: EventData[] = [];
    if (memberships && memberships.length > 0) {
      const memberEventIds = memberships.map((m) => m.event_id);
      // Filter out events already owned
      const ownedIds = new Set((ownedEvents || []).map((e) => e.id));
      const extraIds = memberEventIds.filter((id) => !ownedIds.has(id));

      if (extraIds.length > 0) {
        const { data } = await supabase
          .from("events")
          .select("*")
          .in("id", extraIds);
        memberEvents = (data || []) as EventData[];
      }
    }

    const combined = [...(ownedEvents || []), ...memberEvents] as EventData[];
    setAllEvents(combined);

    // Resolve active event
    if (combined.length > 0) {
      const storedId = activeEventId;
      const match = storedId ? combined.find((e) => e.id === storedId) : null;
      if (!match) {
        // Default to first owned event or first event
        const defaultId = combined[0].id;
        setActiveEventId(defaultId);
        try { localStorage.setItem(STORAGE_KEY, defaultId); } catch {}
      }
    } else {
      setActiveEventId(null);
      try { localStorage.removeItem(STORAGE_KEY); } catch {}
    }

    setLoading(false);
  }, [user]);

  useEffect(() => {
    fetchEvents();
  }, [fetchEvents]);

  const switchEvent = (eventId: string) => {
    setActiveEventId(eventId);
    try { localStorage.setItem(STORAGE_KEY, eventId); } catch {}
  };

  const activeEvent = allEvents.find((e) => e.id === activeEventId) || null;

  return (
    <ActiveEventContext.Provider value={{ activeEvent, allEvents, switchEvent, loading, refetch: fetchEvents }}>
      {children}
    </ActiveEventContext.Provider>
  );
};

export const useActiveEvent = () => {
  const ctx = useContext(ActiveEventContext);
  if (!ctx) throw new Error("useActiveEvent must be used within ActiveEventProvider");
  return ctx;
};
