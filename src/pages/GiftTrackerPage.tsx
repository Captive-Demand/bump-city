import { useState, useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { MobileLayout } from "@/components/layout/MobileLayout";
import { PageLoader } from "@/components/PageLoader";
import { useAuth } from "@/contexts/AuthContext";
import { useEvent } from "@/hooks/useEvent";
import { supabase } from "@/integrations/supabase/client";
import {
  Gift,
  Plus,
  Check,
  Search,
  ChevronLeft,
  ShoppingBag,
  MoreHorizontal,
  Pencil,
  Trash2,
  Mail,
  PartyPopper,
  Inbox,
} from "lucide-react";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useNavigate } from "react-router-dom";

interface GiftReceived {
  id: string;
  donor_name: string;
  item_description: string;
  thank_you_sent: boolean;
  created_at: string;
}

interface ClaimedItem {
  id: string;
  name: string;
  price: number | null;
  claimed_by: string | null;
  image_url: string | null;
}

type Filter = "all" | "pending" | "sent";

const GiftTrackerPage = () => {
  const { user } = useAuth();
  const { event } = useEvent();
  const navigate = useNavigate();
  const [gifts, setGifts] = useState<GiftReceived[]>([]);
  const [claimed, setClaimed] = useState<ClaimedItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState<Filter>("all");

  // Add/edit dialog. When editingId is set, the dialog updates that row
  // instead of inserting; we reuse the same form to keep the surface small.
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [donorInput, setDonorInput] = useState("");
  const [itemInput, setItemInput] = useState("");

  const fetchGifts = async () => {
    if (!event) return;
    const [{ data: g }, { data: c }] = await Promise.all([
      supabase
        .from("gifts_received")
        .select("*")
        .eq("event_id", event.id)
        .order("created_at", { ascending: false }),
      supabase
        .from("registry_items")
        .select("id, name, price, claimed_by, image_url")
        .eq("event_id", event.id)
        .eq("claimed", true),
    ]);
    setGifts((g as GiftReceived[]) || []);
    setClaimed((c as ClaimedItem[]) || []);
    setLoading(false);
  };

  useEffect(() => {
    if (event) fetchGifts();
    else setLoading(false);
  }, [event]);

  const openAdd = () => {
    setEditingId(null);
    setDonorInput("");
    setItemInput("");
    setDialogOpen(true);
  };

  const openEdit = (gift: GiftReceived) => {
    setEditingId(gift.id);
    setDonorInput(gift.donor_name);
    setItemInput(gift.item_description);
    setDialogOpen(true);
  };

  const handleSave = async () => {
    if (!event || !user || !donorInput.trim() || !itemInput.trim()) return;
    if (editingId) {
      const { error } = await supabase
        .from("gifts_received")
        .update({
          donor_name: donorInput.trim(),
          item_description: itemInput.trim(),
        })
        .eq("id", editingId);
      if (error) {
        toast.error("Failed to update gift");
        return;
      }
      toast.success("Gift updated");
    } else {
      const { error } = await supabase.from("gifts_received").insert({
        event_id: event.id,
        user_id: user.id,
        donor_name: donorInput.trim(),
        item_description: itemInput.trim(),
      });
      if (error) {
        toast.error("Failed to add gift");
        return;
      }
    }
    setDonorInput("");
    setItemInput("");
    setEditingId(null);
    setDialogOpen(false);
    fetchGifts();
  };

  const handleDelete = async (gift: GiftReceived) => {
    const { error } = await supabase
      .from("gifts_received")
      .delete()
      .eq("id", gift.id);
    if (error) {
      toast.error("Failed to delete gift");
      return;
    }
    toast.success(`Gift from ${gift.donor_name} removed`);
    fetchGifts();
  };

  const toggleThankYou = async (id: string, current: boolean) => {
    await supabase
      .from("gifts_received")
      .update({ thank_you_sent: !current })
      .eq("id", id);
    fetchGifts();
  };

  // When a registry item was claimed anonymously, both the display label and
  // the eventual donor_name use the same "Anonymous" fallback so logged gifts
  // don't read "From Registry guest" while the registry card said "a guest".
  const effectiveDonor = (claimedBy: string | null | undefined): string =>
    claimedBy?.trim() || "Anonymous";

  const logClaimedItem = async (item: ClaimedItem) => {
    if (!event || !user) return;
    const { error } = await supabase.from("gifts_received").insert({
      event_id: event.id,
      user_id: user.id,
      donor_name: effectiveDonor(item.claimed_by),
      item_description: item.name,
    });
    if (error) {
      toast.error("Failed to log gift");
      return;
    }
    toast.success("Gift logged");
    fetchGifts();
  };

  const filtered = gifts.filter((g) => {
    if (filter === "pending" && g.thank_you_sent) return false;
    if (filter === "sent" && !g.thank_you_sent) return false;
    return (
      g.donor_name.toLowerCase().includes(search.toLowerCase()) ||
      g.item_description.toLowerCase().includes(search.toLowerCase())
    );
  });

  // Claimed registry items not yet logged as a received gift, matched on
  // (item description, donor) — case-insensitive.
  const loggedKeys = new Set(
    gifts.map(
      (g) => `${g.item_description.toLowerCase()}::${g.donor_name.toLowerCase()}`
    )
  );
  const unloggedClaimed = claimed.filter(
    (c) =>
      !loggedKeys.has(
        `${c.name.toLowerCase()}::${effectiveDonor(c.claimed_by).toLowerCase()}`
      )
  );

  const pendingCount = gifts.filter((g) => !g.thank_you_sent).length;
  const sentCount = gifts.filter((g) => g.thank_you_sent).length;
  const totalValue = claimed.reduce(
    (sum, c) => sum + (Number(c.price) || 0),
    0
  );

  if (loading)
    return (
      <MobileLayout>
        <PageLoader />
      </MobileLayout>
    );

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
          <div className="flex items-center gap-2">
            <Gift className="h-5 w-5 text-primary" />
            <h1 className="text-2xl font-bold">Gift Tracker</h1>
          </div>
          <Dialog
            open={dialogOpen}
            onOpenChange={(open) => {
              setDialogOpen(open);
              if (!open) {
                setEditingId(null);
                setDonorInput("");
                setItemInput("");
              }
            }}
          >
            <DialogTrigger asChild>
              <Button
                size="sm"
                className="rounded-full h-8 gap-1"
                onClick={openAdd}
              >
                <Plus className="h-3.5 w-3.5" /> Log
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>{editingId ? "Edit Gift" : "Log a Gift"}</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <div className="space-y-1.5">
                  <Label>From</Label>
                  <Input
                    placeholder="e.g. Aunt Susan"
                    value={donorInput}
                    onChange={(e) => setDonorInput(e.target.value)}
                  />
                </div>
                <div className="space-y-1.5">
                  <Label>Gift</Label>
                  <Input
                    placeholder="e.g. Baby blanket set"
                    value={itemInput}
                    onChange={(e) => setItemInput(e.target.value)}
                  />
                </div>
                <Button
                  className="w-full"
                  onClick={handleSave}
                  disabled={!donorInput.trim() || !itemInput.trim()}
                >
                  {editingId ? "Save changes" : "Add Gift"}
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>
        <p className="text-sm text-muted-foreground">
          {gifts.length} gift{gifts.length === 1 ? "" : "s"} ·{" "}
          {pendingCount} thank-you note{pendingCount === 1 ? "" : "s"} pending
        </p>
      </div>

      {/* Stats row */}
      <div className="px-6 grid grid-cols-2 md:grid-cols-4 gap-2 mb-4">
        {[
          { label: "Items Claimed", value: claimed.length, bg: "bg-primary/10" },
          {
            label: "Est. Value",
            value: `$${totalValue.toFixed(0)}`,
            bg: "bg-mint/40",
          },
          { label: "Thanks Pending", value: pendingCount, bg: "bg-warm/50" },
          { label: "Thanks Sent", value: sentCount, bg: "bg-lavender/50" },
        ].map((s) => (
          <div key={s.label} className={`${s.bg} rounded-2xl p-3 text-center`}>
            <p className="text-lg font-bold">{s.value}</p>
            <p className="text-[10px] text-muted-foreground font-medium">
              {s.label}
            </p>
          </div>
        ))}
      </div>

      <div className="px-6 flex gap-2 mb-4">
        {(["all", "pending", "sent"] as const).map((f) => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`px-3 py-1.5 rounded-full text-xs font-semibold capitalize transition-all ${
              filter === f
                ? "bg-primary text-primary-foreground"
                : "bg-muted text-muted-foreground"
            }`}
          >
            {f === "all" ? "All" : f === "pending" ? "Needs Thank You" : "Sent"}
          </button>
        ))}
      </div>

      <div className="px-6 mb-4">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search gifts..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9 rounded-full bg-muted border-none"
          />
        </div>
      </div>

      <div className="px-6 pb-6 space-y-4">
        {/* Registry-claimed items not yet logged. Hidden when filter is "sent"
            since those rows have nothing to do with thank-you status. */}
        {unloggedClaimed.length > 0 && filter !== "sent" && (
          <div className="space-y-2">
            <div className="flex items-center gap-1.5 text-xs font-semibold text-muted-foreground uppercase tracking-wide">
              <ShoppingBag className="h-3.5 w-3.5" />
              From the Registry
            </div>
            {unloggedClaimed.map((item) => (
              <Card
                key={item.id}
                className="border-dashed border border-primary/30 bg-primary/5 overflow-hidden"
              >
                <CardContent className="p-3 flex items-center gap-3">
                  {item.image_url ? (
                    <img
                      src={item.image_url}
                      alt={item.name}
                      className="w-10 h-10 shrink-0 rounded-full object-cover"
                    />
                  ) : (
                    <div className="w-10 h-10 shrink-0 rounded-full bg-primary/15 flex items-center justify-center">
                      <Gift className="h-5 w-5 text-primary" />
                    </div>
                  )}
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-sm truncate">{item.name}</p>
                    <p className="text-xs text-muted-foreground truncate">
                      Claimed by {effectiveDonor(item.claimed_by)}
                      {item.price ? ` · $${Number(item.price).toFixed(0)}` : ""}
                    </p>
                  </div>
                  <Button
                    size="sm"
                    variant="outline"
                    className="shrink-0 rounded-full text-xs h-8 gap-1 px-3"
                    onClick={() => logClaimedItem(item)}
                  >
                    <Plus className="h-3 w-3" /> Log
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        <div className="space-y-2">
          {filtered.length === 0 && (
            <FilterEmptyState
              filter={filter}
              hasGifts={gifts.length > 0}
              hasUnlogged={unloggedClaimed.length > 0}
              search={search}
              pendingCount={pendingCount}
              sentCount={sentCount}
              onClearSearch={() => setSearch("")}
              onJumpToPending={() => setFilter("pending")}
              onAdd={openAdd}
            />
          )}
          {filtered.map((gift) => (
            <Card key={gift.id} className="border-none overflow-hidden">
              <CardContent className="p-3 flex items-center gap-3">
                <div className="w-10 h-10 shrink-0 rounded-full bg-peach flex items-center justify-center">
                  <Gift className="h-5 w-5 text-foreground/70" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-sm truncate">
                    {gift.item_description}
                  </p>
                  <p className="text-xs text-muted-foreground truncate">
                    From {gift.donor_name} · Logged{" "}
                    {new Date(gift.created_at).toLocaleDateString("en-US", {
                      month: "short",
                      day: "numeric",
                    })}
                  </p>
                </div>
                <Button
                  size="sm"
                  variant={gift.thank_you_sent ? "secondary" : "default"}
                  className="shrink-0 rounded-full text-xs h-8 gap-1 px-3"
                  onClick={() => toggleThankYou(gift.id, gift.thank_you_sent)}
                  title={
                    gift.thank_you_sent
                      ? "Tap to mark as not sent"
                      : "Tap to mark thank-you as sent"
                  }
                >
                  <Check className="h-3 w-3" />
                  {gift.thank_you_sent ? "Sent" : "Thank"}
                </Button>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 shrink-0"
                      aria-label="More actions"
                    >
                      <MoreHorizontal className="h-4 w-4 text-muted-foreground" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem
                      onSelect={() => openEdit(gift)}
                      className="gap-2"
                    >
                      <Pencil className="h-3.5 w-3.5" /> Edit
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem
                      onSelect={() => handleDelete(gift)}
                      className="gap-2 text-destructive focus:text-destructive"
                    >
                      <Trash2 className="h-3.5 w-3.5" /> Delete
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </MobileLayout>
  );
};

const FilterEmptyState = ({
  filter,
  hasGifts,
  hasUnlogged,
  search,
  pendingCount,
  sentCount,
  onClearSearch,
  onJumpToPending,
  onAdd,
}: {
  filter: Filter;
  hasGifts: boolean;
  hasUnlogged: boolean;
  search: string;
  pendingCount: number;
  sentCount: number;
  onClearSearch: () => void;
  onJumpToPending: () => void;
  onAdd: () => void;
}) => {
  // Search has priority — "no matches" is a clearer signal than the segment
  // empty state when both apply.
  if (search.trim()) {
    return (
      <div className="text-center py-10 px-4">
        <p className="text-sm text-muted-foreground mb-3">
          No gifts match "{search}".
        </p>
        <Button variant="outline" size="sm" onClick={onClearSearch}>
          Clear search
        </Button>
      </div>
    );
  }

  // No gifts at all + no claimed-but-unlogged registry items either.
  if (!hasGifts && !hasUnlogged) {
    return (
      <div className="text-center py-10 px-4">
        <Inbox className="h-8 w-8 text-muted-foreground/60 mx-auto mb-3" />
        <p className="text-sm font-semibold mb-1">No gifts yet</p>
        <p className="text-xs text-muted-foreground mb-4">
          Log a gift you received to start tracking thank-you notes.
        </p>
        <Button size="sm" onClick={onAdd} className="gap-1">
          <Plus className="h-3.5 w-3.5" /> Log a gift
        </Button>
      </div>
    );
  }

  if (filter === "pending") {
    return (
      <div className="text-center py-10 px-4">
        <PartyPopper className="h-8 w-8 text-mint-foreground mx-auto mb-3" />
        <p className="text-sm font-semibold mb-1">All thanks sent!</p>
        <p className="text-xs text-muted-foreground">
          {sentCount > 0
            ? `Nice work — ${sentCount} thank-you note${sentCount === 1 ? "" : "s"} delivered.`
            : "Nothing waiting — keep the momentum going."}
        </p>
      </div>
    );
  }

  if (filter === "sent") {
    return (
      <div className="text-center py-10 px-4">
        <Mail className="h-8 w-8 text-muted-foreground/60 mx-auto mb-3" />
        <p className="text-sm font-semibold mb-1">No thank-yous sent yet</p>
        <p className="text-xs text-muted-foreground mb-4">
          {pendingCount > 0
            ? `${pendingCount} note${pendingCount === 1 ? "" : "s"} waiting to be sent.`
            : "Once you mark gifts as thanked, they'll show up here."}
        </p>
        {pendingCount > 0 && (
          <Button size="sm" variant="outline" onClick={onJumpToPending}>
            See pending thank-yous
          </Button>
        )}
      </div>
    );
  }

  // segment === "all" but list empty (shouldn't normally happen given the
  // hasGifts check above; covers the registry-only case).
  return (
    <div className="text-center py-10 px-4">
      <p className="text-sm text-muted-foreground">
        Nothing to show — log your first gift above.
      </p>
    </div>
  );
};

export default GiftTrackerPage;
