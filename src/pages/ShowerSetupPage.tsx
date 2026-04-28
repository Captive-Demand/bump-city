import { useState, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useAppMode, type SetupData } from "@/contexts/AppModeContext";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { MobileLayout } from "@/components/layout/MobileLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent } from "@/components/ui/card";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Checkbox } from "@/components/ui/checkbox";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Progress } from "@/components/ui/progress";
import { cn } from "@/lib/utils";
import { format } from "date-fns";
import { Baby, CalendarIcon, ArrowLeft, ArrowRight, Sparkles } from "lucide-react";
import { toast } from "sonner";
import { useActiveEvent } from "@/contexts/ActiveEventContext";
import type { Json } from "@/integrations/supabase/types";

const TOTAL_STEPS = 3;

const STEP_NAMES = ["Your Role", "Event Details", "Gifting Preferences"];

const StepProgress = ({ current, total }: { current: number; total: number }) => (
  <div className="mb-6">
    <Progress value={((current + 1) / total) * 100} className="h-2" />
    <p className="text-xs text-muted-foreground mt-2">Step {current + 1} of {total} — {STEP_NAMES[current]}</p>
  </div>
);

const ShowerSetupPage = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { setMode, updateSetupData } = useAppMode();
  const { refetch } = useActiveEvent();
  const { user } = useAuth();
  const editingEventId = searchParams.get("eventId");
  const [step, setStep] = useState(0);
  const [saving, setSaving] = useState(false);
  const [loadingEvent, setLoadingEvent] = useState(false);
  const [canEditEvent, setCanEditEvent] = useState(!editingEventId);
  const isNewEvent = searchParams.get("new") === "true";

  useEffect(() => {
    if (!user || isNewEvent || editingEventId) return;
    const checkExisting = async () => {
      const { data } = await supabase
        .from("events")
        .select("id")
        .eq("user_id", user.id)
        .limit(1);
      if (data && data.length > 0) navigate("/", { replace: true });
    };
    checkExisting();
  }, [user, isNewEvent, editingEventId, navigate]);

  const [role, setRole] = useState<"planner" | "expectant-parent">("expectant-parent");
  const [honoreeName, setHonoreeName] = useState("");
  const [dueDate, setDueDate] = useState<Date>();
  const [eventDate, setEventDate] = useState<Date>();
  const [city, setCity] = useState("");
  const [theme, setTheme] = useState("");
  const [giftPolicy, setGiftPolicy] = useState<"bring-gift" | "no-gifts" | "bring-book">("bring-gift");
  const [giftPrefs, setGiftPrefs] = useState<Record<string, boolean>>({
    bring_gift: true,
    bring_book: false,
    no_gifts: false,
    clear_wrapping: false,
    ship_to_home: false,
    bring_to_event: true,
  });
  const togglePref = (key: string) => setGiftPrefs((p) => ({ ...p, [key]: !p[key] }));
  const [clearWrapping, setClearWrapping] = useState(false);
  const [surpriseMode, setSurpriseMode] = useState(false);
  const [giftNote, setGiftNote] = useState("");
  const [pushNotifications, setPushNotifications] = useState(false);

  useEffect(() => {
    let cancelled = false;
    if (!user || !editingEventId) {
      setCanEditEvent(!editingEventId);
      return;
    }

    setLoadingEvent(true);
    (async () => {
      const { data: eventData, error: eventError } = await supabase
        .from("events")
        .select("*")
        .eq("id", editingEventId)
        .maybeSingle();

      if (cancelled) return;

      if (eventError || !eventData) {
        toast.error("Couldn't load this shower.");
        navigate("/showers", { replace: true });
        return;
      }

      let allowed = eventData.user_id === user.id;
      if (!allowed) {
        const { data: memberData } = await supabase
          .from("event_members")
          .select("role")
          .eq("event_id", editingEventId)
          .eq("user_id", user.id)
          .in("role", ["host", "co-host"])
          .maybeSingle();
        allowed = !!memberData;
      }

      if (!allowed) {
        setCanEditEvent(false);
        setLoadingEvent(false);
        return;
      }

      setCanEditEvent(true);
      setRole("planner");
      setHonoreeName(eventData.honoree_name || "");
      setDueDate(eventData.due_date ? new Date(`${eventData.due_date}T12:00:00`) : undefined);
      setEventDate(eventData.event_date ? new Date(`${eventData.event_date}T12:00:00`) : undefined);
      setCity(eventData.city || "");
      setTheme(eventData.theme || "");
      setGiftPolicy((eventData.gift_policy as "bring-gift" | "no-gifts" | "bring-book") || "bring-gift");
      setGiftPrefs({
        bring_gift: true,
        bring_book: false,
        no_gifts: false,
        clear_wrapping: eventData.clear_wrapping || false,
        ship_to_home: false,
        bring_to_event: true,
        ...((eventData.gift_preferences as Record<string, boolean> | null) || {}),
      });
      setClearWrapping(eventData.clear_wrapping || false);
      setSurpriseMode(eventData.surprise_mode || false);
      setGiftNote(eventData.gift_note || "");
      setLoadingEvent(false);
    })();

    return () => { cancelled = true; };
  }, [user, editingEventId, navigate]);

  const canNext = () => {
    if (step === 0) return true;
    if (step === 1) return honoreeName.trim().length > 0 && dueDate !== undefined;
    return true;
  };

  const handleFinish = async () => {
    if (!user) return;
    setSaving(true);

    if (editingEventId) {
      const { error } = await supabase
        .from("events")
        .update({
          honoree_name: honoreeName.trim(),
          due_date: dueDate ? format(dueDate, "yyyy-MM-dd") : null,
          event_date: eventDate ? format(eventDate, "yyyy-MM-dd") : null,
          city: city.trim() || null,
          theme: theme.trim() || null,
          gift_policy: giftPolicy,
          gift_preferences: giftPrefs as Json,
          clear_wrapping: giftPrefs.clear_wrapping || clearWrapping,
          gift_note: giftNote.trim() || null,
          surprise_mode: surpriseMode,
        })
        .eq("id", editingEventId);

      if (error) {
        setSaving(false);
        toast.error("Failed to update event. Please try again.");
        return;
      }

      await supabase.from("profiles").update({ city: city.trim() || null, push_notifications: pushNotifications }).eq("id", user.id);
      await refetch();
      setSaving(false);
      toast.success("Shower details updated");
      navigate(`/showers/${editingEventId}`);
      return;
    }

    // Save event to database
    const { data: insertedEvent, error } = await supabase.from("events").insert({
      user_id: user.id,
      event_type: "shower",
      honoree_name: honoreeName.trim(),
      due_date: dueDate ? format(dueDate, "yyyy-MM-dd") : null,
      event_date: eventDate ? format(eventDate, "yyyy-MM-dd") : null,
      city: city.trim() || null,
      theme: theme.trim() || null,
      gift_policy: giftPolicy,
      gift_preferences: giftPrefs as Json,
      clear_wrapping: giftPrefs.clear_wrapping || clearWrapping,
      gift_note: giftNote.trim() || null,
      surprise_mode: surpriseMode,
    }).select("id").single();

    if (error || !insertedEvent) {
      setSaving(false);
      toast.error("Failed to save event. Please try again.");
      return;
    }

    // Insert event_members roles
    const membersToInsert = [
      { event_id: insertedEvent.id, user_id: user.id, role: "host" },
    ];
    // If expectant-parent, also add as honoree
    if (role === "expectant-parent") {
      membersToInsert.push({ event_id: insertedEvent.id, user_id: user.id, role: "honoree" });
    }
    await supabase.from("event_members").insert(membersToInsert);

    // Update profile city (no more role column)
    await supabase.from("profiles").update({ city: city.trim() || null, push_notifications: pushNotifications }).eq("id", user.id);

    setSaving(false);

    const setupDataPayload: Partial<SetupData> = {
      role, honoreeName: honoreeName.trim(), dueDate, eventDate,
      city: city.trim(), theme: theme.trim(), giftPolicy, clearWrapping, giftNote: giftNote.trim(),
    };
    updateSetupData(setupDataPayload);
    setMode("shower");
    await refetch();
    navigate("/");
  };

  if (loadingEvent) {
    return (
      <MobileLayout hideNav>
        <div className="px-6 pt-10 pb-8 min-h-screen flex items-center justify-center max-w-[500px] mx-auto w-full">
          <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full" />
        </div>
      </MobileLayout>
    );
  }

  if (!canEditEvent) {
    return (
      <MobileLayout hideNav>
        <div className="px-6 pt-10 pb-8 min-h-screen flex items-center justify-center max-w-[500px] mx-auto w-full">
          <Card className="border-none w-full">
            <CardContent className="p-5 text-center space-y-3">
              <h1 className="text-xl font-bold">You can’t edit this shower</h1>
              <p className="text-sm text-muted-foreground">Only hosts and co-hosts can change shower details.</p>
              <Button className="w-full rounded-xl" onClick={() => navigate(editingEventId ? `/showers/${editingEventId}` : "/")}>Go back</Button>
            </CardContent>
          </Card>
        </div>
      </MobileLayout>
    );
  }

  return (
    <MobileLayout hideNav>
      <div className="px-6 pt-10 pb-8 min-h-screen flex flex-col max-w-[500px] mx-auto w-full">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2">
            <Baby className="h-5 w-5 text-primary" />
            <span className="text-sm font-semibold text-primary">{editingEventId ? "Edit Shower" : "Shower Setup"}</span>
          </div>
          <button
            type="button"
            onClick={() => navigate(editingEventId ? `/showers/${editingEventId}` : "/", { replace: true })}
            className="text-xs font-medium text-muted-foreground hover:text-foreground underline"
          >
            {editingEventId ? "Cancel" : "Skip for now"}
          </button>
        </div>
        {!editingEventId && <StepProgress current={step} total={TOTAL_STEPS} />}

        <div className="flex-1">
          {!editingEventId && step === 0 && (
            <div className="space-y-6">
              <div>
                <h2 className="text-2xl font-bold">What's your role?</h2>
                <p className="text-sm text-muted-foreground mt-1">This helps us tailor the experience for you.</p>
              </div>
              <RadioGroup value={role} onValueChange={(v) => setRole(v as typeof role)} className="space-y-3">
                <Label htmlFor="expectant" className={cn("flex items-center gap-4 p-4 rounded-xl border-2 cursor-pointer transition-all", role === "expectant-parent" ? "border-primary bg-primary/5" : "border-border")}>
                  <RadioGroupItem value="expectant-parent" id="expectant" />
                  <div><p className="font-semibold text-sm">I'm the expectant parent</p><p className="text-xs text-muted-foreground">Planning my own shower</p></div>
                </Label>
                <Label htmlFor="planner" className={cn("flex items-center gap-4 p-4 rounded-xl border-2 cursor-pointer transition-all", role === "planner" ? "border-primary bg-primary/5" : "border-border")}>
                  <RadioGroupItem value="planner" id="planner" />
                  <div><p className="font-semibold text-sm">I'm planning for someone else</p><p className="text-xs text-muted-foreground">Hosting or co-hosting</p></div>
                </Label>
              </RadioGroup>
            </div>
          )}

          {(editingEventId || step === 1) && (
            <div className="space-y-5">
              <div><h2 className="text-2xl font-bold">Event Details</h2><p className="text-sm text-muted-foreground mt-1">Tell us about the shower.</p></div>
              <div className="space-y-1.5">
                <Label htmlFor="honoree">Honoree name(s) *</Label>
                <Input id="honoree" placeholder="e.g. Sarah & Mike" value={honoreeName} onChange={(e) => setHonoreeName(e.target.value)} maxLength={100} />
              </div>
              <div className="space-y-1.5">
                <Label>Due date *</Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button variant="outline" className={cn("w-full justify-start text-left font-normal", !dueDate && "text-muted-foreground")}>
                      <CalendarIcon className="mr-2 h-4 w-4" />{dueDate ? format(dueDate, "PPP") : "Pick a date"}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start"><Calendar mode="single" selected={dueDate} onSelect={setDueDate} initialFocus className="p-3 pointer-events-auto" /></PopoverContent>
                </Popover>
              </div>
              <div className="space-y-1.5">
                <Label>Event date (optional)</Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button variant="outline" className={cn("w-full justify-start text-left font-normal", !eventDate && "text-muted-foreground")}>
                      <CalendarIcon className="mr-2 h-4 w-4" />{eventDate ? format(eventDate, "PPP") : "Pick a date"}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start"><Calendar mode="single" selected={eventDate} onSelect={setEventDate} initialFocus className="p-3 pointer-events-auto" /></PopoverContent>
                </Popover>
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="city">City / Location</Label>
                <Input id="city" placeholder="e.g. Nashville, TN" value={city} onChange={(e) => setCity(e.target.value)} maxLength={100} />
                {city.toLowerCase().includes("nashville") && <p className="text-xs text-primary font-medium">🎵 Nashville unlocks local vendors & events!</p>}
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="theme">Theme (optional)</Label>
                <Input id="theme" placeholder="e.g. Woodland, Boho, Safari" value={theme} onChange={(e) => setTheme(e.target.value)} maxLength={100} />
              </div>
            </div>
          )}

          {(editingEventId || step === 2) && (
            <div className="space-y-5">
              <div><h2 className="text-2xl font-bold">Gifting Preferences</h2><p className="text-sm text-muted-foreground mt-1">Pick all that apply — you can change these later.</p></div>
              <div className="space-y-2">
                {[
                  { key: "bring_gift", label: "Bring a gift", desc: "Gifts welcome — registry link will be shared", icon: "🎁" },
                  { key: "bring_book", label: "Bring a book instead", desc: "Build baby's first library", icon: "📚" },
                  { key: "no_gifts", label: "No gifts please", desc: "Presence over presents", icon: "💖" },
                  { key: "clear_wrapping", label: "Clear wrapping requested", desc: "For guessing games", icon: "🎀" },
                  { key: "ship_to_home", label: "Ship to home", desc: "Send registry items to shipping address", icon: "📦" },
                  { key: "bring_to_event", label: "Bring gifts to the event", desc: "Open them at the shower", icon: "🎈" },
                ].map((opt) => (
                  <Label key={opt.key} htmlFor={opt.key} className={cn("flex items-start gap-3 p-3 rounded-xl border-2 cursor-pointer transition-all", giftPrefs[opt.key] ? "border-primary bg-primary/5" : "border-border")}>
                    <Checkbox id={opt.key} checked={!!giftPrefs[opt.key]} onCheckedChange={() => {
                      togglePref(opt.key);
                      if (opt.key === "bring_gift") setGiftPolicy("bring-gift");
                      if (opt.key === "bring_book") setGiftPolicy("bring-book");
                      if (opt.key === "no_gifts") setGiftPolicy("no-gifts");
                    }} className="mt-0.5" />
                    <div className="flex-1">
                      <p className="font-semibold text-sm flex items-center gap-2"><span>{opt.icon}</span>{opt.label}</p>
                      <p className="text-xs text-muted-foreground">{opt.desc}</p>
                    </div>
                  </Label>
                ))}
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="note">Custom note for guests (optional)</Label>
                <Textarea id="note" placeholder="Any special instructions for your guests..." value={giftNote} onChange={(e) => setGiftNote(e.target.value)} maxLength={500} rows={3} />
              </div>
              {role === "planner" && (
                <div className="flex items-center justify-between p-4 rounded-xl border border-border">
                  <div><p className="font-semibold text-sm">🤫 Surprise Mode</p><p className="text-xs text-muted-foreground">Hide shower details from the expectant parent</p></div>
                  <Switch checked={surpriseMode} onCheckedChange={setSurpriseMode} />
                </div>
              )}
              <div className="flex items-center justify-between p-4 rounded-xl border border-border">
                <div><p className="font-semibold text-sm">🔔 Local event notifications</p><p className="text-xs text-muted-foreground">Get notified about community events & meetups</p></div>
                <Switch checked={pushNotifications} onCheckedChange={setPushNotifications} />
              </div>
            </div>
          )}
        </div>

        <div className="flex gap-3 pt-6">
          {editingEventId ? (
            <Button className="flex-1" onClick={handleFinish} disabled={saving}>
              <Sparkles className="h-4 w-4 mr-1" /> {saving ? "Saving..." : "Save changes"}
            </Button>
          ) : (
            <>
              {step > 0 && (
                <Button variant="outline" className="flex-1" onClick={() => setStep(step - 1)}>
                  <ArrowLeft className="h-4 w-4 mr-1" /> Back
                </Button>
              )}
              {step < TOTAL_STEPS - 1 ? (
                <Button className="flex-1" disabled={!canNext()} onClick={() => setStep(step + 1)}>
                  Next <ArrowRight className="h-4 w-4 ml-1" />
                </Button>
              ) : (
                <Button className="flex-1" onClick={handleFinish} disabled={saving}>
                  <Sparkles className="h-4 w-4 mr-1" /> {saving ? "Saving..." : "Let's go!"}
                </Button>
              )}
            </>
          )}
        </div>
      </div>
    </MobileLayout>
  );
};

export default ShowerSetupPage;
