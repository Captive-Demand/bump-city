import { Card, CardContent } from "@/components/ui/card";
import { Activity as ActivityIcon, Gift, Users, Sparkles, Send, Mail, type LucideIcon } from "lucide-react";
import { useActivityFeed, formatRelativeTime, type ActivityType } from "@/contexts/ActivityFeedContext";

const ICON_MAP: Record<ActivityType, LucideIcon> = {
  "gift-claimed": Gift,
  "registry-added": Gift,
  rsvp: Users,
  prediction: Sparkles,
  "guest-invited": Users,
  "invite-sent": Send,
};

const TONE_MAP: Record<ActivityType, string> = {
  "gift-claimed": "bg-mint/40",
  "registry-added": "bg-lavender/40",
  rsvp: "bg-peach",
  prediction: "bg-mint/40",
  "guest-invited": "bg-peach",
  "invite-sent": "bg-primary/15",
};

const MAX_ROWS = 4;

/**
 * Surfaces the last few activities so the home page feels alive instead of
 * static. Pulled from the existing ActivityFeedContext (locally persisted).
 */
export const RecentActivityCard = () => {
  const { activities } = useActivityFeed();
  if (activities.length === 0) return null;

  const visible = activities.slice(0, MAX_ROWS);

  return (
    <div>
      <h2 className="text-lg font-bold mb-3">Recent activity</h2>
      <Card className="border-none">
        <CardContent className="p-0">
          <ul className="divide-y divide-border/40">
            {visible.map((activity) => {
              const Icon = ICON_MAP[activity.type] ?? ActivityIcon;
              const tone = TONE_MAP[activity.type] ?? "bg-muted/60";
              return (
                <li key={activity.id} className="flex items-start gap-3 px-4 py-3">
                  <div className={`${tone} p-2 rounded-lg shrink-0`}>
                    <Icon className="h-3.5 w-3.5 text-foreground/70" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm leading-snug">{activity.text}</p>
                    <p className="text-[11px] text-muted-foreground mt-0.5">
                      {formatRelativeTime(activity.timestamp)}
                    </p>
                  </div>
                </li>
              );
            })}
          </ul>
        </CardContent>
      </Card>
    </div>
  );
};
