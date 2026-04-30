import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Send, Pencil } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { EventData } from "@/contexts/ActiveEventContext";
import ShareInviteButton from "@/components/ShareInviteButton";

interface Props {
  event: EventData;
  /** When the invite is ready and there are guests still to invite, this is
   *  the host's primary next step. Drives which button gets the filled
   *  treatment. */
  unsentInviteCount?: number;
}

export const InvitationOptionsCard = ({ event, unsentInviteCount = 0 }: Props) => {
  const navigate = useNavigate();
  const ready = !!event.invite_image_url;
  // "Send" is primary when invite is designed AND there are guests waiting.
  // Otherwise the primary action is to design the invite.
  const sendIsPrimary = ready && unsentInviteCount > 0;

  return (
    <Card className="border-none">
      <CardContent className="p-4">
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-sm font-bold">Invitation</h2>
          {ready && unsentInviteCount > 0 && (
            <span className="text-[10px] font-bold uppercase tracking-wider text-primary bg-primary/10 px-2 py-0.5 rounded-full">
              {unsentInviteCount} to send
            </span>
          )}
        </div>
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
              {!ready
                ? "Design an invitation to send to your guests."
                : sendIsPrimary
                ? `Your invite is ready — send it to ${unsentInviteCount} guest${
                    unsentInviteCount === 1 ? "" : "s"
                  }.`
                : "Your invitation is ready to share."}
            </p>
            <div className="flex flex-col gap-1.5">
              {sendIsPrimary ? (
                <>
                  <Button
                    size="sm"
                    className="rounded-md h-9 text-xs justify-start font-semibold"
                    onClick={() => navigate("/guests")}
                  >
                    <Send className="h-3.5 w-3.5 mr-1.5" />
                    Send to guests
                  </Button>
                  <div className="flex gap-1.5">
                    <Button
                      size="sm"
                      variant="outline"
                      className="rounded-md h-8 text-xs flex-1 justify-center"
                      onClick={() => navigate("/invites")}
                    >
                      <Pencil className="h-3 w-3 mr-1" />
                      Edit
                    </Button>
                    <ShareInviteButton />
                  </div>
                </>
              ) : (
                <>
                  <Button
                    size="sm"
                    className="rounded-md h-9 text-xs justify-start font-semibold"
                    onClick={() => navigate("/invites")}
                  >
                    <Pencil className="h-3.5 w-3.5 mr-1.5" />
                    {ready ? "Edit invite" : "Design invite"}
                  </Button>
                  {ready && (
                    <div className="flex gap-1.5">
                      <Button
                        size="sm"
                        variant="outline"
                        className="rounded-md h-8 text-xs flex-1 justify-center"
                        onClick={() => navigate("/guests")}
                      >
                        <Send className="h-3 w-3 mr-1" />
                        Send
                      </Button>
                      <ShareInviteButton />
                    </div>
                  )}
                </>
              )}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
