import { useState, useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Sparkles, Trophy, Send, PartyPopper, Timer, Users, Gift } from "lucide-react";
import { MobileLayout } from "@/components/layout/MobileLayout";
import { useAuth } from "@/contexts/AuthContext";
import { useEvent } from "@/hooks/useEvent";
import { useEventRole } from "@/hooks/useEventRole";
import { supabase } from "@/integrations/supabase/client";
import { useActivityFeed } from "@/contexts/ActivityFeedContext";
import { toast } from "sonner";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { cn } from "@/lib/utils";
import { format } from "date-fns";
import { CalendarIcon } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import guessWinHero from "@/assets/guess-win-hero.jpg";

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
  const { isHost, isAdmin } = useEventRole();
  const canHost = isHost || isAdmin;
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

  const [categoryWinners, setCategoryWinners] = useState<{
    date: Prediction[];
    gender: Prediction[];
    name: Prediction[];
    weight: Prediction[];
  }>({ date: [], gender: [], name: [], weight: [] });

  const handleReveal = async () => {
    if (!event || predictions.length === 0) return;
    setRevealing(true);

    // Closest date wins
    let dateWinners: Prediction[] = [];
    if (actualDate) {
      const withDates = predictions.filter((p) => p.predicted_date);
      if (withDates.length > 0) {
        const diffs = withDates.map((p) => ({
          p,
          diff: Math.abs(new Date(p.predicted_date!).getTime() - actualDate.getTime()),
        }));
        const minDiff = Math.min(...diffs.map((d) => d.diff));
        dateWinners = diffs.filter((d) => d.diff === minDiff).map((d) => d.p);
      }
    }

    // Exact gender match wins
    const genderWinners = actualGender
      ? predictions.filter((p) => p.predicted_gender === actualGender)
      : [];

    // Exact name match (case-insensitive) wins
    const nameWinners = actualName
      ? predictions.filter((p) => p.predicted_name?.trim().toLowerCase() === actualName.trim().toLowerCase())
      : [];

    // Closest weight wins (parse "X lbs Y oz" -> total ounces)
    const parseWeight = (w: string): number | null => {
      const lbs = w.match(/(\d+(?:\.\d+)?)\s*lb/i);
      const oz = w.match(/(\d+(?:\.\d+)?)\s*oz/i);
      if (!lbs && !oz) {
        const num = parseFloat(w);
        return isNaN(num) ? null : num * 16;
      }
      return (lbs ? parseFloat(lbs[1]) * 16 : 0) + (oz ? parseFloat(oz[1]) : 0);
    };
    let weightWinners: Prediction[] = [];
    if (actualWeight) {
      const targetOz = parseWeight(actualWeight);
      if (targetOz !== null) {
        const withWeights = predictions
          .map((p) => ({ p, oz: p.predicted_weight ? parseWeight(p.predicted_weight) : null }))
          .filter((x) => x.oz !== null) as { p: Prediction; oz: number }[];
        if (withWeights.length > 0) {
          const diffs = withWeights.map((x) => ({ p: x.p, diff: Math.abs(x.oz - targetOz) }));
          const minDiff = Math.min(...diffs.map((d) => d.diff));
          weightWinners = diffs.filter((d) => d.diff === minDiff).map((d) => d.p);
        }
      }
    }

    setCategoryWinners({ date: dateWinners, gender: genderWinners, name: nameWinners, weight: weightWinners });

    // Mark anyone who won at least one category
    const allWinnerIds = new Set([
      ...dateWinners.map((p) => p.id),
      ...genderWinners.map((p) => p.id),
      ...nameWinners.map((p) => p.id),
      ...weightWinners.map((p) => p.id),
    ]);
    for (const id of allWinnerIds) {
      await supabase.from("predictions").update({ is_winner: true }).eq("id", id);
    }

    setRevealing(false);
    setConfetti(true);
    setRevealed(true);
    setTimeout(() => setConfetti(false), 4000);
    addActivity("prediction", `Results revealed! ${allWinnerIds.size} winner(s)! 🎉`);
    toast.success(`🎉 ${allWinnerIds.size} winner(s) across ${[dateWinners, genderWinners, nameWinners, weightWinners].filter((w) => w.length > 0).length} categories!`);
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
                  <p className="text-xs text-muted-foreground">Win a prize in any category — date, gender, name, or weight! 🏆</p>
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
                    <p className="text-sm text-muted-foreground">A prize for every category 🏆</p>
                  </CardContent>
                </Card>

                {[
                  { key: "date", label: "Closest Due Date", icon: "📅", winners: categoryWinners.date, getValue: (p: Prediction) => p.predicted_date ? new Date(p.predicted_date).toLocaleDateString() : "" },
                  { key: "gender", label: "Gender Guess", icon: "👶", winners: categoryWinners.gender, getValue: (p: Prediction) => p.predicted_gender || "" },
                  { key: "name", label: "Name Guess", icon: "✨", winners: categoryWinners.name, getValue: (p: Prediction) => p.predicted_name || "" },
                  { key: "weight", label: "Closest Weight", icon: "⚖️", winners: categoryWinners.weight, getValue: (p: Prediction) => p.predicted_weight || "" },
                ].filter((cat) => cat.winners.length > 0).map((cat) => (
                  <Card key={cat.key} className="border-none">
                    <CardContent className="p-4">
                      <div className="flex items-center gap-2 mb-3">
                        <span className="text-lg">{cat.icon}</span>
                        <h4 className="font-bold text-sm">{cat.label}</h4>
                        <Badge className="bg-primary text-primary-foreground text-[10px] border-none ml-auto">
                          🏆 {cat.winners.length} winner{cat.winners.length > 1 ? "s" : ""}
                        </Badge>
                      </div>
                      <div className="space-y-2">
                        {cat.winners.map((w) => (
                          <div key={w.id} className="bg-primary/5 rounded-xl p-3 flex items-center justify-between">
                            <p className="font-semibold text-sm text-primary">{w.guest_name}</p>
                            <Badge variant="secondary" className="text-[10px]">{cat.getValue(w)}</Badge>
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : canHost ? (
              <Card className="border-none">
                <CardContent className="p-4 space-y-4">
                  <div>
                    <h3 className="font-bold text-sm mb-1">Host Controls — Enter Actual Results</h3>
                    <p className="text-xs text-muted-foreground">Fill in the real details and reveal the winners!</p>
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
            ) : (
              <Card className="border-none">
                <CardContent className="p-6 text-center space-y-2">
                  <Sparkles className="h-8 w-8 text-primary mx-auto" />
                  <h3 className="font-bold text-sm">Results Coming Soon</h3>
                  <p className="text-xs text-muted-foreground">The host will reveal the winners once the baby arrives!</p>
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
