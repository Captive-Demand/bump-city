import { useState, useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { MobileLayout } from "@/components/layout/MobileLayout";
import { supabase } from "@/integrations/supabase/client";
import { useEvent } from "@/hooks/useEvent";
import { CalendarDays, MapPin, CalendarPlus } from "lucide-react";
import { format } from "date-fns";
import { Button } from "@/components/ui/button";

const buildGoogleCalendarUrl = (evt: {
  title: string;
  description: string | null;
  event_date: string | null;
  location: string | null;
  city: string | null;
}) => {
  if (!evt.event_date) return null;
  const start = new Date(evt.event_date);
  const end = new Date(start.getTime() + 60 * 60 * 1000); // default 1hr
  const fmt = (d: Date) =>
    d.toISOString().replace(/[-:]/g, "").replace(/\.\d{3}/, "");
  const params = new URLSearchParams({
    action: "TEMPLATE",
    text: evt.title,
    dates: `${fmt(start)}/${fmt(end)}`,
    details: evt.description || "",
    location: [evt.location, evt.city].filter(Boolean).join(", "),
  });
  return `https://calendar.google.com/calendar/render?${params.toString()}`;
};

interface CommunityEvent {
  id: string;
  title: string;
  description: string | null;
  event_date: string | null;
  location: string | null;
  city: string | null;
  image_url: string | null;
}

const CommunityEventsPage = () => {
  const [events, setEvents] = useState<CommunityEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const { event: activeEvent } = useEvent();

  const userCity = activeEvent?.city || null;

  useEffect(() => {
    const load = async () => {
      let query = supabase
        .from("community_events")
        .select("*")
        .order("event_date", { ascending: true });

      if (userCity) {
        query = query.eq("city", userCity);
      }

      const { data } = await query;
      setEvents((data as CommunityEvent[]) || []);
      setLoading(false);
    };
    load();
  }, [userCity]);

  if (loading)
    return (
      <MobileLayout>
        <div className="flex items-center justify-center min-h-[60vh]">
          <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full" />
        </div>
      </MobileLayout>
    );

  return (
    <MobileLayout>
      <div className="px-6 pt-12 pb-6">
        <div className="flex items-center gap-2 mb-1">
          <CalendarDays className="h-5 w-5 text-primary" />
          <h1 className="text-2xl font-bold">Community</h1>
        </div>
        <p className="text-sm text-muted-foreground">
          {userCity ? `Events near ${userCity} 🤝` : "Local events & meetups for parents 🤝"}
        </p>
      </div>

      <div className="px-6 pb-6 space-y-3">
        {events.length === 0 && (
          <p className="text-sm text-muted-foreground text-center py-8">
            No upcoming events{userCity ? ` in ${userCity}` : ""}. Check back soon!
          </p>
        )}
        {events.map((evt) => (
          <Card key={evt.id} className="border-none overflow-hidden">
            {evt.image_url && (
              <img
                src={evt.image_url}
                alt={evt.title}
                className="w-full h-36 object-cover"
              />
            )}
            <CardContent className="p-4">
              <div className="flex items-start gap-3">
                {!evt.image_url && evt.event_date && (
                  <div className="bg-primary/10 rounded-xl p-3 text-center shrink-0 min-w-[56px]">
                    <p className="text-lg font-bold text-primary">
                      {format(new Date(evt.event_date), "d")}
                    </p>
                    <p className="text-[10px] text-primary font-medium uppercase">
                      {format(new Date(evt.event_date), "MMM")}
                    </p>
                  </div>
                )}
                <div className="flex-1 min-w-0">
                  <h3 className="font-bold text-sm">{evt.title}</h3>
                  {evt.description && (
                    <p className="text-xs text-muted-foreground mt-1">{evt.description}</p>
                  )}
                  <div className="flex items-center gap-2 mt-2 flex-wrap">
                    {evt.event_date && evt.image_url && (
                      <Badge variant="secondary" className="text-[10px] gap-1">
                        <CalendarDays className="h-3 w-3" />
                        {format(new Date(evt.event_date), "MMM d")}
                      </Badge>
                    )}
                    {evt.location && (
                      <Badge variant="secondary" className="text-[10px] gap-1">
                        <MapPin className="h-3 w-3" />
                        {evt.location}
                      </Badge>
                    )}
                    {evt.city && (
                      <Badge variant="secondary" className="text-[10px]">
                        📍 {evt.city}
                      </Badge>
                    )}
                  </div>
                  {evt.event_date && (() => {
                    const url = buildGoogleCalendarUrl(evt);
                    if (!url) return null;
                    return (
                      <Button
                        asChild
                        size="sm"
                        variant="outline"
                        className="mt-3 h-8 text-xs gap-1.5"
                      >
                        <a href={url} target="_blank" rel="noopener noreferrer">
                          <CalendarPlus className="h-3.5 w-3.5" />
                          Add to Google Calendar
                        </a>
                      </Button>
                    );
                  })()}
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
