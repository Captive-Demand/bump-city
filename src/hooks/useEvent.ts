import { useState, useEffect } from "react";
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
}

export const useEvent = () => {
  const { user } = useAuth();
  const [event, setEvent] = useState<EventData | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchEvent = async () => {
    if (!user) { setLoading(false); return; }
    const { data } = await supabase
      .from("events")
      .select("*")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();
    setEvent(data);
    setLoading(false);
  };

  useEffect(() => {
    fetchEvent();
  }, [user]);

  return { event, loading, refetch: fetchEvent };
};
