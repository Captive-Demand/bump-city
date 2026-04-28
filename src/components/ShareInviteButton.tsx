import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useEvent } from "@/hooks/useEvent";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Share2, Copy, Check } from "lucide-react";
import { toast } from "sonner";

const INVITE_BASE_URL = "https://bumpcity.testyour.app";

const ShareInviteButton = () => {
  const { user } = useAuth();
  const { event } = useEvent();
  const [inviteUrl, setInviteUrl] = useState("");
  const [loading, setLoading] = useState(false);
  const [copied, setCopied] = useState(false);
  const [open, setOpen] = useState(false);

  const generateInvite = async () => {
    if (!user || !event) return;
    setLoading(true);

    // Check for existing code
    const { data: existing } = await supabase
      .from("invite_codes")
      .select("code")
      .eq("event_id", event.id)
      .eq("created_by", user.id)
      .maybeSingle();

    if (existing) {
      setInviteUrl(`${window.location.origin}/join?code=${existing.code}`);
      setLoading(false);
      return;
    }

    // Generate a short random code
    const code = Math.random().toString(36).substring(2, 8).toUpperCase();
    const { error } = await supabase.from("invite_codes").insert({
      event_id: event.id,
      code,
      created_by: user.id,
    });

    if (error) {
      toast.error("Failed to create invite link");
      setLoading(false);
      return;
    }

    setInviteUrl(`${INVITE_BASE_URL}/join?code=${code}`);
    setLoading(false);
  };

  const copyLink = async () => {
    await navigator.clipboard.writeText(inviteUrl);
    setCopied(true);
    toast.success("Invite link copied!");
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <Dialog open={open} onOpenChange={(v) => { setOpen(v); if (v && !inviteUrl) generateInvite(); }}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm" className="gap-1.5">
          <Share2 className="h-3.5 w-3.5" /> Share Invite
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Share Invite Link</DialogTitle>
        </DialogHeader>
        <p className="text-sm text-muted-foreground">Share this link with guests so they can join your baby shower, view the registry, RSVP, and make predictions.</p>
        <div className="flex gap-2 mt-2">
          <Input value={inviteUrl || "Generating..."} readOnly className="text-sm" />
          <Button size="icon" variant="outline" onClick={copyLink} disabled={!inviteUrl}>
            {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default ShareInviteButton;
