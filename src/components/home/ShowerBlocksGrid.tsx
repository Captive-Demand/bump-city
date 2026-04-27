import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Calendar, MapPin, Plus, ArrowRight } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useActiveEvent, EventData } from "@/contexts/ActiveEventContext";

const formatDate = (date: string | null) =>
  date
    ? new Date(date).toLocaleDateString("en-US", {
        weekday: "short",
        month: "short",
        day: "numeric",
        year: "numeric",
      })
    : null;

const daysToGo = (date: string | null) => {
  if (!date) return null;
  return Math.ceil((new Date(date).getTime() - Date.now()) / (1000 * 60 * 60 * 24));
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
  showSeeAll?: boolean;
}

export const ShowerBlocksGrid = ({
  title = "Your Showers",
  showCreateTile = true,
  showSeeAll = true,
}: ShowerBlocksGridProps) => {
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
        {showSeeAll && allEvents.length > 0 && (
          <button className="text-sm font-semibold text-primary" onClick={() => navigate("/showers")}>
            See all
          </button>
        )}
      </div>

      <div className="space-y-4">
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
              <CardContent className="p-0">
                <div className="relative">
                  {evt.event_image_url ? (
                    <img src={evt.event_image_url} alt="" className="w-full h-44 object-cover" />
                  ) : (
                    <div className="bg-gradient-to-br from-primary/30 via-primary/15 to-peach/20 h-44 flex items-center justify-center">
                      <span className="text-5xl">🎉</span>
                    </div>
                  )}
                  {days !== null && !isPast && (
                    <Badge className="bg-mint text-mint-foreground text-[10px] font-bold absolute top-3 left-3">
                      ⏰ {days === 0 ? "TODAY" : `${days} DAYS TO GO`}
                    </Badge>
                  )}
                  {isPast && (
                    <Badge variant="outline" className="bg-background/90 text-[10px] font-bold absolute top-3 left-3">
                      PAST
                    </Badge>
                  )}
                </div>
                <div className="p-5 pt-3">
                  <h3 className="text-lg font-bold leading-tight">
                    {evt.honoree_name ? `${evt.honoree_name}'s Baby Shower` : "Baby Shower"}
                  </h3>
                  {dateLabel && (
                    <div className="flex items-center gap-1.5 mt-1.5 text-muted-foreground">
                      <Calendar className="h-3.5 w-3.5" />
                      <span className="text-sm">{dateLabel}</span>
                    </div>
                  )}
                  {evt.city && (
                    <div className="flex items-center gap-1.5 mt-1 text-muted-foreground">
                      <MapPin className="h-3.5 w-3.5" />
                      <span className="text-sm">{evt.city}</span>
                    </div>
                  )}
                  <Button
                    className="w-full rounded-xl h-11 font-semibold mt-4"
                    onClick={(e) => {
                      e.stopPropagation();
                      open(evt.id);
                    }}
                  >
                    Open Shower
                    <ArrowRight className="h-4 w-4 ml-1" />
                  </Button>
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
            <CardContent className="p-5 flex items-center gap-3 justify-center text-primary">
              <Plus className="h-4 w-4" />
              <span className="font-semibold text-sm">Create new shower</span>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
};
