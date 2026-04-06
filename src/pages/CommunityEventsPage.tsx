import { useState, useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { MobileLayout } from "@/components/layout/MobileLayout";
import { supabase } from "@/integrations/supabase/client";
import { CalendarDays, MapPin } from "lucide-react";
import { format } from "date-fns";

interface CommunityEvent {
  id: string;
  title: string;
  description: string | null;
  event_date: string | null;
  location: string | null;
  city: string;
}

const CommunityEventsPage = () => {
  const [events, setEvents] = useState<CommunityEvent[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetch = async () => {
      const { data } = await supabase.from("community_events").select("*").order("event_date", { ascending: true });
      setEvents((data as CommunityEvent[]) || []);
      setLoading(false);
    };
    fetch();
  }, []);

  if (loading) return <MobileLayout><div className="flex items-center justify-center min-h-[60vh]"><div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full" /></div></MobileLayout>;

  return (
    <MobileLayout>
      <div className="px-6 pt-12 pb-6">
        <div className="flex items-center gap-2 mb-1"><CalendarDays className="h-5 w-5 text-primary" /><h1 className="text-2xl font-bold">Community</h1></div>
        <p className="text-sm text-muted-foreground">Local events & meetups for parents 🤝</p>
      </div>

      <div className="px-6 pb-6 space-y-3">
        {events.length === 0 && <p className="text-sm text-muted-foreground text-center py-8">No upcoming events. Check back soon!</p>}
        {events.map((evt) => (
          <Card key={evt.id} className="border-none">
            <CardContent className="p-4">
              <div className="flex items-start gap-3">
                {evt.event_date && (
                  <div className="bg-primary/10 rounded-xl p-3 text-center shrink-0 min-w-[56px]">
                    <p className="text-lg font-bold text-primary">{format(new Date(evt.event_date), "d")}</p>
                    <p className="text-[10px] text-primary font-medium uppercase">{format(new Date(evt.event_date), "MMM")}</p>
                  </div>
                )}
                <div className="flex-1 min-w-0">
                  <h3 className="font-bold text-sm">{evt.title}</h3>
                  {evt.description && <p className="text-xs text-muted-foreground mt-1">{evt.description}</p>}
                  <div className="flex items-center gap-2 mt-2">
                    {evt.location && <Badge variant="secondary" className="text-[10px] gap-1"><MapPin className="h-3 w-3" />{evt.location}</Badge>}
                    <Badge variant="secondary" className="text-[10px]">📍 {evt.city}</Badge>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </MobileLayout>
  );
};

export default CommunityEventsPage;
