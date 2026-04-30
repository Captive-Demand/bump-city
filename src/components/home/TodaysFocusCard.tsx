import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useNavigate } from "react-router-dom";
import { ArrowRight, Send, Pencil, Users, Gift, ClipboardList, PartyPopper, Sparkles, type LucideIcon } from "lucide-react";
import { EventData } from "@/contexts/ActiveEventContext";
import { ShowerStats } from "@/components/shower/useShowerStats";
import { getShowerImage } from "@/lib/showerPlaceholders";

interface Focus {
  /** A short ALL-CAPS tag rendered in the header (e.g. "DESIGN INVITE"). */
  kind: string;
  headline: string;
  body: string;
  cta: string;
  ctaPath: string;
  icon: LucideIcon;
  tone: "primary" | "mint" | "peach" | "lavender";
}

const toneClasses: Record<Focus["tone"], { tag: string; iconBg: string }> = {
  primary: { tag: "text-primary bg-primary/10", iconBg: "bg-primary/15 text-primary" },
  mint: { tag: "text-mint-foreground bg-mint/40", iconBg: "bg-mint/40 text-mint-foreground" },
  peach: { tag: "text-foreground bg-peach", iconBg: "bg-peach text-foreground" },
  lavender: { tag: "text-lavender-foreground bg-lavender/40", iconBg: "bg-lavender/40 text-lavender-foreground" },
};

/**
 * Pick the single most useful next action for the host based on shower
 * state. Order matters — the first matching state wins, so list states by
 * urgency: setup gaps first, then guest follow-up, then event-day prep,
 * then "you're done" celebration.
 */
const pickFocus = (event: EventData, stats: ShowerStats): Focus => {
  const eventDate = event.event_date ? new Date(event.event_date) : null;
  const days = eventDate
    ? Math.ceil((eventDate.getTime() - Date.now()) / (1000 * 60 * 60 * 24))
    : null;

  // 1. No invite designed yet → biggest blocker.
  if (!event.invite_image_url) {
    return {
      kind: "DESIGN YOUR INVITE",
      headline: "Pick a template and bring it to life",
      body: "Every shower starts with the invite — design yours in a couple of minutes.",
      cta: "Design invite",
      ctaPath: "/invites",
      icon: Pencil,
      tone: "primary",
    };
  }

  // 2. No guests added yet.
  if (stats.guests === 0) {
    return {
      kind: "ADD YOUR GUESTS",
      headline: "Who's celebrating with you?",
      body: "Add the people you'd like to invite — import from contacts or paste a list.",
      cta: "Add guests",
      ctaPath: "/guests",
      icon: Users,
      tone: "primary",
    };
  }

  // 3. Guests exist but invitations not sent.
  if (stats.invitesUnsent > 0) {
    return {
      kind: "SEND YOUR INVITATIONS",
      headline: `${stats.invitesUnsent} ${stats.invitesUnsent === 1 ? "guest is" : "guests are"} waiting on an invite`,
      body: "Your invitation is ready — drop it in their inboxes so RSVPs can start coming in.",
      cta: stats.invitesUnsent === 1 ? "Send invite" : `Send ${stats.invitesUnsent} invites`,
      ctaPath: "/guests",
      icon: Send,
      tone: "primary",
    };
  }

  // 4. Registry empty.
  if (stats.registry === 0) {
    return {
      kind: "BUILD YOUR REGISTRY",
      headline: "Add your first registry items",
      body: "Pick from Bump City favorites, paste any product link, or add things by hand.",
      cta: "Open registry",
      ctaPath: "/registry",
      icon: Gift,
      tone: "primary",
    };
  }

  // 5. Sent, awaiting RSVPs.
  if (stats.guestsPending > 0 && (days === null || days > 7)) {
    return {
      kind: "FOLLOW UP ON RSVPS",
      headline: `${stats.guestsPending} ${stats.guestsPending === 1 ? "guest hasn't" : "guests haven't"} responded yet`,
      body: "A friendly reminder usually does the trick — send a nudge from the guest list.",
      cta: "Follow up",
      ctaPath: "/guests",
      icon: Users,
      tone: "peach",
    };
  }

  // 6. Open planning tasks.
  if (stats.tasks > 0 && (days === null || days > 3)) {
    return {
      kind: "PLANNING TASKS",
      headline: `${stats.tasks} task${stats.tasks === 1 ? "" : "s"} left to wrap up`,
      body: "Knock these out before the day so you can be present for the celebration.",
      cta: "Open planner",
      ctaPath: "/planning",
      icon: ClipboardList,
      tone: "lavender",
    };
  }

  // 7. Day-of mode (3 days or less).
  if (days !== null && days <= 3 && days >= 0) {
    return {
      kind: days === 0 ? "TODAY'S THE DAY" : `${days} DAY${days === 1 ? "" : "S"} TO GO`,
      headline: days === 0 ? "Have an amazing shower 🎉" : "It's almost time",
      body:
        days === 0
          ? "Open the shower for last-minute details and guest list."
          : "Run through the day-of checklist and keep an eye on RSVPs.",
      cta: days === 0 ? "Open shower" : "Day-of checklist",
      ctaPath: days === 0 ? `/showers/${event.id}` : "/planning",
      icon: PartyPopper,
      tone: "mint",
    };
  }

  // 8. All set — celebrate.
  return {
    kind: "YOU'RE READY",
    headline:
      days !== null
        ? `Your shower is ready · ${days} ${days === 1 ? "day" : "days"} to go`
        : "Your shower is ready",
    body: "Everything's in great shape. Share the registry link or check on guest replies.",
    cta: "Share registry",
    ctaPath: "/registry",
    icon: Sparkles,
    tone: "mint",
  };
};

