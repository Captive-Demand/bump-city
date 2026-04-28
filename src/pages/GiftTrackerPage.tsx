import { useState, useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { MobileLayout } from "@/components/layout/MobileLayout";
import { useAuth } from "@/contexts/AuthContext";
import { useEvent } from "@/hooks/useEvent";
import { supabase } from "@/integrations/supabase/client";
import { Gift, Plus, Check, Search, ChevronLeft, ShoppingBag } from "lucide-react";
import { toast } from "sonner";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { useNavigate } from "react-router-dom";

interface GiftReceived {
  id: string;
  donor_name: string;
  item_description: string;
  thank_you_sent: boolean;
  created_at: string;
}

interface ClaimedItem { id: string; name: string; price: number | null; claimed_by: string | null; image_url: string | null; }

const GiftTrackerPage = () => {
  const { user } = useAuth();
  const { event } = useEvent();
  const navigate = useNavigate();
  const [gifts, setGifts] = useState<GiftReceived[]>([]);
  const [claimed, setClaimed] = useState<ClaimedItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [addOpen, setAddOpen] = useState(false);
  const [newDonor, setNewDonor] = useState("");
  const [newItem, setNewItem] = useState("");
  const [filter, setFilter] = useState<"all" | "pending" | "sent">("all");

  const fetchGifts = async () => {
    if (!event) return;
    const [{ data: g }, { data: c }] = await Promise.all([
      supabase.from("gifts_received").select("*").eq("event_id", event.id).order("created_at", { ascending: false }),
      supabase.from("registry_items").select("id, name, price, claimed_by, image_url").eq("event_id", event.id).eq("claimed", true),
    ]);
    setGifts((g as GiftReceived[]) || []);
    setClaimed((c as ClaimedItem[]) || []);
    setLoading(false);
  };

  useEffect(() => { if (event) fetchGifts(); else setLoading(false); }, [event]);

  const handleAdd = async () => {
    if (!event || !user || !newDonor.trim() || !newItem.trim()) return;
    const { error } = await supabase.from("gifts_received").insert({ event_id: event.id, user_id: user.id, donor_name: newDonor.trim(), item_description: newItem.trim() });
    if (error) { toast.error("Failed to add gift"); return; }
    setNewDonor(""); setNewItem(""); setAddOpen(false);
    fetchGifts();
  };

  const toggleThankYou = async (id: string, current: boolean) => {
    await supabase.from("gifts_received").update({ thank_you_sent: !current }).eq("id", id);
    fetchGifts();
  };

  const logClaimedItem = async (item: ClaimedItem) => {
    if (!event || !user) return;
    const { error } = await supabase.from("gifts_received").insert({
      event_id: event.id,
      user_id: user.id,
      donor_name: item.claimed_by || "Registry guest",
      item_description: item.name,
    });
    if (error) { toast.error("Failed to log gift"); return; }
    toast.success("Gift logged");
    fetchGifts();
  };

  const filtered = gifts.filter((g) => {
    if (filter === "pending" && g.thank_you_sent) return false;
    if (filter === "sent" && !g.thank_you_sent) return false;
    return g.donor_name.toLowerCase().includes(search.toLowerCase()) || g.item_description.toLowerCase().includes(search.toLowerCase());
  });

  // Claimed registry items not yet logged as a received gift (matched on item description + donor name)
  const loggedKeys = new Set(
    gifts.map((g) => `${g.item_description.toLowerCase()}::${g.donor_name.toLowerCase()}`)
  );
  const unloggedClaimed = claimed.filter(
    (c) => !loggedKeys.has(`${c.name.toLowerCase()}::${(c.claimed_by || "registry guest").toLowerCase()}`)
  );

  const pendingCount = gifts.filter((g) => !g.thank_you_sent).length;
  const sentCount = gifts.filter((g) => g.thank_you_sent).length;
  const totalValue = claimed.reduce((sum, c) => sum + (Number(c.price) || 0), 0);


  if (loading) return <MobileLayout><div className="flex items-center justify-center min-h-[60vh]"><div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full" /></div></MobileLayout>;

  return (
    <MobileLayout>
      <div className="px-6 pt-8 pb-4">
        <button
          onClick={() => navigate("/")}
          className="flex items-center gap-1 text-sm text-muted-foreground mb-4 hover:text-foreground"
        >
          <ChevronLeft className="h-4 w-4" /> Home
        </button>
        <div className="flex items-center justify-between mb-1">
          <div className="flex items-center gap-2"><Gift className="h-5 w-5 text-primary" /><h1 className="text-2xl font-bold">Gift Tracker</h1></div>
          <Dialog open={addOpen} onOpenChange={setAddOpen}>
            <DialogTrigger asChild><Button size="sm" className="rounded-full h-8 gap-1"><Plus className="h-3.5 w-3.5" /> Log</Button></DialogTrigger>
            <DialogContent>
              <DialogHeader><DialogTitle>Log a Gift</DialogTitle></DialogHeader>
              <div className="space-y-4">
                <div className="space-y-1.5"><Label>From</Label><Input placeholder="e.g. Aunt Susan" value={newDonor} onChange={(e) => setNewDonor(e.target.value)} /></div>
                <div className="space-y-1.5"><Label>Gift</Label><Input placeholder="e.g. Baby blanket set" value={newItem} onChange={(e) => setNewItem(e.target.value)} /></div>
                <Button className="w-full" onClick={handleAdd} disabled={!newDonor.trim() || !newItem.trim()}>Add Gift</Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>
        <p className="text-sm text-muted-foreground">{gifts.length} gifts · {pendingCount} thank-you notes pending</p>
      </div>

      {/* Stats row */}
      <div className="px-6 grid grid-cols-2 md:grid-cols-4 gap-2 mb-4">
        {[
          { label: "Items Claimed", value: claimed.length, bg: "bg-primary/10" },
          { label: "Est. Value", value: `$${totalValue.toFixed(0)}`, bg: "bg-mint/40" },
          { label: "Thanks Pending", value: pendingCount, bg: "bg-warm/50" },
          { label: "Thanks Sent", value: sentCount, bg: "bg-lavender/50" },
        ].map((s) => (
          <div key={s.label} className={`${s.bg} rounded-2xl p-3 text-center`}>
            <p className="text-lg font-bold">{s.value}</p>
            <p className="text-[10px] text-muted-foreground font-medium">{s.label}</p>
          </div>
        ))}
      </div>

      <div className="px-6 flex gap-2 mb-4">
        {(["all", "pending", "sent"] as const).map((f) => (
          <button key={f} onClick={() => setFilter(f)} className={`px-3 py-1.5 rounded-full text-xs font-semibold capitalize transition-all ${filter === f ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"}`}>{f === "all" ? "All" : f === "pending" ? "Needs Thank You" : "Sent"}</button>
        ))}
      </div>

      <div className="px-6 mb-4">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input placeholder="Search gifts..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-9 rounded-full bg-muted border-none" />
        </div>
      </div>

      <div className="px-6 pb-6 space-y-4">
        {unloggedClaimed.length > 0 && filter !== "sent" && (
          <div className="space-y-2">
            <div className="flex items-center gap-1.5 text-xs font-semibold text-muted-foreground uppercase tracking-wide">
              <ShoppingBag className="h-3.5 w-3.5" />
              From the Registry
            </div>
            {unloggedClaimed.map((item) => (
              <Card key={item.id} className="border-dashed border border-primary/30 bg-primary/5 overflow-hidden">
                <CardContent className="p-3 flex items-center gap-3">
                  {item.image_url ? (
                    <img src={item.image_url} alt={item.name} className="w-10 h-10 shrink-0 rounded-full object-cover" />
                  ) : (
                    <div className="w-10 h-10 shrink-0 rounded-full bg-primary/15 flex items-center justify-center text-lg">🎁</div>
                  )}
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-sm truncate">{item.name}</p>
                    <p className="text-xs text-muted-foreground truncate">
                      Claimed by {item.claimed_by || "a guest"}
                      {item.price ? ` · $${Number(item.price).toFixed(0)}` : ""}
                    </p>
                  </div>
                  <Button size="sm" variant="outline" className="shrink-0 rounded-full text-xs h-8 gap-1 px-3" onClick={() => logClaimedItem(item)}>
                    <Plus className="h-3 w-3" /> Log
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        <div className="space-y-2">
          {filtered.length === 0 && unloggedClaimed.length === 0 && <p className="text-sm text-muted-foreground text-center py-8">No gifts logged yet</p>}
          {filtered.map((gift) => (
            <Card key={gift.id} className="border-none overflow-hidden">
              <CardContent className="p-3 flex items-center gap-3">
                <div className="w-10 h-10 shrink-0 rounded-full bg-peach flex items-center justify-center text-lg">🎁</div>
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-sm truncate">{gift.item_description}</p>
                  <p className="text-xs text-muted-foreground truncate">From {gift.donor_name}</p>
                </div>
                <Button size="sm" variant={gift.thank_you_sent ? "secondary" : "default"} className="shrink-0 rounded-full text-xs h-8 gap-1 px-3" onClick={() => toggleThankYou(gift.id, gift.thank_you_sent)}>
                  <Check className="h-3 w-3" /> {gift.thank_you_sent ? "Sent" : "Thank"}
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </MobileLayout>
  );
};

export default GiftTrackerPage;
