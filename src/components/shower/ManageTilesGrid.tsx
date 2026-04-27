import { Card, CardContent } from "@/components/ui/card";
import { Users, Gift, Send, Sparkles, ClipboardList, Package, MapPin } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";

interface Tile {
  icon: any;
  label: string;
  path: string;
  color: string;
  statKey: keyof Stats;
  statSuffix: string;
}

interface Stats {
  guests: number;
  registry: number;
  invites: number;
  predictions: number;
  tasks: number;
  gifts: number;
  vendors: number;
}

const tiles: Tile[] = [
  { icon: Users, label: "Guests", path: "/guests", color: "bg-peach", statKey: "guests", statSuffix: "guests" },
  { icon: Gift, label: "Registry", path: "/registry", color: "bg-lavender", statKey: "registry", statSuffix: "items" },
  { icon: Send, label: "Invites", path: "/invites", color: "bg-mint", statKey: "invites", statSuffix: "sent" },
  { icon: Sparkles, label: "Predictions", path: "/predictions", color: "bg-peach", statKey: "predictions", statSuffix: "made" },
  { icon: ClipboardList, label: "Planning", path: "/planning", color: "bg-lavender", statKey: "tasks", statSuffix: "tasks" },
  { icon: Package, label: "Gifts", path: "/gift-tracker", color: "bg-mint", statKey: "gifts", statSuffix: "logged" },
  { icon: MapPin, label: "Vendors", path: "/vendors", color: "bg-peach", statKey: "vendors", statSuffix: "nearby" },
];

export const ManageTilesGrid = ({ eventId, city }: { eventId: string; city?: string | null }) => {
  const navigate = useNavigate();
  const [stats, setStats] = useState<Stats>({
    guests: 0, registry: 0, invites: 0, predictions: 0, tasks: 0, gifts: 0, vendors: 0,
  });

  useEffect(() => {
    (async () => {
      const opts = { count: "exact" as const, head: true };
      const [g, r, i, p, t, gi, v] = await Promise.all([
        supabase.from("guests").select("id", opts).eq("event_id", eventId),
        supabase.from("registry_items").select("id", opts).eq("event_id", eventId),
        supabase.from("guests").select("id", opts).eq("event_id", eventId).eq("invite_sent", true),
        supabase.from("predictions").select("id", opts).eq("event_id", eventId),
        supabase.from("planning_tasks").select("id", opts).eq("event_id", eventId).eq("completed", false),
        supabase.from("gifts_received").select("id", opts).eq("event_id", eventId),
        city ? supabase.from("vendors").select("id", opts).eq("city", city) : Promise.resolve({ count: 0 } as any),
      ]);
      setStats({
        guests: g.count || 0,
        registry: r.count || 0,
        invites: i.count || 0,
        predictions: p.count || 0,
        tasks: t.count || 0,
        gifts: gi.count || 0,
        vendors: v.count || 0,
      });
    })();
  }, [eventId, city]);

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
              <div className="min-w-0">
                <p className="text-sm font-semibold leading-tight">{tile.label}</p>
                <p className="text-[10px] text-muted-foreground">
                  {stats[tile.statKey]} {tile.statSuffix}
                </p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
};
