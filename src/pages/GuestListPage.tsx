import { useState, useEffect, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Users,
  Plus,
  Search,
  Mail,
  Send,
  Loader2,
  SendHorizonal,
  MessageSquare,
  Utensils,
  CheckCircle2,
  Clock,
  XCircle,
  PartyPopper,
  ChevronLeft,
} from "lucide-react";
import { MobileLayout } from "@/components/layout/MobileLayout";
import { PageLoader } from "@/components/PageLoader";
import { useAppMode } from "@/contexts/AppModeContext";
import { useActivityFeed } from "@/contexts/ActivityFeedContext";
import { useAuth } from "@/contexts/AuthContext";
import { useEvent } from "@/hooks/useEvent";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import GuestImportDialog from "@/components/GuestImportDialog";
import { Checkbox } from "@/components/ui/checkbox";
import { cn } from "@/lib/utils";
import {
  GROUP_PRESETS,
  groupChipClasses,
  groupLabelText,
} from "@/components/guests/guestGroups";
import {
  GuestDetailSheet,
  type GuestForSheet,
} from "@/components/guests/GuestDetailSheet";
import { GroupMessageComposer } from "@/components/guests/GroupMessageComposer";

type RSVPStatus = "attending" | "declined" | "pending";
type SegmentKey = "all" | "attending" | "pending" | "declined";

interface Guest {
  id: string;
  name: string;
  status: string;
  group_label: string | null;
  plus_one: boolean;
  dietary_notes: string | null;
  email: string | null;
  phone: string | null;
  sms_opt_in: boolean | null;
  invite_sent: boolean | null;
  invite_sent_at: string | null;
}

const statusMeta: Record<
  RSVPStatus,
  { label: string; chip: string; dot: string; Icon: typeof CheckCircle2 }
> = {
  attending: {
    label: "Attending",
    chip: "bg-mint text-mint-foreground",
    dot: "bg-mint-foreground",
    Icon: CheckCircle2,
  },
  pending: {
    label: "Pending",
    chip: "bg-warm text-warm-foreground",
    dot: "bg-warm-foreground",
    Icon: Clock,
  },
  declined: {
    label: "Declined",
    chip: "bg-destructive/10 text-destructive",
    dot: "bg-destructive",
    Icon: XCircle,
  },
};

