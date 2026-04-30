import { useEffect, useRef, useState } from "react";
import { Bell, Gift, Users, Sparkles, Send, Mail, Activity as ActivityIcon, type LucideIcon } from "lucide-react";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { useActivityFeed, formatRelativeTime, type ActivityType } from "@/contexts/ActivityFeedContext";

const ICON_MAP: Record<ActivityType, LucideIcon> = {
  "gift-claimed": Gift,
  "registry-added": Gift,
  rsvp: Users,
  prediction: Sparkles,
  "guest-invited": Users,
  "invite-sent": Send,
};

const SEEN_KEY = "bumpcity:notifications-seen-at";

/**
 * Bell icon in the home header. Replaces the previous purely-decorative
 * version with a real popover backed by the activity feed. We track a
 * per-device "last seen" timestamp so the unread dot only appears for
 * activities the user hasn't acknowledged.
 */
export const NotificationsBell = () => {
  const { activities } = useActivityFeed();
  const [seenAt, setSeenAt] = useState<number>(() => {
    try {
      const v = localStorage.getItem(SEEN_KEY);
      return v ? Number(v) : 0;
    } catch {
      return 0;
    }
  });
  const [open, setOpen] = useState(false);
  const opened = useRef(false);

  useEffect(() => {
    if (open && !opened.current) {
      opened.current = true;
      const now = Date.now();
      setSeenAt(now);
      try {
        localStorage.setItem(SEEN_KEY, String(now));
      } catch {
        // ignore
      }
    }
    if (!open) opened.current = false;
  }, [open]);

  const unread = activities.filter((a) => a.timestamp > seenAt).length;

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <button
          className="p-2 rounded-full hover:bg-muted transition-colors relative"
          aria-label={unread > 0 ? `${unread} new notifications` : "Notifications"}
        >
          <Bell className="h-5 w-5 text-muted-foreground" />
          {unread > 0 && (
            <span className="absolute top-1.5 right-1.5 h-2 w-2 rounded-full bg-primary ring-2 ring-background" />
          )}
        </button>
      </PopoverTrigger>
      <PopoverContent align="end" className="w-80 p-0">
        <div className="px-4 py-3 border-b border-border/40">
          <p className="text-sm font-bold">Recent activity</p>
        </div>
        {activities.length === 0 ? (
          <div className="px-4 py-8 text-center text-sm text-muted-foreground">
            No activity yet — your shower will come alive here.
          </div>
        ) : (
          <ul className="max-h-80 overflow-y-auto divide-y divide-border/40">
            {activities.slice(0, 12).map((a) => {
              const Icon = ICON_MAP[a.type] ?? ActivityIcon;
              const isUnread = a.timestamp > seenAt;
              return (
                <li key={a.id} className="flex items-start gap-3 px-4 py-3">
                  <div className="bg-muted/60 p-2 rounded-lg shrink-0">
                    <Icon className="h-3.5 w-3.5 text-foreground/70" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm leading-snug">{a.text}</p>
                    <p className="text-[11px] text-muted-foreground mt-0.5">
                      {formatRelativeTime(a.timestamp)}
                    </p>
                  </div>
                  {isUnread && <span className="h-2 w-2 rounded-full bg-primary mt-2 shrink-0" />}
                </li>
              );
            })}
          </ul>
        )}
      </PopoverContent>
    </Popover>
  );
};
