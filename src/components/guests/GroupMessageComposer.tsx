import { useMemo, useState } from "react";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Send, Loader2, Mail, MessageSquare } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { cn } from "@/lib/utils";
import {
  GROUP_PRESETS,
  groupLabelText,
  groupChipClasses,
} from "./guestGroups";

export interface ComposerGuest {
  id: string;
  name: string;
  status: string | null;
  group_label: string | null;
  email: string | null;
  phone: string | null;
  sms_opt_in: boolean | null;
  invite_sent: boolean | null;
}

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  guests: ComposerGuest[];
  honoreeName: string;
  eventDateStr: string;
  onSent: () => void;
}

type StatusFilter = "all" | "attending" | "pending" | "declined";
type Channel = "email" | "sms";

interface Template {
  id: string;
  label: string;
  defaultStatus: StatusFilter;
  defaultChannel: Channel;
  // Function so we can interpolate honoree/event details at render time.
  body: (ctx: { honoree: string; eventDate: string }) => string;
}

const TEMPLATES: Template[] = [
  {
    id: "rsvp-reminder",
    label: "RSVP reminder",
    defaultStatus: "pending",
    defaultChannel: "email",
    body: ({ honoree, eventDate }) =>
      `Hi! Just a friendly nudge — we'd love to know if you can make it to ${honoree}'s baby shower on ${eventDate}. Tap your invite link to RSVP. Thanks!`,
  },
  {
    id: "event-reminder",
    label: "Event reminder",
    defaultStatus: "attending",
    defaultChannel: "sms",
    body: ({ honoree, eventDate }) =>
      `Reminder: ${honoree}'s baby shower is ${eventDate}. Can't wait to see you!`,
  },
  {
    id: "thank-you",
    label: "Thanks for coming",
    defaultStatus: "attending",
    defaultChannel: "email",
    body: ({ honoree }) =>
      `Thank you for celebrating ${honoree} with us! Your presence (and presents!) meant the world. — With love`,
  },
  {
    id: "custom",
    label: "Custom message",
    defaultStatus: "all",
    defaultChannel: "email",
    body: () => "",
  },
];

/**
 * Composer for sending bulk messages to guest segments. Pulls together the
 * three pieces a host needs in flow: pick recipients (status + group),
 * pick channel (email or SMS), and either start from a template or write
 * something custom. Sends via the same edge functions as individual invites.
 */
