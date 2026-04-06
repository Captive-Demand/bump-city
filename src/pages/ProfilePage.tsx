import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { User, Bell, Palette, Share2, LogOut, ChevronRight, Baby } from "lucide-react";
import { MobileLayout } from "@/components/layout/MobileLayout";

const ProfilePage = () => {
  return (
    <MobileLayout>
      <div className="px-6 pt-12 pb-6">
        {/* Profile Header */}
        <div className="flex items-center gap-4 mb-6">
          <div className="w-16 h-16 rounded-full bg-gradient-to-br from-primary to-lavender flex items-center justify-center">
            <span className="text-2xl font-bold text-primary-foreground">S</span>
          </div>
          <div>
            <h1 className="text-xl font-bold">Sarah Johnson</h1>
            <p className="text-sm text-muted-foreground">Mom-to-be 💕</p>
          </div>
        </div>

        {/* Event Details */}
        <Card className="border-none mb-6">
          <CardContent className="p-4">
            <div className="flex items-center gap-2 mb-3">
              <Baby className="h-4 w-4 text-primary" />
              <h2 className="font-bold text-sm">Event Details</h2>
            </div>
            <div className="space-y-2.5">
              {[
                { label: "Baby Name", value: "Baby Johnson" },
                { label: "Due Date", value: "August 15, 2025" },
                { label: "Shower Date", value: "August 3, 2025" },
                { label: "Venue", value: "Grandma's Garden" },
                { label: "Theme", value: "Enchanted Garden 🌸" },
              ].map((item) => (
                <div key={item.label} className="flex items-center justify-between">
                  <span className="text-xs text-muted-foreground">{item.label}</span>
                  <span className="text-sm font-medium">{item.value}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Settings */}
        <h2 className="font-bold text-sm mb-3">Settings</h2>
        <div className="space-y-2">
          {[
            { icon: Bell, label: "Notifications", hasSwitch: true },
            { icon: Palette, label: "Theme", desc: "Pastel Pink" },
            { icon: Share2, label: "Share Event Link" },
          ].map((item) => (
            <Card key={item.label} className="border-none">
              <CardContent className="p-3 flex items-center gap-3">
                <div className="bg-primary/10 p-2 rounded-lg">
                  <item.icon className="h-4 w-4 text-primary" />
                </div>
                <div className="flex-1">
                  <p className="text-sm font-medium">{item.label}</p>
                  {item.desc && (
                    <p className="text-[10px] text-muted-foreground">{item.desc}</p>
                  )}
                </div>
                {item.hasSwitch ? (
                  <Switch defaultChecked />
                ) : (
                  <ChevronRight className="h-4 w-4 text-muted-foreground" />
                )}
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Logout */}
        <Button variant="ghost" className="w-full mt-6 text-destructive hover:text-destructive hover:bg-destructive/10 gap-2">
          <LogOut className="h-4 w-4" />
          Sign Out
        </Button>
      </div>
    </MobileLayout>
  );
};

export default ProfilePage;
