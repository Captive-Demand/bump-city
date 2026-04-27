import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { User, Bell, Palette, Share2, LogOut, ChevronRight, Baby, Gift, PackageOpen, CalendarIcon, Pencil, Check, MessageSquare, Smartphone, Mail as MailIcon } from "lucide-react";
import { MobileLayout } from "@/components/layout/MobileLayout";
import { useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { useEvent } from "@/hooks/useEvent";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { cn } from "@/lib/utils";
import { format } from "date-fns";
import { toast } from "sonner";
import ShareInviteButton from "@/components/ShareInviteButton";
import ImageUpload from "@/components/ImageUpload";

const PREF_LABELS: Record<string, { label: string; icon: string }> = {
  bring_gift: { label: "Bring a gift", icon: "🎁" },
  bring_book: { label: "Bring a book", icon: "📚" },
  no_gifts: { label: "No gifts", icon: "💖" },
  clear_wrapping: { label: "Clear wrapping", icon: "🎀" },
  ship_to_home: { label: "Ship to home", icon: "📦" },
  bring_to_event: { label: "Bring to event", icon: "🎈" },
};

const ProfilePage = () => {
  const { user, signOut } = useAuth();
  const { event, refetch } = useEvent();
  const navigate = useNavigate();
  const initialPrefs = (event as any)?.gift_preferences || { bring_gift: true, bring_to_event: true };
  const [giftPrefs, setGiftPrefs] = useState<Record<string, boolean>>(initialPrefs);
  const [clearWrap, setClearWrap] = useState(event?.clear_wrapping || false);
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);

  // Notification toggles
  const [emailNotif, setEmailNotif] = useState(true);
  const [smsNotif, setSmsNotif] = useState(false);
  const [pushNotif, setPushNotif] = useState(false);

  useEffect(() => {
    if (!user) return;
    (async () => {
      const { data } = await supabase.from("profiles").select("email_notifications, sms_opt_in, push_notifications").eq("id", user.id).maybeSingle();
      if (data) {
        setEmailNotif(data.email_notifications ?? true);
        setSmsNotif(data.sms_opt_in ?? false);
        setPushNotif(data.push_notifications ?? false);
      }
    })();
  }, [user]);

  const updateNotif = async (field: "email_notifications" | "sms_opt_in" | "push_notifications", value: boolean) => {
    if (!user) return;
    await supabase.from("profiles").update({ [field]: value } as any).eq("id", user.id);
  };

  // Editable fields
  const [honoreeName, setHonoreeName] = useState(event?.honoree_name || "");
  const [dueDate, setDueDate] = useState<Date | undefined>(event?.due_date ? new Date(event.due_date) : undefined);
  const [eventDate, setEventDate] = useState<Date | undefined>(event?.event_date ? new Date(event.event_date) : undefined);
  const [city, setCity] = useState(event?.city || "");
  const [theme, setTheme] = useState(event?.theme || "");

  const displayName = user?.user_metadata?.display_name || user?.email || "User";
  const initial = displayName.charAt(0).toUpperCase();
  const avatarUrl = user?.user_metadata?.avatar_url;

  const handleAvatarUploaded = async (url: string) => {
    await supabase.auth.updateUser({ data: { avatar_url: url } });
    if (user) await supabase.from("profiles").update({ avatar_url: url }).eq("id", user.id);
  };

  const handleEventImageUploaded = async (url: string) => {
    if (!event) return;
    await supabase.from("events").update({ event_image_url: url } as any).eq("id", event.id);
    refetch();
    toast.success("Event image updated!");
  };

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

  const togglePref = async (key: string) => {
    if (!event) return;
    const next = { ...giftPrefs, [key]: !giftPrefs[key] };
    setGiftPrefs(next);
    await supabase.from("events").update({
      gift_preferences: next as any,
      clear_wrapping: !!next.clear_wrapping,
    }).eq("id", event.id);
    refetch();
  };

  const saveGiftPrefs = async (_newPolicy?: string, newClearWrap?: boolean) => {
    if (!event) return;
    const wrap = newClearWrap ?? clearWrap;
    await supabase.from("events").update({ clear_wrapping: wrap }).eq("id", event.id);
    refetch();
  };

  return (
    <MobileLayout>
      <div className="px-6 pt-12 pb-6">
        {/* User Profile Section */}
        <div className="flex items-center gap-4 mb-6">
          <ImageUpload
            currentUrl={avatarUrl}
            folder="avatars"
            onUploaded={handleAvatarUploaded}
            className="w-16 h-16 rounded-full shrink-0"
          >
            {avatarUrl ? (
              <img src={avatarUrl} alt={displayName} className="w-16 h-16 rounded-full object-cover" />
            ) : (
              <div className="w-16 h-16 rounded-full bg-gradient-to-br from-primary to-lavender flex items-center justify-center">
                <span className="text-2xl font-bold text-primary-foreground">{initial}</span>
              </div>
            )}
          </ImageUpload>
          <div>
            <h1 className="text-xl font-bold">{displayName}</h1>
            <p className="text-sm text-muted-foreground">{user?.email}</p>
          </div>
        </div>

        {/* Event Settings Section */}
        {event && (
          <>
            <h2 className="font-bold text-sm mb-3 text-muted-foreground uppercase tracking-wide">
              Event Settings
            </h2>

            {/* Event Image */}
            <div className="mb-4">
              <ImageUpload
                currentUrl={(event as any).event_image_url}
                folder="event-images"
                onUploaded={handleEventImageUploaded}
                className="w-full h-40 rounded-2xl overflow-hidden"
                overlayClassName="rounded-2xl"
              >
                {(event as any).event_image_url ? (
                  <img src={(event as any).event_image_url} alt="Event" className="w-full h-40 object-cover rounded-2xl" />
                ) : (
                  <div className="w-full h-40 bg-gradient-to-br from-primary/20 via-lavender/30 to-peach/20 rounded-2xl flex flex-col items-center justify-center">
                    <span className="text-3xl mb-1">📷</span>
                    <p className="text-sm text-muted-foreground font-medium">Add event photo</p>
                  </div>
                )}
              </ImageUpload>
            </div>

            <Card className="border-none mb-4">
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
                {/* Active prefs as badges */}
                <div className="flex flex-wrap gap-1.5 mb-3">
                  {Object.entries(giftPrefs).filter(([, v]) => v).map(([k]) => PREF_LABELS[k] && (
                    <Badge key={k} variant="secondary" className="text-[10px] gap-1">
                      <span>{PREF_LABELS[k].icon}</span>{PREF_LABELS[k].label}
                    </Badge>
                  ))}
                  {Object.values(giftPrefs).every((v) => !v) && (
                    <span className="text-[10px] text-muted-foreground italic">No preferences set</span>
                  )}
                </div>
                <div className="space-y-2">
                  {Object.entries(PREF_LABELS).map(([key, meta]) => (
                    <label key={key} className="flex items-center gap-3 cursor-pointer">
                      <Checkbox checked={!!giftPrefs[key]} onCheckedChange={() => togglePref(key)} />
                      <span className="text-sm flex items-center gap-2">
                        <span>{meta.icon}</span>{meta.label}
                      </span>
                    </label>
                  ))}
                </div>
              </CardContent>
            </Card>
          </>
        )}

        <h2 className="font-bold text-sm mb-3">Settings</h2>
        <div className="space-y-2">
          <Card className="border-none">
            <CardContent className="p-3 flex items-center gap-3">
              <div className="bg-primary/10 p-2 rounded-lg"><MailIcon className="h-4 w-4 text-primary" /></div>
              <div className="flex-1"><p className="text-sm font-medium">Email notifications</p><p className="text-[10px] text-muted-foreground">Invites, RSVPs, reminders</p></div>
              <Switch checked={emailNotif} onCheckedChange={(v) => { setEmailNotif(v); updateNotif("email_notifications", v); }} />
            </CardContent>
          </Card>
          <Card className="border-none">
            <CardContent className="p-3 flex items-center gap-3">
              <div className="bg-primary/10 p-2 rounded-lg"><MessageSquare className="h-4 w-4 text-primary" /></div>
              <div className="flex-1"><p className="text-sm font-medium">SMS notifications</p><p className="text-[10px] text-muted-foreground">Requires explicit opt-in</p></div>
              <Switch checked={smsNotif} onCheckedChange={(v) => { setSmsNotif(v); updateNotif("sms_opt_in", v); }} />
            </CardContent>
          </Card>
          <Card className="border-none">
            <CardContent className="p-3 flex items-center gap-3">
              <div className="bg-primary/10 p-2 rounded-lg"><Smartphone className="h-4 w-4 text-primary" /></div>
              <div className="flex-1"><p className="text-sm font-medium">Push notifications</p><p className="text-[10px] text-muted-foreground">Local events & community</p></div>
              <Switch checked={pushNotif} onCheckedChange={(v) => { setPushNotif(v); updateNotif("push_notifications", v); }} />
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
