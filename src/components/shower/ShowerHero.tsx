import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Calendar, MapPin, Pencil } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { EventData } from "@/contexts/ActiveEventContext";
import { getShowerImage } from "@/lib/showerPlaceholders";
import { useEventRole } from "@/hooks/useEventRole";

export const ShowerHero = ({ event, isHost: isHostProp }: { event: EventData; isHost?: boolean }) => {
  const navigate = useNavigate();
  const { isHost: globalIsHost } = useEventRole();
  const isHost = isHostProp ?? globalIsHost;
  const eventDate = event.event_date ? new Date(event.event_date) : null;
  const days = eventDate
    ? Math.ceil((eventDate.getTime() - Date.now()) / (1000 * 60 * 60 * 24))
    : null;
  const dateLabel = eventDate
    ? eventDate.toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric", year: "numeric" })
    : null;

  return (
    <Card className="border-none overflow-hidden">
      <CardContent className="p-0">
        <div className="relative">
          <img src={getShowerImage(event)} alt="" className="w-full h-32 object-cover" />
          {days !== null && days >= 0 && (
            <Badge className="bg-mint text-mint-foreground text-[10px] font-bold absolute top-3 left-3">
              ⏰ {days === 0 ? "TODAY" : `${days} DAYS TO GO`}
            </Badge>
          )}
          {isHost && (
            <Button
              size="icon"
              variant="secondary"
              aria-label="Edit shower details"
              className="absolute top-3 right-3 h-8 w-8 rounded-full bg-background/85 backdrop-blur hover:bg-background"
              onClick={() => navigate(`/setup/shower?eventId=${event.id}`)}
            >
              <Pencil className="h-3.5 w-3.5" />
            </Button>
          )}
        </div>
        <div className="p-5 pt-3">
          <h1 className="text-xl font-bold">
            {event.honoree_name ? `${event.honoree_name}'s Baby Shower` : "Baby Shower"}
          </h1>
          {dateLabel && (
            <div className="flex items-center gap-1.5 mt-1.5 text-muted-foreground">
              <Calendar className="h-3.5 w-3.5" />
              <span className="text-sm">{dateLabel}</span>
            </div>
          )}
          {event.city && (
            <div className="flex items-center gap-1.5 mt-1 text-muted-foreground">
              <MapPin className="h-3.5 w-3.5" />
              <span className="text-sm">{event.city}</span>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
};
