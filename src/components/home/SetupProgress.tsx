import { useEffect, useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ChevronRight, ChevronLeft, Check, Circle, Sparkles, Calendar, MapPin, Image as ImageIcon, Gift, Users, Send } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useActiveEvent, EventData } from "@/contexts/ActiveEventContext";
import { supabase } from "@/integrations/supabase/client";
import { cn } from "@/lib/utils";

interface ProgressItem {
  key: string;
  label: string;
  icon: any;
  done: boolean;
  path: string;
}

const buildSteps = (
  evt: EventData,
  hasRegistry: boolean,
  hasGuests: boolean,
): ProgressItem[] => [
  { key: "honoree", label: "Add honoree name", icon: Sparkles, done: !!evt.honoree_name, path: `/showers/${evt.id}` },
  { key: "date", label: "Set event date", icon: Calendar, done: !!evt.event_date, path: `/showers/${evt.id}` },
  { key: "city", label: "Add location", icon: MapPin, done: !!evt.city, path: `/showers/${evt.id}` },
  { key: "image", label: "Choose a cover image", icon: ImageIcon, done: !!evt.event_image_url, path: `/showers/${evt.id}` },
  { key: "registry", label: "Add registry items", icon: Gift, done: hasRegistry, path: "/registry" },
  { key: "guests", label: "Add guests", icon: Users, done: hasGuests, path: "/guests" },
  { key: "invite", label: "Design invitation", icon: Send, done: !!evt.invite_image_url || !!evt.invite_template, path: "/invites" },
];

interface ShowerProgress {
  event: EventData;
  steps: ProgressItem[];
  done: number;
  total: number;
}

export const SetupProgress = () => {
  const navigate = useNavigate();
  const { allEvents, switchEvent } = useActiveEvent();
  const [open, setOpen] = useState(false);
  const [progressByEvent, setProgressByEvent] = useState<ShowerProgress[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      if (allEvents.length === 0) {
        setProgressByEvent([]);
        setLoading(false);
        return;
      }
      const results = await Promise.all(
        allEvents.map(async (evt) => {
          const [{ count: regCount }, { count: guestCount }] = await Promise.all([
            supabase.from("registry_items").select("id", { count: "exact", head: true }).eq("event_id", evt.id),
            supabase.from("guests").select("id", { count: "exact", head: true }).eq("event_id", evt.id),
          ]);
          const steps = buildSteps(evt, (regCount || 0) > 0, (guestCount || 0) > 0);
          const done = steps.filter((s) => s.done).length;
          return { event: evt, steps, done, total: steps.length };
        }),
      );
      setProgressByEvent(results);
      setLoading(false);
    };
    load();
  }, [allEvents]);

  if (loading || progressByEvent.length === 0) return null;

  const incomplete = progressByEvent.filter((p) => p.done < p.total);
  // Hide entirely once everything is set
  if (incomplete.length === 0) return null;

  const totalDone = incomplete.reduce((sum, p) => sum + p.done, 0);
  const totalSteps = incomplete.reduce((sum, p) => sum + p.total, 0);
  const overallPct = Math.round((totalDone / totalSteps) * 100);

  const goToStep = (eventId: string, path: string) => {
    switchEvent(eventId);
    navigate(path);
  };

  if (!open) {
    return (
      <button
        onClick={() => setOpen(true)}
        className="w-full text-left"
        aria-label="Open setup progress"
      >
        <Card className="border-none bg-gradient-to-br from-primary/10 via-lavender/20 to-peach/15 hover:from-primary/15 transition-all">
          <CardContent className="p-4 flex items-center gap-3">
            <div className="relative h-12 w-12 shrink-0">
              <svg className="h-12 w-12 -rotate-90" viewBox="0 0 36 36">
                <circle cx="18" cy="18" r="15" fill="none" stroke="hsl(var(--muted))" strokeWidth="3" />
                <circle
                  cx="18" cy="18" r="15" fill="none"
                  stroke="hsl(var(--primary))" strokeWidth="3" strokeLinecap="round"
                  strokeDasharray={`${(overallPct / 100) * 94.25} 94.25`}
                />
              </svg>
              <span className="absolute inset-0 flex items-center justify-center text-[11px] font-bold text-primary">
                {overallPct}%
              </span>
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <h2 className="text-sm font-bold">Setup Progress</h2>
                <Badge variant="secondary" className="text-[10px]">{totalDone}/{totalSteps}</Badge>
              </div>
              <p className="text-xs text-muted-foreground">
                {incomplete.length === 1
                  ? `Finish setting up ${incomplete[0].event.honoree_name || "your shower"}`
                  : `${incomplete.length} showers need setup`}
              </p>
            </div>
            <ChevronRight className="h-4 w-4 text-muted-foreground shrink-0" />
          </CardContent>
        </Card>
      </button>
    );
  }

  return (
    <Card className="border-none bg-gradient-to-br from-primary/10 via-lavender/20 to-peach/15">
      <CardContent className="p-4 space-y-4">
        <div className="flex items-center gap-2">
          <button
            onClick={() => setOpen(false)}
            className="h-7 w-7 rounded-full bg-background/60 flex items-center justify-center hover:bg-background"
            aria-label="Back"
          >
            <ChevronLeft className="h-4 w-4" />
          </button>
          <h2 className="text-base font-bold flex-1">Setup Progress</h2>
          <Badge variant="secondary" className="text-[10px]">{overallPct}%</Badge>
        </div>

        {incomplete.map((p) => (
          <div key={p.event.id} className="bg-background/70 backdrop-blur rounded-2xl p-3 space-y-2">
            <div className="flex items-center justify-between">
              <h3 className="font-bold text-sm leading-tight">
                {p.event.honoree_name ? `${p.event.honoree_name}'s Shower` : "Baby Shower"}
              </h3>
              <Badge className="bg-primary/15 text-primary border-none text-[10px]">{p.done}/{p.total}</Badge>
            </div>
            <div className="space-y-1">
              {p.steps.map((step) => {
                const Icon = step.icon;
                return (
                  <button
                    key={step.key}
                    onClick={() => goToStep(p.event.id, step.path)}
                    className={cn(
                      "w-full flex items-center gap-3 p-2 rounded-xl text-left transition-colors",
                      step.done ? "opacity-60" : "hover:bg-primary/5"
                    )}
                  >
                    {step.done ? (
                      <span className="h-6 w-6 rounded-full bg-primary text-primary-foreground flex items-center justify-center shrink-0">
                        <Check className="h-3.5 w-3.5" />
                      </span>
                    ) : (
                      <span className="h-6 w-6 rounded-full bg-muted flex items-center justify-center shrink-0">
                        <Circle className="h-3 w-3 text-muted-foreground" />
                      </span>
                    )}
                    <Icon className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                    <span className={cn("text-sm flex-1", step.done && "line-through")}>{step.label}</span>
                    {!step.done && <ChevronRight className="h-3.5 w-3.5 text-muted-foreground shrink-0" />}
                  </button>
                );
              })}
            </div>
            {p.done < p.total && (
              <Button
                size="sm"
                variant="outline"
                className="w-full text-xs"
                onClick={() => goToStep(p.event.id, `/showers/${p.event.id}`)}
              >
                Open shower dashboard
              </Button>
            )}
          </div>
        ))}
      </CardContent>
    </Card>
  );
};
