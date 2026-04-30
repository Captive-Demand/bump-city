import { useState, useEffect, useMemo } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import {
  Sparkles,
  Trophy,
  Send,
  PartyPopper,
  Users,
  ChevronLeft,
  Calendar as CalendarIcon,
  Scale,
  Baby,
  Pencil,
  Trash2,
  Clock,
  CheckCircle2,
  Share2,
  type LucideIcon,
} from "lucide-react";
import { MobileLayout } from "@/components/layout/MobileLayout";
import { PageLoader } from "@/components/PageLoader";
import { useNavigate } from "react-router-dom";
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
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
  user_id: string | null;
}

type Gender = "boy" | "girl" | "surprise";

const GENDER_OPTIONS: { value: Gender; label: string; tone: string }[] = [
  { value: "boy", label: "Boy", tone: "border-sky-300 bg-sky-50" },
  { value: "girl", label: "Girl", tone: "border-rose-300 bg-rose-50" },
  { value: "surprise", label: "Surprise!", tone: "border-amber-300 bg-amber-50" },
];

/** Parse a stored weight string like "7 lbs 4 oz" into the two numeric fields. */
const parseWeightString = (s: string | null | undefined): { lbs: string; oz: string } => {
  if (!s) return { lbs: "", oz: "" };
  const lbsMatch = s.match(/(\d+(?:\.\d+)?)\s*lb/i);
  const ozMatch = s.match(/(\d+(?:\.\d+)?)\s*oz/i);
  if (lbsMatch || ozMatch) {
    return { lbs: lbsMatch?.[1] || "", oz: ozMatch?.[1] || "" };
  }
  // Bare number = treat as lbs (back-compat with older entries)
  const bare = parseFloat(s);
  return isNaN(bare) ? { lbs: "", oz: "" } : { lbs: String(bare), oz: "" };
};

/** Build the canonical "X lbs Y oz" string from the two inputs (skips zeros). */
const formatWeight = (lbs: string, oz: string): string | null => {
  const lbsNum = lbs.trim() ? parseFloat(lbs) : NaN;
  const ozNum = oz.trim() ? parseFloat(oz) : NaN;
  const parts: string[] = [];
  if (!isNaN(lbsNum) && lbsNum > 0) parts.push(`${lbsNum} lbs`);
  if (!isNaN(ozNum) && ozNum > 0) parts.push(`${ozNum} oz`);
  return parts.length === 0 ? null : parts.join(" ");
};

/** Avatar initials helper — same convention used elsewhere on the app. */
const initialsOf = (name: string): string =>
  name
    .split(" ")
    .map((n) => n[0])
    .filter(Boolean)
    .slice(0, 2)
    .join("");

