import { useState, useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Sparkles, Trophy, Send, PartyPopper } from "lucide-react";
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

  // Reveal state
  const [actualDate, setActualDate] = useState<Date>();
  const [actualGender, setActualGender] = useState("");
  const [actualName, setActualName] = useState("");
  const [actualWeight, setActualWeight] = useState("");
  const [revealed, setRevealed] = useState(false);
  const [revealing, setRevealing] = useState(false);
  const [confetti, setConfetti] = useState(false);

  const fetchPredictions = async () => {
    if (!event) return;
    const { data } = await supabase
      .from("predictions")
      .select("*")
      .eq("event_id", event.id)
      .order("created_at", { ascending: false });
    setPredictions((data as Prediction[]) || []);
    const hasWinner = (data || []).some((p: any) => p.is_winner);
    setRevealed(hasWinner);
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

  const handleReveal = async () => {
    if (!event || predictions.length === 0) return;
    setRevealing(true);

    // Score predictions
    const scored = predictions.map((p) => {
      let score = 0;
      if (actualGender && p.predicted_gender === actualGender) score += 3;
      if (actualName && p.predicted_name?.toLowerCase() === actualName.toLowerCase()) score += 3;
      if (actualDate && p.predicted_date) {
        const diff = Math.abs(new Date(p.predicted_date).getTime() - actualDate.getTime());
        const daysDiff = diff / (1000 * 60 * 60 * 24);
        if (daysDiff === 0) score += 5;
        else if (daysDiff <= 3) score += 3;
        else if (daysDiff <= 7) score += 1;
      }
      if (actualWeight && p.predicted_weight === actualWeight) score += 2;
      return { ...p, score };
    });

    scored.sort((a, b) => b.score - a.score);
    const topScore = scored[0]?.score || 0;
    const winners = scored.filter((s) => s.score === topScore && topScore > 0);

    // Mark winners
    for (const w of winners) {
      await supabase.from("predictions").update({ is_winner: true }).eq("id", w.id);
    }

    setRevealing(false);
    setConfetti(true);
    setRevealed(true);
    setTimeout(() => setConfetti(false), 4000);
    addActivity("prediction", `Results revealed! ${winners.length} winner(s)! 🎉`);
    toast.success(`🎉 ${winners.length} winner(s) selected!`);
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

  const winners = predictions.filter((p) => p.is_winner);

  return (
    <MobileLayout>
      {confetti && (
        <div className="fixed inset-0 pointer-events-none z-50 flex items-center justify-center">
          <div className="text-6xl animate-bounce">🎉🎊🥳</div>
        </div>
      )}
      <div className="px-6 pt-12 pb-6">
        <div className="flex items-center gap-2 mb-1">
          <Sparkles className="h-5 w-5 text-primary" />
          <h1 className="text-2xl font-bold">Guess & Win</h1>
        </div>
        <p className="text-sm text-muted-foreground">{predictions.length} predictions submitted ✨</p>
      </div>

      <div className="px-6 pb-6">
        <Tabs defaultValue="submit">
          <TabsList className="w-full mb-4">
            <TabsTrigger value="submit" className="flex-1">Submit</TabsTrigger>
            <TabsTrigger value="leaderboard" className="flex-1">Leaderboard</TabsTrigger>
            <TabsTrigger value="results" className="flex-1">Results</TabsTrigger>
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
                  <Card key={p.id} className={cn("border-none", p.is_winner && "ring-2 ring-primary")}>
                    <CardContent className="p-4 flex items-start gap-3">
                      <div className={cn("w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm shrink-0", p.is_winner ? "bg-primary text-primary-foreground" : i < 3 ? "bg-primary/20 text-primary" : "bg-muted text-muted-foreground")}>
                        {p.is_winner ? <Trophy className="h-4 w-4" /> : i < 3 ? <Trophy className="h-4 w-4" /> : i + 1}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <p className="font-semibold text-sm">{p.guest_name}</p>
                          {p.is_winner && <Badge className="bg-primary text-primary-foreground text-[10px] border-none">🏆 Winner!</Badge>}
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

          <TabsContent value="results">
            {revealed && winners.length > 0 ? (
              <div className="space-y-4">
                <Card className="border-none bg-gradient-to-br from-primary/20 via-background to-primary/10">
                  <CardContent className="p-6 text-center">
                    <PartyPopper className="h-10 w-10 text-primary mx-auto mb-2" />
                    <h3 className="text-lg font-bold mb-1">🎉 Winners Revealed!</h3>
                    <p className="text-sm text-muted-foreground mb-4">{winners.length} winner{winners.length > 1 ? "s" : ""} selected</p>
                    {winners.map((w) => (
                      <div key={w.id} className="bg-card rounded-xl p-4 mb-2">
                        <p className="font-bold text-primary">{w.guest_name}</p>
                        <div className="flex flex-wrap gap-2 mt-1 justify-center">
                          {w.predicted_date && <Badge variant="secondary" className="text-[10px]">📅 {new Date(w.predicted_date).toLocaleDateString()}</Badge>}
                          {w.predicted_gender && <Badge variant="secondary" className="text-[10px]">{w.predicted_gender === "boy" ? "👦" : "👧"} {w.predicted_gender}</Badge>}
                          {w.predicted_name && <Badge variant="secondary" className="text-[10px]">👶 {w.predicted_name}</Badge>}
                          {w.predicted_weight && <Badge variant="secondary" className="text-[10px]">⚖️ {w.predicted_weight}</Badge>}
                        </div>
                      </div>
                    ))}
                  </CardContent>
                </Card>
              </div>
            ) : (
              <Card className="border-none">
                <CardContent className="p-4 space-y-4">
                  <div>
                    <h3 className="font-bold text-sm mb-1">Enter Actual Results</h3>
                    <p className="text-xs text-muted-foreground">Fill in the real details and reveal the winner!</p>
                  </div>
                  <div className="space-y-1.5">
                    <Label>Actual birth date</Label>
                    <Popover>
                      <PopoverTrigger asChild>
                        <Button variant="outline" className={cn("w-full justify-start text-left font-normal", !actualDate && "text-muted-foreground")}>
                          <CalendarIcon className="mr-2 h-4 w-4" />{actualDate ? format(actualDate, "PPP") : "Pick a date"}
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0" align="start"><Calendar mode="single" selected={actualDate} onSelect={setActualDate} initialFocus className="p-3 pointer-events-auto" /></PopoverContent>
                    </Popover>
                  </div>
                  <div className="space-y-1.5">
                    <Label>Actual gender</Label>
                    <RadioGroup value={actualGender} onValueChange={setActualGender} className="flex gap-3">
                      {[{ value: "boy", label: "👦 Boy" }, { value: "girl", label: "👧 Girl" }].map((opt) => (
                        <Label key={opt.value} htmlFor={`actual-${opt.value}`} className={cn("flex items-center gap-2 p-3 rounded-xl border-2 cursor-pointer transition-all flex-1 justify-center", actualGender === opt.value ? "border-primary bg-primary/5" : "border-border")}>
                          <RadioGroupItem value={opt.value} id={`actual-${opt.value}`} className="sr-only" />
                          <span className="text-sm font-medium">{opt.label}</span>
                        </Label>
                      ))}
                    </RadioGroup>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1.5">
                      <Label>Baby's name</Label>
                      <Input placeholder="e.g. Luna" value={actualName} onChange={(e) => setActualName(e.target.value)} />
                    </div>
                    <div className="space-y-1.5">
                      <Label>Birth weight</Label>
                      <Input placeholder="e.g. 7 lbs 4 oz" value={actualWeight} onChange={(e) => setActualWeight(e.target.value)} />
                    </div>
                  </div>
                  <Button className="w-full gap-2" onClick={handleReveal} disabled={predictions.length === 0 || revealing}>
                    <PartyPopper className="h-4 w-4" /> {revealing ? "Calculating..." : "Reveal Winners! 🎉"}
                  </Button>
                  {predictions.length === 0 && <p className="text-xs text-muted-foreground text-center">No predictions to judge yet.</p>}
                </CardContent>
              </Card>
            )}
          </TabsContent>
        </Tabs>
      </div>
    </MobileLayout>
  );
};

export default PredictionsPage;
