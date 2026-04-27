import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Calendar, MapPin, Plus, ChevronRight } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useActiveEvent, EventData } from "@/contexts/ActiveEventContext";

const formatDate = (date: string | null) =>
  date ? new Date(date).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" }) : null;

const daysToGo = (date: string | null) => {
  if (!date) return null;
  const d = Math.ceil((new Date(date).getTime() - Date.now()) / (1000 * 60 * 60 * 24));
  return d;
};

const sortShowers = (events: EventData[]) => {
  const upcoming: EventData[] = [];
  const undated: EventData[] = [];
  const past: EventData[] = [];
  events.forEach((e) => {
    if (!e.event_date) return undated.push(e);
    const d = daysToGo(e.event_date) ?? 0;
    (d >= 0 ? upcoming : past).push(e);
  });
  upcoming.sort((a, b) => (a.event_date! > b.event_date! ? 1 : -1));
  past.sort((a, b) => (a.event_date! > b.event_date! ? -1 : 1));
  return [...upcoming, ...undated, ...past];
};

interface ShowerBlocksGridProps {
  title?: string;
  showCreateTile?: boolean;
}

export const ShowerBlocksGrid = ({ title = "Your Showers", showCreateTile = true }: ShowerBlocksGridProps) => {
  const navigate = useNavigate();
  const { allEvents, switchEvent } = useActiveEvent();
  const showers = sortShowers(allEvents);

  const open = (id: string) => {
    switchEvent(id);
    navigate(`/showers/${id}`);
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-3">
        <h2 className="text-lg font-bold">{title}</h2>
        {allEvents.length > 0 && (
          <button className="text-sm font-semibold text-primary" onClick={() => navigate("/showers")}>
            See all
          </button>
        )}
      </div>

      <div className="space-y-3">
        {showers.map((evt) => {
          const days = daysToGo(evt.event_date);
          const isPast = days !== null && days < 0;
          const dateLabel = formatDate(evt.event_date);
          return (
            <Card
              key={evt.id}
              className={`border-none overflow-hidden cursor-pointer transition-transform hover:-translate-y-0.5 ${
                isPast ? "opacity-75" : ""
              }`}
              onClick={() => open(evt.id)}
            >
              <CardContent className="p-0 flex">
                <div className="w-24 h-24 shrink-0 bg-gradient-to-br from-primary/20 to-lavender/20 relative">
                  {evt.event_image_url ? (
                    <img src={evt.event_image_url} alt="" className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-3xl">🎉</div>
                  )}
                </div>
                <div className="flex-1 min-w-0 p-3 flex flex-col justify-center">
                  <div className="flex items-start justify-between gap-2">
                    <p className="font-bold text-sm leading-tight truncate">
                      {evt.honoree_name ? `${evt.honoree_name}'s Shower` : "Baby Shower"}
                    </p>
                    {days !== null && !isPast && (
                      <Badge className="bg-mint text-mint-foreground text-[9px] font-bold shrink-0">
                        {days === 0 ? "TODAY" : `${days}d`}
                      </Badge>
                    )}
                    {isPast && (
                      <Badge variant="outline" className="text-[9px] font-bold shrink-0">
                        PAST
                      </Badge>
                    )}
                  </div>
                  {dateLabel && (
                    <div className="flex items-center gap-1 mt-1 text-muted-foreground">
                      <Calendar className="h-3 w-3" />
                      <span className="text-xs">{dateLabel}</span>
                    </div>
                  )}
                  {evt.city && (
                    <div className="flex items-center gap-1 mt-0.5 text-muted-foreground">
                      <MapPin className="h-3 w-3" />
                      <span className="text-xs">{evt.city}</span>
                    </div>
                  )}
                </div>
                <div className="flex items-center pr-3 text-muted-foreground">
                  <ChevronRight className="h-4 w-4" />
                </div>
              </CardContent>
            </Card>
          );
        })}

        {showCreateTile && (
          <Card
            className="border-2 border-dashed border-primary/30 bg-transparent cursor-pointer hover:bg-primary/5 transition-colors"
            onClick={() => navigate("/get-started?new=true")}
          >
            <CardContent className="p-4 flex items-center gap-3 justify-center text-primary">
              <Plus className="h-4 w-4" />
              <span className="font-semibold text-sm">Create new shower</span>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
};