const PredictionsPage = () => {
  const navigate = useNavigate();
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
  const [predictedGender, setPredictedGender] = useState<Gender | "">("");
  const [predictedName, setPredictedName] = useState("");
  const [predictedWeightLbs, setPredictedWeightLbs] = useState("");
  const [predictedWeightOz, setPredictedWeightOz] = useState("");
  const [submitting, setSubmitting] = useState(false);

  // Reveal state
  const [actualDate, setActualDate] = useState<Date>();
  const [actualGender, setActualGender] = useState<Gender | "">("");
  const [actualName, setActualName] = useState("");
  const [actualWeightLbs, setActualWeightLbs] = useState("");
  const [actualWeightOz, setActualWeightOz] = useState("");
  const [revealed, setRevealed] = useState(false);
  const [revealing, setRevealing] = useState(false);
  const [confetti, setConfetti] = useState(false);
  const [gameOpen, setGameOpen] = useState(false);
  const [editing, setEditing] = useState(false);

  // Guest count for the "% of guests played" stat — fetched once with predictions.
  const [guestCount, setGuestCount] = useState(0);

  // The user's own prediction, if any. Drives the "you already played" UX.
  const myPrediction = useMemo<Prediction | null>(() => {
    if (!user) return null;
    // Primary match: user_id (post-migration). Fallback: case-insensitive
    // display_name match for events where the migration hasn't been applied yet.
    const byUserId = predictions.find((p) => p.user_id === user.id);
    if (byUserId) return byUserId;
    const dn = (user.user_metadata?.display_name || "").trim().toLowerCase();
    if (!dn) return null;
    return (
      predictions.find((p) => p.guest_name.trim().toLowerCase() === dn) || null
    );
  }, [predictions, user]);

  const fetchAll = async () => {
    if (!event) return;
    // `select("*")` so the page works even before the user_id migration lands.
    const [{ data: preds }, { data: guests }] = await Promise.all([
      supabase
        .from("predictions")
        .select("*")
        .eq("event_id", event.id)
        .order("created_at", { ascending: false }),
      supabase.from("guests").select("id").eq("event_id", event.id),
    ]);
    setPredictions((preds as unknown as Prediction[]) || []);
    setGuestCount(guests?.length ?? 0);
    const hasWinner = (preds || []).some((p: any) => p.is_winner);
    setRevealed(hasWinner);
    setLoading(false);
  };

  useEffect(() => {
    if (event) fetchAll();
    else setLoading(false);
  }, [event]);

  // Auto-fill the guest name from auth (only if the user isn't editing an
  // existing prediction — otherwise we let the existing name stand).
  useEffect(() => {
    if (myPrediction) {
      setGuestName(myPrediction.guest_name);
      setPredictedDate(
        myPrediction.predicted_date
          ? new Date(myPrediction.predicted_date)
          : undefined
      );
      setPredictedGender((myPrediction.predicted_gender as Gender) || "");
      setPredictedName(myPrediction.predicted_name || "");
      const w = parseWeightString(myPrediction.predicted_weight);
      setPredictedWeightLbs(w.lbs);
      setPredictedWeightOz(w.oz);
    } else if (user && !guestName) {
      const dn = user.user_metadata?.display_name as string | undefined;
      if (dn) setGuestName(dn);
    }
  }, [myPrediction, user]);

  const resetForm = () => {
    setGuestName(user?.user_metadata?.display_name || "");
    setPredictedDate(undefined);
    setPredictedGender("");
    setPredictedName("");
    setPredictedWeightLbs("");
    setPredictedWeightOz("");
  };

  const handleSubmit = async () => {
    if (!event || !guestName.trim()) return;
    setSubmitting(true);

    const payload: Record<string, unknown> = {
      event_id: event.id,
      guest_name: guestName.trim(),
      predicted_date: predictedDate ? format(predictedDate, "yyyy-MM-dd") : null,
      predicted_gender: predictedGender || null,
      predicted_name: predictedName.trim() || null,
      predicted_weight: formatWeight(predictedWeightLbs, predictedWeightOz),
    };
    if (user) payload.user_id = user.id;

    let error;
    if (myPrediction) {
      // Update existing — keeps the same id so winners stay attached.
      const { error: e } = await supabase
        .from("predictions")
        .update(payload as any) // eslint-disable-line @typescript-eslint/no-explicit-any
        .eq("id", myPrediction.id);
      error = e;
    } else {
      const { error: e } = await supabase
        .from("predictions")
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        .insert(payload as any);
      error = e;
    }

    setSubmitting(false);
    if (error) {
      toast.error("Failed to save prediction");
      return;
    }
    addActivity(
      "prediction",
      myPrediction
        ? `${guestName.trim()} updated their prediction`
        : `${guestName.trim()} submitted a prediction!`
    );
    toast.success(myPrediction ? "Prediction updated!" : "Prediction submitted!");
    setEditing(false);
    fetchAll();
  };

  const handleShareGame = async () => {
    if (!event) return;
    const url = `${window.location.origin}/event/${event.id}`;
    const honoree = event.honoree_name || "the";
    const text = `Make your prediction for ${honoree}'s baby shower — Guess & Win!`;
    // Web Share API on mobile gets the OS share sheet (iMessage, Mail, etc.).
    // Falls back to clipboard everywhere else (and when the user dismisses).
    if (navigator.share) {
      try {
        await navigator.share({ title: "Guess & Win", text, url });
        return;
      } catch (e) {
        if ((e as Error).name === "AbortError") return;
        // Fall through to clipboard on other errors (e.g. permission policy).
      }
    }
    try {
      await navigator.clipboard.writeText(url);
      toast.success("Game link copied!");
    } catch {
      toast.error("Couldn't copy the link.");
    }
  };

  const handleClear = async () => {
    if (!myPrediction) return;
    const { error } = await supabase
      .from("predictions")
      .delete()
      .eq("id", myPrediction.id);
    if (error) {
      toast.error("Couldn't clear your prediction");
      return;
    }
    toast.success("Prediction cleared");
    resetForm();
    setEditing(false);
    fetchAll();
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
          diff: Math.abs(
            new Date(p.predicted_date!).getTime() - actualDate.getTime()
          ),
        }));
        const minDiff = Math.min(...diffs.map((d) => d.diff));
        dateWinners = diffs.filter((d) => d.diff === minDiff).map((d) => d.p);
      }
    }

    // Exact gender match wins. Skip if host picked "surprise" — there's no
    // truth value to match against.
    const genderWinners =
      actualGender && actualGender !== "surprise"
        ? predictions.filter((p) => p.predicted_gender === actualGender)
        : [];

    // Exact name match (case-insensitive) wins
    const nameWinners = actualName
      ? predictions.filter(
          (p) =>
            p.predicted_name?.trim().toLowerCase() ===
            actualName.trim().toLowerCase()
        )
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
    const actualWeightStr = formatWeight(actualWeightLbs, actualWeightOz);
    if (actualWeightStr) {
      const targetOz = parseWeight(actualWeightStr);
      if (targetOz !== null) {
        const withWeights = predictions
          .map((p) => ({
            p,
            oz: p.predicted_weight ? parseWeight(p.predicted_weight) : null,
          }))
          .filter((x) => x.oz !== null) as { p: Prediction; oz: number }[];
        if (withWeights.length > 0) {
          const diffs = withWeights.map((x) => ({
            p: x.p,
            diff: Math.abs(x.oz - targetOz),
          }));
          const minDiff = Math.min(...diffs.map((d) => d.diff));
          weightWinners = diffs.filter((d) => d.diff === minDiff).map((d) => d.p);
        }
      }
    }

    setCategoryWinners({
      date: dateWinners,
      gender: genderWinners,
      name: nameWinners,
      weight: weightWinners,
    });

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
    addActivity(
      "prediction",
      `Results revealed! ${allWinnerIds.size} winner(s)!`
    );
    toast.success(
      `${allWinnerIds.size} winner(s) across ${[
        dateWinners,
        genderWinners,
        nameWinners,
        weightWinners,
      ].filter((w) => w.length > 0).length} categories!`
    );
    fetchAll();
  };

  if (loading) {
    return (
      <MobileLayout>
        <PageLoader />
      </MobileLayout>
    );
  }

  const winners = predictions.filter((p) => p.is_winner);
  const showSubmittedView = !!myPrediction && !editing;

  // Hero stat chips: live counts that paint a real picture of the game.
  const playedPct =
    guestCount > 0 ? Math.round((predictions.length / guestCount) * 100) : 0;
  const heroChips: { Icon: LucideIcon; label: string }[] = [
    {
      Icon: Sparkles,
      label:
        predictions.length === 0
          ? "Be the first!"
          : `${predictions.length} prediction${predictions.length === 1 ? "" : "s"}`,
    },
    ...(guestCount > 0
      ? [
          {
            Icon: Users,
            label: `${playedPct}% of guests played`,
          },
        ]
      : []),
    {
      Icon: revealed ? PartyPopper : Clock,
      label: revealed ? "Winners revealed" : "Open until birth",
    },
  ];

  return (
    <MobileLayout>
      {confetti && (
        <div className="fixed inset-0 pointer-events-none z-50 flex items-center justify-center">
          <PartyPopper className="h-24 w-24 text-primary animate-bounce" />
        </div>
      )}
      <div className="px-6 pt-8 pb-6">
        <button
          onClick={() => navigate("/")}
          className="flex items-center gap-1 text-sm text-muted-foreground mb-4 hover:text-foreground"
        >
          <ChevronLeft className="h-4 w-4" /> Home
        </button>
        <button
          type="button"
          onClick={() => setGameOpen(true)}
          className="w-full text-left rounded-3xl overflow-hidden bg-card shadow-sm border border-border/50 transition-transform active:scale-[0.99] hover:shadow-md"
        >
          <div className="relative aspect-[4/3] w-full overflow-hidden">
            <img
              src={guessWinHero}
              alt="Guess & Win baby shower game"
              width={1280}
              height={896}
              className="w-full h-full object-cover"
            />
            {/* "NEW" only stays while no one has played — afterward it's lying. */}
            {predictions.length === 0 && (
              <Badge className="absolute bottom-3 left-3 bg-primary text-primary-foreground border-none uppercase tracking-wider text-[10px] font-bold px-3 py-1 rounded-md shadow-md">
                New
              </Badge>
            )}
            {myPrediction && (
              <Badge className="absolute top-3 right-3 bg-mint text-mint-foreground border-none gap-1 text-[10px] font-bold px-2.5 py-1 shadow-md">
                <CheckCircle2 className="h-3 w-3" />
                You played
              </Badge>
            )}
          </div>
          <div className="p-5 space-y-4">
            <div>
              <h1 className="text-2xl font-bold mb-1">Guess &amp; Win</h1>
              <p className="text-sm text-muted-foreground">
                Predict baby's details — win a prize in every category.
              </p>
            </div>
            <div className="flex flex-wrap gap-2">
              {heroChips.map((c, i) => (
                <div
                  key={i}
                  className="flex items-center gap-1.5 bg-muted/60 rounded-full px-3 py-1.5"
                >
                  <c.Icon className="h-3.5 w-3.5 text-primary" />
                  <span className="text-[11px] font-bold uppercase tracking-wide text-foreground/80">
                    {c.label}
                  </span>
                </div>
              ))}
            </div>
            {/* Mini-leaderboard preview — overlapping avatars + first names so
                guests can see at a glance who's already played. */}
            {predictions.length > 0 && (
              <div className="flex items-center gap-2.5">
                <div className="flex -space-x-2">
                  {predictions.slice(0, 4).map((p) => (
                    <div
                      key={p.id}
                      title={p.guest_name}
                      className="w-7 h-7 rounded-full bg-lavender ring-2 ring-background flex items-center justify-center font-bold text-[10px] text-lavender-foreground"
                    >
                      {initialsOf(p.guest_name)}
                    </div>
                  ))}
                </div>
                <p className="text-xs text-muted-foreground truncate flex-1">
                  {predictions
                    .slice(0, 3)
                    .map((p) => p.guest_name.split(" ")[0])
                    .join(", ")}
                  {predictions.length > 3 && ` + ${predictions.length - 3} more`}
                </p>
              </div>
            )}
            <div className="w-full h-12 rounded-full font-bold text-base bg-primary text-primary-foreground flex items-center justify-center">
              {myPrediction ? "View / edit prediction" : "Play Now"}
            </div>
          </div>
        </button>
        {/* Share button lives outside the hero so its click doesn't bubble
            through to the hero's onClick (which opens the sheet). */}
        <Button
          variant="ghost"
          size="sm"
          className="w-full mt-2 gap-1.5 text-muted-foreground hover:text-foreground"
          onClick={handleShareGame}
        >
          <Share2 className="h-3.5 w-3.5" />
          Share game with guests
        </Button>
      </div>

      <Sheet open={gameOpen} onOpenChange={setGameOpen}>
        <SheetContent
          side="bottom"
          className="h-[90vh] overflow-y-auto rounded-t-3xl p-0"
        >
          <SheetHeader className="px-6 pt-6 pb-2">
            <SheetTitle className="flex items-center gap-2 text-left">
              <Sparkles className="h-4 w-4 text-primary" />
              Your Predictions
            </SheetTitle>
          </SheetHeader>
          <div className="px-6 pb-8">
            <Tabs defaultValue={showSubmittedView ? "leaderboard" : "submit"}>
              <TabsList className="w-full mb-4">
                <TabsTrigger value="submit" className="flex-1">
                  {myPrediction ? "Mine" : "Submit"}
                </TabsTrigger>
                <TabsTrigger value="leaderboard" className="flex-1">
                  Leaderboard
                </TabsTrigger>
                <TabsTrigger value="results" className="flex-1">
                  Results
                </TabsTrigger>
              </TabsList>

              <TabsContent value="submit">
                {showSubmittedView ? (
                  // ─── Submitted view: show their prediction with edit/clear
                  <Card className="border-none">
                    <CardContent className="p-4 space-y-4">
                      <div className="flex items-start gap-2">
                        <CheckCircle2 className="h-5 w-5 text-mint-foreground shrink-0 mt-0.5" />
                        <div className="flex-1 min-w-0">
                          <h3 className="font-bold text-sm mb-0.5">
                            You're in, {myPrediction.guest_name.split(" ")[0]}!
                          </h3>
                          <p className="text-xs text-muted-foreground">
                            We saved your guesses. Tap edit to change them
                            anytime before the host reveals.
                          </p>
                        </div>
                      </div>

                      <div className="space-y-2">
                        <PredictionRow
                          Icon={CalendarIcon}
                          label="Due date"
                          value={
                            myPrediction.predicted_date
                              ? new Date(
                                  myPrediction.predicted_date
                                ).toLocaleDateString("en-US", {
                                  month: "long",
                                  day: "numeric",
                                  year: "numeric",
                                })
                              : null
                          }
                        />
                        <PredictionRow
                          Icon={Baby}
                          label="Gender"
                          value={
                            myPrediction.predicted_gender
                              ? GENDER_OPTIONS.find(
                                  (g) =>
                                    g.value === myPrediction.predicted_gender
                                )?.label || myPrediction.predicted_gender
                              : null
                          }
                        />
                        <PredictionRow
                          Icon={Sparkles}
                          label="Name"
                          value={myPrediction.predicted_name}
                        />
                        <PredictionRow
                          Icon={Scale}
                          label="Weight"
                          value={myPrediction.predicted_weight}
                        />
                      </div>

                      <div className="grid grid-cols-2 gap-2 pt-1">
                        <Button
                          variant="outline"
                          className="gap-1.5"
                          onClick={() => setEditing(true)}
                        >
                          <Pencil className="h-3.5 w-3.5" /> Edit
                        </Button>
                        <Button
                          variant="outline"
                          className="gap-1.5 text-destructive hover:text-destructive"
                          onClick={handleClear}
                        >
                          <Trash2 className="h-3.5 w-3.5" /> Clear
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ) : (
                  // ─── Submit form (or edit existing)
                  <Card className="border-none">
                    <CardContent className="p-4 space-y-4">
                      <div>
                        <h3 className="font-bold text-sm mb-1">
                          {myPrediction
                            ? "Edit your prediction"
                            : "Make your prediction"}
                        </h3>
                        <p className="text-xs text-muted-foreground">
                          Win a prize in any category — date, gender, name, or
                          weight.
                        </p>
                      </div>
                      <div className="space-y-1.5">
                        <Label>Your name *</Label>
                        <Input
                          placeholder="e.g. Aunt Susan"
                          value={guestName}
                          onChange={(e) => setGuestName(e.target.value)}
                        />
                      </div>
                      <div className="space-y-1.5">
                        <Label>Predicted due date</Label>
                        <Popover>
                          <PopoverTrigger asChild>
                            <Button
                              variant="outline"
                              className={cn(
                                "w-full justify-start text-left font-normal",
                                !predictedDate && "text-muted-foreground"
                              )}
                            >
                              <CalendarIcon className="mr-2 h-4 w-4" />
                              {predictedDate
                                ? format(predictedDate, "PPP")
                                : "Pick a date"}
                            </Button>
                          </PopoverTrigger>
                          <PopoverContent className="w-auto p-0" align="start">
                            <Calendar
                              mode="single"
                              selected={predictedDate}
                              onSelect={setPredictedDate}
                              initialFocus
                              className="p-3 pointer-events-auto"
                            />
                          </PopoverContent>
                        </Popover>
                      </div>
                      <div className="space-y-1.5">
                        <Label>Gender prediction</Label>
                        <RadioGroup
                          value={predictedGender}
                          onValueChange={(v) => setPredictedGender(v as Gender)}
                          className="grid grid-cols-3 gap-2"
                        >
                          {GENDER_OPTIONS.map((opt) => (
                            <Label
                              key={opt.value}
                              htmlFor={`gender-${opt.value}`}
                              className={cn(
                                "flex items-center gap-1.5 p-2.5 rounded-xl border-2 cursor-pointer transition-all justify-center",
                                predictedGender === opt.value
                                  ? `border-primary ${opt.tone}`
                                  : "border-border"
                              )}
                            >
                              <RadioGroupItem
                                value={opt.value}
                                id={`gender-${opt.value}`}
                                className="sr-only"
                              />
                              {opt.value === "surprise" ? (
                                <Sparkles className="h-3.5 w-3.5" />
                              ) : (
                                <Baby className="h-3.5 w-3.5" />
                              )}
                              <span className="text-xs font-medium">{opt.label}</span>
                            </Label>
                          ))}
                        </RadioGroup>
                      </div>
                      <div className="grid grid-cols-2 gap-3">
                        <div className="space-y-1.5">
                          <Label>Baby name guess</Label>
                          <Input
                            placeholder="e.g. Luna"
                            value={predictedName}
                            onChange={(e) => setPredictedName(e.target.value)}
                          />
                        </div>
                        <div className="space-y-1.5">
                          <Label>Weight guess</Label>
                          {/* Split inputs avoid the parse failures we saw with
                              free-text weights ("7lbs4oz", "7.5", etc.). */}
                          <div className="flex items-center gap-1.5">
                            <Input
                              type="number"
                              inputMode="numeric"
                              min="0"
                              max="20"
                              step="1"
                              placeholder="lbs"
                              value={predictedWeightLbs}
                              onChange={(e) => setPredictedWeightLbs(e.target.value)}
                              aria-label="Predicted pounds"
                            />
                            <span className="text-xs text-muted-foreground">lbs</span>
                            <Input
                              type="number"
                              inputMode="numeric"
                              min="0"
                              max="15"
                              step="1"
                              placeholder="oz"
                              value={predictedWeightOz}
                              onChange={(e) => setPredictedWeightOz(e.target.value)}
                              aria-label="Predicted ounces"
                            />
                            <span className="text-xs text-muted-foreground">oz</span>
                          </div>
                        </div>
                      </div>
                      <div className="flex gap-2">
                        {myPrediction && (
                          <Button
                            variant="outline"
                            className="flex-1"
                            onClick={() => setEditing(false)}
                          >
                            Cancel
                          </Button>
                        )}
                        <Button
                          className="flex-1 gap-2"
                          onClick={handleSubmit}
                          disabled={!guestName.trim() || submitting}
                        >
                          <Send className="h-4 w-4" />
                          {submitting
                            ? "Saving..."
                            : myPrediction
                            ? "Save changes"
                            : "Submit prediction"}
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                )}
              </TabsContent>

              <TabsContent value="leaderboard">
                <div className="space-y-3">
                  {predictions.length === 0 ? (
                    <p className="text-sm text-muted-foreground text-center py-8">
                      No predictions yet — be the first!
                    </p>
                  ) : (
                    predictions.map((p, i) => (
                      <Card
                        key={p.id}
                        className={cn("border-none", p.is_winner && "ring-2 ring-primary")}
                      >
                        <CardContent className="p-4 flex items-start gap-3">
                          <div
                            className={cn(
                              "w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm shrink-0",
                              p.is_winner
                                ? "bg-primary text-primary-foreground"
                                : i < 3
                                ? "bg-primary/20 text-primary"
                                : "bg-muted text-muted-foreground"
                            )}
                          >
                            {p.is_winner ? (
                              <Trophy className="h-4 w-4" />
                            ) : i < 3 ? (
                              <Trophy className="h-4 w-4" />
                            ) : (
                              i + 1
                            )}
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2">
                              <p className="font-semibold text-sm">{p.guest_name}</p>
                              {p.is_winner && (
                                <Badge className="bg-primary text-primary-foreground text-[10px] border-none gap-0.5">
                                  <Trophy className="h-3 w-3" /> Winner
                                </Badge>
                              )}
                            </div>
                            <div className="flex flex-wrap gap-1.5 mt-1">
                              {p.predicted_date && (
                                <Badge
                                  variant="secondary"
                                  className="text-[10px] gap-0.5"
                                >
                                  <CalendarIcon className="h-2.5 w-2.5" />
                                  {new Date(p.predicted_date).toLocaleDateString()}
                                </Badge>
                              )}
                              {p.predicted_gender && (
                                <Badge
                                  variant="secondary"
                                  className="text-[10px] gap-0.5"
                                >
                                  {p.predicted_gender === "surprise" ? (
                                    <Sparkles className="h-2.5 w-2.5" />
                                  ) : (
                                    <Baby className="h-2.5 w-2.5" />
                                  )}
                                  {p.predicted_gender}
                                </Badge>
                              )}
                              {p.predicted_name && (
                                <Badge
                                  variant="secondary"
                                  className="text-[10px] gap-0.5"
                                >
                                  <Sparkles className="h-2.5 w-2.5" />
                                  {p.predicted_name}
                                </Badge>
                              )}
                              {p.predicted_weight && (
                                <Badge
                                  variant="secondary"
                                  className="text-[10px] gap-0.5"
                                >
                                  <Scale className="h-2.5 w-2.5" />
                                  {p.predicted_weight}
                                </Badge>
                              )}
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
                  (() => {
                    // Per-category breakdown is only populated for the
                    // session that triggered the reveal (it lives in local
                    // state). On reload we fall back to the persisted
                    // `is_winner` flag, listing every winner with their
                    // predictions so this tab always shows real content
                    // instead of just an empty celebration banner.
                    const categories = [
                      {
                        key: "date",
                        label: "Closest Due Date",
                        Icon: CalendarIcon,
                        winners: categoryWinners.date,
                        getValue: (p: Prediction) =>
                          p.predicted_date
                            ? new Date(p.predicted_date).toLocaleDateString()
                            : "",
                      },
                      {
                        key: "gender",
                        label: "Gender Guess",
                        Icon: Baby,
                        winners: categoryWinners.gender,
                        getValue: (p: Prediction) => p.predicted_gender || "",
                      },
                      {
                        key: "name",
                        label: "Name Guess",
                        Icon: Sparkles,
                        winners: categoryWinners.name,
                        getValue: (p: Prediction) => p.predicted_name || "",
                      },
                      {
                        key: "weight",
                        label: "Closest Weight",
                        Icon: Scale,
                        winners: categoryWinners.weight,
                        getValue: (p: Prediction) => p.predicted_weight || "",
                      },
                    ] as const;
                    const hasBreakdown = categories.some(
                      (c) => c.winners.length > 0
                    );
                    const winnerWord = winners.length === 1 ? "winner" : "winners";
                    return (
                      <div className="space-y-4">
                        <Card className="border-none bg-gradient-to-br from-primary/20 via-background to-primary/10">
                          <CardContent className="p-6 text-center">
                            <PartyPopper className="h-10 w-10 text-primary mx-auto mb-2" />
                            <h3 className="text-lg font-bold mb-1">
                              {winners.length} {winnerWord}!
                            </h3>
                            <p className="text-sm text-muted-foreground">
                              {hasBreakdown
                                ? "Here's who guessed closest in each category."
                                : "Congrats to everyone who nailed it."}
                            </p>
                          </CardContent>
                        </Card>

                        {hasBreakdown
                          ? categories
                              .filter((cat) => cat.winners.length > 0)
                              .map((cat) => (
                                <Card key={cat.key} className="border-none">
                                  <CardContent className="p-4">
                                    <div className="flex items-center gap-2 mb-3">
                                      <cat.Icon className="h-4 w-4 text-primary" />
                                      <h4 className="font-bold text-sm">
                                        {cat.label}
                                      </h4>
                                      <Badge className="bg-primary text-primary-foreground text-[10px] border-none ml-auto gap-0.5">
                                        <Trophy className="h-2.5 w-2.5" />
                                        {cat.winners.length} winner
                                        {cat.winners.length > 1 ? "s" : ""}
                                      </Badge>
                                    </div>
                                    <div className="space-y-2">
                                      {cat.winners.map((w) => (
                                        <div
                                          key={w.id}
                                          className="bg-primary/5 rounded-xl p-3 flex items-center justify-between"
                                        >
                                          <p className="font-semibold text-sm text-primary">
                                            {w.guest_name}
                                          </p>
                                          <Badge
                                            variant="secondary"
                                            className="text-[10px]"
                                          >
                                            {cat.getValue(w)}
                                          </Badge>
                                        </div>
                                      ))}
                                    </div>
                                  </CardContent>
                                </Card>
                              ))
                          : winners.map((w) => (
                              // Reload fallback: show each winner with their
                              // predictions as badges. No per-category info
                              // (we don't persist it), but at least it's not
                              // an empty page.
                              <Card key={w.id} className="border-none">
                                <CardContent className="p-4">
                                  <div className="flex items-center gap-2 mb-2">
                                    <Trophy className="h-4 w-4 text-primary" />
                                    <h4 className="font-bold text-sm flex-1 truncate">
                                      {w.guest_name}
                                    </h4>
                                    <Badge className="bg-primary text-primary-foreground text-[10px] border-none">
                                      Winner
                                    </Badge>
                                  </div>
                                  <div className="flex flex-wrap gap-1.5">
                                    {w.predicted_date && (
                                      <Badge
                                        variant="secondary"
                                        className="text-[10px] gap-0.5"
                                      >
                                        <CalendarIcon className="h-2.5 w-2.5" />
                                        {new Date(
                                          w.predicted_date
                                        ).toLocaleDateString()}
                                      </Badge>
                                    )}
                                    {w.predicted_gender && (
                                      <Badge
                                        variant="secondary"
                                        className="text-[10px] gap-0.5"
                                      >
                                        {w.predicted_gender === "surprise" ? (
                                          <Sparkles className="h-2.5 w-2.5" />
                                        ) : (
                                          <Baby className="h-2.5 w-2.5" />
                                        )}
                                        {w.predicted_gender}
                                      </Badge>
                                    )}
                                    {w.predicted_name && (
                                      <Badge
                                        variant="secondary"
                                        className="text-[10px] gap-0.5"
                                      >
                                        <Sparkles className="h-2.5 w-2.5" />
                                        {w.predicted_name}
                                      </Badge>
                                    )}
                                    {w.predicted_weight && (
                                      <Badge
                                        variant="secondary"
                                        className="text-[10px] gap-0.5"
                                      >
                                        <Scale className="h-2.5 w-2.5" />
                                        {w.predicted_weight}
                                      </Badge>
                                    )}
                                  </div>
                                </CardContent>
                              </Card>
                            ))}
                      </div>
                    );
                  })()
                ) : canHost ? (
                  <Card className="border-none">
                    <CardContent className="p-4 space-y-4">
                      <div>
                        <h3 className="font-bold text-sm mb-1">
                          Host controls — enter actual results
                        </h3>
                        <p className="text-xs text-muted-foreground">
                          Fill in the real details and reveal the winners.
                        </p>
                      </div>
                      <div className="space-y-1.5">
                        <Label>Actual birth date</Label>
                        <Popover>
                          <PopoverTrigger asChild>
                            <Button
                              variant="outline"
                              className={cn(
                                "w-full justify-start text-left font-normal",
                                !actualDate && "text-muted-foreground"
                              )}
                            >
                              <CalendarIcon className="mr-2 h-4 w-4" />
                              {actualDate ? format(actualDate, "PPP") : "Pick a date"}
                            </Button>
                          </PopoverTrigger>
                          <PopoverContent className="w-auto p-0" align="start">
                            <Calendar
                              mode="single"
                              selected={actualDate}
                              onSelect={setActualDate}
                              initialFocus
                              className="p-3 pointer-events-auto"
                            />
                          </PopoverContent>
                        </Popover>
                      </div>
                      <div className="space-y-1.5">
                        <Label>Actual gender</Label>
                        <RadioGroup
                          value={actualGender}
                          onValueChange={(v) => setActualGender(v as Gender)}
                          className="grid grid-cols-2 gap-2"
                        >
                          {GENDER_OPTIONS.filter((g) => g.value !== "surprise").map(
                            (opt) => (
                              <Label
                                key={opt.value}
                                htmlFor={`actual-${opt.value}`}
                                className={cn(
                                  "flex items-center gap-1.5 p-2.5 rounded-xl border-2 cursor-pointer transition-all justify-center",
                                  actualGender === opt.value
                                    ? `border-primary ${opt.tone}`
                                    : "border-border"
                                )}
                              >
                                <RadioGroupItem
                                  value={opt.value}
                                  id={`actual-${opt.value}`}
                                  className="sr-only"
                                />
                                <Baby className="h-3.5 w-3.5" />
                                <span className="text-xs font-medium">{opt.label}</span>
                              </Label>
                            )
                          )}
                        </RadioGroup>
                      </div>
                      <div className="grid grid-cols-2 gap-3">
                        <div className="space-y-1.5">
                          <Label>Baby's name</Label>
                          <Input
                            placeholder="e.g. Luna"
                            value={actualName}
                            onChange={(e) => setActualName(e.target.value)}
                          />
                        </div>
                        <div className="space-y-1.5">
                          <Label>Birth weight</Label>
                          <div className="flex items-center gap-1.5">
                            <Input
                              type="number"
                              inputMode="numeric"
                              min="0"
                              max="20"
                              step="1"
                              placeholder="lbs"
                              value={actualWeightLbs}
                              onChange={(e) => setActualWeightLbs(e.target.value)}
                              aria-label="Actual pounds"
                            />
                            <span className="text-xs text-muted-foreground">lbs</span>
                            <Input
                              type="number"
                              inputMode="numeric"
                              min="0"
                              max="15"
                              step="1"
                              placeholder="oz"
                              value={actualWeightOz}
                              onChange={(e) => setActualWeightOz(e.target.value)}
                              aria-label="Actual ounces"
                            />
                            <span className="text-xs text-muted-foreground">oz</span>
                          </div>
                        </div>
                      </div>
                      <Button
                        className="w-full gap-2"
                        onClick={handleReveal}
                        disabled={predictions.length === 0 || revealing}
                      >
                        <PartyPopper className="h-4 w-4" />
                        {revealing ? "Calculating..." : "Reveal winners"}
                      </Button>
                      {predictions.length === 0 && (
                        <p className="text-xs text-muted-foreground text-center">
                          No predictions to judge yet.
                        </p>
                      )}
                    </CardContent>
                  </Card>
                ) : (
                  <Card className="border-none">
                    <CardContent className="p-6 text-center space-y-3">
                      <Clock className="h-8 w-8 text-primary mx-auto" />
                      <div>
                        <h3 className="font-bold text-sm">Results coming soon</h3>
                        <p className="text-xs text-muted-foreground mt-1">
                          The host will reveal the winners once the baby arrives.
                        </p>
                      </div>
                      {predictions.length > 0 ? (
                        <div className="pt-2 space-y-2">
                          {/* Show who's played to keep the page feeling alive
                              even pre-reveal. */}
                          <div className="flex justify-center -space-x-2">
                            {predictions.slice(0, 6).map((p) => (
                              <div
                                key={p.id}
                                title={p.guest_name}
                                className="w-8 h-8 rounded-full bg-lavender ring-2 ring-background flex items-center justify-center font-bold text-[11px] text-lavender-foreground"
                              >
                                {initialsOf(p.guest_name)}
                              </div>
                            ))}
                          </div>
                          <p className="text-[11px] text-muted-foreground">
                            {predictions.length} prediction
                            {predictions.length === 1 ? "" : "s"} in
                            {guestCount > 0
                              ? ` · ${Math.round((predictions.length / guestCount) * 100)}% of guests played`
                              : ""}
                          </p>
                        </div>
                      ) : (
                        <p className="text-[11px] text-muted-foreground italic pt-1">
                          No predictions yet.
                        </p>
                      )}
                    </CardContent>
                  </Card>
                )}
              </TabsContent>
            </Tabs>
          </div>
        </SheetContent>
      </Sheet>
    </MobileLayout>
  );
};

const PredictionRow = ({
  Icon,
  label,
  value,
}: {
  Icon: LucideIcon;
  label: string;
  value: string | null;
}) => (
  <div className="flex items-center gap-3 py-1.5 border-b border-border/40 last:border-b-0">
    <Icon className="h-4 w-4 text-muted-foreground shrink-0" />
    <span className="text-xs text-muted-foreground w-20 shrink-0">{label}</span>
    <span className="text-sm font-medium flex-1 truncate">
      {value || <span className="text-muted-foreground italic">—</span>}
    </span>
  </div>
);

export default PredictionsPage;
