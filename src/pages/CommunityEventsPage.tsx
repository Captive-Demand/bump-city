import { useState, useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { MobileLayout } from "@/components/layout/MobileLayout";
import { PageLoader } from "@/components/PageLoader";
import { supabase } from "@/integrations/supabase/client";
import { useEvent } from "@/hooks/useEvent";
import {
  CalendarDays,
  MapPin,
  CalendarPlus,
  ChevronLeft,
  Handshake,
  Navigation,
} from "lucide-react";
import { format } from "date-fns";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";

interface CalendarEventInput {
  id: string;
  title: string;
  description: string | null;
  event_date: string | null;
  location: string | null;
  city: string | null;
}

const calendarTimes = (event_date: string) => {
  const start = new Date(event_date);
  const end = new Date(start.getTime() + 60 * 60 * 1000); // default 1hr
  const fmt = (d: Date) =>
    d.toISOString().replace(/[-:]/g, "").replace(/\.\d{3}/, "");
  return { start, end, formattedStart: fmt(start), formattedEnd: fmt(end) };
};

const buildGoogleCalendarUrl = (evt: CalendarEventInput): string | null => {
  if (!evt.event_date) return null;
  const { formattedStart, formattedEnd } = calendarTimes(evt.event_date);
  const params = new URLSearchParams({
    action: "TEMPLATE",
    text: evt.title,
    dates: `${formattedStart}/${formattedEnd}`,
    details: evt.description || "",
    location: [evt.location, evt.city].filter(Boolean).join(", "),
  });
  return `https://calendar.google.com/calendar/render?${params.toString()}`;
};

/**
 * Build a downloadable `.ics` data URL — opens Apple Calendar (and most
 * other native calendar apps) when the user taps the link. We use a data
 * URL instead of a Blob so it doesn't require any extra cleanup, and the
 * `download` attribute on the anchor lets the browser hint the filename.
 */
const buildAppleCalendarUrl = (evt: CalendarEventInput): string | null => {
  if (!evt.event_date) return null;
  const { formattedStart, formattedEnd } = calendarTimes(evt.event_date);
  // Per RFC 5545: lines must use CRLF, fields shouldn't contain raw commas /
  // semicolons / newlines without escaping.
  const escape = (s: string) =>
    s.replace(/\\/g, "\\\\").replace(/\n/g, "\\n").replace(/,/g, "\\,").replace(/;/g, "\\;");
  const location = [evt.location, evt.city].filter(Boolean).join(", ");
  const lines = [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//Bump City//Community Events//EN",
    "CALSCALE:GREGORIAN",
    "METHOD:PUBLISH",
    "BEGIN:VEVENT",
    `UID:bumpcity-community-${evt.id}`,
    `DTSTAMP:${formattedStart}`,
    `DTSTART:${formattedStart}`,
    `DTEND:${formattedEnd}`,
    `SUMMARY:${escape(evt.title)}`,
    evt.description ? `DESCRIPTION:${escape(evt.description)}` : null,
    location ? `LOCATION:${escape(location)}` : null,
    "END:VEVENT",
    "END:VCALENDAR",
  ].filter(Boolean) as string[];
  const ics = lines.join("\r\n");
  return `data:text/calendar;charset=utf-8,${encodeURIComponent(ics)}`;
};

/**
 * Universal directions link. Google Maps' `dir` action with a destination
 * works everywhere — iOS Safari, Android Chrome, desktop browsers — and
 * iOS prompts to open the Google Maps app if installed. We fall back to
 * just the city if no street-level location is set.
 */
const buildDirectionsUrl = (evt: CalendarEventInput): string | null => {
  const destination = [evt.location, evt.city].filter(Boolean).join(", ");
  if (!destination) return null;
  return `https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(destination)}`;
};

const slugify = (s: string): string =>
  s
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 60);

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
  const navigate = useNavigate();

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
        <PageLoader />
      </MobileLayout>
    );

  return (
    <MobileLayout>
      <div className="px-6 pt-8 pb-6">
        <button
          onClick={() => navigate("/")}
          className="flex items-center gap-1 text-sm text-muted-foreground mb-4 hover:text-foreground"
        >
          <ChevronLeft className="h-4 w-4" /> Home
        </button>
        <div className="flex items-center gap-2 mb-1">
          <CalendarDays className="h-5 w-5 text-primary" />
          <h1 className="text-2xl font-bold">Community</h1>
        </div>
        <p className="text-sm text-muted-foreground inline-flex items-center gap-1.5">
          {userCity ? `Events near ${userCity}` : "Local events & meetups for parents"}
          <Handshake className="h-3.5 w-3.5 text-primary/70" />
        </p>
      </div>

      <div className="px-6 pb-6 space-y-3">
        {events.length === 0 && (
          <p className="text-sm text-muted-foreground text-center py-8">
            No upcoming events{userCity ? ` in ${userCity}` : ""}. Check back soon!
          </p>
        )}
        {events.map((evt) => {
          const googleUrl = buildGoogleCalendarUrl(evt);
          const appleUrl = buildAppleCalendarUrl(evt);
          const directionsUrl = buildDirectionsUrl(evt);
          return (
            <Card key={evt.id} className="border-none overflow-hidden">
              {evt.image_url && (
                <div className="relative">
                  <img
                    src={evt.image_url}
                    alt={evt.title}
                    className="w-full h-36 object-cover"
                  />
                  {/* City pill in the top-right of the image — pink/primary
                      color to match the rest of the app's accent treatment.
                      Drop shadow keeps it readable over photos with light or
                      busy backgrounds. */}
                  {evt.city && (
                    <Badge className="absolute top-2.5 right-2.5 bg-primary text-primary-foreground border-none gap-1 text-[10px] font-bold shadow-md">
                      <MapPin className="h-3 w-3" />
                      {evt.city}
                    </Badge>
                  )}
                </div>
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
                      {/* Show city in the metadata row only when there's no
                          image (otherwise it's already pinned to the image). */}
                      {evt.city && !evt.image_url && (
                        <Badge variant="secondary" className="text-[10px] gap-1">
                          <MapPin className="h-3 w-3" />
                          {evt.city}
                        </Badge>
                      )}
                    </div>
                    {(googleUrl || appleUrl || directionsUrl) && (
                      <div className="flex flex-wrap gap-2 mt-3">
                        {directionsUrl && (
                          <Button
                            asChild
                            size="sm"
                            variant="outline"
                            className="h-8 text-xs gap-1.5"
                          >
                            <a
                              href={directionsUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                            >
                              <Navigation className="h-3.5 w-3.5" />
                              Directions
                            </a>
                          </Button>
                        )}
                        {appleUrl && (
                          <Button
                            asChild
                            size="sm"
                            variant="outline"
                            className="h-8 text-xs gap-1.5"
                          >
                            {/* `download` attribute hints the filename so the
                                .ics opens cleanly in Apple Calendar / native
                                calendar apps. Some browsers ignore download
                                on data: URLs and just navigate — that's still
                                fine, the OS handles text/calendar. */}
                            <a
                              href={appleUrl}
                              download={`${slugify(evt.title)}.ics`}
                            >
                              <CalendarPlus className="h-3.5 w-3.5" />
                              Add to Apple Calendar
                            </a>
                          </Button>
                        )}
                        {googleUrl && (
                          <Button
                            asChild
                            size="sm"
                            variant="outline"
                            className="h-8 text-xs gap-1.5"
                          >
                            <a
                              href={googleUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                            >
                              <CalendarPlus className="h-3.5 w-3.5" />
                              Add to Google Calendar
                            </a>
                          </Button>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </MobileLayout>
  );
};

export default CommunityEventsPage;
