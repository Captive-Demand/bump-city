import { useEffect, useState } from "react";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import {
  Mail,
  Phone,
  Send,
  Trash2,
  Loader2,
  CheckCircle2,
  Clock,
  XCircle,
  type LucideIcon,
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import {
  GROUP_PRESETS,
  groupChipClasses,
  type GroupKey,
} from "./guestGroups";

export interface GuestForSheet {
  id: string;
  name: string;
  status: string | null;
  group_label: string | null;
  plus_one: boolean | null;
  dietary_notes: string | null;
  email: string | null;
  phone: string | null;
  sms_opt_in: boolean | null;
  invite_sent: boolean | null;
  invite_sent_at: string | null;
}

type RSVPStatus = "attending" | "pending" | "declined";

const statusOptions: { key: RSVPStatus; label: string; Icon: LucideIcon; tone: string }[] = [
  { key: "attending", label: "Attending", Icon: CheckCircle2, tone: "bg-mint text-mint-foreground" },
  { key: "pending", label: "Pending", Icon: Clock, tone: "bg-warm text-warm-foreground" },
  { key: "declined", label: "Declined", Icon: XCircle, tone: "bg-destructive/10 text-destructive" },
];

interface Props {
  guest: GuestForSheet | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onChanged: () => void;
  onSendInvite: (guest: GuestForSheet) => void;
  sendingId: string | null;
}

/**
 * Bottom sheet that shows the full guest profile + lets the host edit
 * everything in one place: status, group, contact info, +1, dietary notes,
 * and the invite-send action. Tapping a row in the list opens this.
 *
 * Edits debounce-save on close — we collect changes locally and write a
 * single UPDATE when the sheet dismisses, so toggling around doesn't
 * spam the network.
 */
export const GuestDetailSheet = ({
  guest,
  open,
  onOpenChange,
  onChanged,
  onSendInvite,
  sendingId,
}: Props) => {
  // Local edit state — synced from `guest` whenever the sheet opens so
  // re-opening on a different guest doesn't carry stale edits.
  const [status, setStatus] = useState<RSVPStatus>("pending");
  const [groupLabel, setGroupLabel] = useState<string>("");
  const [email, setEmail] = useState<string>("");
  const [phone, setPhone] = useState<string>("");
  const [plusOne, setPlusOne] = useState(false);
  const [dietaryNotes, setDietaryNotes] = useState("");
  const [smsOptIn, setSmsOptIn] = useState(false);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    if (!guest) return;
    setStatus(((guest.status as RSVPStatus) || "pending"));
    setGroupLabel(guest.group_label || "");
    setEmail(guest.email || "");
    setPhone(guest.phone || "");
    setPlusOne(!!guest.plus_one);
    setDietaryNotes(guest.dietary_notes || "");
    setSmsOptIn(!!guest.sms_opt_in);
  }, [guest?.id]);

  const persist = async () => {
    if (!guest) return;
    setSaving(true);
    const { error } = await supabase
      .from("guests")
      .update({
        status,
        group_label: groupLabel || null,
        email: email.trim() || null,
        phone: phone.trim() || null,
        plus_one: plusOne,
        dietary_notes: dietaryNotes.trim() || null,
        sms_opt_in: smsOptIn,
      })
      .eq("id", guest.id);
    setSaving(false);
    if (error) {
      toast.error("Couldn't save changes");
      return;
    }
    onChanged();
  };

  const handleClose = async (next: boolean) => {
    if (!next && guest) {
      // On close, persist whatever changed.
      const dirty =
        status !== (guest.status || "pending") ||
        (groupLabel || null) !== guest.group_label ||
        (email.trim() || null) !== guest.email ||
        (phone.trim() || null) !== guest.phone ||
        plusOne !== !!guest.plus_one ||
        (dietaryNotes.trim() || null) !== guest.dietary_notes ||
        smsOptIn !== !!guest.sms_opt_in;
      if (dirty) await persist();
    }
    onOpenChange(next);
  };

  const handleDelete = async () => {
    if (!guest) return;
    setDeleting(true);
    const { error } = await supabase.from("guests").delete().eq("id", guest.id);
    setDeleting(false);
    if (error) {
      toast.error("Couldn't remove guest");
      return;
    }
    toast.success(`${guest.name} removed`);
    onChanged();
    onOpenChange(false);
  };

  if (!guest) return null;

  const initials = guest.name
    .split(" ")
    .map((n) => n[0])
    .filter(Boolean)
    .slice(0, 2)
    .join("");

  const inviteAt = guest.invite_sent_at
    ? new Date(guest.invite_sent_at).toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
      })
    : null;

  return (
    <Sheet open={open} onOpenChange={handleClose}>
      <SheetContent
        side="bottom"
        className="rounded-t-3xl max-h-[90vh] overflow-y-auto"
      >
        <SheetHeader className="text-left">
          <div className="flex items-start gap-3 pt-2">
            <div className="w-12 h-12 rounded-full bg-lavender flex items-center justify-center font-bold text-base text-lavender-foreground shrink-0">
              {initials}
            </div>
            <div className="flex-1 min-w-0">
              <SheetTitle className="text-xl truncate">{guest.name}</SheetTitle>
              <p className="text-xs text-muted-foreground mt-0.5">
                {guest.invite_sent
                  ? inviteAt
                    ? `Invite sent ${inviteAt}`
                    : "Invite sent"
                  : "Invite not sent yet"}
              </p>
            </div>
          </div>
        </SheetHeader>

        <div className="space-y-5 mt-5 pb-2">
          {/* Status — quick pills, single source of truth */}
          <section className="space-y-2">
            <Label className="text-xs uppercase tracking-wide text-muted-foreground">
              RSVP Status
            </Label>
            <div className="flex gap-2">
              {statusOptions.map((opt) => {
                const active = status === opt.key;
                return (
                  <button
                    key={opt.key}
                    onClick={() => setStatus(opt.key)}
                    className={cn(
                      "flex-1 h-10 rounded-xl text-sm font-medium border transition-colors flex items-center justify-center gap-1.5",
                      active
                        ? `${opt.tone} border-transparent`
                        : "bg-background text-muted-foreground border-border hover:border-primary/40"
                    )}
                  >
                    <opt.Icon className="h-3.5 w-3.5" />
                    {opt.label}
                  </button>
                );
              })}
            </div>
          </section>

          {/* Group picker */}
          <section className="space-y-2">
            <Label className="text-xs uppercase tracking-wide text-muted-foreground">
              Group
            </Label>
            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                onClick={() => setGroupLabel("")}
                className={cn(
                  "px-3 h-8 rounded-full text-xs font-medium border transition-colors",
                  !groupLabel
                    ? "bg-foreground text-background border-foreground"
                    : "bg-background text-muted-foreground border-border hover:border-primary/40"
                )}
              >
                None
              </button>
              {GROUP_PRESETS.map((g) => {
                const active = groupLabel === g.key;
                return (
                  <button
                    key={g.key}
                    type="button"
                    onClick={() => setGroupLabel(g.key)}
                    className={cn(
                      "px-3 h-8 rounded-full text-xs font-medium border transition-colors",
                      active
                        ? `${groupChipClasses(g.key)} border-transparent`
                        : "bg-background text-muted-foreground border-border hover:border-primary/40"
                    )}
                  >
                    {g.label}
                  </button>
                );
              })}
            </div>
          </section>

          {/* Contact */}
          <section className="space-y-3">
            <Label className="text-xs uppercase tracking-wide text-muted-foreground">
              Contact
            </Label>
            <div className="space-y-2">
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  type="email"
                  placeholder="email@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="pl-9"
                />
              </div>
              <div className="relative">
                <Phone className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  type="tel"
                  placeholder="555-123-4567"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  className="pl-9"
                />
              </div>
              {phone && (
                <label className="flex items-center justify-between gap-2 px-1 pt-1">
                  <span className="text-xs text-muted-foreground">
                    Send SMS reminders
                  </span>
                  <Switch checked={smsOptIn} onCheckedChange={setSmsOptIn} />
                </label>
              )}
            </div>
          </section>

          {/* Plus-one */}
          <section className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium">Bringing a +1</p>
              <p className="text-xs text-muted-foreground">
                Counts toward total headcount.
              </p>
            </div>
            <Switch checked={plusOne} onCheckedChange={setPlusOne} />
          </section>

          {/* Dietary */}
          <section className="space-y-2">
            <Label className="text-xs uppercase tracking-wide text-muted-foreground">
              Dietary notes
            </Label>
            <Textarea
              placeholder="e.g. Vegetarian, peanut allergy"
              value={dietaryNotes}
              onChange={(e) => setDietaryNotes(e.target.value)}
              className="min-h-[80px] resize-none"
            />
          </section>

          {/* Actions */}
          <div className="grid grid-cols-2 gap-2 pt-2">
            <Button
              variant="outline"
              className="gap-1.5"
              disabled={!email || sendingId === guest.id}
              onClick={() => onSendInvite(guest)}
            >
              {sendingId === guest.id ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Send className="h-4 w-4" />
              )}
              {guest.invite_sent ? "Resend" : "Send invite"}
            </Button>
            <Button
              variant="outline"
              className="gap-1.5 text-destructive hover:text-destructive"
              disabled={deleting}
              onClick={handleDelete}
            >
              {deleting ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Trash2 className="h-4 w-4" />
              )}
              Remove
            </Button>
          </div>
          {saving && (
            <p className="text-xs text-muted-foreground text-center pt-1 flex items-center justify-center gap-1">
              <Loader2 className="h-3 w-3 animate-spin" /> Saving…
            </p>
          )}
        </div>
      </SheetContent>
    </Sheet>
  );
};
