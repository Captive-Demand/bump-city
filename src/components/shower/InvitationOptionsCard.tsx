import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Send, Pencil } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { EventData } from "@/contexts/ActiveEventContext";
import ShareInviteButton from "@/components/ShareInviteButton";

export const InvitationOptionsCard = ({ event }: { event: EventData }) => {
  const navigate = useNavigate();

  return (
    <Card className="border-none">
      <CardContent className="p-4">
        <h2 className="text-sm font-bold mb-3">Invitation</h2>
        <div className="flex gap-3">
          <div className="w-20 h-28 rounded-xl overflow-hidden bg-gradient-to-br from-peach/30 to-lavender/30 shrink-0">
            {event.invite_image_url ? (
              <img src={event.invite_image_url} alt="Invite" className="w-full h-full object-cover" />
            ) : (
              <div className="w-full h-full flex items-center justify-center text-2xl">💌</div>
            )}
          </div>
          <div className="flex-1 min-w-0 flex flex-col justify-between gap-2">
            <p className="text-xs text-muted-foreground leading-snug">
              {event.invite_image_url
                ? "Your invitation is ready to share."
                : "Design an invitation to send to your guests."}
            </p>
            <div className="flex flex-col gap-1.5">
              <Button
                size="sm"
                className="rounded-lg h-8 text-xs justify-start"
                onClick={() => navigate("/invites")}
              >
                <Pencil className="h-3 w-3 mr-1" />
                {event.invite_image_url ? "Edit invite" : "Design invite"}
              </Button>
              <Button
                size="sm"
                variant="outline"
                className="rounded-lg h-8 text-xs justify-start"
                onClick={() => navigate("/guests")}
              >
                <Send className="h-3 w-3 mr-1" />
                Send to guests
              </Button>
              <ShareInviteButton />
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
