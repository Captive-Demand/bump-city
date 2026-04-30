import { Card, CardContent } from "@/components/ui/card";
import { Users, Gift, Send, Sparkles, ClipboardList, Package, MapPin } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useShowerStats, type ShowerStats } from "./useShowerStats";

interface ManageTilesGridProps {
  eventId: string;
  city?: string | null;
  /** Optionally pass already-fetched stats to avoid duplicate queries when
   *  this grid sits next to the status strip. */
  stats?: ShowerStats;
}

const buildTiles = (s: ShowerStats) => [
  {
    icon: Users,
    label: "Guests",
    path: "/guests",
    color: "bg-peach",
    primary: `${s.guests} ${s.guests === 1 ? "guest" : "guests"}`,
    hint: s.guestsPending > 0 ? `${s.guestsPending} pending RSVP` : undefined,
  },
  {
    icon: Send,
    label: "Invites",
    path: "/invites",
    color: "bg-mint",
    primary: `${s.invitesSent} sent`,
    hint: s.invitesUnsent > 0 ? `${s.invitesUnsent} unsent` : undefined,
  },
  {
    icon: Gift,
    label: "Registry",
    path: "/registry",
    color: "bg-lavender",
    primary: `${s.registry} ${s.registry === 1 ? "item" : "items"}`,
    hint: s.registry > 0 ? `${s.registryClaimed} claimed` : undefined,
  },
  {
    icon: Package,
    label: "Gifts",
    path: "/gift-tracker",
    color: "bg-mint",
    primary: `${s.gifts} logged`,
    hint: undefined,
  },
  {
    icon: ClipboardList,
    label: "Planning",
    path: "/planning",
    color: "bg-lavender",
    primary: `${s.tasks} ${s.tasks === 1 ? "task" : "tasks"}`,
    hint: s.tasks > 0 ? "open" : undefined,
  },
  {
    icon: Sparkles,
    label: "Predictions",
    path: "/predictions",
    color: "bg-peach",
    primary: `${s.predictions} made`,
    hint: undefined,
  },
  {
    icon: MapPin,
    label: "Vendors",
    path: "/vendors",
    color: "bg-peach",
    primary: `${s.vendors} nearby`,
    hint: undefined,
  },
];

export const ManageTilesGrid = ({ eventId, city, stats }: ManageTilesGridProps) => {
  const navigate = useNavigate();
  // Only run the hook if no external stats were supplied.
  const fetched = useShowerStats(stats ? null : eventId, city);
  const effective = stats ?? fetched;
  const tiles = buildTiles(effective);

  return (
    <div>
      <h2 className="text-lg font-bold mb-3">Manage</h2>
      <div className="grid grid-cols-2 gap-2.5">
        {tiles.map((tile) => (
          <Card
            key={tile.label}
            className="border-none cursor-pointer hover:-translate-y-0.5 transition-transform"
            onClick={() => navigate(tile.path)}
          >
            <CardContent className="p-3 flex items-center gap-3">
              <div className={`${tile.color} p-2.5 rounded-xl shrink-0`}>
                <tile.icon className="h-4 w-4 text-foreground/70" />
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-sm font-semibold leading-tight">{tile.label}</p>
                <p className="text-[10px] text-muted-foreground leading-tight truncate">
                  {tile.primary}
                  {tile.hint && (
                    <>
                      <span className="mx-1">·</span>
                      <span className="font-semibold text-foreground/70">{tile.hint}</span>
                    </>
                  )}
                </p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
};
