import { useState, useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Sparkles, Trophy, Send } from "lucide-react";
import { MobileLayout } from "@/components/layout/MobileLayout";
import { useAuth } from "@/contexts/AuthContext";
import { useEvent } from "@/hooks/useEvent";
import { supabase } from "@/integrations/supabase/client";
import { useActivityFeed } from "@/contexts/ActivityFeedContext";
import { toast } from "sonner";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { cn } from "@/lib/utils";
import { format } from "date-fns";
import { CalendarIcon } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

interface Prediction {
  id: string;
  guest_name: string;
  predicted_date: string | null;
  predicted_gender: string | null;
  predicted_name: string | null;
  predicted_weight: string | null;
  is_winner: boolean;
  created_at: string;
}

const PredictionsPage = () => {
  const { user } = useAuth();
  const { event } = useEvent();
  const { addActivity } = useActivityFeed();
  const [predictions, setPredictions] = useState<Prediction[]>([]);
  const [loading, setLoading] = useState(true);

  // Form state
  const [guestName, setGuestName] = useState("");
  const [predictedDate, setPredictedDate] = useState<Date>();
  const [predictedGender, setPredictedGender] = useState("");
  const [predictedName, setPredictedName] = useState("");
  const [predictedWeight, setPredictedWeight] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const fetchPredictions = async () => {
    if (!event) return;
    const { data } = await supabase
      .from("predictions")
      .select("*")
      .eq("event_id", event.id)
      .order("created_at", { ascending: false });
    setPredictions((data as Prediction[]) || []);
    setLoading(false);
  };

  useEffect(() => {
    if (event) fetchPredictions();
    else setLoading(false);
  }, [event]);

  const handleSubmit = async () => {
    if (!event || !guestName.trim()) return;
    setSubmitting(true);
    const { error } = await supabase.from("predictions").insert({
      event_id: event.id,
      guest_name: guestName.trim(),
      predicted_date: predictedDate ? format(predictedDate, "yyyy-MM-dd") : null,
      predicted_gender: predictedGender || null,
      predicted_name: predictedName.trim() || null,
      predicted_weight: predictedWeight.trim() || null,
    });
    setSubmitting(false);
    if (error) { toast.error("Failed to submit prediction"); return; }
    addActivity("prediction", `${guestName.trim()} submitted a prediction!`);
    toast.success("Prediction submitted! 🎉");
    setGuestName(""); setPredictedDate(undefined); setPredictedGender(""); setPredictedName(""); setPredictedWeight("");
    fetchPredictions();
  };

  if (loading) {
    return (
      <MobileLayout>
        <div className="flex items-center justify-center min-h-[60vh]">
          <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full" />
        </div>
      </MobileLayout>
    );
  }

  return (
    <MobileLayout>
      <div className="px-6 pt-12 pb-6">
        <div className="flex items-center gap-2 mb-1">
          <Sparkles className="h-5 w-5 text-primary" />
          <h1 className="text-2xl font-bold">Prediction Portal</h1>
        </div>
        <p className="text-sm text-muted-foreground">{predictions.length} predictions submitted ✨</p>
      </div>

      <div className="px-6 pb-6">
        <Tabs defaultValue="submit">
          <TabsList className="w-full mb-4">
            <TabsTrigger value="submit" className="flex-1">Submit</TabsTrigger>
            <TabsTrigger value="leaderboard" className="flex-1">Leaderboard</TabsTrigger>
          </TabsList>

          <TabsContent value="submit">
            <Card className="border-none">
              <CardContent className="p-4 space-y-4">
                <div>
                  <h3 className="font-bold text-sm mb-1">Make Your Prediction</h3>
                  <p className="text-xs text-muted-foreground">Guess the baby's arrival details!</p>
                </div>
                <div className="space-y-1.5">
                  <Label>Your name *</Label>
                  <Input placeholder="e.g. Aunt Susan" value={guestName} onChange={(e) => setGuestName(e.target.value)} />
                </div>
                <div className="space-y-1.5">
                  <Label>Predicted due date</Label>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button variant="outline" className={cn("w-full justify-start text-left font-normal", !predictedDate && "text-muted-foreground")}>
                        <CalendarIcon className="mr-2 h-4 w-4" />{predictedDate ? format(predictedDate, "PPP") : "Pick a date"}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="start"><Calendar mode="single" selected={predictedDate} onSelect={setPredictedDate} initialFocus className="p-3 pointer-events-auto" /></PopoverContent>
                  </Popover>
                </div>
                <div className="space-y-1.5">
                  <Label>Gender prediction</Label>
                  <RadioGroup value={predictedGender} onValueChange={setPredictedGender} className="flex gap-3">
                    {[
                      { value: "boy", label: "👦 Boy" },
                      { value: "girl", label: "👧 Girl" },
                      { value: "surprise", label: "🎉 Surprise" },
                    ].map((opt) => (
                      <Label key={opt.value} htmlFor={`gender-${opt.value}`} className={cn("flex items-center gap-2 p-3 rounded-xl border-2 cursor-pointer transition-all flex-1 justify-center", predictedGender === opt.value ? "border-primary bg-primary/5" : "border-border")}>
                        <RadioGroupItem value={opt.value} id={`gender-${opt.value}`} className="sr-only" />
                        <span className="text-sm font-medium">{opt.label}</span>
                      </Label>
                    ))}
                  </RadioGroup>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <Label>Baby name guess</Label>
                    <Input placeholder="e.g. Luna" value={predictedName} onChange={(e) => setPredictedName(e.target.value)} />
                  </div>
                  <div className="space-y-1.5">
                    <Label>Weight guess</Label>
                    <Input placeholder="e.g. 7 lbs 4 oz" value={predictedWeight} onChange={(e) => setPredictedWeight(e.target.value)} />
                  </div>
                </div>
                <Button className="w-full gap-2" onClick={handleSubmit} disabled={!guestName.trim() || submitting}>
                  <Send className="h-4 w-4" /> {submitting ? "Submitting..." : "Submit Prediction"}
                </Button>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="leaderboard">
            <div className="space-y-3">
              {predictions.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-8">No predictions yet — be the first!</p>
              ) : (
                predictions.map((p, i) => (
                  <Card key={p.id} className="border-none">
                    <CardContent className="p-4 flex items-start gap-3">
                      <div className={cn("w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm shrink-0", i < 3 ? "bg-primary/20 text-primary" : "bg-muted text-muted-foreground")}>
                        {i < 3 ? <Trophy className="h-4 w-4" /> : i + 1}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <p className="font-semibold text-sm">{p.guest_name}</p>
                          {p.is_winner && <Badge className="bg-mint text-mint-foreground text-[10px] border-none">Winner!</Badge>}
                        </div>
                        <div className="flex flex-wrap gap-2 mt-1">
                          {p.predicted_date && <Badge variant="secondary" className="text-[10px]">📅 {new Date(p.predicted_date).toLocaleDateString()}</Badge>}
                          {p.predicted_gender && <Badge variant="secondary" className="text-[10px]">{p.predicted_gender === "boy" ? "👦" : p.predicted_gender === "girl" ? "👧" : "🎉"} {p.predicted_gender}</Badge>}
                          {p.predicted_name && <Badge variant="secondary" className="text-[10px]">👶 {p.predicted_name}</Badge>}
                          {p.predicted_weight && <Badge variant="secondary" className="text-[10px]">⚖️ {p.predicted_weight}</Badge>}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))
              )}
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </MobileLayout>
  );
};

export default PredictionsPage;
