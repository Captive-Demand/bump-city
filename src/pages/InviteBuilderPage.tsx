import { useState, useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { MobileLayout } from "@/components/layout/MobileLayout";
import { useAuth } from "@/contexts/AuthContext";
import { useEvent } from "@/hooks/useEvent";
import { supabase } from "@/integrations/supabase/client";
import { Mail, Image, Palette, Send, Eye } from "lucide-react";
import { toast } from "sonner";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { cn } from "@/lib/utils";
import { format } from "date-fns";
import { CalendarIcon } from "lucide-react";

const themes = ["Classic Pastel", "Enchanted Garden", "Safari Adventure", "Under the Sea", "Woodland", "Boho Chic"];

const InviteBuilderPage = () => {
  const { event } = useEvent();

  const [title, setTitle] = useState(event?.honoree_name ? `${event.honoree_name}'s Baby Shower` : "Baby Shower");
  const [eventDate, setEventDate] = useState<Date | undefined>(event?.event_date ? new Date(event.event_date) : undefined);
  const [location, setLocation] = useState(event?.city || "");
  const [message, setMessage] = useState("You're invited to celebrate with us! 🎉");
  const [theme, setTheme] = useState("Classic Pastel");
  const [showPreview, setShowPreview] = useState(false);

  const themeStyles: Record<string, string> = {
    "Classic Pastel": "from-primary/20 via-lavender/30 to-peach/30",
    "Enchanted Garden": "from-mint/30 via-accent/20 to-primary/10",
    "Safari Adventure": "from-warm/40 via-peach/30 to-primary/10",
    "Under the Sea": "from-accent/30 via-lavender/20 to-mint/30",
    "Woodland": "from-warm/30 via-mint/20 to-lavender/20",
    "Boho Chic": "from-peach/30 via-warm/20 to-lavender/20",
  };

  return (
    <MobileLayout>
      <div className="px-6 pt-12 pb-6">
        <div className="flex items-center gap-2 mb-1">
          <Mail className="h-5 w-5 text-primary" />
          <h1 className="text-2xl font-bold">Invite Builder</h1>
        </div>
        <p className="text-sm text-muted-foreground">Design and send your shower invitations</p>
      </div>

      <div className="px-6 pb-6 space-y-4">
        {showPreview ? (
          <>
            <Card className={`border-none overflow-hidden bg-gradient-to-br ${themeStyles[theme] || themeStyles["Classic Pastel"]}`}>
              <CardContent className="p-8 text-center space-y-4">
                <p className="text-xs text-muted-foreground font-medium uppercase tracking-widest">You're Invited</p>
                <h2 className="text-2xl font-bold">{title}</h2>
                {eventDate && <p className="text-sm font-medium">{format(eventDate, "EEEE, MMMM do, yyyy")}</p>}
                {location && <p className="text-sm text-muted-foreground">📍 {location}</p>}
                <p className="text-sm leading-relaxed">{message}</p>
                <Button className="rounded-full">RSVP Now</Button>
              </CardContent>
            </Card>
            <Button variant="outline" className="w-full" onClick={() => setShowPreview(false)}>
              <Palette className="h-4 w-4 mr-2" /> Edit Invite
            </Button>
          </>
        ) : (
          <>
            <Card className="border-none">
              <CardContent className="p-4 space-y-4">
                <div className="space-y-1.5">
                  <Label>Invite Title</Label>
                  <Input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Baby Shower Invitation" />
                </div>
                <div className="space-y-1.5">
                  <Label>Event Date</Label>
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
                  <Label>Location</Label>
                  <Input value={location} onChange={(e) => setLocation(e.target.value)} placeholder="e.g. Grandma's Garden" />
                </div>
                <div className="space-y-1.5">
                  <Label>Personal Message</Label>
                  <Textarea value={message} onChange={(e) => setMessage(e.target.value)} rows={3} />
                </div>
                <div className="space-y-1.5">
                  <Label>Theme</Label>
                  <Select value={theme} onValueChange={setTheme}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {themes.map((t) => <SelectItem key={t} value={t}>{t}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
              </CardContent>
            </Card>
            <div className="flex gap-3">
              <Button variant="outline" className="flex-1 gap-2" onClick={() => setShowPreview(true)}>
                <Eye className="h-4 w-4" /> Preview
              </Button>
              <Button className="flex-1 gap-2" onClick={() => toast.info("Invite sending coming soon! Add guests first.")}>
                <Send className="h-4 w-4" /> Send to Guests
              </Button>
            </div>
          </>
        )}
      </div>
    </MobileLayout>
  );
};

export default InviteBuilderPage;
