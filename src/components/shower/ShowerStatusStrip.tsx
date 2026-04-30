import { Card, CardContent } from "@/components/ui/card";
import { CalendarClock, Users, Gift, Send } from "lucide-react";
import type { ShowerStats } from "./useShowerStats";
import { EventData } from "@/contexts/ActiveEventContext";

interface Props {
  event: EventData;
  stats: ShowerStats;
}

/**
 * Compact at-a-glance status row that lives just under the hero. Replaces the
 * "scroll all the way down to read tile counts" pattern with a single line a
 * host can scan when they open the page.
 */
export const ShowerStatusStrip = ({ event, stats }: Props) => {
  const eventDate = event.event_date ? new Date(event.event_date) : null;
  const days = eventDate
    ? Math.ceil((eventDate.getTime() - Date.now()) / (1000 * 60 * 60 * 24))
    : null;

  const cells: { icon: typeof CalendarClock; label: string; sub: string; tone: string }[] = [];

  if (days !== null && days >= 0) {
    cells.push({
      icon: CalendarClock,
      label: days === 0 ? "Today" : `${days} days`,
      sub: "to go",
      tone: "bg-mint",
    });
  }

  if (stats.guests > 0) {
    cells.push({
      icon: Users,
      label: `${stats.guests - stats.guestsPending}/${stats.guests}`,
      sub: stats.guestsPending > 0 ? `${stats.guestsPending} pending` : "RSVP'd",
      tone: "bg-peach",
    });
  }

  if (stats.registry > 0) {
    cells.push({
      icon: Gift,
      label: `${stats.registryClaimed}/${stats.registry}`,
      sub: "gifts claimed",
      tone: "bg-lavender",
    });
  }

  if (stats.invitesUnsent > 0) {
    cells.push({
      icon: Send,
      label: `${stats.invitesUnsent}`,
      sub: stats.invitesUnsent === 1 ? "invite unsent" : "invites unsent",
      tone: "bg-peach",
    });
  }

  if (cells.length === 0) return null;

  // Adapt the grid to how many cells we actually have so we never end up with
  // an awkward 2+1 layout (3 cells in a 2-col grid). 4 stays 2×2 on mobile
  // because four label+sub pairs would get too cramped at 375px wide.
  const gridClass =
    cells.length >= 4
      ? "grid-cols-2 sm:grid-cols-4"
      : cells.length === 3
      ? "grid-cols-3"
      : cells.length === 2
      ? "grid-cols-2"
      : "grid-cols-1";

  return (
    <Card className="border-none">
      <CardContent className="p-3">
        <div className={`grid ${gridClass} gap-2`}>
          {cells.map((c, i) => (
            <div key={i} className="flex items-center gap-2 min-w-0">
              <div className={`${c.tone} p-1.5 rounded-lg shrink-0`}>
                <c.icon className="h-3.5 w-3.5 text-foreground/70" />
              </div>
              <div className="min-w-0">
                <p className="text-sm font-bold leading-tight truncate">{c.label}</p>
                <p className="text-[10px] text-muted-foreground leading-tight truncate">{c.sub}</p>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
};