export const GroupMessageComposer = ({
  open,
  onOpenChange,
  guests,
  honoreeName,
  eventDateStr,
  onSent,
}: Props) => {
  const [templateId, setTemplateId] = useState<string>(TEMPLATES[0].id);
  const [statusFilter, setStatusFilter] = useState<StatusFilter>(
    TEMPLATES[0].defaultStatus
  );
  const [groupFilter, setGroupFilter] = useState<string>("all");
  const [channel, setChannel] = useState<Channel>(TEMPLATES[0].defaultChannel);
  const [body, setBody] = useState(
    TEMPLATES[0].body({ honoree: honoreeName, eventDate: eventDateStr })
  );
  const [sending, setSending] = useState(false);

  // Distinct group labels actually present on this event's guests.
  const availableGroups = useMemo(() => {
    const set = new Set<string>();
    for (const g of guests) {
      if (g.group_label) set.add(g.group_label);
    }
    return Array.from(set);
  }, [guests]);

  const recipients = useMemo(() => {
    return guests.filter((g) => {
      if (statusFilter !== "all") {
        const s = g.status || "pending";
        if (s !== statusFilter) return false;
      }
      if (groupFilter !== "all" && g.group_label !== groupFilter) return false;
      if (channel === "email") return !!g.email;
      if (channel === "sms") return !!(g.phone && g.sms_opt_in);
      return false;
    });
  }, [guests, statusFilter, groupFilter, channel]);

  const pickTemplate = (id: string) => {
    setTemplateId(id);
    const t = TEMPLATES.find((x) => x.id === id);
    if (!t) return;
    if (t.id !== "custom") {
      // Reset filters + channel + body to template defaults — but only when
      // moving to a non-custom template, so users editing a draft don't lose it.
      setStatusFilter(t.defaultStatus);
      setChannel(t.defaultChannel);
      setBody(t.body({ honoree: honoreeName, eventDate: eventDateStr }));
    }
  };

  const handleSend = async () => {
    if (recipients.length === 0) {
      toast.error("No recipients match those filters.");
      return;
    }
    if (!body.trim()) {
      toast.error("Message body is empty.");
      return;
    }

    setSending(true);
    let sent = 0;
    let failed = 0;

    for (const r of recipients) {
      try {
        if (channel === "email") {
          if (!r.email) {
            failed++;
            continue;
          }
          const { error } = await supabase.functions.invoke(
            "send-transactional-email",
            {
              body: {
                templateName: "shower-reminder",
                recipientEmail: r.email,
                idempotencyKey: `group-msg-${templateId}-${r.id}-${Date.now()}`,
                templateData: {
                  guestName: r.name,
                  honoreeName,
                  eventDate: eventDateStr,
                  body,
                },
              },
            }
          );
          if (error) failed++;
          else sent++;
        } else {
          if (!r.phone) {
            failed++;
            continue;
          }
          const { error } = await supabase.functions.invoke("send-sms", {
            body: { to: r.phone, message: body },
          });
          if (error) failed++;
          else sent++;
        }
      } catch {
        failed++;
      }
    }

    setSending(false);
    if (failed === 0) {
      toast.success(
        `Sent ${sent} message${sent !== 1 ? "s" : ""} via ${channel === "email" ? "email" : "SMS"}!`
      );
    } else {
      toast.error(`${sent} sent, ${failed} failed.`);
    }
    onSent();
    onOpenChange(false);
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent
        side="bottom"
        className="rounded-t-3xl max-h-[90vh] overflow-y-auto"
      >
        <SheetHeader className="text-left">
          <SheetTitle>Send group message</SheetTitle>
          <SheetDescription>
            Pick a template or write your own. We'll send it to the recipients
            below.
          </SheetDescription>
        </SheetHeader>

        <div className="space-y-5 mt-4 pb-2">
          {/* Template chips */}
          <section className="space-y-2">
            <Label className="text-xs uppercase tracking-wide text-muted-foreground">
              Template
            </Label>
            <div className="flex flex-wrap gap-2">
              {TEMPLATES.map((t) => {
                const active = templateId === t.id;
                return (
                  <button
                    key={t.id}
                    type="button"
                    onClick={() => pickTemplate(t.id)}
                    className={cn(
                      "px-3 h-8 rounded-full text-xs font-medium border transition-colors",
                      active
                        ? "bg-primary text-primary-foreground border-primary"
                        : "bg-background text-muted-foreground border-border hover:border-primary/40"
                    )}
                  >
                    {t.label}
                  </button>
                );
              })}
            </div>
          </section>

          {/* Channel toggle */}
          <section className="space-y-2">
            <Label className="text-xs uppercase tracking-wide text-muted-foreground">
              Channel
            </Label>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => setChannel("email")}
                className={cn(
                  "h-10 rounded-xl text-sm font-medium border flex items-center justify-center gap-1.5 transition-colors",
                  channel === "email"
                    ? "bg-primary text-primary-foreground border-primary"
                    : "bg-background text-muted-foreground border-border hover:border-primary/40"
                )}
              >
                <Mail className="h-4 w-4" /> Email
              </button>
              <button
                type="button"
                onClick={() => setChannel("sms")}
                className={cn(
                  "h-10 rounded-xl text-sm font-medium border flex items-center justify-center gap-1.5 transition-colors",
                  channel === "sms"
                    ? "bg-primary text-primary-foreground border-primary"
                    : "bg-background text-muted-foreground border-border hover:border-primary/40"
                )}
              >
                <MessageSquare className="h-4 w-4" /> SMS
              </button>
            </div>
          </section>

          {/* Audience: status + group filters */}
          <section className="space-y-2">
            <Label className="text-xs uppercase tracking-wide text-muted-foreground">
              Audience
            </Label>
            <div className="space-y-2">
              <div className="flex flex-wrap gap-2">
                {(
                  [
                    { key: "all", label: "All statuses" },
                    { key: "attending", label: "Attending" },
                    { key: "pending", label: "Pending" },
                    { key: "declined", label: "Declined" },
                  ] as const
                ).map((s) => {
                  const active = statusFilter === s.key;
                  return (
                    <button
                      key={s.key}
                      type="button"
                      onClick={() => setStatusFilter(s.key)}
                      className={cn(
                        "px-3 h-8 rounded-full text-xs font-medium border transition-colors",
                        active
                          ? "bg-foreground text-background border-foreground"
                          : "bg-background text-muted-foreground border-border hover:border-primary/40"
                      )}
                    >
                      {s.label}
                    </button>
                  );
                })}
              </div>
              {/* Group filter — only render the chips for groups that
                  actually exist on guests, plus an "All groups" pill. */}
              {(availableGroups.length > 0 || GROUP_PRESETS.some((g) => guests.some((x) => x.group_label === g.key))) && (
                <div className="flex flex-wrap gap-2">
                  <button
                    type="button"
                    onClick={() => setGroupFilter("all")}
                    className={cn(
                      "px-3 h-8 rounded-full text-xs font-medium border transition-colors",
                      groupFilter === "all"
                        ? "bg-foreground text-background border-foreground"
                        : "bg-background text-muted-foreground border-border hover:border-primary/40"
                    )}
                  >
                    All groups
                  </button>
                  {availableGroups.map((g) => {
                    const active = groupFilter === g;
                    return (
                      <button
                        key={g}
                        type="button"
                        onClick={() => setGroupFilter(g)}
                        className={cn(
                          "px-3 h-8 rounded-full text-xs font-medium border transition-colors",
                          active
                            ? `${groupChipClasses(g)} border-transparent`
                            : "bg-background text-muted-foreground border-border hover:border-primary/40"
                        )}
                      >
                        {groupLabelText(g)}
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
            <p className="text-[11px] text-muted-foreground pt-0.5">
              {recipients.length} {channel === "email" ? "with email" : "with SMS opt-in"} ·{" "}
              {channel === "email"
                ? guests.filter((g) =>
                    statusFilter === "all"
                      ? true
                      : (g.status || "pending") === statusFilter
                  ).length - recipients.length
                : guests.filter((g) =>
                    statusFilter === "all"
                      ? true
                      : (g.status || "pending") === statusFilter
                  ).length - recipients.length}{" "}
              skipped
            </p>
          </section>

          {/* Body */}
          <section className="space-y-2">
            <Label className="text-xs uppercase tracking-wide text-muted-foreground">
              Message
            </Label>
            <Textarea
              value={body}
              onChange={(e) => setBody(e.target.value)}
              className="min-h-[120px] resize-none"
              placeholder="Write your message…"
            />
            {channel === "sms" && body.length > 160 && (
              <p className="text-[11px] text-warm-foreground">
                {body.length} chars — long SMS may be split into multiple
                messages.
              </p>
            )}
          </section>

          {/* Send */}
          <Button
            className="w-full h-12 gap-2"
            onClick={handleSend}
            disabled={sending || recipients.length === 0 || !body.trim()}
          >
            {sending ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Send className="h-4 w-4" />
            )}
            {sending
              ? "Sending…"
              : `Send to ${recipients.length} ${recipients.length === 1 ? "guest" : "guests"}`}
          </Button>
        </div>
      </SheetContent>
    </Sheet>
  );
};
