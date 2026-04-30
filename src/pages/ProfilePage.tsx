import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import {
  ChevronLeft,
  LogOut,
  MessageSquare,
  Smartphone,
  Mail as MailIcon,
  Pencil,
  Check,
  Loader2,
  MapPin,
} from "lucide-react";
import { MobileLayout } from "@/components/layout/MobileLayout";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import ImageUpload from "@/components/ImageUpload";

/**
 * Personal profile. Strictly individual settings — name, avatar, default
 * city, notification preferences, sign-out. Event-specific things (honoree,
 * dates, gift prefs, event image) live on the dedicated shower-setup page
 * at /setup/shower; this page never references the active event.
 */
const ProfilePage = () => {
  const { user, signOut } = useAuth();
  const navigate = useNavigate();

  // Identity fields — sourced from auth + the profiles row.
  const [displayName, setDisplayName] = useState<string>("");
  const [city, setCity] = useState<string>("");
  const [editingIdentity, setEditingIdentity] = useState(false);
  const [savingIdentity, setSavingIdentity] = useState(false);

  // Notification toggles
  const [emailNotif, setEmailNotif] = useState(true);
  const [smsNotif, setSmsNotif] = useState(false);
  const [pushNotif, setPushNotif] = useState(false);

  useEffect(() => {
    if (!user) return;
    setDisplayName(
      (user.user_metadata?.display_name as string | undefined) ||
        user.email?.split("@")[0] ||
        ""
    );
    (async () => {
      const { data } = await supabase
        .from("profiles")
        .select("city, email_notifications, sms_opt_in, push_notifications")
        .eq("id", user.id)
        .maybeSingle();
      if (data) {
        setCity(data.city ?? "");
        setEmailNotif(data.email_notifications ?? true);
        setSmsNotif(data.sms_opt_in ?? false);
        setPushNotif(data.push_notifications ?? false);
      }
    })();
  }, [user]);

  const updateNotif = async (
    field: "email_notifications" | "sms_opt_in" | "push_notifications",
    value: boolean
  ) => {
    if (!user) return;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    await supabase.from("profiles").update({ [field]: value } as any).eq("id", user.id);
  };

  const handleAvatarUploaded = async (url: string) => {
    if (!user) return;
    await supabase.auth.updateUser({ data: { avatar_url: url } });
    await supabase.from("profiles").update({ avatar_url: url }).eq("id", user.id);
    toast.success("Avatar updated");
  };

  const saveIdentity = async () => {
    if (!user) return;
    setSavingIdentity(true);
    const trimmedName = displayName.trim();
    const trimmedCity = city.trim();
    // Auth user_metadata holds the display name (so it surfaces in tokens
    // and across the rest of the app); the profiles row holds the editable
    // default city for vendor / community recommendations.
    const [{ error: authErr }, { error: profileErr }] = await Promise.all([
      supabase.auth.updateUser({ data: { display_name: trimmedName } }),
      supabase
        .from("profiles")
        .update({ display_name: trimmedName, city: trimmedCity || null })
        .eq("id", user.id),
    ]);
    setSavingIdentity(false);
    if (authErr || profileErr) {
      toast.error("Couldn't save your changes");
      return;
    }
    toast.success("Profile updated");
    setEditingIdentity(false);
  };

  const handleSignOut = async () => {
    await signOut();
    navigate("/auth");
  };

  const initial = (displayName || user?.email || "U").charAt(0).toUpperCase();
  const avatarUrl = user?.user_metadata?.avatar_url as string | undefined;

  return (
    <MobileLayout>
      <div className="px-6 pt-12 pb-6">
        <Button
          variant="ghost"
          size="sm"
          className="gap-1.5 -ml-2 mb-2 text-muted-foreground hover:text-foreground"
          onClick={() => navigate("/")}
        >
          <ChevronLeft className="h-4 w-4" /> Home
        </Button>

        {/* Account — avatar + identity. Sign-out moved to the bottom of the
            page (alongside other destructive options) so it doesn't crowd
            the avatar area. */}
        <Card className="border-none mb-6 rounded-2xl">
          <CardContent className="p-4 flex items-center gap-4">
            <ImageUpload
              currentUrl={avatarUrl}
              folder="avatars"
              onUploaded={handleAvatarUploaded}
              className="w-16 h-16 rounded-full shrink-0"
            >
              {avatarUrl ? (
                <img
                  src={avatarUrl}
                  alt={displayName}
                  className="w-16 h-16 rounded-full object-cover"
                />
              ) : (
                <div className="w-16 h-16 rounded-full bg-gradient-to-br from-primary to-lavender flex items-center justify-center">
                  <span className="text-2xl font-bold text-primary-foreground">
                    {initial}
                  </span>
                </div>
              )}
            </ImageUpload>
            <div className="flex-1 min-w-0">
              <h1 className="text-lg font-bold truncate">
                {displayName || "Your name"}
              </h1>
              <p className="text-xs text-muted-foreground truncate">
                {user?.email}
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Identity edit — display name + default city. */}
        <h2 className="font-bold text-sm mb-3 text-muted-foreground uppercase tracking-wide">
          Your details
        </h2>
        <Card className="border-none mb-6">
          <CardContent className="p-4">
            <div className="flex items-center justify-between mb-3">
              <p className="text-sm font-bold">Profile</p>
              {!editingIdentity ? (
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-7 px-2 text-xs gap-1"
                  onClick={() => setEditingIdentity(true)}
                >
                  <Pencil className="h-3 w-3" /> Edit
                </Button>
              ) : (
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-7 px-2 text-xs gap-1 text-primary"
                  onClick={saveIdentity}
                  disabled={savingIdentity}
                >
                  {savingIdentity ? (
                    <Loader2 className="h-3 w-3 animate-spin" />
                  ) : (
                    <Check className="h-3 w-3" />
                  )}
                  {savingIdentity ? "Saving..." : "Save"}
                </Button>
              )}
            </div>

            {!editingIdentity ? (
              <div className="space-y-2.5">
                <div className="flex items-center justify-between">
                  <span className="text-xs text-muted-foreground">Display name</span>
                  <span className="text-sm font-medium">
                    {displayName || (
                      <span className="text-muted-foreground italic">Not set</span>
                    )}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-xs text-muted-foreground">Email</span>
                  <span className="text-sm font-medium">{user?.email}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-xs text-muted-foreground">Default city</span>
                  <span className="text-sm font-medium">
                    {city || (
                      <span className="text-muted-foreground italic">Not set</span>
                    )}
                  </span>
                </div>
              </div>
            ) : (
              <div className="space-y-3">
                <div className="space-y-1">
                  <Label className="text-xs">Display name</Label>
                  <Input
                    value={displayName}
                    onChange={(e) => setDisplayName(e.target.value)}
                    placeholder="How others see you"
                    className="h-9 text-sm"
                  />
                </div>
                <div className="space-y-1">
                  <Label className="text-xs">Default city</Label>
                  <div className="relative">
                    <MapPin className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
                    <Input
                      value={city}
                      onChange={(e) => setCity(e.target.value)}
                      placeholder="e.g. Nashville, TN"
                      className="h-9 text-sm pl-8"
                    />
                  </div>
                  <p className="text-[11px] text-muted-foreground pt-0.5">
                    Used to recommend local vendors and community events.
                  </p>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Notification preferences — true user-level settings. */}
        <h2 className="font-bold text-sm mb-3 text-muted-foreground uppercase tracking-wide">
          Notifications
        </h2>
        <div className="space-y-2 mb-6">
          <Card className="border-none">
            <CardContent className="p-3 flex items-center gap-3">
              <div className="bg-primary/10 p-2 rounded-lg">
                <MailIcon className="h-4 w-4 text-primary" />
              </div>
              <div className="flex-1">
                <p className="text-sm font-medium">Email notifications</p>
                <p className="text-[10px] text-muted-foreground">
                  Invites, RSVPs, reminders
                </p>
              </div>
              <Switch
                checked={emailNotif}
                onCheckedChange={(v) => {
                  setEmailNotif(v);
                  updateNotif("email_notifications", v);
                }}
              />
            </CardContent>
          </Card>
          <Card className="border-none">
            <CardContent className="p-3 flex items-center gap-3">
              <div className="bg-primary/10 p-2 rounded-lg">
                <MessageSquare className="h-4 w-4 text-primary" />
              </div>
              <div className="flex-1">
                <p className="text-sm font-medium">SMS notifications</p>
                <p className="text-[10px] text-muted-foreground">
                  Requires explicit opt-in
                </p>
              </div>
              <Switch
                checked={smsNotif}
                onCheckedChange={(v) => {
                  setSmsNotif(v);
                  updateNotif("sms_opt_in", v);
                }}
              />
            </CardContent>
          </Card>
          <Card className="border-none">
            <CardContent className="p-3 flex items-center gap-3">
              <div className="bg-primary/10 p-2 rounded-lg">
                <Smartphone className="h-4 w-4 text-primary" />
              </div>
              <div className="flex-1">
                <p className="text-sm font-medium">Push notifications</p>
                <p className="text-[10px] text-muted-foreground">
                  Local events &amp; community
                </p>
              </div>
              <Switch
                checked={pushNotif}
                onCheckedChange={(v) => {
                  setPushNotif(v);
                  updateNotif("push_notifications", v);
                }}
              />
            </CardContent>
          </Card>
        </div>

        {/* Sign out — destructive action lives at the bottom, separated
            from primary settings, with destructive styling. */}
        <Button
          variant="outline"
          className="w-full rounded-xl border-destructive/40 text-destructive hover:bg-destructive/10 hover:text-destructive gap-1.5"
          onClick={handleSignOut}
        >
          <LogOut className="h-4 w-4" /> Sign Out
        </Button>
      </div>
    </MobileLayout>
  );
};

export default ProfilePage;
