import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Users, Plus, Search } from "lucide-react";
import { MobileLayout } from "@/components/layout/MobileLayout";
import { useActivityFeed } from "@/contexts/ActivityFeedContext";

type RSVPStatus = "attending" | "declined" | "pending";

interface Guest {
  id: number;
  name: string;
  status: RSVPStatus;
  plusOne: boolean;
  dietaryNotes?: string;
}

const initialGuests: Guest[] = [
  { id: 1, name: "Emma Thompson", status: "attending", plusOne: true },
  { id: 2, name: "Jake Wilson", status: "attending", plusOne: false },
  { id: 3, name: "Lisa Chen", status: "attending", plusOne: true },
  { id: 4, name: "Mom (Karen)", status: "attending", plusOne: false, dietaryNotes: "Gluten-free" },
  { id: 5, name: "Dad (Robert)", status: "attending", plusOne: false },
  { id: 6, name: "Aunt Susan", status: "pending", plusOne: true },
  { id: 7, name: "Rachel Green", status: "declined", plusOne: false },
  { id: 8, name: "Monica Geller", status: "attending", plusOne: true },
  { id: 9, name: "Phoebe Buffay", status: "pending", plusOne: false },
  { id: 10, name: "Joey Tribbiani", status: "pending", plusOne: true },
  { id: 11, name: "Chandler Bing", status: "attending", plusOne: true },
  { id: 12, name: "Ross Geller", status: "declined", plusOne: false },
];

const statusConfig: Record<RSVPStatus, { label: string; className: string }> = {
  attending: { label: "Attending", className: "bg-mint text-mint-foreground" },
  declined: { label: "Declined", className: "bg-destructive/10 text-destructive" },
  pending: { label: "Pending", className: "bg-warm text-warm-foreground" },
};

const GuestListPage = () => {
  const [guests, setGuests] = useState(initialGuests);
  const { addActivity } = useActivityFeed();

  const toggleStatus = (id: number, newStatus: RSVPStatus) => {
    setGuests((prev) =>
      prev.map((g) => (g.id === id ? { ...g, status: newStatus } : g))
    );
    const guest = guests.find((g) => g.id === id);
    if (guest) {
      addActivity("rsvp", `${guest.name} RSVP'd — ${newStatus}!`);
    }
  };

  const [search, setSearch] = useState("");

  const filtered = guests.filter((g) =>
    g.name.toLowerCase().includes(search.toLowerCase())
  );

  const attending = guests.filter((g) => g.status === "attending").length;
  const pending = guests.filter((g) => g.status === "pending").length;

  return (
    <MobileLayout>
      <div className="px-6 pt-12 pb-4">
        <div className="flex items-center justify-between mb-1">
          <div className="flex items-center gap-2">
            <Users className="h-5 w-5 text-primary" />
            <h1 className="text-2xl font-bold">Guest List</h1>
          </div>
          <Button size="sm" className="rounded-full h-8 gap-1">
            <Plus className="h-3.5 w-3.5" /> Add
          </Button>
        </div>
        <p className="text-sm text-muted-foreground">
          {attending} attending · {pending} pending · {guests.length} total
        </p>
      </div>

      {/* Summary Cards */}
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

      {/* Search */}
      <div className="px-6 mb-4">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search guests..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9 rounded-full bg-muted border-none"
          />
        </div>
      </div>

      {/* Guest List */}
      <div className="px-6 space-y-2 pb-6">
        {filtered.map((guest) => (
          <Card key={guest.id} className="border-none">
            <CardContent className="p-3 flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-lavender flex items-center justify-center font-bold text-sm text-lavender-foreground">
                {guest.name.split(" ").map((n) => n[0]).join("")}
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-semibold text-sm truncate">{guest.name}</p>
                <div className="flex items-center gap-1.5 mt-0.5">
                  {guest.plusOne && (
                    <span className="text-[10px] text-muted-foreground">+1</span>
                  )}
                  {guest.dietaryNotes && (
                    <span className="text-[10px] text-muted-foreground">🍽️ {guest.dietaryNotes}</span>
                  )}
                </div>
              </div>
              <Badge
                className={`${statusConfig[guest.status].className} text-[10px] border-none cursor-pointer`}
                onClick={() => {
                  const next: RSVPStatus = guest.status === "pending" ? "attending" : guest.status === "attending" ? "declined" : "pending";
                  toggleStatus(guest.id, next);
                }}
              >
                {statusConfig[guest.status].label}
              </Badge>
            </CardContent>
          </Card>
        ))}
      </div>
    </MobileLayout>
  );
};

export default GuestListPage;
