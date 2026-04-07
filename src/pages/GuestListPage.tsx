import { useState, useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Users, Plus, Search, Mail, Send, Loader2, CheckSquare, Square, SendHorizonal } from "lucide-react";
import { MobileLayout } from "@/components/layout/MobileLayout";
import { useAppMode } from "@/contexts/AppModeContext";
import { useActivityFeed } from "@/contexts/ActivityFeedContext";
import { useAuth } from "@/contexts/AuthContext";
import { useEvent } from "@/hooks/useEvent";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import GuestImportDialog from "@/components/GuestImportDialog";
import { Checkbox } from "@/components/ui/checkbox";

type RSVPStatus = "attending" | "declined" | "pending";

interface Guest {
  id: string;
  name: string;
  status: string;
  plus_one: boolean;
  dietary_notes: string | null;
  email: string | null;
  invite_sent: boolean | null;
}

const statusConfig: Record<string, { label: string; className: string }> = {
  attending: { label: "Attending", className: "bg-mint text-mint-foreground" },
  declined: { label: "Declined", className: "bg-destructive/10 text-destructive" },
  pending: { label: "Pending", className: "bg-warm text-warm-foreground" },
};

const GuestListPage = () => {
  const [guests, setGuests] = useState<Guest[]>([]);
  const [loading, setLoading] = useState(true);
  const { addActivity } = useActivityFeed();
  const { user } = useAuth();
  const { event } = useEvent();
  const { setupData } = useAppMode();
  const [search, setSearch] = useState("");
  const [sendingId, setSendingId] = useState<string | null>(null);
  const [bulkSending, setBulkSending] = useState(false);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [bulkMode, setBulkMode] = useState(false);

  // Add guest form
  const [addOpen, setAddOpen] = useState(false);
  const [newName, setNewName] = useState("");
  const [newEmail, setNewEmail] = useState("");

  const fetchGuests = async () => {
    if (!event) return;
    const { data } = await supabase
      .from("guests")
      .select("id, name, status, plus_one, dietary_notes, email, invite_sent")
      .eq("event_id", event.id)
      .order("created_at", { ascending: true });
    setGuests((data as Guest[]) || []);
    setLoading(false);
  };

  useEffect(() => {
    if (event) fetchGuests();
    else setLoading(false);
  }, [event]);

  const toggleStatus = async (id: string, newStatus: RSVPStatus) => {
    await supabase.from("guests").update({ status: newStatus }).eq("id", id);
    const guest = guests.find((g) => g.id === id);
    if (guest) addActivity("rsvp", `${guest.name} RSVP'd — ${newStatus}!`);
    fetchGuests();
  };

  const handleAdd = async () => {
    if (!event || !user || !newName.trim()) return;
    const { error } = await supabase.from("guests").insert({
      event_id: event.id,
      user_id: user.id,
      name: newName.trim(),
      email: newEmail.trim() || null,
    });
    if (error) { toast.error("Failed to add guest"); return; }
    addActivity("guest-invited", `Invited ${newName.trim()}`);
    setNewName(""); setNewEmail(""); setAddOpen(false);
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
      const honoreeName = event.honoree_name || setupData.honoreeName || "the parents-to-be";
      const eventDateStr = event.event_date
        ? new Date(event.event_date).toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric", year: "numeric" })
        : "a date to be announced";
      const location = event.city || "";

      const { data: codes } = await supabase.from("invite_codes").select("code").eq("event_id", event.id).limit(1);
      let rsvpCode = codes?.[0]?.code;
      if (!rsvpCode && user) {
        rsvpCode = Math.random().toString(36).substring(2, 8).toUpperCase();
        await supabase.from("invite_codes").insert({ event_id: event.id, created_by: user.id, code: rsvpCode });
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

      await supabase.from("guests").update({ invite_sent: true, invite_sent_at: new Date().toISOString() }).eq("id", guest.id);
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
        if (ok) { toast.success(`Invite sent to ${guest.name}!`); fetchGuests(); }
        else toast.error("Failed to send invite.");
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

  const filtered = guests.filter((g) => g.name.toLowerCase().includes(search.toLowerCase()));
  const eligibleForBulk = filtered.filter((g) => g.email);

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

  const filtered = guests.filter((g) => g.name.toLowerCase().includes(search.toLowerCase()));
  const attending = guests.filter((g) => g.status === "attending").length;
  const pending = guests.filter((g) => g.status === "pending").length;
  const selectedCount = selectedIds.size;
  const selectedWithEmail = guests.filter((g) => selectedIds.has(g.id) && g.email).length;

  if (loading) {
    return (
      <MobileLayout>
        <div className="flex items-center justify-center min-h-[60vh]">
          <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full" />
        </div>
      </MobileLayout>
    );
  }

  return (
    <MobileLayout>
      <div className="px-6 pt-12 pb-4">
        <div className="flex items-center justify-between mb-1">
          <div className="flex items-center gap-2">
            <Users className="h-5 w-5 text-primary" />
            <h1 className="text-2xl font-bold">Guest List</h1>
          </div>
          <div className="flex items-center gap-2">
            {event && user && <GuestImportDialog eventId={event.id} userId={user.id} onImported={fetchGuests} />}
            <Dialog open={addOpen} onOpenChange={setAddOpen}>
              <DialogTrigger asChild>
              <Button size="sm" className="rounded-full h-8 gap-1"><Plus className="h-3.5 w-3.5" /> Add</Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader><DialogTitle>Add Guest</DialogTitle></DialogHeader>
              <div className="space-y-4">
                <div className="space-y-1.5">
                  <Label>Name</Label>
                  <Input placeholder="e.g. Emma Thompson" value={newName} onChange={(e) => setNewName(e.target.value)} />
                </div>
                <div className="space-y-1.5">
                  <Label>Email (optional)</Label>
                  <Input type="email" placeholder="emma@example.com" value={newEmail} onChange={(e) => setNewEmail(e.target.value)} />
                </div>
                <Button className="w-full" onClick={handleAdd} disabled={!newName.trim()}>Add Guest</Button>
              </div>
            </DialogContent>
          </Dialog>
          </div>
        </div>
        <p className="text-sm text-muted-foreground">{attending} attending · {pending} pending · {guests.length} total</p>
      </div>

      <div className="px-6 grid grid-cols-3 gap-2 mb-4">
        {[
          { label: "Attending", count: attending, bg: "bg-mint/50" },
          { label: "Pending", count: pending, bg: "bg-warm/50" },
          { label: "Declined", count: guests.filter((g) => g.status === "declined").length, bg: "bg-destructive/10" },
        ].map((s) => (
          <div key={s.label} className={`${s.bg} rounded-xl p-3 text-center`}>
            <p className="text-xl font-bold">{s.count}</p>
            <p className="text-[10px] text-muted-foreground font-medium">{s.label}</p>
          </div>
        ))}
      </div>

      <div className="px-6 mb-4 space-y-2">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input placeholder="Search guests..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-9 rounded-full bg-muted border-none" />
        </div>

        {/* Bulk send toolbar */}
        <div className="flex items-center justify-between">
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

          {bulkMode && (
            <div className="flex items-center gap-2">
              <Button variant="ghost" size="sm" className="h-7 text-xs" onClick={selectedCount === eligibleForBulk.length ? selectNone : selectAll}>
                {selectedCount === eligibleForBulk.length ? "Deselect All" : "Select All"}
              </Button>
              <Button
                size="sm"
                className="h-8 gap-1.5"
                disabled={selectedWithEmail === 0 || bulkSending}
                onClick={handleBulkSend}
              >
                {bulkSending ? (
                  <><Loader2 className="h-3.5 w-3.5 animate-spin" /> Sending...</>
                ) : (
                  <><Send className="h-3.5 w-3.5" /> Send ({selectedWithEmail})</>
                )}
              </Button>
            </div>
          )}
        </div>
      </div>

      <div className="px-6 pb-6 grid grid-cols-1 md:grid-cols-2 gap-2">
        {filtered.length === 0 && (
          <p className="text-sm text-muted-foreground text-center col-span-full py-8">No guests yet — tap "Add" to invite someone!</p>
        )}
        {filtered.map((guest) => (
          <Card key={guest.id} className="border-none">
            <CardContent className="p-3 flex items-center gap-3">
              {bulkMode && (
                <Checkbox
                  checked={selectedIds.has(guest.id)}
                  onCheckedChange={() => toggleSelect(guest.id)}
                  disabled={!guest.email}
                  className="shrink-0"
                />
              )}
              <div className="w-10 h-10 rounded-full bg-lavender flex items-center justify-center font-bold text-sm text-lavender-foreground">
                {guest.name.split(" ").map((n) => n[0]).join("")}
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-semibold text-sm truncate">{guest.name}</p>
                <div className="flex items-center gap-1.5 mt-0.5">
                  {guest.invite_sent && <span className="text-[10px] text-muted-foreground">✉️ Sent</span>}
                  {guest.plus_one && <span className="text-[10px] text-muted-foreground">+1</span>}
                  {guest.dietary_notes && <span className="text-[10px] text-muted-foreground">🍽️ {guest.dietary_notes}</span>}
                </div>
              </div>
              <div className="flex items-center gap-1.5">
                {!bulkMode && guest.email && (
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-7 w-7"
                    onClick={() => sendInvite(guest)}
                    disabled={sendingId === guest.id}
                    title={guest.invite_sent ? "Resend invite" : "Send invite"}
                  >
                    {sendingId === guest.id ? (
                      <Loader2 className="h-3.5 w-3.5 animate-spin text-primary" />
                    ) : guest.invite_sent ? (
                      <Mail className="h-3.5 w-3.5 text-muted-foreground" />
                    ) : (
                      <Send className="h-3.5 w-3.5 text-primary" />
                    )}
                  </Button>
                )}
                <Badge
                  className={`${(statusConfig[guest.status] || statusConfig.pending).className} text-[10px] border-none cursor-pointer`}
                  onClick={() => {
                    const next: RSVPStatus = guest.status === "pending" ? "attending" : guest.status === "attending" ? "declined" : "pending";
                    toggleStatus(guest.id, next);
                  }}
                >
                  {(statusConfig[guest.status] || statusConfig.pending).label}
                </Badge>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Resend confirmation dialog */}
      <Dialog open={!!confirmResend} onOpenChange={(open) => !open && setConfirmResend(null)}>
        <DialogContent className="max-w-xs">
          <DialogHeader><DialogTitle>Resend Invite?</DialogTitle></DialogHeader>
          <p className="text-sm text-muted-foreground">
            An invite was already sent to <span className="font-semibold">{confirmResend?.name}</span>. Send again?
          </p>
          <div className="flex gap-2 justify-end">
            <Button variant="outline" size="sm" onClick={() => setConfirmResend(null)}>Cancel</Button>
            <Button size="sm" onClick={() => {
              if (confirmResend) {
                doSendInvite(confirmResend).then((ok) => {
                  if (ok) { toast.success(`Invite resent to ${confirmResend.name}!`); fetchGuests(); }
                  else toast.error("Failed to resend invite.");
                });
                setConfirmResend(null);
              }
            }}>
              Resend
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Bulk resend confirmation dialog */}
      <Dialog open={confirmBulk} onOpenChange={setConfirmBulk}>
        <DialogContent className="max-w-xs">
          <DialogHeader><DialogTitle>Send Invites?</DialogTitle></DialogHeader>
          <p className="text-sm text-muted-foreground">
            Some selected guests have already received invites. This will resend to those guests as well. Continue?
          </p>
          <div className="flex gap-2 justify-end">
            <Button variant="outline" size="sm" onClick={() => setConfirmBulk(false)}>Cancel</Button>
            <Button size="sm" onClick={() => {
              setConfirmBulk(false);
              const toSend = guests.filter((g) => selectedIds.has(g.id) && g.email);
              executeBulkSend(toSend);
            }}>
              Send All
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </MobileLayout>
  );
};

export default GuestListPage;
