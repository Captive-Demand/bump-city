import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { User, Bell, Palette, Share2, LogOut, ChevronRight, Baby, Gift, PackageOpen, CalendarIcon, Pencil, Check } from "lucide-react";
import { MobileLayout } from "@/components/layout/MobileLayout";
import { useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { useEvent } from "@/hooks/useEvent";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { cn } from "@/lib/utils";
import { format } from "date-fns";
import { toast } from "sonner";
import ShareInviteButton from "@/components/ShareInviteButton";

const ProfilePage = () => {
  const { user, signOut } = useAuth();
  const { event, refetch } = useEvent();
  const navigate = useNavigate();
  const [giftPref, setGiftPref] = useState(event?.gift_policy || "bring-gift");
  const [clearWrap, setClearWrap] = useState(event?.clear_wrapping || false);
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);

  // Editable fields
  const [honoreeName, setHonoreeName] = useState(event?.honoree_name || "");
  const [dueDate, setDueDate] = useState<Date | undefined>(event?.due_date ? new Date(event.due_date) : undefined);
  const [eventDate, setEventDate] = useState<Date | undefined>(event?.event_date ? new Date(event.event_date) : undefined);
  const [city, setCity] = useState(event?.city || "");
  const [theme, setTheme] = useState(event?.theme || "");

  const displayName = user?.user_metadata?.display_name || user?.email || "User";
  const initial = displayName.charAt(0).toUpperCase();

  const handleSignOut = async () => {
    await signOut();
    navigate("/auth");
  };

  const startEditing = () => {
    setHonoreeName(event?.honoree_name || "");
    setDueDate(event?.due_date ? new Date(event.due_date) : undefined);
    setEventDate(event?.event_date ? new Date(event.event_date) : undefined);
    setCity(event?.city || "");
    setTheme(event?.theme || "");
    setEditing(true);
  };

  const saveDetails = async () => {
    if (!event) return;
    setSaving(true);
    const { error } = await supabase.from("events").update({
      honoree_name: honoreeName.trim() || null,
      due_date: dueDate ? format(dueDate, "yyyy-MM-dd") : null,
      event_date: eventDate ? format(eventDate, "yyyy-MM-dd") : null,
      city: city.trim() || null,
      theme: theme.trim() || null,
    }).eq("id", event.id);
    setSaving(false);
    if (error) {
      toast.error("Failed to save changes");
      return;
    }
    toast.success("Event details updated!");
    setEditing(false);
    refetch();
  };

  const saveGiftPrefs = async (newPolicy?: string, newClearWrap?: boolean) => {
    if (!event) return;
    const policy = newPolicy ?? giftPref;
    const wrap = newClearWrap ?? clearWrap;
    await supabase.from("events").update({
      gift_policy: policy,
      clear_wrapping: wrap,
    }).eq("id", event.id);
    refetch();
  };

  return (
    <MobileLayout>
      <div className="px-6 pt-12 pb-6">
        <div className="flex items-center gap-4 mb-6">
          <div className="w-16 h-16 rounded-full bg-gradient-to-br from-primary to-lavender flex items-center justify-center">
            <span className="text-2xl font-bold text-primary-foreground">{initial}</span>
          </div>
          <div>
            <h1 className="text-xl font-bold">{displayName}</h1>
            <p className="text-sm text-muted-foreground">{event?.event_type === "shower" ? "Shower Planner 💕" : "Registry Builder 🎁"}</p>
          </div>
        </div>

        <Card className="border-none mb-6">
          <CardContent className="p-4">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <Baby className="h-4 w-4 text-primary" />
                <h2 className="font-bold text-sm">Event Details</h2>
              </div>
              {!editing ? (
                <Button variant="ghost" size="sm" className="h-7 px-2 text-xs gap-1" onClick={startEditing}>
                  <Pencil className="h-3 w-3" /> Edit
                </Button>
              ) : (
                <Button variant="ghost" size="sm" className="h-7 px-2 text-xs gap-1 text-primary" onClick={saveDetails} disabled={saving}>
                  <Check className="h-3 w-3" /> {saving ? "Saving..." : "Save"}
                </Button>
              )}
            </div>

            {!editing ? (
              <div className="space-y-2.5">
                {[
                  { label: "Honoree", value: event?.honoree_name || "Not set" },
                  { label: "Due Date", value: event?.due_date ? new Date(event.due_date).toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" }) : "Not set" },
                  { label: "Event Date", value: event?.event_date ? new Date(event.event_date).toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" }) : "Not set" },
                  { label: "City", value: event?.city || "Not set" },
                  { label: "Theme", value: event?.theme || "Not set" },
                ].map((item) => (
                  <div key={item.label} className="flex items-center justify-between">
                    <span className="text-xs text-muted-foreground">{item.label}</span>
                    <span className={cn("text-sm font-medium", item.value === "Not set" && "text-muted-foreground italic")}>{item.value}</span>
                  </div>
                ))}
              </div>
            ) : (
              <div className="space-y-3">
                <div className="space-y-1">
                  <Label className="text-xs">Honoree</Label>
                  <Input value={honoreeName} onChange={(e) => setHonoreeName(e.target.value)} placeholder="e.g. Sarah & Mike" className="h-9 text-sm" />
                </div>
                <div className="space-y-1">
                  <Label className="text-xs">Due Date</Label>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button variant="outline" className={cn("w-full justify-start text-left font-normal h-9 text-sm", !dueDate && "text-muted-foreground")}>
                        <CalendarIcon className="mr-2 h-3.5 w-3.5" />{dueDate ? format(dueDate, "PPP") : "Pick a date"}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="start"><Calendar mode="single" selected={dueDate} onSelect={setDueDate} initialFocus className="p-3 pointer-events-auto" /></PopoverContent>
                  </Popover>
                </div>
                <div className="space-y-1">
                  <Label className="text-xs">Event Date</Label>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button variant="outline" className={cn("w-full justify-start text-left font-normal h-9 text-sm", !eventDate && "text-muted-foreground")}>
                        <CalendarIcon className="mr-2 h-3.5 w-3.5" />{eventDate ? format(eventDate, "PPP") : "Pick a date"}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="start"><Calendar mode="single" selected={eventDate} onSelect={setEventDate} initialFocus className="p-3 pointer-events-auto" /></PopoverContent>
                  </Popover>
                </div>
                <div className="space-y-1">
                  <Label className="text-xs">City</Label>
                  <Input value={city} onChange={(e) => setCity(e.target.value)} placeholder="e.g. Nashville, TN" className="h-9 text-sm" />
                </div>
                <div className="space-y-1">
                  <Label className="text-xs">Theme</Label>
                  <Input value={theme} onChange={(e) => setTheme(e.target.value)} placeholder="e.g. Woodland, Boho" className="h-9 text-sm" />
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        <Card className="border-none mb-6">
          <CardContent className="p-4">
            <div className="flex items-center gap-2 mb-3">
              <Gift className="h-4 w-4 text-primary" />
              <h2 className="font-bold text-sm">Gifting Preferences</h2>
            </div>
            <RadioGroup value={giftPref} onValueChange={(v) => { setGiftPref(v); saveGiftPrefs(v); }} className="space-y-2.5">
              {[
                { value: "bring-gift", label: "Bring a gift", icon: "🎁" },
                { value: "no-gifts", label: "No gifts please", icon: "🚫" },
                { value: "bring-book", label: "Bring a book instead", icon: "📚" },
              ].map((opt) => (
                <div key={opt.value} className="flex items-center gap-3">
                  <RadioGroupItem value={opt.value} id={opt.value} />
                  <Label htmlFor={opt.value} className="text-sm flex items-center gap-2 cursor-pointer">
                    <span>{opt.icon}</span>{opt.label}
                  </Label>
                </div>
              ))}
            </RadioGroup>
            <div className="mt-4 pt-3 border-t border-border">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <PackageOpen className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm">Request clear wrapping</span>
                </div>
                <Switch checked={clearWrap} onCheckedChange={(v) => { setClearWrap(v); saveGiftPrefs(undefined, v); }} />
              </div>
              <p className="text-[10px] text-muted-foreground mt-1 ml-6">So we can play the gift guessing game!</p>
            </div>
          </CardContent>
        </Card>

        <h2 className="font-bold text-sm mb-3">Settings</h2>
        <div className="space-y-2">
          <Card className="border-none">
            <CardContent className="p-3 flex items-center gap-3">
              <div className="bg-primary/10 p-2 rounded-lg"><Bell className="h-4 w-4 text-primary" /></div>
              <div className="flex-1"><p className="text-sm font-medium">Notifications</p></div>
              <Switch defaultChecked />
            </CardContent>
          </Card>
          <Card className="border-none">
            <CardContent className="p-3 flex items-center gap-3">
              <div className="bg-primary/10 p-2 rounded-lg"><Palette className="h-4 w-4 text-primary" /></div>
              <div className="flex-1">
                <p className="text-sm font-medium">Theme</p>
                <p className="text-[10px] text-muted-foreground">Pastel Pink</p>
              </div>
              <ChevronRight className="h-4 w-4 text-muted-foreground" />
            </CardContent>
          </Card>
          <Card className="border-none">
            <CardContent className="p-3 flex items-center gap-3">
              <div className="bg-primary/10 p-2 rounded-lg"><Share2 className="h-4 w-4 text-primary" /></div>
              <div className="flex-1"><p className="text-sm font-medium">Share Event Link</p></div>
              <ShareInviteButton />
            </CardContent>
          </Card>
        </div>

        <Button variant="ghost" className="w-full mt-6 text-destructive hover:text-destructive hover:bg-destructive/10 gap-2" onClick={handleSignOut}>
          <LogOut className="h-4 w-4" /> Sign Out
        </Button>
      </div>
    </MobileLayout>
  );
};

export default ProfilePage;
