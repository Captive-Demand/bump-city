import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { User, Bell, Palette, Share2, LogOut, ChevronRight, Baby, Gift, PackageOpen } from "lucide-react";
import { MobileLayout } from "@/components/layout/MobileLayout";
import { useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { useEvent } from "@/hooks/useEvent";
import { useNavigate } from "react-router-dom";

const ProfilePage = () => {
  const { user, signOut } = useAuth();
  const { event } = useEvent();
  const navigate = useNavigate();
  const [giftPref, setGiftPref] = useState(event?.gift_policy || "bring-gift");
  const [clearWrap, setClearWrap] = useState(event?.clear_wrapping || false);

  const displayName = user?.user_metadata?.display_name || user?.email || "User";
  const initial = displayName.charAt(0).toUpperCase();

  const handleSignOut = async () => {
    await signOut();
    navigate("/auth");
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
            <div className="flex items-center gap-2 mb-3">
              <Baby className="h-4 w-4 text-primary" />
              <h2 className="font-bold text-sm">Event Details</h2>
            </div>
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
                  <span className="text-sm font-medium">{item.value}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card className="border-none mb-6">
          <CardContent className="p-4">
            <div className="flex items-center gap-2 mb-3">
              <Gift className="h-4 w-4 text-primary" />
              <h2 className="font-bold text-sm">Gifting Preferences</h2>
            </div>
            <RadioGroup value={giftPref} onValueChange={setGiftPref} className="space-y-2.5">
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
                <Switch checked={clearWrap} onCheckedChange={setClearWrap} />
              </div>
              <p className="text-[10px] text-muted-foreground mt-1 ml-6">So we can play the gift guessing game!</p>
            </div>
          </CardContent>
        </Card>

        <h2 className="font-bold text-sm mb-3">Settings</h2>
        <div className="space-y-2">
          {[
            { icon: Bell, label: "Notifications", hasSwitch: true },
            { icon: Palette, label: "Theme", desc: "Pastel Pink" },
            { icon: Share2, label: "Share Event Link" },
          ].map((item) => (
            <Card key={item.label} className="border-none">
              <CardContent className="p-3 flex items-center gap-3">
                <div className="bg-primary/10 p-2 rounded-lg"><item.icon className="h-4 w-4 text-primary" /></div>
                <div className="flex-1">
                  <p className="text-sm font-medium">{item.label}</p>
                  {item.desc && <p className="text-[10px] text-muted-foreground">{item.desc}</p>}
                </div>
                {item.hasSwitch ? <Switch defaultChecked /> : <ChevronRight className="h-4 w-4 text-muted-foreground" />}
              </CardContent>
            </Card>
          ))}
        </div>

        <Button variant="ghost" className="w-full mt-6 text-destructive hover:text-destructive hover:bg-destructive/10 gap-2" onClick={handleSignOut}>
          <LogOut className="h-4 w-4" /> Sign Out
        </Button>
      </div>
    </MobileLayout>
  );
};

export default ProfilePage;
