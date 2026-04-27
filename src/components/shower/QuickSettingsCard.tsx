import { Card, CardContent } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Settings, ChevronRight } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { EventData, useActiveEvent } from "@/contexts/ActiveEventContext";
import { toast } from "sonner";

export const QuickSettingsCard = ({ event }: { event: EventData }) => {
  const navigate = useNavigate();
  const { refetch } = useActiveEvent();
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

  return (
    <Card className="border-none">
      <CardContent className="p-4 space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-bold">Quick Settings</h2>
          <Settings className="h-4 w-4 text-muted-foreground" />
        </div>

        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium">Surprise mode</p>
            <p className="text-[11px] text-muted-foreground">Hide details from honoree</p>
          </div>
          <Switch
            checked={!!event.surprise_mode}
            disabled={saving}
            onCheckedChange={(v) => update({ surprise_mode: v })}
          />
        </div>

        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium">Private registry</p>
            <p className="text-[11px] text-muted-foreground">Only invited guests can view</p>
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

        <Button
          variant="ghost"
          className="w-full justify-between h-10 rounded-xl px-3"
          onClick={() => navigate("/setup/shower")}
        >
          <span className="text-sm">More settings</span>
          <ChevronRight className="h-4 w-4" />
        </Button>
      </CardContent>
    </Card>
  );
};