const GuestListPage = () => {
  const navigate = useNavigate();
  const [guests, setGuests] = useState<Guest[]>([]);
  const [loading, setLoading] = useState(true);
  const { addActivity } = useActivityFeed();
  const { user } = useAuth();
  const { event } = useEvent();
  const { setupData } = useAppMode();
  const [search, setSearch] = useState("");
  const [segment, setSegment] = useState<SegmentKey>("all");
  const [sendingId, setSendingId] = useState<string | null>(null);
  const [bulkSending, setBulkSending] = useState(false);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [bulkMode, setBulkMode] = useState(false);
  const [groupFilter, setGroupFilter] = useState<string>("all");

  // Per-guest detail sheet
  const [detailGuest, setDetailGuest] = useState<GuestForSheet | null>(null);
  const [detailOpen, setDetailOpen] = useState(false);

  // Group-message composer
  const [composerOpen, setComposerOpen] = useState(false);

  // Add guest form
  const [addOpen, setAddOpen] = useState(false);
  const [newName, setNewName] = useState("");
  const [newEmail, setNewEmail] = useState("");
  const [newGroup, setNewGroup] = useState<string>("");

  const fetchGuests = async () => {
    if (!event) return;
    // Use `*` so the page keeps working even when a column the UI knows about
    // (e.g. group_label) hasn't been migrated to the DB yet — missing columns
    // simply come back undefined rather than 400ing the whole request.
    const { data } = await supabase
      .from("guests")
      .select("*")
      .eq("event_id", event.id)
      .order("created_at", { ascending: true });
    setGuests((data as unknown as Guest[]) || []);
    setLoading(false);
    // Keep the detail sheet's guest in sync if it's open while a refetch happens
    // (e.g. after sending an invite from the sheet).
    setDetailGuest((prev) =>
      prev
        ? ((data as unknown as Guest[])?.find((g) => g.id === prev.id) ?? null)
        : null
    );
  };

  useEffect(() => {
    if (event) fetchGuests();
    else setLoading(false);
  }, [event]);

  // RSVP status is set inside the detail sheet; this page is read-only re: status.
  // Likewise, deleteGuest now lives in the sheet — host taps a row to open it.

  const handleAdd = async () => {
    if (!event || !user || !newName.trim()) return;
    // Only send group_label when actually set, so DBs without the
    // group_label migration applied still accept the insert.
    const payload: Record<string, unknown> = {
      event_id: event.id,
      user_id: user.id,
      name: newName.trim(),
      email: newEmail.trim() || null,
    };
    if (newGroup) payload.group_label = newGroup;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { error } = await supabase.from("guests").insert(payload as any);
    if (error) {
      toast.error("Failed to add guest");
      return;
    }
    addActivity("guest-invited", `Invited ${newName.trim()}`);
    setNewName("");
    setNewEmail("");
    setNewGroup("");
    setAddOpen(false);
    fetchGuests();
  };

  const [confirmResend, setConfirmResend] = useState<Guest | null>(null);
  const [confirmBulk, setConfirmBulk] = useState(false);

  const doSendInvite = async (guest: Guest) => {
    if (!guest.email) {
      toast.error("No email address for this guest");
      return;
    }
    if (!event) return;

    const inviteImageUrl = (event as any).invite_image_url;
    if (!inviteImageUrl) {
      toast.error("Please save your invite design in Invite Builder first.");
      return;
    }

    setSendingId(guest.id);
    try {
      const honoreeName =
        event.honoree_name || setupData.honoreeName || "the parents-to-be";
      const eventDateStr = event.event_date
        ? new Date(event.event_date).toLocaleDateString("en-US", {
            weekday: "long",
            month: "long",
            day: "numeric",
            year: "numeric",
          })
        : "a date to be announced";
      const location = event.city || "";

      const { data: codes } = await supabase
        .from("invite_codes")
        .select("code")
        .eq("event_id", event.id)
        .limit(1);
      let rsvpCode = codes?.[0]?.code;
      if (!rsvpCode && user) {
        rsvpCode = Math.random().toString(36).substring(2, 8).toUpperCase();
        await supabase
          .from("invite_codes")
          .insert({ event_id: event.id, created_by: user.id, code: rsvpCode });
      }

      const siteOrigin = window.location.origin;
      const rsvpUrl = rsvpCode ? `${siteOrigin}/join?code=${rsvpCode}` : siteOrigin;

      const { error } = await supabase.functions.invoke("send-transactional-email", {
        body: {
          templateName: "shower-invitation",
          recipientEmail: guest.email,
          idempotencyKey: `shower-invite-${guest.id}-${event.id}-${Date.now()}`,
          templateData: {
            imageUrl: inviteImageUrl,
            guestName: guest.name,
            honoreeName,
            rsvpUrl,
            eventDate: eventDateStr,
            location,
          },
        },
      });

      if (error) throw error;

      await supabase
        .from("guests")
        .update({ invite_sent: true, invite_sent_at: new Date().toISOString() })
        .eq("id", guest.id);

      // Optionally send SMS if guest opted in and has a phone
      if (guest.phone && guest.sms_opt_in) {
        try {
          await supabase.functions.invoke("send-sms", {
            body: {
              to: guest.phone,
              message: `You're invited to ${honoreeName}'s baby shower! RSVP here: ${rsvpUrl}`,
            },
          });
        } catch (smsErr) {
          console.warn("SMS send failed (non-blocking):", smsErr);
        }
      }

      addActivity("invite-sent", `Invite sent to ${guest.name}`);
      return true;
    } catch (err) {
      console.error("Failed to send invite:", err);
      return false;
    } finally {
      setSendingId(null);
    }
  };

  const sendInvite = (guest: Guest) => {
    if (guest.invite_sent) {
      setConfirmResend(guest);
    } else {
      doSendInvite(guest).then((ok) => {
        if (ok) {
          toast.success(`Invite sent to ${guest.name}!`);
          fetchGuests();
        } else toast.error("Failed to send invite.");
      });
    }
  };

  const toggleSelect = (id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const selectAll = () => {
    const ids = eligibleForBulk.map((g) => g.id);
    setSelectedIds(new Set(ids));
  };

  const selectNone = () => setSelectedIds(new Set());

  const handleBulkSend = async () => {
    if (!event) return;
    const inviteImageUrl = (event as any).invite_image_url;
    if (!inviteImageUrl) {
      toast.error("Please save your invite design in Invite Builder first.");
      return;
    }

    const toSend = guests.filter((g) => selectedIds.has(g.id) && g.email);
    const hasResends = toSend.some((g) => g.invite_sent);

    if (hasResends) {
      setConfirmBulk(true);
      return;
    }

    await executeBulkSend(toSend);
  };

  const executeBulkSend = async (toSend: Guest[]) => {
    setBulkSending(true);
    let sent = 0;
    let failed = 0;

    for (const guest of toSend) {
      const ok = await doSendInvite(guest);
      if (ok) sent++;
      else failed++;
    }

    setBulkSending(false);
    fetchGuests();

    if (failed === 0) {
      toast.success(`${sent} invite${sent !== 1 ? "s" : ""} sent successfully!`);
    } else {
      toast.error(`${sent} sent, ${failed} failed. Check emails and try again.`);
    }

    setBulkMode(false);
    setSelectedIds(new Set());
  };

  // SMS reminders are now handled by GroupMessageComposer (channel = "sms").

  // ─── Derived data ─────────────────────────────────────────────────────────
  const counts = useMemo(
    () => ({
      all: guests.length,
      attending: guests.filter((g) => g.status === "attending").length,
      pending: guests.filter((g) => g.status === "pending" || !g.status).length,
      declined: guests.filter((g) => g.status === "declined").length,
    }),
    [guests]
  );

  const segmented = useMemo(() => {
    if (segment === "all") return guests;
    if (segment === "pending") return guests.filter((g) => g.status === "pending" || !g.status);
    return guests.filter((g) => g.status === segment);
  }, [guests, segment]);

  const groupFiltered = useMemo(() => {
    if (groupFilter === "all") return segmented;
    return segmented.filter((g) => g.group_label === groupFilter);
  }, [segmented, groupFilter]);

  const filtered = useMemo(
    () => groupFiltered.filter((g) => g.name.toLowerCase().includes(search.toLowerCase())),
    [groupFiltered, search]
  );

  // Distinct group labels actually used on this event's guests — drives
  // the filter row so we don't show empty group chips.
  const usedGroups = useMemo(() => {
    const set = new Set<string>();
    for (const g of guests) if (g.group_label) set.add(g.group_label);
    return Array.from(set);
  }, [guests]);

  const eligibleForBulk = filtered.filter((g) => g.email);
  const selectedCount = selectedIds.size;
  const selectedWithEmail = guests.filter(
    (g) => selectedIds.has(g.id) && g.email
  ).length;

  // Bulk-nudge non-responders: re-send invites to everyone in Pending who has email
  const nudgePending = async () => {
    const toSend = guests.filter(
      (g) => (g.status === "pending" || !g.status) && g.email
    );
    if (toSend.length === 0) {
      toast.error("No pending guests with email addresses.");
      return;
    }
    await executeBulkSend(toSend);
  };

  if (loading) {
    return (
      <MobileLayout>
        <PageLoader />
      </MobileLayout>
    );
  }

  return (
    <MobileLayout>
      <div className="px-6 pt-12 pb-4">
        {/* Back-to-home link — matches Registry / Planning / Gifts / Predictions. */}
        <button
          onClick={() => navigate("/")}
          className="flex items-center gap-1 text-sm text-muted-foreground mb-4 hover:text-foreground"
        >
          <ChevronLeft className="h-4 w-4" /> Home
        </button>
        <div className="flex items-center justify-between mb-1">
          <div className="flex items-center gap-2">
            <Users className="h-5 w-5 text-primary" />
            <h1 className="text-2xl font-bold">Guest List</h1>
          </div>
          <div className="flex items-center gap-2">
            {event && user && (
              <GuestImportDialog
                eventId={event.id}
                userId={user.id}
                onImported={fetchGuests}
              />
            )}
            <Dialog open={addOpen} onOpenChange={setAddOpen}>
              <DialogTrigger asChild>
                <Button size="sm" className="rounded-full h-8 gap-1">
                  <Plus className="h-3.5 w-3.5" /> Add
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Add Guest</DialogTitle>
                </DialogHeader>
                <div className="space-y-4">
                  <div className="space-y-1.5">
                    <Label>Name</Label>
                    <Input
                      placeholder="e.g. Emma Thompson"
                      value={newName}
                      onChange={(e) => setNewName(e.target.value)}
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label>Email (optional)</Label>
                    <Input
                      type="email"
                      placeholder="emma@example.com"
                      value={newEmail}
                      onChange={(e) => setNewEmail(e.target.value)}
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label>Group (optional)</Label>
                    <div className="flex flex-wrap gap-1.5">
                      <button
                        type="button"
                        onClick={() => setNewGroup("")}
                        className={cn(
                          "px-2.5 h-7 rounded-full text-xs font-medium border transition-colors",
                          !newGroup
                            ? "bg-foreground text-background border-foreground"
                            : "bg-background text-muted-foreground border-border"
                        )}
                      >
                        None
                      </button>
                      {GROUP_PRESETS.map((g) => {
                        const active = newGroup === g.key;
                        return (
                          <button
                            key={g.key}
                            type="button"
                            onClick={() => setNewGroup(g.key)}
                            className={cn(
                              "px-2.5 h-7 rounded-full text-xs font-medium border transition-colors",
                              active
                                ? `${groupChipClasses(g.key)} border-transparent`
                                : "bg-background text-muted-foreground border-border"
                            )}
                          >
                            {g.label}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                  <Button
                    className="w-full"
                    onClick={handleAdd}
                    disabled={!newName.trim()}
                  >
                    Add Guest
                  </Button>
                </div>
              </DialogContent>
            </Dialog>
          </div>
        </div>
        <p className="text-sm text-muted-foreground">
          {counts.attending} attending · {counts.pending} pending · {counts.all} total
        </p>
      </div>

      {/* Segment tabs — stack 2×2 on mobile so all four are visible without
          horizontal scroll; flatten to a single row on tablet+ where there's
          room. */}
      <div className="px-6 mb-3">
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
          {(
            [
              { key: "all", label: "All", count: counts.all },
              { key: "attending", label: "Attending", count: counts.attending },
              { key: "pending", label: "Pending", count: counts.pending },
              { key: "declined", label: "Declined", count: counts.declined },
            ] as const
          ).map((s) => {
            const active = segment === s.key;
            return (
              <button
                key={s.key}
                onClick={() => setSegment(s.key)}
                className={cn(
                  "h-9 rounded-full text-sm font-medium transition-colors border px-3",
                  active
                    ? "bg-primary text-primary-foreground border-primary"
                    : "bg-background text-foreground border-border hover:border-primary/40"
                )}
              >
                {s.label}{" "}
                <span
                  className={cn(
                    "ml-1 text-xs",
                    active ? "opacity-90" : "text-muted-foreground"
                  )}
                >
                  ({s.count})
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Group filter — only render when at least one guest has a group set */}
      {usedGroups.length > 0 && (
        <div className="px-6 mb-3">
          <div className="flex gap-2 overflow-x-auto pb-1 -mx-1 px-1 scrollbar-none">
            <button
              onClick={() => setGroupFilter("all")}
              className={cn(
                "shrink-0 px-3 h-7 rounded-full text-xs font-medium border transition-colors",
                groupFilter === "all"
                  ? "bg-foreground text-background border-foreground"
                  : "bg-background text-muted-foreground border-border hover:border-primary/40"
              )}
            >
              All groups
            </button>
            {usedGroups.map((g) => {
              const active = groupFilter === g;
              return (
                <button
                  key={g}
                  onClick={() => setGroupFilter(g)}
                  className={cn(
                    "shrink-0 px-3 h-7 rounded-full text-xs font-medium border transition-colors",
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
        </div>
      )}

      <div className="px-6 mb-4 space-y-2">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search guests..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9 rounded-full bg-muted border-none"
          />
        </div>

        {/* Bulk send toolbar */}
        <div className="flex items-center justify-between gap-2 flex-wrap">
          <div className="flex items-center gap-2">
            <Button
              variant={bulkMode ? "secondary" : "outline"}
              size="sm"
              className="h-8 gap-1.5 text-xs"
              onClick={() => {
                setBulkMode(!bulkMode);
                if (bulkMode) setSelectedIds(new Set());
              }}
            >
              <SendHorizonal className="h-3.5 w-3.5" />
              {bulkMode ? "Cancel" : "Bulk Send"}
            </Button>
            {!bulkMode && (
              <Button
                variant="outline"
                size="sm"
                className="h-8 gap-1.5 text-xs"
                onClick={() => setComposerOpen(true)}
              >
                <MessageSquare className="h-3.5 w-3.5" />
                Message
              </Button>
            )}
          </div>

          {bulkMode && (
            <div className="flex items-center gap-2">
              <Button
                variant="ghost"
                size="sm"
                className="h-7 text-xs"
                onClick={
                  selectedCount === eligibleForBulk.length ? selectNone : selectAll
                }
              >
                {selectedCount === eligibleForBulk.length
                  ? "Deselect All"
                  : "Select All"}
              </Button>
              <Button
                size="sm"
                className="h-8 gap-1.5"
                disabled={selectedWithEmail === 0 || bulkSending}
                onClick={handleBulkSend}
              >
                {bulkSending ? (
                  <>
                    <Loader2 className="h-3.5 w-3.5 animate-spin" /> Sending...
                  </>
                ) : (
                  <>
                    <Send className="h-3.5 w-3.5" /> Send ({selectedWithEmail})
                  </>
                )}
              </Button>
            </div>
          )}
        </div>
      </div>

      <div className="px-6 pb-6 grid grid-cols-1 md:grid-cols-2 gap-2">
        {filtered.length === 0 && (
          <div className="col-span-full">
            <SegmentEmptyState
              segment={segment}
              search={search}
              counts={counts}
              hasGuests={guests.length > 0}
              onAdd={() => setAddOpen(true)}
              onClearSearch={() => setSearch("")}
              onJumpToPending={() => setSegment("pending")}
              onNudgePending={nudgePending}
              bulkSending={bulkSending}
            />
          </div>
        )}
        {filtered.map((guest) => {
          const meta =
            statusMeta[(guest.status as RSVPStatus) ?? "pending"] ??
            statusMeta.pending;
          const handleRowClick = () => {
            if (bulkMode) {
              if (guest.email) toggleSelect(guest.id);
              return;
            }
            setDetailGuest(guest as unknown as GuestForSheet);
            setDetailOpen(true);
          };
          return (
            <Card
              key={guest.id}
              className="border-none cursor-pointer hover:bg-accent/30 transition-colors"
              onClick={handleRowClick}
            >
              <CardContent className="p-3 flex items-center gap-3">
                {bulkMode && (
                  <Checkbox
                    checked={selectedIds.has(guest.id)}
                    onCheckedChange={() => toggleSelect(guest.id)}
                    onClick={(e) => e.stopPropagation()}
                    disabled={!guest.email}
                    className="shrink-0"
                  />
                )}
                {/* Avatar with status dot in the corner. */}
                <div className="relative shrink-0">
                  <div className="w-10 h-10 rounded-full bg-lavender flex items-center justify-center font-bold text-sm text-lavender-foreground">
                    {guest.name
                      .split(" ")
                      .map((n) => n[0])
                      .filter(Boolean)
                      .slice(0, 2)
                      .join("")}
                  </div>
                  <span
                    className={cn(
                      "absolute -bottom-0.5 -right-0.5 h-3 w-3 rounded-full ring-2 ring-background",
                      meta.dot
                    )}
                    title={meta.label}
                  />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 min-w-0">
                    <p className="font-semibold text-sm truncate">{guest.name}</p>
                    {guest.group_label && (
                      <span
                        className={cn(
                          "text-[10px] px-1.5 h-4 rounded inline-flex items-center font-medium shrink-0",
                          groupChipClasses(guest.group_label)
                        )}
                      >
                        {groupLabelText(guest.group_label)}
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-2 mt-0.5 text-[10px] text-muted-foreground">
                    {guest.invite_sent && (
                      <span className="inline-flex items-center gap-0.5">
                        <Mail className="h-3 w-3" /> Sent
                      </span>
                    )}
                    {guest.plus_one && (
                      <span className="inline-flex items-center gap-0.5">
                        <Plus className="h-3 w-3" />1
                      </span>
                    )}
                    {guest.dietary_notes && (
                      <span className="inline-flex items-center gap-0.5 truncate">
                        <Utensils className="h-3 w-3 shrink-0" />
                        <span className="truncate">{guest.dietary_notes}</span>
                      </span>
                    )}
                  </div>
                </div>

                {/* Status pill — read-only here; tap row to edit in detail sheet. */}
                <span
                  className={cn(
                    "text-[10px] px-2 h-6 rounded-full font-medium inline-flex items-center shrink-0",
                    meta.chip
                  )}
                >
                  {meta.label}
                </span>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Per-guest detail sheet — opens on row tap */}
      <GuestDetailSheet
        guest={detailGuest}
        open={detailOpen}
        onOpenChange={setDetailOpen}
        onChanged={fetchGuests}
        onSendInvite={(g) => sendInvite(g as unknown as Guest)}
        sendingId={sendingId}
      />

      {/* Group message composer */}
      {event && (
        <GroupMessageComposer
          open={composerOpen}
          onOpenChange={setComposerOpen}
          guests={guests}
          honoreeName={event.honoree_name || setupData.honoreeName || "the parents-to-be"}
          eventDateStr={
            event.event_date
              ? new Date(event.event_date).toLocaleDateString("en-US", {
                  weekday: "long",
                  month: "long",
                  day: "numeric",
                })
              : "soon"
          }
          onSent={fetchGuests}
        />
      )}

      {/* Resend confirmation dialog */}
      <Dialog
        open={!!confirmResend}
        onOpenChange={(open) => !open && setConfirmResend(null)}
      >
        <DialogContent className="max-w-xs">
          <DialogHeader>
            <DialogTitle>Resend Invite?</DialogTitle>
          </DialogHeader>
          <p className="text-sm text-muted-foreground">
            An invite was already sent to{" "}
            <span className="font-semibold">{confirmResend?.name}</span>. Send again?
          </p>
          <div className="flex gap-2 justify-end">
            <Button variant="outline" size="sm" onClick={() => setConfirmResend(null)}>
              Cancel
            </Button>
            <Button
              size="sm"
              onClick={() => {
                if (confirmResend) {
                  doSendInvite(confirmResend).then((ok) => {
                    if (ok) {
                      toast.success(`Invite resent to ${confirmResend.name}!`);
                      fetchGuests();
                    } else toast.error("Failed to resend invite.");
                  });
                  setConfirmResend(null);
                }
              }}
            >
              Resend
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Bulk resend confirmation dialog */}
      <Dialog open={confirmBulk} onOpenChange={setConfirmBulk}>
        <DialogContent className="max-w-xs">
          <DialogHeader>
            <DialogTitle>Send Invites?</DialogTitle>
          </DialogHeader>
          <p className="text-sm text-muted-foreground">
            Some selected guests have already received invites. This will resend to
            those guests as well. Continue?
          </p>
          <div className="flex gap-2 justify-end">
            <Button variant="outline" size="sm" onClick={() => setConfirmBulk(false)}>
              Cancel
            </Button>
            <Button
              size="sm"
              onClick={() => {
                setConfirmBulk(false);
                const toSend = guests.filter(
                  (g) => selectedIds.has(g.id) && g.email
                );
                executeBulkSend(toSend);
              }}
            >
              Send All
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </MobileLayout>
  );
};

// ─── Empty states ────────────────────────────────────────────────────────────

const SegmentEmptyState = ({
  segment,
  search,
  counts,
  hasGuests,
  onAdd,
  onClearSearch,
  onJumpToPending,
  onNudgePending,
  bulkSending,
}: {
  segment: SegmentKey;
  search: string;
  counts: { all: number; attending: number; pending: number; declined: number };
  hasGuests: boolean;
  onAdd: () => void;
  onClearSearch: () => void;
  onJumpToPending: () => void;
  onNudgePending: () => void;
  bulkSending: boolean;
}) => {
  // Search has priority over segment messaging.
  if (search.trim()) {
    return (
      <div className="text-center py-10 px-4">
        <p className="text-sm text-muted-foreground mb-3">
          No guests match "{search}".
        </p>
        <Button variant="outline" size="sm" onClick={onClearSearch}>
          Clear search
        </Button>
      </div>
    );
  }

  if (!hasGuests) {
    return (
      <div className="text-center py-10 px-4">
        <Users className="h-8 w-8 text-muted-foreground/60 mx-auto mb-3" />
        <p className="text-sm font-semibold mb-1">No guests yet</p>
        <p className="text-xs text-muted-foreground mb-4">
          Add your first guest to start sending invites.
        </p>
        <Button size="sm" onClick={onAdd} className="gap-1">
          <Plus className="h-3.5 w-3.5" /> Add a guest
        </Button>
      </div>
    );
  }

  if (segment === "attending") {
    return (
      <div className="text-center py-10 px-4">
        <Clock className="h-8 w-8 text-muted-foreground/60 mx-auto mb-3" />
        <p className="text-sm font-semibold mb-1">No RSVPs yet</p>
        <p className="text-xs text-muted-foreground mb-4">
          {counts.pending > 0
            ? `${counts.pending} guest${counts.pending !== 1 ? "s" : ""} haven't responded — give them a nudge.`
            : "Send invites to start hearing back."}
        </p>
        {counts.pending > 0 && (
          <Button
            size="sm"
            onClick={onNudgePending}
            disabled={bulkSending}
            className="gap-1"
          >
            {bulkSending ? (
              <Loader2 className="h-3.5 w-3.5 animate-spin" />
            ) : (
              <Send className="h-3.5 w-3.5" />
            )}
            Nudge pending guests
          </Button>
        )}
      </div>
    );
  }

  if (segment === "pending") {
    return (
      <div className="text-center py-10 px-4">
        <PartyPopper className="h-8 w-8 text-mint-foreground mx-auto mb-3" />
        <p className="text-sm font-semibold mb-1">Everyone's responded!</p>
        <p className="text-xs text-muted-foreground">
          No one's left hanging — nice work.
        </p>
      </div>
    );
  }

  if (segment === "declined") {
    return (
      <div className="text-center py-10 px-4">
        <CheckCircle2 className="h-8 w-8 text-mint-foreground mx-auto mb-3" />
        <p className="text-sm font-semibold mb-1">Nobody's declined</p>
        <p className="text-xs text-muted-foreground">
          Your guest list is going strong.
        </p>
      </div>
    );
  }

  // segment === "all" with hasGuests=true means the search is empty but list is empty
  // — fallback (shouldn't happen given the hasGuests check, but covers null statuses).
  return (
    <div className="text-center py-10 px-4">
      <p className="text-sm text-muted-foreground">No guests to show.</p>
    </div>
  );
};

export default GuestListPage;