interface Props {
  event: EventData;
  stats: ShowerStats;
}

export const TodaysFocusCard = ({ event, stats }: Props) => {
  const navigate = useNavigate();
  const focus = pickFocus(event, stats);
  const tones = toneClasses[focus.tone];
  const eventDate = event.event_date ? new Date(event.event_date) : null;
  const days = eventDate
    ? Math.max(0, Math.ceil((eventDate.getTime() - Date.now()) / (1000 * 60 * 60 * 24)))
    : null;
  const Icon = focus.icon;

  return (
    <Card className="border-none overflow-hidden">
      <CardContent className="p-0">
        <div className="relative">
          <img src={getShowerImage(event)} alt="" className="w-full h-28 object-cover" />
          <div className="absolute inset-0 bg-gradient-to-b from-black/0 to-black/40" />
          {/* Days-to-go pinned to the top-right so it doesn't squeeze the
              honoree's name at the bottom on narrow screens. */}
          {days !== null && (
            <Badge className="absolute top-3 right-3 bg-white/90 text-foreground text-[10px] font-bold shadow-sm">
              {days === 0 ? "TODAY" : `${days} DAYS TO GO`}
            </Badge>
          )}
          {/* Title takes the full width at the bottom; line-clamp lets very
              long names wrap to a second line rather than getting truncated. */}
          <div className="absolute inset-x-0 bottom-0 px-5 pb-3">
            <h3 className="text-base font-bold text-white drop-shadow leading-tight line-clamp-2">
              {event.honoree_name ? `${event.honoree_name}'s Baby Shower` : "Your Baby Shower"}
            </h3>
          </div>
        </div>
        <div className="p-5 space-y-3">
          <div className={`inline-flex items-center gap-1.5 text-[10px] font-bold tracking-wider px-2 py-1 rounded-full ${tones.tag}`}>
            <Icon className="h-3 w-3" />
            {focus.kind}
          </div>
          <div>
            <h2 className="text-lg font-bold leading-tight">{focus.headline}</h2>
            <p className="text-sm text-muted-foreground mt-1 leading-snug">{focus.body}</p>
          </div>
          <div className="flex items-center gap-2 pt-1">
            <Button className="flex-1 rounded-xl h-11 font-semibold gap-1.5" onClick={() => navigate(focus.ctaPath)}>
              {focus.cta}
              <ArrowRight className="h-4 w-4" />
            </Button>
            <Button
              variant="outline"
              className="rounded-xl h-11 px-4 text-sm shrink-0"
              onClick={() => navigate(`/showers/${event.id}`)}
            >
              Open
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
