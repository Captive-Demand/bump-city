import { useState, useEffect, useRef, useCallback } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { MobileLayout } from "@/components/layout/MobileLayout";
import { useEvent } from "@/hooks/useEvent";
import { Mail, Palette, Send, Eye, Save } from "lucide-react";
import { toast } from "sonner";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { cn } from "@/lib/utils";
import { format } from "date-fns";
import { CalendarIcon } from "lucide-react";
import { templates } from "@/components/invites/InviteTemplates";
import InviteTemplatePicker from "@/components/invites/InviteTemplatePicker";
import { supabase } from "@/integrations/supabase/client";

const InviteBuilderPage = () => {
  const { event } = useEvent();

  const [title, setTitle] = useState(event?.honoree_name ? `${event.honoree_name}'s Baby Shower` : "Baby Shower");
  const [eventDate, setEventDate] = useState<Date | undefined>(event?.event_date ? new Date(event.event_date) : undefined);
  const [location, setLocation] = useState(event?.city || "");
  const [message, setMessage] = useState("You're invited to celebrate with us! 🎉");
  const [templateId, setTemplateId] = useState("baby-blocks");
  const [showPreview, setShowPreview] = useState(false);
  const [saving, setSaving] = useState(false);

  // Load saved invite settings from event
  useEffect(() => {
    if (event) {
      if ((event as any).invite_template) setTemplateId((event as any).invite_template);
      if ((event as any).invite_title) setTitle((event as any).invite_title);
      if ((event as any).invite_message) setMessage((event as any).invite_message);
    }
  }, [event]);

  const handleSave = async () => {
    if (!event) return;
    setSaving(true);
    const { error } = await supabase.from("events").update({
      invite_template: templateId,
      invite_title: title,
      invite_message: message,
    } as any).eq("id", event.id);
    setSaving(false);
    if (error) { toast.error("Failed to save invite"); return; }
    toast.success("Invite saved!");
  };

  const TemplateComponent = templates[templateId] || templates["baby-blocks"];

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
            <div className="flex w-full justify-center">
              <div
                className="w-full overflow-hidden border border-border/60 bg-card shadow-sm"
                style={{ maxWidth: "calc(72vh * 5 / 7)" }}
              >
                <TemplateComponent title={title} eventDate={eventDate} location={location} message={message} />
              </div>
            </div>
            <Button variant="outline" className="w-full" onClick={() => setShowPreview(false)}>
              <Palette className="h-4 w-4 mr-2" /> Edit Invite
            </Button>
          </>
        ) : (
          <>
            <InviteTemplatePicker selected={templateId} onSelect={setTemplateId} />

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
                    <PopoverContent className="w-auto p-0" align="start">
                      <Calendar mode="single" selected={eventDate} onSelect={setEventDate} initialFocus className="p-3 pointer-events-auto" />
                    </PopoverContent>
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
              </CardContent>
            </Card>

            <div className="flex gap-3">
              <Button variant="outline" className="flex-1 gap-2" onClick={() => setShowPreview(true)}>
                <Eye className="h-4 w-4" /> Preview
              </Button>
              <Button className="flex-1 gap-2" onClick={handleSave} disabled={saving}>
                <Save className="h-4 w-4" /> {saving ? "Saving…" : "Save Invite"}
              </Button>
            </div>
          </>
        )}
      </div>
    </MobileLayout>
  );
};

export default InviteBuilderPage;
