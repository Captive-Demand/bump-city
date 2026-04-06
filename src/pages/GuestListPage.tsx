import { useState, useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Users, Plus, Search, Mail, Send } from "lucide-react";
import { MobileLayout } from "@/components/layout/MobileLayout";
import { useAppMode } from "@/contexts/AppModeContext";
import { useActivityFeed } from "@/contexts/ActivityFeedContext";
import { useAuth } from "@/contexts/AuthContext";
import { useEvent } from "@/hooks/useEvent";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";

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

  const sendInvite = async (guest: Guest) => {
    if (!guest.email) {
      toast.error("No email address for this guest");
      return;
    }
    const honoreeName = setupData.honoreeName || "the parents-to-be";
    const eventDate = setupData.eventDate
      ? setupData.eventDate.toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric", year: "numeric" })
      : "a date to be announced";
    const subject = encodeURIComponent(`You're Invited to ${honoreeName}'s Baby Shower! 🎉`);
    const body = encodeURIComponent(
      `Hi ${guest.name},\n\nYou're invited to ${honoreeName}'s baby shower on ${eventDate}!\n\nWe'd love for you to join us in celebrating this special occasion.\n\nPlease let us know if you can make it!\n\nWith love,\nThe Bump City Team`
    );
    window.open(`mailto:${guest.email}?subject=${subject}&body=${body}`, "_blank");

    await supabase.from("guests").update({ invite_sent: true, invite_sent_at: new Date().toISOString() }).eq("id", guest.id);
    addActivity("invite-sent", `Invite sent to ${guest.name}`);
    toast.success(`Invite opened for ${guest.name}`);
    fetchGuests();
  };

  const filtered = guests.filter((g) => g.name.toLowerCase().includes(search.toLowerCase()));
  const attending = guests.filter((g) => g.status === "attending").length;
  const pending = guests.filter((g) => g.status === "pending").length;

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

      <div className="px-6 mb-4">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input placeholder="Search guests..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-9 rounded-full bg-muted border-none" />
        </div>
      </div>

      <div className="px-6 pb-6 grid grid-cols-1 md:grid-cols-2 gap-2">
        {filtered.length === 0 && (
          <p className="text-sm text-muted-foreground text-center col-span-full py-8">No guests yet — tap "Add" to invite someone!</p>
        )}
        {filtered.map((guest) => (
          <Card key={guest.id} className="border-none">
            <CardContent className="p-3 flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-lavender flex items-center justify-center font-bold text-sm text-lavender-foreground">
                {guest.name.split(" ").map((n) => n[0]).join("")}
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-semibold text-sm truncate">{guest.name}</p>
                <div className="flex items-center gap-1.5 mt-0.5">
                  {guest.plus_one && <span className="text-[10px] text-muted-foreground">+1</span>}
                  {guest.dietary_notes && <span className="text-[10px] text-muted-foreground">🍽️ {guest.dietary_notes}</span>}
                </div>
              </div>
              <div className="flex items-center gap-1.5">
                {guest.email && !guest.invite_sent && (
                  <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => sendInvite(guest)} title="Send invite">
                    <Send className="h-3.5 w-3.5 text-primary" />
                  </Button>
                )}
                {guest.invite_sent && (
                  <span title="Invite sent"><Mail className="h-3.5 w-3.5 text-muted-foreground" /></span>
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
    </MobileLayout>
  );
};

export default GuestListPage;
