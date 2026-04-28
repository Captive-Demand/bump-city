import { useEffect } from "react";
import { useNavigate, useParams, Navigate } from "react-router-dom";
import { ChevronLeft, Trash2, Send, Users, Gift, Calendar, MapPin, Sparkles } from "lucide-react";
import { MobileLayout } from "@/components/layout/MobileLayout";
import { useActiveEvent } from "@/contexts/ActiveEventContext";
import { useEventRole } from "@/hooks/useEventRole";
import { ShowerHero } from "@/components/shower/ShowerHero";
import { QuickSettingsCard } from "@/components/shower/QuickSettingsCard";
import { InvitationOptionsCard } from "@/components/shower/InvitationOptionsCard";
import { ManageTilesGrid } from "@/components/shower/ManageTilesGrid";
import { HowItWorks } from "@/components/home/HowItWorks";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

const ShowerDetailPage = () => {
  const { eventId } = useParams<{ eventId: string }>();
  const navigate = useNavigate();
  const { allEvents, activeEvent, switchEvent, loading, refetch } = useActiveEvent();

  useEffect(() => {
    if (eventId && eventId !== activeEvent?.id) {
      switchEvent(eventId);
    }
  }, [eventId, activeEvent?.id, switchEvent]);

  if (loading) {
    return (
      <MobileLayout>
        <div className="flex items-center justify-center min-h-[60vh]">
          <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full" />
        </div>
      </MobileLayout>
    );
  }

  const event = allEvents.find((e) => e.id === eventId);
  if (!event) return <Navigate to="/showers" replace />;

  const handleDelete = async () => {
    const { error } = await supabase.from("events").delete().eq("id", event.id);
    if (error) {
      toast.error("Failed to delete shower");
      return;
    }
    toast.success("Shower deleted");
    await refetch();
    navigate("/showers");
  };

  return (
    <MobileLayout>
      <div className="px-6 pt-10 pb-4">
        <button
          onClick={() => navigate("/showers")}
          className="flex items-center gap-1 text-sm text-muted-foreground mb-4 hover:text-foreground"
        >
          <ChevronLeft className="h-4 w-4" /> Showers
        </button>
        <ShowerHero event={event} />
      </div>

      <div className="px-6 pb-8 space-y-6">
        <HowItWorks
          title="Get this shower ready"
          storageKey={`bump_city_how_it_works_shower_${event.id}_dismissed`}
          steps={[
            { number: 1, icon: Send, title: "Customize your invite", description: "Pick a template and add your details." },
            { number: 2, icon: Users, title: "Add your guests", description: "Import contacts and send invitations." },
            { number: 3, icon: Gift, title: "Build your registry", description: "Add gifts you'd love to receive." },
          ]}
        />

        <InvitationOptionsCard event={event} />
        <QuickSettingsCard event={event} />
        <ManageTilesGrid eventId={event.id} city={event.city} />

        <AlertDialog>
          <AlertDialogTrigger asChild>
            <Button variant="outline" className="w-full h-11 rounded-xl text-destructive border-destructive/30 hover:bg-destructive/5">
              <Trash2 className="h-4 w-4 mr-2" />
              Delete this shower
            </Button>
          </AlertDialogTrigger>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Delete this shower?</AlertDialogTitle>
              <AlertDialogDescription>
                This will permanently remove the shower and all its associated guests, registry items, and invites. This cannot be undone.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction onClick={handleDelete} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
                Delete
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </MobileLayout>
  );
};

export default ShowerDetailPage;
