import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Settings, ChevronRight, Trash2 } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { EventData, useActiveEvent } from "@/contexts/ActiveEventContext";
import { toast } from "sonner";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

interface Props {
  event: EventData;
}

/**
 * Single settings surface for the shower page. Replaces the inline
 * "Quick Settings" card + the floating "More settings" link + the bottom
 * "Delete this shower" button — all of which fragmented the page.
 */
export const ShowerSettingsSheet = ({ event }: Props) => {
  const navigate = useNavigate();
  const { refetch } = useActiveEvent();
  const [open, setOpen] = useState(false);
  const [saving, setSaving] = useState(false);

  const update = async (patch: Partial<EventData>) => {
    setSaving(true);
    const { error } = await supabase.from("events").update(patch).eq("id", event.id);
    setSaving(false);
    if (error) {
      toast.error("Failed to update");
      return;
    }
    toast.success("Saved");
    refetch();
  };

  const handleDelete = async () => {
    const { error } = await supabase.from("events").delete().eq("id", event.id);
    if (error) {
      toast.error("Failed to delete shower");
      return;
    }
    toast.success("Shower deleted");
    setOpen(false);
    await refetch();
    navigate("/showers");
  };

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <Button variant="outline" className="w-full h-11 rounded-xl gap-2 justify-between">
          <span className="flex items-center gap-2">
            <Settings className="h-4 w-4" />
            Shower settings
          </span>
          <ChevronRight className="h-4 w-4 text-muted-foreground" />
        </Button>
      </SheetTrigger>
      <SheetContent side="right" className="w-full sm:max-w-md overflow-y-auto">
        <SheetHeader className="text-left">
          <SheetTitle>Shower settings</SheetTitle>
          <SheetDescription>Privacy, gift policy, and more.</SheetDescription>
        </SheetHeader>

        <div className="space-y-6 py-6">
          <div className="space-y-4">
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <p className="text-sm font-medium">Surprise mode</p>
                <p className="text-xs text-muted-foreground">Hide details from honoree</p>
              </div>
              <Switch
                checked={!!event.surprise_mode}
                disabled={saving}
                onCheckedChange={(v) => update({ surprise_mode: v })}
              />
            </div>

            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <p className="text-sm font-medium">Private registry</p>
                <p className="text-xs text-muted-foreground">Only invited guests can view</p>
              </div>
              <Switch
                checked={!!event.registry_private}
                disabled={saving}
                onCheckedChange={(v) => update({ registry_private: v })}
              />
            </div>

            <div>
              <p className="text-sm font-medium mb-1.5">Gift policy</p>
              <Select
                value={event.gift_policy || "bring-gift"}
                onValueChange={(v) => update({ gift_policy: v })}
              >
                <SelectTrigger className="h-9 rounded-xl">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="bring-gift">Bring a gift</SelectItem>
                  <SelectItem value="registry-only">Registry only</SelectItem>
                  <SelectItem value="no-gifts">No gifts please</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <Button
            variant="ghost"
            className="w-full justify-between h-10 rounded-xl px-3"
            onClick={() => {
              setOpen(false);
              navigate(`/setup/shower?eventId=${event.id}`);
            }}
          >
            <span className="text-sm">Edit all shower details</span>
            <ChevronRight className="h-4 w-4" />
          </Button>

          <div className="pt-4 border-t border-border/60">
            <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground mb-2">
              Danger zone
            </p>
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button
                  variant="outline"
                  className="w-full h-10 rounded-xl text-destructive border-destructive/30 hover:bg-destructive/5"
                >
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
                  <AlertDialogAction
                    onClick={handleDelete}
                    className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                  >
                    Delete
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
};
